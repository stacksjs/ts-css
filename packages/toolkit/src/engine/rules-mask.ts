import type { CssConfig } from './types'
import type { UtilityRule } from './rules'
import { resolveColorValue, resolveSizeToken } from './rules'

/**
 * Tailwind v4 mask utilities.
 *
 * v4 moved most of the mask surface onto the bare `mask-` prefix —
 * `mask-add` rather than `mask-composite-add`, `mask-center` rather than
 * `mask-position-center`, `mask-cover` rather than `mask-size-cover` — which
 * all parse as the `mask` utility with the rest as the value. The longhand
 * spellings live in `maskRule` in rules-effects.ts and keep working; this
 * file adds the v4 names beside them.
 */

const MASK_COMPOSITE: Record<string, string> = {
  add: 'add',
  subtract: 'subtract',
  intersect: 'intersect',
  exclude: 'exclude',
}

const MASK_MODE: Record<string, string> = {
  alpha: 'alpha',
  luminance: 'luminance',
  // The CSS keyword is `match-source`; the utility is just `mask-match`.
  match: 'match-source',
}

const MASK_SIZE: Record<string, string> = {
  auto: 'auto',
  cover: 'cover',
  contain: 'contain',
}

/**
 * Corner positions emit in `<x> <y>` order, which is what Tailwind does:
 * `mask-top-left` is `mask-position: left top`, not `top left`. Both are
 * valid CSS, but matching the reference keeps diffs against it clean.
 */
const MASK_POSITION: Record<string, string> = {
  'center': 'center',
  'top': 'top',
  'right': 'right',
  'bottom': 'bottom',
  'left': 'left',
  'top-left': 'left top',
  'top-right': 'right top',
  'bottom-left': 'left bottom',
  'bottom-right': 'right bottom',
}

const MASK_REPEAT: Record<string, string> = {
  'repeat': 'repeat',
  'no-repeat': 'no-repeat',
}

export const maskPresetRule: UtilityRule = (parsed) => {
  if (parsed.utility !== 'mask' || !parsed.value)
    return undefined

  const value = parsed.value

  // Arbitrary image: mask-[url(/m.png)], mask-[linear-gradient(…)]. A bare
  // word is NOT wrapped in url() — that would turn a typo into a bogus
  // relative request, the same reasoning as the longhand mask-image rule.
  if (parsed.arbitrary)
    return { 'mask-image': value }

  if (value === 'none')
    return { 'mask-image': 'none' }

  if (MASK_COMPOSITE[value] !== undefined)
    return { 'mask-composite': MASK_COMPOSITE[value] }

  if (MASK_MODE[value] !== undefined)
    return { 'mask-mode': MASK_MODE[value] }

  if (MASK_SIZE[value] !== undefined)
    return { 'mask-size': MASK_SIZE[value] }

  if (MASK_POSITION[value] !== undefined)
    return { 'mask-position': MASK_POSITION[value] }

  if (MASK_REPEAT[value] !== undefined)
    return { 'mask-repeat': MASK_REPEAT[value] }

  if (value === 'no-clip')
    return { 'mask-clip': 'no-clip' }

  return undefined
}

/**
 * `mask-repeat-x` / `mask-repeat-y` parse as the `mask-repeat` utility with a
 * bare axis as the value, which the longhand rule's keyword table does not
 * cover — so both emitted nothing. `mask-repeat-space` and
 * `mask-repeat-round` happen to work there already because `space` and
 * `round` are the literal CSS keywords.
 */
export const maskRepeatAxisRule: UtilityRule = (parsed) => {
  if (parsed.utility !== 'mask-repeat' || parsed.arbitrary)
    return undefined
  if (parsed.value === 'x')
    return { 'mask-repeat': 'repeat-x' }
  if (parsed.value === 'y')
    return { 'mask-repeat': 'repeat-y' }
  return undefined
}

// =============================================================================
// Gradient masks
// =============================================================================

/**
 * The three gradient layers compose into one `mask-image`, and the identity
 * mask is an opaque white gradient — a layer nobody set must not hide
 * anything.
 *
 * Tailwind registers each of these with `@property` so an unset layer falls
 * back to its initial value. This engine emits no `@property`, so the
 * default travels in a `var()` fallback instead. That is the same trick the
 * filter utilities already use (`var(--tc-blur, )`), and it produces the
 * same cascade behaviour; the difference is that these custom properties are
 * not animatable or type-checked the way a registered property would be.
 */
const MASK_IDENTITY = 'linear-gradient(#fff, #fff)'

function maskVar(name: string, fallback: string): string {
  return `var(--tc-mask-${name}, ${fallback})`
}

/**
 * Every gradient mask utility has to re-declare the composed `mask-image`,
 * because any one of them may be the only mask utility on the element.
 */
function maskComposeBase(): Record<string, string> {
  return {
    'mask-image': `${maskVar('linear', MASK_IDENTITY)}, ${maskVar('radial', MASK_IDENTITY)}, ${maskVar('conic', MASK_IDENTITY)}`,
    'mask-composite': 'intersect',
  }
}

/** The four edge layers, in Tailwind's order. */
const MASK_EDGE_LAYERS = [
  maskVar('left', MASK_IDENTITY),
  maskVar('right', MASK_IDENTITY),
  maskVar('bottom', MASK_IDENTITY),
  maskVar('top', MASK_IDENTITY),
].join(', ')

/** `t` | `r` | `b` | `l` plus the two axis shorthands. */
const MASK_EDGE_SIDES: Record<string, string[]> = {
  t: ['top'],
  r: ['right'],
  b: ['bottom'],
  l: ['left'],
  x: ['right', 'left'],
  y: ['top', 'bottom'],
}

function edgeGradient(side: string): string {
  const from = `${maskVar(`${side}-from-color`, 'black')} ${maskVar(`${side}-from-position`, '0%')}`
  const to = `${maskVar(`${side}-to-color`, 'transparent')} ${maskVar(`${side}-to-position`, '100%')}`
  return `linear-gradient(to ${side}, ${from}, ${to})`
}

const MASK_LINEAR_STOPS = [
  maskVar('linear-position', '0deg'),
  `${maskVar('linear-from-color', 'black')} ${maskVar('linear-from-position', '0%')}`,
  `${maskVar('linear-to-color', 'transparent')} ${maskVar('linear-to-position', '100%')}`,
].join(', ')

const COLOR_FUNCTION = /^(?:var|rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|color-mix)\(/

/**
 * A `from-`/`to-` stop is either a position or a colour, and which one it is
 * has to be decided from the token: `mask-t-from-50%` and `mask-b-from-20`
 * are positions, `mask-r-from-black` is a colour.
 *
 * Positions are recognised first so that a bare number stays a length rather
 * than being offered to the colour table.
 */
function resolveMaskStop(
  token: string,
  arbitrary: boolean,
  config: CssConfig,
): { color?: string, position?: string } | undefined {
  if (!token)
    return undefined

  if (/^\d+(?:\.\d+)?%$/.test(token))
    return { position: token }

  if (/^\d+(?:\.\d+)?$/.test(token)) {
    const spacing = resolveSizeToken({ value: token, arbitrary: false }, config, {})
    return spacing === undefined ? undefined : { position: spacing }
  }

  if (arbitrary) {
    // An arbitrary stop can be either, so fall back on its shape.
    return token.charCodeAt(0) === 35 || COLOR_FUNCTION.test(token)
      ? { color: token }
      : { position: token }
  }

  const color = resolveColorValue(token, config, false)
  return color === undefined ? undefined : { color }
}

/** Split a `from-…` / `to-…` tail into its stop kind and token. */
function splitStop(tail: string): { stop: 'from' | 'to', token: string } | undefined {
  if (tail.startsWith('from-'))
    return { stop: 'from', token: tail.slice(5) }
  if (tail.startsWith('to-'))
    return { stop: 'to', token: tail.slice(3) }
  return undefined
}

/**
 * Linear gradient masks: an angle (`mask-linear-45`, `-mask-linear-45`) or a
 * stop (`mask-linear-from-20%`, `mask-linear-to-black`).
 */
export const maskLinearRule: UtilityRule = (parsed, config) => {
  if (parsed.utility !== 'mask' || !parsed.value || parsed.arbitrary)
    return undefined

  const value = parsed.value
  const negative = value.charCodeAt(0) === 45 // '-'
  const body = negative ? value.slice(1) : value
  if (!body.startsWith('linear-'))
    return undefined

  const tail = body.slice(7)

  // Angle form. The calc() keeps the raw number in the custom property,
  // which is what makes `-mask-linear-45` express as a negated angle.
  if (/^\d+(?:\.\d+)?$/.test(tail)) {
    return {
      ...maskComposeBase(),
      '--tc-mask-linear': `linear-gradient(${maskVar('linear-stops', maskVar('linear-position', '0deg'))})`,
      '--tc-mask-linear-position': `calc(1deg * ${negative ? '-' : ''}${tail})`,
    }
  }

  // A negative sign is meaningless on a stop.
  if (negative)
    return undefined

  const split = splitStop(tail)
  if (split === undefined)
    return undefined

  const resolved = resolveMaskStop(split.token, parsed.arbitrary, config)
  if (resolved === undefined)
    return undefined

  const properties: Record<string, string> = {
    ...maskComposeBase(),
    '--tc-mask-linear-stops': MASK_LINEAR_STOPS,
    '--tc-mask-linear': 'linear-gradient(var(--tc-mask-linear-stops))',
  }
  if (resolved.color !== undefined)
    properties[`--tc-mask-linear-${split.stop}-color`] = resolved.color
  else
    properties[`--tc-mask-linear-${split.stop}-position`] = resolved.position!
  return properties
}

/**
 * Edge masks: `mask-t-from-50%`, `mask-r-to-black`, and the axis shorthands
 * `mask-x-*` (right and left) and `mask-y-*` (top and bottom).
 */
export const maskEdgeRule: UtilityRule = (parsed, config) => {
  if (parsed.utility !== 'mask' || !parsed.value || parsed.arbitrary)
    return undefined

  const value = parsed.value
  const dashIdx = value.indexOf('-')
  if (dashIdx === -1)
    return undefined

  const sides = MASK_EDGE_SIDES[value.slice(0, dashIdx)]
  if (sides === undefined)
    return undefined

  const split = splitStop(value.slice(dashIdx + 1))
  if (split === undefined)
    return undefined

  const resolved = resolveMaskStop(split.token, parsed.arbitrary, config)
  if (resolved === undefined)
    return undefined

  const properties: Record<string, string> = {
    ...maskComposeBase(),
    '--tc-mask-linear': MASK_EDGE_LAYERS,
  }
  for (const side of sides) {
    properties[`--tc-mask-${side}`] = edgeGradient(side)
    if (resolved.color !== undefined)
      properties[`--tc-mask-${side}-${split.stop}-color`] = resolved.color
    else
      properties[`--tc-mask-${side}-${split.stop}-position`] = resolved.position!
  }
  return properties
}

export const maskRules: UtilityRule[] = [
  // Gradient masks before the preset table: both match the bare `mask`
  // utility, and only these two know the compound value shapes.
  maskLinearRule,
  maskEdgeRule,
  maskPresetRule,
  maskRepeatAxisRule,
]
