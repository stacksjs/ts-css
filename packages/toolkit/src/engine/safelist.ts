import type { SafelistEntry } from './types'

/**
 * Resolving a safelist into class names.
 *
 * `safelist` took string literals only, and a pattern was rejected outright
 * while `blocklist`, on the same config object, compiled `*` globs. The
 * machinery existed on the exclusion side and never on the inclusion side,
 * which left a family of classes -- a colour cross-product driven by runtime
 * data, say -- as dozens of literals maintained by hand.
 *
 * The asymmetry is not quite symmetrical to fix: a blocklist pattern only has
 * to FILTER names the scanner already found, while a safelist pattern has to
 * PRODUCE names nothing in the source mentions. A regular expression cannot be
 * run backwards into the names that would match it, and there is no registry
 * of every generatable utility to test it against. So the two forms do
 * different jobs here, and both are honest about which:
 *
 * - brace expansion PRODUCES names, and is how a family is written:
 *   `{bg,text,border}-{red,blue}-{100,700}` is those twelve classes;
 * - a RegExp FILTERS the names already in play -- the expansions above and
 *   everything the scanner found -- which is how you keep a family that is
 *   used somewhere in the project present in every output.
 *
 * Both accept `variants`, applied as prefixes to each resolved name.
 */

/**
 * Expand `{a,b}` groups combinatorially: one group yields its alternatives,
 * several multiply. `{}` and `{a}` are not groups worth expanding and are
 * left alone, as is a string with no brace at all, which is the common case
 * and must stay exactly itself.
 *
 * Nested braces are not expanded; the inner text is taken literally.
 */
export function expandBraces(entry: string): string[] {
  const open = entry.indexOf('{')
  if (open === -1)
    return [entry]
  const close = entry.indexOf('}', open)
  if (close === -1)
    return [entry]

  const alternatives = entry.slice(open + 1, close).split(',')
  if (alternatives.length < 2)
    return [entry]

  const before = entry.slice(0, open)
  const after = entry.slice(close + 1)
  const expanded: string[] = []
  for (const alternative of alternatives) {
    for (const tail of expandBraces(after))
      expanded.push(`${before}${alternative.trim()}${tail}`)
  }
  return expanded
}

/** `['dark', 'hover']` on `bg-red-500` gives `dark:bg-red-500`, `hover:bg-red-500`. */
function withVariants(name: string, variants: readonly string[] | undefined): string[] {
  if (!variants || variants.length === 0)
    return [name]
  // The bare class is kept as well: a safelist naming variants still means
  // the class itself, which is what `safelist: ['bg-red-500']` would give.
  return [name, ...variants.map(variant => `${variant}:${name}`)]
}

/**
 * The class names a safelist asks for.
 *
 * `scanned` is what the extractor found, which is the pool a RegExp entry
 * filters. Pass an empty set when there is nothing scanned yet; literal and
 * brace entries do not depend on it.
 */
export function resolveSafelist(safelist: readonly SafelistEntry[], scanned: ReadonlySet<string> = new Set()): Set<string> {
  const resolved = new Set<string>()

  // Expansions join the pool a pattern filters, so a pattern may select from
  // a family that appears nowhere in the source.
  const literals: string[] = []
  for (const entry of safelist) {
    if (typeof entry === 'string') {
      for (const name of expandBraces(entry)) {
        literals.push(name)
        resolved.add(name)
      }
    }
  }

  const pool = [...new Set([...literals, ...scanned])]
  for (const entry of safelist) {
    if (typeof entry === 'string')
      continue
    const pattern = entry instanceof RegExp ? entry : entry.pattern
    const variants = entry instanceof RegExp ? undefined : entry.variants
    if (!(pattern instanceof RegExp))
      continue
    for (const candidate of pool) {
      // A /g regex carries lastIndex between calls, so the same pattern would
      // match every other candidate. Testing from a fresh index avoids making
      // the result depend on the order the pool happens to be in.
      pattern.lastIndex = 0
      if (pattern.test(candidate)) {
        for (const name of withVariants(candidate, variants))
          resolved.add(name)
      }
    }
  }

  return resolved
}
