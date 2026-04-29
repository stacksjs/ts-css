/**
 * URL compressor: drop quotes when the inner string is "URL-safe" (no
 * whitespace, no parens, no quotes, no backslash). Manual char scan is a
 * smidge faster than `RegExp.test` and avoids the per-call regex
 * lastIndex bookkeeping the runtime does for `g`-style patterns.
 */

// eslint-disable-next-line pickier/no-unused-vars
export function compressUrl(value: string): string {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (
      c === 34 /* " */ || c === 39 /* ' */ || c === 40 /* ( */ || c === 41 /* ) */
      || c === 92 /* \ */ || c === 32 || c === 9 || c === 10 || c === 12 || c === 13
    ) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
  }
  return value
}
