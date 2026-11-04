import type { CSSGenerator } from './generator'
import type { Theme } from './types'

/**
 * Processing an authored stylesheet.
 *
 * The engine only ever scanned markup for class names, so hand-written
 * component CSS had nowhere to go but a `preflights` string or a framework
 * `<style>` block -- neither of which the engine reads. `@apply` written in
 * one shipped verbatim to the browser as an unknown at-rule, silently.
 *
 * This processes a stylesheet the author owns: `@apply` expands to the
 * declarations the named utilities produce, and `theme()` reads the
 * registered theme. Both are driven from the real generator, so a utility
 * expands to exactly what it would have emitted on its own.
 *
 * Nesting is left as written. It is native CSS, and flattening it here would
 * mean re-implementing a selector resolver the browser already has.
 */

export interface StylesheetResult {
  css: string
  /** Utilities named by `@apply` that the engine could not generate. */
  unknownUtilities: string[]
  /** `theme()` lookups that resolved to nothing. */
  unknownThemePaths: string[]
}

/** `theme('colors.red.500')`, `theme(spacing.4)` — quotes optional. */
const THEME_CALL = /\btheme\(\s*(['"]?)([^'")]+)\1\s*\)/g
/**
 * An `@apply a b c;` anywhere, not only on a line of its own -- a one-line
 * block (`.btn:focus { @apply underline; }`) is ordinary authored CSS, and
 * anchoring to the line skipped those silently, bad utility names included.
 */
const APPLY_AT_RULE = /@apply\s+([^;}]+);?/g

/** Walk a dotted path through the theme: `colors.red.500`, `spacing.4`. */
function lookupTheme(theme: Theme, path: string): string | undefined {
  let current: unknown = theme
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object')
      return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  if (typeof current === 'string')
    return current
  // fontSize is a [size, { lineHeight }] pair; the size is what `theme()` means.
  if (Array.isArray(current) && typeof current[0] === 'string')
    return current[0]
  return undefined
}

export function resolveThemeCalls(css: string, theme: Theme): { css: string, unknown: string[] } {
  const unknown: string[] = []
  const resolved = css.replace(THEME_CALL, (whole, _quote, path: string) => {
    const value = lookupTheme(theme, path.trim())
    if (value === undefined) {
      unknown.push(path.trim())
      return whole
    }
    return value
  })
  return { css: resolved, unknown }
}

/**
 * The selector an expanded utility needs, relative to the block it was
 * applied in.
 *
 * A utility's own selector carries whatever its variants added:
 * `hover:underline` generates `.hover\:underline:hover`. Dropping the class
 * part and keeping the rest gives `:hover`, which belongs on the host
 * selector -- so `@apply hover:underline` inside `.btn` is `.btn:hover`.
 */
function hostSelector(host: string, utilitySelector: string, escapedClass: string): string {
  const own = `.${escapedClass}`
  if (!utilitySelector.startsWith(own))
    return utilitySelector.includes('&') ? utilitySelector.replace(/&/g, host) : host
  const suffix = utilitySelector.slice(own.length)
  return `${host}${suffix}`
}

/**
 * `indent` prefixes every line but the first: the text being replaced already
 * sits after the indentation the author wrote, so indenting the first line
 * again would push it out past the rest.
 */
function declarationsToCSS(properties: Record<string, string>, indent: string): string {
  return Object.entries(properties).map(([property, value]) => `${property}: ${value};`).join(`\n${indent}`)
}

/**
 * Expand every `@apply` in a stylesheet.
 *
 * Declarations from an unvariated utility are written where the `@apply` was,
 * so they sit in the author's own block and keep its cascade position. A
 * utility that carries a variant or a media query cannot go there -- it needs
 * its own selector -- so those are collected and appended after the sheet, in
 * the order they were applied.
 */
export function expandApply(css: string, generator: CSSGenerator): { css: string, unknown: string[] } {
  const unknown: string[] = []
  const trailing: string[] = []

  // The selector of the block each @apply sits in, found by counting braces
  // back from the match. Good enough for authored component CSS, and it never
  // guesses: with no enclosing block the @apply is reported as unknown.
  const expanded = css.replace(APPLY_AT_RULE, (whole, list: string, offset: number) => {
    const before = css.slice(0, offset)
    const open = before.lastIndexOf('{')
    if (open === -1)
      return whole
    const selectorStart = Math.max(before.lastIndexOf('}', open), before.lastIndexOf(';', open), before.lastIndexOf('{', open - 1)) + 1
    const host = before.slice(selectorStart, open).trim()
    if (!host)
      return whole

    // Indentation of the line the @apply sits on, so the declarations it
    // becomes line up with whatever is around them.
    const lineStart = before.lastIndexOf('\n') + 1
    const indent = /^[ \t]*/.exec(before.slice(lineStart))?.[0] ?? ''

    // A nested block's real selector is its ancestors' too, which only the
    // browser resolves. Declarations written in place are unaffected, but a
    // variant needs a selector of its own, and `.title:hover` alone would be
    // the wrong rule -- so those are reported rather than quietly misplaced.
    let depth = 0
    for (const character of before) {
      if (character === '{')
        depth++
      else if (character === '}')
        depth--
    }
    const nested = depth > 1

    const inline: string[] = []
    for (const utility of list.trim().split(/\s+/)) {
      if (!utility)
        continue
      const rules = generator.rulesFor(utility)
      if (rules.length === 0) {
        unknown.push(utility)
        continue
      }
      const escaped = generator.escapeSelector(utility)
      for (const rule of rules) {
        const selector = hostSelector(host, rule.selector, escaped)
        const plain = selector === host && !rule.mediaQuery && !rule.childSelector
        if (plain) {
          inline.push(declarationsToCSS(rule.properties, indent))
          continue
        }
        if (nested) {
          unknown.push(utility)
          continue
        }
        const target = rule.childSelector ? `${selector} ${rule.childSelector}` : selector
        const block = `${target} {\n  ${declarationsToCSS(rule.properties, '  ')}\n}`
        trailing.push(rule.mediaQuery ? `${rule.mediaQuery} {\n${block}\n}` : block)
      }
    }
    return inline.join(`\n${indent}`)
  })

  return {
    css: trailing.length > 0 ? `${expanded}\n\n${trailing.join('\n\n')}` : expanded,
    unknown,
  }
}

/** Run an authored stylesheet through `theme()` and `@apply`. */
export function processStylesheet(css: string, generator: CSSGenerator, theme: Theme): StylesheetResult {
  const themed = resolveThemeCalls(css, theme)
  const applied = expandApply(themed.css, generator)
  return {
    css: applied.css,
    unknownUtilities: applied.unknown,
    unknownThemePaths: themed.unknown,
  }
}

/**
 * Whether a string still carries an `@apply`.
 *
 * A preflight is shipped verbatim, so an `@apply` written in one reaches the
 * browser as an unknown at-rule and is dropped without a word. Callers use
 * this to say so.
 */
export function containsApply(css: string): boolean {
  return /@apply\b/.test(css)
}
