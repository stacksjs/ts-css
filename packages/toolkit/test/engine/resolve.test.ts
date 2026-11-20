/**
 * Resolving utilities for a renderer that is not a browser.
 *
 * stx's native compiler carried its own copy of the utility table, and the
 * two drifted. Measured against each other, native dropped the line-height a
 * `text-*` utility sets, resolved `leading-*` and `tracking-*` against a fixed
 * 16px rather than the font size, carried Tailwind v3 colours where the web has
 * v4, and dropped `hover:`, `active:` and `focus:` without a word. These are
 * what a native renderer needs to ask the engine instead (stacksjs/ts-css#38).
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { colorToHex, resolveColor, resolveLength, resolveLineHeight, resolveUtility } from '../../src/engine/resolve'

const gen = () => new CSSGenerator(defaultConfig)

describe('resolveUtility', () => {
  /** Structured, so a renderer never parses a selector back apart. */
  it('should give the variants as written, outermost first', () => {
    const [rule] = resolveUtility('dark:active:bg-red-500', gen())
    expect(rule?.variants).toEqual(['dark', 'active'])
    expect(rule?.properties).toEqual({ 'background-color': 'oklch(63.7% 0.237 25.331)' })
  })

  /** The line-height native was dropping is right there in the answer. */
  it('should carry every declaration a utility sets', () => {
    const [rule] = resolveUtility('text-sm', gen())
    expect(rule?.properties).toEqual({ 'font-size': '0.875rem', 'line-height': '1.25rem' })
  })

  it('should carry the media query of a responsive variant', () => {
    const [rule] = resolveUtility('md:p-4', gen())
    expect(rule?.variants).toEqual(['md'])
    expect(rule?.mediaQuery).toBe('@media (min-width: 768px)')
  })

  it('should carry the child selector of a utility aimed at children', () => {
    const [rule] = resolveUtility('space-x-2', gen())
    expect(rule?.childSelector).toBeDefined()
  })

  /** Left in the value, `!important` would make `1rem` unreadable as a length. */
  it('should report importance as a flag, not in the value', () => {
    const [rule] = resolveUtility('!p-4', gen())
    expect(rule?.important).toBe(true)
    expect(rule?.properties).toEqual({ padding: '1rem' })
  })

  /** The same answer the browser gets: no rule, for the renderer to report. */
  it('should resolve a class the engine rejects to nothing', () => {
    expect(resolveUtility('bogus-thing', gen())).toEqual([])
  })

  /**
   * A variant a renderer has no equivalent for still comes back, by name, so
   * it can be reported -- dropping it is what native was doing.
   */
  it('should return a group variant for the renderer to judge', () => {
    const [rule] = resolveUtility('group-hover/section:opacity-100', gen())
    expect(rule?.variants).toEqual(['group-hover/section'])
  })
})

describe('resolveLength', () => {
  it('should resolve rem against the root font size', () => {
    expect(resolveLength('1.25rem')).toBe(20)
    expect(resolveLength('1rem', { rootFontSize: 18 })).toBe(18)
  })

  /** `tracking-wide` at 14pt; native used a fixed 16 and got 0.4. */
  it('should resolve em against the element font size', () => {
    expect(resolveLength('0.025em', { fontSize: 14 })).toBeCloseTo(0.35)
  })

  it('should take px as points and a bare zero as zero', () => {
    expect(resolveLength('12px')).toBe(12)
    expect(resolveLength('0')).toBe(0)
  })

  it('should not reduce what it cannot resolve', () => {
    expect(resolveLength('calc(1rem + 2px)')).toBeUndefined()
    expect(resolveLength('50%')).toBeUndefined()
    expect(resolveLength('var(--gap)')).toBeUndefined()
    expect(resolveLength('3')).toBeUndefined()
  })
})

describe('resolveLineHeight', () => {
  /** `text-sm leading-tight`: native multiplied by a fixed 16 and got 20. */
  it('should multiply a unitless value by the font size', () => {
    expect(resolveLineHeight('1.25', 14)).toBeCloseTo(17.5)
  })

  it('should resolve a length as a length', () => {
    expect(resolveLineHeight('1.25rem', 14)).toBe(20)
    expect(resolveLineHeight('24px', 14)).toBe(24)
  })
})

describe('resolveColor', () => {
  /**
   * Tailwind publishes an sRGB hex fallback for each v4 colour, which makes an
   * independent check of the whole oklch conversion.
   */
  it('should match Tailwind\'s published sRGB fallbacks', () => {
    expect(colorToHex(resolveColor('oklch(63.7% 0.237 25.331)', 'srgb')!)).toBe('#fb2c36')
    expect(colorToHex(resolveColor('oklch(62.3% 0.214 259.815)', 'srgb')!)).toBe('#2b7fff')
    expect(colorToHex(resolveColor('oklch(92.9% 0.013 255.508)', 'srgb')!)).toBe('#e2e8f0')
  })

  /** The v4 palette was built in P3: two in five colours fall outside sRGB. */
  it('should default an oklch colour to Display P3', () => {
    const color = resolveColor('oklch(63.7% 0.237 25.331)')!
    expect(color.space).toBe('display-p3')
    for (const channel of [color.r, color.g, color.b]) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(1)
    }
  })

  it('should keep every default palette colour inside P3', () => {
    let checked = 0
    for (const shades of Object.values(defaultConfig.theme.colors)) {
      if (typeof shades !== 'object')
        continue
      for (const value of Object.values(shades)) {
        const color = resolveColor(String(value))
        if (!color)
          continue
        checked++
        expect(Math.min(color.r, color.g, color.b)).toBeGreaterThanOrEqual(0)
        expect(Math.max(color.r, color.g, color.b)).toBeLessThanOrEqual(1)
      }
    }
    expect(checked).toBeGreaterThan(200)
  })

  it('should map white to white in either space', () => {
    for (const space of ['srgb', 'display-p3'] as const) {
      const white = resolveColor('oklch(100% 0 0)', space)!
      expect(white.r).toBeCloseTo(1)
      expect(white.g).toBeCloseTo(1)
      expect(white.b).toBeCloseTo(1)
    }
  })

  it('should read alpha as a fraction or a percentage', () => {
    expect(resolveColor('oklch(50% 0.1 120 / 50%)')!.alpha).toBe(0.5)
    expect(resolveColor('oklch(50% 0.1 120 / 0.25)')!.alpha).toBe(0.25)
  })

  it('should leave hex in sRGB, short and long forms alike', () => {
    expect(resolveColor('#fff')).toEqual({ space: 'srgb', r: 1, g: 1, b: 1, alpha: 1 })
    expect(colorToHex(resolveColor('#eeeeee')!)).toBe('#eeeeee')
    expect(colorToHex(resolveColor('#00000080')!)).toBe('#00000080')
  })

  it('should not resolve what is not a literal colour', () => {
    expect(resolveColor('currentColor')).toBeUndefined()
    expect(resolveColor('var(--brand)')).toBeUndefined()
    expect(resolveColor('red')).toBeUndefined()
  })
})
