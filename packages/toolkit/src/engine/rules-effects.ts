import type { UtilityRule } from './rules'
import { colorModifierSlashIndex } from './color-modifier'
import { applyOpacity, resolveColorValue } from './rules'
import { BOX_SHADOW_LAYERS, SHADOW_NONE } from './shadow-layers'

const BACKGROUND_ORIGIN_VALUES: Record<string, string> = {
  'bg-origin-border': 'border-box',
  'bg-origin-padding': 'padding-box',
  'bg-origin-content': 'content-box',
}

const BACKGROUND_POSITION_POSITIONS: Record<string, string> = {
  'bg-bottom': 'bottom',
  'bg-center': 'center',
  'bg-left': 'left',
  'bg-left-bottom': 'left bottom',
  'bg-left-top': 'left top',
  'bg-right': 'right',
  'bg-right-bottom': 'right bottom',
  'bg-right-top': 'right top',
  'bg-top': 'top',
}

const BACKGROUND_REPEAT_REPEATS: Record<string, string> = {
  'bg-repeat': 'repeat',
  'bg-no-repeat': 'no-repeat',
  'bg-repeat-x': 'repeat-x',
  'bg-repeat-y': 'repeat-y',
  'bg-repeat-round': 'round',
  'bg-repeat-space': 'space',
}

const BACKGROUND_SIZE_SIZES: Record<string, string> = {
  'bg-auto': 'auto',
  'bg-cover': 'cover',
  'bg-contain': 'contain',
}


// =============================================================================
// Shadow color helpers
// =============================================================================

// Flat color cache for shadow color lookups
let shadowColorCache: Map<string, string> | null = null
let shadowColorCacheConfig: any = null

function buildShadowColorCache(colors: Record<string, any>): Map<string, string> {
  const cache = new Map<string, string>()
  for (const [name, value] of Object.entries(colors)) {
    if (typeof value === 'string') {
      cache.set(name, value)
    }
    else if (typeof value === 'object' && value !== null) {
      for (const [shade, shadeValue] of Object.entries(value)) {
        if (typeof shadeValue === 'string') {
          // The `DEFAULT` shade maps to the bare color name (Tailwind convention).
          cache.set(shade === 'DEFAULT' ? name : `${name}-${shade}`, shadeValue)
        }
      }
    }
  }
  return cache
}

/**
 * Replace color values in a shadow string with var(--tc-shadow-color)
 * e.g., '0 10px 15px -3px rgb(0 0 0 / 0.1)' -> '0 10px 15px -3px var(--tc-shadow-color)'
*/
function createColoredShadow(shadow: string): string {
  return shadow.replace(/rgba?\([^)]+\)/g, 'var(--tc-shadow-color)')
}

// =============================================================================
// Backgrounds, Borders, Effects utilities
// =============================================================================

// Background utilities
export const backgroundAttachmentRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'bg' && parsed.value) {
    const values: Record<string, string> = {
      fixed: 'fixed',
      local: 'local',
      scroll: 'scroll',
    }
    return values[parsed.value] ? { 'background-attachment': values[parsed.value] } : undefined
  }
  return undefined
}

export const backgroundClipRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'bg' && parsed.value && parsed.value.startsWith('clip-')) {
    const val = parsed.value.replace('clip-', '')
    const values: Record<string, string> = {
      border: 'border-box',
      padding: 'padding-box',
      content: 'content-box',
      text: 'text',
    }
    return values[val] ? { 'background-clip': values[val] } : undefined
  }
  return undefined
}

// Direction keyword per Tailwind's compass suffix.
const GRADIENT_DIRECTIONS: Record<string, string> = {
  t: 'to top',
  tr: 'to top right',
  r: 'to right',
  br: 'to bottom right',
  b: 'to bottom',
  bl: 'to bottom left',
  l: 'to left',
  tl: 'to top left',
}

/**
 * Gradient colour-space interpolation, and the conic start angle.
 *
 * `bg-linear-to-r/oklch` interpolates in OKLCH instead of sRGB, which is what
 * stops a blue-to-yellow gradient passing through muddy grey. The modifier is
 * either a colour space (`/oklch`, `/srgb`) or a hue-interpolation keyword
 * (`/shorter`, `/longer`, `/increasing`, `/decreasing`), and a hue keyword
 * implies OKLCH.
 *
 * This rule claims only what the existing gradient handling does not: a
 * class carrying a `/modifier`, plus `bg-conic-<angle>`. Everything without a
 * modifier keeps flowing through the static map and backgroundImageRule
 * untouched.
 *
 * ONE DELIBERATE DIVERGENCE from Tailwind. Tailwind interpolates in oklab by
 * DEFAULT, emitting the plain prelude and then overriding it inside an
 * `@supports (background-image: linear-gradient(in lab, red, red))` block so
 * older browsers still get a gradient. A rule here returns a flat property
 * map and cannot express a nested at-rule, so an unguarded `in oklab` would
 * break those browsers outright. Interpolation therefore stays opt-in: no
 * modifier means sRGB, exactly as before.
 */
const GRADIENT_COLOR_SPACES = new Set([
  'srgb',
  'srgb-linear',
  'oklab',
  'oklch',
  'lab',
  'lch',
  'hsl',
  'hwb',
  'xyz',
  'xyz-d50',
  'xyz-d65',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
])

const GRADIENT_HUE_KEYWORDS = new Set(['shorter', 'longer', 'increasing', 'decreasing'])

function gradientInterpolation(modifier: string): string | undefined {
  if (GRADIENT_COLOR_SPACES.has(modifier))
    return `in ${modifier}`
  // A hue keyword only means something in a polar space, so it implies OKLCH.
  if (GRADIENT_HUE_KEYWORDS.has(modifier))
    return `in oklch ${modifier} hue`
  return undefined
}

export const gradientInterpolationRule: UtilityRule = (parsed) => {
  if (parsed.utility !== 'bg' || !parsed.value || parsed.arbitrary || parsed.typeHint)
    return undefined
  if (parsed.value.includes('('))
    return undefined

  const slashIdx = parsed.value.lastIndexOf('/')
  const token = slashIdx === -1 ? parsed.value : parsed.value.slice(0, slashIdx)
  const modifier = slashIdx === -1 ? undefined : parsed.value.slice(slashIdx + 1)

  let interpolation: string | undefined
  if (modifier !== undefined) {
    interpolation = gradientInterpolation(modifier)
    // An unrecognised modifier is not a utility. Returning undefined here
    // rather than ignoring the modifier keeps `bg-linear-to-r/bogus` from
    // silently compiling to a plain sRGB gradient.
    if (interpolation === undefined)
      return undefined
  }

  const negative = token.charCodeAt(0) === 45 // '-'
  const body = negative ? token.slice(1) : token

  let fn: string
  let position = ''

  if (body === 'conic') {
    fn = 'conic-gradient'
  }
  else if (body === 'radial') {
    fn = 'radial-gradient'
  }
  else if (body.startsWith('conic-')) {
    const angle = body.slice(6)
    if (!/^\d+(?:\.\d+)?$/.test(angle))
      return undefined
    fn = 'conic-gradient'
    position = `from ${negative ? '-' : ''}${angle}deg`
  }
  else if (body.startsWith('linear-') || body.startsWith('gradient-')) {
    const rest = body.slice(body.indexOf('-') + 1)
    fn = 'linear-gradient'
    if (rest.startsWith('to-')) {
      const direction = GRADIENT_DIRECTIONS[rest.slice(3)]
      if (direction === undefined)
        return undefined
      position = direction
    }
    else if (/^\d+(?:\.\d+)?$/.test(rest)) {
      position = `${negative ? '-' : ''}${rest}deg`
    }
    else {
      return undefined
    }
  }
  else {
    return undefined
  }

  // Nothing new to say without either an angle or an interpolation: leave it
  // to the existing handling.
  if (!position && interpolation === undefined)
    return undefined

  const prelude = [position, interpolation].filter(Boolean).join(' ')
  return {
    'background-image': prelude
      ? `${fn}(${prelude}, var(--tc-gradient-stops))`
      : `${fn}(var(--tc-gradient-stops))`,
  }
}

/**
 * Linear gradients. `bg-linear-*` is Tailwind v4's name for `bg-gradient-*`;
 * both spellings are accepted so v3 markup keeps working.
 *
 * Three shapes reach here with different parses:
 *   bg-linear-to-r        utility `bg`,        value `linear-to-r`
 *   -bg-linear-45         utility `bg`,        value `-linear-45`
 *   bg-linear-[0.25turn]  utility `bg-linear`, value `0.25turn` (arbitrary)
 */
export const backgroundImageRule: UtilityRule = (parsed) => {
  if (!parsed.value)
    return undefined

  let angle: string | undefined
  if (parsed.utility === 'bg-linear' || parsed.utility === 'bg-gradient') {
    angle = parsed.value
  }
  else if (parsed.utility === 'bg') {
    // `bg-[image:linear-gradient(…)]` and `bg-[url(…)]` are complete image
    // values, not the `bg-linear-<angle>` shorthand. Without this guard the
    // shorthand regex chewed `linear-gradient(red,blue)` down to
    // `gradient(red,blue)` and re-wrapped it as
    // `linear-gradient(gradient(red,blue), var(--tc-gradient-stops))`.
    if (parsed.typeHint || parsed.value.includes('('))
      return undefined

    // A leading `-` belongs to the angle, not to the family name.
    const negative = parsed.value.startsWith('-')
    const token = negative ? parsed.value.slice(1) : parsed.value
    const match = token.match(/^(?:gradient|linear)-(.+)$/)
    if (!match)
      return undefined
    angle = negative ? `-${match[1]}` : match[1]
  }
  else {
    return undefined
  }

  // Compass form: bg-linear-to-r
  if (angle.startsWith('to-')) {
    const direction = GRADIENT_DIRECTIONS[angle.slice(3)]
    return direction
      ? { 'background-image': `linear-gradient(${direction}, var(--tc-gradient-stops))` }
      : undefined
  }

  // Angle form (v4 only). A bare number is degrees; anything else must be an
  // arbitrary value carrying its own unit.
  if (parsed.arbitrary)
    return { 'background-image': `linear-gradient(${angle}, var(--tc-gradient-stops))` }
  if (/^-?\d+(?:\.\d+)?$/.test(angle))
    return { 'background-image': `linear-gradient(${angle}deg, var(--tc-gradient-stops))` }

  return undefined
}

export const backgroundOriginRule: UtilityRule = (parsed) => {
  return BACKGROUND_ORIGIN_VALUES[parsed.base] ? { 'background-origin': BACKGROUND_ORIGIN_VALUES[parsed.base] } : undefined
}

export const backgroundPositionRule: UtilityRule = (parsed) => {
  return BACKGROUND_POSITION_POSITIONS[parsed.base] ? { 'background-position': BACKGROUND_POSITION_POSITIONS[parsed.base] } : undefined
}

export const backgroundRepeatRule: UtilityRule = (parsed) => {
  return BACKGROUND_REPEAT_REPEATS[parsed.base] ? { 'background-repeat': BACKGROUND_REPEAT_REPEATS[parsed.base] } : undefined
}

export const backgroundSizeRule: UtilityRule = (parsed) => {
  return BACKGROUND_SIZE_SIZES[parsed.base] ? { 'background-size': BACKGROUND_SIZE_SIZES[parsed.base] } : undefined
}

// Border utilities
export const borderStyleRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'border' && parsed.value) {
    const styles: Record<string, string> = {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
      hidden: 'hidden',
      none: 'none',
    }
    return styles[parsed.value] ? { 'border-style': styles[parsed.value] } : undefined
  }
  return undefined
}

export const outlineRule: UtilityRule = (parsed, config) => {
  // Outline offset
  if (parsed.utility === 'outline-offset' && parsed.value) {
    const offsets: Record<string, string> = {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    }
    if (offsets[parsed.value])
      return { 'outline-offset': offsets[parsed.value] } as Record<string, string>
    if (parsed.arbitrary)
      return { 'outline-offset': parsed.value } as Record<string, string>
    // Off-scale numbers keep the px scale; unknown words are rejected
    if (/^\d+(?:\.\d+)?$/.test(parsed.value))
      return { 'outline-offset': `${parsed.value}px` } as Record<string, string>
    return undefined
  }

  // Outline styles
  if (parsed.utility === 'outline' && parsed.value) {
    const outlineStyles: Record<string, string> = {
      none: 'none',
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
    }
    if (outlineStyles[parsed.value]) {
      return { 'outline-style': outlineStyles[parsed.value] } as Record<string, string>
    }
    // Tailwind v4: outline-hidden hides the outline but preserves it in
    // forced-colors mode via a transparent outline.
    if (parsed.value === 'hidden') {
      return { 'outline': '2px solid transparent', 'outline-offset': '2px' } as Record<string, string>
    }
  }

  if (parsed.utility === 'outline') {
    if (!parsed.value) {
      return { 'outline-width': '1px' } as Record<string, string>
    }

    // Check for colors (e.g., outline-blue-500, outline-white/50)
    const color = resolveColorValue(parsed.value, config, parsed.modifierArbitrary)
    if (color) {
      return { 'outline-color': color } as Record<string, string>
    }

    // Widths: scale keys, bare numbers (px implied), or arbitrary values.
    // Unknown words previously leaked into outline-width verbatim.
    const widths: Record<string, string> = {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    }
    if (widths[parsed.value]) {
      return { 'outline-width': widths[parsed.value] } as Record<string, string>
    }
    if (parsed.arbitrary) {
      return { 'outline-width': parsed.value } as Record<string, string>
    }
    if (/^\d+(?:\.\d+)?$/.test(parsed.value)) {
      return { 'outline-width': `${parsed.value}px` } as Record<string, string>
    }
    return undefined
  }
}

// Effect utilities
export const boxShadowThemeRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'shadow') {
    // An arbitrary value is either a whole shadow (`shadow-[0_1px_4px_black]`)
    // or just a shadow COLOR (`shadow-[#ff0000]`), which shadowColorRule
    // below owns. A shadow definition always has offsets, so the presence of
    // whitespace — underscores in the class, spaces once parsed — tells the
    // two apart. Without this branch every arbitrary shadow fell through the
    // theme lookup and emitted no CSS at all, silently dropping the utility.
    const isArbitraryShadow = parsed.arbitrary
      && !!parsed.value
      && (/\s/.test(parsed.value) || parsed.value === 'none')

    const shadow = isArbitraryShadow
      ? parsed.value
      : parsed.value
        ? config.theme.boxShadow[parsed.value]
        : config.theme.boxShadow.DEFAULT
    if (!shadow) return undefined

    // shadow-none is a simple reset — no CSS variables needed
    if (shadow === 'none') {
      return {
        '--tc-shadow': SHADOW_NONE,
        'box-shadow': BOX_SHADOW_LAYERS,
      } as Record<string, string>
    }

    // Generate CSS variable-based shadow for color support
    const colored = createColoredShadow(shadow)
    return {
      '--tc-shadow': shadow,
      '--tc-shadow-colored': colored,
      'box-shadow': BOX_SHADOW_LAYERS,
    } as Record<string, string>
  }
}

// Shadow color utilities (shadow-{color}, shadow-{color}/{opacity})
export const shadowColorRule: UtilityRule = (parsed, config) => {
  if (parsed.utility !== 'shadow' || !parsed.value)
    return undefined

  // Skip if it matches a theme shadow size (sm, md, lg, xl, none, DEFAULT)
  if (config.theme.boxShadow[parsed.value])
    return undefined

  // Skip a full arbitrary shadow definition — boxShadowThemeRule owns those.
  // Only a bare arbitrary COLOR (`shadow-[#ff0000]`) belongs here.
  if (parsed.arbitrary && /\s/.test(parsed.value))
    return undefined

  // Build/update color cache if needed
  if (shadowColorCache === null || shadowColorCacheConfig !== config.theme.colors) {
    shadowColorCache = buildShadowColorCache(config.theme.colors)
    shadowColorCacheConfig = config.theme.colors
  }

  const value = parsed.value
  const slashIdx = colorModifierSlashIndex(value)

  let colorName: string
  let opacity: number | undefined

  if (slashIdx !== -1) {
    colorName = value.slice(0, slashIdx)
    const opacityStr = value.slice(slashIdx + 1)

    // Handle arbitrary opacity: /[0.04], /[0.5]
    if (opacityStr.charCodeAt(0) === 91 && opacityStr.charCodeAt(opacityStr.length - 1) === 93) {
      const arbitraryOpacity = Number.parseFloat(opacityStr.slice(1, -1))
      if (Number.isNaN(arbitraryOpacity) || arbitraryOpacity < 0 || arbitraryOpacity > 1)
        return undefined
      opacity = arbitraryOpacity
    }
    else if (parsed.modifierArbitrary) {
      const arbitraryOpacity = Number.parseFloat(opacityStr)
      if (Number.isNaN(arbitraryOpacity) || arbitraryOpacity < 0 || arbitraryOpacity > 1)
        return undefined
      opacity = arbitraryOpacity
    }
    else {
      const opacityValue = Number.parseInt(opacityStr, 10)
      if (Number.isNaN(opacityValue) || opacityValue < 0 || opacityValue > 100)
        return undefined
      opacity = opacityValue / 100
    }
  }
  else {
    colorName = value
  }

  // An arbitrary literal (`shadow-[#ff0000]`, `shadow-[rgb(1_2_3)]`) is a
  // real colour the theme has never heard of, so fall back to using it
  // verbatim rather than dropping the utility.
  const resolvedColor = shadowColorCache.get(colorName)
    ?? (parsed.arbitrary ? colorName : undefined)
  if (!resolvedColor) return undefined

  // The shared helper, not a hex-only one: the default palette is oklch, and
  // `shadow-slate-900/5` used to come out as solid slate-900.
  const finalColor = opacity !== undefined
    ? applyOpacity(resolvedColor, opacity)
    : resolvedColor

  return {
    '--tc-shadow-color': finalColor,
    '--tc-shadow': 'var(--tc-shadow-colored)',
  } as Record<string, string>
}

/**
 * The scale's colour is routed through `--tc-text-shadow-color` so that a
 * `text-shadow-<color>` utility can recolour a shadow without restating its
 * offsets. `text-shadow-none` is a reset and takes no colour.
 */
function textShadowWithColor(offsets: string): string {
  return `${offsets} var(--tc-text-shadow-color, rgba(0, 0, 0, 0.05))`
}

export const textShadowRule: UtilityRule = (parsed, config) => {
  if (parsed.utility !== 'text-shadow')
    return undefined

  const shadows: Record<string, string> = {
    sm: textShadowWithColor('0 1px 2px'),
    DEFAULT: textShadowWithColor('0 1px 3px'),
    md: textShadowWithColor('0 4px 6px'),
    lg: textShadowWithColor('0 10px 15px'),
    xl: textShadowWithColor('0 20px 25px'),
    none: 'none',
  }

  if (!parsed.value)
    return { 'text-shadow': shadows.DEFAULT }
  if (shadows[parsed.value])
    return { 'text-shadow': shadows[parsed.value] }

  // An arbitrary value is either a whole shadow (`text-shadow-[0_1px_black]`)
  // or just a colour (`text-shadow-[#f00]`). A shadow definition always has
  // offsets, so whitespace tells the two apart — the same test
  // boxShadowThemeRule uses for `shadow-[…]`.
  if (parsed.arbitrary && parsed.value) {
    if (/\s/.test(parsed.value))
      return { 'text-shadow': parsed.value }
    return { '--tc-text-shadow-color': parsed.value }
  }

  const color = resolveColorValue(parsed.value, config, parsed.modifierArbitrary)
  return color === undefined ? undefined : { '--tc-text-shadow-color': color }
}

export const opacityRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'opacity' && parsed.value) {
    const opacityMap: Record<string, string> = {
      0: '0',
      5: '0.05',
      10: '0.1',
      20: '0.2',
      25: '0.25',
      30: '0.3',
      40: '0.4',
      50: '0.5',
      60: '0.6',
      70: '0.7',
      75: '0.75',
      80: '0.8',
      90: '0.9',
      95: '0.95',
      100: '1',
    }
    if (opacityMap[parsed.value])
      return { opacity: opacityMap[parsed.value] }
    // Arbitrary values pass through; any bare integer maps to n/100
    // (Tailwind v4: `opacity-33` → 0.33). Unknown words are rejected —
    // `opacity: foo` is not a declaration.
    if (parsed.arbitrary)
      return { opacity: parsed.value }
    if (/^\d+$/.test(parsed.value)) {
      const n = Number.parseInt(parsed.value, 10)
      if (n >= 0 && n <= 100)
        return { opacity: `${n / 100}` }
    }
    return undefined
  }
}

export const mixBlendModeRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'mix-blend') {
    const modes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    return parsed.value && modes.includes(parsed.value) ? { 'mix-blend-mode': parsed.value } : undefined
  }
}

export const backgroundBlendModeRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'bg-blend') {
    const modes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    return parsed.value && modes.includes(parsed.value) ? { 'background-blend-mode': parsed.value } : undefined
  }
}

// Mask utilities
export const maskRule: UtilityRule = (parsed) => {
  // mask-clip
  if (parsed.utility === 'mask-clip' && parsed.value) {
    const clips: Record<string, string> = {
      'border': 'border-box',
      'padding': 'padding-box',
      'content': 'content-box',
      'text': 'text',
      'fill': 'fill-box',
      'stroke': 'stroke-box',
      'view': 'view-box',
      'no-clip': 'no-clip',
    }
    if (clips[parsed.value])
      return { 'mask-clip': clips[parsed.value] } as Record<string, string>
    return parsed.arbitrary ? { 'mask-clip': parsed.value } as Record<string, string> : undefined
  }

  // mask-composite
  if (parsed.utility === 'mask-composite' && parsed.value) {
    const composites = ['add', 'subtract', 'intersect', 'exclude']
    return composites.includes(parsed.value) ? { 'mask-composite': parsed.value } as Record<string, string> : undefined
  }

  // mask-image
  if (parsed.utility === 'mask-image' && parsed.value) {
    if (parsed.value === 'none') {
      return { 'mask-image': 'none' } as Record<string, string>
    }
    // Arbitrary values only: url(...) and gradients pass through; wrapping a
    // bare word produced mask-image: url(foo) — a bogus relative request.
    if (parsed.arbitrary) {
      const value = parsed.value.startsWith('url(') || parsed.value.includes('gradient(')
        ? parsed.value
        : `url(${parsed.value})`
      return { 'mask-image': value } as Record<string, string>
    }
    return undefined
  }

  // mask-mode
  if (parsed.utility === 'mask-mode' && parsed.value) {
    const modes = ['alpha', 'luminance', 'match-source']
    return modes.includes(parsed.value) ? { 'mask-mode': parsed.value } as Record<string, string> : undefined
  }

  // mask-origin
  if (parsed.utility === 'mask-origin' && parsed.value) {
    const origins: Record<string, string> = {
      border: 'border-box',
      padding: 'padding-box',
      content: 'content-box',
      fill: 'fill-box',
      stroke: 'stroke-box',
      view: 'view-box',
    }
    if (origins[parsed.value])
      return { 'mask-origin': origins[parsed.value] } as Record<string, string>
    return parsed.arbitrary ? { 'mask-origin': parsed.value } as Record<string, string> : undefined
  }

  // mask-position
  if (parsed.utility === 'mask-position' && parsed.value) {
    const positions: Record<string, string> = {
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
    if (positions[parsed.value])
      return { 'mask-position': positions[parsed.value] } as Record<string, string>
    return parsed.arbitrary ? { 'mask-position': parsed.value } as Record<string, string> : undefined
  }

  // mask-repeat
  if (parsed.utility === 'mask-repeat' && parsed.value) {
    const repeats: Record<string, string> = {
      'repeat': 'repeat',
      'no-repeat': 'no-repeat',
      'repeat-x': 'repeat-x',
      'repeat-y': 'repeat-y',
      'round': 'round',
      'space': 'space',
    }
    if (repeats[parsed.value])
      return { 'mask-repeat': repeats[parsed.value] } as Record<string, string>
    return parsed.arbitrary ? { 'mask-repeat': parsed.value } as Record<string, string> : undefined
  }

  // mask-size
  if (parsed.utility === 'mask-size' && parsed.value) {
    const sizes: Record<string, string> = {
      auto: 'auto',
      cover: 'cover',
      contain: 'contain',
    }
    if (sizes[parsed.value])
      return { 'mask-size': sizes[parsed.value] } as Record<string, string>
    return parsed.arbitrary ? { 'mask-size': parsed.value } as Record<string, string> : undefined
  }

  // mask-type
  if (parsed.utility === 'mask-type' && parsed.value) {
    const types = ['alpha', 'luminance']
    return types.includes(parsed.value) ? { 'mask-type': parsed.value } as Record<string, string> : undefined
  }
}

export const effectsRules: UtilityRule[] = [
  backgroundAttachmentRule,
  backgroundClipRule,
  gradientInterpolationRule,
  backgroundImageRule,
  backgroundOriginRule,
  backgroundPositionRule,
  backgroundRepeatRule,
  backgroundSizeRule,
  borderStyleRule,
  outlineRule,
  boxShadowThemeRule,
  shadowColorRule,
  textShadowRule,
  opacityRule,
  mixBlendModeRule,
  backgroundBlendModeRule,
  maskRule,
]
