import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Positional Variants', () => {
  it('should generate first variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('first:bg-gray-500')
    const css = gen.toCSS(false)
    expect(css).toContain(':first-child')
    expect(css).toContain('background-color: oklch(55.1% 0.027 264.364);')
  })

  it('should generate last variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('last:border-gray-300')
    const css = gen.toCSS(false)
    expect(css).toContain(':last-child')
  })

  it('should generate odd variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('odd:bg-gray-50')
    const css = gen.toCSS(false)
    expect(css).toContain(':nth-child(odd)')
    expect(css).toContain('background-color: oklch(98.5% 0.002 247.839);')
  })

  it('should generate even variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('even:bg-gray-100')
    const css = gen.toCSS(false)
    expect(css).toContain(':nth-child(even)')
    expect(css).toContain('background-color: oklch(96.7% 0.003 264.542);')
  })

  it('should generate first-of-type variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('first-of-type:mt-0')
    const css = gen.toCSS(false)
    expect(css).toContain(':first-of-type')
  })

  it('should generate last-of-type variant', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('last-of-type:mb-0')
    const css = gen.toCSS(false)
    expect(css).toContain(':last-of-type')
  })

  it('should handle all positional variants', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('first:last:odd:even:bg-red-500')
    const css = gen.toCSS(false)
    expect(css).toContain(':first-child')
    expect(css).toContain(':last-child')
  })
})

describe('Functional nth-* variants', () => {
  describe('accepted arguments', () => {
    const cases: [string, string][] = [
      ['nth-3:flex', ':nth-child(3)'],
      ['nth-0:flex', ':nth-child(0)'],
      ['nth-[3n+1]:flex', ':nth-child(3n+1)'],
      ['nth-[odd]:flex', ':nth-child(odd)'],
      ['nth-[-n+3]:flex', ':nth-child(-n+3)'],
      ['nth-last-3:flex', ':nth-last-child(3)'],
      ['nth-last-[2n]:flex', ':nth-last-child(2n)'],
      ['nth-of-type-3:flex', ':nth-of-type(3)'],
      ['nth-last-of-type-2:flex', ':nth-last-of-type(2)'],
    ]

    for (const [className, pseudo] of cases) {
      it(`should resolve ${className} to ${pseudo}`, () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate(className)
        const css = gen.toCSS(false)
        expect(css).toContain(pseudo)
        expect(css).toContain('display: flex;')
      })
    }

    it('should try the longest prefix first', () => {
      // `nth-last-of-type-2` must not be eaten by the `nth-last-` prefix and
      // emit the nonsense `:nth-last-child(of-type-2)`.
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('nth-last-of-type-2:flex')
      const css = gen.toCSS(false)
      expect(css).toContain(':nth-last-of-type(2)')
      expect(css).not.toContain(':nth-last-child(')
    })
  })

  describe('rejected arguments', () => {
    // Tailwind rejects all of these, and a variant we cannot resolve has to
    // drop the whole rule rather than pass a raw word through to CSS.
    for (const className of ['nth-2.5:flex', 'nth-abc:flex', 'nth--3:flex', 'nth-of-type-abc:flex', 'nth-[]:flex']) {
      it(`should generate nothing for ${className}`, () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate(className)
        expect(gen.toCSS(false)).toBe('')
      })
    }
  })

  describe('stacking', () => {
    it('should combine with a breakpoint', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:nth-3:flex')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':nth-child(3)')
    })

    it('should combine with a state variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:nth-3:underline')
      const css = gen.toCSS(false)
      expect(css).toContain(':hover:nth-child(3)')
    })

    it('should combine with the child variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('*:nth-3:underline')
      const css = gen.toCSS(false)
      expect(css).toContain(':nth-child(3)')
    })
  })
})
