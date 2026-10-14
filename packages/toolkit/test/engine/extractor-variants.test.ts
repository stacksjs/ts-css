import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { extractClasses } from '../../src/engine/parser'

/**
 * These go through the SCAN path, not `generate()`.
 *
 * ts-css#36 fixed the generator so `motion-reduce:[animation:none]` builds the
 * right rule, and its tests called `generate()` directly — so they all passed
 * while the class never reached the generator from a real build at all. That is
 * ts-css#37. Anything asserted here has to start from markup.
 */
function scan(markup: string): Set<string> {
  return extractClasses(markup)
}

/** Scan markup and build the sheet from whatever came out of it. */
function scanToCSS(markup: string): string {
  const gen = new CSSGenerator(defaultConfig)
  for (const className of scan(markup))
    gen.generate(className)
  return gen.toCSS(false, true)
}

function attr(className: string): string {
  return `<div class="${className}"></div>`
}

describe('Extractor: variants on arbitrary properties (ts-css#37)', () => {
  describe('the reported reproduction', () => {
    // One element, five classes. Four arrived; the fifth was a reduced-motion
    // guard on a skeleton loader that had therefore never once worked.
    const markup = '<div class="h-5 w-[160px] bg-[color-mix(in_srgb,var(--text-3)_20%,transparent)] rounded-md [animation:pulse_1.4s_ease-in-out_infinite] motion-reduce:[animation:none]"></div>'

    const expected = [
      'h-5',
      'w-[160px]',
      'bg-[color-mix(in_srgb,var(--text-3)_20%,transparent)]',
      'rounded-md',
      '[animation:pulse_1.4s_ease-in-out_infinite]',
      'motion-reduce:[animation:none]',
    ]

    for (const className of expected) {
      it(`should extract ${className}`, () => {
        expect(scan(markup).has(className)).toBe(true)
      })
    }

    it('should put the reduced-motion guard in the generated sheet', () => {
      const css = scanToCSS(markup)
      expect(css).toContain('prefers-reduced-motion: reduce')
      expect(css).toContain('animation:none')
    })
  })

  describe('the colon inside the brackets is not a variant separator', () => {
    const cases = [
      'hover:[border-color:red]',
      'focus:[outline:2px_solid_red]',
      'md:[grid-template-columns:1fr_2fr]',
      'dark:[color:red]',
      'group-hover:[color:red]',
      'md:hover:[color:red]',
      'not-first:[color:red]',
      'supports-[display:grid]:[color:red]',
    ]

    for (const className of cases) {
      it(`should extract ${className}`, () => {
        expect(scan(attr(className)).has(className)).toBe(true)
      })
    }

    it('should still extract the bare form', () => {
      expect(scan(attr('[color:inherit]')).has('[color:inherit]')).toBe(true)
    })
  })

  describe('important', () => {
    for (const className of ['![color:red]', '[color:red]!', 'hover:![color:red]', '!hover:p-2', 'hover:p-2!']) {
      it(`should extract ${className}`, () => {
        expect(scan(attr(className)).has(className)).toBe(true)
      })
    }
  })
})

describe('Extractor: variants that are not word-shaped', () => {
  // A variant does not have to look like `hover`. The validator used to
  // require every segment to start with [a-z], which silently dropped three
  // whole families — they generated correctly in isolation and could not be
  // reached from markup.
  describe('container queries', () => {
    const cases = ['@sm:flex', '@md:flex', '@3xs:flex', '@max-md:hidden', '@min-[400px]:flex', '@sm/sidebar:flex', '@min-[calc(100%/2)]:flex', '@container', '@container/sidebar']

    for (const className of cases) {
      it(`should extract ${className}`, () => {
        expect(scan(attr(className)).has(className)).toBe(true)
      })
    }

    it('should reach the container query in the generated sheet', () => {
      expect(scanToCSS(attr('@sm:flex'))).toContain('@container (width >= 24rem)')
    })
  })

  describe('child and descendant combinators', () => {
    for (const className of ['*:p-2', '**:p-2', '*:underline', '*:[color:red]', '*:!p-2']) {
      it(`should extract ${className}`, () => {
        expect(scan(attr(className)).has(className)).toBe(true)
      })
    }

    it('should reach the child selector in the generated sheet', () => {
      expect(scanToCSS(attr('*:p-2'))).toContain('> *)')
    })
  })

  describe('arbitrary selector variants', () => {
    for (const className of ['[&>p]:underline', '[&>p]:[color:red]', '[&_li]:p-2']) {
      it(`should extract ${className}`, () => {
        expect(scan(attr(className)).has(className)).toBe(true)
      })
    }
  })

  describe('functional variants keep working', () => {
    for (const className of ['data-[state=open]:underline', 'nth-[3n+1]:underline', 'supports-[display:grid]:flex', 'hover:bg-white/55', 'md:flex', 'active:underline']) {
      it(`should extract ${className}`, () => {
        expect(scan(attr(className)).has(className)).toBe(true)
      })
    }
  })
})

describe('Extractor: a looser validator must not invent classes', () => {
  // Accepting more variant shapes widens what reaches the generator, and the
  // code-string path has no `class=` to disambiguate with. Prose must stay out.
  const prose = [
    `const msg = 'Error: could not connect'`,
    `const t = '12:30'`,
    `const u = 'https://example.com/a/b'`,
    `const r = 'ratio 16/9'`,
    `const sel = 'div > p'`,
  ]

  for (const src of prose) {
    it(`should take nothing from ${src}`, () => {
      expect([...scan(src)]).toEqual([])
    })
  }

  it('should emit no CSS for the compound non-classes it does still admit', () => {
    // `key:value` and `well-known` are shaped like classes and survive as
    // candidates; the generator is what rejects them. Asserting the emitted
    // sheet rather than the candidate set is the guarantee that matters.
    expect(scanToCSS(`const d = 'key:value pair, see the well-known file'`)).toBe('')
  })

  it('should emit no CSS for an import string that looks like a scoped class', () => {
    // Admitting `@container` as a utility also admits `@scope/pkg`. It must
    // stay a dead candidate, never a rule.
    expect(scanToCSS(`import x from '@types/node'`)).toBe('')
    expect(scanToCSS(`const dep = '@stacksjs/ts-css'`)).toBe('')
  })

  it('should emit nothing for a bare @ or an empty container size', () => {
    expect(scanToCSS(attr('@:flex'))).toBe('')
    expect(scanToCSS(attr('@min-[]:flex'))).toBe('')
  })
})
