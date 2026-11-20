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
        out.push(...adapter.findAll!(test, e.children))
      }
    }
    return out
  },
  findOne: (test, elems) => {
    for (const e of elems) {
      if (adapter.isTag(e)) {
        if (test(e)) return e
        const r = adapter.findOne!(test, e.children)
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
    // querySelector-style: passing a single root excludes the root itself
    // (matches css-select). Wrap in `[tree]` to opt into root-as-candidate.
    expect(selectAll('div:has(span.bar)', [tree], opts).length).toBe(1)
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

/**
 * The argument to `:has()` is a RELATIVE selector (Selectors 4): it is
 * measured from the element being tested. It used to be compiled on its own,
 * so `> span` meant "a span whose parent is anything" and `section span` could
 * match through a section outside the subject; and only descendants were
 * searched, so `+` and `~` could never match. Expected results agree with
 * css-select and the spec. Reported in stacksjs/ts-css#44.
 */
describe(':has() relative selectors', () => {
  // <section id="outer"><div id="inner"><span/></div></section><input id="c">
  const doc = () => el('body', {},
    el('section', { id: 'outer' }, el('div', { id: 'inner' }, el('span'))),
    el('input', { id: 'c' }),
  )
  const ids = (selector: string, root = doc()): string[] =>
    selectAll(selector, root, opts).map(node => node.attrs.id).filter(Boolean) as string[]

  it('should anchor > to the subject', () => {
    expect(ids(':has(> span)')).toEqual(['inner'])
    expect(ids('section:has(> span)')).toEqual([])
  })

  /** `#inner` is inside the section, so no section lies between it and the span. */
  it('should not match through an ancestor outside the subject', () => {
    expect(ids('#inner:has(section span)')).toEqual([])
  })

  it('should keep the implied descendant combinator', () => {
    expect(ids('section:has(span)')).toEqual(['outer'])
    expect(ids('section:has(div span)')).toEqual(['outer'])
  })

  it('should look at following siblings for + and ~', () => {
    expect(ids('section:has(+ input)')).toEqual(['outer'])
    expect(ids('section:has(~ input)')).toEqual(['outer'])
  })

  it('should hold + to the very next sibling', () => {
    const root = el('body', {}, el('section', { id: 's' }), el('p'), el('input'))
    expect(ids('section:has(+ input)', root)).toEqual([])
    expect(ids('section:has(~ input)', root)).toEqual(['s'])
  })

  it('should reach under a following sibling', () => {
    const root = el('body', {}, el('section', { id: 's' }), el('div', {}, el('span')))
    expect(ids('section:has(+ div span)', root)).toEqual(['s'])
    expect(ids('section:has(+ div > em)', root)).toEqual([])
  })

  it('should never look at a preceding sibling', () => {
    const root = el('body', {}, el('input'), el('section', { id: 's' }))
    expect(ids('section:has(~ input)', root)).toEqual([])
  })

  /** Each `:has()` keeps its own anchor, including when nested in another. */
  it('should anchor a nested :has() to its own subject', () => {
    expect(ids('section:has(div:has(> span))')).toEqual(['outer'])
    expect(ids('section:has(> div:has(> div))')).toEqual([])
  })

  it('should match when any argument matches', () => {
    expect(ids('section:has(> p, > div)')).toEqual(['outer'])
  })
})
