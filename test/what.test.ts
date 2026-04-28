import { describe, expect, it } from 'bun:test'
import { isTraversal, parse, stringify } from '../src/what'

describe('what.parse', () => {
  it('parses a tag selector', () => {
    expect(parse('div')).toEqual([[{ type: 'tag', name: 'div', namespace: null }]])
  })
  it('parses a class selector as attribute selector', () => {
    const ast = parse('.foo')
    expect(ast[0]![0]).toMatchObject({ type: 'attribute', name: 'class', action: 'element', value: 'foo' })
  })
  it('parses combinators', () => {
    const ast = parse('a > b + c ~ d')
    const types = ast[0]!.map(x => x.type)
    expect(types).toEqual(['tag', 'child', 'tag', 'adjacent', 'tag', 'sibling', 'tag'])
  })
  it('parses descendant combinator', () => {
    const ast = parse('a b')
    const types = ast[0]!.map(x => x.type)
    expect(types).toEqual(['tag', 'descendant', 'tag'])
  })
  it('parses :not(...) with sub-selectors', () => {
    const ast = parse(':not(.x, .y)')
    expect(ast[0]![0]).toMatchObject({ type: 'pseudo', name: 'not' })
    expect(Array.isArray((ast[0]![0] as any).data)).toBe(true)
  })
  it('parses pseudo-elements', () => {
    expect(parse('::before')[0]![0]).toMatchObject({ type: 'pseudo-element', name: 'before' })
  })
})

describe('what.stringify', () => {
  it('round-trips simple selectors', () => {
    const cases = ['div', '.a', '#x', 'a > b', '[type="button"]', ':hover', '::before']
    for (const c of cases) {
      const re = stringify(parse(c))
      // Round-trip should produce something that re-parses to the same shape
      expect(parse(re)).toEqual(parse(c))
    }
  })
})

describe('what.isTraversal', () => {
  it('detects combinator types', () => {
    expect(isTraversal({ type: 'descendant' } as any)).toBe(true)
    expect(isTraversal({ type: 'tag', name: 'a', namespace: null })).toBe(false)
  })
})
