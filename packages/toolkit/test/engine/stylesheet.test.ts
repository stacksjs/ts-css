/**
 * Authored stylesheets: `@apply` and `theme()`.
 *
 * The engine only scanned markup for class names, so hand-written component
 * CSS had nowhere to live but a `preflights` string or a framework `<style>`
 * block, neither of which it reads. An `@apply` in one shipped to the browser
 * as an unknown at-rule and was dropped without a word.
 *
 * Expansion is driven from the real generator rather than a second
 * implementation, so a utility becomes exactly the declarations it would have
 * emitted on its own.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { containsApply, expandApply, processStylesheet, resolveThemeCalls } from '../../src/engine/stylesheet'

const gen = () => new CSSGenerator(defaultConfig)

describe('Authored stylesheets', () => {
  describe('@apply', () => {
    it('should expand a utility where it was written', () => {
      const { css } = expandApply('.btn {\n  @apply inline-flex rounded-lg;\n}', gen())
      expect(css).toContain('display: inline-flex;')
      expect(css).toContain('border-radius: 0.5rem;')
      expect(css).not.toContain('@apply')
    })

    /** A one-line block is ordinary authored CSS and must not be skipped. */
    it('should expand inside a single-line block', () => {
      const { css } = expandApply('.btn:focus { @apply underline; }', gen())
      expect(css).toContain('text-decoration-line: underline;')
      expect(css).not.toContain('@apply')
    })

    it('should keep the declarations aligned with the block', () => {
      const { css } = expandApply('.btn {\n  @apply inline-flex items-center;\n}', gen())
      expect(css).toContain('  display: inline-flex;\n  align-items: center;')
    })

    /**
     * A variant carries a selector of its own, so it cannot sit in the
     * author's block -- `.btn` would get the hover declarations unconditionally.
     */
    it('should give a variant its own rule on the host selector', () => {
      const { css } = expandApply('.btn {\n  @apply hover:underline;\n}', gen())
      expect(css).toMatch(/\.btn:hover \{[\s\S]*text-decoration-line: underline;/)
    })

    it('should wrap a responsive utility in its media query', () => {
      const { css } = expandApply('.card {\n  @apply md:p-4;\n}', gen())
      expect(css).toMatch(/@media \(min-width: 768px\) \{[\s\S]*\.card \{[\s\S]*padding: 1rem;/)
    })

    it('should report a utility it cannot generate', () => {
      const { css, unknown } = expandApply('.oops { @apply not-a-utility; }', gen())
      expect(unknown).toEqual(['not-a-utility'])
      expect(css).not.toContain('@apply')
    })

    /**
     * A nested block's real selector includes its ancestors', which only the
     * browser resolves. Plain declarations are unaffected; a variant would
     * need `.card .title:hover` and `.title:hover` would be the wrong rule,
     * so it is reported rather than quietly misplaced.
     */
    it('should expand plain declarations inside a nested block', () => {
      const { css, unknown } = expandApply('.card {\n  .title { @apply font-bold; }\n}', gen())
      expect(css).toContain('font-weight: 700;')
      expect(unknown).toEqual([])
    })

    it('should refuse to misplace a variant from a nested block', () => {
      const { unknown } = expandApply('.card {\n  .title { @apply hover:underline; }\n}', gen())
      expect(unknown).toEqual(['hover:underline'])
    })

    it('should leave a sheet with no @apply untouched', () => {
      const input = '.btn {\n  color: red;\n}'
      expect(expandApply(input, gen()).css).toBe(input)
    })
  })

  describe('theme()', () => {
    it('should resolve a colour', () => {
      const { css } = resolveThemeCalls('a { color: theme(\'colors.slate.200\'); }', defaultConfig.theme)
      expect(css).toContain('oklch(92.9% 0.013 255.508)')
    })

    it('should accept an unquoted path', () => {
      const { css } = resolveThemeCalls('a { gap: theme(spacing.2); }', defaultConfig.theme)
      expect(css).toContain('gap: 0.5rem;')
    })

    /** fontSize is a [size, { lineHeight }] pair; the size is what is meant. */
    it('should resolve a font size to its size', () => {
      const { css } = resolveThemeCalls('a { font-size: theme(fontSize.lg); }', defaultConfig.theme)
      expect(css).toMatch(/font-size: [\d.]+rem;/)
    })

    it('should report a path that resolves to nothing, leaving it as written', () => {
      const { css, unknown } = resolveThemeCalls('a { color: theme(colors.nope.500); }', defaultConfig.theme)
      expect(unknown).toEqual(['colors.nope.500'])
      expect(css).toContain('theme(colors.nope.500)')
    })
  })

  describe('processStylesheet', () => {
    it('should run both passes and report both kinds of miss', () => {
      const result = processStylesheet(
        '.btn {\n  @apply rounded-lg nope;\n  gap: theme(spacing.2);\n  color: theme(colors.nope.1);\n}',
        gen(),
        defaultConfig.theme,
      )
      expect(result.css).toContain('border-radius: 0.5rem;')
      expect(result.css).toContain('gap: 0.5rem;')
      expect(result.unknownUtilities).toEqual(['nope'])
      expect(result.unknownThemePaths).toEqual(['colors.nope.1'])
    })
  })

  describe('containsApply', () => {
    it('should spot an @apply that would ship verbatim', () => {
      expect(containsApply('.a { @apply underline; }')).toBe(true)
      expect(containsApply('.a { color: red; }')).toBe(false)
    })
  })
})
