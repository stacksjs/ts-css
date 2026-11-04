import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Group and Peer Variants', () => {
  describe('Group variants', () => {
    it('should generate group-hover', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-hover:bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.group:hover')
      expect(css).toContain('background-color: oklch(55.1% 0.027 264.364);')
    })

    it('should generate group-focus', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-focus:text-gray-800')
      const css = gen.toCSS(false)
      expect(css).toContain('.group:focus')
      expect(css).toContain('color: oklch(27.8% 0.033 256.848);')
    })

    it('should handle group with responsive and state', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('lg:group-hover:first:bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 1024px)')
      expect(css).toContain('.group:hover')
      expect(css).toContain(':first-child')
    })

    it('should handle group with new variants', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-hover:marker:text-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.group:hover')
      expect(css).toContain('::marker')
    })
  })

  describe('Peer variants', () => {
    it('should generate peer-checked', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('peer-checked:bg-gray-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.peer:checked')
      expect(css).toContain('background-color: oklch(55.1% 0.027 264.364);')
    })

    it('should generate peer-focus', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('peer-focus:border-gray-300')
      const css = gen.toCSS(false)
      expect(css).toContain('.peer:focus')
      expect(css).toContain('border-color: oklch(87.2% 0.01 258.338);')
    })

    it('should handle peer-checked with responsive', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('lg:peer-checked:bg-green-500')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 1024px)')
      expect(css).toContain('.peer:checked')
    })
  })

  describe('Named group variants', () => {
    it('should generate named group prefix: group/sidebar', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group/sidebar:hover:text-white')
      const css = gen.toCSS(false)
      expect(css).toContain('group\\/sidebar')
    })
  })

  describe('Named peer variants', () => {
    it('should generate named peer prefix: peer/input', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('peer/input:invalid:text-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain('peer\\/input')
    })
  })

  describe('group-has-* variants', () => {
    it('should generate group-has with arbitrary selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-has-[:checked]:bg-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.group:has(:checked)')
      expect(css).toContain('background-color')
    })

    it('should generate group-has with named pseudo', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-has-focus:text-white')
      const css = gen.toCSS(false)
      expect(css).toContain('.group:has(:focus)')
    })
  })

  describe('peer-has-* variants', () => {
    it('should generate peer-has with arbitrary selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('peer-has-[:checked]:text-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain('.peer:has(:checked) ~')
    })

    it('should generate peer-has with named pseudo', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('peer-has-focus:opacity-100')
      const css = gen.toCSS(false)
      expect(css).toContain('.peer:has(:focus) ~')
    })
  })

  /**
   * The name belongs to the class the ancestor or sibling carries, so it sits
   * on `.group`/`.peer` and the pseudo-class follows it. Putting it after the
   * pseudo-class instead (`.group:hover/section`) is not a selector a browser
   * parses, so the whole rule is dropped silently and whatever the utility was
   * meant to override keeps winning.
   *
   * Each case also asserts the broken shape is absent, because `toContain`
   * alone passes on it: `.group:hover/section` contains `.group:hover`.
   */
  describe('Named group and peer variants place the name on the group class', () => {
    it('should generate group-hover/section', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-hover/section:opacity-100')
      const css = gen.toCSS(false)
      expect(css).toContain('.group\\/section:hover .group-hover\\/section\\:opacity-100')
      expect(css).not.toContain(':hover/')
    })

    it('should generate peer-checked/draft', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('peer-checked/draft:block')
      const css = gen.toCSS(false)
      expect(css).toContain('.peer\\/draft:checked ~ .peer-checked\\/draft\\:block')
      expect(css).not.toContain(':checked/')
    })

    it('should keep the name outside has(), with a named pseudo', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-has-checked/row:underline')
      const css = gen.toCSS(false)
      expect(css).toContain('.group\\/row:has(:checked)')
      expect(css).not.toContain('checked/row)')
    })

    it('should keep the name outside has(), with an arbitrary selector', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-has-[>img]/row:underline')
      const css = gen.toCSS(false)
      expect(css).toContain('.group\\/row:has(>img)')
      // Before the name was split off, the token no longer ended in `]`, so
      // the arbitrary branch never ran and this became `:has(:[>img]/row)`.
      expect(css).not.toContain(':has(:[')
    })

    it('should read a slash inside brackets as a value, not a name', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-data-[w=1/2]:underline')
      const css = gen.toCSS(false)
      expect(css).toContain('[data-w="1/2"]')
      expect(css).not.toContain('.group\\/')
    })

    it('should still split a name that follows a bracketed value', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-data-[w=1/2]/menu:underline')
      const css = gen.toCSS(false)
      expect(css).toContain('.group\\/menu[data-w="1/2"]')
    })

    it('should leave the unnamed forms alone', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generateBatch(['group-hover:opacity-100', 'peer-checked:block'])
      const css = gen.toCSS(false)
      expect(css).toContain('.group:hover .group-hover\\:opacity-100')
      expect(css).toContain('.peer:checked ~ .peer-checked\\:block')
      expect(css).not.toContain('.group\\/')
      expect(css).not.toContain('.peer\\/')
    })
  })

  /**
   * The condition is resolved, not pasted after a colon. `.group:first` and
   * `.group:data-[state=open]` are not selectors, so the browser dropped the
   * rule and the utility silently never applied. Checked against a real
   * tailwindcss 4.3.3 build, allowing for the descendant-prefix shape this
   * engine uses in place of Tailwind's `:is(:where(...))`.
   */
  describe('Group and peer conditions resolve to real selectors', () => {
    const CONDITIONS: Array<[string, string]> = [
      ['group-first:underline', '.group:first-child '],
      ['group-last:underline', '.group:last-child '],
      ['group-odd:underline', '.group:nth-child(odd) '],
      ['group-even:underline', '.group:nth-child(even) '],
      ['group-data-[state=open]:underline', '.group[data-state="open"] '],
      ['group-data-open:underline', '.group[data-open] '],
      ['group-aria-[sort=ascending]:underline', '.group[aria-sort="ascending"] '],
      ['group-aria-checked:underline', '.group[aria-checked="true"] '],
      ['group-[.sidebar]:underline', '.group:is(.sidebar) '],
      ['peer-first:underline', '.peer:first-child ~ '],
      ['peer-data-[state=on]:block', '.peer[data-state="on"] ~ '],
      ['peer-[.dark]:underline', '.peer:is(.dark) ~ '],
    ]

    for (const [candidate, expected] of CONDITIONS) {
      it(`should resolve ${candidate}`, () => {
        const gen = new CSSGenerator(defaultConfig)
        gen.generate(candidate)
        const css = gen.toCSS(false)
        expect(css).toContain(expected)
        // The old shape pasted the token on as a pseudo-class.
        expect(css).not.toContain(':data-')
        expect(css).not.toContain(':aria-')
        expect(css).not.toContain(':[')
      })
    }

    /**
     * A `&` is the group element, which the prefix already names, so it drops
     * out. `in-*` turns it into `*` because it has no class to anchor to, and
     * `.group*.is-open` would not parse.
     */
    it('should resolve an & in an arbitrary selector to the group itself', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-[&.is-open]:underline')
      const css = gen.toCSS(false)
      expect(css).toContain('.group.is-open ')
      expect(css).not.toContain('.group*')
    })

    /**
     * Resolution is fail-closed, and isVariantHandled asks the same question,
     * so the rule is dropped whole. Were only the prefix lost, the utility
     * would become an always-on rule -- worse than the invalid selector.
     */
    it('should emit nothing for a condition it cannot resolve', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generateBatch(['group-bogus:underline', 'peer-bogus:underline'])
      const css = gen.toCSS(false)
      expect(css).not.toContain('bogus')
      expect(css).not.toContain('text-decoration-line')
    })

    /** A pseudo-element cannot be the group, however valid a variant it is. */
    it('should not accept a pseudo-element as a condition', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('group-before:underline')
      const css = gen.toCSS(false)
      expect(css).not.toContain('::before')
      expect(css).not.toContain('text-decoration-line')
    })
  })
})
