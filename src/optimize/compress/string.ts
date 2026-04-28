/**
 * String compressor — picks the quote style with fewer escapes and
 * trims redundant backslashes.
 */

export function compressString(value: string): string {
  const dq = value.split('"').length - 1
  const sq = value.split('\'').length - 1
  if (dq <= sq) {
    // double-quote
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return `'${value.replace(/'/g, '\\\'')}'`
}
