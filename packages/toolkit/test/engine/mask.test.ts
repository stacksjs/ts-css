import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Mask utilities (Tailwind v4 names)', () => {
  describe('mask-image', () => {
    it('should generate mask-none', () => {
      expect(css('mask-none')).toBe('.mask-none{mask-image:none}')
    })

    it('should pass an arbitrary url through', () => {
      expect(css('mask-[url(/m.png)]')).toContain('mask-image:url(/m.png)')
    })

    it('should pass an arbitrary gradient through', () => {
      expect(css('mask-[linear-gradient(black,transparent)]')).toContain('mask-image:linear-gradient(black,transparent)')
    })
  })

  describe('mask-composite', () => {
    const cases: [string, string][] = [
      ['mask-add', 'add'],
      ['mask-subtract', 'subtract'],
      ['mask-intersect', 'intersect'],
      ['mask-exclude', 'exclude'],
    ]
    for (const [className, value] of cases) {
      it(`should generate ${className}`, () => {
        expect(css(className)).toContain(`mask-composite:${value}`)
      })
    }
  })

  describe('mask-mode', () => {
    it('should generate mask-alpha', () => {
      expect(css('mask-alpha')).toContain('mask-mode:alpha')
    })

    it('should generate mask-luminance', () => {
      expect(css('mask-luminance')).toContain('mask-mode:luminance')
    })

    it('should map mask-match to the match-source keyword', () => {
      // The utility is `mask-match` but the CSS keyword is `match-source`.
      expect(css('mask-match')).toContain('mask-mode:match-source')
    })
  })

  describe('mask-size', () => {
    const cases: [string, string][] = [
      ['mask-auto', 'auto'],
      ['mask-cover', 'cover'],
      ['mask-contain', 'contain'],
    ]
    for (const [className, value] of cases) {
      it(`should generate ${className}`, () => {
        expect(css(className)).toContain(`mask-size:${value}`)
      })
    }

    it('should keep the longhand arbitrary form working', () => {
      expect(css('mask-size-[50%]')).toContain('mask-size:50%')
    })
  })

  describe('mask-position', () => {
    const cases: [string, string][] = [
      ['mask-center', 'center'],
      ['mask-top', 'top'],
      ['mask-right', 'right'],
      ['mask-bottom', 'bottom'],
      ['mask-left', 'left'],
    ]
    for (const [className, value] of cases) {
      it(`should generate ${className}`, () => {
        expect(css(className)).toContain(`mask-position:${value}`)
      })
    }

    it('should emit corners in x-then-y order', () => {
      // Tailwind emits `left top`, not `top left`.
      expect(css('mask-top-left')).toContain('mask-position:left top')
      expect(css('mask-top-right')).toContain('mask-position:right top')
      expect(css('mask-bottom-left')).toContain('mask-position:left bottom')
      expect(css('mask-bottom-right')).toContain('mask-position:right bottom')
    })
  })

  describe('mask-repeat', () => {
    const cases: [string, string][] = [
      ['mask-repeat', 'repeat'],
      ['mask-no-repeat', 'no-repeat'],
      ['mask-repeat-x', 'repeat-x'],
      ['mask-repeat-y', 'repeat-y'],
      ['mask-repeat-space', 'space'],
      ['mask-repeat-round', 'round'],
    ]
    for (const [className, value] of cases) {
      it(`should generate ${className}`, () => {
        expect(css(className)).toContain(`mask-repeat:${value}`)
      })
    }

    it('should not confuse the axis forms with the keyword forms', () => {
      // mask-repeat-x parses as the `mask-repeat` utility with value `x`,
      // which the longhand keyword table did not cover.
      expect(css('mask-repeat-x')).toContain('repeat-x')
      expect(css('mask-repeat-y')).toContain('repeat-y')
    })
  })

  describe('mask-clip', () => {
    it('should generate mask-no-clip', () => {
      expect(css('mask-no-clip')).toContain('mask-clip:no-clip')
    })

    it('should keep the longhand spellings working', () => {
      expect(css('mask-clip-border')).toContain('mask-clip:border-box')
      expect(css('mask-clip-content')).toContain('mask-clip:content-box')
    })
  })

  describe('untouched longhand utilities', () => {
    it('should keep mask-origin-* working', () => {
      expect(css('mask-origin-border')).toContain('mask-origin:border-box')
    })

    it('should keep mask-type-* working', () => {
      expect(css('mask-type-alpha')).toContain('mask-type:alpha')
    })
  })

  describe('rejection', () => {
    it('should generate nothing for an unknown mask value', () => {
      expect(css('mask-bogus')).toBe('')
    })

    it('should not wrap a bare word in url()', () => {
      // A bare word would become a bogus relative request.
      expect(css('mask-foo')).toBe('')
    })
  })

  describe('variants', () => {
    it('should work under a breakpoint', () => {
      const out = css('md:mask-cover')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain('mask-size:cover')
    })

    it('should work under hover', () => {
      expect(css('hover:mask-none')).toContain(':hover')
    })
  })
})

describe('Gradient masks: linear and edges', () => {
  describe('the composed mask-image', () => {
    it('should compose all three gradient layers', () => {
      // Every gradient mask utility re-declares this, because any one of
      // them may be the only mask utility on the element.
      const out = css('mask-linear-45')
      expect(out).toContain('--tc-mask-linear,')
      expect(out).toContain('--tc-mask-radial,')
      expect(out).toContain('--tc-mask-conic,')
      expect(out).toContain('mask-composite:intersect')
    })

    it('should default an unset layer to an opaque white gradient', () => {
      // The identity mask. A layer nobody set must not hide anything, and
      // without @property the default has to travel in a var() fallback.
      expect(css('mask-linear-45')).toContain('var(--tc-mask-radial, linear-gradient(#fff, #fff))')
    })
  })

  describe('mask-linear-<angle>', () => {
    it('should set the angle through calc', () => {
      expect(css('mask-linear-45')).toContain('--tc-mask-linear-position:calc(1deg * 45)')
    })

    it('should negate the angle for the -mask- form', () => {
      expect(css('-mask-linear-45')).toContain('--tc-mask-linear-position:calc(1deg * -45)')
    })

    it('should let a stop list override the bare angle', () => {
      // --tc-mask-linear-stops wins when set; the angle is the fallback.
      expect(css('mask-linear-45')).toContain('linear-gradient(var(--tc-mask-linear-stops, var(--tc-mask-linear-position, 0deg)))')
    })
  })

  describe('mask-linear-from/to', () => {
    it('should set a position stop', () => {
      expect(css('mask-linear-from-20%')).toContain('--tc-mask-linear-from-position:20%')
    })

    it('should set a to position stop', () => {
      expect(css('mask-linear-to-80%')).toContain('--tc-mask-linear-to-position:80%')
    })

    it('should set a colour stop from the theme', () => {
      expect(css('mask-linear-from-black')).toContain('--tc-mask-linear-from-color:#000')
    })

    it('should build the full stop list', () => {
      const out = css('mask-linear-from-20%')
      expect(out).toContain('--tc-mask-linear-stops:var(--tc-mask-linear-position, 0deg)')
      expect(out).toContain('var(--tc-mask-linear-from-color, black)')
      expect(out).toContain('var(--tc-mask-linear-to-color, transparent)')
    })

    it('should reject a negative sign on a stop', () => {
      expect(css('-mask-linear-from-20%')).toBe('')
    })
  })

  describe('edge masks', () => {
    const sides: [string, string][] = [
      ['mask-t-from-50%', 'top'],
      ['mask-r-from-50%', 'right'],
      ['mask-b-from-50%', 'bottom'],
      ['mask-l-from-50%', 'left'],
    ]

    for (const [className, side] of sides) {
      it(`should build the ${side} layer for ${className}`, () => {
        const out = css(className)
        expect(out).toContain(`--tc-mask-${side}:linear-gradient(to ${side},`)
        expect(out).toContain(`--tc-mask-${side}-from-position:50%`)
      })
    }

    it('should compose the four edge layers into --tc-mask-linear', () => {
      const out = css('mask-t-from-50%')
      expect(out).toContain('--tc-mask-linear:var(--tc-mask-left,')
      expect(out).toContain('var(--tc-mask-top, linear-gradient(#fff, #fff))')
    })

    it('should resolve a colour stop on an edge', () => {
      expect(css('mask-r-from-black')).toContain('--tc-mask-right-from-color:#000')
    })

    it('should resolve a transparent to-stop', () => {
      expect(css('mask-l-to-transparent')).toContain('--tc-mask-left-to-color:transparent')
    })

    it('should resolve a bare number through the spacing scale', () => {
      // 20 * 0.25rem. Tailwind writes calc(var(--spacing) * 20); this engine
      // resolves spacing to a concrete length everywhere, as p-8 does.
      expect(css('mask-b-from-20')).toContain('--tc-mask-bottom-from-position:5rem')
    })
  })

  describe('axis shorthands', () => {
    it('should expand mask-x-* to right and left', () => {
      const out = css('mask-x-from-10%')
      expect(out).toContain('--tc-mask-right-from-position:10%')
      expect(out).toContain('--tc-mask-left-from-position:10%')
      expect(out).not.toContain('--tc-mask-top-from-position')
    })

    it('should expand mask-y-* to top and bottom', () => {
      const out = css('mask-y-to-90%')
      expect(out).toContain('--tc-mask-top-to-position:90%')
      expect(out).toContain('--tc-mask-bottom-to-position:90%')
      expect(out).not.toContain('--tc-mask-right-to-position')
    })
  })

  describe('rejection and non-shadowing', () => {
    it('should generate nothing for an unknown edge stop', () => {
      expect(css('mask-t-bogus')).toBe('')
    })

    it('should generate nothing for an unknown side', () => {
      expect(css('mask-z-from-10%')).toBe('')
    })

    it('should not let the edge rule shadow the position presets', () => {
      // `mask-bottom-right` must stay a mask-position, not be read as an
      // edge named `bottom`.
      expect(css('mask-bottom-right')).toContain('mask-position:right bottom')
      expect(css('mask-top')).toContain('mask-position:top')
    })

    it('should not let the edge rule shadow mask-no-repeat', () => {
      expect(css('mask-no-repeat')).toContain('mask-repeat:no-repeat')
    })
  })

  describe('variants', () => {
    it('should work under a breakpoint', () => {
      const out = css('md:mask-t-from-50%')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain('--tc-mask-top-from-position:50%')
    })
  })
})

describe('Gradient masks: radial and conic', () => {
  describe('radial stops', () => {
    it('should build the radial stop list with all three shape variables', () => {
      const out = css('mask-radial-from-50%')
      expect(out).toContain('var(--tc-mask-radial-shape, ellipse)')
      expect(out).toContain('var(--tc-mask-radial-size, farthest-corner)')
      expect(out).toContain('at var(--tc-mask-radial-position, center)')
      expect(out).toContain('--tc-mask-radial:radial-gradient(var(--tc-mask-radial-stops))')
    })

    it('should set a position stop', () => {
      expect(css('mask-radial-from-50%')).toContain('--tc-mask-radial-from-position:50%')
    })

    it('should set a colour stop', () => {
      expect(css('mask-radial-from-black')).toContain('--tc-mask-radial-from-color:#000')
    })

    it('should set a to stop', () => {
      expect(css('mask-radial-to-80%')).toContain('--tc-mask-radial-to-position:80%')
    })
  })

  describe('radial shape, size and position', () => {
    it('should set the shape from mask-circle and mask-ellipse', () => {
      expect(css('mask-circle')).toBe('.mask-circle{--tc-mask-radial-shape:circle}')
      expect(css('mask-ellipse')).toBe('.mask-ellipse{--tc-mask-radial-shape:ellipse}')
    })

    it('should emit only the variable, with no composed mask-image', () => {
      // These are modifiers on a radial mask, not masks in their own right.
      expect(css('mask-circle')).not.toContain('mask-image')
      expect(css('mask-radial-closest-side')).not.toContain('mask-image')
      expect(css('mask-radial-at-center')).not.toContain('mask-image')
    })

    const sizes = ['closest-side', 'closest-corner', 'farthest-side', 'farthest-corner']
    for (const size of sizes) {
      it(`should set the size for mask-radial-${size}`, () => {
        expect(css(`mask-radial-${size}`)).toContain(`--tc-mask-radial-size:${size}`)
      })
    }

    it('should accept an arbitrary size', () => {
      const out = css('mask-radial-[50%_50%]')
      expect(out).toContain('--tc-mask-radial-size:50% 50%')
      // An arbitrary size DOES compose, unlike the keyword sizes.
      expect(out).toContain('mask-composite:intersect')
    })

    it('should keep the token word order for positions', () => {
      // `top left` here, where mask-position reorders to `left top`.
      expect(css('mask-radial-at-top-left')).toContain('--tc-mask-radial-position:top left')
      expect(css('mask-radial-at-bottom-right')).toContain('--tc-mask-radial-position:bottom right')
      expect(css('mask-radial-at-center')).toContain('--tc-mask-radial-position:center')
    })
  })

  describe('conic', () => {
    it('should set the start angle through calc', () => {
      expect(css('mask-conic-180')).toContain('--tc-mask-conic-position:calc(1deg * 180)')
    })

    it('should negate the angle for the -mask- form', () => {
      expect(css('-mask-conic-90')).toContain('--tc-mask-conic-position:calc(1deg * -90)')
    })

    it('should build the conic stop list with the from keyword', () => {
      const out = css('mask-conic-from-50%')
      expect(out).toContain('--tc-mask-conic-stops:from var(--tc-mask-conic-position, 0deg)')
      expect(out).toContain('--tc-mask-conic:conic-gradient(var(--tc-mask-conic-stops))')
      expect(out).toContain('--tc-mask-conic-from-position:50%')
    })

    it('should set a colour stop', () => {
      expect(css('mask-conic-from-black')).toContain('--tc-mask-conic-from-color:#000')
    })

    it('should reject a negative sign on a stop', () => {
      expect(css('-mask-conic-from-50%')).toBe('')
    })
  })

  describe('rejection', () => {
    it('should generate nothing for an unknown radial value', () => {
      expect(css('mask-radial-bogus')).toBe('')
    })

    it('should generate nothing for an unknown radial position', () => {
      expect(css('mask-radial-at-bogus')).toBe('')
    })

    it('should generate nothing for an unknown conic value', () => {
      expect(css('mask-conic-bogus')).toBe('')
    })
  })

  describe('composition across families', () => {
    it('should let a radial mask and a shape modifier combine', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('mask-radial-from-50%')
      gen.generate('mask-circle')
      const out = gen.toCSS(false, true)
      expect(out).toContain('--tc-mask-radial-from-position:50%')
      expect(out).toContain('--tc-mask-radial-shape:circle')
    })

    it('should let linear, radial and conic masks coexist', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('mask-linear-from-20%')
      gen.generate('mask-radial-from-50%')
      gen.generate('mask-conic-from-10%')
      const out = gen.toCSS(false, true)
      expect(out).toContain('--tc-mask-linear-from-position:20%')
      expect(out).toContain('--tc-mask-radial-from-position:50%')
      expect(out).toContain('--tc-mask-conic-from-position:10%')
    })
  })
})
