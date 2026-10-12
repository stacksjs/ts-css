import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Pseudo-Class and Pseudo-Element Variants', () => {
  describe('Form pseudo-classes', () => {
    it('should handle placeholder variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('placeholder:text-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('::placeholder')
      expect(css).toContain('color: oklch(55.1% 0.027 264.364)')
    })

    it('should handle selection variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('selection:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('::selection')
      expect(css).toContain('background-color: oklch(62.3% 0.214 259.815)')
    })

    it('should handle file variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('file:border-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('::file-selector-button')
    })

    it('should handle required variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('required:border-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':required')
      expect(css).toContain('border-color: oklch(63.7% 0.237 25.331)')
    })

    it('should handle valid variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('valid:border-green-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':valid')
      expect(css).toContain('border-color: oklch(72.3% 0.219 149.579)')
    })

    it('should handle invalid variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('invalid:border-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':invalid')
    })

    it('should handle read-only variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('read-only:bg-gray-100')
      const css = gen.toCSS(false)
      expect(css).toContain(':read-only')
    })

    it('should handle autofill variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('autofill:bg-yellow-100')
      const css = gen.toCSS(false)
      expect(css).toContain(':autofill')
    })
  })

  describe('State pseudo-classes', () => {
    it('should handle open variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('open:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('[open]')
    })

    it('should handle closed variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('closed:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain(':not([open])')
    })

    it('should handle empty variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('empty:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain(':empty')
    })

    it('should handle enabled variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('enabled:bg-white')
      const css = gen.toCSS(false)
      expect(css).toContain(':enabled')
    })

    it('should handle only variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('only:m-0')
      const css = gen.toCSS(false)
      expect(css).toContain(':only-child')
    })

    it('should handle target variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('target:bg-yellow-100')
      const css = gen.toCSS(false)
      expect(css).toContain(':target')
    })

    it('should handle indeterminate variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('indeterminate:bg-gray-300')
      const css = gen.toCSS(false)
      expect(css).toContain(':indeterminate')
    })

    it('should handle default variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('default:border-2')
      const css = gen.toCSS(false)
      expect(css).toContain(':default')
    })

    it('should handle optional variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('optional:border-gray-300')
      const css = gen.toCSS(false)
      expect(css).toContain(':optional')
    })
  })

  describe('Marker pseudo-element', () => {
    it('should handle marker variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('marker:text-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('::marker')
      expect(css).toContain('color: oklch(62.3% 0.214 259.815)')
    })

    it('should handle marker with multiple properties', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('marker:text-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain('::marker')
      expect(css).toContain('color: oklch(63.7% 0.237 25.331)')
    })
  })

  describe('Complex variant combinations', () => {
    it('should handle multiple variants together', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:focus:placeholder:text-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':hover')
      expect(css).toContain(':focus')
      expect(css).toContain('::placeholder')
    })

    it('should handle responsive with new variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:required:border-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':required')
    })

    it('should handle important with variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('!placeholder:text-gray-400')
      const css = gen.toCSS(false)
      expect(css).toContain('!important')
    })

    it('should handle dark mode with form variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('dark:invalid:text-red-400')
      const css = gen.toCSS(false)
      expect(css).toContain('.dark')
      expect(css).toContain(':invalid')
    })

    it('should combine all new pseudo-classes', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('required:text-red-500')
      gen.generate('valid:text-green-500')
      gen.generate('invalid:text-red-700')
      gen.generate('optional:text-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':required')
      expect(css).toContain(':valid')
      expect(css).toContain(':invalid')
      expect(css).toContain(':optional')
    })
  })

  describe('Variant edge cases', () => {
    it('should handle chained form variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('focus:required:invalid:border-red-700')
      const css = gen.toCSS(false)
      expect(css).toContain(':focus')
      expect(css).toContain(':required')
      expect(css).toContain(':invalid')
    })

    it('should handle responsive + dark + form variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('lg:dark:placeholder:text-gray-600')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 1024px)')
      expect(css).toContain('.dark')
      expect(css).toContain('::placeholder')
    })

    it('should handle group with new variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-hover:marker:text-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.group:hover')
      expect(css).toContain('::marker')
    })
  })
})

describe('Interaction-aware validity and inert', () => {
  // :user-valid / :user-invalid differ from :valid / :invalid in that they
  // only match after the user has actually interacted with the field, which
  // is what you want for showing validation errors.
  it('should generate user-valid', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('user-valid:border-green-500')
    const css = gen.toCSS(false)
    expect(css).toContain(':user-valid')
    expect(css).toContain('border-color')
  })

  it('should generate user-invalid', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('user-invalid:border-red-500')
    const css = gen.toCSS(false)
    expect(css).toContain(':user-invalid')
  })

  it('should not confuse user-valid with valid', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('user-valid:underline')
    const css = gen.toCSS(false)
    // `.user-valid\:underline:user-valid` — the only colon-prefixed
    // pseudo-class in the selector must be :user-valid itself.
    expect(css).toContain(':user-valid')
    expect(css).not.toContain(':valid')
  })

  it('should match an inert element and its whole subtree', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('inert:opacity-50')
    const css = gen.toCSS(false)
    expect(css).toContain(':is([inert], [inert] *)')
    expect(css).toContain('opacity')
  })

  it('should stack inert with a breakpoint', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:inert:opacity-50')
    const css = gen.toCSS(false)
    expect(css).toContain('@media (min-width: 768px)')
    expect(css).toContain(':is([inert], [inert] *)')
  })
})

describe('Variants the parser accepted but the generator dropped', () => {
  // These four were listed in the parser's variantPrefixes — so bracket
  // syntax and attributify treated them as valid — but had no entry in
  // VARIANT_SELECTORS, so every one of them emitted nothing. A variant that
  // validates in one half of the pipeline and vanishes in the other is worse
  // than one that is simply absent.
  const cases: [string, string][] = [
    ['in-range:flex', ':in-range'],
    ['out-of-range:flex', ':out-of-range'],
    ['placeholder-shown:flex', ':placeholder-shown'],
    ['only-of-type:flex', ':only-of-type'],
  ]

  for (const [className, pseudo] of cases) {
    it(`should generate ${className}`, () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate(className)
      const css = gen.toCSS(false)
      expect(css).toContain(pseudo)
      expect(css).toContain('display: flex;')
    })
  }

  it('should keep placeholder-shown distinct from the placeholder pseudo-element', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('placeholder-shown:opacity-50')
    const css = gen.toCSS(false)
    expect(css).toContain(':placeholder-shown')
    expect(css).not.toContain('::placeholder')
  })

  it('should resolve in-range as its own name, not as in- applied to range', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('in-range:flex')
    const css = gen.toCSS(false)
    expect(css).toContain(':in-range')
    expect(css).not.toContain(':where(')
  })
})
