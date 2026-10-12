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
