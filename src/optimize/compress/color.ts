/**
 * Color shorthand compressor.
 *  - `#aabbcc` → `#abc` when each pair is a doubled hex digit
 *  - `rgb(255, 0, 0)` → `red`
 *  - `rgb(0, 0, 0)` → `#000` (handled by named-name table later)
 *
 * Lookup tables here are conservative — only the substitutions that
 * unambiguously shorten the bytes.
 */

const NAMED_TO_HEX: Record<string, string> = {
  black: '#000',
  fuchsia: '#f0f',
  white: '#fff',
  red: '#f00',
  cyan: '#0ff',
  blue: '#00f',
  yellow: '#ff0',
  magenta: '#f0f',
  lime: '#0f0',
  silver: '#c0c0c0',
  gray: '#808080',
  maroon: '#800000',
  olive: '#808000',
  green: '#008000',
  purple: '#800080',
  teal: '#008080',
  navy: '#000080',
}

const HEX_TO_SHORT_NAME: Record<string, string> = {
  '#f00': 'red',
  '#ff0000': 'red',
  '#000080': 'navy',
  '#008080': 'teal',
}

export function shortenHex(hex: string): string {
  if (!hex.startsWith('#'))
    return hex
  const body = hex.slice(1)
  if (body.length === 6) {
    if (body[0] === body[1] && body[2] === body[3] && body[4] === body[5])
      return `#${body[0]}${body[2]}${body[4]}`
  }
  if (body.length === 8) {
    if (body[0] === body[1] && body[2] === body[3] && body[4] === body[5] && body[6] === body[7])
      return `#${body[0]}${body[2]}${body[4]}${body[6]}`
  }
  return hex
}

export function colorNameToHex(name: string): string | null {
  const lower = name.toLowerCase()
  return NAMED_TO_HEX[lower] ?? null
}

export function hexToShortName(hex: string): string | null {
  const lower = hex.toLowerCase()
  return HEX_TO_SHORT_NAME[lower] ?? null
}

export function rgbToHex(r: number, g: number, b: number): string {
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  return shortenHex(`#${hex}`)
}

const RGB_RE = /^rgba?\(\s*([+-]?\d*\.?\d+%?)\s*[,\s]\s*([+-]?\d*\.?\d+%?)\s*[,\s]\s*([+-]?\d*\.?\d+%?)\s*(?:[,/]\s*([+-]?\d*\.?\d+%?)\s*)?\)$/

export function compressRgbToHex(value: string): string {
  const m = RGB_RE.exec(value.trim())
  if (!m)
    return value
  const r = parseChannel(m[1]!)
  const g = parseChannel(m[2]!)
  const b = parseChannel(m[3]!)
  if (m[4] && m[4] !== '1' && m[4] !== '100%') {
    // alpha != 1 — keep as rgba
    return value
  }
  return rgbToHex(r, g, b)
}

function parseChannel(s: string): number {
  if (s.endsWith('%'))
    return Math.max(0, Math.min(255, Math.round(Number.parseFloat(s) * 2.55)))
  return Math.max(0, Math.min(255, Math.round(Number.parseFloat(s))))
}
