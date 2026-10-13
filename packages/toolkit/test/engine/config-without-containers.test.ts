/**
 * A config authored before `theme.containers` existed must still construct.
 *
 * `containers` arrived with the container-query scale and the type declares it
 * required, so nothing flagged the one caller that reads it directly. At
 * runtime a consumer building a CssConfig by hand — stx's editor package does,
 * and so does anything merging a partial user theme — passes a theme without
 * the key, and `Object.entries(undefined)` threw inside the CSSGenerator
 * constructor. That takes the whole generator down, not just the `@sm:`
 * variants: in stx it surfaced as "Failed to initialize generator" and every
 * utility hover went dead.
 *
 * Released as 0.3.11 and caught by stx's CI the same day.
 *
 * `screens` is covered here too. It has the same shape and the same single
 * unguarded read; it only escaped because the key predates every config in
 * the wild, which is not a guarantee worth relying on.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function themeWithout(key: 'containers' | 'screens') {
  const theme = { ...defaultConfig.theme }
  delete (theme as Record<string, unknown>)[key]
  return { ...defaultConfig, theme } as typeof defaultConfig
}

describe('a config missing a breakpoint scale', () => {
  for (const key of ['containers', 'screens'] as const) {
    it(`constructs without theme.${key}`, () => {
      const gen = new CSSGenerator(themeWithout(key))
      gen.generate('p-4')
      expect(gen.toCSS(false, true)).toContain('padding:1rem')
    })
  }

  it('falls back to the shipped container scale rather than emitting nothing', () => {
    // `{}` would also stop the throw, and would leave every container variant
    // silently dead — which is the failure this engine keeps producing and the
    // reason the fallback is the real scale.
    const gen = new CSSGenerator(themeWithout('containers'))
    gen.generate('@sm:flex')
    const out = gen.toCSS(false, true)
    expect(out).toContain('@container')
    expect(out).toContain('24rem')
  })

  it('still resolves the default scale when the key is present', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('@sm:flex')
    expect(gen.toCSS(false, true)).toContain('24rem')
  })
})
