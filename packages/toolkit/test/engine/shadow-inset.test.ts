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
