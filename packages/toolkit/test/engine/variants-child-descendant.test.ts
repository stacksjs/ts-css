import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Child and descendant variants', () => {
  describe('* (direct children)', () => {
    it('should wrap the class selector in :is(… > *)', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('*:p-2')
      const css = gen.toCSS(false, true)
      expect(css).toBe(':is(.\\*\\:p-2 > *){padding:0.5rem}')
    })

    it('should apply to any utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('*:underline')
      const css = gen.toCSS(false)
      expect(css).toContain(':is(.\\*\\:underline > *)')
      expect(css).toContain('text-decoration-line: underline;')
    })
  })

  describe('** (all descendants)', () => {
    it('should wrap the class selector in :is(… *)', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('**:p-2')
      const css = gen.toCSS(false, true)
      expect(css).toBe(':is(.\\*\\*\\:p-2 *){padding:0.5rem}')
    })

    it('should use a descendant combinator rather than a child one', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('**:underline')
      const css = gen.toCSS(false)
      expect(css).toContain(':is(.\\*\\*\\:underline *)')
      expect(css).not.toContain('> *')
    })
  })

  describe('stacking', () => {
    it('should combine with a state variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:*:underline')
      const css = gen.toCSS(false)
      // The state applies to the parent, the utility to its children.
      expect(css).toContain(':is(.hover\\:\\*\\:underline:hover > *)')
    })

    it('should combine with a breakpoint', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:*:p-2')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain('> *)')
    })

    it('should keep a pseudo-element outside the wrapper', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('*:before:block')
      const css = gen.toCSS(false)
      expect(css).toContain('> *)::before')
    })

    it('should support important', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('*:!p-2')
      const css = gen.toCSS(false)
      expect(css).toContain('> *)')
      expect(css).toContain('!important')
    })
  })

  describe('specificity', () => {
    it('should wrap in :is() so a child utility is not outranked', () => {
      // :is() takes the specificity of its most specific argument, so the
      // emitted rule stays at the (0,1,0) a plain utility class has. A bare
      // `.cls > *` would read the same here, but `:is()` is what Tailwind
      // emits and it keeps the rule composable with the rest of the sheet.
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('*:p-2')
      const css = gen.toCSS(false)
      expect(css.startsWith(':is(')).toBe(true)
    })
  })
})
