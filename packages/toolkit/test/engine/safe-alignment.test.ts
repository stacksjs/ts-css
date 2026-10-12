import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Safe alignment', () => {
  describe('flexbox properties take safe flex-end', () => {
    const cases: [string, string, string][] = [
      ['justify-center-safe', 'justify-content', 'safe center'],
      ['justify-end-safe', 'justify-content', 'safe flex-end'],
      ['items-center-safe', 'align-items', 'safe center'],
      ['items-end-safe', 'align-items', 'safe flex-end'],
      ['self-center-safe', 'align-self', 'safe center'],
      ['self-end-safe', 'align-self', 'safe flex-end'],
      ['content-center-safe', 'align-content', 'safe center'],
      ['content-end-safe', 'align-content', 'safe flex-end'],
    ]

    for (const [className, prop, value] of cases) {
      it(`should generate ${className}`, () => {
        expect(css(className)).toBe(`.${className}{${prop}:${value}}`)
      })
    }
  })

  describe('grid shorthands take safe end', () => {
    // place-* and justify-items use the grid `end` keyword, not the flexbox
    // `flex-end`. Getting this backwards produces a declaration the browser
    // drops silently.
    const cases: [string, string, string][] = [
      ['place-content-center-safe', 'place-content', 'safe center'],
      ['place-content-end-safe', 'place-content', 'safe end'],
      ['place-items-center-safe', 'place-items', 'safe center'],
      ['place-items-end-safe', 'place-items', 'safe end'],
      ['place-self-center-safe', 'place-self', 'safe center'],
      ['place-self-end-safe', 'place-self', 'safe end'],
      ['justify-items-center-safe', 'justify-items', 'safe center'],
      ['justify-items-end-safe', 'justify-items', 'safe end'],
    ]

    for (const [className, prop, value] of cases) {
      it(`should generate ${className}`, () => {
        expect(css(className)).toBe(`.${className}{${prop}:${value}}`)
      })
    }

    it('should not use flex-end for the grid shorthands', () => {
      expect(css('place-content-end-safe')).not.toContain('flex-end')
      expect(css('justify-items-end-safe')).not.toContain('flex-end')
    })
  })

  describe('only center and end take safe', () => {
    // `start` never overflows, so there is nothing to fall back to and
    // Tailwind has no such class. Same for stretch and the spacing keywords.
    for (const className of [
      'justify-start-safe',
      'justify-between-safe',
      'items-start-safe',
      'items-stretch-safe',
      'self-start-safe',
      'content-start-safe',
      'place-content-start-safe',
      'justify-items-start-safe',
    ]) {
      it(`should generate nothing for ${className}`, () => {
        expect(css(className)).toBe('')
      })
    }
  })

  describe('the unsafe forms are untouched', () => {
    it('should keep justify-center and justify-end', () => {
      expect(css('justify-center')).toContain('justify-content:center')
      expect(css('justify-end')).toContain('justify-content:flex-end')
    })

    it('should keep place-content-end', () => {
      expect(css('place-content-end')).toContain('place-content:end')
    })

    it('should keep justify-items-end', () => {
      expect(css('justify-items-end')).toContain('justify-items:end')
    })
  })

  describe('variants', () => {
    it('should work under a breakpoint', () => {
      const out = css('md:justify-center-safe')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain('justify-content:safe center')
    })
  })
})
