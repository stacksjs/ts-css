/**
 * Mitata bench: ts-css vs the original css-tree / css-select / css-what / csso
 * libraries. Run with:
 *
 *   bun bench/index.bench.ts
 *
 * Prints per-operation timings and ratios. The fixtures under
 * `test/fixtures/` are concatenated into one ~6 KB stylesheet (small but
 * representative of the SVGO/optimize use case).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as cssTree from 'css-tree'
import * as cssSelect from 'css-select'
import * as cssWhat from 'css-what'
import * as csso from 'csso'
import { barplot, bench, group, run, summary } from 'mitata'

import * as ourCss from '../src'
import * as ourCsso from '../src/optimize'
import * as ourSelect from '../src/select'
import * as ourWhat from '../src/what'

const FIX = join(import.meta.dir, '..', 'test', 'fixtures')
const samples = ['reset.css', 'utilities.css', 'component.css'].map(f => readFileSync(join(FIX, f), 'utf8'))
const sample = samples.join('\n')

console.log(`Fixture: ${sample.length} bytes (concatenation of reset+utilities+component).`)
console.log(`Bun ${Bun.version}`)
console.log()

// ---- Parse ----
group('parse stylesheet', () => {
  barplot(() => {
    bench('ts-css', () => ourCss.parse(sample))
    bench('css-tree', () => cssTree.parse(sample))
  })
})

// ---- Generate ----
{
  const ourAst = ourCss.parse(sample)
  const treeAst = cssTree.parse(sample)
  group('generate stylesheet', () => {
    barplot(() => {
      bench('ts-css', () => ourCss.generate(ourAst))
      bench('css-tree', () => cssTree.generate(treeAst))
    })
  })
}

// ---- Walk ----
{
  const ourAst = ourCss.parse(sample)
  const treeAst = cssTree.parse(sample)
  group('walk all nodes', () => {
    barplot(() => {
      bench('ts-css', () => {
        let n = 0
        ourCss.walk(ourAst, () => { n++ })
        return n
      })
      bench('css-tree', () => {
        let n = 0
        cssTree.walk(treeAst, () => { n++ })
        return n
      })
    })
  })
}

// ---- Selector parse ----
const SELECTORS = [
  'div',
  '.foo',
  '#bar',
  'p > span.foo',
  'a:hover[data-x="y" i]',
  'div + .x ~ p:nth-child(2n+1):not(.disabled)',
  '*[data-foo],[data-bar]:where(.a, .b)',
]
group('parse 7 selectors', () => {
  barplot(() => {
    bench('ts-css', () => {
      for (const s of SELECTORS) ourWhat.parse(s)
    })
    bench('css-what', () => {
      for (const s of SELECTORS) cssWhat.parse(s)
    })
  })
})

// ---- selectAll on a synthetic tree ----
{
  interface El { type: 'el', name: string, attrs: Record<string, string>, children: El[], parent: El | null }
  function el(name: string, attrs: Record<string, string> = {}, ...children: El[]): El {
    const e: El = { type: 'el', name, attrs, children, parent: null }
    for (const c of children) c.parent = e
    return e
  }
  // 5-level deep tree, ~250 nodes
  const root = el('html', {},
    el('body', { class: 'app' },
      ...Array.from({ length: 10 }, (_, i) =>
        el('section', { id: `s${i}`, class: i % 2 ? 'even' : 'odd' },
          ...Array.from({ length: 4 }, (_, j) =>
            el('article', { 'data-idx': String(j) },
              el('h2', { class: 'title' }, el('span', { class: 'inner' })),
              el('p', { class: i === 5 ? 'highlight' : 'normal' }, el('a', { href: '#x' })),
              el('p', { class: 'tail' }),
            ),
          ),
        ),
      ),
    ),
  )
  const adapter = {
    isTag: (n: any): n is El => n?.type === 'el',
    existsOne: (test: any, xs: any[]): boolean => xs.some((x: any) => adapter.isTag(x) && (test(x) || adapter.existsOne(test, x.children))),
    getAttributeValue: (e: El, n: string) => e.attrs[n],
    getChildren: (e: any) => e.children ?? [],
    getName: (e: El) => e.name,
    getParent: (e: any) => e.parent ?? null,
    getSiblings: (e: any) => e.parent ? e.parent.children : [e],
    getText: () => '',
    hasAttrib: (e: El, n: string) => n in e.attrs,
    removeSubsets: (n: any[]) => n,
    findAll: (test: any, xs: any[]): El[] => {
      const out: El[] = []
      for (const x of xs) {
        if (adapter.isTag(x)) {
          if (test(x)) out.push(x)
          out.push(...adapter.findAll(test, x.children))
        }
      }
      return out
    },
    findOne: (test: any, xs: any[]): El | null => {
      for (const x of xs) {
        if (adapter.isTag(x)) {
          if (test(x)) return x
          const r = adapter.findOne(test, x.children)
          if (r) return r
        }
      }
      return null
    },
  }
  const opts = { adapter, xmlMode: true } as any

  const targets = ['p', 'p.highlight', 'section.odd > article > h2 .inner', '[data-idx="2"]']
  group('selectAll on a 250-node tree', () => {
    barplot(() => {
      bench('ts-css', () => {
        for (const sel of targets) ourSelect.selectAll(sel, root, opts)
      })
      bench('css-select', () => {
        for (const sel of targets) cssSelect.selectAll(sel, root, opts)
      })
    })
  })
}

// ---- minify ----
group('minify stylesheet', () => {
  barplot(() => {
    bench('ts-css', () => ourCsso.minify(sample))
    bench('csso', () => csso.minify(sample))
  })
})

// ---- summary ----
summary(() => {
  bench('ts-css combined parse→minify→generate', () => {
    const { css } = ourCsso.minify(sample)
    return css.length
  })
  bench('original combined parse→minify→generate', () => {
    const { css } = csso.minify(sample)
    return css.length
  })
})

await run()
