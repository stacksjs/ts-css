import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Functional not-* variants', () => {
  describe('the eight that used to be a fixed table', () => {
    // These were hardcoded entries. They are now derived from the inner
    // variant's own selector, so this block is the regression guard that the
    // derivation reproduces every one of them exactly.
    const cases: [string, string][] = [
      ['not-first:mt-4', ':not(:first-child)'],
      ['not-last:pb-2', ':not(:last-child)'],
      ['not-only:flex', ':not(:only-child)'],
      ['not-empty:flex', ':not(:empty)'],
      ['not-disabled:flex', ':not(:disabled)'],
      ['not-checked:flex', ':not(:checked)'],
      ['not-first-of-type:flex', ':not(:first-of-type)'],
      ['not-last-of-type:flex', ':not(:last-of-type)'],
    ]

    for (const [className, selector] of cases) {
      it(`should still resolve ${className}`, () => {
        expect(css(className)).toContain(selector)
      })
    }
  })

  describe('negating a selector variant', () => {
    const cases: [string, string][] = [
      ['not-focus:flex', ':not(:focus)'],
      ['not-hover:opacity-50', ':not(:hover)'],
      ['not-open:flex', ':not([open])'],
      ['not-in-range:flex', ':not(:in-range)'],
      ['not-nth-3:flex', ':not(:nth-child(3))'],
      ['not-has-[a]:flex', ':not(:has(a))'],
      ['not-aria-expanded:flex', ':not([aria-expanded="true"])'],
      ['not-data-open:flex', ':not([data-open])'],
      ['not-[.card]:flex', ':not(:is(.card))'],
    ]

    for (const [className, selector] of cases) {
      it(`should resolve ${className}`, () => {
        expect(css(className)).toContain(selector)
      })
    }

    it('should carry the descendant combinator inside the negation for not-in-*', () => {
      // `not-in-focus` means "not a descendant of a focused element", so the
      // combinator has to live inside :not() rather than becoming a prefix.
      expect(css('not-in-focus:flex')).toContain(':not(:where(:focus) *)')
    })
  })

  describe('negating an at-rule variant', () => {
    const cases: [string, string][] = [
      ['not-md:flex', '@media not (min-width: 768px)'],
      ['not-print:block', '@media not print'],
      ['not-motion-reduce:flex', '@media not (prefers-reduced-motion: reduce)'],
      ['not-portrait:flex', '@media not (orientation: portrait)'],
      ['not-forced-colors:flex', '@media not (forced-colors: active)'],
      ['not-pointer-coarse:flex', '@media not (pointer: coarse)'],
      ['not-noscript:flex', '@media not (scripting: none)'],
      ['not-supports-[display:grid]:block', '@supports not (display: grid)'],
    ]

    for (const [className, atRule] of cases) {
      it(`should resolve ${className}`, () => {
        expect(css(className)).toContain(atRule)
      })
    }

    it('should negate the condition rather than the selector', () => {
      // not-md must not emit `.not-md\:flex:not(…)` — the negation belongs in
      // the query, otherwise the utility applies at every width.
      const out = css('not-md:flex')
      expect(out).toContain('@media not (min-width: 768px)')
      expect(out).not.toContain(':not(')
    })
  })

  describe('rejection', () => {
    it('should reject a pseudo-element, which :not() cannot take', () => {
      expect(css('not-before:flex')).toBe('')
    })

    it('should generate nothing for an unknown inner variant', () => {
      // A typo must not become an always-on utility.
      expect(css('not-bogus:flex')).toBe('')
    })

    it('should generate nothing for an empty arbitrary selector', () => {
      expect(css('not-[]:flex')).toBe('')
    })
  })

  describe('stacking', () => {
    it('should combine a negated selector with a breakpoint', () => {
      const out = css('md:not-first:mt-4')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain(':not(:first-child)')
    })

    it('should combine a negated query with a state variant', () => {
      const out = css('not-md:hover:underline')
      expect(out).toContain('@media not (min-width: 768px)')
      expect(out).toContain(':hover')
    })
  })
})
