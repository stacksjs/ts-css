/**
 * Real-world CSS fixtures.
 *
 * For each fixture we verify three properties:
 *  1. parse + generate round-trip is stable (re-parsing the output
 *     produces the same string).
 *  2. minify produces output strictly smaller than input.
 *  3. minify is itself a fixed point (re-minifying doesn't change anything).
 */

import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { minify } from '../src/optimize'
import { generate, parse } from '../src/parse'

const FIXTURES = ['reset.css', 'utilities.css', 'component.css']

describe('fixtures', () => {
  for (const name of FIXTURES) {
    describe(name, () => {
      const source = readFileSync(join(import.meta.dir, 'fixtures', name), 'utf8')

      it('parse + generate round-trips stably', () => {
        const out1 = generate(parse(source))
        const out2 = generate(parse(out1))
        expect(out1).toBe(out2)
      })

      it('minify shrinks the source meaningfully', () => {
        const { css } = minify(source)
        expect(css.length).toBeLessThan(source.length)
        // sanity floor — the minified output should keep the basic structure
        expect(css).toContain('{')
        expect(css).toContain('}')
      })

      it('minify is idempotent', () => {
        const a = minify(source).css
        const b = minify(a).css
        expect(b).toBe(a)
      })

      it('minify keeps `/*!*/` comments by default', () => {
        if (source.includes('/*!')) {
          const { css } = minify(source)
          expect(css).toContain('/*!')
        }
      })
    })
  }
})
