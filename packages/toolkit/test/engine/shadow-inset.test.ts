import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

const STACK = 'box-shadow:var(--tc-inset-shadow, 0 0 #0000), var(--tc-inset-ring-shadow, 0 0 #0000), var(--tc-ring-offset-shadow, 0 0 #0000), var(--tc-ring-shadow, 0 0 #0000), var(--tc-shadow, 0 0 #0000)'

describe('inset-shadow utilities', () => {
  describe('the named scale', () => {
    const cases: [string, string][] = [
      ['inset-shadow-2xs', 'inset 0 1px'],
      ['inset-shadow-xs', 'inset 0 1px 1px'],
      ['inset-shadow-sm', 'inset 0 2px 4px'],
    ]

    for (const [className, geometry] of cases) {
      it(`should generate ${className}`, () => {
        const out = css(className)
        expect(out).toContain(`--tc-inset-shadow:${geometry} var(--tc-inset-shadow-color, rgb(0 0 0 / 0.05))`)
      })
    }

    it('should re-declare the whole layer stack', () => {
      // Any one of these may be the only shadow utility on the element.
      expect(css('inset-shadow-sm')).toContain(STACK)
    })

    it('should stop at sm — the scale has no md or lg', () => {
      // inset-shadow-md is not a Tailwind class, so it must generate nothing
      // rather than fall through to a bogus shadow.
      expect(css('inset-shadow-md')).toBe('')
      expect(css('inset-shadow-lg')).toBe('')
    })

    it('should reject the bare utility', () => {
      expect(css('inset-shadow')).toBe('')
    })
  })

  describe('inset-shadow-none', () => {
    it('should reset the layer to a transparent shadow', () => {
      expect(css('inset-shadow-none')).toContain('--tc-inset-shadow:inset 0 0 #0000')
    })
  })

  describe('colours', () => {
    it('should set only the colour variable, not the shadow', () => {
      // A colour utility must not clobber the geometry set by the scale.
      const out = css('inset-shadow-blue-500')
      expect(out).toContain('--tc-inset-shadow-color:')
      expect(out).not.toContain('--tc-inset-shadow:')
      expect(out).not.toContain('box-shadow')
    })

    it('should support an opacity modifier', () => {
      expect(css('inset-shadow-blue-500/50')).toContain('/ 0.5)')
    })

    it('should accept a bracketed colour', () => {
      expect(css('inset-shadow-[#ff0000]')).toContain('--tc-inset-shadow-color:#ff0000')
    })

    it('should let a colour override the scale default', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('inset-shadow-sm')
      gen.generate('inset-shadow-blue-500')
      const out = gen.toCSS(false, true)
      // The geometry references the variable the colour utility sets.
      expect(out).toContain('var(--tc-inset-shadow-color, rgb(0 0 0 / 0.05))')
      expect(out).toContain('--tc-inset-shadow-color:oklch(62.3% 0.214 259.815)')
    })
  })

  describe('arbitrary shadows', () => {
    it('should wrap a trailing colour in the override variable', () => {
      expect(css('inset-shadow-[2px_2px_4px_black]'))
        .toContain('--tc-inset-shadow:inset 2px 2px 4px var(--tc-inset-shadow-color, black)')
    })

    it('should fall back to currentcolor when the value has no colour', () => {
      expect(css('inset-shadow-[2px_2px_4px]'))
        .toContain('--tc-inset-shadow:inset 2px 2px 4px var(--tc-inset-shadow-color, currentcolor)')
    })

    it('should always prepend the inset keyword', () => {
      expect(css('inset-shadow-[2px_2px_4px]')).toContain('--tc-inset-shadow:inset 2px')
    })
  })

  describe('must not disturb the positioning utilities', () => {
    // inset-shadow-* shares the `inset-` prefix with inset positioning, so
    // the rule claims only values beginning `shadow`.
    it('should leave inset-0 alone', () => {
      expect(css('inset-0')).toBe('.inset-0{top:0;right:0;bottom:0;left:0}')
    })

    it('should leave inset-x-4 alone', () => {
      expect(css('inset-x-4')).toContain('left:1rem')
    })

    it('should leave inset-auto alone', () => {
      expect(css('inset-auto')).toContain('top:auto')
    })
  })

  describe('composition', () => {
    it('should layer with an outer shadow rather than replace it', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('shadow-md')
      gen.generate('inset-shadow-sm')
      const out = gen.toCSS(false, true)
      expect(out).toContain('--tc-shadow:0 4px 6px -1px')
      expect(out).toContain('--tc-inset-shadow:inset 0 2px 4px')
    })

    it('should work under a variant', () => {
      const out = css('hover:inset-shadow-sm')
      expect(out).toContain(':hover')
      expect(out).toContain('--tc-inset-shadow:inset 0 2px 4px')
    })
  })
})

describe('inset-ring utilities', () => {
  describe('widths', () => {
    it('should default the bare utility to 1px', () => {
      expect(css('inset-ring'))
        .toContain('--tc-inset-ring-shadow:inset 0 0 0 1px var(--tc-inset-ring-color, currentcolor)')
    })

    const widths = ['0', '1', '2', '3', '4', '8']
    for (const w of widths) {
      it(`should generate inset-ring-${w}`, () => {
        expect(css(`inset-ring-${w}`)).toContain(`inset 0 0 0 ${w}px`)
      })
    }

    it('should accept any bare number, not just the 0/1/2/4/8 scale', () => {
      // inset-ring-3 is a valid Tailwind class.
      expect(css('inset-ring-3')).toContain('inset 0 0 0 3px')
      expect(css('inset-ring-5')).toContain('inset 0 0 0 5px')
    })

    it('should accept an arbitrary width', () => {
      expect(css('inset-ring-[3px]')).toContain('inset 0 0 0 3px')
    })

    it('should re-declare the whole layer stack', () => {
      expect(css('inset-ring-2')).toContain(STACK)
    })

    it('should default the colour to currentcolor', () => {
      expect(css('inset-ring-2')).toContain('var(--tc-inset-ring-color, currentcolor)')
    })
  })

  describe('colours', () => {
    it('should set only the colour variable', () => {
      const out = css('inset-ring-red-500')
      expect(out).toContain('--tc-inset-ring-color:')
      expect(out).not.toContain('--tc-inset-ring-shadow')
      expect(out).not.toContain('box-shadow')
    })

    it('should support an opacity modifier', () => {
      expect(css('inset-ring-white/50')).toContain('/ 0.5)')
    })

    it('should accept a bracketed colour', () => {
      expect(css('inset-ring-[#ff0000]')).toContain('--tc-inset-ring-color:#ff0000')
    })

    it('should let a colour override the default', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('inset-ring-2')
      gen.generate('inset-ring-red-500')
      const out = gen.toCSS(false, true)
      expect(out).toContain('var(--tc-inset-ring-color, currentcolor)')
      expect(out).toContain('--tc-inset-ring-color:oklch(63.7% 0.237 25.331)')
    })
  })

  describe('rejection', () => {
    it('should generate nothing for an unknown value', () => {
      expect(css('inset-ring-bogus')).toBe('')
    })
  })

  describe('composition across all four layers', () => {
    it('should let an outer shadow, ring, inset shadow and inset ring coexist', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generateBatch(['shadow-md', 'ring-2', 'inset-shadow-sm', 'inset-ring-2'])
      const out = gen.toCSS(false, true)
      expect(out).toContain('--tc-shadow:0 4px 6px -1px')
      expect(out).toContain('--tc-ring-shadow:')
      expect(out).toContain('--tc-inset-shadow:inset 0 2px 4px')
      expect(out).toContain('--tc-inset-ring-shadow:inset 0 0 0 2px')
      // All four write into the same stack, so each is a separate layer
      // rather than one overwriting another.
      expect(out).toContain(STACK)
    })
  })
})

describe('drop-shadow and text-shadow colours', () => {
  describe('drop-shadow', () => {
    it('should route the scale colour through the override variable', () => {
      expect(css('drop-shadow-xl'))
        .toContain('drop-shadow(0 20px 13px var(--tc-drop-shadow-color, rgb(0 0 0 / 0.03)))')
    })

    it('should apply the variable to every layer of a multi-shadow', () => {
      // drop-shadow-xl is two stacked drop-shadow() functions; recolouring
      // only the first would look like a bug.
      const out = css('drop-shadow-xl')
      expect(out.match(/var\(--tc-drop-shadow-color,/g)?.length).toBe(2)
    })

    it('should set only the colour variable for a colour utility', () => {
      const out = css('drop-shadow-red-500')
      expect(out).toContain('--tc-drop-shadow-color:')
      expect(out).not.toContain('--tc-drop-shadow:')
      expect(out).not.toContain('filter:')
    })

    it('should support an opacity modifier', () => {
      expect(css('drop-shadow-red-500/50')).toContain('/ 0.5)')
    })

    it('should treat a bracketed colour as a colour', () => {
      expect(css('drop-shadow-[#f00]')).toContain('--tc-drop-shadow-color:#f00')
    })

    it('should treat a bracketed value with offsets as a whole shadow', () => {
      const out = css('drop-shadow-[0_1px_black]')
      expect(out).toContain('--tc-drop-shadow:drop-shadow(0 1px black)')
      expect(out).not.toContain('--tc-drop-shadow-color')
    })

    it('should leave the none reset uncoloured', () => {
      // A reset takes no colour.
      expect(css('drop-shadow-none')).toContain('drop-shadow(0 0 #0000)')
      expect(css('drop-shadow-none')).not.toContain('drop-shadow-color')
    })

    it('should keep the bare utility working', () => {
      expect(css('drop-shadow')).toContain('--tc-drop-shadow:drop-shadow(0 1px 2px')
    })

    it('should reject a non-colour word', () => {
      expect(css('drop-shadow-bogus')).toBe('')
    })

    it('should let a colour recolour the scale', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('drop-shadow-xl')
      gen.generate('drop-shadow-red-500')
      const out = gen.toCSS(false, true)
      expect(out).toContain('var(--tc-drop-shadow-color, rgb(0 0 0 / 0.03))')
      expect(out).toContain('--tc-drop-shadow-color:oklch(63.7% 0.237 25.331)')
    })
  })

  describe('text-shadow', () => {
    it('should route the scale colour through the override variable', () => {
      expect(css('text-shadow-sm'))
        .toContain('text-shadow:0 1px 2px var(--tc-text-shadow-color, rgba(0, 0, 0, 0.05))')
    })

    it('should set only the colour variable for a colour utility', () => {
      const out = css('text-shadow-blue-500')
      expect(out).toContain('--tc-text-shadow-color:')
      expect(out).not.toContain('text-shadow:')
    })

    it('should treat a bracketed colour as a colour', () => {
      expect(css('text-shadow-[#f00]')).toContain('--tc-text-shadow-color:#f00')
    })

    it('should treat a bracketed value with offsets as a whole shadow', () => {
      expect(css('text-shadow-[0_1px_black]')).toContain('text-shadow:0 1px black')
    })

    it('should leave the none reset uncoloured', () => {
      expect(css('text-shadow-none')).toBe('.text-shadow-none{text-shadow:none}')
    })

    it('should reject a non-colour word', () => {
      expect(css('text-shadow-bogus')).toBe('')
    })

    it('should let a colour recolour the scale', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-shadow-lg')
      gen.generate('text-shadow-blue-500')
      const out = gen.toCSS(false, true)
      expect(out).toContain('var(--tc-text-shadow-color, rgba(0, 0, 0, 0.05))')
      expect(out).toContain('--tc-text-shadow-color:oklch(62.3% 0.214 259.815)')
    })
  })
})

describe('the top of the box-shadow scale', () => {
  // shadow-2xl and shadow-inner were in the generator's static SHADOW_MAP but
  // absent from the theme's boxShadow scale — and the theme lookup is what
  // actually serves shadow-* once any scale value diverges from the static
  // map, so both generated nothing.
  it('should generate shadow-2xl', () => {
    expect(css('shadow-2xl')).toContain('--tc-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25)')
  })

  it('should generate shadow-inner as an inset shadow', () => {
    expect(css('shadow-inner')).toContain('--tc-shadow:inset 0 2px 4px 0 rgb(0 0 0 / 0.05)')
  })

  it('should give both a colored variant so shadow-<color> works', () => {
    expect(css('shadow-2xl')).toContain('--tc-shadow-colored:0 25px 50px -12px var(--tc-shadow-color)')
  })

  it('should keep the rest of the scale intact', () => {
    expect(css('shadow-xs')).toContain('--tc-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)')
    expect(css('shadow-xl')).toContain('--tc-shadow:0 20px 25px -5px')
    expect(css('shadow-none')).toContain('--tc-shadow:0 0 #0000')
  })
})
