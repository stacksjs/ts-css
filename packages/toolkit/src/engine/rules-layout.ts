import { themeColorValue } from './rules'
import type { UtilityRule } from './rules'
import { fractionToPercent } from './format'

const COLUMN_FILL_VALUES: Record<string, string> = {
  'column-fill-auto': 'auto',
  'column-fill-balance': 'balance',
  'column-fill-balance-all': 'balance-all',
}

const COLUMN_SPAN_VALUES: Record<string, string> = {
  'column-span-all': 'all',
  'column-span-none': 'none',
}

const BOX_DECORATION_VALUES: Record<string, string> = {
  'box-decoration-clone': 'clone',
  'box-decoration-slice': 'slice',
}

const BOX_SIZING_VALUES: Record<string, string> = {
  'box-border': 'border-box',
  'box-content': 'content-box',
}

const FLOAT_FLOATS: Record<string, string> = {
  'float-start': 'inline-start',
  'float-end': 'inline-end',
  'float-right': 'right',
  'float-left': 'left',
  'float-none': 'none',
}

const CLEAR_CLEARS: Record<string, string> = {
  'clear-start': 'inline-start',
  'clear-end': 'inline-end',
  'clear-left': 'left',
  'clear-right': 'right',
  'clear-both': 'both',
  'clear-none': 'none',
}

const ISOLATION_VALUES: Record<string, string> = {
  'isolate': 'isolate',
  'isolation-auto': 'auto',
}

const OBJECT_FIT_FITS: Record<string, string> = {
  'object-contain': 'contain',
  'object-cover': 'cover',
  'object-fill': 'fill',
  'object-none': 'none',
  'object-scale-down': 'scale-down',
}

const OBJECT_POSITION_POSITIONS: Record<string, string> = {
  'object-bottom': 'bottom',
  'object-center': 'center',
  'object-left': 'left',
  'object-left-bottom': 'left bottom',
  'object-left-top': 'left top',
  'object-right': 'right',
  'object-right-bottom': 'right bottom',
  'object-right-top': 'right top',
  'object-top': 'top',
}

const OVERSCROLL_BEHAVIORS: Record<string, string> = {
  'overscroll-auto': 'auto',
  'overscroll-contain': 'contain',
  'overscroll-none': 'none',
  'overscroll-x-auto': 'auto',
  'overscroll-x-contain': 'contain',
  'overscroll-x-none': 'none',
  'overscroll-y-auto': 'auto',
  'overscroll-y-contain': 'contain',
  'overscroll-y-none': 'none',
}

const VISIBILITY_VALUES: Record<string, string> = {
  visible: 'visible',
  invisible: 'hidden',
  collapse: 'collapse',
}


// Layout utilities

export const aspectRatioRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'aspect' && parsed.value) {
    const ratios: Record<string, string> = {
      auto: 'auto',
      square: '1 / 1',
      video: '16 / 9',
    }
    if (ratios[parsed.value])
      return { 'aspect-ratio': ratios[parsed.value] }
    if (parsed.arbitrary)
      return { 'aspect-ratio': parsed.value }
    // Bare ratios and numbers: aspect-16/9 -> 16 / 9, aspect-2 -> 2.
    // Unknown words previously emitted aspect-ratio: foo.
    const ratioMatch = parsed.value.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
    if (ratioMatch)
      return { 'aspect-ratio': `${ratioMatch[1]} / ${ratioMatch[2]}` }
    if (/^\d+(?:\.\d+)?$/.test(parsed.value))
      return { 'aspect-ratio': parsed.value }
    return undefined
  }
}

export const columnsRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'columns' && parsed.value) {
    // Named column counts
    const columnCounts: Record<string, string> = {
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      '11': '11',
      '12': '12',
      'auto': 'auto',
    }

    // Named column widths (like Tailwind)
    const columnWidths: Record<string, string> = {
      '3xs': '16rem',
      '2xs': '18rem',
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
    }

    // Check column counts first
    if (columnCounts[parsed.value]) {
      return { columns: columnCounts[parsed.value] }
    }

    // Check named widths
    if (columnWidths[parsed.value]) {
      return { columns: columnWidths[parsed.value] }
    }

    // Check spacing config
    if (config.theme.spacing[parsed.value]) {
      return { columns: config.theme.spacing[parsed.value] }
    }

    // Arbitrary values only beyond the named scales; bare counts above 12
    // are valid too. Unknown words previously emitted columns: foo.
    if (parsed.arbitrary || /^\d+$/.test(parsed.value)) {
      return { columns: parsed.value }
    }
    return undefined
  }
}

// Column fill
export const columnFillRule: UtilityRule = (parsed) => {
  return COLUMN_FILL_VALUES[parsed.base] ? { 'column-fill': COLUMN_FILL_VALUES[parsed.base] } : undefined
}

// Column gap (different from grid gap)
export const columnGapRule: UtilityRule = (parsed, config) => {
  if (parsed.utility === 'column-gap' && parsed.value) {
    let value: string | undefined = config.theme.spacing[parsed.value]
    if (value === undefined && parsed.arbitrary)
      value = parsed.value
    if (value === undefined && /^\d+(?:\.\d+)?$/.test(parsed.value))
      value = `${Number.parseFloat(parsed.value) * 0.25}rem`
    return value !== undefined ? { 'column-gap': value } : undefined
  }
}

// Column rule (border between columns)
export const columnRuleRule: UtilityRule = (parsed, config) => {
  // column-rule-width
  if (parsed.utility === 'column-rule' && parsed.value) {
    const widths: Record<string, string> = {
      '0': '0px',
      '1': '1px',
      '2': '2px',
      '4': '4px',
      '8': '8px',
    }
    if (widths[parsed.value]) {
      return { 'column-rule-width': widths[parsed.value] } as Record<string, string>
    }

    // Check for colors
    const parts = parsed.value.split('-')
    if (parts.length === 2) {
      const [colorName, shade] = parts
      const colorValue = config.theme.colors[colorName]
      if (typeof colorValue === 'object' && colorValue[shade]) {
        return { 'column-rule-color': themeColorValue(parsed.value, colorValue[shade], colorName, config.colorVariables) } as Record<string, string>
      }
    }

    // Direct color
    const directColor = config.theme.colors[parsed.value]
    if (typeof directColor === 'string') {
      return { 'column-rule-color': themeColorValue(parsed.value, directColor, parsed.value, config.colorVariables) } as Record<string, string>
    }

    // Nested color object referenced by its bare name → `DEFAULT` shade.
    if (typeof directColor === 'object' && directColor !== null && typeof directColor.DEFAULT === 'string') {
      return { 'column-rule-color': themeColorValue(parsed.value, directColor.DEFAULT, parsed.value, config.colorVariables) } as Record<string, string>
    }

    // Style
    const styles: Record<string, string> = {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
      hidden: 'hidden',
      none: 'none',
    }
    if (styles[parsed.value]) {
      return { 'column-rule-style': styles[parsed.value] } as Record<string, string>
    }
  }
}

// Column span
export const columnSpanRule: UtilityRule = (parsed) => {
  return COLUMN_SPAN_VALUES[parsed.base] ? { 'column-span': COLUMN_SPAN_VALUES[parsed.base] } : undefined
}

export const breakRule: UtilityRule = (parsed) => {
  const breaks: Record<string, Record<string, string>> = {
    'break-before-auto': { 'break-before': 'auto' },
    'break-before-avoid': { 'break-before': 'avoid' },
    'break-before-all': { 'break-before': 'all' },
    'break-before-avoid-page': { 'break-before': 'avoid-page' },
    'break-before-page': { 'break-before': 'page' },
    'break-after-auto': { 'break-after': 'auto' },
    'break-after-avoid': { 'break-after': 'avoid' },
    'break-after-all': { 'break-after': 'all' },
    'break-after-avoid-page': { 'break-after': 'avoid-page' },
    'break-after-page': { 'break-after': 'page' },
    'break-inside-auto': { 'break-inside': 'auto' },
    'break-inside-avoid': { 'break-inside': 'avoid' },
    'break-inside-avoid-page': { 'break-inside': 'avoid-page' },
    'break-inside-avoid-column': { 'break-inside': 'avoid-column' },
  }
  return breaks[parsed.base]
}

export const boxDecorationRule: UtilityRule = (parsed) => {
  return BOX_DECORATION_VALUES[parsed.base] ? { 'box-decoration-break': BOX_DECORATION_VALUES[parsed.base] } : undefined
}

export const boxSizingRule: UtilityRule = (parsed) => {
  return BOX_SIZING_VALUES[parsed.base] ? { 'box-sizing': BOX_SIZING_VALUES[parsed.base] } : undefined
}

export const floatRule: UtilityRule = (parsed) => {
  return FLOAT_FLOATS[parsed.base] ? { float: FLOAT_FLOATS[parsed.base] } : undefined
}

export const clearRule: UtilityRule = (parsed) => {
  return CLEAR_CLEARS[parsed.base] ? { clear: CLEAR_CLEARS[parsed.base] } : undefined
}

export const isolationRule: UtilityRule = (parsed) => {
  return ISOLATION_VALUES[parsed.base] ? { isolation: ISOLATION_VALUES[parsed.base] } : undefined
}

/**
 * CSS containment (`contain-*`).
 *
 * `size`, `inline-size`, `layout`, `paint` and `style` are independently
 * combinable, so each writes its own custom property and they share one
 * `contain` declaration — `contain-layout contain-paint` has to end up as
 * `contain: layout paint`, not as one utility overwriting the other. The empty
 * `var(--x, )` fallback means a keyword nobody set contributes nothing.
 *
 * `none`, `content` and `strict` are whole values in their own right and
 * simply replace the property.
 */
const CONTAIN_KEYWORDS = ['size', 'inline-size', 'layout', 'paint', 'style']
const CONTAIN_COMPOSED = CONTAIN_KEYWORDS.map(keyword => `var(--tc-contain-${keyword}, )`).join(' ')
const CONTAIN_STANDALONE = ['none', 'content', 'strict']

export const containRule: UtilityRule = (parsed) => {
  if (parsed.utility !== 'contain' || !parsed.value)
    return undefined

  if (parsed.arbitrary)
    return { contain: parsed.value }

  if (CONTAIN_STANDALONE.includes(parsed.value))
    return { contain: parsed.value }

  if (CONTAIN_KEYWORDS.includes(parsed.value)) {
    return {
      [`--tc-contain-${parsed.value}`]: parsed.value,
      contain: CONTAIN_COMPOSED,
    }
  }

  return undefined
}

export const objectFitRule: UtilityRule = (parsed) => {
  return OBJECT_FIT_FITS[parsed.base] ? { 'object-fit': OBJECT_FIT_FITS[parsed.base] } : undefined
}

export const objectPositionRule: UtilityRule = (parsed) => {
  return OBJECT_POSITION_POSITIONS[parsed.base] ? { 'object-position': OBJECT_POSITION_POSITIONS[parsed.base] } : undefined
}

export const overflowRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'overflow') {
    const values = ['auto', 'hidden', 'clip', 'visible', 'scroll']
    if (parsed.value && values.includes(parsed.value)) {
      return { overflow: parsed.value }
    }
  }
  if (parsed.utility === 'overflow-x' || parsed.utility === 'overflow-y') {
    const values = ['auto', 'hidden', 'clip', 'visible', 'scroll']
    if (parsed.value && values.includes(parsed.value)) {
      return { [parsed.utility]: parsed.value }
    }
  }
}

export const overscrollRule: UtilityRule = (parsed) => {
  const prop = parsed.base.startsWith('overscroll-x')
    ? 'overscroll-behavior-x'
    : parsed.base.startsWith('overscroll-y')
      ? 'overscroll-behavior-y'
      : 'overscroll-behavior'
  return OVERSCROLL_BEHAVIORS[parsed.base] ? { [prop]: OVERSCROLL_BEHAVIORS[parsed.base] } : undefined
}

export const positionRule: UtilityRule = (parsed) => {
  const positions = ['static', 'fixed', 'absolute', 'relative', 'sticky']
  if (positions.includes(parsed.utility)) {
    return { position: parsed.utility }
  }
}

export const insetRule: UtilityRule = (parsed, config) => {
  const directions: Record<string, string[]> = {
    'inset': ['top', 'right', 'bottom', 'left'],
    'inset-x': ['left', 'right'],
    'inset-y': ['top', 'bottom'],
    'top': ['top'],
    'right': ['right'],
    'bottom': ['bottom'],
    'left': ['left'],
    // Logical inset (for RTL support)
    'start': ['inset-inline-start'],
    'end': ['inset-inline-end'],
  }

  const props = directions[parsed.utility]
  if (!props || !parsed.value)
    return undefined

  // Helper to resolve inset value (handles fractions, spacing, keywords).
  // Unknown words return undefined — they previously leaked verbatim
  // (`top-bar` emitted `top: bar;`).
  const resolveInsetValue = (val: string): string | undefined => {
    // Handle fractions: 1/2 -> 50%, 1/3 -> 33.333333%, etc.
    if (val.includes('/') && !parsed.arbitrary) {
      const [num, denom] = val.split('/').map(Number)
      if (!Number.isNaN(num) && !Number.isNaN(denom) && denom !== 0) {
        return fractionToPercent(num, denom)
      }
      return undefined
    }
    // Handle special keywords
    if (val === 'full')
      return '100%'
    if (val === 'auto')
      return 'auto'
    if (parsed.arbitrary)
      return val
    const hit = config.theme.spacing[val]
    if (hit !== undefined)
      return hit
    // Off-scale numbers keep the 0.25rem step (Tailwind v4)
    if (/^\d+(?:\.\d+)?$/.test(val))
      return `${Number.parseFloat(val) * 0.25}rem`
    return undefined
  }

  // Handle negative values
  let value: string | undefined
  if (parsed.value.startsWith('-')) {
    const positiveValue = parsed.value.slice(1)
    const resolved = resolveInsetValue(positiveValue)
    if (resolved === undefined) {
      value = undefined
    }
    // For percentage values, negate properly
    else if (resolved.endsWith('%')) {
      const numericPart = Number.parseFloat(resolved)
      value = `${-numericPart}%`
    }
    else {
      value = resolved.startsWith('-') ? resolved : `-${resolved}`
    }
  }
  else {
    value = resolveInsetValue(parsed.value)
  }

  if (value === undefined)
    return undefined

  const result: Record<string, string> = {}
  for (const prop of props) {
    result[prop] = value
  }
  return result
}

export const visibilityRule: UtilityRule = (parsed) => {
  return VISIBILITY_VALUES[parsed.utility] ? { visibility: VISIBILITY_VALUES[parsed.utility] } : undefined
}

export const zIndexRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'z' && parsed.value) {
    // Integers (any, including negatives), auto, or arbitrary values only.
    // An unknown word is not a z-index; passing it through emitted
    // `z-index: foo` for semantic class names like `z-modal`.
    if (parsed.arbitrary || parsed.value === 'auto' || /^-?\d+$/.test(parsed.value))
      return { 'z-index': parsed.value }
    return undefined
  }
}

export const layoutRules: UtilityRule[] = [
  aspectRatioRule,
  columnsRule,
  columnFillRule,
  columnGapRule,
  columnRuleRule,
  columnSpanRule,
  breakRule,
  boxDecorationRule,
  boxSizingRule,
  floatRule,
  clearRule,
  containRule,
  isolationRule,
  objectFitRule,
  objectPositionRule,
  overflowRule,
  overscrollRule,
  positionRule,
  insetRule,
  visibilityRule,
  zIndexRule,
]
