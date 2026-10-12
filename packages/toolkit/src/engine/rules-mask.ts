import type { UtilityRule } from './rules'

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

export const maskRules: UtilityRule[] = [
  maskPresetRule,
  maskRepeatAxisRule,
]
