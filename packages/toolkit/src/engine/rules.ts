import type { CssConfig, ParsedClass, UtilityRuleResult } from './types'
import { colorModifierSlashIndex } from './color-modifier'
import { advancedRules } from './rules-advanced'
import { effectsRules } from './rules-effects'
import { maskRules } from './rules-mask'
import { formsRules } from './rules-forms'
import { gridRules } from './rules-grid'
import { iconRule } from './rules-icons'
import { interactivityRules } from './rules-interactivity'
import { layoutRules } from './rules-layout'
import { transformsRules } from './rules-transforms'
import { typographyRules } from './rules-typography'
import { fractionToPercent } from './format'

const FLEX_DIRECTION_DIRECTIONS: Record<string, string> = {
  'flex-row': 'row',
  'flex-row-reverse': 'row-reverse',
  'flex-col': 'column',
  'flex-col-reverse': 'column-reverse',
}

const FLEX_WRAP_WRAPS: Record<string, string> = {
  'flex-wrap': 'wrap',
  'flex-wrap-reverse': 'wrap-reverse',
  'flex-nowrap': 'nowrap',
}

const BORDER_SIDE_WIDTH_WIDTHMAP: Record<string, string> = {
  0: '0px',
  2: '2px',
  4: '4px',
  8: '8px',
}


export type UtilityRule = (_parsed: ParsedClass, _config: CssConfig) => Record<string, string> | UtilityRuleResult | undefined

/**
 * Built-in utility rules
 * Each rule checks if it matches the parsed class and returns CSS properties
*/

// Display utilities
export const displayRule: UtilityRule = (parsed) => {
  // Single-token displays: .block, .flex, .grid, .hidden, .contents, etc.
  const singleToken = ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden', 'none', 'contents', 'flow-root', 'list-item']
  if (singleToken.includes(parsed.utility) && !parsed.value) {
    return { display: parsed.utility === 'hidden' ? 'none' : parsed.utility }
  }

  // Table family (Tailwind parity): .table, .table-cell, .table-row,
  // .table-row-group, .table-column, .table-column-group, .table-header-group,
  // .table-footer-group, .table-caption — all map to display: table-*.
  // Skip `auto`/`fixed` which are handled by tableLayoutRule (table-layout css
  // property) and `inline` which is handled below as `inline-table`.
  if (parsed.utility === 'table') {
    if (!parsed.value) return { display: 'table' }
    const tableDisplays = new Set(['cell', 'row', 'row-group', 'column', 'column-group', 'header-group', 'footer-group', 'caption'])
    if (tableDisplays.has(parsed.value)) return { display: `table-${parsed.value}` }
  }

  // Two-token displays the parser splits at the first `-` boundary:
  //   `inline-table` → utility=`inline`,  value=`table`
  //   `flow-root`    → utility=`flow`,    value=`root`
  //   `list-item`    → utility=`list`,    value=`item`
  if (parsed.utility === 'inline' && parsed.value === 'table') return { display: 'inline-table' }
  if (parsed.utility === 'flow' && parsed.value === 'root') return { display: 'flow-root' }
  if (parsed.utility === 'list' && parsed.value === 'item') return { display: 'list-item' }
}

// Scrollbar utilities
export const scrollbarRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'scrollbar' && parsed.value) {
    const widths: Record<string, string> = {
      auto: 'auto',
      thin: 'thin',
      none: 'none',
    }
    const width = widths[parsed.value]
    if (width) {
      return { 'scrollbar-width': width }
    }
  }
}

// Content property for pseudo-elements: content-none, content-empty, content-['hello']
export const contentPropertyRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'content') {
    if (parsed.value === 'none') return { content: 'none' }
    if (parsed.value === 'empty') return { content: '""' }
    if (parsed.arbitrary && parsed.value) return { content: parsed.value }
  }
}

// Container utilities (for container queries)
export const containerRule: UtilityRule = (parsed) => {
  // @container -> container-type: inline-size (most common use case)
  if (parsed.utility === '@container') {
    return { 'container-type': 'inline-size' } as Record<string, string>
  }
  // @container-normal -> container-type: normal (for size containment without inline-size)
  if (parsed.utility === '@container-normal') {
    return { 'container-type': 'normal' } as Record<string, string>
  }
  // @container/name -> container-type: inline-size; container-name: name
  if (parsed.utility.startsWith('@container/')) {
    const name = parsed.utility.slice(11) // Remove '@container/'
    return {
      'container-type': 'inline-size',
      'container-name': name,
    } as Record<string, string>
  }
}

// Flexbox utilities
export const flexDirectionRule: UtilityRule = (parsed) => {
  return FLEX_DIRECTION_DIRECTIONS[parsed.utility] ? { 'flex-direction': FLEX_DIRECTION_DIRECTIONS[parsed.utility] } : undefined
}

export const flexWrapRule: UtilityRule = (parsed) => {
  return FLEX_WRAP_WRAPS[parsed.utility] ? { 'flex-wrap': FLEX_WRAP_WRAPS[parsed.utility] } : undefined
}

export const flexRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'flex' || parsed.utility.startsWith('flex-')) {
    // Handle named flex values
    const flexValues: Record<string, string> = {
      'flex-1': '1 1 0%',
      'flex-auto': '1 1 auto',
      'flex-initial': '0 1 auto',
      'flex-none': 'none',
    }
    if (flexValues[parsed.utility]) {
      return { flex: flexValues[parsed.utility] }
    }
    // Handle arbitrary flex values
    if (parsed.utility === 'flex' && parsed.arbitrary && parsed.value) {
      return { flex: parsed.value.replace(/_/g, ' ') }
    }
  }
  return undefined
}

export const flexGrowRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'flex-grow' && !parsed.value) {
    return { 'flex-grow': '1' }
  }
  if (parsed.utility === 'flex-grow' && parsed.value) {
    return { 'flex-grow': parsed.value }
  }
}

export const flexShrinkRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'flex-shrink' && !parsed.value) {
    return { 'flex-shrink': '1' }
  }
  if (parsed.utility === 'flex-shrink' && parsed.value) {
    return { 'flex-shrink': parsed.value }
  }
}

export const justifyContentRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'justify' && parsed.value) {
    const values: Record<string, string> = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    }
    // Handle named values
    if (values[parsed.value]) {
      return { 'justify-content': values[parsed.value] }
    }
    // Handle arbitrary values
    if (parsed.arbitrary) {
      return { 'justify-content': parsed.value }
    }
  }
  return undefined
}

export const alignItemsRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'items' && parsed.value) {
    const values: Record<string, string> = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      baseline: 'baseline',
      stretch: 'stretch',
    }
    // Handle named values
    if (values[parsed.value]) {
      return { 'align-items': values[parsed.value] }
    }
    // Handle arbitrary values
    if (parsed.arbitrary) {
      return { 'align-items': parsed.value }
    }
  }
  return undefined
}

export const justifyItemsRule: UtilityRule = (parsed) => {
  // Parsed as utility="justify", value="items-center"
  // Need to reconstruct full utility name
  if (parsed.utility === 'justify' && parsed.value && parsed.value.startsWith('items-')) {
    const values: Record<string, string> = {
      'items-start': 'start',
      'items-end': 'end',
      'items-center': 'center',
      'items-stretch': 'stretch',
    }
    return values[parsed.value] ? { 'justify-items': values[parsed.value] } : undefined
  }
  return undefined
}

export const alignContentRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'content' && parsed.value) {
    const values: Record<string, string> = {
      normal: 'normal',
      center: 'center',
      start: 'flex-start',
      end: 'flex-end',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
      baseline: 'baseline',
      stretch: 'stretch',
    }
    return values[parsed.value] ? { 'align-content': values[parsed.value] } : undefined
  }
  return undefined
}

// Spacing utilities (margin, padding)
export const spacingRule: UtilityRule = (parsed, config) => {
  const prefixes: Record<string, string[]> = {
    p: ['padding'],
    px: ['padding-left', 'padding-right'],
    py: ['padding-top', 'padding-bottom'],
    pt: ['padding-top'],
    pr: ['padding-right'],
    pb: ['padding-bottom'],
    pl: ['padding-left'],
    // Logical padding (for RTL support)
    ps: ['padding-inline-start'],
    pe: ['padding-inline-end'],
    m: ['margin'],
    mx: ['margin-left', 'margin-right'],
    my: ['margin-top', 'margin-bottom'],
    mt: ['margin-top'],
    mr: ['margin-right'],
    mb: ['margin-bottom'],
    ml: ['margin-left'],
    // Logical margin (for RTL support)
    ms: ['margin-inline-start'],
    me: ['margin-inline-end'],
  }

  const properties = prefixes[parsed.utility]
  if (!properties || !parsed.value)
    return undefined

  // Resolve a raw token to a concrete CSS length.
  // 1) Theme scale lookup (`4` → `1rem`, `2.5` → `0.625rem`, …).
  // 2) Off-scale positive numbers — Tailwind v4 behavior: any decimal multiple
  //    of 0.25rem is valid (`4.5` → `1.125rem`, `9.5` → `2.375rem`).
  // 3) Arbitrary values (`p-[calc(...)]`) pass through verbatim.
  // 4) Unknown words are rejected — they previously leaked verbatim
  //    (`m-header` emitted `margin: header;`).
  const resolve = (token: string): string | undefined => {
    // `auto` is valid for margins (m-auto, mx-auto); padding has no auto
    if (token === 'auto')
      return parsed.utility.charCodeAt(0) === 109 ? 'auto' : undefined // 'm'
    const hit = config.theme.spacing[token]
    if (hit !== undefined) return hit
    if (parsed.arbitrary) return token
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      const n = Number.parseFloat(token)
      if (Number.isFinite(n)) return `${n * 0.25}rem`
    }
    return undefined
  }

  // Handle negative values. Negative padding is invalid CSS (Tailwind has
  // no -p-* utilities); only margins may go negative.
  let value: string | undefined
  if (parsed.value.startsWith('-')) {
    if (parsed.utility.charCodeAt(0) === 112) // 'p'
      return undefined
    const positiveValue = parsed.value.slice(1)
    // Special case: -0 should just be 0
    if (positiveValue === '0') {
      value = config.theme.spacing[positiveValue] || '0'
    }
    else {
      const resolved = resolve(positiveValue)
      value = resolved === undefined ? undefined : `-${resolved}`
    }
  }
  else {
    value = resolve(parsed.value)
  }

  if (value === undefined)
    return undefined

  const result: Record<string, string> = {}
  for (const prop of properties) {
    result[prop] = value
  }
  return result
}

// Resolve a size/spacing token shared by the sizing utilities: fractions,
// keyword map, theme spacing, off-scale numbers (0.25rem steps), and
// arbitrary values. Unknown words return undefined — they previously
// leaked verbatim (`w-sidebar` emitted `width: sidebar;`).
export function resolveSizeToken(
  parsed: { value?: string, arbitrary: boolean },
  config: { theme: { spacing: Record<string, string> } },
  sizeMap: Record<string, string>,
): string | undefined {
  const token = parsed.value!
  if (token.includes('/') && !parsed.arbitrary) {
    const [num, denom] = token.split('/').map(Number)
    if (Number.isNaN(num) || Number.isNaN(denom) || denom === 0)
      return undefined
    return fractionToPercent(num, denom)
  }
  const spacing = config.theme.spacing[token]
  if (spacing !== undefined)
    return spacing
  if (sizeMap[token])
    return sizeMap[token]
  if (parsed.arbitrary)
    return token
  if (/^\d+(?:\.\d+)?$/.test(token))
    return `${Number.parseFloat(token) * 0.25}rem`
  return undefined
}

// Width and height utilities
export const sizingRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'w' && parsed.value) {
    const sizeMap: Record<string, string> = {
      full: '100%',
      screen: '100vw',
      // Modern viewport units — dynamic / small / large. These track the
      // browser UI state (toolbars, etc.). Without these entries, `w-dvw`
      // fell through to the raw-value path and emitted `width: dvw;`.
      svw: '100svw',
      lvw: '100lvw',
      dvw: '100dvw',
      auto: 'auto',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
    }
    const value = resolveSizeToken(parsed, config, sizeMap)
    return value !== undefined ? { width: value } as Record<string, string> : undefined
  }

  if (parsed.utility === 'h' && parsed.value) {
    const sizeMap: Record<string, string> = {
      full: '100%',
      screen: '100vh',
      // Modern viewport units for mobile-aware layouts.
      svh: '100svh',
      lvh: '100lvh',
      dvh: '100dvh',
      auto: 'auto',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
    }
    const value = resolveSizeToken(parsed, config, sizeMap)
    return value !== undefined ? { height: value } as Record<string, string> : undefined
  }

  // Size utility (width + height shorthand)
  if (parsed.utility === 'size' && parsed.value) {
    const sizeMap: Record<string, string> = {
      full: '100%',
      auto: 'auto',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
    }
    const value = resolveSizeToken(parsed, config, sizeMap)
    return value !== undefined ? { width: value, height: value } as Record<string, string> : undefined
  }

  return undefined
}

// Color utilities (background, text, border)

// Flat color cache: "blue-500" -> "#3b82f6" (populated on first access per config)
let flatColorCache: Map<string, string> | null = null
let flatColorCacheConfig: any = null

// Pre-computed color property map (avoid object creation)
const COLOR_PROPS: Record<string, string> = {
  bg: 'background-color',
  text: 'color',
  border: 'border-color',
}

/**
 * Where a typed arbitrary value lands, per colour utility.
 *
 * `bg-[…]`, `text-[…]` and `border-[…]` all default to a colour, so a value
 * that announces itself as something else — `bg-[position:right_1rem_center]`,
 * `border-[length:3px]` — used to fall through the colour resolver and be
 * emitted as `background-color: right 1rem center` / `border-color: 3px`:
 * declarations the browser drops, silently costing the author the utility they
 * asked for. The parser already separates the hint from the value; this is the
 * table that says what each hint means.
 */
const TYPE_HINT_PROPS: Record<string, Record<string, string>> = {
  bg: {
    color: 'background-color',
    image: 'background-image',
    url: 'background-image',
    position: 'background-position',
    length: 'background-size',
  },
  text: {
    color: 'color',
    length: 'font-size',
    'absolute-size': 'font-size',
    'relative-size': 'font-size',
    'family-name': 'font-family',
  },
  border: {
    color: 'border-color',
    length: 'border-width',
    'line-width': 'border-width',
  },
}

/** Type hints that make `text-[…]` a font-size rather than something else. */
const FONT_SIZE_TYPE_HINTS = new Set(['length', 'absolute-size', 'relative-size', 'percentage', 'number'])

/** CSS functions that produce an <image>, so `bg-[…]` means background-image. */
const IMAGE_VALUE_RE = /^(?:url|(?:repeating-)?(?:linear|radial|conic)-gradient|image-set|-webkit-image-set|cross-fade|element|paint)\(/i

// Special color keywords (pre-defined)
const SPECIAL_COLORS: Record<string, string> = {
  current: 'currentColor',
  transparent: 'transparent',
  inherit: 'inherit',
}

// Build flat color cache from theme colors
function buildFlatColorCache(colors: Record<string, any>): Map<string, string> {
  const cache = new Map<string, string>()
  for (const [colorName, colorValue] of Object.entries(colors)) {
    if (typeof colorValue === 'string') {
      cache.set(colorName, colorValue)
    }
    else if (typeof colorValue === 'object' && colorValue !== null) {
      for (const [shade, shadeValue] of Object.entries(colorValue)) {
        if (typeof shadeValue === 'string') {
          // The `DEFAULT` shade maps to the bare color name (Tailwind convention),
          // so `brand: { DEFAULT: ... }` makes `bg-brand` resolve to that value
          // rather than silently dropping.
          cache.set(shade === 'DEFAULT' ? colorName : `${colorName}-${shade}`, shadeValue)
        }
      }
    }
  }
  return cache
}

export const colorRule: UtilityRule = (parsed, config) => {
  const prop = COLOR_PROPS[parsed.utility]
  if (!prop || !parsed.value)
    return undefined

  const value = parsed.value

  // A typed arbitrary value names its own property (see TYPE_HINT_PROPS).
  // An unrecognised hint means the author asked for something this utility
  // cannot express, so drop the rule rather than emit a bogus colour.
  if (parsed.arbitrary && parsed.typeHint) {
    const hintedProp = TYPE_HINT_PROPS[parsed.utility]?.[parsed.typeHint]
    return hintedProp ? { [hintedProp]: value } : undefined
  }

  // An untyped `bg-[…]` holding an image function is a background-image;
  // only the colour utilities' default reading made it a background-color.
  if (parsed.arbitrary && parsed.utility === 'bg' && IMAGE_VALUE_RE.test(value)) {
    return { 'background-image': value }
  }

  // Build/update flat color cache if needed
  if (flatColorCache === null || flatColorCacheConfig !== config.theme.colors) {
    flatColorCache = buildFlatColorCache(config.theme.colors)
    flatColorCacheConfig = config.theme.colors
  }

  // Fast path: Most common case - direct lookup in flat cache (no string parsing)
  // Check for slash (opacity modifier) first
  const slashIdx = colorModifierSlashIndex(value)
  if (slashIdx === -1) {
    // No opacity - direct lookup
    const colorVal = flatColorCache.get(value)
    if (colorVal) {
      return { [prop]: colorVal }
    }
  }

  // Slower paths for special cases

  // Handle opacity modifier (slashIdx already computed above)
  let opacity: number | undefined
  let colorValue = value

  if (slashIdx !== -1) {
    colorValue = value.slice(0, slashIdx)
    const opacityStr = value.slice(slashIdx + 1)

    // Handle arbitrary opacity: /[0.04], /[0.5], /[.15]
    if (opacityStr.charCodeAt(0) === 91 && opacityStr.charCodeAt(opacityStr.length - 1) === 93) { // '[' and ']'
      const arbitraryOpacity = Number.parseFloat(opacityStr.slice(1, -1))
      if (Number.isNaN(arbitraryOpacity) || arbitraryOpacity < 0 || arbitraryOpacity > 1) {
        return undefined
      }
      opacity = arbitraryOpacity
    }
    else if (parsed.modifierArbitrary) {
      const arbitraryOpacity = Number.parseFloat(opacityStr)
      if (Number.isNaN(arbitraryOpacity) || arbitraryOpacity < 0 || arbitraryOpacity > 1) {
        return undefined
      }
      opacity = arbitraryOpacity
    }
    else {
      // Standard integer opacity: /50, /75 (0-100 scale)
      const opacityValue = Number.parseInt(opacityStr, 10)
      if (Number.isNaN(opacityValue) || opacityValue < 0 || opacityValue > 100) {
        return undefined
      }
      opacity = opacityValue / 100
    }

    // Try flat cache with base color value
    const baseColor = flatColorCache!.get(colorValue)
    if (baseColor) {
      return { [prop]: applyOpacity(baseColor, opacity) }
    }
  }

  // Special color keywords
  const specialColor = SPECIAL_COLORS[colorValue]
  if (specialColor) {
    return { [prop]: specialColor }
  }

  // Only use fallback for arbitrary values (e.g., border-[#ff0000], text-[#ff0000]/50)
  const isArbitrary = parsed.arbitrary || (colorValue && colorValue.charCodeAt(0) === 91) // '[' char
  if (isArbitrary && colorValue) {
    const colorVal = opacity !== undefined
      ? applyOpacity(colorValue, opacity)
      : colorValue
    return { [prop]: colorVal }
  }

  return undefined
}

// Helper to apply opacity to color
export function applyOpacity(color: string, opacity: number): string {
  // Strip brackets from arbitrary values: [#ff0000] -> #ff0000
  let cleanColor = color
  if (color.charCodeAt(0) === 91 && color.charCodeAt(color.length - 1) === 93) { // '[' and ']'
    cleanColor = color.slice(1, -1)
  }

  // If color is hex (#rgb, #rgba, #rrggbb, #rrggbbaa), convert to rgb with
  // alpha. The opacity modifier replaces any alpha already in the hex
  // (Tailwind semantics). Short forms expand per-digit — slicing #f00a as
  // if it were six digits produced rgb(240 10 NaN / ...).
  if (cleanColor.charCodeAt(0) === 35) { // '#' char code for faster check
    let hex = cleanColor.slice(1)
    // Expand short hex (#rgb / #rgba) to per-channel pairs
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map(c => c + c).join('')
    }
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    return `rgb(${r} ${g} ${b} / ${opacity})`
  }
  // If color already has rgb/rgba format, add/replace alpha
  if (cleanColor.charCodeAt(0) === 114) { // 'r' char code for 'rgb'
    const rgbMatch = cleanColor.match(/rgb\((\d+)\s+(\d+)\s+(\d+)/)
    if (rgbMatch) {
      return `rgb(${rgbMatch[1]} ${rgbMatch[2]} ${rgbMatch[3]} / ${opacity})`
    }
  }
  // If color is oklch format, add alpha channel
  if (cleanColor.charCodeAt(0) === 111) { // 'o' char code for 'oklch'
    const oklchMatch = cleanColor.match(/oklch\(([^)]+)\)/)
    if (oklchMatch) {
      // oklch values are: lightness chroma hue
      // Add alpha: oklch(L C H / alpha)
      return `oklch(${oklchMatch[1]} / ${opacity})`
    }
  }
  // If color is hsl/hsla format, add/replace alpha
  if (cleanColor.charCodeAt(0) === 104) { // 'h' char code for 'hsl'
    const hslMatch = cleanColor.match(/hsl\(([^)]+)\)/)
    if (hslMatch) {
      return `hsl(${hslMatch[1]} / ${opacity})`
    }
  }
  // Values whose channels can't be rewritten inline — var() references,
  // color-mix(), named colors, currentColor — get their alpha via color-mix
  // (like Tailwind), instead of silently dropping the opacity and rendering
  // the color fully opaque. `inherit` can't participate in color-mix, so it
  // passes through unchanged.
  if (cleanColor !== 'inherit' && cleanColor !== 'transparent') {
    const pct = Number((opacity * 100).toFixed(2))
    return `color-mix(in srgb, ${cleanColor} ${pct}%, transparent)`
  }
  return cleanColor
}

/**
 * Shared helper: resolve a color value (with optional opacity) from theme config.
 * Handles: special keywords, direct colors, color-shade, opacity modifiers (/50, /[0.04]).
 * Returns the resolved CSS color string or undefined if not found.
 */
export function resolveColorValue(
  value: string,
  config: { theme: { colors: Record<string, any> } },
  modifierArbitrary = false,
): string | undefined {
  const slashIdx = colorModifierSlashIndex(value)
  let colorKey = value
  let opacity: number | undefined

  if (slashIdx !== -1) {
    colorKey = value.slice(0, slashIdx)
    const opacityStr = value.slice(slashIdx + 1)
    if (opacityStr.charCodeAt(0) === 91 && opacityStr.charCodeAt(opacityStr.length - 1) === 93) {
      opacity = Number.parseFloat(opacityStr.slice(1, -1))
      if (Number.isNaN(opacity) || opacity < 0 || opacity > 1) return undefined
    }
    else if (modifierArbitrary) {
      opacity = Number.parseFloat(opacityStr)
      if (Number.isNaN(opacity) || opacity < 0 || opacity > 1) return undefined
    }
    else {
      const opacityInt = Number.parseInt(opacityStr, 10)
      if (Number.isNaN(opacityInt) || opacityInt < 0 || opacityInt > 100) return undefined
      opacity = opacityInt / 100
    }
  }

  // Special keywords
  const special: Record<string, string> = { current: 'currentColor', transparent: 'transparent', inherit: 'inherit', auto: 'auto' }
  if (special[colorKey]) return opacity !== undefined ? applyOpacity(special[colorKey], opacity) : special[colorKey]

  // Direct color name (white, black, etc.)
  const directColor = config.theme.colors[colorKey]
  if (typeof directColor === 'string') return opacity !== undefined ? applyOpacity(directColor, opacity) : directColor

  // Nested color object referenced by its bare name resolves to its `DEFAULT`
  // shade (Tailwind convention): `brand: { DEFAULT: ... }` makes `ring-brand`,
  // `accent-brand`, etc. resolve to that value.
  if (typeof directColor === 'object' && directColor !== null && typeof directColor.DEFAULT === 'string') {
    return opacity !== undefined ? applyOpacity(directColor.DEFAULT, opacity) : directColor.DEFAULT
  }

  // Color with shade: blue-500, gray-300
  const parts = colorKey.split('-')
  if (parts.length >= 2) {
    const shade = parts[parts.length - 1]
    const colorName = parts.slice(0, -1).join('-')
    const colorValue = config.theme.colors[colorName]
    if (typeof colorValue === 'object' && colorValue[shade]) {
      return opacity !== undefined ? applyOpacity(colorValue[shade], opacity) : colorValue[shade]
    }
  }

  // Arbitrary CSS color expression: var(--name), #rgb, #rrggbb[aa], rgb(...),
  // rgba(...), hsl(...), hsla(...), oklch(...), color-mix(...), color(...).
  // The bg/text/border (colorRule) path already handles `parsed.arbitrary`
  // before reaching the resolver, but `accent-[var(--accent)]` and
  // `caret-[var(--accent)]` route through here — without this branch they
  // would silently drop and the form-control's accent-color stays browser
  // default. Passing through verbatim keeps the resolver permissive without
  // losing the theme-color path above.
  if (
    colorKey.startsWith('var(')
    || colorKey.startsWith('#')
    || colorKey.startsWith('rgb(')
    || colorKey.startsWith('rgba(')
    || colorKey.startsWith('hsl(')
    || colorKey.startsWith('hsla(')
    || colorKey.startsWith('oklch(')
    || colorKey.startsWith('oklab(')
    || colorKey.startsWith('lab(')
    || colorKey.startsWith('lch(')
    || colorKey.startsWith('color(')
    || colorKey.startsWith('color-mix(')
    || colorKey.startsWith('hwb(')
  ) {
    return opacity !== undefined ? applyOpacity(colorKey, opacity) : colorKey
  }

  return undefined
}

// Placeholder color utilities (placeholder-{color})
export const placeholderColorRule: UtilityRule = (parsed, config) => {
  if (parsed.utility !== 'placeholder' || !parsed.value)
    return undefined

  // Build/update flat color cache if needed
  if (flatColorCache === null || flatColorCacheConfig !== config.theme.colors) {
    flatColorCache = buildFlatColorCache(config.theme.colors)
    flatColorCacheConfig = config.theme.colors
  }

  const value = parsed.value
  const slashIdx = colorModifierSlashIndex(value)

  if (slashIdx === -1) {
    // No opacity
    const colorVal = flatColorCache.get(value)
    if (colorVal) {
      return {
        properties: { color: colorVal },
        pseudoElement: '::placeholder',
      }
    }
  }
  else {
    // With opacity modifier
    const colorValue = value.slice(0, slashIdx)
    const opacityStr = value.slice(slashIdx + 1)
    let opacity: number

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

    const baseColor = flatColorCache.get(colorValue)
    if (baseColor) {
      return {
        properties: { color: applyOpacity(baseColor, opacity) },
        pseudoElement: '::placeholder',
      }
    }
  }

  // Special colors
  const specialColor = SPECIAL_COLORS[parsed.value]
  if (specialColor) {
    return {
      properties: { color: specialColor },
      pseudoElement: '::placeholder',
    }
  }

  return undefined
}

// Typography utilities
export const fontSizeRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'text' && parsed.value) {
    // Split off an optional line-height modifier: `text-xs/tight`,
    // `text-[14px]/[1.5]`, `text-lg/6`. The font-size rule resolves the
    // size; the line-height comes from theme.lineHeight or is used verbatim.
    let sizeValue = parsed.value
    let lineHeightOverride: string | undefined
    const slashIdx = sizeValue.lastIndexOf('/')
    if (slashIdx !== -1 && !parsed.value.startsWith('[') && !sizeValue.slice(slashIdx + 1).includes(']')) {
      // Slash form: font-size / line-height. Skip if the slash is inside
      // a bracketed arbitrary value (handled by the pre-bracket splitter
      // in the parser, which encodes both halves verbatim).
    }
    if (slashIdx !== -1) {
      const beforeSlash = sizeValue.slice(0, slashIdx)
      const afterSlash = sizeValue.slice(slashIdx + 1)
      // Only treat as size/line-height if the left side is a size keyword or
      // an arbitrary bracket value (already stripped by the parser branch
      // above — leaving us a bare length like `14px`).
      if (afterSlash && (config.theme.fontSize[beforeSlash] || parsed.arbitrary)) {
        sizeValue = beforeSlash
        // Named line-height keywords — mirror the map in leadingRule so
        // `text-xs/tight` produces `line-height: 1.25` not `line-height: tight`.
        const NAMED_LH: Record<string, string> = {
          none: '1',
          tight: '1.25',
          snug: '1.375',
          normal: '1.5',
          relaxed: '1.625',
          loose: '2',
          3: '0.75rem',
          4: '1rem',
          5: '1.25rem',
          6: '1.5rem',
          7: '1.75rem',
          8: '2rem',
          9: '2.25rem',
          10: '2.5rem',
        }
        const themeLh = config.theme.lineHeight?.[afterSlash]
        lineHeightOverride = themeLh ?? NAMED_LH[afterSlash] ?? afterSlash
      }
    }

    // Handle arbitrary values first
    if (parsed.arbitrary) {
      // A type hint is only ours when it names a size. Every other hint —
      // `color`, and `family-name`, which this branch used to turn into
      // `font-size: Inter` — belongs to colorRule's TYPE_HINT_PROPS table.
      if (parsed.typeHint) {
        if (!FONT_SIZE_TYPE_HINTS.has(parsed.typeHint)) {
          return undefined
        }
        const out: Record<string, string> = { 'font-size': sizeValue }
        if (lineHeightOverride) out['line-height'] = lineHeightOverride
        return out
      }
      // No type hint - detect if the value looks like a color and let colorRule handle it
      if (/^#|^rgb|^hsl|^hwb|^lab|^lch|^oklch|^oklab|^color\(|^var\(--/.test(sizeValue)) {
        return undefined
      }
      const out: Record<string, string> = { 'font-size': sizeValue }
      if (lineHeightOverride) out['line-height'] = lineHeightOverride
      return out
    }
    const fontSize = config.theme.fontSize[sizeValue]
    if (fontSize) {
      return {
        'font-size': fontSize[0],
        'line-height': lineHeightOverride ?? fontSize[1].lineHeight,
      } as Record<string, string>
    }
  }
}

export const fontWeightRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'font' && parsed.value) {
    // Handle arbitrary values. Type hints disambiguate the CSS property:
    //   font-[family-name:Inter_Tight] → font-family
    //   font-[string:"Press Start"]    → font-family (same vibe)
    //   font-[600]                     → font-weight (default)
    //   font-[number:800]              → font-weight
    if (parsed.arbitrary) {
      const hint = parsed.typeHint
      const out: Record<string, string> = hint === 'family-name' || hint === 'string'
        ? { 'font-family': parsed.value }
        : { 'font-weight': parsed.value }
      return out
    }
    const weights: Record<string, string> = {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    }
    return weights[parsed.value] ? { 'font-weight': weights[parsed.value] } : undefined
  }
  return undefined
}

export const leadingRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'leading' && parsed.value) {
    // Handle arbitrary values first
    if (parsed.arbitrary) {
      return { 'line-height': parsed.value }
    }
    // Named line-height values
    const lineHeights: Record<string, string> = {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
      // Numeric values (rem-based)
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '7': '1.75rem',
      '8': '2rem',
      '9': '2.25rem',
      '10': '2.5rem',
    }
    return lineHeights[parsed.value] ? { 'line-height': lineHeights[parsed.value] } : undefined
  }
  return undefined
}

export const textAlignRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'text' && parsed.value) {
    const aligns: Record<string, string> = {
      left: 'left',
      center: 'center',
      right: 'right',
      justify: 'justify',
    }
    return aligns[parsed.value] ? { 'text-align': aligns[parsed.value] } : undefined
  }
}

// Border utilities
export const borderWidthRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'border') {
    if (!parsed.value) {
      return { 'border-width': '1px' }
    }

    // Border width values: 0, 2, 4, 8
    const widthMap: Record<string, string> = {
      0: '0px',
      2: '2px',
      4: '4px',
      8: '8px',
    }

    // Handle border-0, border-2, border-4, border-8
    if (widthMap[parsed.value]) {
      return { 'border-width': widthMap[parsed.value] }
    }

    const sideMap: Record<string, string | string[]> = {
      t: 'border-top-width',
      r: 'border-right-width',
      b: 'border-bottom-width',
      l: 'border-left-width',
      s: 'border-inline-start-width',
      e: 'border-inline-end-width',
    }

    // Handle border-x and border-y shortcuts
    if (parsed.value === 'x') {
      return {
        'border-left-width': '1px',
        'border-right-width': '1px',
      } as Record<string, string>
    }
    if (parsed.value === 'y') {
      return {
        'border-top-width': '1px',
        'border-bottom-width': '1px',
      } as Record<string, string>
    }

    const prop = sideMap[parsed.value]
    if (typeof prop === 'string') {
      return { [prop]: '1px' } as Record<string, string>
    }
    return undefined
  }
}

// Border side width utilities (border-t-0, border-r-2, border-x-4, etc.)
export const borderSideWidthRule: UtilityRule = (parsed, config) => {
  const sideWidthProps: Record<string, string | string[]> = {
    'border-t': 'border-top-width',
    'border-r': 'border-right-width',
    'border-b': 'border-bottom-width',
    'border-l': 'border-left-width',
    'border-x': ['border-left-width', 'border-right-width'],
    'border-y': ['border-top-width', 'border-bottom-width'],
    // Logical borders (for RTL support)
    'border-s': 'border-inline-start-width',
    'border-e': 'border-inline-end-width',
  }
  const sideColorProps: Record<string, string | string[]> = {
    'border-t': 'border-top-color',
    'border-r': 'border-right-color',
    'border-b': 'border-bottom-color',
    'border-l': 'border-left-color',
    'border-x': ['border-left-color', 'border-right-color'],
    'border-y': ['border-top-color', 'border-bottom-color'],
    'border-s': 'border-inline-start-color',
    'border-e': 'border-inline-end-color',
  }

  const widthProp = sideWidthProps[parsed.utility]
  if (!widthProp)
    return undefined

  // Width values: 0, 2, 4, 8 (or default to 1px if no value)

  // No value → default 1px width
  if (!parsed.value) {
    const prop = widthProp
    if (Array.isArray(prop)) {
      return prop.reduce((acc, p) => ({ ...acc, [p]: '1px' }), {} as Record<string, string>)
    }
    return { [prop]: '1px' }
  }

  // Arbitrary values route to width when they look like a length
  // (`[2px]`, `[0.5rem]`, etc.) or to color when they look like a color
  // (`[#ff0000]`, `[rgb(...)]`).
  if (parsed.arbitrary) {
    const val = parsed.value
    const looksLikeColor = /^#|^(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(|^(?:currentColor|transparent|inherit)$/i.test(val)
    const target = looksLikeColor ? sideColorProps[parsed.utility] : widthProp
    const prop = target ?? widthProp
    if (Array.isArray(prop)) {
      return prop.reduce((acc, p) => ({ ...acc, [p]: val }), {} as Record<string, string>)
    }
    return { [prop]: val }
  }

  // Named width from the simple map
  if (BORDER_SIDE_WIDTH_WIDTHMAP[parsed.value]) {
    const prop = widthProp
    if (Array.isArray(prop)) {
      return prop.reduce((acc, p) => ({ ...acc, [p]: BORDER_SIDE_WIDTH_WIDTHMAP[parsed.value!] }), {} as Record<string, string>)
    }
    return { [prop]: BORDER_SIDE_WIDTH_WIDTHMAP[parsed.value] }
  }

  // Color palette lookup for `border-r-red-500`, `border-t-gray-800`, etc.
  const colorProp = sideColorProps[parsed.utility]
  if (colorProp && config) {
    const colorParts = parsed.value.split('-')
    if (colorParts.length >= 2) {
      const shade = colorParts[colorParts.length - 1]
      const colorName = colorParts.slice(0, -1).join('-')
      const entry = config.theme.colors[colorName]
      if (entry && typeof entry === 'object' && entry[shade]) {
        const prop = colorProp
        if (Array.isArray(prop)) {
          return prop.reduce((acc, p) => ({ ...acc, [p]: entry[shade] }), {} as Record<string, string>)
        }
        return { [prop]: entry[shade] }
      }
    }
    // Direct color keyword (white, black, transparent, currentColor)
    const direct = config.theme.colors[parsed.value]
    if (typeof direct === 'string') {
      const prop = colorProp
      if (Array.isArray(prop)) {
        return prop.reduce((acc, p) => ({ ...acc, [p]: direct }), {} as Record<string, string>)
      }
      return { [prop]: direct }
    }
    // Nested color object referenced by its bare name → `DEFAULT` shade.
    if (direct && typeof direct === 'object' && typeof direct.DEFAULT === 'string') {
      const prop = colorProp
      if (Array.isArray(prop)) {
        return prop.reduce((acc, p) => ({ ...acc, [p]: direct.DEFAULT }), {} as Record<string, string>)
      }
      return { [prop]: direct.DEFAULT }
    }
    if (parsed.value === 'transparent' || parsed.value === 'current' || parsed.value === 'inherit') {
      const val = parsed.value === 'current' ? 'currentColor' : parsed.value
      const prop = colorProp
      if (Array.isArray(prop)) {
        return prop.reduce((acc, p) => ({ ...acc, [p]: val }), {} as Record<string, string>)
      }
      return { [prop]: val }
    }
  }

  return undefined
}

// Radius token for side/corner variants: bare form takes the DEFAULT theme
// radius (`rounded-t` = 0.25rem like Tailwind), then theme keys and
// arbitrary values. Unknown words previously leaked verbatim
// (`rounded-t-foo` emitted border-top-*-radius: foo).
function resolveRadiusToken(
  parsed: { value?: string, arbitrary: boolean },
  config: { theme: { borderRadius: Record<string, string> } },
): string | undefined {
  if (!parsed.value)
    return config.theme.borderRadius.DEFAULT
  if (config.theme.borderRadius[parsed.value] !== undefined)
    return config.theme.borderRadius[parsed.value]
  if (parsed.arbitrary)
    return parsed.value
  return undefined
}

// Bare side/corner forms (`rounded-t`, `rounded-ss`) parse as utility
// `rounded` + value `t`, so the side handlers below never see them. Map the
// side key to its properties here so they take the DEFAULT radius.
const RADIUS_SIDE_PROPS: Record<string, string[]> = {
  t: ['border-top-left-radius', 'border-top-right-radius'],
  r: ['border-top-right-radius', 'border-bottom-right-radius'],
  b: ['border-bottom-left-radius', 'border-bottom-right-radius'],
  l: ['border-top-left-radius', 'border-bottom-left-radius'],
  tl: ['border-top-left-radius'],
  tr: ['border-top-right-radius'],
  bl: ['border-bottom-left-radius'],
  br: ['border-bottom-right-radius'],
  s: ['border-start-start-radius', 'border-end-start-radius'],
  e: ['border-start-end-radius', 'border-end-end-radius'],
  ss: ['border-start-start-radius'],
  se: ['border-start-end-radius'],
  es: ['border-end-start-radius'],
  ee: ['border-end-end-radius'],
}

export const borderRadiusRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'rounded') {
    if (parsed.arbitrary && parsed.value) {
      return { 'border-radius': parsed.value } as Record<string, string>
    }
    if (parsed.value && RADIUS_SIDE_PROPS[parsed.value]) {
      const radius = config.theme.borderRadius.DEFAULT
      const out: Record<string, string> = {}
      for (const p of RADIUS_SIDE_PROPS[parsed.value]) out[p] = radius
      return out
    }
    const value = parsed.value ? config.theme.borderRadius[parsed.value] : config.theme.borderRadius.DEFAULT
    return value ? { 'border-radius': value } : undefined
  }

  // Logical border-radius utilities (for RTL/LTR support)
  // rounded-s-* (start) - applies to start corners
  if (parsed.utility === 'rounded-s') {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    return {
      'border-start-start-radius': value,
      'border-end-start-radius': value,
    } as Record<string, string>
  }
  // rounded-e-* (end) - applies to end corners
  if (parsed.utility === 'rounded-e') {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    return {
      'border-start-end-radius': value,
      'border-end-end-radius': value,
    } as Record<string, string>
  }
  // rounded-ss-* (start-start corner)
  if (parsed.utility === 'rounded-ss') {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    return { 'border-start-start-radius': value } as Record<string, string>
  }
  // rounded-se-* (start-end corner)
  if (parsed.utility === 'rounded-se') {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    return { 'border-start-end-radius': value } as Record<string, string>
  }
  // rounded-es-* (end-start corner)
  if (parsed.utility === 'rounded-es') {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    return { 'border-end-start-radius': value } as Record<string, string>
  }
  // rounded-ee-* (end-end corner)
  if (parsed.utility === 'rounded-ee') {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    return { 'border-end-end-radius': value } as Record<string, string>
  }

  // Physical side + corner variants: rounded-t-*, rounded-r-*, rounded-b-*,
  // rounded-l-*, rounded-tl-*, rounded-tr-*, rounded-bl-*, rounded-br-*.
  // Mirror the size-keyword fast path so `rounded-tr-2xl`, `rounded-bl-[6px]`,
  // and theme-extension values all resolve. The fast-path lookup table in
  // generator.ts only covers the `-lg`/`-sm`/`-none` triplet, so without
  // this, every other size (including all arbitrary values) dropped.
  const physicalMap: Record<string, string[]> = {
    'rounded-t': ['border-top-left-radius', 'border-top-right-radius'],
    'rounded-r': ['border-top-right-radius', 'border-bottom-right-radius'],
    'rounded-b': ['border-bottom-left-radius', 'border-bottom-right-radius'],
    'rounded-l': ['border-top-left-radius', 'border-bottom-left-radius'],
    'rounded-tl': ['border-top-left-radius'],
    'rounded-tr': ['border-top-right-radius'],
    'rounded-bl': ['border-bottom-left-radius'],
    'rounded-br': ['border-bottom-right-radius'],
  }
  const props = physicalMap[parsed.utility]
  if (props) {
    const value = resolveRadiusToken(parsed, config)
    if (value === undefined)
      return undefined
    const out: Record<string, string> = {}
    for (const p of props) out[p] = value
    return out
  }
}

// Export all rules (order matters - more specific rules first)
export const builtInRules: UtilityRule[] = [
  // CRITICAL: Most common utilities first for O(1) lookup performance
  // Rule order matters! More specific rules must come before more general ones.

  // Iconify-style `i-{collection}-{name}` icons. Must be first because the
  // pattern is unambiguous and skipping the rest of the chain on match keeps
  // pages with lots of icons fast. Returns undefined when @iconify-json/<X>
  // isn't installed, so the lookup is silently no-op for unknown collections.
  iconRule,

  // Spacing and sizing rules (w, h, p, m are extremely common)
  spacingRule,
  sizingRule,

  // ALL rules that use utility names that might conflict MUST be ordered correctly!
  // More specific rules must come before more general ones.

  // Flexbox/Grid alignment rules (content-* for align-content)
  // MUST come before typography contentRule which generates CSS content property
  alignContentRule,  // handles content-center, content-start, etc. -> align-content

  // Typography rules (text-*)
  fontSizeRule,      // handles text-{size} (text-xl, text-sm, etc.)
  textAlignRule,     // handles text-{align} (text-center, text-left, etc.)
  ...typographyRules, // handles text-ellipsis, text-wrap, text-transform, contentRule, etc.
  fontWeightRule,
  leadingRule,       // handles leading-{size} (leading-tight, leading-none, etc.)

  // Mask utilities (v4 names: mask-add, mask-center, mask-cover, …)
  // MUST come before effectsRules, whose maskRule owns the longhand
  // spellings (mask-composite-*, mask-position-*, mask-size-*).
  ...maskRules,

  // Effects rules that use 'bg' utility (bg-gradient-*, bg-fixed, bg-clip-*, etc.)
  ...effectsRules,

  // Placeholder color rule (placeholder-{color} -> ::placeholder { color })
  placeholderColorRule,

  // Color rule (bg, text, border are very common)
  // IMPORTANT: This must come AFTER all specific text-*, bg-*, border-* rules
  // because it will match ANY text-*, bg-*, border-* class
  colorRule,

  // Advanced rules (container, ring, space, divide, gradients, etc.)
  ...advancedRules,

  // Layout rules (specific positioning and display)
  ...layoutRules,

  // Other Flexbox rules
  flexDirectionRule,
  flexWrapRule,
  flexRule,
  flexGrowRule,
  flexShrinkRule,
  justifyContentRule,
  alignItemsRule,
  justifyItemsRule,

  // Grid rules
  ...gridRules,

  // Transform and transition rules
  ...transformsRules,

  // Effects and filters
  ...effectsRules,

  // Interactivity, SVG, and accessibility
  ...interactivityRules,

  // Forms utilities
  ...formsRules,

  // Border rules (specific side rules first)
  borderSideWidthRule,
  borderWidthRule,
  borderRadiusRule,

  // Container query utilities (@container, @container-normal, @container/name)
  containerRule,

  // Scrollbar utilities
  scrollbarRule,

  // Content property (CSS content for pseudo-elements)
  contentPropertyRule,

  // Display rule last (most general - matches many utility names)
  displayRule,
]
