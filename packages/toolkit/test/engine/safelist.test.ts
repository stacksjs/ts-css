/**
 * `safelist` took string literals only and rejected a pattern outright, while
 * `blocklist` -- on the same config object, in adjacent code -- compiled `*`
 * globs. So a family of classes driven by runtime data had to be written as
 * dozens of literals and maintained by hand.
 *
 * The two sides are not symmetrical to fix. A blocklist pattern FILTERS names
 * the scanner already found; a safelist pattern has to PRODUCE names nothing
 * in the source mentions, and a regular expression cannot be run backwards
 * into the names that would match it. So the two forms do different jobs:
 * braces produce, a pattern filters what is already in play.
 */
import { describe, expect, it } from 'bun:test'
import { expandBraces, resolveSafelist } from '../../src/engine/safelist'

describe('Safelist resolution', () => {
  describe('brace expansion', () => {
    it('should leave a plain class alone', () => {
      expect(expandBraces('rotate-180')).toEqual(['rotate-180'])
    })

    /** The case this exists for: one entry instead of forty-eight. */
    it('should expand groups combinatorially', () => {
      const family = expandBraces('{bg,text,border}-{emerald,amber,red,blue}-{50,200,700,800}')
      expect(family).toHaveLength(48)
      expect(family).toContain('bg-emerald-50')
      expect(family).toContain('border-blue-800')
      expect(new Set(family).size).toBe(48)
    })

    /**
     * An arbitrary value is square-bracketed, not braced, so it passes
     * through untouched -- `max-w-[22rem]` must stay exactly itself.
     */
    it('should not touch an arbitrary value', () => {
      expect(expandBraces('max-w-[22rem]')).toEqual(['max-w-[22rem]'])
      expect(expandBraces('z-[100]')).toEqual(['z-[100]'])
    })

    it('should not treat a single alternative as a group', () => {
      expect(expandBraces('grid-cols-{3}')).toEqual(['grid-cols-{3}'])
      expect(expandBraces('p-{}')).toEqual(['p-{}'])
    })

    it('should leave an unclosed brace alone', () => {
      expect(expandBraces('p-{1,2')).toEqual(['p-{1,2'])
    })
  })

  describe('entries', () => {
    it('should keep literals, as before', () => {
      const resolved = resolveSafelist(['rotate-180', 'flex-col-reverse'])
      expect([...resolved].sort()).toEqual(['flex-col-reverse', 'rotate-180'])
    })

    it('should resolve a brace entry to its family', () => {
      const resolved = resolveSafelist(['{bg,text}-{red,blue}-500'])
      expect([...resolved].sort()).toEqual(['bg-blue-500', 'bg-red-500', 'text-blue-500', 'text-red-500'])
    })

    /** A pattern may select from a family the braces produced. */
    it('should match a pattern against brace expansions', () => {
      const resolved = resolveSafelist([
        '{bg,text,border}-{emerald,red}-{50,700}',
        { pattern: /^bg-emerald-\d+$/ },
      ])
      expect(resolved.has('bg-emerald-50')).toBe(true)
      expect(resolved.has('bg-emerald-700')).toBe(true)
    })

    /**
     * And against what the scanner found, which keeps a class used somewhere
     * in a project present in every output.
     */
    it('should match a pattern against scanned classes', () => {
      const resolved = resolveSafelist([/^grid-cols-\d+$/], new Set(['grid-cols-3', 'grid-cols-12', 'p-4']))
      expect([...resolved].sort()).toEqual(['grid-cols-12', 'grid-cols-3'])
    })

    it('should apply variants to each match, keeping the bare class', () => {
      const resolved = resolveSafelist([
        '{bg,text}-red-500',
        { pattern: /^bg-red-500$/, variants: ['dark', 'hover'] },
      ])
      expect(resolved.has('bg-red-500')).toBe(true)
      expect(resolved.has('dark:bg-red-500')).toBe(true)
      expect(resolved.has('hover:bg-red-500')).toBe(true)
    })

    /**
     * A /g regex carries lastIndex between calls, so without resetting it the
     * result would depend on the order the pool happened to be in -- it would
     * match every other candidate.
     */
    it('should not let a global pattern skip candidates', () => {
      const resolved = resolveSafelist([/^p-\d$/g], new Set(['p-1', 'p-2', 'p-3', 'p-4']))
      expect([...resolved].sort()).toEqual(['p-1', 'p-2', 'p-3', 'p-4'])
    })

    it('should accept a bare RegExp as well as the object form', () => {
      const bare = resolveSafelist([/^p-1$/], new Set(['p-1', 'p-2']))
      const object = resolveSafelist([{ pattern: /^p-1$/ }], new Set(['p-1', 'p-2']))
      expect([...bare]).toEqual(['p-1'])
      expect([...object]).toEqual(['p-1'])
    })

    it('should resolve an empty safelist to nothing', () => {
      expect(resolveSafelist([]).size).toBe(0)
      expect(resolveSafelist([], new Set(['p-4'])).size).toBe(0)
    })
  })
})
