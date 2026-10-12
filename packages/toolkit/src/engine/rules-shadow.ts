import type { CssConfig } from './types'
import type { UtilityRule } from './rules'
import { resolveColorValue } from './rules'
import { BOX_SHADOW_LAYERS, SHADOW_NONE } from './shadow-layers'

/**
 * `inset-shadow-*` and `inset-ring-*`: the two inner layers of the
 * box-shadow stack that Tailwind v4 added.
 *
 * Both spell their class with the `inset-` prefix the positioning utilities
 * also use, so `inset-shadow-sm` parses as the `inset` utility with
 * `shadow-sm` as its value. These rules only claim values beginning
 * `shadow`/`ring`, which is what keeps `inset-0` and `inset-x-4` untouched.
 */

/**
 * Geometry only — the colour is appended separately so that a later
 * `inset-shadow-<color>` can override it through the variable.
 */
const INSET_SHADOW_GEOMETRY: Record<string, string> = {
  '2xs': 'inset 0 1px',
  'xs': 'inset 0 1px 1px',
  'sm': 'inset 0 2px 4px',
}

/** The tint the named scale uses when no colour utility overrides it. */
const INSET_SHADOW_TINT = 'rgb(0 0 0 / 0.05)'

const COLOR_FUNCTION = /^(?:var|rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|color-mix)\(/

function looksLikeColor(token: string): boolean {
  return token.charCodeAt(0) === 35 || COLOR_FUNCTION.test(token)
}

/** A length-ish token: `0`, `2px`, `-1rem`, `calc(…)`, `var(…)`. */
function looksLikeLength(token: string): boolean {
  return /^-?[\d.]+[a-z%]*$/i.test(token) || token.startsWith('calc(') || token.startsWith('var(')
}

/**
 * Wrap an arbitrary shadow's colour in the override variable, matching
 * Tailwind: `inset-shadow-[2px_2px_4px_black]` becomes
 * `inset 2px 2px 4px var(--tw-inset-shadow-color, black)`, and a value with
 * no colour of its own gets `currentcolor` as the fallback.
 */
function arbitraryInsetShadow(value: string, variable: string): string {
  const tokens = value.trim().split(/\s+/)
  const last = tokens[tokens.length - 1]
  if (tokens.length > 1 && !looksLikeLength(last))
    return `inset ${tokens.slice(0, -1).join(' ')} var(${variable}, ${last})`
  return `inset ${value} var(${variable}, currentcolor)`
}

function insetShadowLayer(shadow: string): Record<string, string> {
  return {
    '--tc-inset-shadow': shadow,
    'box-shadow': BOX_SHADOW_LAYERS,
  }
}

export const insetShadowRule: UtilityRule = (parsed, config: CssConfig) => {
  // Arbitrary form parses as its own utility: inset-shadow-[2px_2px_4px]
  if (parsed.utility === 'inset-shadow' && parsed.arbitrary && parsed.value) {
    // A lone colour in brackets is a colour, not a shadow definition.
    if (!/\s/.test(parsed.value) && looksLikeColor(parsed.value))
      return { '--tc-inset-shadow-color': parsed.value }
    return insetShadowLayer(arbitraryInsetShadow(parsed.value, '--tc-inset-shadow-color'))
  }

  if (parsed.utility !== 'inset' || !parsed.value || parsed.arbitrary)
    return undefined
  if (!parsed.value.startsWith('shadow-'))
    return undefined

  const token = parsed.value.slice(7)

  const geometry = INSET_SHADOW_GEOMETRY[token]
  if (geometry !== undefined)
    return insetShadowLayer(`${geometry} var(--tc-inset-shadow-color, ${INSET_SHADOW_TINT})`)

  if (token === 'none')
    return insetShadowLayer(`inset ${SHADOW_NONE}`)

  // Anything else has to be a colour, or it is not a utility at all. The
  // scale is only 2xs/xs/sm — `inset-shadow-md` is not a Tailwind class and
  // must generate nothing rather than fall through to a bogus shadow.
  const color = resolveColorValue(token, config, parsed.modifierArbitrary)
  return color === undefined ? undefined : { '--tc-inset-shadow-color': color }
}

export const shadowRules: UtilityRule[] = [
  insetShadowRule,
]
