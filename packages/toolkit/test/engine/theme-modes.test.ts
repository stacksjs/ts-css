/**
 * Mode tokens.
 *
 * A theme colour was single-valued and inlined into the utility, so
 * redefining a variable could not change what `bg-panel` painted, and the
 * only mode axis was the `dark:` variant written by hand at every call site.
 * A nested record was just a shade scale, so `panel.dark` was a shade that
 * happened to be called dark.
 *
 * `theme.modes` names the selector for each mode, and that declaration is
 * what makes a colour keyed by those names a mode token rather than a scale --
 * so a palette with a genuine `dark` shade is unaffected until it opts in.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

const PANEL = {
  modes: { dark: 'html.dark', marketing: 'html.marketing' },
  extend: { colors: { panel: { light: '#ffffff', dark: '#18181b', marketing: '#fff7ed' } } },
}

function themed(theme: Record<string, unknown>): CSSGenerator {
  return new CSSGenerator({ ...defaultConfig, theme: { ...defaultConfig.theme, ...theme } } as typeof defaultConfig)
}

describe('Theme modes', () => {
  it('should emit the base value in :root', () => {
    const gen = themed(PANEL)
    gen.generate('bg-panel')
    expect(gen.toCSS(false)).toContain('--color-panel: #ffffff;')
  })

  it('should emit a block per mode, under its selector', () => {
    const gen = themed(PANEL)
    gen.generate('bg-panel')
    const css = gen.toCSS(false)
    expect(css).toMatch(/html\.dark \{\s*--color-panel: #18181b;/)
    expect(css).toMatch(/html\.marketing \{\s*--color-panel: #fff7ed;/)
  })

  /** Inlining the literal is what made the override impossible. */
  it('should make the utility reference the variable', () => {
    const gen = themed(PANEL)
    gen.generateBatch(['bg-panel', 'text-panel'])
    const css = gen.toCSS(false)
    expect(css).toContain('background-color: var(--color-panel, #ffffff)')
    expect(css).toContain('color: var(--color-panel, #ffffff)')
  })

  it('should keep opacity working through the variable', () => {
    const gen = themed(PANEL)
    gen.generate('bg-panel/40')
    expect(gen.toCSS(false)).toContain('color-mix(in srgb, var(--color-panel, #ffffff) 40%, transparent)')
  })

  /**
   * The named-scope case matters as much as light/dark: a section of a site
   * is not a colour scheme and `dark:` cannot express it at all.
   */
  it('should support a mode that is not a colour scheme', () => {
    const gen = themed(PANEL)
    gen.generate('bg-panel')
    expect(gen.toCSS(false)).toContain('html.marketing')
  })

  describe('disambiguation', () => {
    it('should leave a shade named dark a shade when no modes are declared', () => {
      const gen = themed({ extend: { colors: { surface: { base: '#ecfdf5', dark: '#064e3b' } } } })
      gen.generate('bg-surface-dark')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: #064e3b')
      expect(css).not.toContain('--color-surface')
    })

    /** A scale carrying shades beyond the mode names is still a scale. */
    it('should leave a scale alone even with modes declared', () => {
      const gen = themed({
        modes: { dark: 'html.dark' },
        extend: { colors: { brand: { 100: '#eee', dark: '#111' } } },
      })
      gen.generate('bg-brand-100')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: #eee')
      expect(css).not.toContain('--color-brand:')
    })
  })

  it('should fall back to the first value when light is absent', () => {
    const gen = themed({ modes: { dark: 'html.dark' }, extend: { colors: { ink: { dark: '#eeeeee' } } } })
    gen.generate('bg-ink')
    const css = gen.toCSS(false)
    expect(css).toContain('--color-ink: #eeeeee;')
    expect(css).toMatch(/html\.dark \{\s*--color-ink: #eeeeee;/)
  })

  it('should emit nothing extra when no modes are configured', () => {
    const gen = themed({ extend: { colors: { panel: '#ffffff' } } })
    gen.generate('bg-panel')
    const css = gen.toCSS(false)
    expect(css).toContain('background-color: #ffffff')
    expect(css).not.toContain(':root')
  })
})
