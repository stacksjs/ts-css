import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function shadowColor(className: string, colors?: Record<string, string | Record<string, string>>): string | undefined {
  const gen = new CSSGenerator(colors
    ? { ...defaultConfig, theme: { ...defaultConfig.theme, extend: { colors } } }
    : defaultConfig)
  gen.generate(className)
  return gen.toCSS(false).match(/--tc-shadow-color:\s*([^;]+);/)?.[1]
}

// The default palette is oklch, and the shadow rule only knew how to add an
// alpha to hex: `shadow-slate-900/5` came out as solid slate-900, so the
// faint tint a dropdown asked for rendered as a heavy black shadow.
describe('shadow-{color}/{opacity}', () => {
  it('keeps the opacity on an oklch palette color', () => {
    const color = shadowColor('shadow-slate-900/5')
    expect(color).toContain('oklch(')
    expect(color).toContain('/ 0.05')
  })

  it('keeps the opacity on a hex color', () => {
    expect(shadowColor('shadow-brand/25', { brand: '#ff0000' })).toBe('rgb(255 0 0 / 0.25)')
  })

  it('keeps an arbitrary opacity', () => {
    expect(shadowColor('shadow-slate-900/[0.04]')).toContain('/ 0.04')
  })

  it('carries the opacity on a color it cannot rewrite inline', () => {
    expect(shadowColor('shadow-brand/50', { brand: 'var(--brand)' })).toBe('color-mix(in srgb, var(--brand) 50%, transparent)')
  })

  it('leaves a color without a modifier untouched', () => {
    expect(shadowColor('shadow-brand', { brand: '#ff0000' })).toBe('#ff0000')
  })
})
