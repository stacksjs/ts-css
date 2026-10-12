import type { CSSRule, CssConfig, ParsedClass, UtilityRuleResult } from './types'
import type { UtilityRule } from './rules'
import { minifyBlock } from '../optimize'
import { parseClass } from './parser'
import { defaultConfig } from './config'
import { builtInRules } from './rules'
import { TRANSFORM_2D, TRANSFORM_3D } from './rules-transforms'
import { fractionToPercent } from './format'
import { BOX_SHADOW_LAYERS } from './shadow-layers'

/**
 * Deep merge objects
*/
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = result[key]
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue)
    }
    else if (sourceValue !== undefined) {
      result[key] = sourceValue as any
    }
  }
  return result
}

// =============================================================================
// STATIC UTILITY MAPS - Pre-computed at module load for O(1) lookup
// These never change and are shared across all CSSGenerator instances
// =============================================================================

// Display utilities - direct raw class to CSS value
const DISPLAY_MAP: Record<string, Record<string, string>> = {
  'block': { display: 'block' },
  'inline-block': { display: 'inline-block' },
  'inline': { display: 'inline' },
  'flex': { display: 'flex' },
  'inline-flex': { display: 'inline-flex' },
  'grid': { display: 'grid' },
  'inline-grid': { display: 'inline-grid' },
  'hidden': { display: 'none' },
  'none': { display: 'none' },
}

// Flex direction - direct raw class to CSS
const FLEX_DIRECTION_MAP: Record<string, Record<string, string>> = {
  'flex-row': { 'flex-direction': 'row' },
  'flex-row-reverse': { 'flex-direction': 'row-reverse' },
  'flex-col': { 'flex-direction': 'column' },
  'flex-col-reverse': { 'flex-direction': 'column-reverse' },
}

// Flex wrap - direct raw class to CSS
const FLEX_WRAP_MAP: Record<string, Record<string, string>> = {
  'flex-wrap': { 'flex-wrap': 'wrap' },
  'flex-wrap-reverse': { 'flex-wrap': 'wrap-reverse' },
  'flex-nowrap': { 'flex-wrap': 'nowrap' },
}

// Flex values - direct raw class to CSS
const FLEX_VALUES_MAP: Record<string, Record<string, string>> = {
  'flex-1': { flex: '1 1 0%' },
  'flex-auto': { flex: '1 1 auto' },
  'flex-initial': { flex: '0 1 auto' },
  'flex-none': { flex: 'none' },
}

// Grow/Shrink - direct raw class to CSS
const GROW_SHRINK_MAP: Record<string, Record<string, string>> = {
  'grow': { 'flex-grow': '1' },
  'grow-0': { 'flex-grow': '0' },
  'shrink': { 'flex-shrink': '1' },
  'shrink-0': { 'flex-shrink': '0' },
}

// Justify content - utility="justify", value lookup
const JUSTIFY_CONTENT_VALUES: Record<string, string> = {
  'start': 'flex-start',
  'end': 'flex-end',
  'center': 'center',
  'between': 'space-between',
  'around': 'space-around',
  'evenly': 'space-evenly',
  // `safe` falls back to start alignment rather than letting centred content
  // overflow both edges of its container and become unreachable.
  'center-safe': 'safe center',
  'end-safe': 'safe flex-end',
}

// Align items - utility="items", value lookup
const ALIGN_ITEMS_VALUES: Record<string, string> = {
  'start': 'flex-start',
  'end': 'flex-end',
  'center': 'center',
  'baseline': 'baseline',
  'stretch': 'stretch',
  'center-safe': 'safe center',
  'end-safe': 'safe flex-end',
}

// Align content - utility="content", value lookup
const ALIGN_CONTENT_VALUES: Record<string, string> = {
  'normal': 'normal',
  'center': 'center',
  'start': 'flex-start',
  'end': 'flex-end',
  'between': 'space-between',
  'around': 'space-around',
  'evenly': 'space-evenly',
  'baseline': 'baseline',
  'stretch': 'stretch',
  'center-safe': 'safe center',
  'end-safe': 'safe flex-end',
}

// Align self - utility="self", value lookup
const ALIGN_SELF_VALUES: Record<string, string> = {
  'auto': 'auto',
  'start': 'flex-start',
  'end': 'flex-end',
  'center': 'center',
  'stretch': 'stretch',
  'baseline': 'baseline',
  'center-safe': 'safe center',
  'end-safe': 'safe flex-end',
}

// Border style - direct raw class to CSS
const BORDER_STYLE_MAP: Record<string, Record<string, string>> = {
  'border-solid': { 'border-style': 'solid' },
  'border-dashed': { 'border-style': 'dashed' },
  'border-dotted': { 'border-style': 'dotted' },
  'border-double': { 'border-style': 'double' },
  'border-none': { 'border-style': 'none' },
}

// Transform utilities - direct raw class to CSS
const TRANSFORM_MAP: Record<string, Record<string, string>> = {
  'transform': { transform: TRANSFORM_2D },
  'transform-cpu': { transform: TRANSFORM_2D },
  'transform-gpu': { transform: TRANSFORM_3D },
  'transform-none': { transform: 'none' },
}

// Transition utilities - direct raw class to CSS. Each sets Tailwind's
// default duration and easing too — with only transition-property, the
// duration defaulted to 0s and `class="transition-colors"` alone animated
// NOTHING (duration-* still overrides via cascade order).
const TRANSITION_DEFAULTS: Record<string, string> = {
  'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'transition-duration': '150ms',
}
const TRANSITION_MAP: Record<string, Record<string, string>> = {
  'transition-none': { 'transition-property': 'none' },
  'transition-all': { 'transition-property': 'all', ...TRANSITION_DEFAULTS },
  'transition': { 'transition-property': 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter', ...TRANSITION_DEFAULTS },
  'transition-colors': { 'transition-property': 'color, background-color, border-color, text-decoration-color, fill, stroke', ...TRANSITION_DEFAULTS },
  'transition-opacity': { 'transition-property': 'opacity', ...TRANSITION_DEFAULTS },
  'transition-shadow': { 'transition-property': 'box-shadow', ...TRANSITION_DEFAULTS },
  'transition-transform': { 'transition-property': 'transform', ...TRANSITION_DEFAULTS },
}

// Timing functions - direct raw class to CSS
const TIMING_MAP: Record<string, Record<string, string>> = {
  'ease-linear': { 'transition-timing-function': 'linear' },
  'ease-in': { 'transition-timing-function': 'cubic-bezier(0.4, 0, 1, 1)' },
  'ease-out': { 'transition-timing-function': 'cubic-bezier(0, 0, 0.2, 1)' },
  'ease-in-out': { 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)' },
}

// Animation presets
const ANIMATION_MAP: Record<string, Record<string, string>> = {
  'animate-none': { animation: 'none' },
  'animate-spin': { animation: 'spin 1s linear infinite' },
  'animate-ping': { animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' },
  'animate-pulse': { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
  'animate-bounce': { animation: 'bounce 1s infinite' },
}

// Keyframe definitions for built-in animations
const KEYFRAMES: Record<string, string> = {
  spin: `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
  ping: `@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}`,
  pulse: `@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}`,
  bounce: `@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}`,
}

// Transform origin - utility="origin", value lookup
const TRANSFORM_ORIGIN_VALUES: Record<string, string> = {
  'center': 'center',
  'top': 'top',
  'top-right': 'top right',
  'right': 'right',
  'bottom-right': 'bottom right',
  'bottom': 'bottom',
  'bottom-left': 'bottom left',
  'left': 'left',
  'top-left': 'top left',
}

// Grid template columns - utility="grid-cols", value lookup
const GRID_COLS_VALUES: Record<string, string> = {
  '1': 'repeat(1, minmax(0, 1fr))',
  '2': 'repeat(2, minmax(0, 1fr))',
  '3': 'repeat(3, minmax(0, 1fr))',
  '4': 'repeat(4, minmax(0, 1fr))',
  '5': 'repeat(5, minmax(0, 1fr))',
  '6': 'repeat(6, minmax(0, 1fr))',
  '7': 'repeat(7, minmax(0, 1fr))',
  '8': 'repeat(8, minmax(0, 1fr))',
  '9': 'repeat(9, minmax(0, 1fr))',
  '10': 'repeat(10, minmax(0, 1fr))',
  '11': 'repeat(11, minmax(0, 1fr))',
  '12': 'repeat(12, minmax(0, 1fr))',
  'none': 'none',
  'subgrid': 'subgrid',
}

// Grid template rows - utility="grid-rows", value lookup
const GRID_ROWS_VALUES: Record<string, string> = {
  '1': 'repeat(1, minmax(0, 1fr))',
  '2': 'repeat(2, minmax(0, 1fr))',
  '3': 'repeat(3, minmax(0, 1fr))',
  '4': 'repeat(4, minmax(0, 1fr))',
  '5': 'repeat(5, minmax(0, 1fr))',
  '6': 'repeat(6, minmax(0, 1fr))',
  'none': 'none',
  'subgrid': 'subgrid',
}

// Grid column span - utility="col", value lookup
const GRID_COL_VALUES: Record<string, string> = {
  'auto': 'auto',
  'span-1': 'span 1 / span 1',
  'span-2': 'span 2 / span 2',
  'span-3': 'span 3 / span 3',
  'span-4': 'span 4 / span 4',
  'span-5': 'span 5 / span 5',
  'span-6': 'span 6 / span 6',
  'span-7': 'span 7 / span 7',
  'span-8': 'span 8 / span 8',
  'span-9': 'span 9 / span 9',
  'span-10': 'span 10 / span 10',
  'span-11': 'span 11 / span 11',
  'span-12': 'span 12 / span 12',
  'span-full': '1 / -1',
}

// Grid row span - utility="row", value lookup
const GRID_ROW_VALUES: Record<string, string> = {
  'auto': 'auto',
  'span-1': 'span 1 / span 1',
  'span-2': 'span 2 / span 2',
  'span-3': 'span 3 / span 3',
  'span-4': 'span 4 / span 4',
  'span-5': 'span 5 / span 5',
  'span-6': 'span 6 / span 6',
  'span-full': '1 / -1',
}

// Grid auto flow - utility="grid-flow", value lookup
const GRID_FLOW_VALUES: Record<string, string> = {
  'row': 'row',
  'col': 'column',
  'dense': 'dense',
  'row-dense': 'row dense',
  'col-dense': 'column dense',
}

// Auto cols/rows - utility="auto-cols"/"auto-rows", value lookup
const AUTO_COLS_ROWS_VALUES: Record<string, string> = {
  'auto': 'auto',
  'min': 'min-content',
  'max': 'max-content',
  'fr': 'minmax(0, 1fr)',
}

// Place content/items/self - utility="place", value lookup
const PLACE_CONTENT_VALUES: Record<string, string> = {
  'center': 'center',
  'start': 'start',
  'end': 'end',
  'between': 'space-between',
  'around': 'space-around',
  'evenly': 'space-evenly',
  'stretch': 'stretch',
  // The grid shorthands take `safe end`, not the flexbox `safe flex-end`.
  'center-safe': 'safe center',
  'end-safe': 'safe end',
}

// Ring utilities - direct raw class to CSS
// Ring utilities compose through the CSS variable system (like shadows do):
// the previous flat `box-shadow: 0 0 0 Npx ...` ignored --tc-ring-inset and
// --tc-ring-offset-width entirely (ring-inset / ring-offset-* were no-ops)
// and clobbered shadow-* instead of layering with it. Every var carries a
// fallback because no preflight defines the ring variables.
function ringWidth(width: string): Record<string, string> {
  return {
    '--tc-ring-offset-shadow': 'var(--tc-ring-inset,) 0 0 0 var(--tc-ring-offset-width, 0px) var(--tc-ring-offset-color, #fff)',
    '--tc-ring-shadow': `var(--tc-ring-inset,) 0 0 0 calc(${width} + var(--tc-ring-offset-width, 0px)) var(--tc-ring-color, currentcolor)`,
    'box-shadow': BOX_SHADOW_LAYERS,
  }
}
const RING_MAP: Record<string, Record<string, string>> = {
  // v4 narrowed the bare `ring` from 3px to 1px. `ring-3` still exists
  // for anyone who wants the old width back.
  //
  // The colour fallback is `currentcolor`, also v4's. It used to be the
  // v3 blue, which meant an unstyled `ring` ignored the element's own
  // colour and painted blue regardless of the surrounding design.
  'ring': ringWidth('1px'),
  'ring-0': ringWidth('0px'),
  'ring-1': ringWidth('1px'),
  'ring-2': ringWidth('2px'),
  'ring-4': ringWidth('4px'),
  'ring-8': ringWidth('8px'),
  'ring-inset': { '--tc-ring-inset': 'inset' },
}

// Shadow utilities - use CSS variable system for shadow color support
// --tc-shadow holds the default shadow, --tc-shadow-colored replaces colors with var(--tc-shadow-color)
// box-shadow references --tc-shadow which can be swapped to --tc-shadow-colored by a shadow-{color} utility
const SHADOW_MAP: Record<string, Record<string, string>> = {
  'shadow-2xs': {
    '--tc-shadow': '0 1px rgb(0 0 0 / 0.05)',
    '--tc-shadow-colored': '0 1px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-xs': {
    '--tc-shadow': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '--tc-shadow-colored': '0 1px 2px 0 var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-sm': {
    '--tc-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '--tc-shadow-colored': '0 1px 3px 0 var(--tc-shadow-color), 0 1px 2px -1px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow': {
    '--tc-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '--tc-shadow-colored': '0 1px 3px 0 var(--tc-shadow-color), 0 1px 2px -1px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-md': {
    '--tc-shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '--tc-shadow-colored': '0 4px 6px -1px var(--tc-shadow-color), 0 2px 4px -2px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-lg': {
    '--tc-shadow': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '--tc-shadow-colored': '0 10px 15px -3px var(--tc-shadow-color), 0 4px 6px -4px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-xl': {
    '--tc-shadow': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '--tc-shadow-colored': '0 20px 25px -5px var(--tc-shadow-color), 0 8px 10px -6px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-2xl': {
    '--tc-shadow': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '--tc-shadow-colored': '0 25px 50px -12px var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-inner': {
    '--tc-shadow': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    '--tc-shadow-colored': 'inset 0 2px 4px 0 var(--tc-shadow-color)',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
  'shadow-none': {
    '--tc-shadow': '0 0 #0000',
    'box-shadow': BOX_SHADOW_LAYERS,
  },
}

// Border radius - direct raw class to CSS
const BORDER_RADIUS_MAP: Record<string, Record<string, string>> = {
  'rounded-none': { 'border-radius': '0px' },
  'rounded-xs': { 'border-radius': '0.125rem' },
  'rounded-sm': { 'border-radius': '0.25rem' },
  'rounded': { 'border-radius': '0.25rem' },
  'rounded-md': { 'border-radius': '0.375rem' },
  'rounded-lg': { 'border-radius': '0.5rem' },
  'rounded-xl': { 'border-radius': '0.75rem' },
  'rounded-2xl': { 'border-radius': '1rem' },
  'rounded-3xl': { 'border-radius': '1.5rem' },
  'rounded-4xl': { 'border-radius': '2rem' },
  'rounded-full': { 'border-radius': '9999px' },
  // Corner-specific rounded utilities
  'rounded-t-none': { 'border-top-left-radius': '0px', 'border-top-right-radius': '0px' },
  'rounded-t-sm': { 'border-top-left-radius': '0.25rem', 'border-top-right-radius': '0.25rem' },
  'rounded-t-lg': { 'border-top-left-radius': '0.5rem', 'border-top-right-radius': '0.5rem' },
  'rounded-r-lg': { 'border-top-right-radius': '0.5rem', 'border-bottom-right-radius': '0.5rem' },
  'rounded-b-lg': { 'border-bottom-left-radius': '0.5rem', 'border-bottom-right-radius': '0.5rem' },
  'rounded-l-lg': { 'border-top-left-radius': '0.5rem', 'border-bottom-left-radius': '0.5rem' },
  'rounded-tl-lg': { 'border-top-left-radius': '0.5rem' },
  'rounded-tr-lg': { 'border-top-right-radius': '0.5rem' },
  'rounded-br-lg': { 'border-bottom-right-radius': '0.5rem' },
  'rounded-bl-lg': { 'border-bottom-left-radius': '0.5rem' },
}

// Border width - direct raw class to CSS
const BORDER_WIDTH_MAP: Record<string, Record<string, string>> = {
  'border': { 'border-width': '1px' },
  'border-0': { 'border-width': '0px' },
  'border-2': { 'border-width': '2px' },
  'border-4': { 'border-width': '4px' },
  'border-8': { 'border-width': '8px' },
  // Side-specific border width
  'border-t': { 'border-top-width': '1px' },
  'border-r': { 'border-right-width': '1px' },
  'border-b': { 'border-bottom-width': '1px' },
  'border-l': { 'border-left-width': '1px' },
  'border-t-0': { 'border-top-width': '0px' },
  'border-r-0': { 'border-right-width': '0px' },
  'border-b-0': { 'border-bottom-width': '0px' },
  'border-l-0': { 'border-left-width': '0px' },
  'border-t-2': { 'border-top-width': '2px' },
  'border-r-2': { 'border-right-width': '2px' },
  'border-b-2': { 'border-bottom-width': '2px' },
  'border-l-2': { 'border-left-width': '2px' },
  'border-t-4': { 'border-top-width': '4px' },
  'border-r-4': { 'border-right-width': '4px' },
  'border-b-4': { 'border-bottom-width': '4px' },
  'border-l-4': { 'border-left-width': '4px' },
  'border-x': { 'border-left-width': '1px', 'border-right-width': '1px' },
  'border-y': { 'border-top-width': '1px', 'border-bottom-width': '1px' },
  'border-x-0': { 'border-left-width': '0px', 'border-right-width': '0px' },
  'border-y-0': { 'border-top-width': '0px', 'border-bottom-width': '0px' },
  'border-x-2': { 'border-left-width': '2px', 'border-right-width': '2px' },
  'border-y-2': { 'border-top-width': '2px', 'border-bottom-width': '2px' },
}

// Ring offset - direct raw class to CSS
const RING_OFFSET_MAP: Record<string, Record<string, string>> = {
  'ring-offset-0': { '--tc-ring-offset-width': '0px' },
  'ring-offset-1': { '--tc-ring-offset-width': '1px' },
  'ring-offset-2': { '--tc-ring-offset-width': '2px' },
  'ring-offset-4': { '--tc-ring-offset-width': '4px' },
  'ring-offset-8': { '--tc-ring-offset-width': '8px' },
}

// Opacity utilities - direct raw class to CSS
const OPACITY_MAP: Record<string, Record<string, string>> = {
  'opacity-0': { opacity: '0' },
  'opacity-5': { opacity: '0.05' },
  'opacity-10': { opacity: '0.1' },
  'opacity-20': { opacity: '0.2' },
  'opacity-25': { opacity: '0.25' },
  'opacity-30': { opacity: '0.3' },
  'opacity-40': { opacity: '0.4' },
  'opacity-50': { opacity: '0.5' },
  'opacity-60': { opacity: '0.6' },
  'opacity-70': { opacity: '0.7' },
  'opacity-75': { opacity: '0.75' },
  'opacity-80': { opacity: '0.8' },
  'opacity-90': { opacity: '0.9' },
  'opacity-95': { opacity: '0.95' },
  'opacity-100': { opacity: '1' },
}

// Pre-computed spacing values for O(1) lookup
const SPACING_VALUES: Record<string, string> = {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
}

// Size values (spacing + special values)
const SIZE_VALUES: Record<string, string> = {
  ...SPACING_VALUES,
  'auto': 'auto',
  'full': '100%',
  'screen': '100vw',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
  // Common fractions. Derived rather than written out so this fast path and
  // the rule path can't disagree, and so the values carry CSS-relevant
  // precision instead of float noise ('33.33333333333333%').
  ...buildFractionValues(6),
}

/**
 * Every `n/d` for d up to `maxDenominator`, as a percentage.
 */
function buildFractionValues(maxDenominator: number): Record<string, string> {
  const values: Record<string, string> = {}
  for (let denom = 2; denom <= maxDenominator; denom++) {
    for (let num = 1; num < denom; num++) {
      values[`${num}/${denom}`] = fractionToPercent(num, denom)!
    }
  }
  return values
}

// Pre-computed color values for common Tailwind colors (O(1) lookup)
// These are the most commonly used colors in the benchmark
const COMMON_COLORS: Record<string, string> = {
  // Gray
  'gray-50': 'oklch(98.5% 0.002 247.839)', 'gray-100': 'oklch(96.7% 0.003 264.542)',
  'gray-200': 'oklch(92.8% 0.006 264.531)', 'gray-300': 'oklch(87.2% 0.01 258.338)',
  'gray-400': 'oklch(70.7% 0.022 261.325)', 'gray-500': 'oklch(55.1% 0.027 264.364)',
  'gray-600': 'oklch(44.6% 0.03 256.802)', 'gray-700': 'oklch(37.3% 0.034 259.733)',
  'gray-800': 'oklch(27.8% 0.033 256.848)', 'gray-900': 'oklch(21% 0.034 264.665)',
  'gray-950': 'oklch(13% 0.028 261.692)',
  // Red
  'red-50': 'oklch(97.1% 0.013 17.38)', 'red-100': 'oklch(93.6% 0.032 17.717)',
  'red-200': 'oklch(88.5% 0.062 18.334)', 'red-300': 'oklch(80.8% 0.114 19.571)',
  'red-400': 'oklch(70.4% 0.191 22.216)', 'red-500': 'oklch(63.7% 0.237 25.331)',
  'red-600': 'oklch(57.7% 0.245 27.325)', 'red-700': 'oklch(50.5% 0.213 27.518)',
  'red-800': 'oklch(44.4% 0.177 26.899)', 'red-900': 'oklch(39.6% 0.141 25.723)',
  'red-950': 'oklch(25.8% 0.092 26.042)',
  // Blue
  'blue-50': 'oklch(97% 0.014 254.604)', 'blue-100': 'oklch(93.2% 0.032 255.585)',
  'blue-200': 'oklch(88.2% 0.059 254.128)', 'blue-300': 'oklch(80.9% 0.105 251.813)',
  'blue-400': 'oklch(70.7% 0.165 254.624)', 'blue-500': 'oklch(62.3% 0.214 259.815)',
  'blue-600': 'oklch(54.6% 0.245 262.881)', 'blue-700': 'oklch(48.8% 0.243 264.376)',
  'blue-800': 'oklch(42.4% 0.199 265.638)', 'blue-900': 'oklch(37.9% 0.146 265.522)',
  'blue-950': 'oklch(28.2% 0.091 267.935)',
  // Green
  'green-50': 'oklch(98.2% 0.018 155.826)', 'green-100': 'oklch(96.2% 0.044 156.743)',
  'green-200': 'oklch(92.5% 0.084 155.995)', 'green-300': 'oklch(87.1% 0.15 154.449)',
  'green-400': 'oklch(79.2% 0.209 151.711)', 'green-500': 'oklch(72.3% 0.219 149.579)',
  'green-600': 'oklch(62.7% 0.194 149.214)', 'green-700': 'oklch(52.7% 0.154 150.069)',
  'green-800': 'oklch(44.8% 0.119 151.328)', 'green-900': 'oklch(39.3% 0.095 152.535)',
  'green-950': 'oklch(26.6% 0.065 152.934)',
  // Yellow
  'yellow-50': 'oklch(98.7% 0.026 102.212)', 'yellow-100': 'oklch(97.3% 0.071 103.193)',
  'yellow-200': 'oklch(94.5% 0.129 101.54)', 'yellow-300': 'oklch(90.5% 0.182 98.111)',
  'yellow-400': 'oklch(85.2% 0.199 91.936)', 'yellow-500': 'oklch(79.5% 0.184 86.047)',
  'yellow-600': 'oklch(68.1% 0.162 75.834)', 'yellow-700': 'oklch(55.4% 0.135 66.442)',
  'yellow-800': 'oklch(47.6% 0.114 61.907)', 'yellow-900': 'oklch(42.1% 0.095 57.708)',
  'yellow-950': 'oklch(28.6% 0.066 53.813)',
  // Purple
  'purple-50': 'oklch(97.7% 0.014 308.299)', 'purple-100': 'oklch(94.6% 0.033 307.174)',
  'purple-200': 'oklch(90.2% 0.063 306.703)', 'purple-300': 'oklch(82.7% 0.119 306.383)',
  'purple-400': 'oklch(71.4% 0.203 305.504)', 'purple-500': 'oklch(62.7% 0.265 303.9)',
  'purple-600': 'oklch(55.8% 0.288 302.321)', 'purple-700': 'oklch(49.6% 0.265 301.924)',
  'purple-800': 'oklch(43.8% 0.218 303.724)', 'purple-900': 'oklch(38.1% 0.176 304.987)',
  'purple-950': 'oklch(29.1% 0.149 302.717)',
  // Pink
  'pink-50': 'oklch(97.1% 0.014 343.198)', 'pink-100': 'oklch(94.8% 0.028 342.258)',
  'pink-200': 'oklch(89.9% 0.061 343.231)', 'pink-300': 'oklch(82.3% 0.12 346.018)',
  'pink-400': 'oklch(71.8% 0.202 349.761)', 'pink-500': 'oklch(65.6% 0.241 354.308)',
  'pink-600': 'oklch(59.2% 0.249 0.584)', 'pink-700': 'oklch(52.5% 0.223 3.958)',
  'pink-800': 'oklch(45.9% 0.187 3.815)', 'pink-900': 'oklch(40.8% 0.153 2.432)',
  'pink-950': 'oklch(28.4% 0.109 3.907)',
  // Indigo
  'indigo-50': 'oklch(96.2% 0.018 272.314)', 'indigo-100': 'oklch(93% 0.034 272.788)',
  'indigo-200': 'oklch(87% 0.065 274.039)', 'indigo-300': 'oklch(78.5% 0.115 274.713)',
  'indigo-400': 'oklch(67.3% 0.182 276.935)', 'indigo-500': 'oklch(58.5% 0.233 277.117)',
  'indigo-600': 'oklch(51.1% 0.262 276.966)', 'indigo-700': 'oklch(45.7% 0.24 277.023)',
  'indigo-800': 'oklch(39.8% 0.195 277.366)', 'indigo-900': 'oklch(35.9% 0.144 278.697)',
  'indigo-950': 'oklch(25.7% 0.09 281.288)',
  // Cyan
  'cyan-50': 'oklch(98.4% 0.019 200.873)', 'cyan-100': 'oklch(95.6% 0.045 203.388)',
  'cyan-200': 'oklch(91.7% 0.08 205.041)', 'cyan-300': 'oklch(86.5% 0.127 207.078)',
  'cyan-400': 'oklch(78.9% 0.154 211.53)', 'cyan-500': 'oklch(71.5% 0.143 215.221)',
  'cyan-600': 'oklch(60.9% 0.126 221.723)', 'cyan-700': 'oklch(52% 0.105 223.128)',
  'cyan-800': 'oklch(45% 0.085 224.283)', 'cyan-900': 'oklch(39.8% 0.07 227.392)',
  'cyan-950': 'oklch(30.2% 0.056 229.695)',
  // Emerald
  'emerald-50': 'oklch(97.9% 0.021 166.113)', 'emerald-100': 'oklch(95% 0.052 163.051)',
  'emerald-200': 'oklch(90.5% 0.093 164.15)', 'emerald-300': 'oklch(84.5% 0.143 164.978)',
  'emerald-400': 'oklch(76.5% 0.177 163.223)', 'emerald-500': 'oklch(69.6% 0.17 162.48)',
  'emerald-600': 'oklch(59.6% 0.145 163.225)', 'emerald-700': 'oklch(50.8% 0.118 165.612)',
  'emerald-800': 'oklch(43.2% 0.095 166.913)', 'emerald-900': 'oklch(37.8% 0.077 168.94)',
  'emerald-950': 'oklch(26.2% 0.051 172.552)',
  // Special colors
  'white': '#fff', 'black': '#000', 'transparent': 'transparent', 'current': 'currentColor',
}

// =============================================================================
// TYPOGRAPHY UTILITIES - Fast path for font/text utilities
// =============================================================================

// Font weight - direct raw class to CSS
const FONT_WEIGHT_MAP: Record<string, Record<string, string>> = {
  'font-thin': { 'font-weight': '100' },
  'font-extralight': { 'font-weight': '200' },
  'font-light': { 'font-weight': '300' },
  'font-normal': { 'font-weight': '400' },
  'font-medium': { 'font-weight': '500' },
  'font-semibold': { 'font-weight': '600' },
  'font-bold': { 'font-weight': '700' },
  'font-extrabold': { 'font-weight': '800' },
  'font-black': { 'font-weight': '900' },
}

// Font style - direct raw class to CSS
const FONT_STYLE_MAP: Record<string, Record<string, string>> = {
  'italic': { 'font-style': 'italic' },
  'not-italic': { 'font-style': 'normal' },
}

// Text transform - direct raw class to CSS
const TEXT_TRANSFORM_MAP: Record<string, Record<string, string>> = {
  'uppercase': { 'text-transform': 'uppercase' },
  'lowercase': { 'text-transform': 'lowercase' },
  'capitalize': { 'text-transform': 'capitalize' },
  'normal-case': { 'text-transform': 'none' },
}

// Text decoration line - direct raw class to CSS
const TEXT_DECORATION_MAP: Record<string, Record<string, string>> = {
  'underline': { 'text-decoration-line': 'underline' },
  'overline': { 'text-decoration-line': 'overline' },
  'line-through': { 'text-decoration-line': 'line-through' },
  'no-underline': { 'text-decoration-line': 'none' },
}

// Text decoration style - direct raw class to CSS
const TEXT_DECORATION_STYLE_MAP: Record<string, Record<string, string>> = {
  'decoration-solid': { 'text-decoration-style': 'solid' },
  'decoration-double': { 'text-decoration-style': 'double' },
  'decoration-dotted': { 'text-decoration-style': 'dotted' },
  'decoration-dashed': { 'text-decoration-style': 'dashed' },
  'decoration-wavy': { 'text-decoration-style': 'wavy' },
}

// Text align - direct raw class to CSS
const TEXT_ALIGN_MAP: Record<string, Record<string, string>> = {
  'text-left': { 'text-align': 'left' },
  'text-center': { 'text-align': 'center' },
  'text-right': { 'text-align': 'right' },
  'text-justify': { 'text-align': 'justify' },
  'text-start': { 'text-align': 'start' },
  'text-end': { 'text-align': 'end' },
}

// Text overflow - direct raw class to CSS
const TEXT_OVERFLOW_MAP: Record<string, Record<string, string>> = {
  'truncate': { 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' },
  'text-ellipsis': { 'text-overflow': 'ellipsis' },
  'text-clip': { 'text-overflow': 'clip' },
}

// Text wrap - direct raw class to CSS
const TEXT_WRAP_MAP: Record<string, Record<string, string>> = {
  'text-wrap': { 'text-wrap': 'wrap' },
  'text-nowrap': { 'text-wrap': 'nowrap' },
  'text-balance': { 'text-wrap': 'balance' },
  'text-pretty': { 'text-wrap': 'pretty' },
}

// Whitespace - direct raw class to CSS
const WHITESPACE_MAP: Record<string, Record<string, string>> = {
  'whitespace-normal': { 'white-space': 'normal' },
  'whitespace-nowrap': { 'white-space': 'nowrap' },
  'whitespace-pre': { 'white-space': 'pre' },
  'whitespace-pre-line': { 'white-space': 'pre-line' },
  'whitespace-pre-wrap': { 'white-space': 'pre-wrap' },
  'whitespace-break-spaces': { 'white-space': 'break-spaces' },
}

// Word break - direct raw class to CSS
const WORD_BREAK_MAP: Record<string, Record<string, string>> = {
  'break-normal': { 'overflow-wrap': 'normal', 'word-break': 'normal' },
  'break-words': { 'overflow-wrap': 'break-word' },
  'break-all': { 'word-break': 'break-all' },
  'break-keep': { 'word-break': 'keep-all' },
}

// Vertical align - direct raw class to CSS
const VERTICAL_ALIGN_MAP: Record<string, Record<string, string>> = {
  'align-baseline': { 'vertical-align': 'baseline' },
  'align-top': { 'vertical-align': 'top' },
  'align-middle': { 'vertical-align': 'middle' },
  'align-bottom': { 'vertical-align': 'bottom' },
  'align-text-top': { 'vertical-align': 'text-top' },
  'align-text-bottom': { 'vertical-align': 'text-bottom' },
  'align-sub': { 'vertical-align': 'sub' },
  'align-super': { 'vertical-align': 'super' },
}

// List style type - direct raw class to CSS
const LIST_STYLE_MAP: Record<string, Record<string, string>> = {
  'list-none': { 'list-style-type': 'none' },
  'list-disc': { 'list-style-type': 'disc' },
  'list-decimal': { 'list-style-type': 'decimal' },
  'list-inside': { 'list-style-position': 'inside' },
  'list-outside': { 'list-style-position': 'outside' },
}

// Hyphens - direct raw class to CSS
const HYPHENS_MAP: Record<string, Record<string, string>> = {
  'hyphens-none': { hyphens: 'none' },
  'hyphens-manual': { hyphens: 'manual' },
  'hyphens-auto': { hyphens: 'auto' },
}

// =============================================================================
// LAYOUT UTILITIES - Fast path for layout/positioning
// =============================================================================

// Position - direct raw class to CSS
const POSITION_MAP: Record<string, Record<string, string>> = {
  'static': { position: 'static' },
  'fixed': { position: 'fixed' },
  'absolute': { position: 'absolute' },
  'relative': { position: 'relative' },
  'sticky': { position: 'sticky' },
}

// Visibility - direct raw class to CSS
const VISIBILITY_MAP: Record<string, Record<string, string>> = {
  'visible': { visibility: 'visible' },
  'invisible': { visibility: 'hidden' },
  'collapse': { visibility: 'collapse' },
}

// Float - direct raw class to CSS
const FLOAT_MAP: Record<string, Record<string, string>> = {
  'float-left': { float: 'left' },
  'float-right': { float: 'right' },
  'float-none': { float: 'none' },
  'float-start': { float: 'inline-start' },
  'float-end': { float: 'inline-end' },
}

// Clear - direct raw class to CSS
const CLEAR_MAP: Record<string, Record<string, string>> = {
  'clear-left': { clear: 'left' },
  'clear-right': { clear: 'right' },
  'clear-both': { clear: 'both' },
  'clear-none': { clear: 'none' },
  'clear-start': { clear: 'inline-start' },
  'clear-end': { clear: 'inline-end' },
}

// Isolation - direct raw class to CSS
const ISOLATION_MAP: Record<string, Record<string, string>> = {
  'isolate': { isolation: 'isolate' },
  'isolation-auto': { isolation: 'auto' },
}

// Object fit - direct raw class to CSS
const OBJECT_FIT_MAP: Record<string, Record<string, string>> = {
  'object-contain': { 'object-fit': 'contain' },
  'object-cover': { 'object-fit': 'cover' },
  'object-fill': { 'object-fit': 'fill' },
  'object-none': { 'object-fit': 'none' },
  'object-scale-down': { 'object-fit': 'scale-down' },
}

// Object position - direct raw class to CSS
const OBJECT_POSITION_MAP: Record<string, Record<string, string>> = {
  'object-bottom': { 'object-position': 'bottom' },
  'object-center': { 'object-position': 'center' },
  'object-left': { 'object-position': 'left' },
  'object-left-bottom': { 'object-position': 'left bottom' },
  'object-left-top': { 'object-position': 'left top' },
  'object-right': { 'object-position': 'right' },
  'object-right-bottom': { 'object-position': 'right bottom' },
  'object-right-top': { 'object-position': 'right top' },
  'object-top': { 'object-position': 'top' },
}

// Overflow - direct raw class to CSS
const OVERFLOW_MAP: Record<string, Record<string, string>> = {
  'overflow-auto': { overflow: 'auto' },
  'overflow-hidden': { overflow: 'hidden' },
  'overflow-clip': { overflow: 'clip' },
  // The odd one out: an `overflow-` class that sets text-overflow, not
  // overflow. It is Tailwind's legacy alias for `text-ellipsis` and is
  // still a live class in v4, so it belongs here rather than beside the
  // text-* utilities.
  'overflow-ellipsis': { 'text-overflow': 'ellipsis' },
  'overflow-visible': { overflow: 'visible' },
  'overflow-scroll': { overflow: 'scroll' },
  'overflow-x-auto': { 'overflow-x': 'auto' },
  'overflow-x-hidden': { 'overflow-x': 'hidden' },
  'overflow-x-clip': { 'overflow-x': 'clip' },
  'overflow-x-visible': { 'overflow-x': 'visible' },
  'overflow-x-scroll': { 'overflow-x': 'scroll' },
  'overflow-y-auto': { 'overflow-y': 'auto' },
  'overflow-y-hidden': { 'overflow-y': 'hidden' },
  'overflow-y-clip': { 'overflow-y': 'clip' },
  'overflow-y-visible': { 'overflow-y': 'visible' },
  'overflow-y-scroll': { 'overflow-y': 'scroll' },
}

// Overscroll - direct raw class to CSS
const OVERSCROLL_MAP: Record<string, Record<string, string>> = {
  'overscroll-auto': { 'overscroll-behavior': 'auto' },
  'overscroll-contain': { 'overscroll-behavior': 'contain' },
  'overscroll-none': { 'overscroll-behavior': 'none' },
  'overscroll-x-auto': { 'overscroll-behavior-x': 'auto' },
  'overscroll-x-contain': { 'overscroll-behavior-x': 'contain' },
  'overscroll-x-none': { 'overscroll-behavior-x': 'none' },
  'overscroll-y-auto': { 'overscroll-behavior-y': 'auto' },
  'overscroll-y-contain': { 'overscroll-behavior-y': 'contain' },
  'overscroll-y-none': { 'overscroll-behavior-y': 'none' },
}

// Z-index - direct raw class to CSS
const Z_INDEX_MAP: Record<string, Record<string, string>> = {
  'z-0': { 'z-index': '0' },
  'z-10': { 'z-index': '10' },
  'z-20': { 'z-index': '20' },
  'z-30': { 'z-index': '30' },
  'z-40': { 'z-index': '40' },
  'z-50': { 'z-index': '50' },
  'z-auto': { 'z-index': 'auto' },
}

// Aspect ratio - direct raw class to CSS
const ASPECT_RATIO_MAP: Record<string, Record<string, string>> = {
  'aspect-auto': { 'aspect-ratio': 'auto' },
  'aspect-square': { 'aspect-ratio': '1 / 1' },
  'aspect-video': { 'aspect-ratio': '16 / 9' },
}

// Box sizing - direct raw class to CSS
const BOX_SIZING_MAP: Record<string, Record<string, string>> = {
  'box-border': { 'box-sizing': 'border-box' },
  'box-content': { 'box-sizing': 'content-box' },
}

// Box decoration break - direct raw class to CSS
const BOX_DECORATION_MAP: Record<string, Record<string, string>> = {
  'box-decoration-clone': { 'box-decoration-break': 'clone' },
  'box-decoration-slice': { 'box-decoration-break': 'slice' },
}

// =============================================================================
// BACKGROUND UTILITIES - Fast path for background
// =============================================================================

// Background attachment - direct raw class to CSS
const BG_ATTACHMENT_MAP: Record<string, Record<string, string>> = {
  'bg-fixed': { 'background-attachment': 'fixed' },
  'bg-local': { 'background-attachment': 'local' },
  'bg-scroll': { 'background-attachment': 'scroll' },
}

// Background clip - direct raw class to CSS
const BG_CLIP_MAP: Record<string, Record<string, string>> = {
  'bg-clip-border': { 'background-clip': 'border-box' },
  'bg-clip-padding': { 'background-clip': 'padding-box' },
  'bg-clip-content': { 'background-clip': 'content-box' },
  'bg-clip-text': { 'background-clip': 'text', '-webkit-background-clip': 'text' },
}

// Background origin - direct raw class to CSS
const BG_ORIGIN_MAP: Record<string, Record<string, string>> = {
  'bg-origin-border': { 'background-origin': 'border-box' },
  'bg-origin-padding': { 'background-origin': 'padding-box' },
  'bg-origin-content': { 'background-origin': 'content-box' },
}

// Background position - direct raw class to CSS
const BG_POSITION_MAP: Record<string, Record<string, string>> = {
  'bg-bottom': { 'background-position': 'bottom' },
  'bg-center': { 'background-position': 'center' },
  'bg-left': { 'background-position': 'left' },
  'bg-left-bottom': { 'background-position': 'left bottom' },
  'bg-left-top': { 'background-position': 'left top' },
  'bg-right': { 'background-position': 'right' },
  'bg-right-bottom': { 'background-position': 'right bottom' },
  'bg-right-top': { 'background-position': 'right top' },
  'bg-top': { 'background-position': 'top' },
}

// Background repeat - direct raw class to CSS
const BG_REPEAT_MAP: Record<string, Record<string, string>> = {
  'bg-repeat': { 'background-repeat': 'repeat' },
  'bg-no-repeat': { 'background-repeat': 'no-repeat' },
  'bg-repeat-x': { 'background-repeat': 'repeat-x' },
  'bg-repeat-y': { 'background-repeat': 'repeat-y' },
  'bg-repeat-round': { 'background-repeat': 'round' },
  'bg-repeat-space': { 'background-repeat': 'space' },
}

// Background size - direct raw class to CSS
const BG_SIZE_MAP: Record<string, Record<string, string>> = {
  'bg-auto': { 'background-size': 'auto' },
  'bg-cover': { 'background-size': 'cover' },
  'bg-contain': { 'background-size': 'contain' },
}

// Gradient direction - direct raw class to CSS
const GRADIENT_MAP: Record<string, Record<string, string>> = {
  'bg-none': { 'background-image': 'none' },
  'bg-gradient-to-t': { 'background-image': 'linear-gradient(to top, var(--tc-gradient-stops))' },
  'bg-gradient-to-tr': { 'background-image': 'linear-gradient(to top right, var(--tc-gradient-stops))' },
  'bg-gradient-to-r': { 'background-image': 'linear-gradient(to right, var(--tc-gradient-stops))' },
  'bg-gradient-to-br': { 'background-image': 'linear-gradient(to bottom right, var(--tc-gradient-stops))' },
  'bg-gradient-to-b': { 'background-image': 'linear-gradient(to bottom, var(--tc-gradient-stops))' },
  'bg-gradient-to-bl': { 'background-image': 'linear-gradient(to bottom left, var(--tc-gradient-stops))' },
  'bg-gradient-to-l': { 'background-image': 'linear-gradient(to left, var(--tc-gradient-stops))' },
  'bg-gradient-to-tl': { 'background-image': 'linear-gradient(to top left, var(--tc-gradient-stops))' },
  // Radial gradients
  'bg-radial': { 'background-image': 'radial-gradient(var(--tc-gradient-stops))' },
  'bg-radial-at-t': { 'background-image': 'radial-gradient(at top, var(--tc-gradient-stops))' },
  'bg-radial-at-tr': { 'background-image': 'radial-gradient(at top right, var(--tc-gradient-stops))' },
  'bg-radial-at-r': { 'background-image': 'radial-gradient(at right, var(--tc-gradient-stops))' },
  'bg-radial-at-br': { 'background-image': 'radial-gradient(at bottom right, var(--tc-gradient-stops))' },
  'bg-radial-at-b': { 'background-image': 'radial-gradient(at bottom, var(--tc-gradient-stops))' },
  'bg-radial-at-bl': { 'background-image': 'radial-gradient(at bottom left, var(--tc-gradient-stops))' },
  'bg-radial-at-l': { 'background-image': 'radial-gradient(at left, var(--tc-gradient-stops))' },
  'bg-radial-at-tl': { 'background-image': 'radial-gradient(at top left, var(--tc-gradient-stops))' },
  'bg-radial-at-c': { 'background-image': 'radial-gradient(at center, var(--tc-gradient-stops))' },
  // Conic gradients
  'bg-conic': { 'background-image': 'conic-gradient(var(--tc-gradient-stops))' },
  'bg-conic-from-t': { 'background-image': 'conic-gradient(from 0deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-tr': { 'background-image': 'conic-gradient(from 45deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-r': { 'background-image': 'conic-gradient(from 90deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-br': { 'background-image': 'conic-gradient(from 135deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-b': { 'background-image': 'conic-gradient(from 180deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-bl': { 'background-image': 'conic-gradient(from 225deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-l': { 'background-image': 'conic-gradient(from 270deg at center, var(--tc-gradient-stops))' },
  'bg-conic-from-tl': { 'background-image': 'conic-gradient(from 315deg at center, var(--tc-gradient-stops))' },
}

// Content utility - direct raw class to CSS
const CONTENT_MAP: Record<string, Record<string, string>> = {
  'content-none': { content: 'none' },
  'content-empty': { content: '""' },
}

// Scrollbar utilities - direct raw class to CSS
const SCROLLBAR_MAP: Record<string, Record<string, string>> = {
  'scrollbar-auto': { 'scrollbar-width': 'auto' },
  'scrollbar-thin': { 'scrollbar-width': 'thin' },
  'scrollbar-none': { 'scrollbar-width': 'none' },
}

// =============================================================================
// INTERACTIVITY UTILITIES - Fast path for cursor/pointer/etc
// =============================================================================

// Cursor - direct raw class to CSS
const CURSOR_MAP: Record<string, Record<string, string>> = {
  'cursor-auto': { cursor: 'auto' },
  'cursor-default': { cursor: 'default' },
  'cursor-pointer': { cursor: 'pointer' },
  'cursor-wait': { cursor: 'wait' },
  'cursor-text': { cursor: 'text' },
  'cursor-move': { cursor: 'move' },
  'cursor-help': { cursor: 'help' },
  'cursor-not-allowed': { cursor: 'not-allowed' },
  'cursor-none': { cursor: 'none' },
  'cursor-context-menu': { cursor: 'context-menu' },
  'cursor-progress': { cursor: 'progress' },
  'cursor-cell': { cursor: 'cell' },
  'cursor-crosshair': { cursor: 'crosshair' },
  'cursor-vertical-text': { cursor: 'vertical-text' },
  'cursor-alias': { cursor: 'alias' },
  'cursor-copy': { cursor: 'copy' },
  'cursor-no-drop': { cursor: 'no-drop' },
  'cursor-grab': { cursor: 'grab' },
  'cursor-grabbing': { cursor: 'grabbing' },
  'cursor-all-scroll': { cursor: 'all-scroll' },
  'cursor-col-resize': { cursor: 'col-resize' },
  'cursor-row-resize': { cursor: 'row-resize' },
  'cursor-n-resize': { cursor: 'n-resize' },
  'cursor-e-resize': { cursor: 'e-resize' },
  'cursor-s-resize': { cursor: 's-resize' },
  'cursor-w-resize': { cursor: 'w-resize' },
  'cursor-ne-resize': { cursor: 'ne-resize' },
  'cursor-nw-resize': { cursor: 'nw-resize' },
  'cursor-se-resize': { cursor: 'se-resize' },
  'cursor-sw-resize': { cursor: 'sw-resize' },
  'cursor-ew-resize': { cursor: 'ew-resize' },
  'cursor-ns-resize': { cursor: 'ns-resize' },
  'cursor-nesw-resize': { cursor: 'nesw-resize' },
  'cursor-nwse-resize': { cursor: 'nwse-resize' },
  'cursor-zoom-in': { cursor: 'zoom-in' },
  'cursor-zoom-out': { cursor: 'zoom-out' },
}

// Pointer events - direct raw class to CSS
const POINTER_EVENTS_MAP: Record<string, Record<string, string>> = {
  'pointer-events-none': { 'pointer-events': 'none' },
  'pointer-events-auto': { 'pointer-events': 'auto' },
}

// Resize - direct raw class to CSS
const RESIZE_MAP: Record<string, Record<string, string>> = {
  'resize-none': { resize: 'none' },
  'resize-y': { resize: 'vertical' },
  'resize-x': { resize: 'horizontal' },
  'resize': { resize: 'both' },
}

// User select - direct raw class to CSS
const USER_SELECT_MAP: Record<string, Record<string, string>> = {
  'select-none': { 'user-select': 'none' },
  'select-text': { 'user-select': 'text' },
  'select-all': { 'user-select': 'all' },
  'select-auto': { 'user-select': 'auto' },
}

// Scroll behavior - direct raw class to CSS
const SCROLL_BEHAVIOR_MAP: Record<string, Record<string, string>> = {
  'scroll-auto': { 'scroll-behavior': 'auto' },
  'scroll-smooth': { 'scroll-behavior': 'smooth' },
}

// Scroll snap type - direct raw class to CSS.
// The strictness var carries a `proximity` fallback (Tailwind's default):
// nothing declares --tc-scroll-snap-strictness unless snap-mandatory /
// snap-proximity is also used, and an unresolved var makes the whole
// declaration invalid at computed-value time — `snap-x` on its own snapped
// nothing at all.
const SCROLL_SNAP_MAP: Record<string, Record<string, string>> = {
  'snap-none': { 'scroll-snap-type': 'none' },
  'snap-x': { 'scroll-snap-type': 'x var(--tc-scroll-snap-strictness, proximity)' },
  'snap-y': { 'scroll-snap-type': 'y var(--tc-scroll-snap-strictness, proximity)' },
  'snap-both': { 'scroll-snap-type': 'both var(--tc-scroll-snap-strictness, proximity)' },
  'snap-mandatory': { '--tc-scroll-snap-strictness': 'mandatory' },
  'snap-proximity': { '--tc-scroll-snap-strictness': 'proximity' },
  'snap-start': { 'scroll-snap-align': 'start' },
  'snap-end': { 'scroll-snap-align': 'end' },
  'snap-center': { 'scroll-snap-align': 'center' },
  'snap-align-none': { 'scroll-snap-align': 'none' },
  'snap-normal': { 'scroll-snap-stop': 'normal' },
  'snap-always': { 'scroll-snap-stop': 'always' },
}

// Touch action - direct raw class to CSS
// Pan/pinch utilities compose through variables (like Tailwind): each sets
// its own axis variable and rebuilds touch-action from all three, so
// `touch-pan-x touch-pan-y` yields `pan-x pan-y` instead of the last class
// clobbering the first. Empty fallbacks keep unused slots blank.
const TOUCH_COMPOSED = 'var(--tc-pan-x,) var(--tc-pan-y,) var(--tc-pinch-zoom,)'
const TOUCH_ACTION_MAP: Record<string, Record<string, string>> = {
  'touch-auto': { 'touch-action': 'auto' },
  'touch-none': { 'touch-action': 'none' },
  'touch-pan-x': { '--tc-pan-x': 'pan-x', 'touch-action': TOUCH_COMPOSED },
  'touch-pan-left': { '--tc-pan-x': 'pan-left', 'touch-action': TOUCH_COMPOSED },
  'touch-pan-right': { '--tc-pan-x': 'pan-right', 'touch-action': TOUCH_COMPOSED },
  'touch-pan-y': { '--tc-pan-y': 'pan-y', 'touch-action': TOUCH_COMPOSED },
  'touch-pan-up': { '--tc-pan-y': 'pan-up', 'touch-action': TOUCH_COMPOSED },
  'touch-pan-down': { '--tc-pan-y': 'pan-down', 'touch-action': TOUCH_COMPOSED },
  'touch-pinch-zoom': { '--tc-pinch-zoom': 'pinch-zoom', 'touch-action': TOUCH_COMPOSED },
  'touch-manipulation': { 'touch-action': 'manipulation' },
}

// Will change - direct raw class to CSS
const WILL_CHANGE_MAP: Record<string, Record<string, string>> = {
  'will-change-auto': { 'will-change': 'auto' },
  'will-change-scroll': { 'will-change': 'scroll-position' },
  'will-change-contents': { 'will-change': 'contents' },
  'will-change-transform': { 'will-change': 'transform' },
}

// Appearance - direct raw class to CSS
const APPEARANCE_MAP: Record<string, Record<string, string>> = {
  'appearance-none': { appearance: 'none' },
  'appearance-auto': { appearance: 'auto' },
}

// =============================================================================
// TABLE UTILITIES - Fast path for table styling
// =============================================================================

// Border collapse - direct raw class to CSS
const BORDER_COLLAPSE_MAP: Record<string, Record<string, string>> = {
  'border-collapse': { 'border-collapse': 'collapse' },
  'border-separate': { 'border-collapse': 'separate' },
}

// Table layout - direct raw class to CSS
const TABLE_LAYOUT_MAP: Record<string, Record<string, string>> = {
  'table-auto': { 'table-layout': 'auto' },
  'table-fixed': { 'table-layout': 'fixed' },
}

// Caption side - direct raw class to CSS
const CAPTION_SIDE_MAP: Record<string, Record<string, string>> = {
  'caption-top': { 'caption-side': 'top' },
  'caption-bottom': { 'caption-side': 'bottom' },
}

// =============================================================================
// ACCESSIBILITY UTILITIES - Fast path for a11y
// =============================================================================

// Screen reader only - direct raw class to CSS
const SR_ONLY_MAP: Record<string, Record<string, string>> = {
  'sr-only': {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    'white-space': 'nowrap',
    'border-width': '0',
  },
  'not-sr-only': {
    position: 'static',
    width: 'auto',
    height: 'auto',
    padding: '0',
    margin: '0',
    overflow: 'visible',
    clip: 'auto',
    'white-space': 'normal',
  },
}

// Forced color adjust - direct raw class to CSS
const FORCED_COLOR_MAP: Record<string, Record<string, string>> = {
  'forced-color-adjust-auto': { 'forced-color-adjust': 'auto' },
  'forced-color-adjust-none': { 'forced-color-adjust': 'none' },
}

// =============================================================================
// SVG UTILITIES - Fast path for SVG
// =============================================================================

// Fill - direct raw class to CSS
const FILL_MAP: Record<string, Record<string, string>> = {
  'fill-none': { fill: 'none' },
  'fill-current': { fill: 'currentColor' },
  'fill-inherit': { fill: 'inherit' },
}

// Stroke - direct raw class to CSS
const STROKE_MAP: Record<string, Record<string, string>> = {
  'stroke-none': { stroke: 'none' },
  'stroke-current': { stroke: 'currentColor' },
  'stroke-inherit': { stroke: 'inherit' },
  'stroke-0': { 'stroke-width': '0' },
  'stroke-1': { 'stroke-width': '1' },
  'stroke-2': { 'stroke-width': '2' },
}

// Stroke linecap - direct raw class to CSS
const STROKE_LINECAP_MAP: Record<string, Record<string, string>> = {
  'stroke-linecap-butt': { 'stroke-linecap': 'butt' },
  'stroke-linecap-round': { 'stroke-linecap': 'round' },
  'stroke-linecap-square': { 'stroke-linecap': 'square' },
}

// Stroke linejoin - direct raw class to CSS
const STROKE_LINEJOIN_MAP: Record<string, Record<string, string>> = {
  'stroke-linejoin-miter': { 'stroke-linejoin': 'miter' },
  'stroke-linejoin-round': { 'stroke-linejoin': 'round' },
  'stroke-linejoin-bevel': { 'stroke-linejoin': 'bevel' },
}

// =============================================================================
// FILTER UTILITIES - Fast path for filters
// =============================================================================

// Filter utilities compose through one custom property per function (see
// rules-interactivity.ts). These fast-path maps must emit the same shape, or
// a named utility like `backdrop-blur-md` would go back to writing the whole
// `backdrop-filter` and clobber any other filter set on the same element.
const CW_FILTER_FUNCTIONS = ['blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate', 'invert', 'saturate', 'sepia', 'drop-shadow']
const CW_BACKDROP_FUNCTIONS = ['blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate', 'invert', 'opacity', 'saturate', 'sepia']
const CW_FILTER_COMPOSED = CW_FILTER_FUNCTIONS.map(fn => `var(--tc-${fn}, )`).join(' ')
const CW_BACKDROP_COMPOSED = CW_BACKDROP_FUNCTIONS.map(fn => `var(--tc-backdrop-${fn}, )`).join(' ')

/**
 * Route a drop-shadow's colour through the override variable so that a
 * `drop-shadow-<color>` utility can replace it without restating the
 * offsets. The scale's own colour becomes the fallback.
 */
function dropShadowColor(fallback: string): string {
  return `var(--tc-drop-shadow-color, ${fallback})`
}

function cwFilter(fn: string, value: string): Record<string, string> {
  return { [`--tc-${fn}`]: value, filter: CW_FILTER_COMPOSED }
}

function cwBackdrop(fn: string, value: string): Record<string, string> {
  return {
    [`--tc-backdrop-${fn}`]: value,
    '-webkit-backdrop-filter': CW_BACKDROP_COMPOSED,
    'backdrop-filter': CW_BACKDROP_COMPOSED,
  }
}

// Blur - direct raw class to CSS
const BLUR_MAP: Record<string, Record<string, string>> = {
  'blur-none': cwFilter('blur', 'blur(0)'),
  // v4 renamed the bottom of the blur scale: what v3 called `blur-sm`
  // (4px) is now `blur-xs`, and `blur-sm` moved up to 8px. This engine
  // had the v3 spelling, so `blur-xs` was missing and `blur-sm` was one
  // step too small.
  'blur-xs': cwFilter('blur', 'blur(4px)'),
  'blur-sm': cwFilter('blur', 'blur(8px)'),
  'blur': cwFilter('blur', 'blur(8px)'),
  'blur-md': cwFilter('blur', 'blur(12px)'),
  'blur-lg': cwFilter('blur', 'blur(16px)'),
  'blur-xl': cwFilter('blur', 'blur(24px)'),
  'blur-2xl': cwFilter('blur', 'blur(40px)'),
  'blur-3xl': cwFilter('blur', 'blur(64px)'),
}

// Backdrop blur - direct raw class to CSS (with -webkit- prefix for Safari)
const BACKDROP_BLUR_MAP: Record<string, Record<string, string>> = {
  'backdrop-blur-none': cwBackdrop('blur', 'blur(0)'),
  // Same v4 rename as the plain blur scale above; the two share one
  // theme scale in Tailwind, so they must not drift apart.
  'backdrop-blur-xs': cwBackdrop('blur', 'blur(4px)'),
  'backdrop-blur-sm': cwBackdrop('blur', 'blur(8px)'),
  'backdrop-blur': cwBackdrop('blur', 'blur(8px)'),
  'backdrop-blur-md': cwBackdrop('blur', 'blur(12px)'),
  'backdrop-blur-lg': cwBackdrop('blur', 'blur(16px)'),
  'backdrop-blur-xl': cwBackdrop('blur', 'blur(24px)'),
  'backdrop-blur-2xl': cwBackdrop('blur', 'blur(40px)'),
  'backdrop-blur-3xl': cwBackdrop('blur', 'blur(64px)'),
}

// Grayscale/invert/sepia - direct raw class to CSS
const FILTER_TOGGLE_MAP: Record<string, Record<string, string>> = {
  'grayscale-0': cwFilter('grayscale', 'grayscale(0)'),
  'grayscale': cwFilter('grayscale', 'grayscale(100%)'),
  'invert-0': cwFilter('invert', 'invert(0)'),
  'invert': cwFilter('invert', 'invert(100%)'),
  'sepia-0': cwFilter('sepia', 'sepia(0)'),
  'sepia': cwFilter('sepia', 'sepia(100%)'),
}

// Backdrop grayscale/invert/sepia - direct raw class to CSS (with -webkit- prefix)
const BACKDROP_FILTER_TOGGLE_MAP: Record<string, Record<string, string>> = {
  'backdrop-grayscale-0': cwBackdrop('grayscale', 'grayscale(0)'),
  'backdrop-grayscale': cwBackdrop('grayscale', 'grayscale(100%)'),
  'backdrop-invert-0': cwBackdrop('invert', 'invert(0)'),
  'backdrop-invert': cwBackdrop('invert', 'invert(100%)'),
  'backdrop-sepia-0': cwBackdrop('sepia', 'sepia(0)'),
  'backdrop-sepia': cwBackdrop('sepia', 'sepia(100%)'),
}

// Drop shadow - direct raw class to CSS
/**
 * The v4 drop-shadow scale.
 *
 * v4 did not merely rename these: `md`, `lg` and `xl` were redrawn as a
 * SINGLE drop-shadow each, where v3 stacked two, and their offsets and
 * opacities all changed. `xs` is new and happens to carry v3's old `sm`
 * value, so a v3 `drop-shadow-sm` maps to `drop-shadow-xs` here.
 *
 * `drop-shadow` (the bare DEFAULT) and `drop-shadow-2xl` are the two v4 kept
 * unchanged from v3.
 */
const DROP_SHADOW_MAP: Record<string, Record<string, string>> = {
  'drop-shadow-xs': cwFilter('drop-shadow', `drop-shadow(0 1px 1px ${dropShadowColor('rgb(0 0 0 / 0.05)')})`),
  'drop-shadow-sm': cwFilter('drop-shadow', `drop-shadow(0 1px 2px ${dropShadowColor('rgb(0 0 0 / 0.15)')})`),
  'drop-shadow': cwFilter('drop-shadow', `drop-shadow(0 1px 2px ${dropShadowColor('rgb(0 0 0 / 0.1)')}) drop-shadow(0 1px 1px ${dropShadowColor('rgb(0 0 0 / 0.06)')})`),
  'drop-shadow-md': cwFilter('drop-shadow', `drop-shadow(0 3px 3px ${dropShadowColor('rgb(0 0 0 / 0.12)')})`),
  'drop-shadow-lg': cwFilter('drop-shadow', `drop-shadow(0 4px 4px ${dropShadowColor('rgb(0 0 0 / 0.15)')})`),
  'drop-shadow-xl': cwFilter('drop-shadow', `drop-shadow(0 9px 7px ${dropShadowColor('rgb(0 0 0 / 0.1)')})`),
  'drop-shadow-2xl': cwFilter('drop-shadow', `drop-shadow(0 25px 25px ${dropShadowColor('rgb(0 0 0 / 0.15)')})`),
  // A transparent shadow rather than Tailwind's empty value: the composed
  // filter reads `var(--tc-drop-shadow, )`, so both resolve to no visible
  // shadow, and a concrete value survives minification unambiguously.
  'drop-shadow-none': cwFilter('drop-shadow', 'drop-shadow(0 0 #0000)'),
}

// Mix blend mode - direct raw class to CSS
const MIX_BLEND_MAP: Record<string, Record<string, string>> = {
  'mix-blend-normal': { 'mix-blend-mode': 'normal' },
  'mix-blend-multiply': { 'mix-blend-mode': 'multiply' },
  'mix-blend-screen': { 'mix-blend-mode': 'screen' },
  'mix-blend-overlay': { 'mix-blend-mode': 'overlay' },
  'mix-blend-darken': { 'mix-blend-mode': 'darken' },
  'mix-blend-lighten': { 'mix-blend-mode': 'lighten' },
  'mix-blend-color-dodge': { 'mix-blend-mode': 'color-dodge' },
  'mix-blend-color-burn': { 'mix-blend-mode': 'color-burn' },
  'mix-blend-hard-light': { 'mix-blend-mode': 'hard-light' },
  'mix-blend-soft-light': { 'mix-blend-mode': 'soft-light' },
  'mix-blend-difference': { 'mix-blend-mode': 'difference' },
  'mix-blend-exclusion': { 'mix-blend-mode': 'exclusion' },
  'mix-blend-hue': { 'mix-blend-mode': 'hue' },
  'mix-blend-saturation': { 'mix-blend-mode': 'saturation' },
  'mix-blend-color': { 'mix-blend-mode': 'color' },
  'mix-blend-luminosity': { 'mix-blend-mode': 'luminosity' },
  'mix-blend-plus-darker': { 'mix-blend-mode': 'plus-darker' },
  'mix-blend-plus-lighter': { 'mix-blend-mode': 'plus-lighter' },
}

// Background blend mode - direct raw class to CSS
const BG_BLEND_MAP: Record<string, Record<string, string>> = {
  'bg-blend-normal': { 'background-blend-mode': 'normal' },
  'bg-blend-multiply': { 'background-blend-mode': 'multiply' },
  'bg-blend-screen': { 'background-blend-mode': 'screen' },
  'bg-blend-overlay': { 'background-blend-mode': 'overlay' },
  'bg-blend-darken': { 'background-blend-mode': 'darken' },
  'bg-blend-lighten': { 'background-blend-mode': 'lighten' },
  'bg-blend-color-dodge': { 'background-blend-mode': 'color-dodge' },
  'bg-blend-color-burn': { 'background-blend-mode': 'color-burn' },
  'bg-blend-hard-light': { 'background-blend-mode': 'hard-light' },
  'bg-blend-soft-light': { 'background-blend-mode': 'soft-light' },
  'bg-blend-difference': { 'background-blend-mode': 'difference' },
  'bg-blend-exclusion': { 'background-blend-mode': 'exclusion' },
  'bg-blend-hue': { 'background-blend-mode': 'hue' },
  'bg-blend-saturation': { 'background-blend-mode': 'saturation' },
  'bg-blend-color': { 'background-blend-mode': 'color' },
  'bg-blend-luminosity': { 'background-blend-mode': 'luminosity' },
}

// Combined static map for raw class lookups (display, flex, transform, etc.)
const STATIC_UTILITY_MAP: Record<string, Record<string, string>> = {
  ...DISPLAY_MAP,
  ...FLEX_DIRECTION_MAP,
  ...FLEX_WRAP_MAP,
  ...FLEX_VALUES_MAP,
  ...GROW_SHRINK_MAP,
  ...BORDER_STYLE_MAP,
  ...TRANSFORM_MAP,
  ...TRANSITION_MAP,
  ...TIMING_MAP,
  ...ANIMATION_MAP,
  ...RING_MAP,
  ...SHADOW_MAP,
  ...BORDER_RADIUS_MAP,
  ...BORDER_WIDTH_MAP,
  ...RING_OFFSET_MAP,
  ...OPACITY_MAP,
  // Typography
  ...FONT_WEIGHT_MAP,
  ...FONT_STYLE_MAP,
  ...TEXT_TRANSFORM_MAP,
  ...TEXT_DECORATION_MAP,
  ...TEXT_DECORATION_STYLE_MAP,
  ...TEXT_ALIGN_MAP,
  ...TEXT_OVERFLOW_MAP,
  ...TEXT_WRAP_MAP,
  ...WHITESPACE_MAP,
  ...WORD_BREAK_MAP,
  ...VERTICAL_ALIGN_MAP,
  ...LIST_STYLE_MAP,
  ...HYPHENS_MAP,
  // Layout
  ...POSITION_MAP,
  ...VISIBILITY_MAP,
  ...FLOAT_MAP,
  ...CLEAR_MAP,
  ...ISOLATION_MAP,
  ...OBJECT_FIT_MAP,
  ...OBJECT_POSITION_MAP,
  ...OVERFLOW_MAP,
  ...OVERSCROLL_MAP,
  ...Z_INDEX_MAP,
  ...ASPECT_RATIO_MAP,
  ...BOX_SIZING_MAP,
  ...BOX_DECORATION_MAP,
  // Background
  ...BG_ATTACHMENT_MAP,
  ...BG_CLIP_MAP,
  ...BG_ORIGIN_MAP,
  ...BG_POSITION_MAP,
  ...BG_REPEAT_MAP,
  ...BG_SIZE_MAP,
  ...GRADIENT_MAP,
  // Interactivity
  ...CURSOR_MAP,
  ...POINTER_EVENTS_MAP,
  ...RESIZE_MAP,
  ...USER_SELECT_MAP,
  ...SCROLL_BEHAVIOR_MAP,
  ...SCROLL_SNAP_MAP,
  ...TOUCH_ACTION_MAP,
  ...WILL_CHANGE_MAP,
  ...APPEARANCE_MAP,
  // Table
  ...BORDER_COLLAPSE_MAP,
  ...TABLE_LAYOUT_MAP,
  ...CAPTION_SIDE_MAP,
  // Accessibility
  ...SR_ONLY_MAP,
  ...FORCED_COLOR_MAP,
  // SVG
  ...FILL_MAP,
  ...STROKE_MAP,
  ...STROKE_LINECAP_MAP,
  ...STROKE_LINEJOIN_MAP,
  // Filters
  ...BLUR_MAP,
  ...BACKDROP_BLUR_MAP,
  ...FILTER_TOGGLE_MAP,
  ...BACKDROP_FILTER_TOGGLE_MAP,
  ...DROP_SHADOW_MAP,
  ...MIX_BLEND_MAP,
  ...BG_BLEND_MAP,
  // Content
  ...CONTENT_MAP,
  // Scrollbar
  ...SCROLLBAR_MAP,
}

// Pre-computed variant selector map for O(1) lookup (shared across all instances)
const VARIANT_SELECTORS: Record<string, string> = {
  // Pseudo-class variants
  'hover': ':hover',
  'focus': ':focus',
  'active': ':active',
  'disabled': ':disabled',
  'visited': ':visited',
  'checked': ':checked',
  'focus-within': ':focus-within',
  'focus-visible': ':focus-visible',
  // Positional variants
  'first': ':first-child',
  'last': ':last-child',
  'odd': ':nth-child(odd)',
  'even': ':nth-child(even)',
  'first-of-type': ':first-of-type',
  'last-of-type': ':last-of-type',
  // Pseudo-elements
  'before': '::before',
  'after': '::after',
  'marker': '::marker',
  'placeholder': '::placeholder',
  'selection': '::selection',
  'file': '::file-selector-button',
  'first-letter': '::first-letter',
  'first-line': '::first-line',
  'backdrop': '::backdrop',
  'details-content': '::details-content',
  // Form state pseudo-classes
  'required': ':required',
  'valid': ':valid',
  'invalid': ':invalid',
  'read-only': ':read-only',
  'autofill': ':autofill',
  // :user-valid / :user-invalid only match once the user has interacted,
  // unlike :valid / :invalid which match an untouched empty required field.
  'user-valid': ':user-valid',
  'user-invalid': ':user-invalid',
  'in-range': ':in-range',
  'out-of-range': ':out-of-range',
  'placeholder-shown': ':placeholder-shown',
  // Additional state pseudo-classes
  'open': '[open]',
  'closed': ':not([open])',
  'empty': ':empty',
  'enabled': ':enabled',
  'only': ':only-child',
  'only-of-type': ':only-of-type',
  'target': ':target',
  'indeterminate': ':indeterminate',
  'default': ':default',
  'optional': ':optional',
  // [inert] marks a subtree non-interactive, so the variant has to match
  // the element carrying the attribute AND everything beneath it.
  'inert': ':is([inert], [inert] *)',
}

/**
 * Resolve the selector a variant contributes, so that `not-*` can negate it.
 *
 * `not-*` is a modifier, not a variant of its own: it wraps whatever the
 * inner variant would have matched. Deriving that here is what replaced the
 * fixed eight-entry table this used to be — `not-first` is just
 * `:not(` + the `first` selector + `)`, and the same derivation gives
 * `not-focus`, `not-nth-3`, `not-data-open` and the rest for free.
 *
 * Returns undefined when the inner variant contributes an at-rule rather
 * than a selector (those are negated in getMediaQuery), or when it cannot be
 * resolved at all. A pseudo-ELEMENT is rejected because `:not(::before)` is
 * invalid CSS.
 */
function negatableVariantSelector(token: string): string | undefined {
  if (!token)
    return undefined

  // Arbitrary selector: not-[.card]
  if (token.charCodeAt(0) === 91 && token.charCodeAt(token.length - 1) === 93) {
    const inner = token.slice(1, -1).replace(/_/g, ' ').trim()
    return inner ? `:is(${inner})` : undefined
  }

  const direct = VARIANT_SELECTORS[token]
  if (direct !== undefined)
    return direct.startsWith('::') ? undefined : direct

  const nth = nthVariantSelector(token)
  if (nth !== undefined)
    return nth

  if (token.startsWith('has-')) {
    const value = token.slice(4)
    if (!value)
      return undefined
    return value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93
      ? `:has(${value.slice(1, -1)})`
      : `:has(:${value})`
  }

  if (token.startsWith('aria-') || token.startsWith('data-')) {
    const attr = token.slice(0, 4)
    const value = token.slice(5)
    if (!value)
      return undefined
    if (value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93)
      return `[${attr}-${value.slice(1, -1)}]`
    return attr === 'aria' ? `[aria-${value}="true"]` : `[data-${value}]`
  }

  // `not-in-focus` is "not a descendant of a focused element", so the
  // ancestor condition has to carry its descendant combinator inside the
  // negation rather than becoming a prefix.
  if (token.startsWith('in-')) {
    const condition = ancestorConditionSelector(token.slice(3))
    return condition === undefined ? undefined : `:where(${condition}) *`
  }

  return undefined
}

/**
 * nth-* variants resolve to the four An+B pseudo-classes.
 *
 * Prefixes are tried longest-first: `nth-last-of-type-2` has to reach
 * `:nth-last-of-type(2)` rather than being eaten by the `nth-last-` prefix
 * and emitting `:nth-last-child(of-type-2)`.
 *
 * A bare argument must be a plain non-negative integer, which is what
 * Tailwind accepts: it rejects `nth-2.5`, `nth--3` and `nth-abc`, and a
 * variant we cannot resolve has to drop the rule rather than pass a raw word
 * through to CSS. A bracketed argument is an An+B microsyntax expression and
 * passes through verbatim, so `nth-[2n+1]`, `nth-[-n+3]` and `nth-[odd]` all
 * work.
 */
const NTH_VARIANT_FUNCTIONS: [string, string][] = [
  ['nth-last-of-type-', 'nth-last-of-type'],
  ['nth-of-type-', 'nth-of-type'],
  ['nth-last-', 'nth-last-child'],
  ['nth-', 'nth-child'],
]

function nthVariantSelector(variant: string): string | undefined {
  for (let i = 0; i < NTH_VARIANT_FUNCTIONS.length; i++) {
    const prefix = NTH_VARIANT_FUNCTIONS[i][0]
    if (!variant.startsWith(prefix))
      continue
    const fn = NTH_VARIANT_FUNCTIONS[i][1]
    const arg = variant.slice(prefix.length)
    if (arg.charCodeAt(0) === 91 && arg.charCodeAt(arg.length - 1) === 93) {
      const inner = arg.slice(1, -1).replace(/_/g, ' ').trim()
      return inner ? `:${fn}(${inner})` : undefined
    }
    return /^\d+$/.test(arg) ? `:${fn}(${arg})` : undefined
  }
  return undefined
}

/**
 * Resolve the condition an `in-*` variant places on an ancestor.
 *
 * `in-*` is `group-*` without the bookkeeping: it styles an element when any
 * ancestor matches, with no `group` class needed on that ancestor. The
 * condition is resolved the same way the standalone variants resolve theirs,
 * so `in-focus` reuses the `focus` selector and `in-data-open` the `data-*`
 * attribute form.
 *
 * Returns undefined for a condition we cannot resolve (`in-bogus`), which
 * drops the rule rather than emitting a raw word as a selector.
 */
function ancestorConditionSelector(token: string): string | undefined {
  if (!token)
    return undefined

  // Arbitrary selector: in-[.card], in-[&>p]. A `&` stands for the ancestor
  // itself, so it becomes `*` rather than the utility's own class.
  if (token.charCodeAt(0) === 91 && token.charCodeAt(token.length - 1) === 93) {
    const inner = token.slice(1, -1).replace(/_/g, ' ').trim()
    if (!inner)
      return undefined
    return inner.includes('&') ? inner.replace(/&/g, '*') : `:is(${inner})`
  }

  if (token.startsWith('data-')) {
    const value = token.slice(5)
    return value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93
      ? `[data-${value.slice(1, -1)}]`
      : `[data-${value}]`
  }

  if (token.startsWith('aria-')) {
    const value = token.slice(5)
    return value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93
      ? `[aria-${value.slice(1, -1)}]`
      : `[aria-${value}="true"]`
  }

  // A pseudo-ELEMENT can never be an ancestor, so ::before and friends are
  // not valid conditions even though they are valid variants.
  const known = VARIANT_SELECTORS[token]
  return known !== undefined && !known.startsWith('::') ? known : undefined
}

// Pre-computed prefix variants (these modify the selector prefix, not suffix)
// Minify a static CSS block: strip comments, then collapse whitespace
// around syntax characters. Used for preflight and keyframes, which were
// previously only whitespace-collapsed (comments and per-declaration
// spacing survived into "minified" output).
/**
 * Minification is delegated to the toolkit's AST-based optimiser rather than
 * squeezed with regexes. The old inline version could not tell a space inside
 * a string or `url()` from a space between tokens.
 */
function minifyCSSBlock(css: string): string {
  return minifyBlock(css).css
}

/**
 * Media-feature variants whose condition is a fixed query.
 *
 * `pointer-*` describes the PRIMARY input device and `any-pointer-*` whether
 * any available device matches — a laptop with a touchscreen is
 * `pointer-fine` but also `any-pointer-coarse`, which is why both families
 * exist and why they are not interchangeable.
 */
const MEDIA_FEATURE_VARIANTS: Record<string, string> = {
  'pointer-none': '(pointer: none)',
  'pointer-coarse': '(pointer: coarse)',
  'pointer-fine': '(pointer: fine)',
  'any-pointer-none': '(any-pointer: none)',
  'any-pointer-coarse': '(any-pointer: coarse)',
  'any-pointer-fine': '(any-pointer: fine)',
  'inverted-colors': '(inverted-colors: inverted)',
  // Styles that should only apply with scripting unavailable. Note this is
  // the media feature, not the <noscript> element.
  'noscript': '(scripting: none)',
}

/**
 * Media preference variants: one fixed condition each.
 *
 * Extracted from the switch in getMediaQuery so that `not-*` can negate the
 * same conditions rather than restating them.
 */
const PREFERENCE_MEDIA_VARIANTS: Record<string, string> = {
  'print': 'print',
  'motion-safe': '(prefers-reduced-motion: no-preference)',
  'motion-reduce': '(prefers-reduced-motion: reduce)',
  'contrast-more': '(prefers-contrast: more)',
  'contrast-less': '(prefers-contrast: less)',
  'landscape': '(orientation: landscape)',
  'portrait': '(orientation: portrait)',
  'forced-colors': '(forced-colors: active)',
}

/**
 * The condition half of a `supports-[…]` variant, without the at-rule name,
 * so that both `@supports (…)` and `@supports not (…)` can build on it.
 */
function supportsCondition(value: string): string {
  if (value.charCodeAt(0) === 91 && value.charCodeAt(value.length - 1) === 93) {
    const inner = value.slice(1, -1).replace(/_/g, ' ')
    const colonIdx = inner.indexOf(':')
    if (colonIdx !== -1)
      return `(${inner.slice(0, colonIdx).trim()}: ${inner.slice(colonIdx + 1).trim()})`
    return `(${inner})`
  }
  return `(${value})`
}

/**
 * Split a container-query variant's `/name` suffix off its size token.
 *
 * The slash has to be found OUTSIDE any brackets, or an arbitrary size
 * containing one — `@min-[calc(100%/2)]` — would be read as a container
 * named `2)]`.
 */
function splitContainerName(token: string): { size: string, name?: string } {
  let depth = 0
  for (let i = token.length - 1; i >= 0; i--) {
    const c = token.charCodeAt(i)
    if (c === 93) depth++ // ]
    else if (c === 91) depth-- // [
    else if (c === 47 && depth === 0) // /
      return { size: token.slice(0, i), name: token.slice(i + 1) }
  }
  return { size: token }
}

// Separator between stacked at-rule wrappers in a rule-group key
// (@media + @supports + @container). Never appears in CSS text.
const AT_RULE_SEPARATOR = '\u0001'

const PREFIX_VARIANTS: Record<string, string> = {
  'dark': '.dark ',
  'light': '.light ',
}

/**
 * Direction variants match the element carrying `dir` AND everything under it.
 *
 * These used to be prefix variants (`[dir="rtl"] .rtl\:x`), a plain descendant
 * combinator, so the element that declares the direction could never style
 * itself: `<html dir="rtl" class="rtl:..">` and `<div dir="rtl" class="rtl:..">`
 * both silently did nothing — the common case for a per-block direction
 * override. Wrapping in `:is()` rather than `:where()` is deliberate: `:is()`
 * takes the specificity of its most specific argument, so the emitted rule
 * keeps the (0,2,0) it had as a descendant selector and continues to win over
 * the undirected utility it is meant to override.
 */
const DIRECTION_VARIANTS: Record<string, string> = {
  rtl: ':is([dir="rtl"], [dir="rtl"] *)',
  ltr: ':is([dir="ltr"], [dir="ltr"] *)',
}

// Cache for pre-processed configs to avoid redundant merging
const processedConfigCache = new WeakMap<CssConfig, ProcessedConfig>()

/**
 * Each derived lookup table below is a pure function of exactly one theme
 * sub-object, so it is cached on that object rather than on the whole config.
 *
 * This is what makes a cold build cheap. `processConfig` was ~67% of the time
 * to build a small stylesheet, and most of that was the colour scan walking
 * every palette entry — 22 palettes by 11 shades, building a template string
 * per shade — only to conclude that nothing differed from the defaults. A
 * config that spreads the defaults (`{ ...defaultConfig }`, which is what a
 * fresh build does) shares every theme sub-object by reference and now skips
 * all of it. A theme that genuinely extends one of these gets a new object
 * out of `deepMerge` and correctly misses, per sub-object rather than all or
 * nothing.
 *
 * Safe to share because every one of these is read-only after construction.
 */
const spacingValuesCache = new WeakMap<object, Record<string, string>>()
const commonColorsCache = new WeakMap<object, Record<string, string>>()
const skipStaticRadiusCache = new WeakMap<object, boolean>()
const skipStaticShadowCache = new WeakMap<object, boolean>()
const screenBreakpointsCache = new WeakMap<object, Map<string, string>>()
const containerBreakpointsCache = new WeakMap<object, Map<string, string>>()

function resolveSpacingValues(spacing: Record<string, string>): Record<string, string> {
  const cached = spacingValuesCache.get(spacing)
  if (cached)
    return cached

  let custom = false
  for (const key in spacing) {
    if (SPACING_VALUES[key] !== spacing[key]) {
      custom = true
      break
    }
  }

  const result = custom ? { ...SPACING_VALUES, ...spacing } : SPACING_VALUES
  spacingValuesCache.set(spacing, result)
  return result
}

function resolveCommonColors(
  colors: Record<string, string | Record<string, string>>,
): Record<string, string> {
  const cached = commonColorsCache.get(colors)
  if (cached)
    return cached

  // `for…in` rather than Object.entries: entries allocates a pair array per
  // palette, and this runs over every colour in the theme.
  let diffs: Record<string, string> | null = null
  for (const name in colors) {
    const value = colors[name]
    if (typeof value === 'string') {
      if (COMMON_COLORS[name] !== undefined && COMMON_COLORS[name] !== value) {
        diffs ??= {}
        diffs[name] = value
      }
      continue
    }
    if (!value || typeof value !== 'object')
      continue
    for (const shade in value) {
      const shadeValue = value[shade]
      if (typeof shadeValue !== 'string')
        continue
      const key = shade === 'DEFAULT' ? name : `${name}-${shade}`
      if (COMMON_COLORS[key] !== undefined && COMMON_COLORS[key] !== shadeValue) {
        diffs ??= {}
        diffs[key] = shadeValue
      }
    }
  }

  const result = diffs ? { ...COMMON_COLORS, ...diffs } : COMMON_COLORS
  commonColorsCache.set(colors, result)
  return result
}

function resolveSkipStaticRadius(borderRadius: Record<string, string>): boolean {
  const cached = skipStaticRadiusCache.get(borderRadius)
  if (cached !== undefined)
    return cached

  let skip = false
  for (const key in borderRadius) {
    const cls = key === 'DEFAULT' ? 'rounded' : `rounded-${key}`
    if (BORDER_RADIUS_MAP[cls]?.['border-radius'] !== borderRadius[key]) {
      skip = true
      break
    }
  }

  skipStaticRadiusCache.set(borderRadius, skip)
  return skip
}

function resolveSkipStaticShadow(boxShadow: Record<string, string>): boolean {
  const cached = skipStaticShadowCache.get(boxShadow)
  if (cached !== undefined)
    return cached

  let skip = false
  for (const key in boxShadow) {
    const cls = key === 'DEFAULT' ? 'shadow' : `shadow-${key}`
    const entry = SHADOW_MAP[cls]
    if (entry !== undefined && entry['--tc-shadow'] !== boxShadow[key]) {
      skip = true
      break
    }
  }

  skipStaticShadowCache.set(boxShadow, skip)
  return skip
}

function resolveScreenBreakpoints(screens: Record<string, string>): Map<string, string> {
  const cached = screenBreakpointsCache.get(screens)
  if (cached)
    return cached

  const result = new Map(Object.entries(screens))
  screenBreakpointsCache.set(screens, result)
  return result
}

function resolveContainerBreakpoints(containers: Record<string, string>): Map<string, string> {
  const cached = containerBreakpointsCache.get(containers)
  if (cached)
    return cached

  const result = new Map(Object.entries(containers))
  containerBreakpointsCache.set(containers, result)
  return result
}

interface ProcessedConfig {
  config: CssConfig
  variantEnabled: Record<string, boolean>
  spacingValues: Record<string, string>
  commonColors: Record<string, string>
  skipStaticRadius: boolean
  skipStaticShadow: boolean
  screenBreakpoints: Map<string, string>
  containerBreakpoints: Map<string, string>
  blocklistRegexCache: RegExp[]
  blocklistExact: Set<string>
  extendColors: Record<string, string | Record<string, string>> | null
  hasBlocklist: boolean
  hasShortcuts: boolean
}

function processConfig(config: CssConfig): ProcessedConfig {
  const cached = processedConfigCache.get(config)
  if (cached) return cached

  // Fold presets into the config. Only preset.theme was applied before —
  // rules, shortcuts, variants, and preflights were typed and documented
  // but silently ignored. Presets apply BEFORE user config so user values
  // win on conflict.
  if (config.presets && config.presets.length > 0) {
    for (const preset of config.presets) {
      if (preset.theme) {
        config.theme = deepMerge(config.theme, preset.theme)
      }
      if (preset.rules && preset.rules.length > 0) {
        config.rules = [...preset.rules, ...config.rules]
      }
      if (preset.shortcuts) {
        config.shortcuts = { ...preset.shortcuts, ...config.shortcuts }
      }
      if (preset.variants) {
        config.variants = { ...preset.variants, ...config.variants }
      }
      if (preset.preflights && preset.preflights.length > 0) {
        config.preflights = [...preset.preflights, ...config.preflights]
      }
    }
  }

  // Save extend colors before merging
  const extendColors = config.theme.extend?.colors
    ? config.theme.extend.colors as Record<string, string | Record<string, string>>
    : null

  // Merge theme.extend into theme
  if (config.theme.extend) {
    const { extend, ...baseTheme } = config.theme
    if (extend) {
      config.theme = deepMerge(baseTheme, extend) as typeof config.theme
    }
  }

  // Pre-compile blocklist patterns
  const blocklistRegexCache: RegExp[] = []
  const blocklistExact = new Set<string>()
  for (const pattern of config.blocklist) {
    if (pattern.includes('*')) {
      blocklistRegexCache.push(new RegExp(`^${pattern.replace(/\*/g, '.*')}$`))
    }
    else {
      blocklistExact.add(pattern)
    }
  }

  // Re-base the fast-path lookup tables on the user's theme when it diverges
  // from the built-in copies (which previously shadowed theme overrides).
  // Each is memoised on the theme sub-object it derives from, so a config
  // that reuses the default theme pays nothing here.
  const spacingValues = resolveSpacingValues(config.theme.spacing)
  const commonColors = resolveCommonColors(config.theme.colors)

  // Radius/shadow static entries can't be patched cheaply (multi-property
  // outputs), so a customized theme skips the static map and lets the
  // theme-driven rule handlers resolve those classes.
  const skipStaticRadius = resolveSkipStaticRadius(config.theme.borderRadius)
  const skipStaticShadow = resolveSkipStaticShadow(config.theme.boxShadow)

  const result: ProcessedConfig = {
    config,
    variantEnabled: config.variants as unknown as Record<string, boolean>,
    spacingValues,
    commonColors,
    skipStaticRadius,
    skipStaticShadow,
    screenBreakpoints: resolveScreenBreakpoints(config.theme.screens),
    containerBreakpoints: resolveContainerBreakpoints(config.theme.containers),
    blocklistRegexCache,
    blocklistExact,
    extendColors,
    hasBlocklist: blocklistRegexCache.length > 0 || blocklistExact.size > 0,
    hasShortcuts: Object.keys(config.shortcuts).length > 0,
  }

  processedConfigCache.set(config, result)
  return result
}

/**
 * Generates CSS rules from parsed utility classes
*/
/**
 * Selector → cascade rank.
 *
 * 0 — shorthand (`m-*`, `p-*`, `border`, `rounded`, `inset-*`)
 * 1 — axis     (`mx-*`, `my-*`, `px-*`, `py-*`, `inset-x-*`, corner radii)
 * 2 — side     (`mt-*`, `mr-*`, `pt-*`, `top-*`, `border-t-*`, …)
 */
function isIdentChar(code: number): boolean {
  return (code >= 97 && code <= 122) || (code >= 65 && code <= 90)
    || (code >= 48 && code <= 57) || code === 45 || code === 95 // a-z A-Z 0-9 - _
}

/**
 * The class token a selector ranks by: the first `.`, past any escaped `!`
 * and any escaped variant prefixes, up to the end of the identifier.
 * `.md\:hover\:mx-auto` → `mx-auto`.
 *
 * Replaces /\.(?:\\!)?(?:[a-zA-Z0-9_-]*\\?:)*(?:\\!)?([a-zA-Z0-9_-]+)/, whose
 * nested unbounded quantifier backtracks super-linearly.
 */
function selectorClassToken(selector: string): string | undefined {
  let i = selector.indexOf('.')
  if (i === -1)
    return undefined
  i++

  // The escaped important marker (`.\!m-0`) must be skipped or the token comes
  // out empty and every !-utility ranked 0, letting `!m-0` emit after (and
  // defeat) `!mx-auto`.
  const skipImportant = (): void => {
    if (selector.charCodeAt(i) === 92 && selector.charCodeAt(i + 1) === 33) // \!
      i += 2
  }

  skipImportant()

  // Consume variant prefixes. Only an ESCAPED colon separates them: variant
  // prefixes live inside the class name, so their colons are escaped
  // (`.md\:hover\:m-0`), while the trailing pseudo-class colon is not
  // (`…m-0:hover`). Treating both alike made the ranker read `hover` as the
  // class of `.md\:hover\:m-0:hover` and rank every stateful utility 0, so
  // `md:hover:m-0 md:hover:mx-auto` fell back to authoring order and the
  // shorthand could reset the auto margins.
  for (;;) {
    let end = i
    while (end < selector.length && isIdentChar(selector.charCodeAt(end)))
      end++
    if (selector.charCodeAt(end) !== 92 || selector.charCodeAt(end + 1) !== 58) // \:
      break
    i = end + 2
  }

  skipImportant()

  let end = i
  while (end < selector.length && isIdentChar(selector.charCodeAt(end)))
    end++
  return end > i ? selector.slice(i, end) : undefined
}
const AXIS_UTILITY_RE = /^(?:mx|my|px|py|inset-x|inset-y|border-x|border-y|scroll-mx|scroll-my|scroll-px|scroll-py|space-x|space-y|gap-x|gap-y)-/
const AXIS_RADIUS_RE = /^rounded-[tlbr](?:-|$)/
const SIDE_UTILITY_RE = /^(?:mt|mr|mb|ml|pt|pr|pb|pl|top|right|bottom|left|border-t|border-r|border-b|border-l|scroll-mt|scroll-mr|scroll-mb|scroll-ml|scroll-pt|scroll-pr|scroll-pb|scroll-pl)-/
const SIDE_RADIUS_RE = /^rounded-(?:tl|tr|bl|br)(?:-|$)/
/**
 * `i-{collection}-{name}`, matching the shape `iconRule` itself accepts.
 *
 * Deliberately syntactic: ranking runs on a selector string and must not
 * depend on whether the icon collection is installed, or an icon and its
 * sizing utility would rank differently on a machine missing the package.
 */
const ICON_UTILITY_RE = /^i-[a-z][a-z0-9]*(?:-[a-z0-9]+)*-.+/

// Exported for tests: ranking is pure and selector-driven, and asserting it
// through generated CSS would need an @iconify-json collection installed —
// without one an icon emits nothing, `indexOf` returns -1, and an ordering
// assertion passes for the wrong reason.
export function computeUtilityRank(selector: string): number {
  const cls = selectorClassToken(selector)
  if (!cls) return 0
  // An icon utility's `width`/`height`/`display`/`background-color` are
  // DEFAULTS — `width: 1em` exists so a bare `i-lucide-check` has a size at
  // all, not to outrank the `w-5` sitting beside it in the same class list.
  // Both are single-class selectors, so specificity is tied and source order
  // decides; emitted last, the icon won and every explicit size was ignored.
  // The visible failure is an icon next to text in a flex row: it kept `1em`,
  // could not hold its width against a greedy sibling, and collapsed to a
  // few pixels. Ranking icons below every other utility restores the
  // intended precedence — the same ordering UnoCSS gets by putting its icon
  // preset in an earlier layer — and lets `text-*`, `bg-*`, and `align-*`
  // override the icon's other defaults too.
  if (ICON_UTILITY_RE.test(cls))
    return -1
  if (AXIS_UTILITY_RE.test(cls) || AXIS_RADIUS_RE.test(cls))
    return 1
  if (SIDE_UTILITY_RE.test(cls) || SIDE_RADIUS_RE.test(cls))
    return 2
  return 0
}

export class CSSGenerator {
  private rules: Map<string, CSSRule[]> = new Map()
  private classCache: Set<string> = new Set()
  private selectorCache: Map<string, string> = new Map()
  private mediaQueryCache: Map<string, string | undefined> = new Map()
  private ruleCache: Map<string, UtilityRule[]> = new Map()
  private variantEnabled: Record<string, boolean>
  private screenBreakpoints: Map<string, string>
  private containerBreakpoints: Map<string, string>
  private noMatchCache: Set<string> = new Set()
  private usedKeyframes: Set<string> = new Set()
  private variantHandledCache: Map<string, boolean> = new Map()
  private utilityRankCache: Map<string, number> = new Map()
  private compiledGenerated: Set<string> = new Set()
  private darkStrategy: 'class' | 'media'
  // Fast-path lookup tables, re-based on the user's theme when it diverges
  // from the built-in copies (which previously shadowed theme overrides).
  private spacingValues: Record<string, string>
  private commonColors: Record<string, string>
  private skipStaticRadius: boolean
  private skipStaticShadow: boolean
  // While expanding a shortcut, rules emit under the shortcut's own class
  // name (with variants applied to it: `.btn:hover`) instead of the
  // sub-utility's selector, which the markup never carries.
  private shortcutSelectorRaw: string | null = null
  private extendColors: Record<string, string | Record<string, string>> | null = null
  private processed: ProcessedConfig
  /**
   * Bumped by every mutation that can change the emitted stylesheet, so
   * `toCSS()` can tell whether its previous answer is still valid.
   */
  private revision = 0
  /**
   * Memoised `toCSS()` output. Held as separate fields rather than a composed
   * key so that a cache hit costs three comparisons and no allocation.
   */
  private cssCache: string | null = null
  private cssCacheRevision = -1
  private cssCachePreflight = false
  private cssCacheMinify = false

  constructor(private config: CssConfig) {
    this.processed = processConfig(config)
    this.variantEnabled = this.processed.variantEnabled
    this.screenBreakpoints = this.processed.screenBreakpoints
    this.containerBreakpoints = this.processed.containerBreakpoints
    this.extendColors = this.processed.extendColors
    this.darkStrategy = config.darkMode === 'media' ? 'media' : 'class'
    this.spacingValues = this.processed.spacingValues
    this.commonColors = this.processed.commonColors
    this.skipStaticRadius = this.processed.skipStaticRadius
    this.skipStaticShadow = this.processed.skipStaticShadow
  }

  /**
   * Build a prefix-based lookup map for rules
   * This allows O(1) lookup instead of O(n) iteration
  */
  private buildRuleLookup(): void {
    // Pre-processing done in constructor
    // Rule caching happens during generation
  }

  /**
   * Generate CSS for a utility class
  */
  /**
   * Generate CSS for multiple classes at once (batch API).
   * More efficient than calling generate() in a loop.
   */
  generateBatch(classNames: string[]): void {
    for (let i = 0; i < classNames.length; i++) {
      this.generate(classNames[i])
    }
  }

  /**
   * Generate CSS for a utility class
  */
  generate(className: string): void {
    // Check cache for already processed classes (fastest exit path)
    if (this.classCache.has(className)) {
      return
    }

    this.classCache.add(className)

    // Only check shortcuts/blocklist if the config has them (skip for most projects)
    if (this.processed.hasShortcuts) {
      const shortcut = this.config.shortcuts[className]
      if (shortcut) {
        this.expandShortcut(className, shortcut, new Set([className]))
        return
      }
    }

    this.generateUtility(className)
  }

  /**
   * Expand a shortcut into rules on the shortcut's own selector. Variant
   * utilities inside the definition (`hover:bg-accent-2`) become pseudo-class
   * or media-query rules on that selector (`.btn:hover`, `@media ... .btn`)
   * instead of being emitted under selectors the markup doesn't carry.
   * Nested shortcuts flatten onto the outermost selector; `seen` breaks cycles.
  */
  private expandShortcut(name: string, shortcut: string | string[], seen: Set<string>): void {
    const classes = Array.isArray(shortcut) ? shortcut : shortcut.split(/\s+/)
    const prev = this.shortcutSelectorRaw
    this.shortcutSelectorRaw = name
    for (const cls of classes) {
      if (!cls)
        continue
      const nested = this.config.shortcuts[cls]
      if (nested) {
        if (!seen.has(cls)) {
          seen.add(cls)
          this.expandShortcut(name, nested, seen)
        }
        continue
      }
      this.generateUtility(cls)
    }
    this.shortcutSelectorRaw = prev
  }

  /**
   * Generate rules for a compiled class group (compile-class transformer):
   * every utility in the group emits under the compiled class's own
   * selector, exactly like a shortcut. Without this the transformer
   * rewrote markup to `class="tc-<hash>"` while the CSS only contained the
   * original utility selectors — the compiled class had no styles at all.
  */
  generateCompiledClass(className: string, utilities: string[]): void {
    // Own idempotency guard: the hashed class name usually ALSO reaches the
    // regular generate() path (the scanner extracts it from the transformed
    // markup), which emits nothing but claims the classCache slot — an
    // early-return on classCache here would skip the real expansion.
    if (this.compiledGenerated.has(className)) {
      return
    }
    this.compiledGenerated.add(className)
    this.classCache.add(className)
    this.expandShortcut(className, utilities, new Set([className]))
  }

  /**
   * Generate rules for a single utility class (no cache or shortcut handling)
  */
  private generateUtility(className: string): void {
    if (this.processed.hasBlocklist) {
      if (this.processed.blocklistExact.has(className)) {
        return
      }
      const regexes = this.processed.blocklistRegexCache
      for (let i = 0; i < regexes.length; i++) {
        if (regexes[i].test(className)) {
          return
        }
      }
    }

    const parsed = parseClass(className)

    // ==========================================================================
    // FAST PATH: Static utility map lookup (O(1))
    // Handles ~80% of common utilities without any rule iteration
    // ==========================================================================

    // Check static raw class map first (display, flex-direction, transform,
    // transition, etc.). The lookup must use the variant/important-stripped
    // base class: keying on parsed.raw made every static-map-only utility
    // (underline, italic, truncate, sr-only, transition, ...) emit NOTHING
    // under any variant — hover:underline generated no CSS at all.
    const baseRaw = parsed.base
    let staticResult = STATIC_UTILITY_MAP[baseRaw]
    if (staticResult && (
      (this.skipStaticRadius && baseRaw.startsWith('rounded'))
      || (this.skipStaticShadow && (baseRaw === 'shadow' || baseRaw.startsWith('shadow-')))
    )) {
      staticResult = undefined as unknown as Record<string, string>
    }
    if (staticResult) {
      this.addRule(parsed, staticResult)
      // Track animation keyframe usage
      if (staticResult.animation) {
        const animName = staticResult.animation.split(' ')[0]
        if (animName && animName !== 'none') {
          this.usedKeyframes.add(animName)
          this.revision++
        }
      }
      return
    }

    // Fast path for utility-based lookups
    const utility = parsed.utility
    const value = parsed.value

    // ==========================================================================
    // SPACING UTILITIES - Most common, use pre-computed values
    // ==========================================================================

    // Width: w-{size}
    if (utility === 'w' && value) {
      // Try SIZE_VALUES first, then spacing config, then use raw value (for arbitrary values like calc())
      const sizeVal = SIZE_VALUES[value] || this.config.theme.spacing[value]
      if (sizeVal) {
        this.addRule(parsed, { width: sizeVal })
        return
      }
      // Handle arbitrary values (calc, min, max, clamp, etc.)
      if (parsed.arbitrary) {
        // Check if it's a fraction in arbitrary syntax: w-[1/2] or w-[100/100]
        const fractionMatch = value.match(/^(\d+)\/(\d+)$/)
        if (fractionMatch) {
          const num = Number(fractionMatch[1])
          const denom = Number(fractionMatch[2])
          if (!Number.isNaN(num) && !Number.isNaN(denom) && denom !== 0) {
            this.addRule(parsed, { width: fractionToPercent(num, denom)! })
            return
          }
        }
        this.addRule(parsed, { width: value })
        return
      }
    }

    // Height: h-{size}
    if (utility === 'h' && value) {
      // Try SIZE_VALUES first, then spacing config, then use raw value (for arbitrary values like calc())
      const sizeVal = SIZE_VALUES[value] || this.config.theme.spacing[value]
      if (sizeVal) {
        this.addRule(parsed, { height: value === 'screen' ? '100vh' : sizeVal })
        return
      }
      // Handle arbitrary values (calc, min, max, clamp, etc.)
      if (parsed.arbitrary) {
        // Check if it's a fraction in arbitrary syntax: h-[1/2] or h-[100/100]
        const fractionMatch = value.match(/^(\d+)\/(\d+)$/)
        if (fractionMatch) {
          const num = Number(fractionMatch[1])
          const denom = Number(fractionMatch[2])
          if (!Number.isNaN(num) && !Number.isNaN(denom) && denom !== 0) {
            this.addRule(parsed, { height: fractionToPercent(num, denom)! })
            return
          }
        }
        this.addRule(parsed, { height: value })
        return
      }
    }

    // Padding: p-{size}
    if (utility === 'p' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { padding: spacingVal })
        return
      }
    }

    // Padding X: px-{size}
    if (utility === 'px' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { 'padding-left': spacingVal, 'padding-right': spacingVal })
        return
      }
    }

    // Padding Y: py-{size}
    if (utility === 'py' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { 'padding-top': spacingVal, 'padding-bottom': spacingVal })
        return
      }
    }

    // Padding sides: pt, pr, pb, pl
    if ((utility === 'pt' || utility === 'pr' || utility === 'pb' || utility === 'pl') && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        const propMap: Record<string, string> = { pt: 'padding-top', pr: 'padding-right', pb: 'padding-bottom', pl: 'padding-left' }
        this.addRule(parsed, { [propMap[utility]]: spacingVal })
        return
      }
    }

    // Margin: m-{size}
    if (utility === 'm' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { margin: spacingVal })
        return
      }
    }

    // Margin X: mx-{size}
    if (utility === 'mx' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { 'margin-left': spacingVal, 'margin-right': spacingVal })
        return
      }
    }

    // Margin Y: my-{size}
    if (utility === 'my' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { 'margin-top': spacingVal, 'margin-bottom': spacingVal })
        return
      }
    }

    // Margin sides: mt, mr, mb, ml
    if ((utility === 'mt' || utility === 'mr' || utility === 'mb' || utility === 'ml') && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        const propMap: Record<string, string> = { mt: 'margin-top', mr: 'margin-right', mb: 'margin-bottom', ml: 'margin-left' }
        this.addRule(parsed, { [propMap[utility]]: spacingVal })
        return
      }
    }

    // Position: top, right, bottom, left
    if ((utility === 'top' || utility === 'right' || utility === 'bottom' || utility === 'left') && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { [utility]: spacingVal })
        return
      }
    }

    // Inset: inset-{size}
    if (utility === 'inset' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { top: spacingVal, right: spacingVal, bottom: spacingVal, left: spacingVal })
        return
      }
    }

    // Inset X/Y: inset-x-{size}, inset-y-{size}
    if (utility === 'inset-x' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { left: spacingVal, right: spacingVal })
        return
      }
    }
    if (utility === 'inset-y' && value) {
      const spacingVal = this.spacingValues[value]
      if (spacingVal) {
        this.addRule(parsed, { top: spacingVal, bottom: spacingVal })
        return
      }
    }

    // ==========================================================================
    // COLOR UTILITIES - Fast path using pre-computed color map
    // ==========================================================================

    // Background color: bg-{color}-{shade}
    if (utility === 'bg' && value) {
      const colorVal = this.commonColors[value]
      if (colorVal) {
        this.addRule(parsed, { 'background-color': colorVal })
        return
      }
    }

    // Text color: text-{color}-{shade}
    if (utility === 'text' && value) {
      const colorVal = this.commonColors[value]
      if (colorVal) {
        this.addRule(parsed, { color: colorVal })
        return
      }
    }

    // Border color: border-{color}-{shade}
    if (utility === 'border' && value) {
      const colorVal = this.commonColors[value]
      if (colorVal) {
        this.addRule(parsed, { 'border-color': colorVal })
        return
      }
    }

    // Justify content: justify-{start|end|center|between|around|evenly}
    if (utility === 'justify' && value) {
      const justifyValue = JUSTIFY_CONTENT_VALUES[value]
      if (justifyValue) {
        this.addRule(parsed, { 'justify-content': justifyValue })
        return
      }
    }

    // Align items: items-{start|end|center|baseline|stretch}
    if (utility === 'items' && value) {
      const itemsValue = ALIGN_ITEMS_VALUES[value]
      if (itemsValue) {
        this.addRule(parsed, { 'align-items': itemsValue })
        return
      }
    }

    // Align content: content-{normal|center|start|end|between|around|evenly|baseline|stretch}
    // Also handles CSS content property for arbitrary values: content-['hello'], content-[attr(data-label)]
    if (utility === 'content' && value) {
      const contentValue = ALIGN_CONTENT_VALUES[value]
      if (contentValue) {
        this.addRule(parsed, { 'align-content': contentValue })
        return
      }
      // Arbitrary content property: content-['hello'], content-[attr(data-label)]
      if (parsed.arbitrary) {
        this.addRule(parsed, { content: value })
        return
      }
    }

    // Align self: self-{auto|start|end|center|stretch|baseline}
    if (utility === 'self' && value) {
      const selfValue = ALIGN_SELF_VALUES[value]
      if (selfValue) {
        this.addRule(parsed, { 'align-self': selfValue })
        return
      }
    }

    // Grid columns: grid-cols-{1-12|none|subgrid}
    if (utility === 'grid-cols' && value) {
      const colsValue = GRID_COLS_VALUES[value]
      if (colsValue) {
        this.addRule(parsed, { 'grid-template-columns': colsValue })
        return
      }
    }

    // Grid rows: grid-rows-{1-6|none|subgrid}
    if (utility === 'grid-rows' && value) {
      const rowsValue = GRID_ROWS_VALUES[value]
      if (rowsValue) {
        this.addRule(parsed, { 'grid-template-rows': rowsValue })
        return
      }
    }

    // Grid column span: col-{auto|span-1..12|span-full}
    if (utility === 'col' && value) {
      const colValue = GRID_COL_VALUES[value]
      if (colValue) {
        this.addRule(parsed, { 'grid-column': colValue })
        return
      }
    }

    // Grid row span: row-{auto|span-1..6|span-full}
    if (utility === 'row' && value) {
      const rowValue = GRID_ROW_VALUES[value]
      if (rowValue) {
        this.addRule(parsed, { 'grid-row': rowValue })
        return
      }
    }

    // Grid auto flow: grid-flow-{row|col|dense|row-dense|col-dense}
    if (utility === 'grid-flow' && value) {
      const flowValue = GRID_FLOW_VALUES[value]
      if (flowValue) {
        this.addRule(parsed, { 'grid-auto-flow': flowValue })
        return
      }
    }

    // Auto cols: auto-cols-{auto|min|max|fr}
    if (utility === 'auto-cols' && value) {
      const autoColsValue = AUTO_COLS_ROWS_VALUES[value]
      if (autoColsValue) {
        this.addRule(parsed, { 'grid-auto-columns': autoColsValue })
        return
      }
    }

    // Auto rows: auto-rows-{auto|min|max|fr}
    if (utility === 'auto-rows' && value) {
      const autoRowsValue = AUTO_COLS_ROWS_VALUES[value]
      if (autoRowsValue) {
        this.addRule(parsed, { 'grid-auto-rows': autoRowsValue })
        return
      }
    }

    // Transform origin: origin-{center|top|top-right|...}
    if (utility === 'origin' && value) {
      const originValue = TRANSFORM_ORIGIN_VALUES[value]
      if (originValue) {
        this.addRule(parsed, { 'transform-origin': originValue })
        return
      }
    }

    // Scale: scale-{0-150} -> transform: scale(value/100)
    if (utility === 'scale' && value && !parsed.arbitrary) {
      const scaleNum = Number(value) / 100
      if (!Number.isNaN(scaleNum)) {
        this.addRule(parsed, { transform: `scale(${scaleNum})` })
        return
      }
    }
    if (utility === 'scale-x' && value && !parsed.arbitrary) {
      const scaleNum = Number(value) / 100
      if (!Number.isNaN(scaleNum)) {
        this.addRule(parsed, { transform: `scaleX(${scaleNum})` })
        return
      }
    }
    if (utility === 'scale-y' && value && !parsed.arbitrary) {
      const scaleNum = Number(value) / 100
      if (!Number.isNaN(scaleNum)) {
        this.addRule(parsed, { transform: `scaleY(${scaleNum})` })
        return
      }
    }

    // Rotate: rotate-{0-180} -> transform: rotate(Ndeg)
    // Bare numbers only; explicit units, arbitrary values, and word
    // rejection fall through to the rotate rule handler.
    if (utility === 'rotate' && value && !parsed.arbitrary && /^-?\d+(?:\.\d+)?$/.test(value)) {
      this.addRule(parsed, { transform: `rotate(${value}deg)` })
      return
    }

    // Duration: duration-{75|100|150|200|300|500|700|1000}
    // Fast path handles bare numbers only; presets (duration-0 -> 0s),
    // arbitrary values (duration-[2s] must stay 2s, not 2sms), and word
    // rejection are the rule handler's job.
    if (utility === 'duration' && value && value !== '0' && !parsed.arbitrary && /^\d+(?:\.\d+)?$/.test(value)) {
      this.addRule(parsed, { 'transition-duration': `${value}ms` })
      return
    }

    // Delay: delay-{75|100|150|200|300|500|700|1000}
    if (utility === 'delay' && value && value !== '0' && !parsed.arbitrary && /^\d+(?:\.\d+)?$/.test(value)) {
      this.addRule(parsed, { 'transition-delay': `${value}ms` })
      return
    }

    // Gap: gap-{spacing}. Uses the same v4-style decimal fallback as the
    // shared spacing resolver — `gap-4.5` → `1.125rem` instead of
    // the invalid `gap: 4.5;` the pre-fix path emitted. Arbitrary values
    // pass through; unknown words emit nothing (`gap-foo` leaked verbatim).
    const resolveGap = (v: string): string | undefined => {
      const hit = this.config.theme.spacing[v]
      if (hit !== undefined) return hit
      if (parsed.arbitrary) return v
      if (/^\d+(?:\.\d+)?$/.test(v)) {
        const n = Number.parseFloat(v)
        if (Number.isFinite(n)) return `${n * 0.25}rem`
      }
      return undefined
    }
    if (utility === 'gap' && value) {
      const gap = resolveGap(value)
      if (gap !== undefined) this.addRule(parsed, { gap })
      return
    }
    if (utility === 'gap-x' && value) {
      const gap = resolveGap(value)
      if (gap !== undefined) this.addRule(parsed, { 'column-gap': gap })
      return
    }
    if (utility === 'gap-y' && value) {
      const gap = resolveGap(value)
      if (gap !== undefined) this.addRule(parsed, { 'row-gap': gap })
      return
    }

    // Place content/items/self
    if (utility === 'place' && value) {
      if (value.startsWith('content-')) {
        const placeValue = PLACE_CONTENT_VALUES[value.slice(8)]
        if (placeValue) {
          this.addRule(parsed, { 'place-content': placeValue })
          return
        }
      }
      if (value.startsWith('items-')) {
        const placeValue = PLACE_CONTENT_VALUES[value.slice(6)]
        if (placeValue) {
          this.addRule(parsed, { 'place-items': placeValue })
          return
        }
      }
      if (value.startsWith('self-')) {
        const placeValue = PLACE_CONTENT_VALUES[value.slice(5)]
        if (placeValue) {
          this.addRule(parsed, { 'place-self': placeValue })
          return
        }
      }
    }

    // ==========================================================================
    // SLOW PATH: Rule iteration (only if fast path didn't match)
    // ==========================================================================

    // Check no-match cache - if this utility+value combo was already determined to not match
    // any rule, skip the expensive rule iteration (especially helpful for variant classes)
    const utilityKey = `${parsed.utility}:${parsed.value || ''}`
    if (this.noMatchCache.has(utilityKey)) {
      return
    }

    // Try custom rules from config first (allows overriding built-in rules)
    if (this.config.rules.length > 0) {
      for (const [pattern, handler] of this.config.rules) {
        const match = className.match(pattern)
        if (match) {
          const properties = handler(match)
          if (properties) {
            this.addRule(parsed, properties)
            return
          }
        }
      }
    }

    // Try built-in rules with optimized iteration
    const rulesLength = builtInRules.length
    for (let i = 0; i < rulesLength; i++) {
      const result = builtInRules[i](parsed, this.config)
      if (result) {
        // Handle both old format (just properties) and new format (object with properties and childSelector/pseudoElement)
        if ('properties' in result && typeof result.properties === 'object') {
          this.addRule(parsed, result.properties, result.childSelector, result.pseudoElement, (result as UtilityRuleResult).defaults)
        }
        else {
          this.addRule(parsed, result as Record<string, string>)
        }
        return
      }
    }

    // No rule matched - cache this utility+value combo to skip future iterations
    this.noMatchCache.add(utilityKey)
  }

  /**
   * Add a CSS rule with variants applied
  */
  /**
   * A variant the generator has no handler for must drop the whole rule.
   * Previously an unknown variant was silently ignored, so a typo like
   * `hoveer:flex` emitted `.hoveer\:flex { display: flex; }` — an
   * always-on rule instead of nothing.
  */
  private isVariantHandled(variant: string): boolean {
    const cached = this.variantHandledCache.get(variant)
    if (cached !== undefined)
      return cached
    const known
      = VARIANT_SELECTORS[variant] !== undefined
        || PREFIX_VARIANTS[variant] !== undefined
        || DIRECTION_VARIANTS[variant] !== undefined
        || (variant.startsWith('not-') && this.isNegationResolvable(variant.slice(4)))
        || this.screenBreakpoints.has(variant)
        || (variant.startsWith('max-') && this.screenBreakpoints.has(variant.slice(4)))
        || (variant.charCodeAt(0) === 64 && this.containerQuery(variant.slice(1)) !== undefined)
        || variant === '*' || variant === '**'
        || nthVariantSelector(variant) !== undefined
        || (variant.startsWith('in-') && ancestorConditionSelector(variant.slice(3)) !== undefined)
        || variant.startsWith('group-') || variant.startsWith('group/')
        || variant.startsWith('peer-') || variant.startsWith('peer/')
        || variant.startsWith('has-') || variant.startsWith('aria-') || variant.startsWith('data-')
        || variant.startsWith('supports-')
        || (variant.startsWith('[') && variant.endsWith(']'))
        || MEDIA_FEATURE_VARIANTS[variant] !== undefined
        || variant === 'starting'
        || ['print', 'motion-safe', 'motion-reduce', 'contrast-more', 'contrast-less', 'landscape', 'portrait', 'forced-colors'].includes(variant)
    this.variantHandledCache.set(variant, known)
    return known
  }

  /**
   * Resolve a container-query variant to its at-rule prelude.
   *
   * Range syntax (`width >= 24rem`) rather than `min-width`, matching
   * Tailwind. That is safe here in a way it would not be for media queries:
   * anything that understands `@container` at all also understands range
   * syntax, and it avoids the off-by-0.02px fudge the `max-*` media variant
   * needs to express an exclusive bound.
   */
  private containerQuery(token: string): string | undefined {
    if (!token)
      return undefined

    const { size, name } = splitContainerName(token)
    if (!size || (name !== undefined && !name))
      return undefined

    let bound = size
    let inclusive = true
    if (size.startsWith('max-')) {
      bound = size.slice(4)
      inclusive = false
    }
    else if (size.startsWith('min-')) {
      bound = size.slice(4)
    }

    let length: string | undefined
    if (bound.charCodeAt(0) === 91 && bound.charCodeAt(bound.length - 1) === 93) {
      const inner = bound.slice(1, -1).replace(/_/g, ' ').trim()
      length = inner || undefined
    }
    else {
      length = this.containerBreakpoints.get(bound)
    }
    if (length === undefined)
      return undefined

    const condition = inclusive ? `(width >= ${length})` : `(width < ${length})`
    return name === undefined ? `@container ${condition}` : `@container ${name} ${condition}`
  }

  /**
   * The at-rule condition a variant contributes, for `not-*` to negate.
   *
   * Breakpoints and the media-strategy dark mode are instance state, which is
   * why this is a method rather than a table.
   */
  private negatableAtRule(token: string): { media?: string, supports?: string } | undefined {
    if (!token)
      return undefined

    const preference = PREFERENCE_MEDIA_VARIANTS[token]
    if (preference !== undefined)
      return { media: preference }

    const feature = MEDIA_FEATURE_VARIANTS[token]
    if (feature !== undefined)
      return { media: feature }

    const breakpoint = this.screenBreakpoints.get(token)
    if (breakpoint !== undefined)
      return { media: `(min-width: ${breakpoint})` }

    if (this.darkStrategy === 'media' && (token === 'dark' || token === 'light'))
      return { media: `(prefers-color-scheme: ${token})` }

    if (token.startsWith('supports-')) {
      const value = token.slice(9)
      return value ? { supports: supportsCondition(value) } : undefined
    }

    return undefined
  }

  /**
   * Whether `not-<token>` resolves to anything at all. A negation we cannot
   * resolve has to drop the rule: emitting `.not-bogus\:flex` unconditionally
   * would turn a typo into an always-on utility.
   */
  private isNegationResolvable(token: string): boolean {
    return negatableVariantSelector(token) !== undefined
      || this.negatableAtRule(token) !== undefined
  }

  private addRule(parsed: ParsedClass, properties: Record<string, string>, childSelector?: string, pseudoElement?: string, defaults?: boolean): void {
    for (let i = 0; i < parsed.variants.length; i++) {
      if (!this.isVariantHandled(parsed.variants[i]))
        return
    }
    // Use cached selector if available. Shortcut expansion changes the base
    // selector for the same parsed class, so it needs its own cache slot.
    //
    // The plain case — no shortcut, no child selector, no pseudo-element — is
    // the overwhelming majority and its key is exactly `parsed.raw`, so it
    // skips building an identical string.
    const cacheKey = this.shortcutSelectorRaw === null
      ? (childSelector === undefined && pseudoElement === undefined
          ? parsed.raw
          : `${parsed.raw}${childSelector || ''}${pseudoElement || ''}`)
      : `${this.shortcutSelectorRaw}>${parsed.raw}${childSelector || ''}${pseudoElement || ''}`
    let selector = this.selectorCache.get(cacheKey)
    if (!selector) {
      selector = this.buildSelector(parsed)
      // Append pseudo-element directly (no space)
      if (pseudoElement) {
        selector += pseudoElement
      }
      // Append child selector if provided
      if (childSelector) {
        selector += ` ${childSelector}`
      }
      // A rule of defaults (an icon's 1em box) at zero specificity: pages
      // ship their own stylesheets, and one arriving later re-declared
      // `.i-lucide-bell { width: 1em }` after `.w-5`, shrinking every sized
      // icon on the page. A pseudo-element cannot sit inside :where().
      if (defaults && !selector.includes('::'))
        selector = `:where(${selector})`
      this.selectorCache.set(cacheKey, selector)
    }

    const mediaQuery = this.getMediaQuery(parsed)

    // Apply !important modifier. Build a fresh object — `properties` is
    // often a shared reference (static utility maps, memoized custom-rule
    // results), and mutating it in place poisoned every later use of the
    // same object with stacking ' !important' suffixes.
    if (parsed.important) {
      const flagged: Record<string, string> = {}
      for (const key in properties) {
        flagged[key] = `${properties[key]} !important`
      }
      properties = flagged
    }

    const key = mediaQuery || 'base'
    if (!this.rules.has(key)) {
      this.rules.set(key, [])
    }

    this.revision++
    this.rules.get(key)!.push({
      selector,
      properties,
      mediaQuery,
      childSelector,
    })
  }

  /**
   * Build CSS selector with pseudo-classes and variants
   * Optimized with pre-computed lookup maps for O(1) variant resolution
  */
  private buildSelector(parsed: ParsedClass): string {
    let selector = `.${this.escapeSelector(this.shortcutSelectorRaw ?? parsed.raw)}`
    let prefix = ''

    const variants = parsed.variants
    const variantsLen = variants.length

    // Fast path: no variants
    if (variantsLen === 0) {
      return selector
    }

    // Apply variants using pre-computed maps
    for (let i = 0; i < variantsLen; i++) {
      const variant = variants[i]

      // Arbitrary selector variants: [&>li]:, [&_p]:, [&:hover]: — the &
      // stands for the selector built so far. Underscores become spaces
      // (descendant combinators). [@media...] is handled by getMediaQuery.
      if (variant.charCodeAt(0) === 91 && variant.charCodeAt(variant.length - 1) === 93) {
        const inner = variant.slice(1, -1).replace(/_/g, ' ')
        if (inner.includes('&')) {
          selector = inner.replace(/&/g, selector)
        }
        continue
      }

      // Child (`*:`) and descendant (`**:`) variants style an element's
      // children rather than the element itself, so they wrap the selector
      // built so far instead of appending to it. The `:is()` wrapper is what
      // keeps specificity at the class's own (0,1,0) — `:is()` takes the
      // specificity of its most specific argument — so `*:p-2` does not
      // outrank a `p-4` set directly on the child.
      if (variant === '*' || variant === '**') {
        if (this.variantEnabled[variant]) {
          selector = variant === '*'
            ? `:is(${selector} > *)`
            : `:is(${selector} *)`
        }
        continue
      }

      // Try suffix selector lookup first (most common case)
      const suffixSelector = VARIANT_SELECTORS[variant]
      if (suffixSelector !== undefined) {
        // Check if variant is enabled
        if (this.variantEnabled[variant]) {
          selector += suffixSelector
        }
        continue
      }

      // Direction variants attach to the selector itself, so that an element
      // with `dir` set matches its own rtl:/ltr: utilities. A pseudo-element
      // has to stay last in a selector, so splice in ahead of one if the
      // variants seen so far already appended it (`before:rtl:...`).
      const directionSelector = DIRECTION_VARIANTS[variant]
      if (directionSelector !== undefined) {
        if (this.variantEnabled[variant]) {
          const pseudoElementAt = selector.indexOf('::')
          selector = pseudoElementAt === -1
            ? selector + directionSelector
            : selector.slice(0, pseudoElementAt) + directionSelector + selector.slice(pseudoElementAt)
        }
        continue
      }

      // Try prefix selector lookup (dark, light)
      const prefixSelector = PREFIX_VARIANTS[variant]
      if (prefixSelector !== undefined) {
        // Under darkMode: 'media', dark:/light: scope via a
        // prefers-color-scheme query (getMediaQuery), not a class prefix.
        if (this.darkStrategy === 'media' && (variant === 'dark' || variant === 'light')) {
          continue
        }
        if (this.variantEnabled[variant]) {
          prefix = prefixSelector
        }
        continue
      }

      // not-* negates whatever the inner variant matches. A not-* whose
      // inner variant contributes an at-rule instead (not-print, not-md)
      // resolves to no selector here and is handled by getMediaQuery.
      if (variant.charCodeAt(0) === 110 && variant.startsWith('not-')) { // 'n' = 110
        if (this.variantEnabled.not) {
          const inner = negatableVariantSelector(variant.slice(4))
          if (inner !== undefined)
            selector += `:not(${inner})`
        }
        continue
      }

      // nth-* variants: nth-3, nth-[2n+1], nth-last-3, nth-of-type-3,
      // nth-last-of-type-2. An unresolvable argument returns undefined and
      // the rule is already dropped by isVariantHandled, so there is nothing
      // to fall back to here.
      if (variant.charCodeAt(0) === 110 && variant.startsWith('nth-')) { // 'n' = 110
        const nthSelector = nthVariantSelector(variant)
        if (nthSelector !== undefined)
          selector += nthSelector
        continue
      }

      // `in-*`: style this element when an ANCESTOR matches, with no group
      // class required. The condition wraps in :where() so it contributes no
      // specificity — an in-focus:underline must not outrank a plain
      // underline the way a descendant selector would.
      if (variant.charCodeAt(0) === 105 && variant.startsWith('in-')) { // 'i' = 105
        if (this.variantEnabled.in) {
          const condition = ancestorConditionSelector(variant.slice(3))
          if (condition !== undefined)
            prefix = `:where(${condition}) `
        }
        continue
      }

      // Handle group-* variants (with optional named group: group/name-hover)
      if (variant.charCodeAt(0) === 103 && variant.startsWith('group-')) { // 'g' = 103
        if (this.variantEnabled.group) {
          const groupVariant = variant.slice(6)
          // group-has-* needs special handling: group-has-[:checked] -> .group:has(:checked)
          if (groupVariant.startsWith('has-')) {
            const hasValue = groupVariant.slice(4)
            if (hasValue.charCodeAt(0) === 91 && hasValue.charCodeAt(hasValue.length - 1) === 93) {
              prefix = `.group:has(${hasValue.slice(1, -1)}) `
            }
            else {
              prefix = `.group:has(:${hasValue}) `
            }
          }
          else {
            prefix = `.group:${groupVariant} `
          }
        }
        continue
      }
      // Named group: group/name (for nested groups)
      if (variant.charCodeAt(0) === 103 && variant.startsWith('group/')) { // 'g' = 103
        if (this.variantEnabled.group) {
          const groupName = variant.slice(6)
          prefix = `.group\\/${groupName} `
        }
        continue
      }

      // Handle peer-* variants (with optional named peer)
      if (variant.charCodeAt(0) === 112 && variant.startsWith('peer-')) { // 'p' = 112
        if (this.variantEnabled.peer) {
          const peerVariant = variant.slice(5)
          // peer-has-* needs special handling: peer-has-[:checked] -> .peer:has(:checked) ~
          if (peerVariant.startsWith('has-')) {
            const hasValue = peerVariant.slice(4)
            if (hasValue.charCodeAt(0) === 91 && hasValue.charCodeAt(hasValue.length - 1) === 93) {
              prefix = `.peer:has(${hasValue.slice(1, -1)}) ~ `
            }
            else {
              prefix = `.peer:has(:${hasValue}) ~ `
            }
          }
          else {
            prefix = `.peer:${peerVariant} ~ `
          }
        }
        continue
      }
      // Named peer: peer/name
      if (variant.charCodeAt(0) === 112 && variant.startsWith('peer/')) { // 'p' = 112
        if (this.variantEnabled.peer) {
          const peerName = variant.slice(5)
          prefix = `.peer\\/${peerName} ~ `
        }
        continue
      }

      // Handle has-* variants: has-[input:checked], has-[:focus]
      if (variant.charCodeAt(0) === 104 && variant.startsWith('has-')) { // 'h' = 104
        if (this.variantEnabled.has) {
          const hasValue = variant.slice(4)
          // Arbitrary value: has-[selector]
          if (hasValue.charCodeAt(0) === 91 && hasValue.charCodeAt(hasValue.length - 1) === 93) {
            const inner = hasValue.slice(1, -1)
            selector += `:has(${inner})`
          }
          else {
            // Named pseudo: has-checked -> :has(:checked)
            selector += `:has(:${hasValue})`
          }
        }
        continue
      }

      // Handle aria-* variants: aria-disabled, aria-[sort=ascending]
      if (variant.charCodeAt(0) === 97 && variant.startsWith('aria-')) { // 'a' = 97
        if (this.variantEnabled.aria) {
          const ariaValue = variant.slice(5)
          // Arbitrary value: aria-[sort=ascending]
          if (ariaValue.charCodeAt(0) === 91 && ariaValue.charCodeAt(ariaValue.length - 1) === 93) {
            const inner = ariaValue.slice(1, -1)
            selector += `[aria-${inner}]`
          }
          else {
            // Boolean attribute: aria-disabled -> [aria-disabled="true"]
            selector += `[aria-${ariaValue}="true"]`
          }
        }
        continue
      }

      // Handle data-* variants: data-[state=active], data-loading
      if (variant.charCodeAt(0) === 100 && variant.startsWith('data-')) { // 'd' = 100
        if (this.variantEnabled.data) {
          const dataValue = variant.slice(5)
          // Arbitrary value: data-[state=active]
          if (dataValue.charCodeAt(0) === 91 && dataValue.charCodeAt(dataValue.length - 1) === 93) {
            const inner = dataValue.slice(1, -1)
            selector += `[data-${inner}]`
          }
          else {
            // Boolean attribute: data-loading -> [data-loading]
            selector += `[data-${dataValue}]`
          }
        }
        continue
      }
    }

    return prefix + selector
  }

  /**
   * Get media query for responsive and media variants
   * Optimized with pre-cached lookups and early returns
  */
  private getMediaQuery(parsed: ParsedClass): string | undefined {
    const variants = parsed.variants
    const variantsLen = variants.length

    // Fast path: no variants
    if (variantsLen === 0) {
      return undefined
    }

    // Use cached media query if available. A single variant is the common
    // case by a wide margin, and `join` on a one-element array still
    // allocates a string that is byte-identical to the element itself.
    const cacheKey = variantsLen === 1 ? variants[0] : variants.join(':')
    const cached = this.mediaQueryCache.get(cacheKey)
    if (cached !== undefined) {
      return cached || undefined // Convert empty string to undefined
    }

    // Collect at-rule conditions — media, @supports, and @container variants
    // can all stack on one class. They can't share a single prelude, so each
    // family collects separately and toCSS nests the resulting at-rules.
    // (Previously supports-*/@sm returned early, silently DROPPING any other
    // stacked condition: md:supports-[display:grid]:flex applied at every
    // width.)
    const mediaConditions: string[] = []
    const supportsQueries: string[] = []
    const containerQueries: string[] = []
    // @starting-style takes no condition, so it is a flag rather than a list.
    let startingStyle = false

    for (let i = 0; i < variantsLen; i++) {
      const variant = variants[i]
      const firstChar = variant.charCodeAt(0)

      // Arbitrary media variants: [@media(min-width:900px)]: — the inner
      // @media condition joins the collected media conditions.
      if (firstChar === 91 && variant.startsWith('[@media') && variant.endsWith(']')) {
        const condition = variant.slice(1, -1).replace(/_/g, ' ').slice('@media'.length).trim()
        if (condition)
          mediaConditions.push(condition)
        continue
      }

      // Container queries - '@' = 64. The grammar is
      //   @<size> | @min-<size> | @max-<size>, each optionally /<name>
      // where <size> is a key of theme.containers or an arbitrary [length].
      if (firstChar === 64) {
        const query = this.containerQuery(variant.slice(1))
        if (query !== undefined)
          containerQueries.push(query)
        continue
      }

      // not-* over an at-rule variant negates the condition rather than the
      // selector: not-md applies at every width BELOW md, not-print
      // everywhere but print, not-supports-[…] where the feature is absent.
      if (firstChar === 110 && variant.startsWith('not-')) { // 'n' = 110
        if (this.variantEnabled.not) {
          const negated = this.negatableAtRule(variant.slice(4))
          if (negated !== undefined) {
            if (negated.supports !== undefined)
              supportsQueries.push(`@supports not ${negated.supports}`)
            else
              mediaConditions.push(`not ${negated.media}`)
          }
        }
        continue
      }

      // dark:/light: under the media strategy become color-scheme queries
      // instead of class prefixes.
      if (this.darkStrategy === 'media' && (variant === 'dark' || variant === 'light')) {
        mediaConditions.push(`(prefers-color-scheme: ${variant})`)
        continue
      }

      // Responsive breakpoints - check if variant is a screen breakpoint
      if (this.variantEnabled.responsive) {
        const breakpoint = this.screenBreakpoints.get(variant)
        if (breakpoint) {
          mediaConditions.push(`(min-width: ${breakpoint})`)
          continue
        }
        // max-* variants: max-md applies BELOW the md breakpoint. Without
        // this branch the variant was ignored and the utility applied at
        // every width — the opposite of the author's intent.
        if (variant.startsWith('max-')) {
          const maxBreakpoint = this.screenBreakpoints.get(variant.slice(4))
          if (maxBreakpoint) {
            const px = maxBreakpoint.match(/^([\d.]+)px$/)
            mediaConditions.push(px
              ? `(max-width: ${Number.parseFloat(px[1]) - 0.02}px)`
              : `not all and (min-width: ${maxBreakpoint})`)
            continue
          }
        }
      }

      // `starting:` wraps the rule in @starting-style, which declares the
      // values a property animates FROM the first time the element is
      // rendered. It carries no condition of its own.
      if (variant === 'starting') {
        if (this.variantEnabled.starting)
          startingStyle = true
        continue
      }

      // Media-feature variants with a fixed condition (pointer-*,
      // any-pointer-*, inverted-colors, noscript).
      const mediaFeature = MEDIA_FEATURE_VARIANTS[variant]
      if (mediaFeature !== undefined) {
        if (this.variantEnabled[variant])
          mediaConditions.push(mediaFeature)
        continue
      }

      // Media preference variants
      const preference = PREFERENCE_MEDIA_VARIANTS[variant]
      if (preference !== undefined) {
        if (this.variantEnabled[variant])
          mediaConditions.push(preference)
        continue
      }

      // Handle supports-* variant: supports-[display:grid] -> @supports (display: grid)
      if (variant.charCodeAt(0) === 115 && variant.startsWith('supports-')) { // 's' = 115
        if (this.variantEnabled.supports)
          supportsQueries.push(`@supports ${supportsCondition(variant.slice(9))}`)
      }
    }

    const wrappers: string[] = []
    if (mediaConditions.length > 0) {
      // Combine conditions: @media (min-width: 1024px) and (orientation: landscape).
      // Media TYPES (print) must precede feature conditions — authoring order
      // `md:print:` previously emitted the invalid `(min-width: 768px) and print`,
      // which browsers drop wholesale.
      mediaConditions.sort((a, b) => Number(a.charCodeAt(0) === 40) - Number(b.charCodeAt(0) === 40)) // '('
      wrappers.push(`@media ${mediaConditions.join(' and ')}`)
    }
    wrappers.push(...supportsQueries, ...containerQueries)
    // Innermost, so `md:starting:` nests as @media { @starting-style { … } }
    // and not the other way around.
    if (startingStyle)
      wrappers.push('@starting-style')

    if (wrappers.length > 0) {
      // Multiple at-rules nest in toCSS; the separator groups rules that
      // share the exact same wrapper chain.
      const result = wrappers.join(AT_RULE_SEPARATOR)
      this.mediaQueryCache.set(cacheKey, result)
      return result
    }

    this.mediaQueryCache.set(cacheKey, '')  // Use empty string as "no result" marker
    return undefined
  }

  /**
   * Escape special characters in class names for CSS selectors
   * Optimized with charCode checks for common fast path
  */
  private escapeSelector(className: string): string {
    // Fast path: identifier-safe ASCII ([A-Za-z0-9_-]) needs no escaping.
    // Everything else gets a backslash — an allowlist of "special" chars
    // kept missing selector-significant ones (& ? { } ; < $ | \), so
    // arbitrary values like content-['a?b&c'] produced invalid selectors.
    // Non-ASCII (charCode > 127) is identifier-safe in CSS and stays raw.
    let needsEscape = false
    for (let i = 0; i < className.length; i++) {
      const c = className.charCodeAt(i)
      const safe = (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57)
        || c === 45 || c === 95 || c > 127 // a-z A-Z 0-9 - _ non-ASCII
      if (!safe) {
        needsEscape = true
        break
      }
    }
    if (!needsEscape) {
      return className
    }
    // eslint-disable-next-line no-control-regex
    return className.replace(/[\x00-\x2C\x2E\x2F\x3A-\x40\x5B-\x5E\x60\x7B-\x7F]/g, '\\$&')
  }

  /**
   * Build web-font CSS (Google `@import` + raw `@font-face`) from `config.fonts`.
   * Returns an empty string when no fonts are configured.
   */
  private buildFontCSS(): string {
    const fonts = this.config.fonts
    if (!fonts)
      return ''

    const lines: string[] = []
    const google = fonts.google?.filter(Boolean) ?? []
    if (google.length > 0) {
      const families = google
        .map(family => `family=${family.trim().replace(/\s+/g, '+')}`)
        .join('&')
      const display = fonts.display ?? 'swap'
      lines.push(`@import url('https://fonts.googleapis.com/css2?${families}&display=${display}');`)
    }
    if (fonts.faces?.length)
      lines.push(...fonts.faces.map(face => face.trim()).filter(Boolean))

    return lines.join('\n')
  }

  /**
   * Generate final CSS output
  */
  toCSS(includePreflight = true, minify = false): string {
    // Serialising the sheet is O(rules), and a watch rebuild calls this on
    // every pass — usually with nothing new to say. Memoising on the revision
    // counter turns an unchanged rebuild into three integer comparisons.
    if (
      this.cssCache !== null
      && this.cssCacheRevision === this.revision
      && this.cssCachePreflight === includePreflight
      && this.cssCacheMinify === minify
    ) {
      return this.cssCache
    }

    const parts: string[] = []

    // Web fonts first — an @import must precede every other rule in the
    // stylesheet, so this has to be the very first thing we emit.
    const fontCSS = this.buildFontCSS()
    if (fontCSS) {
      parts.push(minify ? fontCSS.replace(/\s*\n\s*/g, '') : fontCSS)
    }

    // Add preflight CSS first (if requested)
    if (includePreflight) {
      for (const preflight of this.config.preflights) {
        let preflightCSS = preflight.getCSS()
        // Replace hardcoded font-family in preflight with theme's sans font
        const sansFonts = this.config.theme?.fontFamily?.sans
        if (sansFonts && Array.isArray(sansFonts)) {
          const fontFamilyValue = sansFonts.join(', ')
          // Replace the default ui-sans-serif stack in html/:host selector
          preflightCSS = preflightCSS.replace(
            /font-family:\s*ui-sans-serif[^;]+;/g,
            `font-family: ${fontFamilyValue};`,
          )
        }
        // Emit preflight inside a cascade layer so it is always the LOWEST
        // priority: an unlayered rule beats any layered rule regardless of
        // source order, so a page author's own `input { padding: … }` wins over
        // the reset's `input { padding: 0 }` even though this generated CSS is
        // injected after the author's <style>. Without the layer the reset
        // silently overrode author styles (form inputs lost their padding —
        // placeholders sitting flush against the border). Utilities stay
        // unlayered, so they still win over author styles as before.
        const layered = `@layer tc-base {\n${preflightCSS}\n}`
        parts.push(minify ? minifyCSSBlock(layered) : layered)
      }
    }

    // Generate CSS variables from theme colors if enabled
    if (this.config.cssVariables) {
      const vars = this.generateCSSVariables()
      if (vars) {
        parts.push(minify ? vars.replace(/\s+/g, ' ').trim() : vars)
      }
    }

    // Base rules (no media query)
    const baseRules = this.rules.get('base') || []
    if (baseRules.length > 0) {
      parts.push(this.rulesToCSS(baseRules, minify))
    }

    // Inject @keyframes for used animations
    if (this.usedKeyframes.size > 0) {
      for (const name of this.usedKeyframes) {
        const kf = KEYFRAMES[name]
        if (kf) {
          parts.push(minify ? minifyCSSBlock(kf) : kf)
        }
      }
    }

    // Media query rules — emitted mobile-first regardless of the order
    // classes were generated in. Insertion order let a `sm:` block land
    // AFTER `lg:` and win the cascade at large widths.
    const mediaEntries = [...this.rules.entries()].filter(([key, rules]) => key !== 'base' && rules.length > 0)
    const minWidthOf = (query: string): number => {
      const m = query.match(/min-width:\s*([\d.]+)(px|rem|em)/)
      if (!m)
        return Number.MAX_SAFE_INTEGER // non-width queries keep insertion order at the end
      const n = Number.parseFloat(m[1])
      return m[2] === 'px' ? n : n * 16
    }
    mediaEntries.sort((a, b) => minWidthOf(a[1][0].mediaQuery!) - minWidthOf(b[1][0].mediaQuery!))
    for (const [, rules] of mediaEntries) {
      const wrappers = rules[0].mediaQuery!.split(AT_RULE_SEPARATOR)
      let css = this.rulesToCSS(rules, minify)
      // Innermost wrapper first, so the first wrapper ends up outermost
      for (let i = wrappers.length - 1; i >= 0; i--) {
        css = minify ? `${wrappers[i]}{${css}}` : `${wrappers[i]} {\n${css}\n}`
      }
      parts.push(css)
    }

    const css = minify ? parts.join('') : parts.join('\n\n')
    this.cssCache = css
    this.cssCacheRevision = this.revision
    this.cssCachePreflight = includePreflight
    this.cssCacheMinify = minify
    return css
  }

  /**
   * Rank a rule by utility specificity so broader utilities emit BEFORE the
   * narrower ones that should win. Without this, class authoring order
   * decides the cascade and combinations like `m-0 mx-auto` silently break
   * (the shorthand resets the auto margins), and an icon's default `1em`
   * outranks the `w-5` beside it. Matches Tailwind's own stylesheet ordering,
   * plus an icon layer below it.
   *
   * See computeUtilityRank for the ranks themselves.
   */
  private getUtilityRank(selector: string): number {
    // Ranking is a pure function of the selector, and toCSS re-ranks every
    // rule on every call — a watching build pays for the same three regexes
    // over the same selectors on each rebuild. Memoize per generator.
    const cached = this.utilityRankCache.get(selector)
    if (cached !== undefined)
      return cached
    const rank = computeUtilityRank(selector)
    this.utilityRankCache.set(selector, rank)
    return rank
  }

  /**
   * Convert rules to CSS string.
   *
   * Written against index arrays rather than the obvious
   * `map -> sort -> map -> group` chain: that allocated a wrapper object per
   * rule plus two intermediate arrays, and this runs over every rule in the
   * stylesheet on each uncached `toCSS()`.
  */
  private rulesToCSS(rules: CSSRule[], minify: boolean): string {
    const count = rules.length

    // Stable sort by utility rank so shorthand utilities emit before their
    // axis/side counterparts. The index tiebreak is what keeps it stable, so
    // that within a rank the original insertion order — which drives other
    // cascade semantics — is preserved.
    const ranks: number[] = Array.from({ length: count })
    const order: number[] = Array.from({ length: count })
    for (let i = 0; i < count; i++) {
      ranks[i] = this.getUtilityRank(rules[i].selector)
      order[i] = i
    }
    order.sort((a, b) => ranks[a] - ranks[b] || a - b)

    // Group by selector, merging properties, in the same pass.
    const grouped = new Map<string, Map<string, string>>()
    for (let i = 0; i < count; i++) {
      const rule = rules[order[i]]
      let properties = grouped.get(rule.selector)
      if (properties === undefined) {
        properties = new Map<string, string>()
        grouped.set(rule.selector, properties)
      }
      // `for…in` rather than Object.entries: entries allocates a pair array
      // per rule, and a large sheet has thousands of them.
      const source = rule.properties
      for (const property in source)
        properties.set(property, source[property])
    }

    const parts: string[] = []
    for (const [selector, properties] of grouped) {
      let body = ''
      let first = true
      for (const [property, value] of properties) {
        if (minify) {
          if (!first)
            body += ';'
          body += `${property}:${value}`
        }
        else {
          if (!first)
            body += '\n'
          body += `  ${property}: ${value};`
        }
        first = false
      }

      parts.push(minify ? `${selector}{${body}}` : `${selector} {\n${body}\n}`)
    }

    return minify ? parts.join('') : parts.join('\n\n')
  }

  /**
   * Generate :root CSS variables from theme colors
   * Uses only extend colors (custom) if available, to avoid dumping 300+ default Tailwind colors.
   * Flattens nested color objects: { monokai: { bg: '#2d2a2e' } } -> --monokai-bg: #2d2a2e
  */
  private generateCSSVariables(): string | null {
    // Prefer extend colors (user's custom colors only). Otherwise emit only
    // colors that differ from the stock palette — falling back to ALL theme
    // colors dumped the full ~300-variable default palette into :root.
    let colors = this.extendColors as Record<string, string | Record<string, string>> | null
    if (!colors) {
      const stock = defaultConfig.theme.colors as Record<string, string | Record<string, string>>
      const custom: Record<string, string | Record<string, string>> = {}
      for (const [name, value] of Object.entries(this.config.theme.colors)) {
        const base = stock[name]
        if (typeof value === 'string') {
          if (base !== value)
            custom[name] = value
        }
        else if (value && typeof value === 'object') {
          if (!base || typeof base !== 'object') {
            custom[name] = value as Record<string, string>
          }
          else {
            const diff: Record<string, string> = {}
            for (const [shade, shadeValue] of Object.entries(value)) {
              if (typeof shadeValue === 'string' && (base as Record<string, string>)[shade] !== shadeValue)
                diff[shade] = shadeValue
            }
            if (Object.keys(diff).length > 0)
              custom[name] = diff
          }
        }
      }
      colors = custom
    }
    if (!colors || Object.keys(colors).length === 0) return null

    const vars: string[] = []
    for (const [name, value] of Object.entries(colors)) {
      if (typeof value === 'string') {
        vars.push(`  --${name}: ${value};`)
      }
      else if (typeof value === 'object' && value !== null) {
        for (const [shade, shadeValue] of Object.entries(value)) {
          if (typeof shadeValue === 'string') {
            // The `DEFAULT` shade maps to the bare color name (Tailwind convention),
            // emitting `--brand` rather than `--brand-DEFAULT`.
            vars.push(shade === 'DEFAULT' ? `  --${name}: ${shadeValue};` : `  --${name}-${shade}: ${shadeValue};`)
          }
        }
      }
    }

    if (vars.length === 0) return null
    return `:root {\n${vars.join('\n')}\n}`
  }

  /**
   * Reset the generator state (clears all generated CSS and caches)
  */
  reset(): void {
    this.revision++
    this.rules.clear()
    this.classCache.clear()
    this.selectorCache.clear()
    this.mediaQueryCache.clear()
    this.noMatchCache.clear()
    this.usedKeyframes.clear()
    this.compiledGenerated.clear()
    // Keyed by selector, so it tracks the same set of classes selectorCache
    // does and would otherwise accumulate across a watch session's rebuilds.
    this.utilityRankCache.clear()
    // variantHandledCache is config-derived, not generation state — it
    // stays valid across resets.
  }
}
