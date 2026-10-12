import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Media Query and Feature Variants', () => {
  describe('Responsive variants', () => {
    it('should generate responsive sm variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('sm:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 640px)')
    })

    it('should generate responsive md variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
    })

    it('should generate responsive lg variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('lg:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 1024px)')
    })
  })

  describe('Print variant', () => {
    it('should generate print variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('print:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain('@media print')
      expect(css).toContain('display: none;')
    })

    it('should handle print with dark mode', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('print:dark:text-black')
      const css = gen.toCSS(false)
      expect(css).toContain('@media print')
      expect(css).toContain('.dark')
    })
  })

  describe('Dark mode variant', () => {
    it('should generate dark variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('dark:bg-gray-900')
      const css = gen.toCSS(false)
      expect(css).toContain('.dark')
      expect(css).toContain('background-color: oklch(21% 0.034 264.665);')
    })

    it('should handle dark + responsive + hover', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('dark:md:hover:text-gray-100')
      const css = gen.toCSS(false)
      expect(css).toContain('.dark')
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':hover')
    })
  })

  describe('Direction variants', () => {
    it('should generate rtl variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rtl:text-right')
      const css = gen.toCSS(false)
      expect(css).toContain('[dir="rtl"]')
      expect(css).toContain('text-align: right;')
    })

    it('should generate ltr variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('ltr:text-left')
      const css = gen.toCSS(false)
      expect(css).toContain('[dir="ltr"]')
      expect(css).toContain('text-align: left;')
    })

    it('should handle rtl with responsive and hover', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rtl:md:hover:text-right')
      const css = gen.toCSS(false)
      expect(css).toContain('[dir="rtl"]')
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':hover')
    })

    it('should match the element that carries dir, not only its descendants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rtl:text-end')
      const css = gen.toCSS(false)
      // A descendant combinator (`[dir="rtl"] .rtl\:text-end`) cannot style
      // `<html dir="rtl" class="rtl:text-end">` — the element declaring the
      // direction is never its own descendant.
      expect(css).toContain(':is([dir="rtl"], [dir="rtl"] *)')
      expect(css).not.toContain('[dir="rtl"] .rtl')
    })

    it('should keep a pseudo-element last regardless of variant order', () => {
      for (const cls of ['rtl:before:underline', 'before:rtl:underline']) {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate(cls)
        const css = gen.toCSS(false)
        expect(css).toContain(':is([dir="rtl"], [dir="rtl"] *)::before')
      }
    })
  })

  describe('Motion variants', () => {
    it('should generate motion-safe variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('motion-safe:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (prefers-reduced-motion: no-preference)')
      expect(css).toContain('padding: 1rem;')
    })

    it('should generate motion-reduce variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('motion-reduce:p-0')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (prefers-reduced-motion: reduce)')
      expect(css).toContain('padding: 0;')
    })

    it('should handle motion-safe with responsive', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('motion-safe:lg:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (prefers-reduced-motion: no-preference)')
      expect(css).toContain('padding: 1rem;')
    })
  })

  describe('Contrast variants', () => {
    it('should generate contrast-more variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('contrast-more:border-gray-900')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (prefers-contrast: more)')
    })

    it('should generate contrast-less variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('contrast-less:border-gray-400')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (prefers-contrast: less)')
    })
  })

  describe('Container query variants', () => {
    it('should generate @container utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@container')
      const css = gen.toCSS(false)
      expect(css).toContain('container-type: inline-size;')
    })

    it('should generate @container-normal utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@container-normal')
      const css = gen.toCSS(false)
      expect(css).toContain('container-type: normal;')
    })

    it('should generate named container with @container/name', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@container/sidebar')
      const css = gen.toCSS(false)
      expect(css).toContain('container-type: inline-size;')
      expect(css).toContain('container-name: sidebar;')
    })

    it('should generate @sm container query variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@sm:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@container (min-width: 640px)')
      expect(css).toContain('padding: 1rem;')
    })

    it('should generate @md container query variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@md:flex')
      const css = gen.toCSS(false)
      expect(css).toContain('@container (min-width: 768px)')
      expect(css).toContain('display: flex;')
    })

    it('should generate @lg container query variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@lg:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain('@container (min-width: 1024px)')
      expect(css).toContain('display: none;')
    })

    it('should generate @xl container query variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@xl:grid')
      const css = gen.toCSS(false)
      expect(css).toContain('@container (min-width: 1280px)')
      expect(css).toContain('display: grid;')
    })

    it('should generate @2xl container query variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@2xl:inline-flex')
      const css = gen.toCSS(false)
      expect(css).toContain('@container (min-width: 1536px)')
      expect(css).toContain('display: inline-flex;')
    })

    it('should escape @ in selector for container queries', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@sm:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('.\\@sm\\:p-4')
    })

    it('should handle container query with hover variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('@md:hover:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('@container (min-width: 768px)')
      expect(css).toContain(':hover')
    })
  })

  describe('Orientation variants', () => {
    it('should generate landscape media query', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('landscape:flex-row')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (orientation: landscape)')
    })

    it('should generate landscape with sizing utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('landscape:w-full')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (orientation: landscape)')
      expect(css).toContain('width: 100%')
    })

    it('should generate portrait media query', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('portrait:flex-col')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (orientation: portrait)')
    })

    it('should generate portrait with spacing utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('portrait:p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (orientation: portrait)')
      expect(css).toContain('padding')
    })
  })

  describe('Forced colors variant', () => {
    it('should generate forced-colors media query', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('forced-colors:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (forced-colors: active)')
      expect(css).toContain('display: none')
    })

    it('should generate forced-colors with border utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('forced-colors:border')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (forced-colors: active)')
    })
  })

  describe('Supports variant', () => {
    it('should generate supports media query with arbitrary value', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('supports-[display:grid]:grid')
      const css = gen.toCSS(false)
      expect(css).toContain('@supports (display: grid)')
      expect(css).toContain('display: grid')
    })

    it('should generate supports with backdrop-filter', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('supports-[backdrop-filter:blur(0)]:backdrop-blur-sm')
      const css = gen.toCSS(false)
      expect(css).toContain('@supports (backdrop-filter: blur(0))')
    })

    it('should generate supports with gap', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('supports-[gap:1px]:gap-4')
      const css = gen.toCSS(false)
      expect(css).toContain('@supports (gap: 1px)')
    })
  })

  describe('Light variant', () => {
    it('should generate light prefix variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('light:bg-white')
      const css = gen.toCSS(false)
      expect(css).toContain('.light ')
    })

    it('should generate light variant with text color', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('light:text-black')
      const css = gen.toCSS(false)
      expect(css).toContain('.light ')
      expect(css).toContain('color')
    })
  })

  describe('Stacked media queries', () => {
    it('should combine lg with landscape', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('lg:landscape:p-8')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 1024px) and (orientation: landscape)')
      expect(css).toContain('padding: 2rem')
    })

    it('should combine sm with portrait', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('sm:portrait:flex-col')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 640px) and (orientation: portrait)')
    })

    it('should combine md with motion-reduce', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:motion-reduce:hidden')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px) and (prefers-reduced-motion: reduce)')
    })
  })
})

describe('Input-device and display media features', () => {
  const cases: [string, string][] = [
    ['pointer-none:p-1', '@media (pointer: none)'],
    ['pointer-coarse:p-8', '@media (pointer: coarse)'],
    ['pointer-fine:p-2', '@media (pointer: fine)'],
    ['any-pointer-none:p-1', '@media (any-pointer: none)'],
    ['any-pointer-coarse:p-8', '@media (any-pointer: coarse)'],
    ['any-pointer-fine:p-2', '@media (any-pointer: fine)'],
    ['inverted-colors:bg-white', '@media (inverted-colors: inverted)'],
    ['noscript:block', '@media (scripting: none)'],
  ]

  for (const [className, query] of cases) {
    it(`should wrap ${className} in ${query}`, () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate(className)
      expect(gen.toCSS(false)).toContain(query)
    })
  }

  it('should keep pointer-* and any-pointer-* distinct', () => {
    // A laptop with a touchscreen is pointer-fine AND any-pointer-coarse, so
    // conflating the two families would target the wrong devices.
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('pointer-coarse:p-8')
    gen.generate('any-pointer-coarse:p-4')
    const css = gen.toCSS(false)
    expect(css).toContain('(pointer: coarse)')
    expect(css).toContain('(any-pointer: coarse)')
  })

  it('should combine with a breakpoint into one media query', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:pointer-coarse:p-8')
    const css = gen.toCSS(false)
    expect(css).toContain('@media (min-width: 768px) and (pointer: coarse)')
  })

  it('should stack with a state variant on the selector', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('pointer-coarse:hover:p-8')
    const css = gen.toCSS(false)
    expect(css).toContain('@media (pointer: coarse)')
    expect(css).toContain(':hover')
  })

  it('should generate nothing for an unknown pointer value', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('pointer-bogus:p-8')
    expect(gen.toCSS(false)).toBe('')
  })
})

describe('starting variant (@starting-style)', () => {
  it('should wrap the rule in @starting-style', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('starting:opacity-0')
    const css = gen.toCSS(false)
    expect(css).toContain('@starting-style')
    expect(css).toContain('opacity: 0;')
  })

  it('should nest inside a breakpoint, not outside it', () => {
    // Tailwind emits @media { @starting-style { … } }. The reverse order is
    // invalid nesting, so the order here is behaviour, not cosmetics.
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:starting:opacity-0')
    const css = gen.toCSS(false)
    expect(css.indexOf('@media (min-width: 768px)')).toBeLessThan(css.indexOf('@starting-style'))
  })

  it('should nest inside @supports', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('starting:supports-[display:grid]:flex')
    const css = gen.toCSS(false)
    expect(css.indexOf('@supports')).toBeLessThan(css.indexOf('@starting-style'))
  })

  it('should keep a state variant on the selector', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('starting:hover:opacity-0')
    const css = gen.toCSS(false)
    expect(css).toContain('@starting-style')
    expect(css).toContain(':hover')
  })
})
