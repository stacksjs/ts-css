import type { CSSGenerator } from './generator'
import { parseClass } from './parser'

/**
 * Resolving utilities for a renderer that is not a browser.
 *
 * A native renderer cannot read a stylesheet, so it has historically carried
 * its own copy of the utility table -- stx's native compiler re-parses class
 * names against a hardcoded palette. Two implementations of the same semantics
 * drift: measured against each other, native dropped the line-height a
 * `text-*` utility sets, resolved `leading-*` and `tracking-*` against a fixed
 * 16px instead of the font size, carried Tailwind v3 colours where the web has
 * v4, and silently dropped `hover:`, `active:` and `focus:`.
 *
 * This lets such a renderer ask the engine instead, so there is one source of
 * semantics. It answers in CSS terms -- declarations, and the variants that
 * condition them -- and leaves mapping a CSS property onto a native one to the
 * renderer, which is the only part that is genuinely platform-specific. It
 * also resolves the two kinds of value a native renderer cannot interpret on
 * its own: lengths relative to a font size, and oklch colours.
 */

export interface ResolvedUtility {
  /**
   * The variants conditioning this rule, as written and outermost first:
   * `dark:active:bg-red-500` is `['dark', 'active']`. Given structured so a
   * renderer never has to parse them back out of a selector, and given AS
   * WRITTEN so a variant it has no equivalent for can be reported by name
   * rather than dropped.
   */
  variants: string[]
  /**
   * The declarations, as the stylesheet carries them less `!important`,
   * which is reported in `important` instead -- left in the value, it would
   * make `1rem !important` unreadable as a length.
   */
  properties: Record<string, string>
  /** The at-rule wrapping the rule, for a responsive or feature variant. */
  mediaQuery?: string
  /** A descendant the rule targets rather than the element: `space-x-*`. */
  childSelector?: string
  /** Whether the class was written with `!`. */
  important: boolean
}

/**
 * Resolve one class into the rules it generates.
 *
 * An empty result means the engine generates nothing for the class -- a typo,
 * or a utility it rejects. A renderer should report that rather than guess,
 * which is the same answer the browser gets: no rule.
 */
export function resolveUtility(className: string, generator: CSSGenerator): ResolvedUtility[] {
  const rules = generator.rulesFor(className)
  if (rules.length === 0)
    return []
  const parsed = parseClass(className)
  return rules.map(rule => ({
    variants: [...parsed.variants],
    properties: withoutImportant(rule.properties),
    ...(rule.mediaQuery ? { mediaQuery: rule.mediaQuery } : {}),
    ...(rule.childSelector ? { childSelector: rule.childSelector } : {}),
    important: parsed.important,
  }))
}

function withoutImportant(properties: Record<string, string>): Record<string, string> {
  const plain: Record<string, string> = {}
  for (const [property, value] of Object.entries(properties))
    plain[property] = value.replace(/\s*!important\s*$/i, '')
  return plain
}

export interface LengthContext {
  /** The element's own font size, in points. `em` resolves against this. */
  fontSize?: number
  /** The root font size, in points. `rem` resolves against this. Defaults to 16. */
  rootFontSize?: number
}

const LENGTH = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem|em)?$/

/**
 * A CSS length in points, or undefined when it is not a plain length.
 *
 * `em` resolves against the element's own font size, which is what
 * `tracking-wide` (`0.025em`) means. Native had been resolving it against a
 * fixed 16, so any text that was not 16 points got the wrong spacing.
 *
 * Anything this cannot reduce to a number -- `calc()`, a percentage, a
 * variable -- is undefined, for the renderer to report.
 */
export function resolveLength(value: string, context: LengthContext = {}): number | undefined {
  const match = LENGTH.exec(value.trim())
  if (match === null)
    return undefined
  const amount = Number.parseFloat(match[1]!)
  const root = context.rootFontSize ?? 16
  switch (match[2]) {
    case 'rem':
      return amount * root
    case 'em':
      return amount * (context.fontSize ?? root)
    case 'px':
      return amount
    default:
      // A bare number is a length only when it is zero.
      return amount === 0 ? 0 : undefined
  }
}

/**
 * A `line-height` in points.
 *
 * Unlike other properties, a unitless line-height is a multiplier of the font
 * size: `leading-tight` is `1.25`, so `text-sm leading-tight` is 17.5 points.
 * Native had been multiplying by a fixed 16 and getting 20.
 */
export function resolveLineHeight(value: string, fontSize: number, rootFontSize = 16): number | undefined {
  const trimmed = value.trim()
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed))
    return Number.parseFloat(trimmed) * fontSize
  return resolveLength(trimmed, { fontSize, rootFontSize })
}

export interface ResolvedColor {
  space: 'srgb' | 'display-p3'
  /** Channels from 0 to 1, already gamma-encoded for the space. */
  r: number
  g: number
  b: number
  alpha: number
}

type Vector = [number, number, number]

function multiply(m: readonly Vector[], v: Vector): Vector {
  return [
    m[0]![0] * v[0] + m[0]![1] * v[1] + m[0]![2] * v[2],
    m[1]![0] * v[0] + m[1]![1] * v[1] + m[1]![2] * v[2],
    m[2]![0] * v[0] + m[2]![1] * v[1] + m[2]![2] * v[2],
  ]
}

// CSS Color 4's conversions: OKLab to linear-light LMS, LMS to XYZ (D65), and
// XYZ to each target space. Both spaces share the sRGB transfer function.
const OKLAB_TO_LMS: readonly Vector[] = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
]
const LMS_TO_XYZ: readonly Vector[] = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
]
const XYZ_TO_LINEAR_SRGB: readonly Vector[] = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
]
const XYZ_TO_LINEAR_P3: readonly Vector[] = [
  [446124 / 178915, -333277 / 357830, -72051 / 178915],
  [-14852 / 17905, 63121 / 35810, 423 / 17905],
  [11844 / 330415, -50337 / 660830, 316169 / 330415],
]

function encode(channel: number): number {
  const clamped = Math.min(1, Math.max(0, channel))
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
}

function parseAlpha(value: string | undefined): number {
  if (value === undefined)
    return 1
  return value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value)
}

const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i
const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i

/**
 * A colour as channels a native renderer can hand to its colour type.
 *
 * Hex stays sRGB. An oklch colour -- every palette colour in Tailwind v4 --
 * is converted into `space`, Display P3 by default, because the palette was
 * built in P3: 95 of the default 242 lie outside sRGB and none outside P3, and
 * a browser on a P3 display renders them unclamped. Converting to sRGB would
 * clamp two in five of them, reintroducing the very mismatch with the browser
 * this exists to remove. Pass `'srgb'` for a renderer with no wide-gamut
 * colour type.
 *
 * Undefined for anything else (`currentColor`, a variable, a named colour),
 * which the renderer resolves or reports.
 */
export function resolveColor(value: string, space: 'srgb' | 'display-p3' = 'display-p3'): ResolvedColor | undefined {
  const trimmed = value.trim()

  const hex = HEX.exec(trimmed)
  if (hex !== null) {
    let digits = hex[1]!
    if (digits.length <= 4)
      digits = [...digits].map(d => d + d).join('')
    const channel = (at: number) => Number.parseInt(digits.slice(at, at + 2), 16) / 255
    return { space: 'srgb', r: channel(0), g: channel(2), b: channel(4), alpha: digits.length === 8 ? channel(6) : 1 }
  }

  const oklch = OKLCH.exec(trimmed)
  if (oklch !== null) {
    const lightness = Number.parseFloat(oklch[1]!) / (oklch[2] === '%' ? 100 : 1)
    const chroma = Number.parseFloat(oklch[3]!)
    const hue = Number.parseFloat(oklch[4]!) * Math.PI / 180
    const lab: Vector = [lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)]
    const lms = multiply(OKLAB_TO_LMS, lab).map(c => c ** 3) as Vector
    const xyz = multiply(LMS_TO_XYZ, lms)
    const linear = multiply(space === 'srgb' ? XYZ_TO_LINEAR_SRGB : XYZ_TO_LINEAR_P3, xyz)
    return { space, r: encode(linear[0]), g: encode(linear[1]), b: encode(linear[2]), alpha: parseAlpha(oklch[5]) }
  }

  return undefined
}

/** `#rrggbb`, or `#rrggbbaa` when not opaque. Meaningful for an sRGB colour. */
export function colorToHex(color: ResolvedColor): string {
  const byte = (channel: number) => Math.round(Math.min(1, Math.max(0, channel)) * 255).toString(16).padStart(2, '0')
  const rgb = `#${byte(color.r)}${byte(color.g)}${byte(color.b)}`
  return color.alpha < 1 ? `${rgb}${byte(color.alpha)}` : rgb
}
