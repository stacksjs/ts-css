import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Blur scale (v4 naming)', () => {
  // v4 renamed the bottom of the scale: what v3 called `blur-sm` (4px) is now
  // `blur-xs`, and `blur-sm` moved up to 8px. This engine had the v3
  // spelling, so `blur-xs` was missing and `blur-sm` was a step too small.
  it('should generate blur-xs at 4px', () => {
    expect(css('blur-xs')).toContain('--tc-blur:blur(4px)')
  })

  it('should put blur-sm at 8px, not the old 4px', () => {
    expect(css('blur-sm')).toContain('--tc-blur:blur(8px)')
    expect(css('blur-sm')).not.toContain('blur(4px)')
  })

  it('should leave the rest of the scale alone', () => {
    expect(css('blur-md')).toContain('blur(12px)')
    expect(css('blur-lg')).toContain('blur(16px)')
    expect(css('blur-xl')).toContain('blur(24px)')
    expect(css('blur-2xl')).toContain('blur(40px)')
    expect(css('blur-3xl')).toContain('blur(64px)')
    expect(css('blur-none')).toContain('blur(0)')
  })

  it('should keep backdrop-blur on the same scale', () => {
    // The two share one theme scale in Tailwind, so they must not drift.
    expect(css('backdrop-blur-xs')).toContain('--tc-backdrop-blur:blur(4px)')
    expect(css('backdrop-blur-sm')).toContain('--tc-backdrop-blur:blur(8px)')
    expect(css('backdrop-blur-md')).toContain('blur(12px)')
  })
})

describe('max-w-prose', () => {
  it('should resolve to 65ch', () => {
    expect(css('max-w-prose')).toBe('.max-w-prose{max-width:65ch}')
  })

  it('should be max-width only', () => {
    // Tailwind has no min-w-prose or max-h-prose, so `prose` must not leak
    // into the shared min/max sizing map.
    expect(css('min-w-prose')).toBe('')
    expect(css('max-h-prose')).toBe('')
    expect(css('min-h-prose')).toBe('')
  })

  it('should not disturb the rest of the max-w scale', () => {
    expect(css('max-w-xl')).toContain('max-width:36rem')
    expect(css('max-w-full')).toContain('max-width:100%')
    expect(css('max-w-none')).toContain('max-width:none')
  })
})

describe('transition-behavior', () => {
  it('should generate transition-discrete', () => {
    expect(css('transition-discrete')).toBe('.transition-discrete{transition-behavior:allow-discrete}')
  })

  it('should generate transition-normal', () => {
    expect(css('transition-normal')).toBe('.transition-normal{transition-behavior:normal}')
  })

  it('should keep the longhand spellings this engine already had', () => {
    expect(css('transition-behavior-allow-discrete')).toContain('transition-behavior:allow-discrete')
    expect(css('transition-behavior-normal')).toContain('transition-behavior:normal')
  })
})

describe('ease-initial', () => {
  it('should reset the easing', () => {
    expect(css('ease-initial')).toBe('.ease-initial{transition-timing-function:initial}')
  })

  it('should not disturb the other easings', () => {
    expect(css('ease-linear')).toContain('transition-timing-function:linear')
    expect(css('ease-in-out')).toContain('cubic-bezier(0.4, 0, 0.2, 1)')
  })
})

describe('overflow-ellipsis', () => {
  // The odd one out: an `overflow-` class that sets text-overflow rather than
  // overflow. It is Tailwind's legacy alias for `text-ellipsis` and is still
  // a live class in v4, so rejecting it was wrong.
  it('should set text-overflow, not overflow', () => {
    expect(css('overflow-ellipsis')).toBe('.overflow-ellipsis{text-overflow:ellipsis}')
  })

  it('should agree with text-ellipsis', () => {
    expect(css('overflow-ellipsis')).toContain('text-overflow:ellipsis')
    expect(css('text-ellipsis')).toContain('text-overflow:ellipsis')
  })

  it('should not disturb the real overflow utilities', () => {
    expect(css('overflow-clip')).toBe('.overflow-clip{overflow:clip}')
    expect(css('overflow-hidden')).toBe('.overflow-hidden{overflow:hidden}')
    expect(css('overflow-x-clip')).toContain('overflow-x:clip')
  })
})
