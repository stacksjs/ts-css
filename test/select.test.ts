import type { Adapter, Options } from '../src/select'
import { describe, expect, it } from 'bun:test'
import { is, selectAll, selectOne } from '../src/select'

interface El { type: 'el', name: string, attrs: Record<string, string>, children: El[], parent: El | null }

function el(name: string, attrs: Record<string, string> = {}, ...children: El[]): El {
  const e: El = { type: 'el', name, attrs, children, parent: null }
  for (const c of children) c.parent = e
  return e
}

const adapter: Adapter<El, El> = {
  isTag: (n: any): n is El => n && n.type === 'el',
  existsOne: (test, elems) => elems.some(e => adapter.isTag(e) && (test(e) || adapter.existsOne(test, e.children))),
  getAttributeValue: (e, n) => e.attrs[n],
  getChildren: (e: any) => e.children ?? [],
  getName: e => e.name,
  getParent: (e: any) => e.parent ?? null,
  getSiblings: (e: any) => e.parent ? e.parent.children : [e],
  getText: () => '',
  hasAttrib: (e, n) => n in e.attrs,
  removeSubsets: n => n,
  findAll: (test, elems) => {
    const out: El[] = []
    for (const e of elems) {
      if (adapter.isTag(e)) {
        if (test(e)) out.push(e)
        out.push(...adapter.findAll(test, e.children))
      }
    }
    return out
  },
  findOne: (test, elems) => {
    for (const e of elems) {
      if (adapter.isTag(e)) {
        if (test(e)) return e
        const r = adapter.findOne(test, e.children)
        if (r) return r
      }
    }
    return null
  },
}

const opts: Options<El, El> = { adapter, xmlMode: true }

const tree = el('div', { class: 'root' },
  el('p', { id: 'a' }, el('span', { class: 'foo bar' })),
  el('p', { id: 'b' },
    el('span', { class: 'foo' }),
    el('span', { class: 'bar' }),
  ),
)

describe('selectAll', () => {
  it('matches by tag name', () => {
    expect(selectAll('span', tree, opts).length).toBe(3)
  })
  it('matches by class', () => {
    expect(selectAll('.foo', tree, opts).length).toBe(2)
  })
  it('matches by id', () => {
    expect(selectAll('#a', tree, opts).length).toBe(1)
  })
  it('matches child combinator', () => {
    expect(selectAll('p > span.foo', tree, opts).length).toBe(2)
  })
  it('matches descendant combinator', () => {
    expect(selectAll('p#a span', tree, opts).length).toBe(1)
  })
  it('matches attribute ~=', () => {
    expect(selectAll('[class~="bar"]', tree, opts).length).toBe(2)
  })
  it('matches :not()', () => {
    expect(selectAll('p:not(#a)', tree, opts).length).toBe(1)
  })
  it('matches :has()', () => {
    expect(selectAll('div:has(span.bar)', tree, opts).length).toBe(1)
  })
  it('matches :nth-child', () => {
    expect(selectAll('p:nth-child(1)', tree, opts).length).toBe(1)
  })
  it('matches :first-child', () => {
    expect(selectAll('span:first-child', tree, opts).length).toBe(2)
  })
  it('matches adjacent sibling', () => {
    expect(selectAll('p + p', tree, opts).length).toBe(1)
  })
  it('matches general sibling', () => {
    expect(selectAll('p ~ p', tree, opts).length).toBe(1)
  })
})

describe('selectOne / is', () => {
  it('selectOne returns the first match', () => {
    expect(selectOne('.bar', tree, opts)).not.toBeNull()
  })
  it('is() tests a node directly', () => {
    const span = tree.children[0]!.children[0]!
    expect(is(span, '.foo', opts)).toBe(true)
    expect(is(span, '.missing', opts)).toBe(false)
  })
})

describe('compile cache', () => {
  it('reuses compiled selectors with default options', async () => {
    const { compile, clearSelectorCache } = await import('../src/select')
    clearSelectorCache(adapter as any)
    const a = compile('p > span.foo', opts)
    const b = compile('p > span.foo', opts)
    expect(a).toBe(b)
  })

  it('skips the cache when cacheResults is false', async () => {
    const { compile } = await import('../src/select')
    const noCache: typeof opts = { ...opts, cacheResults: false }
    const a = compile('p > span', noCache)
    const b = compile('p > span', noCache)
    expect(a).not.toBe(b)
  })

  it('keys cache by xmlMode flag', async () => {
    const { compile } = await import('../src/select')
    const a = compile('p', opts)
    const b = compile('p', { ...opts, xmlMode: false })
    expect(a).not.toBe(b)
  })
})
