import type { UtilityRule } from './rules'
import { colorModifierSlashIndex } from './color-modifier'
import { resolveColorValue, resolveSizeToken, themeColorValue } from './rules'
import { BOX_SHADOW_LAYERS } from './shadow-layers'

const MIN_MAX_SIZING_MINMAXMAP: Record<string, string> = {
  '0': '0',
  'full': '100%',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
  'none': 'none',
  'xs': '20rem',
  'sm': '24rem',
  'md': '28rem',
  'lg': '32rem',
  'xl': '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  'screen': '100vw',
}

/**
 * max-width takes one extra token the other three do not: `prose`, the
 * measure of a comfortable line of text. Tailwind has no `min-w-prose`
 * or `max-h-prose`, so it must not go in the shared map above.
 */
const MAX_WIDTH_ONLY_MAP: Record<string, string> = {
  ...MIN_MAX_SIZING_MINMAXMAP,
  prose: '65ch',
}


// Advanced utilities

// Opacity token: scale keys, any 0-100 integer (n/100), or arbitrary values.
// Unknown words previously leaked into the CSS variable verbatim.
function resolveOpacityToken(
  parsed: { value?: string, arbitrary: boolean },
  opacityMap: Record<string, string>,
  prop: string,
): Record<string, string> | undefined {
  const value = parsed.value!
  if (opacityMap[value])
    return { [prop]: opacityMap[value] }
  if (parsed.arbitrary)
    return { [prop]: value }
  if (/^\d+$/.test(value)) {
    const n = Number.parseInt(value, 10)
    if (n >= 0 && n <= 100)
      return { [prop]: `${n / 100}` }
  }
  return undefined
}

// Min/Max sizing
export const minMaxSizingRule: UtilityRule = (parsed, config) => {

  if (parsed.utility === 'min-w' && parsed.value) {
    const value = resolveSizeToken(parsed, config, MIN_MAX_SIZING_MINMAXMAP)
    return value !== undefined ? { 'min-width': value } as Record<string, string> : undefined
  }
  if (parsed.utility === 'max-w' && parsed.value) {
    // `prose` is a max-width-only token — Tailwind has no min-w-prose or
    // max-h-prose — so it cannot live in the shared sizing map.
    const value = resolveSizeToken(parsed, config, MAX_WIDTH_ONLY_MAP)
    return value !== undefined ? { 'max-width': value } as Record<string, string> : undefined
  }
  if (parsed.utility === 'min-h' && parsed.value) {
    const hMap: Record<string, string> = { ...MIN_MAX_SIZING_MINMAXMAP, screen: '100vh' }
    const value = resolveSizeToken(parsed, config, hMap)
    return value !== undefined ? { 'min-height': value } as Record<string, string> : undefined
  }
  if (parsed.utility === 'max-h' && parsed.value) {
    const hMap: Record<string, string> = { ...MIN_MAX_SIZING_MINMAXMAP, screen: '100vh' }
    const value = resolveSizeToken(parsed, config, hMap)
    return value !== undefined ? { 'max-height': value } as Record<string, string> : undefined
  }
}

// Ring utilities
export const ringRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'ring') {
    // Handle ring-inset
    if (parsed.value === 'inset') {
      return { '--tc-ring-inset': 'inset' } as Record<string, string>
    }

    // Check if this is a ring color (e.g., ring-sky-500, ring-white/50)
    if (parsed.value) {
      const color = resolveColorValue(parsed.value, config, parsed.modifierArbitrary)
      if (color) {
        return { '--tc-ring-color': color } as Record<string, string>
      }
    }

    // Handle ring width
    const widths: Record<string, string> = {
      0: '0',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
      // v4's bare-`ring` width. Kept in step with RING_MAP in the
      // generator, which serves the same class on the fast path.
      DEFAULT: '1px',
    }
    // Ring widths: scale keys, bare numbers (px implied), or arbitrary.
    // Unknown words previously produced calc(foo + ...) garbage (they are
    // not colors either, or the color branch above would have taken them).
    let width: string | undefined
    if (!parsed.value)
      width = widths.DEFAULT
    else if (widths[parsed.value])
      width = widths[parsed.value]
    else if (parsed.arbitrary)
      width = parsed.value
    else if (/^\d+(?:\.\d+)?$/.test(parsed.value))
      width = `${parsed.value}px`
    if (width === undefined)
      return undefined
    // Fallbacks are required: no preflight defines the ring variables, and a
    // var() without fallback that resolves to nothing invalidates the whole
    // box-shadow at computed-value time.
    return {
      '--tc-ring-offset-shadow': 'var(--tc-ring-inset,) 0 0 0 var(--tc-ring-offset-width, 0px) var(--tc-ring-offset-color, #fff)',
      '--tc-ring-shadow': `var(--tc-ring-inset,) 0 0 0 calc(${width} + var(--tc-ring-offset-width, 0px)) var(--tc-ring-color, currentcolor)`,
      'box-shadow': BOX_SHADOW_LAYERS,
    } as Record<string, string>
  }

  if (parsed.utility === 'ring-offset' && parsed.value) {
    // First check if it's a width value
    const widths: Record<string, string> = {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    }
    if (widths[parsed.value]) {
      return { '--tc-ring-offset-width': widths[parsed.value] } as Record<string, string>
    }

    // Otherwise, treat as a color (e.g., ring-offset-white, ring-offset-blue-500/50)
    const color = resolveColorValue(parsed.value, config, parsed.modifierArbitrary)
    if (color) {
      return { '--tc-ring-offset-color': color } as Record<string, string>
    }
  }

  // Ring opacity
  if (parsed.utility === 'ring-opacity' && parsed.value) {
    const opacityMap: Record<string, string> = {
      0: '0', 5: '0.05', 10: '0.1', 20: '0.2', 25: '0.25',
      30: '0.3', 40: '0.4', 50: '0.5', 60: '0.6', 70: '0.7',
      75: '0.75', 80: '0.8', 90: '0.9', 95: '0.95', 100: '1',
    }
    return resolveOpacityToken(parsed, opacityMap, '--tc-ring-opacity')
  }
}

// Border opacity utility
export const borderOpacityRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'border-opacity' && parsed.value) {
    const opacityMap: Record<string, string> = {
      0: '0', 5: '0.05', 10: '0.1', 20: '0.2', 25: '0.25',
      30: '0.3', 40: '0.4', 50: '0.5', 60: '0.6', 70: '0.7',
      75: '0.75', 80: '0.8', 90: '0.9', 95: '0.95', 100: '1',
    }
    return resolveOpacityToken(parsed, opacityMap, '--tc-border-opacity')
  }
}

// Between-element spacing token: theme scale, off-scale numbers (0.25rem
// steps), negatives of both, or arbitrary values. Unknown words previously
// leaked into calc() expressions (`space-x-foo` -> margin: calc(foo * ...)).
function resolveSpaceToken(
  parsed: { value?: string, arbitrary: boolean },
  config: { theme: { spacing: Record<string, string> } },
): string | undefined {
  const value = parsed.value!
  if (parsed.arbitrary)
    return value
  const negative = value.startsWith('-')
  const token = negative ? value.slice(1) : value
  let resolved: string | undefined = config.theme.spacing[token]
  if (resolved === undefined && /^\d+(?:\.\d+)?$/.test(token))
    resolved = `${Number.parseFloat(token) * 0.25}rem`
  if (resolved === undefined)
    return undefined
  return negative ? `-${resolved}` : resolved
}

// Space utilities (child spacing)
export const spaceRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'space-x' && parsed.value) {
    // space-x-reverse toggles the CSS variable
    if (parsed.value === 'reverse') {
      return {
        properties: { '--tc-space-x-reverse': '1' } as Record<string, string>,
        childSelector: '> :not([hidden]) ~ :not([hidden])',
      }
    }

    const spacing = resolveSpaceToken(parsed, config)
    if (spacing === undefined)
      return undefined

    return {
      properties: {
        '--tc-space-x-reverse': '0',
        'margin-right': `calc(${spacing} * var(--tc-space-x-reverse))`,
        'margin-left': `calc(${spacing} * calc(1 - var(--tc-space-x-reverse)))`,
      } as Record<string, string>,
      childSelector: '> :not([hidden]) ~ :not([hidden])',
    }
  }

  if (parsed.utility === 'space-y' && parsed.value) {
    // space-y-reverse toggles the CSS variable
    if (parsed.value === 'reverse') {
      return {
        properties: { '--tc-space-y-reverse': '1' } as Record<string, string>,
        childSelector: '> :not([hidden]) ~ :not([hidden])',
      }
    }

    const spacing = resolveSpaceToken(parsed, config)
    if (spacing === undefined)
      return undefined

    return {
      properties: {
        '--tc-space-y-reverse': '0',
        'margin-top': `calc(${spacing} * calc(1 - var(--tc-space-y-reverse)))`,
        'margin-bottom': `calc(${spacing} * var(--tc-space-y-reverse))`,
      } as Record<string, string>,
      childSelector: '> :not([hidden]) ~ :not([hidden])',
    }
  }
}

// Border style utilities
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
    if (styles[parsed.value]) {
      return { 'border-style': styles[parsed.value] }
    }
  }
}

// Divide border width: scale keys, bare numbers (px implied), or arbitrary.
// Unknown words previously leaked into calc() border widths.
function resolveDivideWidth(parsed: { value?: string, arbitrary: boolean }): string | undefined {
  if (!parsed.value)
    return '1px'
  const widths: Record<string, string> = { 0: '0', 2: '2px', 4: '4px', 8: '8px' }
  if (widths[parsed.value])
    return widths[parsed.value]
  if (parsed.arbitrary)
    return parsed.value
  if (/^\d+(?:\.\d+)?$/.test(parsed.value))
    return `${parsed.value}px`
  return undefined
}

// The parser strips the brackets off an arbitrary value only when there is no
// opacity modifier, so `divide-[#262625]` arrives bare while
// `divide-[#262625]/50` still arrives wrapped. Unwrap the colour half (leaving
// any modifier attached) so both forms reach the shared resolver.
function unwrapArbitraryColor(value: string): string {
  const slashIdx = colorModifierSlashIndex(value)
  const color = slashIdx === -1 ? value : value.slice(0, slashIdx)
  if (color.charCodeAt(0) !== 91 || color.charCodeAt(color.length - 1) !== 93)
    return value
  const bare = color.slice(1, -1).replace(/_/g, ' ')
  return slashIdx === -1 ? bare : bare + value.slice(slashIdx)
}

// Divide utilities (borders between children)
export const divideRule: UtilityRule = (parsed, config) => {
  // Handle divide styles: divide-solid, divide-dashed, divide-dotted
  if (parsed.utility === 'divide' && parsed.value) {
    const styles: Record<string, string> = {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
      none: 'none',
    }
    if (styles[parsed.value]) {
      return {
        properties: {
          'border-style': styles[parsed.value],
        } as Record<string, string>,
        childSelector: '> :not([hidden]) ~ :not([hidden])',
      }
    }
  }

  if (parsed.utility === 'divide-x') {
    // divide-x-reverse toggles the CSS variable
    if (parsed.value === 'reverse') {
      return {
        properties: { '--tc-divide-x-reverse': '1' } as Record<string, string>,
        childSelector: '> :not([hidden]) ~ :not([hidden])',
      }
    }

    const width = resolveDivideWidth(parsed)
    if (width === undefined)
      return undefined

    return {
      properties: {
        '--tc-divide-x-reverse': '0',
        'border-right-width': `calc(${width} * var(--tc-divide-x-reverse))`,
        'border-left-width': `calc(${width} * calc(1 - var(--tc-divide-x-reverse)))`,
      } as Record<string, string>,
      childSelector: '> :not([hidden]) ~ :not([hidden])',
    }
  }

  if (parsed.utility === 'divide-y') {
    // divide-y-reverse toggles the CSS variable
    if (parsed.value === 'reverse') {
      return {
        properties: { '--tc-divide-y-reverse': '1' } as Record<string, string>,
        childSelector: '> :not([hidden]) ~ :not([hidden])',
      }
    }

    const width = resolveDivideWidth(parsed)
    if (width === undefined)
      return undefined

    return {
      properties: {
        '--tc-divide-y-reverse': '0',
        'border-top-width': `calc(${width} * calc(1 - var(--tc-divide-y-reverse)))`,
        'border-bottom-width': `calc(${width} * var(--tc-divide-y-reverse))`,
      } as Record<string, string>,
      childSelector: '> :not([hidden]) ~ :not([hidden])',
    }
  }

  if (parsed.utility === 'divide' && parsed.value) {
    // Divide colours used to re-implement the shared colour resolver inline,
    // and had drifted out of sync with it: named colours and `divide-current`
    // worked, but every arbitrary value (`divide-[#262625]`,
    // `divide-[var(--line)]`) generated no CSS at all. That is worse than a
    // wrong colour - a `divide-y divide-[var(--line)]` pair silently fell back
    // to the preflight border colour, so a dark theme grew bright dividers.
    // Delegating keeps divide at parity with bg/text/border/ring for free.
    const value = unwrapArbitraryColor(parsed.value)

    // `auto` is a valid keyword for the resolver (accent-color takes it) but
    // not for border-color, so it must not leak in here as invalid CSS.
    if (value === 'auto')
      return undefined

    const color = resolveColorValue(value, config, parsed.modifierArbitrary)
    if (color !== undefined) {
      return {
        properties: { 'border-color': color } as Record<string, string>,
        childSelector: '> :not([hidden]) ~ :not([hidden])',
      }
    }
  }
}

// Gradient color stops
export const gradientStopsRule: UtilityRule = (parsed, config) => {
  const getColor = (value: string) => {
    // Support the opacity-modifier shorthand: `red-500/50`, `red-500/[0.33]`.
    // The parser hands us the raw `color/alpha` string when the utility is
    // a gradient stop; we split it back out here and feed the base color
    // through the same lookup table used without an alpha.
    let alpha: string | null = null
    let lookup = value
    const slashIdx = colorModifierSlashIndex(value)
    if (slashIdx !== -1) {
      lookup = value.slice(0, slashIdx)
      const rawAlpha = value.slice(slashIdx + 1)
      if (rawAlpha.startsWith('[') && rawAlpha.endsWith(']')) {
        alpha = rawAlpha.slice(1, -1)
      }
      else if (parsed.modifierArbitrary) {
        const fraction = Number.parseFloat(rawAlpha)
        if (!Number.isNaN(fraction) && fraction >= 0 && fraction <= 1)
          alpha = fraction.toString()
      }
      else {
        const pct = Number.parseInt(rawAlpha, 10)
        if (!Number.isNaN(pct)) alpha = (pct / 100).toString()
      }
    }

    const applyAlpha = (base: string): string => {
      if (!alpha) return base
      // oklch / rgb / hsl with slash syntax: inject alpha before the closing `)`.
      const mSpace = base.match(/^(oklch|rgb|hsl|oklab|lab|lch)\(([^)]+)\)$/i)
      if (mSpace) {
        const fn = mSpace[1]
        // Existing alpha (if any) is everything after `/`
        const inner = mSpace[2].split('/')[0].trim()
        return `${fn}(${inner} / ${alpha})`
      }
      // Hex or named color → use rgb() with calc-alpha via color-mix? Cheapest
      // path: keep base and let consumers rely on rgb(r g b / a) for OKLCH.
      // For hex, convert to rgb() fallback.
      if (/^#[0-9a-f]{3,8}$/i.test(base)) {
        const hex = base.replace('#', '')
        const parse = (h: string) => Number.parseInt(h.length === 1 ? h + h : h, 16)
        const r = parse(hex.slice(0, hex.length === 3 ? 1 : 2))
        const g = parse(hex.slice(hex.length === 3 ? 1 : 2, hex.length === 3 ? 2 : 4))
        const b = parse(hex.slice(hex.length === 3 ? 2 : 4, hex.length === 3 ? 3 : 6))
        return `rgb(${r} ${g} ${b} / ${alpha})`
      }
      // Fallback: let color-mix carry the alpha (modern-browser-safe).
      return `color-mix(in srgb, ${base} ${Math.round(Number.parseFloat(alpha) * 100)}%, transparent)`
    }

    // Arbitrary color like `[#FF3E54]` — strip the square brackets before
    // alpha handling. Without this the CSS variable picks up the raw
    // bracketed token, producing invalid `var(--tc-gradient-from: [#...]`.
    if (lookup.startsWith('[') && lookup.endsWith(']')) {
      lookup = lookup.slice(1, -1)
    }

    // First check if it's a direct color value (e.g., ocean-blue, black, white)
    const directColor = config.theme.colors[lookup]
    if (typeof directColor === 'string') {
      return applyAlpha(themeColorValue(lookup, directColor, lookup, config.colorVariables))
    }

    // Nested color object referenced by its bare name → `DEFAULT` shade.
    if (typeof directColor === 'object' && directColor !== null && typeof directColor.DEFAULT === 'string') {
      return applyAlpha(themeColorValue(lookup, directColor.DEFAULT, lookup, config.colorVariables))
    }

    // Then check if it's a color-shade combination (e.g., sky-500, blue-gray-200)
    const parts = lookup.split('-')
    if (parts.length >= 2) {
      const colorName = parts.slice(0, -1).join('-')
      const shade = parts[parts.length - 1]
      const colorValue = config.theme.colors[colorName]
      if (typeof colorValue === 'object' && colorValue[shade]) {
        return applyAlpha(themeColorValue(lookup, colorValue[shade], colorName, config.colorVariables))
      }
    }

    // Arbitrary values and CSS color expressions pass through the alpha
    // path; unknown bare words are rejected — they previously leaked into
    // the gradient variables (`from-foo` -> --tc-gradient-from: foo).
    if (
      parsed.arbitrary
      || lookup.startsWith('#')
      || /^(?:var|rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|color-mix)\(/.test(lookup)
    ) {
      return applyAlpha(lookup)
    }

    return undefined
  }

  if (parsed.utility === 'from' && parsed.value) {
    const color = getColor(parsed.value)
    if (color === undefined)
      return undefined
    return {
      '--tc-gradient-from': color,
      '--tc-gradient-to': 'rgb(255 255 255 / 0)',
      '--tc-gradient-stops': 'var(--tc-gradient-from), var(--tc-gradient-to)',
    } as Record<string, string>
  }

  if (parsed.utility === 'via' && parsed.value) {
    const color = getColor(parsed.value)
    if (color === undefined)
      return undefined
    return {
      '--tc-gradient-to': 'rgb(255 255 255 / 0)',
      '--tc-gradient-stops': `var(--tc-gradient-from), ${color}, var(--tc-gradient-to)`,
    } as Record<string, string>
  }

  if (parsed.utility === 'to' && parsed.value) {
    const color = getColor(parsed.value)
    if (color === undefined)
      return undefined
    return {
      '--tc-gradient-to': color,
      '--tc-gradient-stops': 'var(--tc-gradient-from), var(--tc-gradient-to)',
    } as Record<string, string>
  }
}

// Flex order
export const flexOrderRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'order' && parsed.value) {
    const orders: Record<string, string> = {
      first: '-9999',
      last: '9999',
      none: '0',
    }
    if (orders[parsed.value])
      return { order: orders[parsed.value] }
    // Integers (any, including negatives) or arbitrary values only —
    // `order` takes an integer, so unknown words must not pass through.
    if (parsed.arbitrary || /^-?\d+$/.test(parsed.value))
      return { order: parsed.value }
    return undefined
  }
}

// Flex basis
export const flexBasisRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'basis' && parsed.value) {
    const bases: Record<string, string> = {
      auto: 'auto',
      full: '100%',
      0: '0',
    }
    if (bases[parsed.value])
      return { 'flex-basis': bases[parsed.value] }
    const value = resolveSizeToken(parsed, config, {})
    return value !== undefined ? { 'flex-basis': value } : undefined
  }
}

// Justify/Align self
export const justifySelfRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'justify-self') {
    const values: Record<string, string> = {
      auto: 'auto',
      start: 'start',
      end: 'end',
      center: 'center',
      stretch: 'stretch',
    }
    // Keyword allowlist only — align keywords are finite; unknown words
    // previously emitted justify-self: foo.
    return parsed.value && values[parsed.value] ? { 'justify-self': values[parsed.value] } : undefined
  }
}

export const alignSelfRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'self') {
    const values: Record<string, string> = {
      auto: 'auto',
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      stretch: 'stretch',
      baseline: 'baseline',
    }
    return parsed.value && values[parsed.value] ? { 'align-self': values[parsed.value] } : undefined
  }
}

// Container utility with responsive max-widths
export const containerRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'container') {
    // container without value - centered container with responsive max-width
    if (!parsed.value) {
      // Use clamp for modern responsive max-width behavior
      // Max-width scales with breakpoints: sm=640, md=768, lg=1024, xl=1280, 2xl=1536
      const xl = config.theme.screens['xl'] || '1280px'
      return {
        'width': '100%',
        'margin-left': 'auto',
        'margin-right': 'auto',
        'max-width': xl,
      }
    }

    // container-{breakpoint} for specific max-widths
    const breakpointMap: Record<string, string> = {
      'sm': config.theme.screens['sm'] || '640px',
      'md': config.theme.screens['md'] || '768px',
      'lg': config.theme.screens['lg'] || '1024px',
      'xl': config.theme.screens['xl'] || '1280px',
      '2xl': config.theme.screens['2xl'] || '1536px',
      'full': '100%',
      'prose': '65ch',
      '3xl': '1920px',
    }

    if (breakpointMap[parsed.value]) {
      return {
        'width': '100%',
        'margin-left': 'auto',
        'margin-right': 'auto',
        'max-width': breakpointMap[parsed.value],
      }
    }

    // Arbitrary value support: container-[800px]
    if (parsed.arbitrary) {
      return {
        'width': '100%',
        'margin-left': 'auto',
        'margin-right': 'auto',
        'max-width': parsed.value,
      }
    }
  }
}

// Arbitrary properties
export const arbitraryPropertyRule: UtilityRule = (parsed) => {
  // Only handle true arbitrary properties: [color:red], [mask-type:alpha]
  // NOT arbitrary values like w-[100px]
  if (parsed.arbitrary && parsed.utility && parsed.value && parsed.base.startsWith('[')) {
    // Arbitrary properties start with [ and have the pattern [prop:value]
    return { [parsed.utility]: parsed.value }
  }
}

export const advancedRules: UtilityRule[] = [
  minMaxSizingRule,
  ringRule,
  borderOpacityRule,
  borderStyleRule,
  spaceRule,
  divideRule,
  gradientStopsRule,
  flexOrderRule,
  flexBasisRule,
  justifySelfRule,
  alignSelfRule,
  containerRule,
  arbitraryPropertyRule,
]
