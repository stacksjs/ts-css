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
