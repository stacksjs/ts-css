import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Pseudo-element Variants', () => {
  describe('before and after', () => {
    it('should generate before variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('before:content-[""]')
      const css = gen.toCSS(false)
      expect(css).toContain('::before')
    })

    it('should generate after variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('after:content-[""]')
      const css = gen.toCSS(false)
      expect(css).toContain('::after')
    })

    it('should generate before with block display', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('before:block')
      const css = gen.toCSS(false)
      expect(css).toContain('::before')
      expect(css).toContain('display: block;')
    })

    it('should handle responsive + hover + pseudo-element', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:hover:before:block')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':hover')
      expect(css).toContain('::before')
      expect(css).toContain('display: block;')
    })

    it('should handle before with important', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('!before:block')
      const css = gen.toCSS(false)
      expect(css).toContain('::before')
      expect(css).toContain('!important')
    })
  })
})

describe('Pseudo-element Variants (text and overlay)', () => {
  // These four are plain Tailwind v4 pseudo-elements that previously had no
  // entry in VARIANT_SELECTORS, so `first-letter:text-3xl` and friends were
  // dropped as unhandled variants and emitted nothing at all.
  const cases: [string, string, string][] = [
    ['first-letter:text-3xl', '::first-letter', 'font-size'],
    ['first-line:uppercase', '::first-line', 'text-transform: uppercase;'],
    ['backdrop:bg-black', '::backdrop', 'background-color'],
    ['details-content:p-4', '::details-content', 'padding'],
  ]

  for (const [className, pseudo, declaration] of cases) {
    it(`should generate ${className}`, () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate(className)
      const css = gen.toCSS(false)
      expect(css).toContain(pseudo)
      expect(css).toContain(declaration)
    })
  }

  it('should keep the pseudo-element last when stacked with a state variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('hover:first-letter:underline')
    const css = gen.toCSS(false)
    expect(css).toContain(':hover::first-letter')
  })

  it('should combine a breakpoint with first-line', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:first-line:uppercase')
    const css = gen.toCSS(false)
    expect(css).toContain('@media (min-width: 768px)')
    expect(css).toContain('::first-line')
  })

  it('should support important on backdrop', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('backdrop:!bg-black')
    const css = gen.toCSS(false)
    expect(css).toContain('::backdrop')
    expect(css).toContain('!important')
  })
})
