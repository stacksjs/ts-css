import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { parseClass } from '../../src/engine/parser'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Arbitrary properties with variants (ts-css#36)', () => {
  // A variant prefix used to make the whole class emit NOTHING. The bare form
  // worked and `hover:border-[red]` worked, so only the combination was lost —
  // no error, no warning, just missing CSS.
  describe('the reported reproduction', () => {
    const cases: [string, string][] = [
      ['hover:[border-color:red]', 'border-color:red'],
      ['focus:[outline:2px_solid_red]', 'outline:2px solid red'],
      ['md:[grid-template-columns:1fr_2fr]', 'grid-template-columns:1fr 2fr'],
      ['[color:inherit]', 'color:inherit'],
      ['hover:border-[red]', 'border-color:red'],
    ]

    for (const [className, declaration] of cases) {
      it(`should emit ${className}`, () => {
        expect(css(className)).toContain(declaration)
      })
    }
  })

  describe('the variant is actually applied, not just dropped', () => {
    it('should attach a state variant to the selector', () => {
      expect(css('hover:[border-color:red]')).toContain(':hover{border-color:red}')
    })

    it('should wrap a breakpoint variant in its media query', () => {
      const out = css('md:[color:red]')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain('color:red')
    })

    it('should keep the colon inside the brackets out of the variant split', () => {
      // The property's own colon must not be read as a variant separator.
      const parsed = parseClass('hover:[border-color:red]')
      expect(parsed.variants).toEqual(['hover'])
      expect(parsed.utility).toBe('border-color')
      expect(parsed.value).toBe('red')
    })
  })

  describe('every variant shape works, not just the simple ones', () => {
    // The fix peels variants with the bracket-aware splitter, so shapes that a
    // `[a-z-]+:` prefix pattern would miss work too.
    const cases: [string, string][] = [
      ['dark:[color:red]', 'color:red'],
      ['group-hover:[color:red]', 'color:red'],
      ['@sm:[color:red]', 'color:red'],
      ['*:[color:red]', 'color:red'],
      ['nth-[3n+1]:[color:red]', 'color:red'],
      ['data-[state=open]:[color:red]', 'color:red'],
      ['[&>p]:[color:red]', 'color:red'],
      ['not-first:[color:red]', 'color:red'],
      ['md:hover:[color:red]', 'color:red'],
    ]

    for (const [className, declaration] of cases) {
      it(`should emit ${className}`, () => {
        expect(css(className)).toContain(declaration)
      })
    }

    it('should stack a breakpoint and a state together', () => {
      const out = css('md:hover:[color:red]')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain(':hover')
    })
  })

  describe('important', () => {
    it('should support a leading bang', () => {
      expect(css('![color:red]')).toContain('!important')
    })

    it('should support a trailing bang', () => {
      expect(css('[color:red]!')).toContain('!important')
    })

    it('should support a bang between the variant and the property', () => {
      // `hover:![color:red]` puts the bang where the whole-class strip at the
      // top of parseClass cannot see it.
      const out = css('hover:![color:red]')
      expect(out).toContain(':hover')
      expect(out).toContain('!important')
    })
  })

  describe('underscores still become spaces', () => {
    it('should convert them under a variant too', () => {
      expect(css('hover:[background:center_/_cover]')).toContain('background:center / cover')
    })
  })
})

describe('Arbitrary property names are literal, not reinterpreted', () => {
  // Four CSS SHORTHAND names collide with a utility family, and whichever rule
  // owned that family used to claim them and emit the wrong longhand. The
  // escape hatch has to win: the property name is literal.
  const shorthands: [string, string][] = [
    ['[outline:2px_solid_red]', 'outline:2px solid red'],
    ['[border:1px_solid_red]', 'border:1px solid red'],
    ['[font:bold_12px_serif]', 'font:bold 12px serif'],
    ['[mask:none]', 'mask:none'],
  ]

  for (const [className, declaration] of shorthands) {
    it(`should emit ${className} literally`, () => {
      expect(css(className)).toContain(declaration)
    })
  }

  it('should not emit the longhand each utility family would have produced', () => {
    expect(css('[outline:2px_solid_red]')).not.toContain('outline-width')
    expect(css('[border:1px_solid_red]')).not.toContain('border-color')
    expect(css('[font:bold_12px_serif]')).not.toContain('font-weight')
    expect(css('[mask:none]')).not.toContain('mask-image')
  })

  it('should work with a variant as well', () => {
    expect(css('hover:[outline:2px_solid_red]')).toContain('outline:2px solid red')
    expect(css('hover:[mask:none]')).toContain('mask:none')
  })

  describe('the utility families themselves are untouched', () => {
    // Running the arbitrary-property rule first must not shadow the real
    // utilities, nor arbitrary VALUES, whose base does not start with `[`.
    const utilities: [string, string][] = [
      ['mask-none', 'mask-image:none'],
      ['mask-cover', 'mask-size:cover'],
      ['outline-2', 'outline-width:2px'],
      ['outline-dashed', 'outline-style:dashed'],
      ['border-2', 'border-width:2px'],
      ['font-bold', 'font-weight:700'],
      ['w-[100px]', 'width:100px'],
      ['border-[red]', 'border-color:red'],
    ]

    for (const [className, declaration] of utilities) {
      it(`should keep ${className} working`, () => {
        expect(css(className)).toContain(declaration)
      })
    }

    it('should keep the arbitrary value + modifier shape working', () => {
      const out = css('text-[14px]/[1.5]')
      expect(out).toContain('font-size:14px')
      expect(out).toContain('line-height:1.5')
    })
  })
})
