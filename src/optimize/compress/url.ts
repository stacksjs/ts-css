/**
 * URL compressor: drop quotes when the inner string is "URL-safe" (no
 * whitespace, no parens, no quotes).
 */

const UNSAFE = /["'()\s]/

export function compressUrl(value: string): string {
  if (UNSAFE.test(value))
    return `"${value.replace(/"/g, '\\"')}"`
  return value
}
