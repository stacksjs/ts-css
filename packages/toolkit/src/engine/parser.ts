import type { AttributifyConfig, BracketSyntaxConfig, ParsedClass } from './types'

/**
 * Module-level caches are shared by every generator in the process and live
 * for its whole lifetime, so they need a ceiling. A watching build re-scans on
 * every keystroke and arbitrary values (`w-[137px]`, `w-[138px]`, …) mint a
 * fresh key each time — unbounded, these grew without limit for as long as the
 * dev server ran.
 *
 * Eviction is oldest-first: Map iterates in insertion order, so the first key
 * is the least recently added. Entries are pure functions of their key, so
 * dropping one only costs a re-parse.
 */
const MAX_CACHE_ENTRIES = 10_000

function cacheSet<K, V>(cache: Map<K, V>, key: K, value: V): V {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined)
      cache.delete(oldest)
  }
  cache.set(key, value)
  return value
}

// Cache for parsed classes to avoid re-parsing
const parseCache = new Map<string, ParsedClass>()

// Cache for expanded bracket syntax
const bracketExpansionCache = new Map<string, string[]>()

/**
 * Drop the module-level parse caches. Exposed for long-lived hosts that want
 * to reclaim the memory between builds; correctness never depends on it.
 */
export function clearParseCaches(): void {
  parseCache.clear()
  bracketExpansionCache.clear()
}

/**
 * Options for class extraction
*/
export interface ExtractClassesOptions {
  attributify?: AttributifyConfig
  bracketSyntax?: BracketSyntaxConfig
  codeStrings?: CodeStringsConfig
}

/**
 * Extraction from string literals in code, not just from class attributes.
 *
 * Utility classes routinely live in code rather than in markup: a helper that
 * returns a class string, a lookup table of icons keyed by status, a signal
 * holding the current variant. Attribute-scoped extraction cannot see any of
 * it, so those classes silently never generate and the element renders
 * unstyled — with no error, because nothing went wrong as far as the build is
 * concerned.
 *
 * The failure is quiet enough that projects tend to work around it instead of
 * reporting it: pre-generating a whole icon stylesheet, restating class names
 * in a dummy attribute, or moving state into `data-` attributes and styling
 * those instead. All of that goes away if the scanner reads the strings.
 *
 * Only *compound* tokens are taken from code — see `isCodeStringCandidate`.
 */
export interface CodeStringsConfig {
  /**
   * Extract utility classes from string literals in scanned files.
   * Defaults to true.
   */
  enabled?: boolean
}

/**
 * Default aliases for bracket syntax
 * Maps shorthand to full utility part
*/
const defaultBracketAliases: Record<string, string> = {
  // Flexbox direction
  'col': 'col',
  'row': 'row',
  // Justify/align abbreviations
  'jc': 'justify',
  'ji': 'justify-items',
  'js': 'justify-self',
  'ai': 'items',
  'ac': 'content',
  'as': 'self',
  // Wrap
  'wrap': 'wrap',
  'nowrap': 'nowrap',
  // Common values
  'c': 'center',
  's': 'start',
  'e': 'end',
  'sb': 'between',
  'sa': 'around',
  'se': 'evenly',
  'st': 'stretch',
  // Font weights
  'thin': 'thin',
  'extralight': 'extralight',
  'light': 'light',
  'normal': 'normal',
  'medium': 'medium',
  'semibold': 'semibold',
  'bold': 'bold',
  'extrabold': 'extrabold',
  'black': 'black',
  // Position
  't': 'top',
  'r': 'right',
  'b': 'bottom',
  'l': 'left',
}

/**
 * Pre-compiled regex patterns for performance (avoid regex compilation on each call)
*/
const SPECIAL_CHARS_REGEX = /[%#()]/
// Groups are non-capturing: the callers only ever test, so capturing made the
// engine build a match array per call for nothing.
const CSS_UNITS_REGEX = /^\d+(?:\.\d+)?(?:px|rem|em|vh|vw|dvh|dvw|svh|svw|lvh|lvw|ch|ex|lh|cap|ic|rlh|vi|vb|vmin|vmax|cqw|cqh|cqi|cqb|cqmin|cqmax|cm|mm|in|pt|pc|Q)$/
const MATH_FUNCTIONS = [
  'calc',
  'min',
  'max',
  'clamp',
  'mod',
  'rem',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'pow',
  'sqrt',
  'hypot',
  'log',
  'exp',
  'round',
] as const
const MATH_FUNCTION_SET = new Set<string>(MATH_FUNCTIONS)

/**
 * Check if value needs arbitrary bracket syntax
*/
function needsArbitraryBrackets(value: string): boolean {
  return SPECIAL_CHARS_REGEX.test(value) || CSS_UNITS_REGEX.test(value)
}

/**
 * CSS math requires whitespace around binary + and - operators. Arbitrary
 * values commonly omit it because spaces delimit utility classes, so match
 * Tailwind's decoding semantics and restore operator whitespace while
 * preserving unary signs, scientific notation, and nested non-math functions.
 */
function addWhitespaceAroundMathOperators(value: string): string {
  if (!MATH_FUNCTIONS.some(fn => value.includes(`${fn}(`)))
    return value

  let result = ''
  const formattable: boolean[] = []
  let valuePosition: number | null = null
  let lastValuePosition: number | null = null

  for (let index = 0; index < value.length; index++) {
    const character = value.charCodeAt(index)

    if (character >= 0x30 && character <= 0x39) {
      valuePosition = index
    }
    else if (
      valuePosition !== null
      && (
        character === 0x25
        || (character >= 0x61 && character <= 0x7A)
        || (character >= 0x41 && character <= 0x5A)
      )
    ) {
      valuePosition = index
    }
    else {
      lastValuePosition = valuePosition
      valuePosition = null
    }

    if (character === 0x28) {
      result += value[index]
      let functionStart = index

      for (let cursor = index - 1; cursor >= 0; cursor--) {
        const inner = value.charCodeAt(cursor)
        if (
          (inner >= 0x30 && inner <= 0x39)
          || (inner >= 0x61 && inner <= 0x7A)
        ) {
          functionStart = cursor
        }
        else {
          break
        }
      }

      const functionName = value.slice(functionStart, index)
      if (MATH_FUNCTION_SET.has(functionName))
        formattable.unshift(true)
      else if (formattable[0] && functionName === '')
        formattable.unshift(true)
      else
        formattable.unshift(false)

      continue
    }

    if (character === 0x29) {
      result += value[index]
      formattable.shift()
      continue
    }

    if (character === 0x2C && formattable[0]) {
      result += ', '
      continue
    }

    if (character === 0x20 && formattable[0] && result.charCodeAt(result.length - 1) === 0x20)
      continue

    const isMathOperator = character === 0x2B
      || character === 0x2D
      || character === 0x2A
      || character === 0x2F

    if (isMathOperator && formattable[0]) {
      const trimmed = result.trimEnd()
      const previous = trimmed.charCodeAt(trimmed.length - 1)
      const previousPrevious = trimmed.charCodeAt(trimmed.length - 2)
      const next = value.charCodeAt(index + 1)
      const previousIsOperator = previous === 0x2B
        || previous === 0x2D
        || previous === 0x2A
        || previous === 0x2F
      const nextIsOperator = next === 0x2B
        || next === 0x2D
        || next === 0x2A
        || next === 0x2F

      if (
        (previous === 0x65 || previous === 0x45)
        && previousPrevious >= 0x30
        && previousPrevious <= 0x39
      ) {
        result += value[index]
      }
      else if (previousIsOperator || previous === 0x28 || previous === 0x2C) {
        result += value[index]
      }
      else if (value.charCodeAt(index - 1) === 0x20) {
        result += `${value[index]} `
      }
      else if (
        (previous >= 0x30 && previous <= 0x39)
        || (next >= 0x30 && next <= 0x39)
        || previous === 0x29
        || next === 0x28
        || nextIsOperator
        || (lastValuePosition !== null && lastValuePosition === index - 1)
      ) {
        result += ` ${value[index]} `
      }
      else {
        result += value[index]
      }

      continue
    }

    result += value[index]
  }

  return result
}

/**
 * Convert underscores to spaces in arbitrary values (Tailwind convention).
 * e.g. grid-cols-[120px_1fr_200px] → "120px 1fr 200px"
 *      max-h-[calc(100vh_-_120px)] → "calc(100vh - 120px)"
 *
 * Only `url(...)` preserves underscores — URLs legitimately contain them and
 * auto-converting would corrupt paths. Every other CSS function (calc, clamp,
 * min, max, var, linear-gradient, etc.) uses spaces around operators, so
 * underscores there are always stand-ins for spaces.
 *
 * To emit a literal underscore in a non-url value, escape it as `\_`.
 */
function convertArbitraryUnderscores(value: string): string {
  if (!value.includes('_'))
    return addWhitespaceAroundMathOperators(value)

  let result = ''
  let i = 0
  while (i < value.length) {
    const ch = value[i]

    // Escaped underscore → literal underscore, skip the backslash.
    if (ch === '\\' && value[i + 1] === '_') {
      result += '_'
      i += 2
      continue
    }

    // Detect url(...) and copy its contents verbatim, preserving underscores.
    if (ch === 'u' && value.slice(i, i + 4) === 'url(') {
      const start = i
      let depth = 1
      i += 4
      while (i < value.length && depth > 0) {
        if (value[i] === '(') depth++
        else if (value[i] === ')') depth--
        i++
      }
      result += value.slice(start, i)
      continue
    }

    result += ch === '_' ? ' ' : ch
    i++
  }
  return addWhitespaceAroundMathOperators(result)
}

/**
 * Handle min/max prefix patterns for sizing utilities
 * w[min 200px] -> min-w-[200px], h[max screen] -> max-h-screen
*/
function handleMinMaxPattern(prefix: string, parts: string[]): string[] | null {
  if (parts.length !== 2) return null
  const [modifier, value] = parts
  if (modifier !== 'min' && modifier !== 'max') return null

  const result = needsArbitraryBrackets(value)
    ? `${modifier}-${prefix}-[${value}]`
    : `${modifier}-${prefix}-${value}`
  return [result]
}

/**
 * Mapping of bracket utility prefixes to their expansion patterns
 * This defines how utilities like flex[col jc-center] expand to real classes
*/
const bracketUtilityMappings: Record<string, {
  // How to expand each part within brackets
  expand: (part: string, aliases: Record<string, string>) => string | null
  // Optional: handle multi-value patterns like w[min 200px]
  multiValue?: (parts: string[], aliases: Record<string, string>) => string[] | null
}> = {
  'flex': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      // flex[col] -> flex-col, flex[row] -> flex-row
      if (['col', 'row', 'col-reverse', 'row-reverse', 'wrap', 'nowrap', 'wrap-reverse'].includes(aliased)) {
        return `flex-${aliased}`
      }
      // flex[jc-center] -> justify-center, flex[ai-center] -> items-center
      const match = part.match(/^(jc|ji|js|ai|ac|as)-(.+)$/)
      if (match) {
        const prefix = aliases[match[1]] || match[1]
        const value = aliases[match[2]] || match[2]
        return `${prefix}-${value}`
      }
      // flex[1] -> flex-1, flex[grow] -> flex-grow
      if (/^\d+$/.test(aliased) || ['grow', 'shrink', 'auto', 'initial', 'none'].includes(aliased)) {
        return `flex-${aliased}`
      }
      return null
    },
  },
  'grid': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      // grid[cols-3] -> grid-cols-3
      if (part.startsWith('cols-') || part.startsWith('rows-')) {
        return `grid-${part}`
      }
      // grid[flow-row] -> grid-flow-row
      if (part.startsWith('flow-')) {
        return `grid-${part}`
      }
      // grid[gap-4] -> gap-4
      if (part.startsWith('gap-')) {
        return part
      }
      return null
    },
  },
  'text': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      // text[2rem] or text[16px] -> text-[2rem] or text-[16px] (arbitrary size)
      if (needsArbitraryBrackets(aliased)) {
        return `text-[${aliased}]`
      }
      // text[700] -> font-bold (weight), text[500] -> font-medium
      if (/^\d{3}$/.test(aliased)) {
        const weightMap: Record<string, string> = {
          '100': 'font-thin',
          '200': 'font-extralight',
          '300': 'font-light',
          '400': 'font-normal',
          '500': 'font-medium',
          '600': 'font-semibold',
          '700': 'font-bold',
          '800': 'font-extrabold',
          '900': 'font-black',
        }
        return weightMap[aliased] || `font-[${aliased}]`
      }
      // text[arial] -> font-[arial] (font family)
      if (/^[a-z-]+$/i.test(aliased) && !['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'].includes(aliased)) {
        // Check if it's a color name. Single-token colors map directly;
        // multi-shade families take their 500 shade — bare `text-red` has
        // no value in the palette and silently generated nothing.
        const singleColors = ['white', 'black', 'inherit', 'current', 'transparent']
        if (singleColors.includes(aliased.toLowerCase())) {
          return `text-${aliased}`
        }
        const colorFamilies = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'gray', 'slate', 'zinc', 'neutral', 'stone', 'orange', 'amber', 'lime', 'emerald', 'teal', 'cyan', 'sky', 'indigo', 'violet', 'fuchsia', 'rose']
        if (colorFamilies.includes(aliased.toLowerCase())) {
          return `text-${aliased}-500`
        }
        // Otherwise treat as font family
        return `font-[${aliased}]`
      }
      // text[sm], text[lg], etc -> text-sm, text-lg
      return `text-${aliased}`
    },
  },
  'font': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      // font[bold] -> font-bold, font[sans] -> font-sans
      const weights = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black']
      const families = ['sans', 'serif', 'mono']
      if (weights.includes(aliased) || families.includes(aliased)) {
        return `font-${aliased}`
      }
      // font[700] -> font-bold
      if (/^\d{3}$/.test(aliased)) {
        const weightMap: Record<string, string> = {
          '100': 'font-thin',
          '200': 'font-extralight',
          '300': 'font-light',
          '400': 'font-normal',
          '500': 'font-medium',
          '600': 'font-semibold',
          '700': 'font-bold',
          '800': 'font-extrabold',
          '900': 'font-black',
        }
        return weightMap[aliased] || `font-[${aliased}]`
      }
      // font[arial] -> font-[arial]
      return `font-[${aliased}]`
    },
  },
  'bg': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      return `bg-${aliased}`
    },
  },
  'w': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      if (needsArbitraryBrackets(aliased)) {
        return `w-[${aliased}]`
      }
      return `w-${aliased}`
    },
    multiValue: (parts) => handleMinMaxPattern('w', parts),
  },
  'h': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      if (needsArbitraryBrackets(aliased)) {
        return `h-[${aliased}]`
      }
      return `h-${aliased}`
    },
    multiValue: (parts) => handleMinMaxPattern('h', parts),
  },
  'p': {
    expand: (part) => `p-${part}`,
  },
  'px': {
    expand: (part) => `px-${part}`,
  },
  'py': {
    expand: (part) => `py-${part}`,
  },
  'pt': {
    expand: (part) => `pt-${part}`,
  },
  'pr': {
    expand: (part) => `pr-${part}`,
  },
  'pb': {
    expand: (part) => `pb-${part}`,
  },
  'pl': {
    expand: (part) => `pl-${part}`,
  },
  'm': {
    expand: (part) => `m-${part}`,
  },
  'mx': {
    expand: (part) => `mx-${part}`,
  },
  'my': {
    expand: (part) => `my-${part}`,
  },
  'mt': {
    expand: (part) => `mt-${part}`,
  },
  'mr': {
    expand: (part) => `mr-${part}`,
  },
  'mb': {
    expand: (part) => `mb-${part}`,
  },
  'ml': {
    expand: (part) => `ml-${part}`,
  },
  'scroll': {
    expand: (part) => {
      // scroll[y auto] -> overflow-y-auto
      if (['x', 'y'].includes(part)) {
        return null // Will be combined with next value
      }
      if (['auto', 'hidden', 'scroll', 'visible'].includes(part)) {
        return `overflow-${part}`
      }
      return null
    },
    multiValue: (parts) => {
      if (parts.length === 2) {
        const [axis, value] = parts
        if (['x', 'y'].includes(axis) && ['auto', 'hidden', 'scroll', 'visible'].includes(value)) {
          return [`overflow-${axis}-${value}`]
        }
      }
      return null
    },
  },
  'overflow': {
    expand: (part) => `overflow-${part}`,
    multiValue: (parts) => {
      if (parts.length === 2) {
        const [axis, value] = parts
        if (['x', 'y'].includes(axis)) {
          return [`overflow-${axis}-${value}`]
        }
      }
      return null
    },
  },
  'border': {
    expand: (part) => `border-${part}`,
  },
  'rounded': {
    expand: (part) => `rounded-${part}`,
  },
  'shadow': {
    expand: (part) => `shadow-${part}`,
  },
  'gap': {
    expand: (part) => {
      // gap[x-4] -> gap-x-4
      if (part.startsWith('x-') || part.startsWith('y-')) {
        return `gap-${part}`
      }
      return `gap-${part}`
    },
  },
  'space': {
    expand: (part) => `space-${part}`,
  },
  // New utilities
  'opacity': {
    expand: (part) => `opacity-${part}`,
  },
  'z': {
    expand: (part) => `z-${part}`,
  },
  'inset': {
    expand: (part, aliases) => {
      const aliased = aliases[part] || part
      // inset[x-0] -> inset-x-0, inset[y-auto] -> inset-y-auto
      if (aliased.startsWith('x-') || aliased.startsWith('y-')) {
        return `inset-${aliased}`
      }
      if (needsArbitraryBrackets(aliased)) {
        return `inset-[${aliased}]`
      }
      return `inset-${aliased}`
    },
  },
  'top': {
    expand: (part) => needsArbitraryBrackets(part) ? `top-[${part}]` : `top-${part}`,
  },
  'right': {
    expand: (part) => needsArbitraryBrackets(part) ? `right-[${part}]` : `right-${part}`,
  },
  'bottom': {
    expand: (part) => needsArbitraryBrackets(part) ? `bottom-[${part}]` : `bottom-${part}`,
  },
  'left': {
    expand: (part) => needsArbitraryBrackets(part) ? `left-[${part}]` : `left-${part}`,
  },
  'duration': {
    expand: (part) => `duration-${part}`,
  },
  'delay': {
    expand: (part) => `delay-${part}`,
  },
  'ease': {
    expand: (part) => `ease-${part}`,
  },
  'transition': {
    expand: (part) => {
      // transition[all] -> transition-all
      if (['all', 'none', 'colors', 'opacity', 'shadow', 'transform'].includes(part)) {
        return `transition-${part}`
      }
      // transition[300] -> duration-300
      if (/^\d+$/.test(part)) {
        return `duration-${part}`
      }
      // transition[ease-in-out] -> ease-in-out
      if (['linear', 'in', 'out', 'in-out', 'ease-linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(part)) {
        return part.startsWith('ease-') ? part : `ease-${part}`
      }
      return `transition-${part}`
    },
  },
  'translate': {
    expand: (part) => {
      // translate[x-4] -> translate-x-4
      if (part.startsWith('x-') || part.startsWith('y-') || part.startsWith('z-')) {
        return `translate-${part}`
      }
      // translate[4] -> translate-4 (Tailwind v4 syntax)
      return `translate-${part}`
    },
  },
  'rotate': {
    expand: (part) => {
      if (part.startsWith('x-') || part.startsWith('y-') || part.startsWith('z-')) {
        return `rotate-${part}`
      }
      return `rotate-${part}`
    },
  },
  'scale': {
    expand: (part) => {
      if (part.startsWith('x-') || part.startsWith('y-') || part.startsWith('z-')) {
        return `scale-${part}`
      }
      return `scale-${part}`
    },
  },
  'skew': {
    expand: (part) => {
      if (part.startsWith('x-') || part.startsWith('y-')) {
        return `skew-${part}`
      }
      return `skew-${part}`
    },
  },
  'origin': {
    expand: (part) => `origin-${part}`,
  },
  'cursor': {
    expand: (part) => `cursor-${part}`,
  },
  'select': {
    expand: (part) => `select-${part}`,
  },
  'resize': {
    expand: (part) => `resize-${part}`,
  },
  'appearance': {
    expand: (part) => `appearance-${part}`,
  },
  'pointer': {
    expand: (part) => `pointer-events-${part}`,
  },
  'outline': {
    expand: (part) => `outline-${part}`,
  },
  'ring': {
    expand: (part) => `ring-${part}`,
  },
  'blur': {
    expand: (part) => `blur-${part}`,
  },
  'brightness': {
    expand: (part) => `brightness-${part}`,
  },
  'contrast': {
    expand: (part) => `contrast-${part}`,
  },
  'grayscale': {
    expand: (part) => `grayscale-${part}`,
  },
  'saturate': {
    expand: (part) => `saturate-${part}`,
  },
  'sepia': {
    expand: (part) => `sepia-${part}`,
  },
  'backdrop': {
    expand: (part) => `backdrop-${part}`,
  },
  'aspect': {
    expand: (part) => `aspect-${part}`,
  },
  'columns': {
    expand: (part) => `columns-${part}`,
  },
  'break': {
    expand: (part) => `break-${part}`,
  },
  'object': {
    expand: (part) => `object-${part}`,
  },
  'overscroll': {
    expand: (part) => `overscroll-${part}`,
  },
  'place': {
    expand: (part) => `place-${part}`,
  },
  'items': {
    expand: (part) => `items-${part}`,
  },
  'justify': {
    expand: (part) => `justify-${part}`,
  },
  'content': {
    expand: (part) => `content-${part}`,
  },
  'self': {
    expand: (part) => `self-${part}`,
  },
  'order': {
    expand: (part) => `order-${part}`,
  },
  'col': {
    expand: (part) => `col-${part}`,
  },
  'row': {
    expand: (part) => `row-${part}`,
  },
  'tracking': {
    expand: (part) => `tracking-${part}`,
  },
  'leading': {
    expand: (part) => `leading-${part}`,
  },
  'list': {
    expand: (part) => `list-${part}`,
  },
  'decoration': {
    expand: (part) => `decoration-${part}`,
  },
  'underline': {
    expand: (part) => `underline-${part}`,
  },
  'accent': {
    expand: (part) => `accent-${part}`,
  },
  'caret': {
    expand: (part) => `caret-${part}`,
  },
  'scroll-m': {
    expand: (part) => `scroll-m-${part}`,
  },
  'scroll-p': {
    expand: (part) => `scroll-p-${part}`,
  },
  'snap': {
    expand: (part) => `snap-${part}`,
  },
  'touch': {
    expand: (part) => `touch-${part}`,
  },
  'will': {
    expand: (part) => `will-change-${part}`,
  },
  'fill': {
    expand: (part) => `fill-${part}`,
  },
  'stroke': {
    expand: (part) => `stroke-${part}`,
  },
  'sr': {
    expand: (part) => `sr-${part}`,
  },
  // Filter utilities
  'invert': {
    expand: (part) => `invert-${part}`,
  },
  'hue-rotate': {
    expand: (part) => needsArbitraryBrackets(part) ? `hue-rotate-[${part}]` : `hue-rotate-${part}`,
  },
  'drop-shadow': {
    expand: (part) => `drop-shadow-${part}`,
  },
  'backdrop-invert': {
    expand: (part) => `backdrop-invert-${part}`,
  },
  'backdrop-hue-rotate': {
    expand: (part) => needsArbitraryBrackets(part) ? `backdrop-hue-rotate-[${part}]` : `backdrop-hue-rotate-${part}`,
  },
  // Animation utilities
  'animate': {
    expand: (part) => `animate-${part}`,
  },
  // Accessibility utilities
  'forced-colors': {
    expand: (part) => `forced-colors-${part}`,
  },
}

/**
 * Common variant prefixes for responsive and state variants
 * Using Set for O(1) lookup instead of O(n) array search
*/
const variantPrefixes = new Set([
  // Responsive
  'sm', 'md', 'lg', 'xl', '2xl',
  // State
  'hover', 'focus', 'active', 'visited', 'disabled', 'enabled',
  'focus-within', 'focus-visible',
  // Group/peer
  'group-hover', 'group-focus', 'peer-hover', 'peer-focus',
  // Dark mode
  'dark',
  // First/last/odd/even
  'first', 'last', 'odd', 'even', 'only',
  'first-of-type', 'last-of-type',
  // Form states
  'checked', 'indeterminate', 'default', 'required', 'valid', 'invalid',
  'in-range', 'out-of-range', 'placeholder-shown', 'autofill', 'read-only',
  // Content
  'empty', 'before', 'after',
  // Selection
  'selection', 'marker', 'file',
  // Print
  'print',
  // Motion
  'motion-safe', 'motion-reduce',
  // Contrast
  'contrast-more', 'contrast-less',
  // RTL/LTR
  'rtl', 'ltr',
  // Portrait/Landscape
  'portrait', 'landscape',
  // Container queries
  '@sm', '@md', '@lg', '@xl', '@2xl',
])

/**
 * Per-config memos for bracket expansion.
 *
 * The alias table and the cache-key fingerprint used to be rebuilt on every
 * single call — a spread of the ~30 default aliases plus a JSON.stringify of
 * the user's, for each class encountered. Both are pure functions of the
 * config object, which is stable for the life of a build, so they are computed
 * once per object. WeakMap so a discarded config is still collectable.
 */
const aliasCache = new WeakMap<BracketSyntaxConfig, Record<string, string>>()
const fingerprintCache = new WeakMap<BracketSyntaxConfig, string>()

function resolveAliases(config?: BracketSyntaxConfig): Record<string, string> {
  if (!config)
    return defaultBracketAliases
  let aliases = aliasCache.get(config)
  if (!aliases) {
    aliases = config.aliases ? { ...defaultBracketAliases, ...config.aliases } : defaultBracketAliases
    aliasCache.set(config, aliases)
  }
  return aliases
}

function configFingerprint(config?: BracketSyntaxConfig): string {
  if (!config?.aliases)
    return ''
  let fingerprint = fingerprintCache.get(config)
  if (fingerprint === undefined) {
    fingerprint = JSON.stringify(config.aliases)
    fingerprintCache.set(config, fingerprint)
  }
  return fingerprint
}

/**
 * Expand bracket/grouped syntax into individual class names
 * e.g., flex[col jc-center ai-center] -> ['flex-col', 'justify-center', 'items-center']
 * e.g., text[white 2rem 700] -> ['text-white', 'text-[2rem]', 'font-bold']
 * e.g., h[min 100vh] -> ['min-h-[100vh]']
 * e.g., hover:flex[col] -> ['hover:flex-col']
 * e.g., flex[md:col lg:row] -> ['md:flex-col', 'lg:flex-row']
 * e.g., -m[4] or m[-4] -> ['-m-4']
*/
export function expandBracketSyntax(className: string, config?: BracketSyntaxConfig): string[] {
  // Check cache first
  const cacheKey = `${className}:${config?.colonSyntax}:${configFingerprint(config)}`
  const cached = bracketExpansionCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const aliases = resolveAliases(config)

  // Handle colon syntax: bg:black -> bg-black, w:100% -> w-[100%]
  // Only if colonSyntax is explicitly enabled
  // But NOT if it looks like a variant (hover:bg, sm:flex, etc.)
  if (config?.colonSyntax === true) {
    const colonMatch = className.match(/^([a-z][a-z0-9-]*):([^[\]:]+)$/i)
    if (colonMatch) {
      const [, prefix, value] = colonMatch
      // Skip if prefix is a variant
      if (!variantPrefixes.has(prefix)) {
        // If value contains special characters, use arbitrary syntax
        if (needsArbitraryBrackets(value)) {
          const result = [`${prefix}-[${value}]`]
          cacheSet(bracketExpansionCache, cacheKey, result)
          return result
        }
        // Negative values move the sign to the canonical prefix position:
        // m:-2 -> -m-2 (previously produced the double-dash token m--2).
        const result = value.startsWith('-')
          ? [`-${prefix}-${value.slice(1)}`]
          : [`${prefix}-${value}`]
        cacheSet(bracketExpansionCache, cacheKey, result)
        return result
      }
    }
  }

  // Handle variant prefix: hover:flex[col] -> expand with hover: prefix
  let variantPrefix = ''
  let workingClassName = className

  // Check for negative prefix: -m[4] -> negative class
  let isNegative = false
  if (workingClassName.startsWith('-')) {
    isNegative = true
    workingClassName = workingClassName.slice(1)
  }

  // Extract variant prefix if present (e.g., hover:flex[col] or dark:hover:bg[black])
  const variantMatch = workingClassName.match(/^((?:[a-z@][a-z0-9-]*:)+)(.+)$/i)
  if (variantMatch) {
    const potentialVariants = variantMatch[1].slice(0, -1).split(':')
    // Verify all are valid variants
    const allVariants = potentialVariants.every(v => variantPrefixes.has(v))
    if (allVariants) {
      variantPrefix = variantMatch[1]
      workingClassName = variantMatch[2]
    }
  }

  // Handle bracket syntax: flex[col jc-center]
  // But NOT arbitrary values like w-[100px] (note the dash before bracket)
  const bracketMatch = workingClassName.match(/^([a-z][a-z0-9-]*)\[([^\]]*)\]$/i)
  if (!bracketMatch || workingClassName.includes('-[')) {
    // No bracket syntax or it's an arbitrary value, return as-is
    const result = [className]
    cacheSet(bracketExpansionCache, cacheKey, result)
    return result
  }

  const [, prefix, content] = bracketMatch
  const parts = content.split(/\s+/).filter(Boolean)

  // Handle empty brackets
  if (parts.length === 0) {
    cacheSet(bracketExpansionCache, cacheKey, [])
    return []
  }

  const mapping = bracketUtilityMappings[prefix.toLowerCase()]

  // Try multi-value handler first if available
  if (mapping?.multiValue) {
    const multiResult = mapping.multiValue(parts, aliases)
    if (multiResult) {
      const results = multiResult.map(cls => {
        const neg = isNegative ? '-' : ''
        return `${variantPrefix}${neg}${cls}`
      })
      cacheSet(bracketExpansionCache, cacheKey, results)
      return results
    }
  }

  if (!mapping) {
    // Unknown prefix, try generic expansion: prefix[a b c] -> prefix-a prefix-b prefix-c
    const results: string[] = []
    for (const part of parts) {
      // Check for variant inside brackets: flex[md:col lg:row]
      const innerVariantMatch = part.match(/^([a-z@][a-z0-9-]*):(.+)$/i)
      let innerVariant = ''
      let partValue = part

      if (innerVariantMatch && variantPrefixes.has(innerVariantMatch[1])) {
        innerVariant = `${innerVariantMatch[1]}:`
        partValue = innerVariantMatch[2]
      }

      // Handle negative values inside brackets: m[-4]
      let partNegative = ''
      if (partValue.startsWith('-')) {
        partNegative = '-'
        partValue = partValue.slice(1)
      }

      // Handle important modifier: p[4!] -> !p-4
      let important = ''
      if (partValue.endsWith('!')) {
        important = '!'
        partValue = partValue.slice(0, -1)
      }

      const neg = isNegative ? '-' : ''
      if (needsArbitraryBrackets(partValue)) {
        results.push(`${variantPrefix}${innerVariant}${important}${neg}${partNegative}${prefix}-[${partValue}]`)
      }
else {
        results.push(`${variantPrefix}${innerVariant}${important}${neg}${partNegative}${prefix}-${partValue}`)
      }
    }
    cacheSet(bracketExpansionCache, cacheKey, results)
    return results
  }

  const results: string[] = []

  // Normal expansion for each part
  for (const part of parts) {
    // Check for variant inside brackets: flex[md:col lg:row]
    const innerVariantMatch = part.match(/^([a-z@][a-z0-9-]*):(.+)$/i)
    let innerVariant = ''
    let partValue = part

    if (innerVariantMatch && variantPrefixes.has(innerVariantMatch[1])) {
      innerVariant = `${innerVariantMatch[1]}:`
      partValue = innerVariantMatch[2]
    }

    // Handle negative values inside brackets: m[-4]
    let partNegative = ''
    if (partValue.startsWith('-')) {
      partNegative = '-'
      partValue = partValue.slice(1)
    }

    // Handle important modifier: p[4!] -> !p-4
    let important = ''
    if (partValue.endsWith('!')) {
      important = '!'
      partValue = partValue.slice(0, -1)
    }

    const expanded = mapping.expand(partValue, aliases)
    if (expanded) {
      const neg = isNegative ? '-' : ''
      results.push(`${variantPrefix}${innerVariant}${important}${neg}${partNegative}${expanded}`)
    }
  }

  cacheSet(bracketExpansionCache, cacheKey, results)
  return results
}

/**
 * Extract classes from attributify syntax
 * e.g., <div tc-flex tc-items-center tc-bg="blue-500" tc-p="4">
 * Returns classes like: flex, items-center, bg-blue-500, p-4
 *
 * Also supports variant attributes:
 * e.g., <div tc-hover:bg="blue-600" tc-dark:text="white">
 * Returns classes like: hover:bg-blue-600, dark:text-white
*/
export function extractAttributifyClasses(content: string, config?: AttributifyConfig): Set<string> {
  const classes = new Set<string>()

  if (!config?.enabled) {
    return classes
  }

  const prefix = config.prefix ?? 'tc-'
  const defaultIgnoreList = [
    'class',
    'className',
    'style',
    'id',
    'name',
    'type',
    'value',
    'href',
    'src',
    'alt',
    'title',
    'role',
    'for',
    'action',
    'method',
    'target',
    'rel',
    'placeholder',
    'disabled',
    'checked',
    'selected',
    'readonly',
    'required',
    'maxlength',
    'minlength',
    'pattern',
    'autocomplete',
    'autofocus',
    'tabindex',
    'contenteditable',
    'draggable',
    'spellcheck',
    'lang',
    'dir',
    'hidden',
    'slot',
    'part',
    'is',
    'key',
    'ref',
  ]
  const ignoreList = config.ignoreAttributes || defaultIgnoreList

  const shouldIgnore = (attr: string): boolean => {
    // Remove any variant prefix for ignore check
    const baseAttr = attr.includes(':') ? attr.split(':').pop()! : attr

    // Check ignore list
    for (const pattern of ignoreList) {
      if (pattern.endsWith('*')) {
        if (baseAttr.startsWith(pattern.slice(0, -1))) return true
      }
else if (baseAttr === pattern) {
        return true
      }
    }
    // Also ignore attributes starting with on (event handlers)
    if (baseAttr.startsWith('on')) return true
    // Ignore data-* and aria-*
    if (baseAttr.startsWith('data-') || baseAttr.startsWith('aria-')) return true
    return false
  }

  // Extract all attributes from all tags
  // Match each tag separately
  const tagPattern = /<([a-z][a-z0-9-]*)\s([^>]*)>/gi
  let tagMatch

  // eslint-disable-next-line no-cond-assign
  while ((tagMatch = tagPattern.exec(content)) !== null) {
    const attributesStr = tagMatch[2]

    // Parse attributes from this tag
    // Match both value attributes and boolean attributes
    // Updated pattern to support colons in attribute names for variants: tc-hover:bg="blue-500"
    // Use greedy match for attribute name to capture full dark:hover:bg style names
    const attrPattern = /([a-z][a-z0-9-:]*)(?:=["']([^"']*)["'])?(?=\s|$|\/?>)/gi
    let attrMatch

    // eslint-disable-next-line no-cond-assign
    while ((attrMatch = attrPattern.exec(attributesStr)) !== null) {
      let attrName = attrMatch[1]
      const attrValue = attrMatch[2]

      // Handle prefix
      if (prefix) {
        if (!attrName.startsWith(prefix)) continue
        attrName = attrName.slice(prefix.length)
      }

      // Skip ignored attributes
      if (shouldIgnore(attrName)) continue

      // Check for variant prefix in attribute name: hover:bg, dark:text, etc.
      let variantPrefix = ''
      let utilityName = attrName

      // Extract variant(s) if present
      const variantMatch = attrName.match(/^((?:[a-z@][a-z0-9-]*:)+)([a-z][a-z0-9-]*)$/i)
      if (variantMatch) {
        const potentialVariants = variantMatch[1].slice(0, -1).split(':')
        // Verify all are valid variants
        const allVariants = potentialVariants.every(v => variantPrefixes.has(v))
        if (allVariants) {
          variantPrefix = variantMatch[1]
          utilityName = variantMatch[2]
        }
      }

      if (attrValue !== undefined) {
        // Value attribute: bg="blue-500" -> bg-blue-500
        // Or with variant: hover:bg="blue-600" -> hover:bg-blue-600
        const values = attrValue.split(/\s+/).filter(Boolean)
        for (const v of values) {
          const className = `${variantPrefix}${utilityName}-${v}`
          // Strip all variant prefixes for validation (e.g., dark:hover:bg-gray-800 -> bg-gray-800)
          if (isValidUtilityName(className.replace(/^(?:[a-z@][a-z0-9-]*:)+/gi, ''))) {
            classes.add(className)
          }
        }
      }
else {
        // Boolean attribute: flex -> flex
        // Or with variant: hover:underline -> hover:underline
        const className = `${variantPrefix}${utilityName}`
        if (isValidUtilityName(utilityName)) {
          classes.add(className)
        }
      }
    }
  }

  return classes
}

/**
 * Check if a string looks like a valid utility name (for attributify)
 * More permissive than isValidClassName since we need to match potential utilities
*/
function isValidUtilityName(name: string): boolean {
  if (!name || name.length === 0) return false
  // Must start with letter, can contain letters, numbers, dashes, slashes (for fractions)
  // Can have arbitrary values in brackets
  return /^[a-z][a-z0-9-/]*(?:-\[[^\]]+\])?$/i.test(name)
}

/**
 * Parses a utility class string into its components
 * Examples: "p-4" -> {raw: "p-4", variants: [], utility: "p", value: "4", important: false, arbitrary: false}
 *          "hover:bg-blue-500" -> {raw: "hover:bg-blue-500", variants: ["hover"], utility: "bg", value: "blue-500", important: false, arbitrary: false}
 *          "!p-4" -> {raw: "!p-4", variants: [], utility: "p", value: "4", important: true, arbitrary: false}
 *          "w-[100px]" -> {raw: "w-[100px]", variants: [], utility: "w", value: "100px", important: false, arbitrary: true}
*/
export function parseClass(className: string): ParsedClass {
  // Check cache first
  const cached = parseCache.get(className)
  if (cached) {
    return cached
  }

  // parseClassImpl builds everything but `base`; fill it in place rather than
  // spreading into a new object, so parsing stays a single allocation.
  const result = parseClassImpl(className) as ParsedClass
  result.base = stripVariantsAndImportant(result)
  cacheSet(parseCache, className, result)
  return result
}

const OPACITY_UTILITIES = new Set([
  'bg', 'text', 'border', 'ring', 'placeholder', 'divide', 'accent', 'caret',
  'fill', 'stroke', 'outline', 'decoration', 'shadow', 'ring-offset',
  'from', 'via', 'to',
])
const OPACITY_VALUE_RE = /^(.+?)\/(\d+|\[\d*\.?\d+\])$/
const FRACTION_VALUE_RE = /^(\d+)\/(\d+)$/

/**
 * Split a utility token into its name and value at the first dash, requiring
 * the name to be dash-separated runs of lowercase letters and the value to be
 * non-empty: `bg-red-500` → `['bg', 'red-500']`.
 *
 * Replaces `/^([a-z]+(?:-[a-z]+)*?)-(.+)$/`, which matched the same strings
 * but through a nested unbounded quantifier — the classic super-linear
 * backtracking shape, and paid for on every class that reaches this point.
 * A single left-to-right scan is both linear and allocation-free.
 */
function splitUtilityValue(token: string): [string, string] | undefined {
  let segmentHasLetter = false
  for (let i = 0; i < token.length; i++) {
    const code = token.charCodeAt(i)
    if (code === 45) { // '-'
      // An empty segment (leading or doubled dash) can't start a utility name.
      if (!segmentHasLetter || i + 1 >= token.length)
        return undefined
      return [token.slice(0, i), token.slice(i + 1)]
    }
    if (code >= 97 && code <= 122) { // a-z
      segmentHasLetter = true
      continue
    }
    // Anything else before the first dash means there is no valid name here.
    return undefined
  }
  return undefined
}

/**
 * Strip variant prefixes and the important marker off `raw`, leaving the bare
 * utility token. Computed once per class and memoized alongside the rest of
 * the parse, so whole-class lookups cost nothing extra at match time.
 */
function stripVariantsAndImportant(parsed: Omit<ParsedClass, 'base'>): string {
  let base = parsed.raw
  for (const variant of parsed.variants) {
    if (base.startsWith(`${variant}:`))
      base = base.slice(variant.length + 1)
  }
  if (parsed.important) {
    // Prefix form (`!p-4`, and `hover:!p-4` once the variant is gone) or the
    // v4 suffix form (`p-4!`).
    if (base.charCodeAt(0) === 33)
      base = base.slice(1)
    else if (base.charCodeAt(base.length - 1) === 33)
      base = base.slice(0, -1)
  }
  return base
}

/**
 * Internal implementation of parseClass
*/
function parseClassImpl(className: string): Omit<ParsedClass, 'base'> {
  // Check for important modifier. Supports both Tailwind v3 prefix form
  // (`!p-4`) and v4 suffix form (`p-4!`). Suffix form is checked BEFORE
  // rejecting arbitrary-value brackets so `p-4!` peels the bang off cleanly
  // while `p-[4]!` and `[color:red]!` still work.
  let important = false
  let cleanClassName = className
  if (className.startsWith('!')) {
    important = true
    cleanClassName = className.slice(1)
  }
  else if (className.endsWith('!') && className.length > 1) {
    important = true
    cleanClassName = className.slice(0, -1)
  }

  // Check for arbitrary properties BEFORE splitting on colons: [color:red], [mask-type:luminance]
  const arbitraryPropMatch = cleanClassName.match(/^\[([a-z-]+):(.+)\]$/)
  if (arbitraryPropMatch) {
    return {
      raw: className,
      variants: [],
      utility: arbitraryPropMatch[1],
      // Arbitrary properties follow the same underscore-as-space convention
      // as arbitrary values: `[background:center_/_cover]` needs to emit
      // `center / cover`. url() content is preserved by the helper.
      value: convertArbitraryUnderscores(arbitraryPropMatch[2]),
      important,
      arbitrary: true,
    }
  }

  // Check for arbitrary-value + arbitrary-modifier shape:
  //   text-[14px]/[1.5]       font-size with line-height
  //   bg-[#FF3E54]/[0.33]     background color with arbitrary alpha
  // The main preArbitraryMatch regex below ends on the last `]`, so when
  // there are two bracket pairs it would swallow the slash into the value.
  // Detect the shape first and split it cleanly.
  const preArbitraryWithModifierMatch = cleanClassName.match(
    /^((?:[a-z-]+:)*)(-?[a-z-]+?)-\[([^\]]+)\]\/\[([^\]]+)\]$/,
  )
  if (preArbitraryWithModifierMatch) {
    const [, variantPart, utilityRaw, bracketValue, modifier] = preArbitraryWithModifierMatch
    const variants = variantPart ? variantPart.split(':').filter(Boolean) : []
    const isNegative = utilityRaw.startsWith('-')
    const utilityName = isNegative ? utilityRaw.slice(1) : utilityRaw
    let value = convertArbitraryUnderscores(bracketValue)
    if (isNegative) value = value.startsWith('-') ? value : `-${value}`
    return {
      raw: className,
      variants,
      utility: utilityName,
      // Encode the modifier as `value/modifier` — rules that care (fontSizeRule
      // for line-height, colorRule for alpha) split on the first slash.
      value: `${value}/${modifier}`,
      important,
      arbitrary: true,
      modifierArbitrary: true,
    }
  }

  // Check for arbitrary values with brackets BEFORE splitting on colons
  // This handles cases like bg-[url(https://...)] where the URL contains colons
  // Also handles type hints like text-[color:var(--muted)]
  const preArbitraryMatch = cleanClassName.match(/^((?:[a-z-]+:)*)(-?[a-z-]+?)-\[(.+)\]$/)
  if (preArbitraryMatch) {
    const variantPart = preArbitraryMatch[1]
    const variants = variantPart ? variantPart.split(':').filter(Boolean) : []

    // Detect a leading `-` on the utility — Tailwind-style negative arbitrary
    // values like `-mt-[20px]` or `-translate-x-[50%]`. Strip the sign from
    // the utility name and fold it onto the value so rules that match
    // `utility === 'mt'` still fire.
    let utilityName = preArbitraryMatch[2]
    const isNegative = utilityName.startsWith('-')
    if (isNegative) utilityName = utilityName.slice(1)

    let value = convertArbitraryUnderscores(preArbitraryMatch[3])
    let typeHint: string | undefined

    // Check for type hint in arbitrary value: text-[color:var(--muted)]
    // Type hints are: color, length, url, number, percentage, position, etc.
    // Don't match if it looks like a CSS variable var(--...) or CSS function
    const typeHintMatch = value.match(/^(color|length|url|number|percentage|position|line-width|absolute-size|relative-size|image|angle|time|flex|string|family-name):(.*)/i)
    if (typeHintMatch) {
      typeHint = typeHintMatch[1].toLowerCase()
      value = typeHintMatch[2]
    }

    if (isNegative) value = value.startsWith('-') ? value : `-${value}`

    return {
      raw: className,
      variants,
      utility: utilityName,
      value,
      important,
      arbitrary: true,
      typeHint,
    }
  }

  // Split on colons, but preserve colons inside brackets [...]
  const parts: string[] = []
  let current = ''
  let bracketDepth = 0
  for (let i = 0; i < cleanClassName.length; i++) {
    const ch = cleanClassName[i]
    if (ch === '[') bracketDepth++
    else if (ch === ']') bracketDepth--
    if (ch === ':' && bracketDepth === 0) {
      parts.push(current)
      current = ''
    }
    else {
      current += ch
    }
  }
  parts.push(current)

  let utility = parts[parts.length - 1]
  const variants = parts.slice(0, -1)

  // Handle `!` placed between the last variant and the utility
  // (`hover:!bg-red-500`). After splitting on `:`, the bang sits at the
  // start of the utility token. Strip it and flag important. Mirror the
  // trailing form too (`hover:p-4!`) for consistency with the top-of-file
  // bang handling that covered the no-variant case.
  if (utility.startsWith('!') && utility.length > 1) {
    important = true
    utility = utility.slice(1)
  }
  else if (utility.endsWith('!') && utility.length > 1) {
    important = true
    utility = utility.slice(0, -1)
  }

  // cleanClassName is used below for the subsequent arbitrary-value /
  // negative-value branches that rebuild the parsed shape from scratch.
  // Keep it in sync with the stripped utility so those branches see the
  // same token.
  if (variants.length > 0) {
    cleanClassName = `${variants.join(':')}:${utility}`
  }
  else {
    cleanClassName = utility
  }

  // Check for full utility names that should not be split
  const fullUtilityNames = [
    // Display utilities
    'inline-block',
    'inline-flex',
    'inline-grid',
    // Flex utilities without values
    'flex-row',
    'flex-row-reverse',
    'flex-col',
    'flex-col-reverse',
    'flex-wrap',
    'flex-wrap-reverse',
    'flex-nowrap',
    'flex-1',
    'flex-auto',
    'flex-initial',
    'flex-none',
    'flex-grow',
    'flex-shrink',
  ]
  if (fullUtilityNames.includes(utility)) {
    return {
      raw: className,
      variants,
      utility,
      value: undefined,
      important,
      arbitrary: false,
    }
  }

  // Check for arbitrary values: w-[100px] or bg-[#ff0000] or text-[color:var(--muted)]
  const arbitraryMatch = utility.match(/^([a-z-]+?)-\[(.+?)\]$/)
  if (arbitraryMatch) {
    let value = convertArbitraryUnderscores(arbitraryMatch[2])
    let typeHint: string | undefined

    // Check for type hint in arbitrary value: text-[color:var(--muted)]
    // Type hints are: color, length, url, number, percentage, position, etc.
    const typeHintMatch = value.match(/^(color|length|url|number|percentage|position|line-width|absolute-size|relative-size|image|angle|time|flex|string|family-name):(.*)/i)
    if (typeHintMatch) {
      typeHint = typeHintMatch[1].toLowerCase()
      value = typeHintMatch[2]
    }

    return {
      raw: className,
      variants,
      utility: arbitraryMatch[1],
      value,
      important,
      arbitrary: true,
      typeHint,
    }
  }

  // Handle compound utilities with specific prefixes
  // grid-cols-3, grid-rows-2, translate-x-4, etc.
  const compoundPrefixes = [
    // Position utilities
    'inset-x',
    'inset-y',
    // Border side utilities (border-t-0, border-r-2, etc.)
    'border-t',
    'border-r',
    'border-b',
    'border-l',
    'border-x',
    'border-y',
    // Logical border utilities (for RTL support)
    'border-s',
    'border-e',
    'grid-cols',
    'grid-rows',
    'grid-flow',
    'auto-cols',
    'auto-rows',
    'col-span',
    'row-span',
    'col-start',
    'col-end',
    'row-start',
    'row-end',
    'translate-x',
    'translate-y',
    'translate-z',
    'scale-x',
    'scale-y',
    'scale-z',
    'rotate-x',
    'rotate-y',
    'rotate-z',
    'skew-x',
    'skew-y',
    'scroll-m',
    'scroll-mx',
    'scroll-my',
    'scroll-mt',
    'scroll-mr',
    'scroll-mb',
    'scroll-ml',
    'scroll-p',
    'scroll-px',
    'scroll-py',
    'scroll-pt',
    'scroll-pr',
    'scroll-pb',
    'scroll-pl',
    'gap-x',
    'gap-y',
    'overflow-x',
    'overflow-y',
    'min-w',
    'max-w',
    'min-h',
    'max-h',
    'space-x',
    'space-y',
    'ring-offset',
    'underline-offset',
    'outline-offset',
    'backdrop-blur',
    'backdrop-brightness',
    'backdrop-contrast',
    'backdrop-grayscale',
    'backdrop-invert',
    'backdrop-saturate',
    'backdrop-sepia',
    'hue-rotate',
    'drop-shadow',
    'mask-clip',
    'flex-grow',
    'flex-shrink',
    'mask-composite',
    'mask-image',
    'mask-mode',
    'mask-origin',
    'mask-position',
    'mask-repeat',
    'mask-size',
    'mask-type',
    'perspective-origin',
    'justify-self',
    'form-input',
    'form-textarea',
    'form-select',
    'form-multiselect',
    'form-checkbox',
    'form-radio',
    'mix-blend',
    'bg-blend',
    'line-clamp',
    'border-spacing',
    'border-spacing-x',
    'border-spacing-y',
    'rounded-s',
    'rounded-e',
    'rounded-ss',
    'rounded-se',
    'rounded-es',
    'rounded-ee',
    // Physical rounded sides + corners (rounded-t-lg, rounded-tr-[6px], etc.).
    // The generator has fast-path lookups for specific size keywords, but
    // these prefixes are needed so arbitrary values and custom sizes fall
    // through to the rule handlers that accept any value.
    'rounded-t',
    'rounded-r',
    'rounded-b',
    'rounded-l',
    'rounded-tl',
    'rounded-tr',
    'rounded-bl',
    'rounded-br',
    'border-opacity',
    'ring-opacity',
    'stroke-dasharray',
    'stroke-dashoffset',
    'animate-iteration',
    'animate-duration',
    'animate-delay',
    // `text-emphasis-color` must precede `text-emphasis`: the loop returns on
    // the first `startsWith` match, so the more specific prefix has to win or
    // `text-emphasis-color-red-500` parses as `text-emphasis` / `color-red-500`.
    'text-emphasis-color',
    'text-emphasis',
    // `text-shadow` must be a compound prefix or `text-shadow-sm` parses as
    // `text` / `shadow-sm` and the text-shadow rule never matches at all.
    'text-shadow',
    'word-spacing',
    'column-gap',
    'column-rule',
    // Without these the parser splits at the first dash — `font-stretch-expanded`
    // parsed as `font` / `stretch-expanded` and `list-image-none` as `list` /
    // `image-none`, so fontStretchRule and listStyleImageRule (which match on
    // the compound utility name) never fired for any input.
    'font-stretch',
    'list-image',
  ]

  // Special case for divide-x and divide-y (without values, they should be treated as compound)
  // divide-x -> utility: "divide-x", value: undefined
  // divide-x-2 -> utility: "divide-x", value: "2"
  if (utility === 'divide-x' || utility === 'divide-y') {
    return {
      raw: className,
      variants,
      utility,
      value: undefined,
      important,
      arbitrary: false,
    }
  }

  // Check for divide-x-{width} and divide-y-{width}
  const divideMatch = utility.match(/^(divide-[xy])-(.+)$/)
  if (divideMatch) {
    return {
      raw: className,
      variants,
      utility: divideMatch[1],
      value: divideMatch[2],
      important,
      arbitrary: false,
    }
  }

  for (const prefix of compoundPrefixes) {
    if (utility.startsWith(`${prefix}-`)) {
      return {
        raw: className,
        variants,
        utility: prefix,
        value: utility.slice(prefix.length + 1),
        important,
        arbitrary: false,
      }
    }
  }

  // Check for negative values: -m-4, -top-4, -translate-x-4
  if (utility.startsWith('-')) {
    const positiveUtility = utility.slice(1)

    // Try compound prefixes first
    for (const prefix of compoundPrefixes) {
      if (positiveUtility.startsWith(`${prefix}-`)) {
        return {
          raw: className,
          variants,
          utility: prefix,
          value: `-${positiveUtility.slice(prefix.length + 1)}`,
          important,
          arbitrary: false,
        }
      }
    }

    // Regular negative value
    const split = splitUtilityValue(positiveUtility)
    if (split) {
      return {
        raw: className,
        variants,
        utility: split[0],
        value: `-${split[1]}`,
        important,
        arbitrary: false,
      }
    }
    // If no match, it's a standalone utility with just a negative sign (e.g., -flex doesn't make sense)
    // Return as-is
    return {
      raw: className,
      variants,
      utility: positiveUtility,
      value: undefined,
      important,
      arbitrary: false,
    }
  }

  // Check for color opacity modifiers: bg-blue-500/50, text-red-500/75, bg-white/[0.04]
  // Must come before fractional values to avoid conflict.
  // Gradient stops (from/via/to) accept opacity too — `from-red-500/50`.
  const split = splitUtilityValue(utility)
  if (split) {
    const [utilityName, rest] = split
    const opacityMatch = rest.match(OPACITY_VALUE_RE)
    if (opacityMatch && OPACITY_UTILITIES.has(utilityName)) {
      return {
        raw: className,
        variants,
        utility: utilityName,
        value: `${opacityMatch[1]}/${opacityMatch[2]}`,
        important,
        arbitrary: false,
      }
    }

    // Check for fractional values: w-1/2, h-3/4
    const fractionMatch = rest.match(FRACTION_VALUE_RE)
    if (fractionMatch) {
      return {
        raw: className,
        variants,
        utility: utilityName,
        value: `${fractionMatch[1]}/${fractionMatch[2]}`,
        important,
        arbitrary: false,
      }
    }

    // Regular utility-value pattern (e.g., text-current, p-4)
    return {
      raw: className,
      variants,
      utility: utilityName,
      value: rest,
      important,
      arbitrary: false,
    }
  }

  // If no dash, treat entire string as utility with no value (e.g., flex, block)
  return {
    raw: className,
    variants,
    utility,
    value: undefined,
    important,
    arbitrary: false,
  }
}


/**
 * Validates if a string is a valid Tailwind utility class name
 * Supports arbitrary values like z-[1], w-[100px], bg-[#ff0000]
 * Supports variants like hover:, focus:, sm:, md:
 * Supports important modifier !
 * Supports negative values like -m-4
 * Supports bracket syntax like flex[col jc-center] when enabled
 * Supports colon syntax like bg:black when enabled
*/
function isValidClassName(name: string, bracketConfig?: BracketSyntaxConfig): boolean {
  // Quick check for obviously invalid names
  if (!name || name.length === 0) return false

  // Arbitrary properties like [color:red], [mask-type:luminance]
  if (/^\[[a-z-]+:[^\]]+\]$/i.test(name)) return true

  // Bracket syntax: flex[col jc-center ai-center]
  if (bracketConfig?.enabled && /^[a-z]+\[[^\]]+\]$/i.test(name)) return true

  // Colon syntax: bg:black, w:100%
  if (bracketConfig?.colonSyntax && /^[a-z]+:[^[\]:]+$/i.test(name)) return true

  // Standard utility classes with optional:
  // - ! prefix (important)
  // - - prefix (negative values)
  // - Arbitrary values in brackets like -[100px] or -[#ff0000]
  // - Variant prefixes with colons like hover:, sm:, focus:
  // - Decimal values like py-2.5, gap-0.5
  // - Opacity modifiers like bg-white/55, ring-black/[0.06]
  //
  // The modifier was missing, which made this reject every `.../<n>` class the
  // generator happily builds. It only ever bit the paths that filter through
  // here — the unquoted-attribute fallback and code strings — so the same class
  // extracted fine from `class="bg-white/55"` and vanished from
  // `const cls = 'bg-white/55'`.
  const segment = String.raw`!?-?[a-z][a-z0-9.-]*(?:-\[[^\]]+\])?(?:\/(?:[\w.]+|\[[^\]]+\]))?`
  return new RegExp(`^${segment}(?::${segment})*$`, 'i').test(name)
}

/**
 * Split class string preserving bracket groups
 * e.g., "flex[col jc-center] bg:black p-4" -> ["flex[col jc-center]", "bg:black", "p-4"]
*/
function splitClassString(classStr: string): string[] {
  const classes: string[] = []
  let current = ''
  let bracketDepth = 0

  for (const char of classStr) {
    if (char === '[') {
      bracketDepth++
      current += char
    }
else if (char === ']') {
      bracketDepth--
      current += char
    }
else if (/\s/.test(char) && bracketDepth === 0) {
      if (current) {
        classes.push(current)
        current = ''
      }
    }
else {
      current += char
    }
  }

  if (current) {
    classes.push(current)
  }

  return classes
}

/**
 * Extracts all utility classes from content
 * Matches class patterns in HTML/JSX attributes and template strings
 * Supports bracket syntax (e.g., flex[col jc-center]) and attributify mode
*/
export function extractClasses(content: string, options?: ExtractClassesOptions): Set<string> {
  const classes = new Set<string>()

  // Match class="..." and className="..." and className={...}
  const patterns = [
    // eslint-disable-next-line quotes
    /class(?:Name)?=["']([^"']+)["']/g,
    /class(?:Name)?=\{["']([^"']+)["']\}/g,
    /class(?:Name)?=\{`([^`]+)`\}/g,
  ]

  for (const pattern of patterns) {
    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(content)) !== null) {
      const classStr = match[1]
      // Extract all quoted strings from the class string (handles template literals with expressions)
      const quotedStrings = classStr.match(/["']([^"']+)["']/g)
      if (quotedStrings) {
        for (const quoted of quotedStrings) {
          const cleaned = quoted.replace(/["']/g, '')
          const classNames = splitClassString(cleaned)
          for (const className of classNames) {
            addClassWithExpansion(classes, className, options)
          }
        }
      }

      // Also extract classes not in quotes (for simple cases)
      const cleanedStr = classStr
        .replace(/["'`]/g, ' ')
        .replace(/\$\{[^}]+\}/g, ' ')

      const classNames = splitClassString(cleanedStr)
        .filter(name => isValidClassName(name, options?.bracketSyntax))

      for (const className of classNames) {
        addClassWithExpansion(classes, className, options)
      }
    }
  }

  // Expression-valued class attributes: className={clsx('a', cond && 'b')},
  // className={['a', 'b']}, Astro's class:list={[...]}, Vue's :class="[...]",
  // stx's x-class="cond ? 'a' : 'b'". None of these start with a quote right
  // after `={`, so the patterns above miss them entirely and their classes
  // silently never generate. Only quoted string literals inside the expression
  // are extracted — bare identifiers there are code (clsx, cond, &&), not
  // class names.
  //
  // `x-class` is the same shape as `:class` and needs the same treatment: an
  // stx template that picks its active-state colour in an `x-class` ternary
  // gets no rule for it, so the element renders with the layout applied and
  // the colour missing — white text on nothing.
  const expressionPatterns = [
    /class(?:Name|:list)?=\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
    /:class="([^"]*)"/g,
    /:class='([^']*)'/g,
    /\bx-class="([^"]*)"/g,
    /\bx-class='([^']*)'/g,
  ]
  for (const pattern of expressionPatterns) {
    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(content)) !== null) {
      const quotedStrings = match[1].match(/["'`]([^"'`]+)["'`]/g)
      if (quotedStrings) {
        for (const quoted of quotedStrings) {
          const cleaned = quoted.replace(/["'`]/g, '').replace(/\$\{[^}]+\}/g, ' ')
          for (const className of splitClassString(cleaned)) {
            addClassWithExpansion(classes, className, options)
          }
        }
      }
    }
  }

  // String literals in code. See CodeStringsConfig for why this is not
  // optional in practice.
  if (options?.codeStrings?.enabled !== false) {
    for (const token of extractCodeStringCandidates(content, options?.bracketSyntax)) {
      addClassWithExpansion(classes, token, options)
    }
  }

  // Extract attributify classes if enabled
  if (options?.attributify?.enabled) {
    const attributifyClasses = extractAttributifyClasses(content, options.attributify)
    for (const cls of attributifyClasses) {
      classes.add(cls)
    }
  }

  return classes
}

/**
 * Is this token worth taking from a *code* string?
 *
 * Attributes may say `class="flex"`, and a bare word there is unambiguous: the
 * author is naming a class. A bare word inside a code string is not — `'block'`
 * is far more likely to be a variable's value, an enum member or a word in a
 * sentence than a request for `display: block`. Accepting those would emit CSS
 * nobody asked for, and the offenders are exactly the short English words that
 * appear most often in code: block, table, grid, fixed, static, hidden.
 *
 * So a code-string token has to be *compound* — it must carry a variant
 * separator, an arbitrary-value bracket, an opacity slash or a namespace dash.
 * That is a property no prose word has and every real utility beyond the
 * single-word display helpers does: `bg-blue-500`, `hover:bg-white/55`,
 * `text-[13px]`, `i-hugeicons-search-01`, `dark:ring-white/10`.
 *
 * The rule is deliberately syntactic rather than a list of known namespaces:
 * a project's own custom rules and icon collections have namespaces this file
 * cannot know, and they should work without registering anything here.
 */
function isCodeStringCandidate(token: string, bracketConfig?: BracketSyntaxConfig): boolean {
  if (!/[-:/[]/.test(token))
    return false
  // A leading or trailing dash is punctuation or a range in prose ("well-"),
  // never a utility.
  if (token.startsWith('-') && !/^-[a-z]/i.test(token))
    return false
  return isValidClassName(token, bracketConfig)
}

/**
 * Collect candidate class names from every string literal in `content`.
 *
 * Quote handling follows JavaScript rather than being generic, because getting
 * it wrong is how a scanner silently loses classes. `'` and `"` literals stop
 * at end of line — that is what keeps an apostrophe in a comment ("don't") from
 * opening a span that swallows the rest of the file. Backticks may span lines,
 * and their `${…}` holes are code, so they are blanked out rather than read.
 */
function extractCodeStringCandidates(content: string, bracketConfig?: BracketSyntaxConfig): Set<string> {
  const tokens = new Set<string>()
  const length = content.length
  let i = 0
  // The last significant character outside strings and comments, for telling
  // a regex literal's `/` from division.
  let lastSig = ''

  while (i < length) {
    const quote = content[i]

    // Comments and regex literals are skipped whole. Read as code they are
    // what desynchronises the quote tracking: a backtick in a doc comment
    // ("returns `null`") opened a multi-line "template" that swallowed code up
    // to the next backtick, a quote inside /[&<>"']/ opened a "string", and
    // from then on every literal's quotes were read inside out. In a page
    // that inlines a bundled library before its own script, that silently
    // dropped every class named in the page's code.
    if (quote === '/' && content[i + 1] === '/') {
      const end = content.indexOf('\n', i)
      i = end === -1 ? length : end
      continue
    }
    if (quote === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i + 2)
      i = end === -1 ? length : end + 2
      continue
    }
    if (quote === '/' && !/[\w$)\]]/.test(lastSig)) {
      const end = regexLiteralEnd(content, i)
      if (end !== -1) {
        i = end
        lastSig = ')'
        continue
      }
    }
    if (quote !== '"' && quote !== '\'' && quote !== '`') {
      if (!/\s/.test(quote))
        lastSig = quote
      i++
      continue
    }
    lastSig = ')'

    const markupAttribute = isMarkupAttributeString(content, i)
    const multiline = quote === '`'
    let j = i + 1
    let literal = ''
    let closed = false

    while (j < length) {
      const char = content[j]

      if (char === '\\') {
        // Escaped character: keep the payload, skip the backslash. A class name
        // never contains one, so this only matters for not ending the span.
        literal += content[j + 1] ?? ''
        j += 2
        continue
      }
      if (char === quote) {
        closed = true
        j++
        break
      }
      if (!multiline && char === '\n') {
        // Unterminated single-line literal: almost certainly an apostrophe in
        // prose. Resume scanning from just after it rather than from the end,
        // so a real literal later on the same line is still seen.
        break
      }
      if (multiline && char === '$' && content[j + 1] === '{') {
        // Skip the interpolation, tracking nesting so an object literal or a
        // nested template inside it does not end the hole early.
        let depth = 1
        j += 2
        while (j < length && depth > 0) {
          if (content[j] === '{') depth++
          else if (content[j] === '}') depth--
          j++
        }
        literal += ' '
        continue
      }

      literal += char
      j++
    }

    if (closed) {
      // Attribute extraction above owns every quoted value inside a markup
      // tag. Treating unrelated values such as CSRF tokens, URLs, or v-html
      // payloads as code strings creates phantom utility classes and can make
      // a classless fragment emit an entire preflight stylesheet.
      if (markupAttribute) {
        i = j
        continue
      }
      for (const token of splitClassString(literal)) {
        if (isCodeStringCandidate(token, bracketConfig))
          tokens.add(token)
      }
      i = j
    }
    else {
      i++
    }
  }

  return tokens
}

/**
 * Index just past the regex literal whose `/` is at `start`, or -1 when no
 * literal closes on the same line (then it was division after all).
 */
function regexLiteralEnd(content: string, start: number): number {
  let inClass = false
  for (let j = start + 1; j < content.length; j++) {
    const char = content[j]
    if (char === '\n')
      return -1
    if (char === '\\') {
      j++
      continue
    }
    if (char === '[')
      inClass = true
    else if (char === ']')
      inClass = false
    else if (char === '/' && !inClass) {
      let end = j + 1
      while (end < content.length && /[a-z]/i.test(content[end]!)) end++
      return end
    }
  }
  return -1
}

function isMarkupAttributeString(content: string, quoteIndex: number): boolean {
  const tagStart = content.lastIndexOf('<', quoteIndex)
  const tagEnd = content.lastIndexOf('>', quoteIndex)
  if (tagStart <= tagEnd)
    return false

  const firstTagChar = content[tagStart + 1]
  if (!firstTagChar || !/[A-Za-z!/]/.test(firstTagChar))
    return false

  let cursor = quoteIndex - 1
  while (cursor > tagStart && /\s/.test(content[cursor]))
    cursor--

  if (content[cursor] === '=')
    return true

  // JSX template literals use className={`...`}; the backtick is wrapped by
  // a single expression brace immediately after the assignment.
  if (content[cursor] === '{') {
    cursor--
    while (cursor > tagStart && /\s/.test(content[cursor]))
      cursor--
    return content[cursor] === '='
  }

  return false
}

/**
 * Helper to add a class with potential bracket syntax expansion
*/
function addClassWithExpansion(classes: Set<string>, className: string, options?: ExtractClassesOptions): void {
  if (options?.bracketSyntax?.enabled) {
    // Check if this is bracket or colon syntax
    const hasBracket = /^[a-z]+\[[^\]]+\]$/i.test(className)
    const hasColon = options.bracketSyntax.colonSyntax && /^[a-z]+:[^[\]]+$/i.test(className)

    if (hasBracket || hasColon) {
      const expanded = expandBracketSyntax(className, options.bracketSyntax)
      for (const cls of expanded) {
        classes.add(cls)
      }
      return
    }
  }
  classes.add(className)
}
