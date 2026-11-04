import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Animation Keyframes', () => {
  it('should include @keyframes spin for animate-spin', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('animate-spin')
    const css = gen.toCSS(false)
    expect(css).toContain('animation: spin 1s linear infinite')
    expect(css).toContain('@keyframes spin')
    expect(css).toContain('rotate(360deg)')
  })

  it('should include @keyframes ping for animate-ping', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('animate-ping')
    const css = gen.toCSS(false)
    expect(css).toContain('animation: ping')
    expect(css).toContain('@keyframes ping')
    expect(css).toContain('scale(2)')
  })

  it('should include @keyframes pulse for animate-pulse', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('animate-pulse')
    const css = gen.toCSS(false)
    expect(css).toContain('animation: pulse')
    expect(css).toContain('@keyframes pulse')
    expect(css).toContain('opacity')
  })

  it('should include @keyframes bounce for animate-bounce', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('animate-bounce')
    const css = gen.toCSS(false)
    expect(css).toContain('animation: bounce')
    expect(css).toContain('@keyframes bounce')
    expect(css).toContain('translateY')
  })

  it('should not include keyframes for animate-none', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('animate-none')
    const css = gen.toCSS(false)
    expect(css).toContain('animation: none')
    expect(css).not.toContain('@keyframes')
  })

  it('should not duplicate keyframes when multiple animations are used', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('animate-spin')
    gen.generate('animate-spin')
    const css = gen.toCSS(false)
    const matches = css.match(/@keyframes spin/g)
    expect(matches).toHaveLength(1)
  })
})

describe('Backdrop Filter Vendor Prefix', () => {
  it('should include -webkit-backdrop-filter for backdrop-blur', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('backdrop-blur-sm')
    const css = gen.toCSS(false)
    // The prefixed property still ships; the value now composes every
    // backdrop function through custom properties so two backdrop utilities
    // on one element no longer overwrite each other.
    expect(css).toContain('--tc-backdrop-blur: blur(8px)')
    expect(css).toContain('-webkit-backdrop-filter: var(--tc-backdrop-blur, )')
    expect(css).toContain('backdrop-filter: var(--tc-backdrop-blur, )')
  })

  it('should include -webkit-backdrop-filter for backdrop-brightness', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('backdrop-brightness-50')
    const css = gen.toCSS(false)
    expect(css).toContain('-webkit-backdrop-filter')
    expect(css).toContain('backdrop-filter')
  })

  it('should include -webkit-backdrop-filter for backdrop-grayscale', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('backdrop-grayscale')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-backdrop-grayscale: grayscale(100%)')
    expect(css).toContain('-webkit-backdrop-filter: var(--tc-backdrop-blur, )')
  })
})

describe('Color Opacity on All Utilities', () => {
  it('should handle accent-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('accent-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('accent-color')
    expect(css).toContain('0.5')
  })

  it('should handle caret-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('caret-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('caret-color')
    expect(css).toContain('0.5')
  })

  it('should handle fill-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('fill-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('fill')
    expect(css).toContain('0.5')
  })

  it('should handle stroke-red-500/25', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('stroke-red-500/25')
    const css = gen.toCSS(false)
    expect(css).toContain('stroke')
    expect(css).toContain('0.25')
  })

  it('should handle outline-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('outline-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('outline-color')
    expect(css).toContain('0.5')
  })

  it('should handle ring-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('ring-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-ring-color')
    expect(css).toContain('0.5')
  })

  it('should handle decoration-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('decoration-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('text-decoration-color')
    expect(css).toContain('0.5')
  })

  it('should handle ring-offset-blue-500/50', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('ring-offset-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-ring-offset-color')
    expect(css).toContain('0.5')
  })

  it('should handle arbitrary opacity: accent-white/[0.04]', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('accent-white/[0.04]')
    const css = gen.toCSS(false)
    expect(css).toContain('accent-color')
    expect(css).toContain('0.04')
  })
})

describe('Reverse Utilities', () => {
  it('should generate space-x-reverse', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('space-x-reverse')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-space-x-reverse: 1')
  })

  it('should generate space-y-reverse', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('space-y-reverse')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-space-y-reverse: 1')
  })

  it('should generate divide-x-reverse', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('divide-x-reverse')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-divide-x-reverse: 1')
  })

  it('should generate divide-y-reverse', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generate('divide-y-reverse')
    const css = gen.toCSS(false)
    expect(css).toContain('--tc-divide-y-reverse: 1')
  })
})

/**
 * A custom animation used to have no registration point: theme.keyframes and
 * theme.animation were deep-merged and then never read, so `animate-<name>`
 * generated nothing and said nothing. The only way to ship one was a raw
 * preflight holding both the @keyframes and a hand-written class, which the
 * extractor could not see, purge, or compose with variants.
 */
describe('Theme keyframes and animations', () => {
  const themed = (extend: Record<string, unknown>) => new CSSGenerator({
    ...defaultConfig,
    theme: { ...defaultConfig.theme, extend: { ...defaultConfig.theme?.extend, ...extend } },
  } as typeof defaultConfig)

  const REVEAL = {
    keyframes: { 'reveal-up': { from: { opacity: '0' }, to: { opacity: '1' } } },
    animation: { reveal: 'reveal-up 1s linear both' },
  }

  it('should generate a utility for a theme animation', () => {
    const gen = themed(REVEAL)
    gen.generate('animate-reveal')
    const css = gen.toCSS()
    expect(css).toContain('.animate-reveal')
    expect(css).toContain('animation: reveal-up 1s linear both')
  })

  it('should emit the @keyframes it names', () => {
    const gen = themed(REVEAL)
    gen.generate('animate-reveal')
    const css = gen.toCSS()
    expect(css).toMatch(/@keyframes\s+reveal-up/)
    expect(css).toContain('from { opacity: 0; }')
    expect(css).toContain('to { opacity: 1; }')
  })

  /** Merged over the built-ins, not replacing them. */
  it('should leave the built-in animations working', () => {
    const gen = themed(REVEAL)
    gen.generateBatch(['animate-reveal', 'animate-spin'])
    const css = gen.toCSS()
    expect(css).toMatch(/@keyframes\s+spin/)
    expect(css).toMatch(/@keyframes\s+reveal-up/)
    expect(css).toContain('.animate-spin')
  })

  /** Being a real utility is the point: it composes and it purges. */
  it('should compose with variants', () => {
    const gen = themed(REVEAL)
    gen.generate('motion-reduce:animate-reveal')
    const css = gen.toCSS()
    expect(css).toContain('.motion-reduce\\:animate-reveal')
    expect(css).toContain('animation: reveal-up 1s linear both')
  })

  it('should emit nothing for an animation nothing uses', () => {
    const gen = themed(REVEAL)
    gen.generate('p-4')
    const css = gen.toCSS()
    expect(css).not.toContain('reveal-up')
    expect(css).not.toContain('.animate-reveal')
  })

  /** A theme may override a built-in's steps without losing the name. */
  it('should let a theme redefine a built-in keyframe', () => {
    const gen = themed({ keyframes: { spin: { from: { transform: 'rotate(90deg)' } } } })
    gen.generate('animate-spin')
    const css = gen.toCSS()
    expect(css).toContain('rotate(90deg)')
    expect(css).not.toContain('rotate(360deg)')
  })
})
