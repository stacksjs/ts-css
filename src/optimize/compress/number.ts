/**
 * Number / dimension / percentage compressors.
 *
 *  - `0.5px`  → `.5px`
 *  - `0.5em` → `.5em`
 *  - `0px` / `0%` / `0em` (etc.) → `0` in length context
 *  - trailing zeros removed: `2.5000` → `2.5`
 *  - exponential / scientific stays as-is — already shortest form
 */

// Length units only — angle/time/frequency/resolution units are NOT here:
// `0deg`, `0s`, `0Hz`, `0dpi` are NOT equivalent to `0` in CSS, and stripping
// the unit there breaks the value type. Modern viewport variants (`svh`,
// `lvh`, `dvh`, `svw`, `lvw`, `dvw`, `svi`, `svb`, …) and container-query
// units (`cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax`) are length units too.
const ZERO_UNITS = new Set([
  // absolute / classic
  'px', 'pt', 'pc', 'in', 'cm', 'mm', 'q',
  // font-relative
  'em', 'rem', 'ex', 'ch', 'cap', 'ic', 'lh', 'rlh',
  // viewport-relative
  'vw', 'vh', 'vi', 'vb', 'vmin', 'vmax',
  // small/large/dynamic viewport
  'svw', 'svh', 'svi', 'svb', 'svmin', 'svmax',
  'lvw', 'lvh', 'lvi', 'lvb', 'lvmin', 'lvmax',
  'dvw', 'dvh', 'dvi', 'dvb', 'dvmin', 'dvmax',
  // container-query units
  'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax',
])

export function compressNumber(value: string): string {
  // Drop a leading `+` sign (CSS numbers can't be `+`-prefixed except
  // immediately after an operator; the parser already handles that).
  if (value.charCodeAt(0) === 43 /* + */)
    value = value.slice(1)

  // strip trailing zeros after decimal point: `2.5000` → `2.5`,
  // `2.500e5` → `2.5e5`. The `($|e|E)` boundary keeps an exponent intact.
  if (value.includes('.')) {
    let v = value.replace(/(\.\d*?)0+($|[eE])/, '$1$2')
    // bare `.` left over — strip it (`5.` → `5`, `5.e2` → `5e2`)
    v = v.replace(/\.($|[eE])/, '$1')
    value = v
  }

  // 0.5 → .5 / -0.5 → -.5
  if (value.startsWith('0.') && value.length > 2)
    value = value.slice(1)
  else if (value.startsWith('-0.') && value.length > 3)
    value = `-${value.slice(2)}`

  // Negative zero `-0` (and `-0.0` which has already collapsed) is just 0.
  if (value === '-0' || value === '-.0' || value === '-0.0')
    value = '0'

  return value
}

export function compressDimension(value: string, unit: string): { value: string, unit: string } {
  const compressed = compressNumber(value)
  if ((compressed === '0' || compressed === '-0') && ZERO_UNITS.has(unit.toLowerCase()))
    return { value: '0', unit: '' }
  return { value: compressed, unit }
}

export function compressPercentage(value: string): string {
  const compressed = compressNumber(value)
  return compressed
}

/**
 * Round a numeric string to `precision` decimal places. Returns the input
 * unchanged when it's not a finite number — calling sites should still
 * follow up with `compressNumber` to strip leading zeros etc.
 */
export function roundNumberString(value: string, precision: number): string {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n))
    return value
  // toFixed with negative precision is invalid in older runtimes — clamp.
  const p = precision < 0 ? 0 : precision
  // toFixed rounds; trim trailing zeros and stray dot.
  return n.toFixed(p)
}
