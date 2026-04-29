/**
 * String compressor — picks the quote style with fewer escapes.
 *
 * `String.split(q).length - 1` is the conventional "count occurrences"
 * idiom but it allocates the intermediate array; for typical CSS strings
 * the value is short, but a tight indexOf-based count is cheaper and
 * doesn't churn the GC when the same string flows through repeatedly.
 */

// eslint-disable-next-line pickier/no-unused-vars
export function compressString(value: string): string {
  let dq = 0
  let sq = 0
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c === 34 /* " */) dq++
    else if (c === 39 /* ' */) sq++
  }
  if (dq <= sq) {
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return `'${value.replace(/'/g, '\\\'')}'`
}
