import type { UtilityRule } from './rules'
import { fractionToPercent } from './format'

const ROTATE_FNS: Record<string, string> = {
  'rotate': 'rotate',
  'rotate-x': 'rotateX',
  'rotate-y': 'rotateY',
  'rotate-z': 'rotateZ',
}

const TRANSLATE_FNS: Record<string, string> = {
  'translate-x': 'translateX',
  'translate-y': 'translateY',
  'translate-z': 'translateZ',
}

const BACKFACE_VISIBILITY_VALUES: Record<string, string> = {
  'backface-visible': 'visible',
  'backface-hidden': 'hidden',
}

const TRANSFORM_STYLE_VALUES: Record<string, string> = {
  'transform-flat': 'flat',
  'transform-3d': 'preserve-3d',
}

const TRANSITION_PROPERTY_PROPERTIES: Record<string, string> = {
  'transition-none': 'none',
  'transition-all': 'all',
  'transition': 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
  'transition-colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
  'transition-opacity': 'opacity',
  'transition-shadow': 'box-shadow',
  'transition-transform': 'transform',
}

const TRANSITION_TIMING_TIMINGS: Record<string, string> = {
  'ease-linear': 'linear',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Opt back out of an inherited easing.
  'ease-initial': 'initial',
}

const TRANSITION_BEHAVIOR_VALUES: Record<string, string> = {
  // Tailwind's spellings, plus the longhand ones this engine already had.
  'transition-normal': 'normal',
  'transition-discrete': 'allow-discrete',
  'transition-behavior-normal': 'normal',
  'transition-behavior-allow-discrete': 'allow-discrete',
}

const ANIMATION_ANIMATIONS: Record<string, string> = {
  none: 'none',
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',
}

const ANIMATION_PLAY_STATE_VALUES: Record<string, string> = {
  'animate-running': 'running',
  'animate-paused': 'paused',
}

const ANIMATION_DIRECTION_VALUES: Record<string, string> = {
  'animate-normal': 'normal',
  'animate-reverse': 'reverse',
  'animate-alternate': 'alternate',
  'animate-alternate-reverse': 'alternate-reverse',
}

const ANIMATION_FILL_MODE_VALUES: Record<string, string> = {
  'animate-fill-none': 'none',
  'animate-fill-forwards': 'forwards',
  'animate-fill-backwards': 'backwards',
  'animate-fill-both': 'both',
}

const ANIMATION_TIMING_VALUES: Record<string, string> = {
  'animate-ease-linear': 'linear',
  'animate-ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'animate-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'animate-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}


// Transform, Transition, Animation utilities

/**
 * The composed `transform` value shared by transform / transform-cpu.
 *
 * Every var carries an identity fallback. Nothing declares these custom
 * properties — the translate, rotate, scale and skew utilities each write the
 * `transform` property directly — and a single unresolved var makes the whole
 * declaration invalid at computed-value time — so `transform` and
 * `transform-gpu` used to be dropped entirely by the browser instead of
 * establishing the containing block / stacking context they exist for.
 */
const TRANSFORM_FUNCTIONS = 'rotate(var(--tc-rotate, 0deg)) skewX(var(--tc-skew-x, 0deg)) skewY(var(--tc-skew-y, 0deg)) scaleX(var(--tc-scale-x, 1)) scaleY(var(--tc-scale-y, 1))'
export const TRANSFORM_2D: string = `translate(var(--tc-translate-x, 0), var(--tc-translate-y, 0)) ${TRANSFORM_FUNCTIONS}`
export const TRANSFORM_3D: string = `translate3d(var(--tc-translate-x, 0), var(--tc-translate-y, 0), 0) ${TRANSFORM_FUNCTIONS}`

const TRANSFORM_VALUES: Record<string, string> = {
  'transform': TRANSFORM_2D,
  'transform-cpu': TRANSFORM_2D,
  'transform-gpu': TRANSFORM_3D,
  'transform-none': 'none',
}

export const transformRule: UtilityRule = (parsed) => {
  const value = TRANSFORM_VALUES[parsed.base]
  return value ? { transform: value } : undefined
}

// A bare scale token is a percentage number (scale-150 -> 1.5). Unknown
// words previously coerced through Number() and emitted transform: scale(NaN).
function scaleTransform(fn: string, parsed: { value?: string, arbitrary: boolean }): Record<string, string> | undefined {
  if (!parsed.value)
    return { transform: `${fn}(1)` }
  if (parsed.arbitrary)
    return { transform: `${fn}(${parsed.value})` }
  if (/^-?\d+(?:\.\d+)?$/.test(parsed.value))
    return { transform: `${fn}(${Number(parsed.value) / 100})` }
  return undefined
}

// A bare angle token is a number (deg implied) or a number with an explicit
// CSS angle unit. Unknown words previously emitted rotate(foodeg).
function angleToken(parsed: { value?: string, arbitrary: boolean }): string | undefined {
  const value = parsed.value!
  if (parsed.arbitrary)
    return value
  if (/^-?\d+(?:\.\d+)?$/.test(value))
    return `${value}deg`
  if (/^-?\d+(?:\.\d+)?(?:deg|rad|grad|turn)$/.test(value))
    return value
  return undefined
}

export const scaleRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'scale')
    return scaleTransform('scale', parsed)
  if (parsed.utility === 'scale-x')
    return scaleTransform('scaleX', parsed)
  if (parsed.utility === 'scale-y')
    return scaleTransform('scaleY', parsed)
  if (parsed.utility === 'scale-z')
    return scaleTransform('scaleZ', parsed)
}

export const rotateRule: UtilityRule = (parsed) => {
  if (!parsed.value)
    return undefined
  const fn = ROTATE_FNS[parsed.utility]
  if (!fn)
    return undefined
  const value = angleToken(parsed)
  return value !== undefined ? { transform: `${fn}(${value})` } : undefined
}

export const translateRule: UtilityRule = (parsed, config) => {
  const getTranslateValue = (val: string): string | undefined => {
    // Handle fractions: 1/2 -> 50%, 1/3 -> 33.333333%, etc.
    if (val.includes('/')) {
      const [num, denom] = val.split('/')
      return fractionToPercent(Number(num), Number(denom))
    }
    // Handle special keywords
    if (val === 'full')
      return '100%'
    if (val === 'half')
      return '50%'
    // Arbitrary values pass through; theme scale and off-scale numbers
    // resolve like spacing. Unknown words are rejected — they previously
    // emitted translateX(foo).
    if (parsed.arbitrary)
      return val
    const hit = config.theme.spacing[val]
    if (hit !== undefined)
      return hit
    if (/^\d+(?:\.\d+)?$/.test(val))
      return `${Number.parseFloat(val) * 0.25}rem`
    return undefined
  }

  const fn = TRANSLATE_FNS[parsed.utility]
  if (!fn || !parsed.value)
    return undefined

  let value: string | undefined
  if (parsed.value.startsWith('-')) {
    const resolved = getTranslateValue(parsed.value.slice(1))
    value = resolved === undefined ? undefined : `-${resolved}`
  }
  else {
    value = getTranslateValue(parsed.value)
  }
  return value !== undefined ? { transform: `${fn}(${value})` } : undefined
}

export const skewRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'skew-x' && parsed.value) {
    const value = angleToken(parsed)
    return value !== undefined ? { transform: `skewX(${value})` } : undefined
  }
  if (parsed.utility === 'skew-y' && parsed.value) {
    const value = angleToken(parsed)
    return value !== undefined ? { transform: `skewY(${value})` } : undefined
  }
}

export const transformOriginRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'origin' && parsed.value) {
    // Handle arbitrary values with underscores as spaces
    if (parsed.arbitrary) {
      return { 'transform-origin': parsed.value.replace(/_/g, ' ') }
    }
    // Handle predefined values
    const origins: Record<string, string> = {
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
    return origins[parsed.value] ? { 'transform-origin': origins[parsed.value] } : undefined
  }
  return undefined
}

// Tailwind v4's named perspective scale.
const PERSPECTIVE_VALUES: Record<string, string> = {
  dramatic: '100px',
  near: '300px',
  normal: '500px',
  midrange: '800px',
  distant: '1200px',
}

export const perspectiveRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'perspective' && parsed.value) {
    // If value is 'none', use as-is
    if (parsed.value === 'none') {
      return { perspective: 'none' }
    }
    // If arbitrary or already has unit, use as-is
    if (parsed.arbitrary || /^\d+(?:\.\d+)?(?:px|rem|em)$/.test(parsed.value)) {
      return { perspective: parsed.value }
    }
    const named = PERSPECTIVE_VALUES[parsed.value]
    if (named)
      return { perspective: named }
    // Bare numbers get px; unknown words previously emitted foopx
    if (/^\d+(?:\.\d+)?$/.test(parsed.value))
      return { perspective: `${parsed.value}px` }
    return undefined
  }
  return undefined
}

export const perspectiveOriginRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'perspective-origin' && parsed.value) {
    const origins: Record<string, string> = {
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
    return { 'perspective-origin': origins[parsed.value] || parsed.value }
  }
}

export const backfaceVisibilityRule: UtilityRule = (parsed) => {
  return BACKFACE_VISIBILITY_VALUES[parsed.base] ? { 'backface-visibility': BACKFACE_VISIBILITY_VALUES[parsed.base] } : undefined
}

export const transformStyleRule: UtilityRule = (parsed) => {
  return TRANSFORM_STYLE_VALUES[parsed.base] ? { 'transform-style': TRANSFORM_STYLE_VALUES[parsed.base] } : undefined
}

// Transition utilities
export const transitionPropertyRule: UtilityRule = (parsed) => {
  return TRANSITION_PROPERTY_PROPERTIES[parsed.base] ? { 'transition-property': TRANSITION_PROPERTY_PROPERTIES[parsed.base] } : undefined
}

// Resolve a duration/delay token: presets keep their exact form, arbitrary
// values pass through verbatim (duration-[2s] must not become "2sms"),
// bare numbers get the ms suffix, and unknown words are rejected.
function resolveTimeToken(parsed: { value?: string, arbitrary: boolean }, presets: Record<string, string>): string | undefined {
  const value = parsed.value!
  if (presets[value])
    return presets[value]
  if (parsed.arbitrary)
    return value
  if (/^\d+(?:\.\d+)?$/.test(value))
    return `${value}ms`
  return undefined
}

export const transitionDurationRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'duration' && parsed.value) {
    // Named duration presets (like Tailwind)
    const durations: Record<string, string> = {
      '0': '0s',
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    }
    const time = resolveTimeToken(parsed, durations)
    return time !== undefined ? { 'transition-duration': time } : undefined
  }
}

export const transitionTimingRule: UtilityRule = (parsed) => {
  return TRANSITION_TIMING_TIMINGS[parsed.base] ? { 'transition-timing-function': TRANSITION_TIMING_TIMINGS[parsed.base] } : undefined
}

export const transitionDelayRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'delay' && parsed.value) {
    // Named delay presets (like Tailwind)
    const delays: Record<string, string> = {
      '0': '0s',
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    }
    const time = resolveTimeToken(parsed, delays)
    return time !== undefined ? { 'transition-delay': time } : undefined
  }
}

export const transitionBehaviorRule: UtilityRule = (parsed) => {
  return TRANSITION_BEHAVIOR_VALUES[parsed.base] ? { 'transition-behavior': TRANSITION_BEHAVIOR_VALUES[parsed.base] } : undefined
}

export const animationRule: UtilityRule = (parsed) => {
  if (parsed.utility !== 'animate') {
    return undefined
  }


  // Support arbitrary animation values
  if (parsed.arbitrary && parsed.value) {
    // Replace underscores with spaces for arbitrary animation values
    return { animation: parsed.value.replace(/_/g, ' ') }
  }

  // Support predefined ANIMATION_ANIMATIONS
  if (parsed.value && ANIMATION_ANIMATIONS[parsed.value]) {
    return { animation: ANIMATION_ANIMATIONS[parsed.value] }
  }

  return undefined
}

// Animation play state
export const animationPlayStateRule: UtilityRule = (parsed) => {
  return ANIMATION_PLAY_STATE_VALUES[parsed.base] ? { 'animation-play-state': ANIMATION_PLAY_STATE_VALUES[parsed.base] } : undefined
}

// Animation direction
export const animationDirectionRule: UtilityRule = (parsed) => {
  return ANIMATION_DIRECTION_VALUES[parsed.base] ? { 'animation-direction': ANIMATION_DIRECTION_VALUES[parsed.base] } : undefined
}

// Animation fill mode
export const animationFillModeRule: UtilityRule = (parsed) => {
  return ANIMATION_FILL_MODE_VALUES[parsed.base] ? { 'animation-fill-mode': ANIMATION_FILL_MODE_VALUES[parsed.base] } : undefined
}

// Animation iteration count
export const animationIterationRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'animate-iteration' && parsed.value) {
    // A count is a number (fractions allowed per spec), infinite, or arbitrary.
    if (parsed.value === 'infinite' || parsed.arbitrary || /^\d+(?:\.\d+)?$/.test(parsed.value))
      return { 'animation-iteration-count': parsed.value }
    return undefined
  }
}

// Animation duration
export const animationDurationRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'animate-duration' && parsed.value) {
    const durations: Record<string, string> = {
      '75': '75ms', '100': '100ms', '150': '150ms', '200': '200ms',
      '300': '300ms', '500': '500ms', '700': '700ms', '1000': '1000ms',
    }
    const time = resolveTimeToken(parsed, durations)
    return time !== undefined ? { 'animation-duration': time } : undefined
  }
}

// Animation delay
export const animationDelayRule: UtilityRule = (parsed) => {
  if (parsed.utility === 'animate-delay' && parsed.value) {
    const delays: Record<string, string> = {
      '75': '75ms', '100': '100ms', '150': '150ms', '200': '200ms',
      '300': '300ms', '500': '500ms', '700': '700ms', '1000': '1000ms',
    }
    const time = resolveTimeToken(parsed, delays)
    return time !== undefined ? { 'animation-delay': time } : undefined
  }
}

// Animation timing function
export const animationTimingRule: UtilityRule = (parsed) => {
  return ANIMATION_TIMING_VALUES[parsed.base] ? { 'animation-timing-function': ANIMATION_TIMING_VALUES[parsed.base] } : undefined
}

export const transformsRules: UtilityRule[] = [
  transformRule,
  scaleRule,
  rotateRule,
  translateRule,
  skewRule,
  transformOriginRule,
  perspectiveRule,
  perspectiveOriginRule,
  backfaceVisibilityRule,
  transformStyleRule,
  transitionPropertyRule,
  transitionBehaviorRule,
  transitionDurationRule,
  transitionTimingRule,
  transitionDelayRule,
  animationRule,
  animationPlayStateRule,
  animationDirectionRule,
  animationFillModeRule,
  animationIterationRule,
  animationDurationRule,
  animationDelayRule,
  animationTimingRule,
]
