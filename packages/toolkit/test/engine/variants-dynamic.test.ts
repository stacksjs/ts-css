import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Dynamic Attribute Variants', () => {
  describe('has: variant', () => {
    it('should generate has-checked selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('has-checked:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':has(:checked)')
      expect(css).toContain('background-color')
    })

    it('should generate has-focus selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('has-focus:ring-2')
      const css = gen.toCSS(false)
      expect(css).toContain(':has(:focus)')
    })

    it('should generate arbitrary has selector: has-[input:checked]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('has-[input:checked]:bg-white')
      const css = gen.toCSS(false)
      expect(css).toContain(':has(input:checked)')
    })

    it('should generate arbitrary has selector: has-[:focus]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('has-[:focus]:border-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':has(:focus)')
    })

    it('should generate has with child selector: has-[>img]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('has-[>img]:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain(':has(>img)')
    })
  })

  describe('aria-* variants', () => {
    it('should generate aria-disabled selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('aria-disabled:opacity-50')
      const css = gen.toCSS(false)
      expect(css).toContain('[aria-disabled="true"]')
      expect(css).toContain('opacity')
    })

    it('should generate aria-expanded selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('aria-expanded:rotate-180')
      const css = gen.toCSS(false)
      expect(css).toContain('[aria-expanded="true"]')
    })

    it('should generate aria-hidden selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('aria-hidden:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain('[aria-hidden="true"]')
      expect(css).toContain('display: none')
    })

    it('should generate arbitrary aria selector: aria-[sort=ascending]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('aria-[sort=ascending]:text-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('[aria-sort=ascending]')
    })

    it('should generate arbitrary aria selector: aria-[role=tab]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('aria-[role=tab]:font-bold')
      const css = gen.toCSS(false)
      expect(css).toContain('[aria-role=tab]')
    })
  })

  describe('data-* variants', () => {
    it('should generate data-loading boolean attribute', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('data-loading:opacity-50')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-loading]')
      expect(css).toContain('opacity')
    })

    it('should generate data-active boolean attribute', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('data-active:font-bold')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-active]')
    })

    it('should generate arbitrary data selector: data-[state=active]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('data-[state=active]:bg-white')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-state=active]')
    })

    it('should generate arbitrary data selector: data-[size=lg]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('data-[size=lg]:text-lg')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-size=lg]')
    })

    it('should generate arbitrary data selector: data-[theme=dark]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('data-[theme=dark]:bg-black')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-theme=dark]')
    })
  })

  describe('not-* variants', () => {
    it('should generate not-first selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-first:mt-4')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:first-child)')
      expect(css).toContain('margin-top')
    })

    it('should generate not-last selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-last:mb-4')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:last-child)')
      expect(css).toContain('margin-bottom')
    })

    it('should generate not-disabled selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-disabled:opacity-100')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:disabled)')
    })

    it('should generate not-empty selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-empty:block')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:empty)')
      expect(css).toContain('display: block')
    })

    it('should generate not-only selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-only:border-b')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:only-child)')
    })

    it('should generate not-checked selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-checked:bg-gray-100')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:checked)')
    })

    it('should generate not-first-of-type selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-first-of-type:pt-4')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:first-of-type)')
    })

    it('should generate not-last-of-type selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('not-last-of-type:pb-4')
      const css = gen.toCSS(false)
      expect(css).toContain(':not(:last-of-type)')
    })
  })

  describe('Variant combinations', () => {
    it('should combine aria with hover', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('aria-expanded:hover:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('[aria-expanded="true"]')
      expect(css).toContain(':hover')
    })

    it('should combine data variant with first', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('data-active:first:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-active]')
      expect(css).toContain(':first-child')
    })
  })
})

describe('in-* ancestor variants', () => {
  describe('resolution', () => {
    const cases: [string, string][] = [
      ['in-focus:flex', ':where(:focus)'],
      ['in-checked:flex', ':where(:checked)'],
      ['in-disabled:flex', ':where(:disabled)'],
      ['in-first:flex', ':where(:first-child)'],
      ['in-open:flex', ':where([open])'],
      ['in-aria-expanded:flex', ':where([aria-expanded="true"])'],
      ['in-aria-[sort=asc]:flex', ':where([aria-sort=asc])'],
      ['in-data-open:flex', ':where([data-open])'],
      ['in-data-[state=open]:flex', ':where([data-state=open])'],
      ['in-[.card]:flex', ':where(:is(.card))'],
    ]

    for (const [className, prefix] of cases) {
      it(`should resolve ${className}`, () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate(className)
        const css = gen.toCSS(false)
        expect(css).toContain(prefix)
        expect(css).toContain('display: flex;')
      })
    }

    it('should treat & in an arbitrary condition as the ancestor', () => {
      // The `&` stands for the ancestor, not for the utility's own class.
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-[&>p]:flex')
      const css = gen.toCSS(false)
      expect(css).toContain(':where(*>p)')
    })
  })

  describe('rejection', () => {
    it('should generate nothing for an unknown condition', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-bogus:flex')
      expect(gen.toCSS(false)).toBe('')
    })

    it('should reject a pseudo-element as a condition', () => {
      // ::before can never be an ancestor, even though `before` is a variant.
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-before:flex')
      expect(gen.toCSS(false)).toBe('')
    })

    it('should generate nothing for an empty arbitrary condition', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-[]:flex')
      expect(gen.toCSS(false)).toBe('')
    })

    it('should not shadow an exact variant that starts with in-', () => {
      // `in-range` is its own variant name, not `in-` applied to `range`.
      // Whatever it resolves to, it must not become :where(:range).
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-range:flex')
      expect(gen.toCSS(false)).not.toContain(':where(')
    })
  })

  describe('specificity and stacking', () => {
    it('should wrap the condition in :where() so it adds no specificity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-focus:underline')
      const css = gen.toCSS(false)
      expect(css).toContain(':where(:focus) .in-focus\\:underline')
    })

    it('should combine with a breakpoint', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:in-focus:flex')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':where(:focus)')
    })

    it('should combine with a state variant on the element itself', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('in-focus:hover:underline')
      const css = gen.toCSS(false)
      expect(css).toContain(':where(:focus)')
      expect(css).toContain(':hover')
    })
  })
})
