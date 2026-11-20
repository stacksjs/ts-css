import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { parseClass } from '../../src/engine/parser'

describe('Arbitrary Values and Properties', () => {
  describe('Data-type hints', () => {
    // Every one of these used to fall through to the colour resolver and be
    // emitted as background-color / border-color / font-size.
    const cases: Array<[string, string]> = [
      ['bg-[position:right_0.85rem_center]', 'background-position: right 0.85rem center;'],
      ['bg-[length:1.1rem]', 'background-size: 1.1rem;'],
      ['bg-[image:linear-gradient(red,blue)]', 'background-image: linear-gradient(red,blue);'],
      ['bg-[url(/a.png)]', 'background-image: url(/a.png);'],
      ['border-[length:3px]', 'border-width: 3px;'],
      ['text-[family-name:Inter]', 'font-family: Inter;'],
    ]

    for (const [cls, declaration] of cases) {
      it(`should route ${cls} to the property its hint names`, () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate(cls)
        expect(gen.toCSS(false)).toContain(declaration)
      })
    }

    it('should leave untyped and colour-typed values on the colour property', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#f00]')
      gen.generate('bg-[var(--c)]')
      gen.generate('text-[color:var(--x)]')
      gen.generate('text-[length:14px]')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: #f00;')
      expect(css).toContain('background-color: var(--c);')
      expect(css).toContain('color: var(--x);')
      expect(css).toContain('font-size: 14px;')
    })

    it('should not mistake a complete gradient for the bg-linear shorthand', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[image:linear-gradient(red,blue)]')
      expect(gen.toCSS(false)).not.toContain('gradient(gradient')
    })
  })

  describe('Arbitrary values', () => {
    it('should support arbitrary width', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('w-[100px]')
      expect(gen.toCSS(false)).toContain('width: 100px;')
    })

    it('should support arbitrary color', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#ff0000]')
      expect(gen.toCSS(false)).toContain('background-color: #ff0000;')
    })

    it('should support arbitrary padding', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('p-[2.5rem]')
      expect(gen.toCSS(false)).toContain('padding: 2.5rem;')
    })

    it('should work with negative arbitrary values', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('-m-[100px]')
      const css = gen.toCSS(false)
      expect(css).toBeDefined()
    })
  })

  describe('Arbitrary properties', () => {
    it('should parse arbitrary property', () => {
      const result = parseClass('[color:red]')
      expect(result).toEqual({
        raw: '[color:red]',
        base: '[color:red]',
        variants: [],
        utility: 'color',
        value: 'red',
        important: false,
        arbitrary: true,
      })
    })

    it('should parse arbitrary property with dashes', () => {
      const result = parseClass('[mask-type:luminance]')
      expect(result).toEqual({
        raw: '[mask-type:luminance]',
        base: '[mask-type:luminance]',
        variants: [],
        utility: 'mask-type',
        value: 'luminance',
        important: false,
        arbitrary: true,
      })
    })

    it('should generate arbitrary property CSS', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('[display:grid]')
      expect(gen.toCSS(false)).toContain('display: grid;')
    })

    it('should generate arbitrary property with dashes', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('[mask-type:alpha]')
      expect(gen.toCSS(false)).toContain('mask-type: alpha;')
    })

    it('should handle arbitrary property with spaces', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('[grid-template-areas:auto]')
      expect(gen.toCSS(false)).toContain('grid-template-areas: auto;')
    })

    it('should handle arbitrary property with CSS functions', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('[background:linear-gradient(red,blue)]')
      expect(gen.toCSS(false)).toContain('background: linear-gradient(red,blue);')
    })

    it('should handle arbitrary property with important', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('![z-index:9999]')
      expect(gen.toCSS(false)).toContain('z-index: 9999 !important;')
    })
  })

  describe('Edge Cases', () => {
    describe('Complex arbitrary values', () => {
      it('should handle calc() in arbitrary values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[calc(100%-2rem)]')
        expect(gen.toCSS(false)).toContain('width: calc(100% - 2rem);')
      })

      it('should handle clamp() in arbitrary values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('text-[clamp(1rem,2.5vw,3rem)]')
        expect(gen.toCSS(false)).toContain('font-size: clamp(1rem, 2.5vw, 3rem);')
      })

      it('should handle min() in arbitrary values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[min(100%,500px)]')
        expect(gen.toCSS(false)).toContain('width: min(100%, 500px);')
      })

      it('should handle max() in arbitrary values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[max(50vh,300px)]')
        expect(gen.toCSS(false)).toContain('height: max(50vh, 300px);')
      })

      it('should handle CSS variables', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('text-[length:var(--font-size)]')
        expect(gen.toCSS(false)).toContain('font-size: var(--font-size);')
      })

      it('should handle multiple CSS variables', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[color:var(--primary,#000)]')
        expect(gen.toCSS(false)).toContain('color: var(--primary,#000);')
      })
    })

    describe('Type hints in arbitrary values', () => {
      it('should handle color type hint with CSS variable', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('text-[color:var(--muted)]')
        expect(gen.toCSS(false)).toContain('color: var(--muted);')
      })

      it('should handle length type hint', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('text-[length:1.5rem]')
        expect(gen.toCSS(false)).toContain('font-size: 1.5rem;')
      })

      it('should handle border color type hint', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('border-[color:var(--border)]')
        expect(gen.toCSS(false)).toContain('border-color: var(--border);')
      })

      it('should handle bg color type hint', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[color:var(--background)]')
        expect(gen.toCSS(false)).toContain('background-color: var(--background);')
      })

      it('should parse type hint correctly', () => {
        const result = parseClass('text-[color:var(--muted)]')
        expect(result.utility).toBe('text')
        expect(result.value).toBe('var(--muted)')
        expect(result.typeHint).toBe('color')
        expect(result.arbitrary).toBe(true)
      })

      it('should parse length type hint correctly', () => {
        const result = parseClass('w-[length:100px]')
        expect(result.utility).toBe('w')
        expect(result.value).toBe('100px')
        expect(result.typeHint).toBe('length')
        expect(result.arbitrary).toBe(true)
      })

      it('should not confuse CSS var() with type hint', () => {
        const result = parseClass('text-[var(--size)]')
        expect(result.utility).toBe('text')
        expect(result.value).toBe('var(--size)')
        expect(result.typeHint).toBeUndefined()
      })

      it('should handle type hint with variant', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('hover:text-[color:var(--muted)]')
        const css = gen.toCSS(false)
        expect(css).toContain(':hover')
        expect(css).toContain('color: var(--muted);')
      })
    })

    describe('Modern CSS units', () => {
      it('should handle dvh units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[100dvh]')
        expect(gen.toCSS(false)).toContain('height: 100dvh;')
      })

      it('should handle svh units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[100svh]')
        expect(gen.toCSS(false)).toContain('height: 100svh;')
      })

      it('should handle lvh units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[100lvh]')
        expect(gen.toCSS(false)).toContain('height: 100lvh;')
      })

      it('should handle cqw units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[50cqw]')
        expect(gen.toCSS(false)).toContain('width: 50cqw;')
      })

      it('should handle cqh units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[50cqh]')
        expect(gen.toCSS(false)).toContain('height: 50cqh;')
      })

      it('should handle ch units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[60ch]')
        expect(gen.toCSS(false)).toContain('width: 60ch;')
      })

      it('should handle ex units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[10ex]')
        expect(gen.toCSS(false)).toContain('height: 10ex;')
      })
    })

    describe('Complex arbitrary properties', () => {
      it('should handle grid-template-columns with complex value', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]')
        expect(gen.toCSS(false)).toContain('grid-template-columns: repeat(auto-fit,minmax(200px,1fr));')
      })

      it('should handle background with gradients', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background:linear-gradient(45deg,red,blue)]')
        expect(gen.toCSS(false)).toContain('background: linear-gradient(45deg,red,blue);')
      })

      it('should handle filter with blur', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[filter:blur(10px)]')
        expect(gen.toCSS(false)).toContain('filter: blur(10px);')
      })

      it('should handle transform property', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[transform:translateX(10px)]')
        expect(gen.toCSS(false)).toContain('transform: translateX(10px);')
      })

      it('should handle box-shadow', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[box-shadow:inset_0_2px_4px_0_#0f172a]')
        const css = gen.toCSS(false)
        expect(css).toContain('box-shadow:')
      })
    })

    describe('Arbitrary values with variants', () => {
      it('should handle arbitrary value with responsive variant', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('md:w-[450px]')
        const css = gen.toCSS(false)
        expect(css).toContain('@media (min-width: 768px)')
        expect(css).toContain('width: 450px;')
      })

      it('should handle arbitrary value with hover variant', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('hover:bg-[#ff6600]')
        const css = gen.toCSS(false)
        expect(css).toContain(':hover')
        expect(css).toContain('background-color: #ff6600;')
      })

      it('should handle arbitrary value with multiple variants', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('md:hover:w-[500px]')
        const css = gen.toCSS(false)
        expect(css).toContain('@media')
        expect(css).toContain(':hover')
      })
    })

    describe('Edge values', () => {
      it('should handle zero arbitrary value', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[0]')
        expect(gen.toCSS(false)).toContain('width: 0;')
      })

      it('should handle very large arbitrary value', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[9999px]')
        expect(gen.toCSS(false)).toContain('width: 9999px;')
      })

      it('should handle decimal arbitrary value', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('opacity-[0.37]')
        expect(gen.toCSS(false)).toContain('opacity: 0.37;')
      })

      it('should handle fractional values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[75.5%]')
        expect(gen.toCSS(false)).toContain('width: 75.5%;')
      })
    })

    describe('URL and image arbitrary values', () => {
      it('should handle url() in background-image', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background-image:url(/images/bg.jpg)]')
        expect(gen.toCSS(false)).toContain('background-image: url(/images/bg.jpg);')
      })

      it('should handle data URL', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background:url(data:image/svg+xml;base64,ABC)]')
        expect(gen.toCSS(false)).toContain('background: url(data:image/svg+xml;base64,ABC);')
      })
    })

    describe('Special characters in arbitrary values', () => {
      it('should handle parentheses in arbitrary values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[clip-path:circle(50%)]')
        expect(gen.toCSS(false)).toContain('clip-path: circle(50%);')
      })

      it('should handle complex values', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[animation:spin_1s_linear_infinite]')
        const css = gen.toCSS(false)
        expect(css).toContain('animation:')
      })
    })

    describe('Color formats in arbitrary', () => {
      it('should handle hex colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[#123456]')
        expect(gen.toCSS(false)).toContain('background-color: #123456;')
      })

      it('should handle rgb colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[rgb(255,0,0)]')
        expect(gen.toCSS(false)).toContain('background-color: rgb(255,0,0);')
      })

      it('should handle rgba colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[rgba(0,0,0,0.5)]')
        expect(gen.toCSS(false)).toContain('background-color: rgba(0,0,0,0.5);')
      })

      it('should handle hsl colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[hsl(200,100%,50%)]')
        expect(gen.toCSS(false)).toContain('background-color: hsl(200,100%,50%);')
      })

      it('should handle hsla colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[hsla(120,50%,50%,0.8)]')
        expect(gen.toCSS(false)).toContain('background-color: hsla(120,50%,50%,0.8);')
      })
    })

    describe('Angle units', () => {
      it('should handle deg units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('rotate-[17deg]')
        expect(gen.toCSS(false)).toContain('transform: rotate(17deg);')
      })

      it('should handle rad units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('rotate-[1.5rad]')
        expect(gen.toCSS(false)).toContain('transform: rotate(1.5rad);')
      })

      it('should handle turn units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('rotate-[0.25turn]')
        expect(gen.toCSS(false)).toContain('transform: rotate(0.25turn);')
      })
    })

    describe('CSS Selector Escaping', () => {
      it('should properly escape calc() with viewport units', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[calc(100vh-4rem)]')
        const css = gen.toCSS(false)
        expect(css).toContain('height: calc(100vh - 4rem);')
        // Verify the selector is properly escaped with backslashes
        expect(css).toContain('.h-\\[calc\\(100vh-4rem\\)\\]')
      })

      it('should properly escape calc() with percentage', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[calc(100%-2rem)]')
        const css = gen.toCSS(false)
        expect(css).toContain('width: calc(100% - 2rem);')
        expect(css).toContain('.w-\\[calc\\(100\\%-2rem\\)\\]')
      })

      it('should properly escape min() function', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[min(100%,500px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('width: min(100%, 500px);')
        expect(css).toContain('.w-\\[min\\(100\\%\\,500px\\)\\]')
      })

      it('should properly escape max() function', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[max(50vh,300px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('height: max(50vh, 300px);')
        expect(css).toContain('.h-\\[max\\(50vh\\,300px\\)\\]')
      })

      it('should properly escape clamp() function', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('text-[clamp(1rem,2.5vw,3rem)]')
        const css = gen.toCSS(false)
        expect(css).toContain('font-size: clamp(1rem, 2.5vw, 3rem);')
        expect(css).toContain('.text-\\[clamp\\(1rem\\,2\\.5vw\\,3rem\\)\\]')
      })

      it('should properly escape nested functions', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]')
        const css = gen.toCSS(false)
        expect(css).toContain('grid-template-columns: repeat(auto-fit,minmax(200px,1fr));')
        // The selector should have all parentheses and commas escaped
        expect(css).toMatch(/\.\\\[grid-template-columns\\:repeat\\\(auto-fit\\,minmax\\\(200px\\,1fr\\\)\\\)\\\]/)
      })

      it('should properly escape rgba colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[rgba(0,0,0,0.5)]')
        const css = gen.toCSS(false)
        expect(css).toContain('background-color: rgba(0,0,0,0.5);')
        expect(css).toContain('.bg-\\[rgba\\(0\\,0\\,0\\,0\\.5\\)\\]')
      })

      it('should properly escape hsla colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[hsla(120,50%,50%,0.8)]')
        const css = gen.toCSS(false)
        expect(css).toContain('background-color: hsla(120,50%,50%,0.8);')
        expect(css).toContain('.bg-\\[hsla\\(120\\,50\\%\\,50\\%\\,0\\.8\\)\\]')
      })

      it('should properly escape hash in hex colors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('bg-[#ff6600]')
        const css = gen.toCSS(false)
        expect(css).toContain('background-color: #ff6600;')
        expect(css).toContain('.bg-\\[\\#ff6600\\]')
      })

      it('should handle complex calc with multiple operations', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[calc((100vw-64px)/2)]')
        const css = gen.toCSS(false)
        expect(css).toContain('width: calc((100vw - 64px) / 2);')
      })

      it('should handle sidebar-style height calculation', () => {
        // This is the specific use case that triggered the fix
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('h-[calc(100vh-4rem)]')
        const css = gen.toCSS(false)
        // Must contain valid CSS
        expect(css).toContain('height: calc(100vh - 4rem);')
        // Selector must be properly escaped so browser can match it
        expect(css).toMatch(/\.h-\\\[calc\\\(100vh-4rem\\\)\\\]/)
      })

      it('should handle min-height with calc', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('min-h-[calc(100vh-64px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('min-height: calc(100vh - 64px);')
      })

      it('should handle max-width with calc', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('max-w-[calc(100%-2rem)]')
        const css = gen.toCSS(false)
        expect(css).toContain('max-width: calc(100% - 2rem);')
      })

      it('should escape special characters with variants', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('lg:h-[calc(100vh-4rem)]')
        const css = gen.toCSS(false)
        expect(css).toContain('@media (min-width: 1024px)')
        expect(css).toContain('height: calc(100vh - 4rem);')
      })

      it('should escape special characters with hover variant', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('hover:bg-[rgba(0,0,0,0.1)]')
        const css = gen.toCSS(false)
        expect(css).toContain(':hover')
        expect(css).toContain('background-color: rgba(0,0,0,0.1);')
      })

      it('should handle CSS var with fallback containing comma', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[color:var(--primary,#000)]')
        const css = gen.toCSS(false)
        expect(css).toContain('color: var(--primary,#000);')
      })

      it('should handle transform with translate', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[transform:translateX(calc(100%+1rem))]')
        const css = gen.toCSS(false)
        expect(css).toContain('transform: translateX(calc(100% + 1rem));')
      })

      it('should handle filter with multiple functions', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[filter:blur(4px)brightness(0.9)]')
        const css = gen.toCSS(false)
        expect(css).toContain('filter: blur(4px)brightness(0.9);')
      })

      it('should properly escape plus sign in selectors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[margin:calc(1rem+2px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('margin: calc(1rem + 2px);')
        expect(css).toContain('.\\[margin\\:calc\\(1rem\\+2px\\)\\]')
      })

      it('should properly escape tilde in selectors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[content:~test]')
        const css = gen.toCSS(false)
        expect(css).toContain('.\\[content\\:\\~test\\]')
      })

      it('should properly escape greater than sign in selectors', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[content:a>b]')
        const css = gen.toCSS(false)
        expect(css).toContain('.\\[content\\:a\\>b\\]')
      })
    })

    // =========================================================================
    // Regression: Tailwind-style underscore → space conversion in arbitrary
    // values. CSS class names can't contain spaces, so Tailwind's convention
    // is to write `_` and have the engine convert it to ` ` when emitting the
    // property value. The ONLY exception is `url(...)` — URLs legitimately
    // contain underscores in paths, so those must be preserved verbatim.
    //
    // These tests were added after stx/drivly hit a `grid-cols-[300px_1fr]`
    // bug where the value stayed as `300px_1fr` in the output (invalid CSS),
    // and `max-h-[calc(100vh_-_120px)]` collapsed to `calc(100vh_-_120px)`
    // (invalid operator) because the old parser preserved underscores inside
    // ANY parentheses. See `convertArbitraryUnderscores` in parser.ts.
    // =========================================================================
    describe('Underscore-to-space conversion (regression)', () => {
      it('converts underscores to spaces in multi-track grid columns', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('grid-cols-[300px_1fr]')
        const css = gen.toCSS(false)
        expect(css).toContain('grid-template-columns: 300px 1fr;')
        expect(css).not.toContain('grid-template-columns: 300px_1fr')
      })

      it('converts underscores to spaces with lg: variant', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('lg:grid-cols-[300px_1fr]')
        const css = gen.toCSS(false)
        expect(css).toContain('grid-template-columns: 300px 1fr;')
        expect(css).not.toContain('grid-template-columns: 300px_1fr')
      })

      it('converts underscores to spaces inside calc()', () => {
        // Spaces around the `-` operator are required for valid CSS calc().
        // Users write `_-_` in the class name; the output must have real spaces.
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('max-h-[calc(100vh_-_120px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('max-height: calc(100vh - 120px);')
      })

      it('converts underscores to spaces inside clamp()', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[clamp(200px,_50%,_800px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('width: clamp(200px, 50%, 800px);')
      })

      it('converts underscores to spaces inside min()/max()', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('w-[min(100%,_500px)]')
        gen.generate('h-[max(50vh,_300px)]')
        const css = gen.toCSS(false)
        expect(css).toContain('width: min(100%, 500px);')
        expect(css).toContain('height: max(50vh, 300px);')
      })

      it('converts underscores to spaces in multi-value shadow (via arbitrary property)', () => {
        // `0_4px_16px_rgba(...)` → `0 4px 16px rgba(...)` — nested parens
        // around the color must not prevent the top-level underscores from
        // becoming spaces. Tested via arbitrary property form since shadow-
        // utility may not emit for complex rgba-containing values.
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[box-shadow:0_4px_16px_rgba(0,0,0,0.06)]')
        const css = gen.toCSS(false)
        expect(css).toContain('box-shadow: 0 4px 16px rgba(0,0,0,0.06);')
      })

      it('converts underscores to spaces in linear-gradient argument list', () => {
        // Tested via arbitrary property form since bg- doesn't emit
        // background-image for gradient values.
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background-image:linear-gradient(135deg,_#fff,_#000)]')
        const css = gen.toCSS(false)
        expect(css).toContain('background-image: linear-gradient(135deg, #fff, #000);')
      })

      it('converts underscores inside nested CSS functions (repeat(auto-fit, minmax(...)))', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))]')
        const css = gen.toCSS(false)
        expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));')
      })

      it('PRESERVES underscores inside url() (URLs are path-bearing)', () => {
        // The whole point of the url() exception — it's the one CSS function
        // where underscores are meaningful rather than space stand-ins.
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background-image:url(https://example.com/foo_bar_baz.png)]')
        const css = gen.toCSS(false)
        expect(css).toContain('url(https://example.com/foo_bar_baz.png)')
        expect(css).not.toContain('foo bar baz.png')
      })

      it('PRESERVES underscores in data-URL paths', () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background:url(data:image/svg+xml;base64,my_encoded_data)]')
        const css = gen.toCSS(false)
        expect(css).toContain('url(data:image/svg+xml;base64,my_encoded_data)')
      })

      it('converts underscores outside url() while preserving them inside', () => {
        // Mixed case — top-level underscores between shorthand parts become
        // spaces, the underscores INSIDE the url() stay put.
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('[background:center_/_cover_url(/assets/cover_image.png)]')
        const css = gen.toCSS(false)
        expect(css).toContain('background: center / cover url(/assets/cover_image.png);')
      })

      it('treats escaped underscores (\\_) as literal underscores', () => {
        // Escape hatch: if you truly need a literal `_` in a non-url context,
        // write `\_`. Used rarely but must work.
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('content-[my\\_literal\\_text]')
        const css = gen.toCSS(false)
        expect(css).toContain('my_literal_text')
      })

      it('works with font-family type hint and underscores', () => {
        // `font-[family-name:Inter_Tight]` → `font-family: Inter Tight`
        const gen = new CSSGenerator(defaultConfig)
        gen.generate('font-[family-name:Inter_Tight]')
        const css = gen.toCSS(false)
        expect(css).toContain('font-family: Inter Tight;')
      })

      it('parseClass exposes the space-converted value', () => {
        // End-to-end: the parsed form should already carry the converted value.
        const parsed = parseClass('grid-cols-[120px_1fr_200px]')
        expect(parsed.value).toBe('120px 1fr 200px')

        const parsedCalc = parseClass('max-h-[calc(100vh_-_120px)]')
        expect(parsedCalc.value).toBe('calc(100vh - 120px)')

        const parsedUrl = parseClass('bg-[url(/foo_bar.png)]')
        expect(parsedUrl.value).toBe('url(/foo_bar.png)')
      })
    })
  })
})

/**
 * `shadow-[...]` had no arbitrary branch at all: the rule only looked its
 * value up in `theme.boxShadow`, so any real shadow definition missed and the
 * utility emitted nothing. Nothing failed loudly — the element simply had no
 * shadow, which is indistinguishable from a design choice.
 *
 * The value is ambiguous by design: `shadow-[#ff0000]` names a shadow COLOUR
 * while `shadow-[0_1px_4px_black]` is a whole shadow. Offsets mean a shadow
 * definition always contains whitespace, which is how the two rules divide it.
 */
describe('arbitrary box shadows', () => {
  function css(className: string): string {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate(className)
    return gen.toCSS(false)
  }

  it('emits a full arbitrary shadow definition', () => {
    expect(css('shadow-[0_1px_4px_rgba(0,0,0,0.12)]')).toContain('--tc-shadow: 0 1px 4px rgba(0,0,0,0.12);')
  })

  it('supports inset and multi-part arbitrary shadows', () => {
    expect(css('shadow-[inset_0_1px_0_white]')).toContain('--tc-shadow: inset 0 1px 0 white;')
  })

  it('routes a bare arbitrary colour to the shadow-colour rule', () => {
    const out = css('shadow-[#ff0000]')
    expect(out).toContain('--tc-shadow-color: #ff0000;')
    // A colour must not be emitted as the shadow itself.
    expect(out).not.toContain('--tc-shadow: #ff0000;')
  })

  it('keeps the named scale working', () => {
    expect(css('shadow-lg')).toContain('--tc-shadow: 0 10px 15px -3px')
  })

  it('treats shadow-[none] as a reset', () => {
    expect(css('shadow-[none]')).toContain('--tc-shadow: 0 0 #0000;')
  })
})

/**
 * Arbitrary filter amounts must pass through untouched. A percentage-scale
 * divide (`brightness-150` -> 1.5) applied to an arbitrary value produced
 * `saturate(NaN)` for `[180%]` and `saturate(0.017)` for `[1.7]`, and the
 * blur rule appended `px` to a value that already carried a unit, giving
 * `blur(50pxpx)`. All three are invalid CSS a browser silently drops.
 */
describe('arbitrary filter amounts', () => {
  function css(className: string): string {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate(className)
    return gen.toCSS(false)
  }

  it('does not double the unit on arbitrary blur', () => {
    expect(css('blur-[50px]')).toContain('--tc-blur: blur(50px);')
    expect(css('backdrop-blur-[50px]')).toContain('--tc-backdrop-blur: blur(50px);')
  })

  it('does not rescale arbitrary percentage filters', () => {
    expect(css('backdrop-saturate-[180%]')).toContain('--tc-backdrop-saturate: saturate(180%);')
    expect(css('backdrop-saturate-[1.7]')).toContain('--tc-backdrop-saturate: saturate(1.7);')
  })

  it('lets several filter functions compose on one element', () => {
    // Each used to write the whole `backdrop-filter`, so the later rule in
    // the sheet won and the other silently did nothing.
    const blur = css('backdrop-blur-[50px]')
    const saturate = css('backdrop-saturate-[180%]')
    expect(blur).toContain('--tc-backdrop-blur: blur(50px);')
    expect(blur).toContain('var(--tc-backdrop-saturate, )')
    expect(saturate).toContain('--tc-backdrop-saturate: saturate(180%);')
    expect(saturate).toContain('var(--tc-backdrop-blur, )')
  })
})

/**
 * Background size and position, every spelling Tailwind v4 accepts.
 *
 * The parser did not recognise `size` as a type hint, so `bg-[size:…]` was not
 * split: `size:0.75rem 0.75rem` travelled whole as a colour and came out as
 * `background-color: size:0.75rem 0.75rem;`, a declaration no browser parses.
 * `bg-size-[…]` and `bg-position-[…]` generated nothing. Expected values are
 * from a real tailwindcss 4.3.3 build.
 */
describe('background size and position hints', () => {
  const declarationOf = (className: string): string | undefined => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate(className)
    return gen.toCSS(false).match(/\{\s*([^}]*?);?\s*\}/)?.[1]?.trim()
  }

  it('should read every size spelling as background-size', () => {
    for (const className of ['bg-[size:1px_2px]', 'bg-[length:1px_2px]', 'bg-[bg-size:1px_2px]', 'bg-size-[1px_2px]'])
      expect(declarationOf(className)).toBe('background-size: 1px 2px')
  })

  /** Tailwind reads a percentage on `bg-[…]` as a position. */
  it('should read every position spelling as background-position', () => {
    expect(declarationOf('bg-[position:1px_2px]')).toBe('background-position: 1px 2px')
    expect(declarationOf('bg-position-[1px_2px]')).toBe('background-position: 1px 2px')
    expect(declarationOf('bg-[percentage:50%]')).toBe('background-position: 50%')
  })

  /**
   * Tailwind emits `background-color: 1px` here, with the hint stripped -- a
   * declaration the browser drops. Generating nothing is the same result
   * without shipping a bogus rule, and it is what this engine does for every
   * other hint a utility cannot express.
   */
  it('should drop a hint it does not recognise rather than paste it in', () => {
    expect(declarationOf('bg-[bogus:1px]')).toBeUndefined()
    expect(declarationOf('bg-[bg-position:1px_2px]')).toBeUndefined()
  })

  it('should keep a URL with a colon in it, and plain colours', () => {
    expect(declarationOf('bg-[url(https://a.com/b.png)]')).toBe('background-image: url(https://a.com/b.png)')
    expect(declarationOf('bg-[color:red]')).toBe('background-color: red')
    expect(declarationOf('bg-[red]')).toBe('background-color: red')
  })

  /** Tailwind has `bg-cover`; `bg-size-cover` is not a utility there either. */
  it('should not invent named bg-size utilities', () => {
    expect(declarationOf('bg-size-cover')).toBeUndefined()
  })
})
