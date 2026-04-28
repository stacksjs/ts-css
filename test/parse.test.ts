import { describe, expect, it } from 'bun:test'
import { generate, List, parse, walk } from '../src/parse'

describe('parse + generate round-trip', () => {
  it('parses a basic stylesheet', () => {
    const ast = parse('.foo { color: red }') as any
    expect(ast.type).toBe('StyleSheet')
    expect(ast.children.first.type).toBe('Rule')
  })

  it('round-trips comments', () => {
    const css = '/* hi */.a{color:red}'
    expect(generate(parse(css))).toBe(css)
  })

  it('preserves !important', () => {
    const css = '.a{color:red!important}'
    expect(generate(parse(css))).toBe(css)
  })

  it('parses comma-separated selectors', () => {
    const ast = parse('.a, .b, .c {}') as any
    const list = ast.children.first.prelude
    expect(list.type).toBe('SelectorList')
    expect(list.children.toArray().length).toBe(3)
  })

  it('parses combinators', () => {
    const ast = parse('.a > .b + .c ~ .d {}') as any
    const sel = ast.children.first.prelude.children.first
    const types = sel.children.toArray().map((n: any) => n.type)
    expect(types).toContain('Combinator')
  })

  it('parses an at-rule with block', () => {
    const ast = parse('@media (min-width: 800px) { .a { color: red } }') as any
    expect(ast.children.first.type).toBe('Atrule')
    expect(ast.children.first.name).toBe('media')
  })

  it('parses url() function', () => {
    const ast = parse('.a{background:url("x.png")}') as any
    let foundUrl = false
    walk(ast, (n) => {
      if (n.type === 'Url') foundUrl = true
    })
    expect(foundUrl).toBe(true)
  })

  it('walk.skip stops traversal into a node', () => {
    const ast = parse('.a{color:red} .b{color:blue}')
    const seen: string[] = []
    walk(ast, function (n) {
      if (n.type === 'Rule')
        seen.push('rule')
      if (n.type === 'Block')
        return walk.skip
    })
    expect(seen.length).toBe(2)
  })

  it('parses declarationList context', () => {
    const ast = parse('color:red;font-size:12px', { context: 'declarationList' }) as any
    expect(ast.type).toBe('DeclarationList')
    expect(ast.children.toArray().length).toBe(2)
  })

  it('exposes a doubly linked List', () => {
    const list = new List<number>()
    list.appendData(1)
    list.appendData(2)
    list.appendData(3)
    expect(list.toArray()).toEqual([1, 2, 3])
    list.shift()
    expect(list.toArray()).toEqual([2, 3])
  })
})
