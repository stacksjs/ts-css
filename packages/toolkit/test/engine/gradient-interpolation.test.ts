import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Gradient colour-space interpolation', () => {
  describe('colour spaces', () => {
    it('should interpolate a linear gradient in oklch', () => {
      expect(css('bg-linear-to-r/oklch'))
        .toContain('linear-gradient(to right in oklch, var(--tc-gradient-stops))')
    })

    it('should interpolate an angled linear gradient', () => {
      expect(css('bg-linear-45/srgb'))
        .toContain('linear-gradient(45deg in srgb, var(--tc-gradient-stops))')
    })

    it('should interpolate a radial gradient with no position', () => {
      expect(css('bg-radial/oklch'))
        .toContain('radial-gradient(in oklch, var(--tc-gradient-stops))')
    })

    it('should accept the wider colour spaces', () => {
      expect(css('bg-linear-to-r/lab')).toContain('in lab')
      expect(css('bg-linear-to-r/display-p3')).toContain('in display-p3')
      expect(css('bg-linear-to-r/rec2020')).toContain('in rec2020')
    })
  })

  describe('hue interpolation keywords', () => {
    // A hue keyword only means anything in a polar space, so it implies OKLCH.
    const cases: [string, string][] = [
      ['bg-conic/decreasing', 'in oklch decreasing hue'],
      ['bg-radial/longer', 'in oklch longer hue'],
      ['bg-linear-to-r/increasing', 'in oklch increasing hue'],
      ['bg-linear-45/shorter', 'in oklch shorter hue'],
    ]

    for (const [className, expected] of cases) {
      it(`should expand ${className}`, () => {
        expect(css(className)).toContain(expected)
      })
    }
  })

  describe('conic start angle', () => {
    it('should generate bg-conic-180', () => {
      expect(css('bg-conic-180'))
        .toBe('.bg-conic-180{background-image:conic-gradient(from 180deg, var(--tc-gradient-stops))}')
    })

    it('should negate the angle', () => {
      expect(css('-bg-conic-90')).toContain('conic-gradient(from -90deg')
    })

    it('should combine an angle with an interpolation', () => {
      expect(css('bg-conic-180/srgb')).toContain('conic-gradient(from 180deg in srgb,')
    })

    it('should reject a non-numeric angle', () => {
      expect(css('bg-conic-abc')).toBe('')
    })
  })

  describe('rejection', () => {
    it('should generate nothing for an unknown modifier', () => {
      // Ignoring the modifier instead would silently compile this to a plain
      // sRGB gradient, hiding the typo.
      expect(css('bg-linear-to-r/bogus')).toBe('')
    })

    it('should generate nothing for an unknown direction', () => {
      expect(css('bg-linear-to-q/oklch')).toBe('')
    })
  })

  describe('must not disturb the existing gradient handling', () => {
    it('should leave the unmodified forms alone', () => {
      expect(css('bg-linear-to-r')).toBe('.bg-linear-to-r{background-image:linear-gradient(to right, var(--tc-gradient-stops))}')
      expect(css('bg-conic')).toBe('.bg-conic{background-image:conic-gradient(var(--tc-gradient-stops))}')
      expect(css('bg-radial')).toBe('.bg-radial{background-image:radial-gradient(var(--tc-gradient-stops))}')
    })

    it('should not interpolate by default', () => {
      // Tailwind defaults to oklab behind an @supports guard. A rule here
      // returns a flat property map and cannot emit a nested at-rule, so an
      // unguarded `in oklab` would break older browsers outright.
      // Interpolation stays opt-in.
      expect(css('bg-linear-to-r')).not.toContain('in oklab')
    })

    it('should leave this engine the bg-radial-at-* extension', () => {
      expect(css('bg-radial-at-t')).toContain('radial-gradient(at top,')
      expect(css('bg-conic-from-t')).toContain('conic-gradient(from 0deg at center,')
    })
  })

  describe('must not collide with the colour opacity modifier', () => {
    // `bg-red-500/50` also carries a slash. The gradient rule has to decline
    // it so the colour handling can take it.
    it('should keep bg-red-500/50 a colour', () => {
      expect(css('bg-red-500/50')).toContain('background-color:')
      expect(css('bg-red-500/50')).toContain('/ 0.5)')
    })

    it('should keep bg-white/10 a colour', () => {
      expect(css('bg-white/10')).toContain('background-color:')
    })

    it('should leave arbitrary background images alone', () => {
      expect(css('bg-[url(/a.png)]')).toContain('background-image:url(/a.png)')
    })
  })

  describe('variants', () => {
    it('should work under a breakpoint', () => {
      const out = css('md:bg-linear-to-r/oklch')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain('in oklch')
    })
  })
})
