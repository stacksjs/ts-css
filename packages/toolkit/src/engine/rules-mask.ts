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

export const maskPresetRule: UtilityRule = (parsed): Record<string, string> | undefined => {
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

/**
 * Radial masks need three shape variables on top of the colour stops, and
 * each has its own initial value: an ellipse, sized to the farthest corner,
 * centred.
 */
const MASK_RADIAL_STOPS = [
  `${maskVar('radial-shape', 'ellipse')} ${maskVar('radial-size', 'farthest-corner')} at ${maskVar('radial-position', 'center')}`,
  `${maskVar('radial-from-color', 'black')} ${maskVar('radial-from-position', '0%')}`,
  `${maskVar('radial-to-color', 'transparent')} ${maskVar('radial-to-position', '100%')}`,
].join(', ')

const MASK_RADIAL_SIZES = new Set([
  'closest-side',
  'closest-corner',
  'farthest-side',
  'farthest-corner',
])

/**
 * Radial positions keep the token's own word order — `mask-radial-at-top-left`
 * is `top left`. Note this is the opposite of `mask-position`, where
 * `mask-top-left` is `left top`; both match Tailwind.
 */
const MASK_RADIAL_POSITIONS: Record<string, string> = {
  'center': 'center',
  'top': 'top',
  'right': 'right',
  'bottom': 'bottom',
  'left': 'left',
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
}

const MASK_CONIC_STOPS = [
  `from ${maskVar('conic-position', '0deg')}`,
  `${maskVar('conic-from-color', 'black')} ${maskVar('conic-from-position', '0%')}`,
  `${maskVar('conic-to-color', 'transparent')} ${maskVar('conic-to-position', '100%')}`,
].join(', ')

/**
 * Radial gradient masks: stops (`mask-radial-from-50%`), the shape
 * (`mask-circle`, `mask-ellipse`), the size (`mask-radial-closest-side`,
 * `mask-radial-[50%_50%]`) and the centre (`mask-radial-at-top-left`).
 *
 * The shape, size and position utilities deliberately emit ONLY their
 * variable, with no composed `mask-image` — they are modifiers on a radial
 * mask rather than masks in their own right, and that is what Tailwind does.
 */
export const maskRadialRule: UtilityRule = (parsed, config) => {
  // Arbitrary size: mask-radial-[50%_50%]
  if (parsed.utility === 'mask-radial' && parsed.arbitrary && parsed.value) {
    return {
      ...maskComposeBase(),
      '--tc-mask-radial': `radial-gradient(${maskVar('radial-stops', maskVar('radial-size', 'farthest-corner'))})`,
      '--tc-mask-radial-size': parsed.value,
    }
  }

  if (parsed.utility !== 'mask' || !parsed.value || parsed.arbitrary)
    return undefined

  const value = parsed.value

  if (value === 'circle' || value === 'ellipse')
    return { '--tc-mask-radial-shape': value }

  if (!value.startsWith('radial-'))
    return undefined

  const tail = value.slice(7)

  if (tail.startsWith('at-')) {
    const position = MASK_RADIAL_POSITIONS[tail.slice(3)]
    return position === undefined ? undefined : { '--tc-mask-radial-position': position }
  }

  if (MASK_RADIAL_SIZES.has(tail))
    return { '--tc-mask-radial-size': tail }

  const split = splitStop(tail)
  if (split === undefined)
    return undefined

  const resolved = resolveMaskStop(split.token, parsed.arbitrary, config)
  if (resolved === undefined)
    return undefined

  const properties: Record<string, string> = {
    ...maskComposeBase(),
    '--tc-mask-radial-stops': MASK_RADIAL_STOPS,
    '--tc-mask-radial': 'radial-gradient(var(--tc-mask-radial-stops))',
  }
  if (resolved.color !== undefined)
    properties[`--tc-mask-radial-${split.stop}-color`] = resolved.color
  else
    properties[`--tc-mask-radial-${split.stop}-position`] = resolved.position!
  return properties
}

/**
 * Conic gradient masks: a start angle (`mask-conic-180`, `-mask-conic-90`) or
 * a stop (`mask-conic-from-50%`, `mask-conic-to-black`).
 */
export const maskConicRule: UtilityRule = (parsed, config) => {
  if (parsed.utility !== 'mask' || !parsed.value || parsed.arbitrary)
    return undefined

  const value = parsed.value
  const negative = value.charCodeAt(0) === 45 // '-'
  const body = negative ? value.slice(1) : value
  if (!body.startsWith('conic-'))
    return undefined

  const tail = body.slice(6)

  if (/^\d+(?:\.\d+)?$/.test(tail)) {
    return {
      ...maskComposeBase(),
      '--tc-mask-conic': `conic-gradient(${maskVar('conic-stops', maskVar('conic-position', '0deg'))})`,
      '--tc-mask-conic-position': `calc(1deg * ${negative ? '-' : ''}${tail})`,
    }
  }

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
    '--tc-mask-conic-stops': MASK_CONIC_STOPS,
    '--tc-mask-conic': 'conic-gradient(var(--tc-mask-conic-stops))',
  }
  if (resolved.color !== undefined)
    properties[`--tc-mask-conic-${split.stop}-color`] = resolved.color
  else
    properties[`--tc-mask-conic-${split.stop}-position`] = resolved.position!
  return properties
}

export const maskRules: UtilityRule[] = [
  // Gradient masks before the preset table: they all match the bare `mask`
  // utility, and only these know the compound value shapes.
  maskLinearRule,
  maskEdgeRule,
  maskRadialRule,
  maskConicRule,
  maskPresetRule,
  maskRepeatAxisRule,
]
