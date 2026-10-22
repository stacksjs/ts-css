import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { computeUtilityRank, CSSGenerator } from '../../src/engine/generator'

describe('CSSGenerator', () => {
  describe('Display utilities', () => {
    it('should generate flex utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('flex')
      const css = gen.toCSS(false)
      expect(css).toContain('.flex {')
      expect(css).toContain('display: flex;')
    })

    it('should generate block utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('block')
      const css = gen.toCSS(false)
      expect(css).toContain('display: block;')
    })

    it('should generate hidden utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hidden')
      const css = gen.toCSS(false)
      expect(css).toContain('display: none;')
    })
  })

  describe('Flexbox utilities', () => {
    it('should generate flex-col utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('flex-col')
      const css = gen.toCSS(false)
      expect(css).toContain('flex-direction: column;')
    })

    it('should generate justify-center utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('justify-center')
      const css = gen.toCSS(false)
      expect(css).toContain('justify-content: center;')
    })

    it('should generate items-center utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('items-center')
      const css = gen.toCSS(false)
      expect(css).toContain('align-items: center;')
    })
  })

  describe('Spacing utilities', () => {
    it('should generate padding utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('p-4')
      const css = gen.toCSS(false)
      expect(css).toContain('.p-4 {')
      expect(css).toContain('padding: 1rem;')
    })

    it('should generate margin utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('m-2')
      const css = gen.toCSS(false)
      expect(css).toContain('margin: 0.5rem;')
    })

    it('should generate horizontal padding', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('px-4')
      const css = gen.toCSS(false)
      expect(css).toContain('padding-left: 1rem;')
      expect(css).toContain('padding-right: 1rem;')
    })

    it('should generate vertical margin', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('my-8')
      const css = gen.toCSS(false)
      expect(css).toContain('margin-top: 2rem;')
      expect(css).toContain('margin-bottom: 2rem;')
    })

    it('should generate specific side padding', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('pt-2')
      const css = gen.toCSS(false)
      expect(css).toContain('padding-top: 0.5rem;')
    })
  })

  describe('Sizing utilities', () => {
    it('should generate width utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('w-full')
      const css = gen.toCSS(false)
      expect(css).toContain('width: 100%;')
    })

    it('should generate height utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('h-screen')
      const css = gen.toCSS(false)
      expect(css).toContain('height: 100vh;')
    })
  })

  describe('Color utilities', () => {
    it('should generate background color', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: oklch(55.1% 0.027 264.364);')
    })

    it('should generate text color', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-gray-800')
      const css = gen.toCSS(false)
      expect(css).toContain('color: oklch(27.8% 0.033 256.848);')
    })

    it('should generate border color', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-gray-300')
      const css = gen.toCSS(false)
      expect(css).toContain('border-color: oklch(87.2% 0.01 258.338);')
    })

    it('should handle direct color names', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-black')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: #000;')
    })
  })

  describe('Typography utilities', () => {
    it('should generate font size with line height', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-xl')
      const css = gen.toCSS(false)
      expect(css).toContain('font-size: 1.25rem;')
      expect(css).toContain('line-height: 1.75rem;')
    })

    it('should generate font weight', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('font-bold')
      const css = gen.toCSS(false)
      expect(css).toContain('font-weight: 700;')
    })

    it('should generate text alignment', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-center')
      const css = gen.toCSS(false)
      expect(css).toContain('text-align: center;')
    })
  })

  describe('Border utilities', () => {
    it('should generate border width', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border')
      const css = gen.toCSS(false)
      expect(css).toContain('border-width: 1px;')
    })

    it('should generate border radius', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-lg')
      const css = gen.toCSS(false)
      expect(css).toContain('border-radius: 0.5rem;')
    })

    it('should generate border-s (logical inline-start) with default 1px', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-s')
      const css = gen.toCSS(false)
      expect(css).toContain('border-inline-start-width: 1px')
    })

    it('should generate border-e (logical inline-end) with default 1px', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-e')
      const css = gen.toCSS(false)
      expect(css).toContain('border-inline-end-width: 1px')
    })

    // Regression: directional border widths accept arbitrary values AND
    // color values. Previously `border-t-[2px]`, `border-x-[3px]`, etc. got
    // skipped because the width map was hardcoded to {0, 2, 4, 8}; and
    // `border-r-red-500` emitted nothing because the rule didn't route
    // palette names to border-*-color.
    it('border-t-[2px] accepts arbitrary widths', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-t-[2px]')
      expect(gen.toCSS(false)).toContain('border-top-width: 2px;')
    })

    it('border-x-[3px] sets both horizontal edges', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-x-[3px]')
      const css = gen.toCSS(false)
      expect(css).toContain('border-left-width: 3px;')
      expect(css).toContain('border-right-width: 3px;')
    })

    it('border-b-[0.5rem] handles rem arbitrary values', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-b-[0.5rem]')
      expect(gen.toCSS(false)).toContain('border-bottom-width: 0.5rem;')
    })

    it('border-r-red-500 emits border-right-color from palette', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-r-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain('border-right-color:')
      // Guard — must NOT emit border-right-width for a color value
      expect(css).not.toContain('border-right-width:')
    })

    it('border-t-gray-800 resolves deeper-shade palette', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-t-gray-800')
      expect(gen.toCSS(false)).toContain('border-top-color:')
    })

    it('border-t-[#FF3E54] accepts arbitrary hex colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-t-[#FF3E54]')
      expect(gen.toCSS(false)).toContain('border-top-color: #FF3E54;')
    })

    it('border-t-transparent emits border-top-color: transparent', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-t-transparent')
      expect(gen.toCSS(false)).toContain('border-top-color: transparent;')
    })

    // Regression: physical rounded corners (`rounded-tl`, `rounded-tr`,
    // `rounded-bl`, `rounded-br`) and physical sides (`rounded-t`,
    // `rounded-r`, `rounded-b`, `rounded-l`) previously only resolved for
    // a handful of hardcoded size keywords (`-lg`, `-sm`, `-none`).
    // Arbitrary values and theme-extension sizes were silently dropped.
    it('rounded-tr-2xl resolves via the rule (not the fast-path table)', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-tr-2xl')
      expect(gen.toCSS(false)).toContain('border-top-right-radius: 1rem;')
    })

    it('rounded-bl-[6px] accepts arbitrary corner radii', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-bl-[6px]')
      expect(gen.toCSS(false)).toContain('border-bottom-left-radius: 6px;')
    })

    it('rounded-br-full uses full keyword', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-br-full')
      expect(gen.toCSS(false)).toContain('border-bottom-right-radius: 9999px;')
    })

    it('rounded-t-xl sets both top corners', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-t-xl')
      const css = gen.toCSS(false)
      expect(css).toContain('border-top-left-radius: 0.75rem;')
      expect(css).toContain('border-top-right-radius: 0.75rem;')
    })

    it('rounded-b-[8px] sets both bottom corners with arbitrary radius', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-b-[8px]')
      const css = gen.toCSS(false)
      expect(css).toContain('border-bottom-left-radius: 8px;')
      expect(css).toContain('border-bottom-right-radius: 8px;')
    })

    it('rounded-l-none zeroes left corners', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('rounded-l-none')
      const css = gen.toCSS(false)
      expect(css).toContain('border-top-left-radius: 0;')
      expect(css).toContain('border-bottom-left-radius: 0;')
    })
  })

  describe('Pseudo-class variants', () => {
    it('should generate hover variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.hover\\:bg-gray-500:hover {')
      expect(css).toContain('background-color: oklch(55.1% 0.027 264.364);')
    })

    it('should generate focus variant', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('focus:border-gray-300')
      const css = gen.toCSS(false)
      expect(css).toContain('.focus\\:border-gray-300:focus {')
    })

    it('should handle multiple variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:focus:bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':hover:focus')
    })
  })

  describe('Responsive variants', () => {
    it('should generate responsive utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('sm:flex')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 640px)')
      expect(css).toContain('.sm\\:flex {')
      expect(css).toContain('display: flex;')
    })

    it('should generate md breakpoint', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:p-8')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
    })

    it('should combine responsive and pseudo-class variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:hover:bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':hover')
    })
  })

  describe('Minification', () => {
    it('should generate minified CSS', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('p-4')
      gen.generate('m-2')
      const css = gen.toCSS(false, true)
      expect(css).not.toContain('\n')
      expect(css).not.toContain('  ')
      expect(css).toContain('.p-4{padding:1rem}')
      expect(css).toContain('.m-2{margin:0.5rem}')
    })
  })

  describe('Shortcuts', () => {
    it('should expand shortcuts', () => {
      const config = {
        ...defaultConfig,
        shortcuts: {
          btn: 'px-4 py-2 rounded bg-blue-500',
        },
      }
      const gen = new CSSGenerator(config)
      gen.generate('btn')
      const css = gen.toCSS(false)
      expect(css).toContain('padding-left: 1rem;')
      expect(css).toContain('padding-top: 0.5rem;')
      expect(css).toContain('border-radius: 0.25rem;')
    })

    // Issue #18: shortcut rules must target the shortcut's own class name —
    // markup carries `btn`, not `bg-blue-500` — and variant utilities inside
    // a definition must become pseudo-class / prefix / media rules on that
    // selector instead of being silently dropped.
    it('should emit rules under the shortcut selector', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: { btn: 'bg-blue-500 text-white' },
      })
      gen.generate('btn')
      const css = gen.toCSS(false)
      expect(css).toContain('.btn {')
      expect(css).not.toContain('.bg-blue-500')
      expect(css).not.toContain('.text-white')
    })

    it('should expand hover:/focus: variants onto the shortcut selector', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: { 'btn-primary': 'bg-blue-500 hover:bg-blue-700 focus:ring-2' },
      })
      gen.generate('btn-primary')
      const css = gen.toCSS(false)
      expect(css).toContain('.btn-primary:hover {')
      expect(css).toContain('.btn-primary:focus {')
      expect(css).not.toContain('.hover\\:bg-blue-700')
    })

    it('should expand dark: and responsive variants onto the shortcut selector', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: { btn: 'px-4 dark:bg-blue-900 md:px-8' },
      })
      gen.generate('btn')
      const css = gen.toCSS(false)
      expect(css).toContain('.dark .btn {')
      expect(css).toContain('@media (min-width: 768px)')
      expect(css.slice(css.indexOf('@media'))).toContain('.btn {')
    })

    it('should flatten nested shortcuts onto the outer selector', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: {
          'btn': 'px-4 hover:bg-blue-700',
          'btn-lg': 'btn py-3',
        },
      })
      gen.generate('btn-lg')
      const css = gen.toCSS(false)
      expect(css).toContain('.btn-lg {')
      expect(css).toContain('.btn-lg:hover {')
      expect(css).toContain('padding-top: 0.75rem;')
    })

    it('should survive shortcut cycles without hanging', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: { a: 'b px-4', b: 'a py-2' },
      })
      gen.generate('a')
      const css = gen.toCSS(false)
      expect(css).toContain('.a {')
      expect(css).toContain('padding-left: 1rem;')
      expect(css).toContain('padding-top: 0.5rem;')
    })

    it('should keep standalone utilities working alongside shortcut expansion', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: { btn: 'bg-blue-500 hover:bg-blue-700' },
      })
      // Standalone first, then shortcut, to prove neither direction is
      // swallowed by the class cache.
      gen.generate('bg-blue-500')
      gen.generate('btn')
      gen.generate('hover:bg-blue-700')
      const css = gen.toCSS(false)
      expect(css).toContain('.bg-blue-500 {')
      expect(css).toContain('.btn {')
      expect(css).toContain('.btn:hover {')
      expect(css).toContain('.hover\\:bg-blue-700:hover {')
    })

    it('should support array-form shortcut definitions', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        shortcuts: { card: ['p-4', 'rounded', 'hover:shadow-lg'] },
      })
      gen.generate('card')
      const css = gen.toCSS(false)
      expect(css).toContain('.card {')
      expect(css).toContain('.card:hover {')
    })

    // A shortcut used behind a variant (`md:card`) used to emit nothing: only
    // the exact class name was looked up, so the variant-prefixed name fell
    // through to the utility rules and matched none of them.
    describe('used behind a variant', () => {
      const shortcuts = {
        'card': 'bg-white dark:bg-slate-900 border rounded-xl p-5 hover:shadow-lg',
        'btn': 'px-4 hover:bg-blue-700',
        'btn-lg': 'btn py-3',
      }
      const cssFor = (...classes: string[]): string => {
        const gen = new CSSGenerator({ ...defaultConfig, shortcuts })
        for (const cls of classes)
          gen.generate(cls)
        return gen.toCSS(false)
      }
      const mediaBlock = (css: string, query: string): string => {
        const start = css.indexOf(`@media ${query} {`)
        expect(start).toBeGreaterThan(-1)
        // A media block closes with its last rule's brace and then its own.
        const end = css.indexOf('}\n}', start)
        return css.slice(start, end === -1 ? undefined : end + 3)
      }

      it('emits a responsive shortcut inside the breakpoint, on its own selector', () => {
        const css = cssFor('md:card')
        const md = mediaBlock(css, '(min-width: 768px)')
        expect(md).toContain('.md\\:card {')
        expect(md).toContain('background-color: #fff;')
        expect(md).toContain('border-radius: 0.75rem;')
        expect(md).toContain('padding: 1.25rem;')
        // Nothing leaks outside the media query, and no sub-utility selector
        // the markup never carries.
        expect(css.slice(0, css.indexOf('@media'))).toBe('')
        expect(css).not.toContain('.md\\:p-5')
        expect(css).not.toContain('.md\\:bg-white')
      })

      it('supports max-* breakpoints', () => {
        const md = mediaBlock(cssFor('max-md:card'), '(max-width: 767.98px)')
        expect(md).toContain('.max-md\\:card {')
        expect(md).toContain('padding: 1.25rem;')
      })

      it('combines the outer variant with variants inside the definition', () => {
        const md = mediaBlock(cssFor('md:card'), '(min-width: 768px)')
        // dark:bg-slate-900 applies only at md AND dark.
        expect(md).toContain('.dark .md\\:card {')
        expect(md).toContain('.md\\:card:hover {')
      })

      it('applies state and dark variants to the shortcut selector', () => {
        const hover = cssFor('hover:card')
        expect(hover).toContain('.hover\\:card:hover {')
        expect(hover).toContain('padding: 1.25rem;')

        const dark = cssFor('dark:card')
        expect(dark).toContain('.dark .dark\\:card {')
        expect(dark).toContain('padding: 1.25rem;')
        expect(dark).not.toContain('.dark\\:card {\n  padding')
      })

      it('accepts stacked variants in either order', () => {
        for (const cls of ['md:dark:card', 'dark:md:card']) {
          const md = mediaBlock(cssFor(cls), '(min-width: 768px)')
          expect(md).toContain(`.dark .${cls.replace(/:/g, '\\:')} {`)
          expect(md).toContain('padding: 1.25rem;')
        }
      })

      it('flattens nested shortcuts onto the variant selector', () => {
        const md = mediaBlock(cssFor('md:btn-lg'), '(min-width: 768px)')
        expect(md).toContain('.md\\:btn-lg {')
        expect(md).toContain('padding-left: 1rem;')
        expect(md).toContain('padding-top: 0.75rem;')
        expect(md).toContain('.md\\:btn-lg:hover {')
      })

      it('carries the important modifier in each supported position', () => {
        for (const cls of ['!card', 'md:!card', 'md:card!', '!md:card']) {
          const css = cssFor(cls)
          expect(css).toContain('padding: 1.25rem !important;')
          expect(css).toContain('border-radius: 0.75rem !important;')
          expect(css).not.toContain('!important !important')
        }
        expect(cssFor('!card')).toContain('.\\!card {')
        expect(mediaBlock(cssFor('md:!card'), '(min-width: 768px)')).toContain('.md\\:\\!card {')
      })

      it('expands a variant-prefixed shortcut inside another definition', () => {
        const gen = new CSSGenerator({
          ...defaultConfig,
          shortcuts: { 'tile': 'p-2 hover:raised', 'raised': 'shadow-lg', 'loop': 'p-1 hover:loop' },
        })
        gen.generate('tile')
        gen.generate('md:loop')
        const css = gen.toCSS(false)
        expect(css).toContain('.tile {')
        expect(css).toContain('.tile:hover {')
        expect(css).not.toContain('.hover\\:raised')
        // A shortcut that names itself behind a variant still terminates.
        expect(mediaBlock(css, '(min-width: 768px)')).toContain('.md\\:loop {')
      })

      it('generates nothing for an unknown base after a variant', () => {
        expect(cssFor('md:not-a-shortcut')).toBe('')
        expect(cssFor('hover:cardx')).toBe('')
      })

      it('keeps the plain shortcut unchanged next to its variant form', () => {
        const css = cssFor('card', 'md:card')
        expect(css).toContain('.card {')
        expect(css).toContain('.card:hover {')
        expect(css).toContain('.dark .card {')
        expect(mediaBlock(css, '(min-width: 768px)')).toContain('.md\\:card {')
      })
    })
  })

  describe('Blocklist', () => {
    it('should ignore blocklisted classes', () => {
      const config = {
        ...defaultConfig,
        blocklist: ['flex'],
      }
      const gen = new CSSGenerator(config)
      gen.generate('flex')
      const css = gen.toCSS(false)
      expect(css).not.toContain('display: flex;')
    })
  })
})

describe('CSSGenerator - Edge Cases', () => {
  it('should handle empty class name', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('')
    const css = gen.toCSS(false)
    // Should not crash
    expect(css).toBeDefined()
  })

  it('should handle undefined utility', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('nonexistent-utility-xyz')
    const css = gen.toCSS(false)
    // Should not generate CSS for unknown utility
    expect(css).not.toContain('nonexistent-utility-xyz')
  })

  it('should handle conflicting utilities', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('p-4')
    gen.generate('p-8')
    const css = gen.toCSS(false)
    // Both should be in CSS (last one wins in cascade)
    expect(css).toContain('padding: 1rem;')
    expect(css).toContain('padding: 2rem;')
  })

  it('should handle same class generated multiple times', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('p-4')
    gen.generate('p-4')
    gen.generate('p-4')
    const css = gen.toCSS(false)
    // Should merge into single rule
    const matches = css.match(/\.p-4/g)
    expect(matches?.length).toBe(1)
  })

  it('should handle very long selector', () => {
    const gen = new CSSGenerator(defaultConfig)
    const longClass = `${'a'.repeat(500)}-4`
    gen.generate(longClass)
    const css = gen.toCSS(false)
    expect(css).toBeDefined()
  })

  it('should handle special characters in selector escaping', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('hover:p-4')
    const css = gen.toCSS(false)
    expect(css).toContain('.hover\\:p-4:hover')
  })

  it('should handle multiple variants on same utility', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('hover:p-4')
    gen.generate('focus:p-4')
    gen.generate('active:p-4')
    const css = gen.toCSS(false)
    expect(css).toContain(':hover')
    expect(css).toContain(':focus')
    expect(css).toContain(':active')
  })

  it('should handle important modifier with zero value', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('!m-0')
    const css = gen.toCSS(false)
    expect(css).toContain('margin: 0 !important;')
  })

  it('should handle important with arbitrary value', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('!w-[500px]')
    const css = gen.toCSS(false)
    expect(css).toContain('width: 500px !important;')
  })

  it('should handle negative zero margin', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('-m-0')
    const css = gen.toCSS(false)
    expect(css).toContain('margin: 0;') // -0 is normalized to 0
  })

  it('should handle fraction resulting in zero', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('w-0/100')
    const css = gen.toCSS(false)
    expect(css).toContain('width: 0%;')
  })

  it('should handle very small fraction', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('w-1/1000')
    const css = gen.toCSS(false)
    expect(css).toContain('width: 0.1%;')
  })

  it('should handle arbitrary value with calc', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('w-[calc(100vw-2rem)]')
    const css = gen.toCSS(false)
    expect(css).toContain('width: calc(100vw - 2rem);')
  })

  it('should handle arbitrary value with CSS variables', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('w-[var(--custom-width)]')
    const css = gen.toCSS(false)
    expect(css).toContain('width: var(--custom-width);')
  })

  it('should handle responsive variant at largest breakpoint', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('2xl:p-4')
    const css = gen.toCSS(false)
    expect(css).toContain('@media (min-width: 1536px)')
  })

  it('should handle mixed responsive and pseudo-class variants', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:hover:focus:p-4')
    const css = gen.toCSS(false)
    expect(css).toContain('@media (min-width: 768px)')
    expect(css).toContain(':hover:focus')
  })

  it('should handle dark mode with responsive', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('dark:lg:hover:bg-gray-900')
    const css = gen.toCSS(false)
    expect(css).toContain('.dark')
    expect(css).toContain('@media (min-width: 1024px)')
    expect(css).toContain(':hover')
  })

  it('should handle group variant with multiple states', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('group-hover:group-focus:bg-blue-500')
    const css = gen.toCSS(false)
    // Should handle last group variant
    expect(css).toContain('.group:')
  })

  it('should handle peer variant with complex selector', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('peer-checked:peer-focus:bg-red-500')
    const css = gen.toCSS(false)
    expect(css).toContain('.peer:')
    expect(css).toContain('~')
  })

  it('should handle child selector utilities', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('space-x-4')
    const css = gen.toCSS(false)
    expect(css).toContain('> :not([hidden]) ~ :not([hidden])')
  })

  it('should handle minified output with special characters', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('hover:focus:bg-[#ff0000]')
    const css = gen.toCSS(false, true)
    expect(css).not.toContain('\n')
    expect(css).not.toContain('  ')
  })

  it('should handle color with three-digit hex', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('bg-[#f00]')
    const css = gen.toCSS(false)
    expect(css).toContain('background-color: #f00;')
  })

  it('should handle color with rgba', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('bg-[rgba(255,0,0,0.5)]')
    const css = gen.toCSS(false)
    expect(css).toContain('background-color: rgba(255,0,0,0.5);')
  })

  it('should handle arbitrary property with important', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('![display:grid]')
    const css = gen.toCSS(false)
    expect(css).toContain('display: grid !important;')
  })

  it('should handle multiple classes with same selector different properties', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('p-4')
    gen.generate('m-4')
    const css = gen.toCSS(false)
    expect(css).toContain('padding: 1rem;')
    expect(css).toContain('margin: 1rem;')
  })

  it('should escape forward slash in fractions', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('w-1/2')
    const css = gen.toCSS(false)
    expect(css).toContain('.w-1\\/2')
  })

  it('should escape dots and brackets in arbitrary values', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('text-[1.5rem]')
    const css = gen.toCSS(false)
    // Check selector escaping for the class (both brackets and dots should be escaped)
    expect(css).toContain('.text-\\[1\\.5rem\\]')
  })

  it('should handle all variants disabled', () => {
    const config = {
      ...defaultConfig,
      variants: {
        ...defaultConfig.variants,
        hover: false,
        focus: false,
      },
    }
    const gen = new CSSGenerator(config)
    gen.generate('hover:p-4')
    const css = gen.toCSS(false)
    // Should still generate but without :hover
    expect(css).toBeDefined()
  })

  it('should handle reset and regenerate', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('p-4')
    gen.reset()
    gen.generate('m-4')
    const css = gen.toCSS(false)
    expect(css).toContain('margin: 1rem;')
    expect(css).not.toContain('padding: 1rem;')
  })

  it('should handle preflight CSS with minification', () => {
    const gen = new CSSGenerator(defaultConfig)
    const css = gen.toCSS(true)
    expect(css).toContain('box-sizing')
  })

  describe('Extreme Edge Cases', () => {
    it('should handle generating the same class 1000 times', () => {
      const gen = new CSSGenerator(defaultConfig)
      for (let i = 0; i < 1000; i++) {
        gen.generate('w-4')
      }
      const css = gen.toCSS(false)
      // Should only have one .w-4 rule
      const matches = css.match(/\.w-4\s*\{/g) || []
      expect(matches.length).toBe(1)
    })

    it('should handle generating invalid utilities without crashing', () => {
      const gen = new CSSGenerator(defaultConfig)
      expect(() => gen.generate('')).not.toThrow()
      expect(() => gen.generate('   ')).not.toThrow()
      expect(() => gen.generate('invalid-utility-xyz-123')).not.toThrow()
      expect(() => gen.generate('!!!!!')).not.toThrow()
      expect(() => gen.generate(':::::')).not.toThrow()
    })

    it('should handle generating utilities with null/undefined-like names', () => {
      const gen = new CSSGenerator(defaultConfig)
      expect(() => gen.generate('null')).not.toThrow()
      expect(() => gen.generate('undefined')).not.toThrow()
      expect(() => gen.generate('false')).not.toThrow()
    })

    it('should handle very long arbitrary values', () => {
      const gen = new CSSGenerator(defaultConfig)
      const longValue = 'a'.repeat(1000)
      gen.generate(`w-[${longValue}]`)
      const css = gen.toCSS(false)
      expect(css).toContain(longValue)
    })

    it('should handle generating arbitrary property with colon in value', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('[background-image:url(http://example.com)]')
      const css = gen.toCSS(false)
      expect(css.length).toBeGreaterThan(0)
    })

    it('should handle malformed arbitrary syntax', () => {
      const gen = new CSSGenerator(defaultConfig)
      expect(() => gen.generate('w-[')).not.toThrow() // Missing closing bracket
      expect(() => gen.generate('w-]')).not.toThrow() // Missing opening bracket
      expect(() => gen.generate('w-[[]]')).not.toThrow() // Double brackets
      expect(() => gen.generate('w-[[]')).not.toThrow() // Unbalanced
    })

    it('should handle generating with no config theme colors', () => {
      const gen = new CSSGenerator({ ...defaultConfig, theme: { ...defaultConfig.theme, colors: {} } })
      gen.generate('bg-blue-500')
      gen.generate('text-red-500')
      // Should not crash even if colors don't exist
      expect(() => gen.toCSS(false)).not.toThrow()
    })

    it('should handle generating with no spacing scale', () => {
      const gen = new CSSGenerator({ ...defaultConfig, theme: { ...defaultConfig.theme, spacing: {} } })
      gen.generate('p-4')
      gen.generate('m-8')
      // Should fall back to raw values
      expect(() => gen.toCSS(false)).not.toThrow()
    })

    it('should handle important modifier on invalid utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('!invalid-utility-name')
      expect(() => gen.toCSS(false)).not.toThrow()
    })

    it('should handle multiple variants on invalid utility', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('sm:md:lg:invalid-utility')
      expect(() => gen.toCSS(false)).not.toThrow()
    })
  })
})

describe('important modifier isolation', () => {
  // addRule must not mutate the properties object it receives: custom rules
  // and static utility maps hand out shared references, and an in-place
  // ' !important' append poisoned every later use of the same object
  // (stacking suffixes across generator instances).
  it('does not mutate shared custom-rule objects', () => {
    const SHARED: Record<string, string> = { color: 'red' }
    const config = {
      ...defaultConfig,
      rules: [[/^!?myred$/, () => SHARED]] as any,
    }

    const genA = new CSSGenerator(config)
    genA.generate('!myred')
    expect(genA.toCSS(false)).toContain('color: red !important;')
    expect(SHARED.color).toBe('red')

    // A second instance generating the important form must not double-append
    const genB = new CSSGenerator(config)
    genB.generate('!myred')
    expect(genB.toCSS(false)).toContain('color: red !important;')
    expect(genB.toCSS(false)).not.toContain('!important !important')

    // The plain form stays non-important
    const genC = new CSSGenerator(config)
    genC.generate('myred')
    expect(genC.toCSS(false)).toContain('color: red;')
    expect(genC.toCSS(false)).not.toContain('!important')
  })
})

describe('selector escaping completeness', () => {
  // The escape set previously missed & ? { } ; < $ | — selector-significant
  // characters that appear in arbitrary values (URL query strings, content
  // strings). An unescaped & is the CSS nesting selector.
  it('escapes ? and & in arbitrary content values', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate("content-['a?b&c']")
    const css = gen.toCSS(false)
    expect(css).toContain('.content-\\[\\\'a\\?b\\&c\\\'\\]')
    expect(css).not.toMatch(/\.content-\\\[\\'a\?b&c/)
  })

  it('escapes $ and ; in arbitrary property selectors', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('[mask:url(a?b=1&c=2)]')
    const css = gen.toCSS(false)
    if (css.trim()) {
      expect(css).toContain('\\?')
      expect(css).toContain('\\&')
    }
  })

  it('leaves plain and variant selectors untouched', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('hover:bg-blue-500')
    expect(gen.toCSS(false)).toContain('.hover\\:bg-blue-500:hover')
  })
})

describe('static utilities under variants', () => {
  // The static-map fast path keyed on parsed.raw (variants included), so
  // every static-map-only utility emitted NOTHING under any variant.
  it('generates hover/dark/responsive variants of static utilities', () => {
    const cases: Array<[string, string]> = [
      ['hover:underline', '.hover\\:underline:hover'],
      ['dark:italic', '.dark .dark\\:italic'],
      ['md:cursor-pointer', '@media (min-width: 768px)'],
      ['group-hover:truncate', '.group:hover .group-hover\\:truncate'],
      ['focus:sr-only', '.focus\\:sr-only:focus'],
    ]
    for (const [cls, expected] of cases) {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate(cls)
      const out = gen.toCSS(false)
      expect(out).toContain(expected)
      expect(out.trim()).not.toBe('')
    }
  })

  it('handles the important marker after variants (md:!uppercase)', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:!uppercase')
    const out = gen.toCSS(false)
    expect(out).toContain('text-transform: uppercase !important;')
    expect(out).toContain('@media (min-width: 768px)')
  })

  it('tracks keyframes for variant animations', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('hover:animate-spin')
    const out = gen.toCSS(false)
    expect(out).toContain('.hover\\:animate-spin:hover')
    expect(out).toContain('@keyframes spin')
  })
})

describe('media query ordering', () => {
  it('emits breakpoints mobile-first regardless of generation order', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['lg:p-4', 'sm:p-4', 'md:p-4'])
    const out = gen.toCSS(false)
    const sm = out.indexOf('min-width: 640px')
    const md = out.indexOf('min-width: 768px')
    const lg = out.indexOf('min-width: 1024px')
    expect(sm).toBeGreaterThan(-1)
    expect(sm).toBeLessThan(md)
    expect(md).toBeLessThan(lg)
  })

  it('keeps base rules before media blocks', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['md:p-8', 'p-4'])
    const out = gen.toCSS(false)
    expect(out.indexOf('.p-4')).toBeLessThan(out.indexOf('@media'))
  })
})

describe('max-* variants and media type ordering', () => {
  it('max-md applies below the breakpoint', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('max-md:flex')
    const out = gen.toCSS(false)
    expect(out).toContain('@media (max-width: 767.98px)')
    expect(out).toContain('.max-md\\:flex')
  })

  it('max-* stacks with pseudo variants', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('max-lg:hover:underline')
    const out = gen.toCSS(false)
    expect(out).toContain('@media (max-width: 1023.98px)')
    expect(out).toContain(':hover')
  })

  it('puts the print media type before feature conditions', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:print:flex')
    expect(gen.toCSS(false)).toContain('@media print and (min-width: 768px)')
  })
})

describe('unknown and arbitrary variants', () => {
  it('drops rules with unknown variants instead of applying unconditionally', () => {
    for (const cls of ['foo:flex', 'hoveer:underline', 'xxl:p-4']) {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate(cls)
      expect(gen.toCSS(false).trim()).toBe('')
    }
  })

  it('supports arbitrary selector variants with &', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['[&>li]:flex', '[&_p]:underline', '[&:hover]:italic'])
    const out = gen.toCSS(false)
    expect(out).toContain('.\\[\\&\\>li\\]\\:flex>li {')
    expect(out).toContain('.\\[\\&_p\\]\\:underline p {')
    expect(out).toContain('.\\[\\&\\:hover\\]\\:italic:hover {')
  })

  it('supports arbitrary media variants', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('[@media(min-width:900px)]:flex')
    const out = gen.toCSS(false)
    expect(out).toContain('@media (min-width:900px)')
    expect(out).toContain('display: flex;')
  })
})

describe('stacked at-rule variants and dark mode strategy', () => {
  it('nests @media and @supports when stacked', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('md:supports-[display:grid]:flex')
    const out = gen.toCSS(false)
    const media = out.indexOf('@media (min-width: 768px)')
    const supports = out.indexOf('@supports (display: grid)')
    expect(media).toBeGreaterThan(-1)
    expect(supports).toBeGreaterThan(media)
    expect(out).toContain('display: flex;')
  })

  it('nests @media and @container when stacked', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('@sm:print:hidden')
    const out = gen.toCSS(false)
    expect(out).toContain('@media print')
    expect(out).toContain('@container (width >= 24rem)')
  })

  it('keeps single supports/container variants working', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['supports-[display:grid]:grid', '@md:flex'])
    const out = gen.toCSS(false)
    expect(out).toContain('@supports (display: grid)')
    expect(out).toContain('@container (width >= 28rem)')
  })

  it('darkMode media emits prefers-color-scheme instead of a class prefix', () => {
    const gen = new CSSGenerator({ ...defaultConfig, darkMode: 'media' })
    gen.generateBatch(['dark:bg-blue-500', 'light:flex'])
    const out = gen.toCSS(false)
    expect(out).toContain('@media (prefers-color-scheme: dark)')
    expect(out).toContain('@media (prefers-color-scheme: light)')
    expect(out).not.toContain('.dark .')
  })

  it('darkMode defaults to the class strategy', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('dark:bg-blue-500')
    expect(gen.toCSS(false)).toContain('.dark .dark\\:bg-blue-500')
  })
})

describe('presets', () => {
  it('applies preset shortcuts, rules, and theme (user config wins)', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      shortcuts: { btn: 'p-2' },
      presets: [{
        name: 'test-preset',
        theme: { extend: { colors: { brand: '#123456' } } } as any,
        shortcuts: { 'btn': 'p-8', 'card': 'p-4 rounded' },
        rules: [[/^glow$/, () => ({ 'box-shadow': '0 0 8px gold' })]] as any,
      }],
    })
    gen.generateBatch(['btn', 'card', 'glow', 'bg-brand'])
    const css = gen.toCSS(false)
    // preset shortcut works
    expect(css).toContain('.card {')
    expect(css).toContain('border-radius: 0.25rem;')
    // user shortcut overrides the preset's btn
    expect(css).toContain('padding: 0.5rem;')
    expect(css).not.toContain('padding: 2rem;')
    // preset custom rule works
    expect(css).toContain('box-shadow: 0 0 8px gold;')
    // preset theme works
    expect(css).toContain('background-color: #123456;')
  })
})

describe('reset', () => {
  it('clears compiled-class state so groups regenerate after reset', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateCompiledClass('tc-x1', ['p-4'])
    expect(gen.toCSS(false)).toContain('.tc-x1 {')
    gen.reset()
    expect(gen.toCSS(false)).not.toContain('.tc-x1')
    gen.generateCompiledClass('tc-x1', ['p-4'])
    expect(gen.toCSS(false)).toContain('.tc-x1 {')
  })
})

describe('theme overrides reach the fast paths', () => {
  it('honors theme.spacing overrides for p-4', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: { ...defaultConfig.theme, spacing: { ...defaultConfig.theme.spacing, 4: '2rem' } },
    })
    gen.generate('p-4')
    expect(gen.toCSS(false)).toContain('padding: 2rem;')
  })

  it('honors theme.colors overrides for bg-blue-500', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: {
        ...defaultConfig.theme,
        colors: { ...defaultConfig.theme.colors, blue: { ...(defaultConfig.theme.colors.blue as Record<string, string>), 500: '#123456' } },
      },
    })
    gen.generate('bg-blue-500')
    expect(gen.toCSS(false)).toContain('background-color: #123456;')
  })

  it('honors theme.borderRadius and theme.boxShadow overrides', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: {
        ...defaultConfig.theme,
        borderRadius: { ...defaultConfig.theme.borderRadius, sm: '9rem' },
        boxShadow: { ...defaultConfig.theme.boxShadow, sm: '0 0 9px red' },
      },
    })
    gen.generateBatch(['rounded-sm', 'shadow-sm'])
    const out = gen.toCSS(false)
    expect(out).toContain('border-radius: 9rem;')
    expect(out).toContain('0 0 9px red')
  })

  it('fast-path color copies match the theme (indigo-950, pink-300)', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['bg-indigo-950', 'text-pink-300'])
    const out = gen.toCSS(false)
    expect(out).toContain('oklch(25.7% 0.09 281.288)')
    expect(out).toContain('oklch(82.3% 0.12 346.018)')
  })
})

describe('utility cascade ranking', () => {
  const emitOrder = (classes: string[]): number[] => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(classes)
    const css = gen.toCSS(false)
    return classes.map(c => css.indexOf(`.${c.replace('!', '\\!')}`))
  }

  it('ranks important shorthands before important axis utilities', () => {
    const [mxAuto, m0] = emitOrder(['!mx-auto', '!m-0'])
    expect(m0).toBeLessThan(mxAuto)
  })

  it('ranks rounded edges before corners', () => {
    const [tl, t] = emitOrder(['rounded-tl-lg', 'rounded-t-md'])
    expect(t).toBeLessThan(tl)
  })

  it('ranks gap shorthand before gap-x/gap-y', () => {
    const [gx, g] = emitOrder(['gap-x-8', 'gap-4'])
    expect(g).toBeLessThan(gx)
  })

})

/**
 * Icon utilities rank below every other utility.
 *
 * An `i-{collection}-{name}` rule's width, height, display and
 * background-color are DEFAULTS — `width: 1em` exists so a bare icon has a
 * size at all, not to outrank the `w-5` beside it in the same class list.
 * Both are single-class selectors, so specificity ties and source order
 * decides; emitted last, the icon won and every explicit size was ignored.
 * The visible failure is an icon next to text in a flex row: it kept `1em`,
 * could not hold its width against a greedy sibling, and collapsed to a few
 * pixels.
 *
 * Asserted against `computeUtilityRank` rather than through generated CSS on
 * purpose. Emitting an icon needs its `@iconify-json` collection installed,
 * and without one the icon produces no CSS at all — an ordering assertion
 * over `indexOf` then passes because the missing selector returns -1, which
 * is a green test that proves nothing.
 */
describe('icon utility ranking', () => {
  it('ranks an icon below a plain utility', () => {
    expect(computeUtilityRank('.i-lucide-check')).toBeLessThan(computeUtilityRank('.w-5'))
    expect(computeUtilityRank('.i-lucide-check')).toBeLessThan(computeUtilityRank('.block'))
    expect(computeUtilityRank('.i-lucide-check')).toBeLessThan(computeUtilityRank('.bg-red-500'))
    expect(computeUtilityRank('.i-lucide-check')).toBeLessThan(computeUtilityRank('.align-middle'))
  })

  it('ranks an icon below axis and side utilities', () => {
    expect(computeUtilityRank('.i-lucide-check')).toBeLessThan(computeUtilityRank('.mx-auto'))
    expect(computeUtilityRank('.i-lucide-check')).toBeLessThan(computeUtilityRank('.mt-2'))
  })

  it('ranks a hyphenated collection the same as a single-segment one', () => {
    expect(computeUtilityRank('.i-simple-icons-bluesky')).toBe(computeUtilityRank('.i-lucide-check'))
    expect(computeUtilityRank('.i-material-symbols-home-outline')).toBe(computeUtilityRank('.i-lucide-check'))
  })

  it('ranks a variant-prefixed icon the same as a bare one', () => {
    expect(computeUtilityRank(String.raw`.md\:i-lucide-check`)).toBe(computeUtilityRank('.i-lucide-check'))
    expect(computeUtilityRank(String.raw`.dark\:i-lucide-check`)).toBe(computeUtilityRank('.i-lucide-check'))
  })

  // The ranker sees only a selector, so it must not read a utility as an icon
  // on the strength of a leading `i`.
  it('does not mistake a non-icon utility for an icon', () => {
    for (const cls of ['.items-center', '.inset-x-0', '.inline-block', '.invisible', '.italic', '.isolate'])
      expect(computeUtilityRank(cls)).toBeGreaterThanOrEqual(0)
  })

  it('leaves the existing shorthand-before-axis order intact', () => {
    expect(computeUtilityRank('.m-0')).toBeLessThan(computeUtilityRank('.mx-auto'))
    expect(computeUtilityRank('.mx-auto')).toBeLessThan(computeUtilityRank('.mt-2'))
  })
})

describe('cssVariables scope', () => {
  it('does not dump the stock palette into :root', () => {
    const gen = new CSSGenerator({ ...defaultConfig, cssVariables: true })
    gen.generate('p-4')
    const out = gen.toCSS(false)
    expect(out).not.toContain('--slate-50')
    expect(out).not.toContain(':root')
  })

  it('emits only custom/overridden colors', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      cssVariables: true,
      theme: {
        ...defaultConfig.theme,
        colors: { ...defaultConfig.theme.colors, brand: 'var(--x)', blue: { ...(defaultConfig.theme.colors.blue as Record<string, string>), 500: '#123456' } },
      },
    })
    gen.generate('p-4')
    const out = gen.toCSS(false)
    expect(out).toContain('--brand: var(--x);')
    expect(out).toContain('--blue-500: #123456;')
    expect(out).not.toContain('--blue-400')
    expect(out).not.toContain('--slate-50')
  })
})

describe('touch-action composition', () => {
  it('touch-pan-x and touch-pan-y compose instead of clobbering', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['touch-pan-x', 'touch-pan-y'])
    const out = gen.toCSS(false)
    expect(out).toContain('--tc-pan-x: pan-x;')
    expect(out).toContain('--tc-pan-y: pan-y;')
    expect(out).toContain('touch-action: var(--tc-pan-x,) var(--tc-pan-y,) var(--tc-pinch-zoom,);')
  })

  it('touch-none stays a direct value', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('touch-none')
    expect(gen.toCSS(false)).toContain('touch-action: none;')
  })
})
