/**
 * Number / dimension / percentage compressors.
 *
 *  - `0.5px`  → `.5px`
 *  - `0.5em` → `.5em`
 *  - `0px` / `0%` / `0em` (etc.) → `0` in length context
 *  - trailing zeros removed: `2.5000` → `2.5`
 *  - exponential / scientific stays as-is — already shortest form
 */

const ZERO_UNITS = new Set(['px', 'em', 'rem', 'pt', 'pc', 'in', 'cm', 'mm', 'q', 'ch', 'ex', 'vmin', 'vmax', 'vw', 'vh'])

export function compressNumber(value: string): string {
  // strip trailing zeros after decimal
  if (value.includes('.')) {
    let v = value.replace(/(\.\d*?)0+($|e)/, '$1$2')
    if (v.endsWith('.'))
      v = v.slice(0, -1)
    value = v
  }
  // 0.5 → .5
  if (value.startsWith('0.') && value.length > 2)
    value = value.slice(1)
  else if (value.startsWith('-0.') && value.length > 3)
    value = `-${value.slice(2)}`
  // -.5 stays as-is, +.5 → .5
  if (value.startsWith('+'))
    value = value.slice(1)
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
