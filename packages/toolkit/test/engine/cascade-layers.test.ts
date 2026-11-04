/**
 * Author-controlled cascade layers.
 *
 * Preflights have always been emitted into a base layer, deliberately: an
 * unlayered rule beats a layered one whatever the source order, so the reset
 * had to be layered or it would override an author's own `<style>`. Utilities
 * stayed unlayered for the same reason, so they would keep beating author CSS.
 *
 * The cost was that a rule an author wrote to beat a utility could only do it
 * on specificity, which is how a config ends up carrying defensive selectors
 * like `.dark .bg-blue-50 { ... }` whose only job is to out-rank a generated
 * class. Layering is the mechanism for that, and `layers` exposes it.
 *
 * It is opt-in because turning it on changes which rules win: a sheet that
 * never asked for layers keeps the cascade it already has.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function layerNames(css: string): string[] {
  return [...new Set([...css.matchAll(/@layer\s+([a-z-]+)/g)].map(match => match[1]))]
}

describe('Cascade layers', () => {
  describe('left unset', () => {
    it('should keep utilities out of any layer', () => {
      const gen = new CSSGenerator({
        ...defaultConfig,
        preflights: [{ getCSS: () => '.card { background: red; }' }],
      } as typeof defaultConfig)
      gen.generate('bg-blue-500')
      const css = gen.toCSS()
      expect(layerNames(css)).toEqual(['tc-base'])
      expect(css).not.toContain('@layer tc-utilities')
    })

    it('should emit no order declaration', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500')
      expect(gen.toCSS()).not.toMatch(/@layer\s+[a-z-]+\s*,/)
    })
  })

  describe('opted in', () => {
    const layered = () => new CSSGenerator({
      ...defaultConfig,
      layers: ['tc-base', 'tc-utilities', 'app'],
      preflights: [
        { getCSS: () => '.reset { margin: 0; }' },
        { layer: 'app', getCSS: () => '.card { background: red; }' },
      ],
    } as typeof defaultConfig)

    /** The declaration establishes the order, so it has to come first. */
    it('should declare the order before anything it names', () => {
      const css = layered()
      css.generate('bg-blue-500')
      const out = css.toCSS()
      expect(out.indexOf('@layer tc-base, tc-utilities, app;')).toBe(0)
    })

    it('should put utilities in the utilities layer', () => {
      const gen = layered()
      gen.generate('bg-blue-500')
      const css = gen.toCSS()
      expect(css).toMatch(/@layer tc-utilities \{/)
      expect(css).toMatch(/@layer tc-utilities \{[\s\S]*\.bg-blue-500/)
    })

    it('should honour a per-preflight layer', () => {
      const gen = layered()
      gen.generate('bg-blue-500')
      const css = gen.toCSS()
      expect(css).toMatch(/@layer app \{[\s\S]*\.card/)
      // The one with no layer of its own stays in the base layer.
      expect(css).toMatch(/@layer tc-base \{[\s\S]*\.reset/)
    })

    /**
     * An @media bucket outside the layer would beat the layer's own rules,
     * which is the bug this would otherwise introduce rather than fix.
     */
    it('should carry media buckets into the layer', () => {
      const gen = layered()
      gen.generateBatch(['bg-blue-500', 'md:p-4'])
      const css = gen.toCSS()
      expect(css).toMatch(/@layer tc-utilities \{[\s\S]*@media[\s\S]*\.md\\:p-4/)
    })

    it('should keep working minified', () => {
      const gen = new CSSGenerator({ ...defaultConfig, layers: ['tc-base', 'tc-utilities'] } as typeof defaultConfig)
      gen.generate('bg-blue-500')
      const css = gen.toCSS(false, true)
      expect(css).toContain('@layer tc-base, tc-utilities;')
      expect(css).toContain('@layer tc-utilities{')
      expect(css).toContain('.bg-blue-500{')
    })

    it('should emit no utilities layer when nothing was generated', () => {
      const gen = new CSSGenerator({ ...defaultConfig, layers: ['tc-base', 'tc-utilities'] } as typeof defaultConfig)
      expect(gen.toCSS(false)).not.toContain('@layer tc-utilities')
    })
  })
})
