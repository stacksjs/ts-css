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

  it('parses unknown at-rule preludes (no hardcoded whitelist)', () => {
    const ast = parse('@my-custom rule (foo) { .a { color: red } }') as any
    const at = ast.children.first
    expect(at.type).toBe('Atrule')
    expect(at.name).toBe('my-custom')
    // Prelude should be parsed structurally (AtrulePrelude with children),
    // not stored as a Raw blob.
    expect(at.prelude.type).toBe('AtrulePrelude')
    expect(at.prelude.children.toArray().length).toBeGreaterThan(0)
  })

  it('parses @scope, @starting-style, and @container with nested rules', () => {
    for (const name of ['scope', 'starting-style', 'container']) {
      const ast = parse(`@${name} (foo) { .x { color: blue } }`) as any
      const at = ast.children.first
      expect(at.type).toBe('Atrule')
      expect(at.block.children.first.type).toBe('Rule')
    }
  })

  it('calls onParseError for malformed declarations', () => {
    const errors: string[] = []
    parse('.a { invalid-no-colon; color: red; }', {
      onParseError: (err) => { errors.push(err.message) },
    })
    expect(errors.length).toBeGreaterThan(0)
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

  it('narrows visitor.enter via visit filter', () => {
    const ast = parse('.a{color:red} .b{color:blue}')
    const propsByRule: string[][] = []
    walk(ast, {
      visit: 'Rule',
      enter(rule) {
        // `rule` is narrowed to Rule here — TS should NOT see the wider union.
        const props: string[] = []
        walk(rule.block, {
          visit: 'Declaration',
          enter(decl) {
            // `decl` narrowed to Declaration
            props.push(decl.property)
          },
        })
        propsByRule.push(props)
      },
    })
    expect(propsByRule).toEqual([['color'], ['color']])
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

  it('round-trips strings with escape sequences', () => {
    const cases = [
      '.a{content:"with \\"quote\\" inside"}',
      '.a{content:"line1\\a line2"}',
      'a[data-x="\\"x\\""]{color:red}',
    ]
    for (const c of cases) {
      const out1 = generate(parse(c))
      const out2 = generate(parse(out1))
      expect(out1).toBe(out2)
    }
  })

  it('decodes hex escapes in string values', () => {
    const ast = parse('.a{content:"\\26 B"}') as any
    const decl = ast.children.first.block.children.first
    const string = decl.value.children.first
    expect(string.type).toBe('String')
    expect(string.value).toBe('&B')
  })

  it('round-trips selector identifier escapes', () => {
    const cases = [
      '.\\26 B{color:red}',
      '.foo\\30 bar{color:red}',
      '.foo\\!bar{color:red}',
    ]
    for (const c of cases) {
      const out1 = generate(parse(c))
      const out2 = generate(parse(out1))
      expect(out1).toBe(out2)
    }
  })

  it('survives nested forEach with mid-walk removal', () => {
    const list = new List<number>()
    list.fromArray([1, 2, 3, 4, 5])
    const seen: number[] = []
    list.forEach((data, item) => {
      seen.push(data)
      // a nested walk over the SAME list — must not corrupt the outer cursor.
      list.forEach((d) => { void d })
      if (data === 2) {
        // remove the current node mid-iteration
        list.remove(item)
      }
    })
    expect(seen).toEqual([1, 2, 3, 4, 5])
    expect(list.toArray()).toEqual([1, 3, 4, 5])
  })
})
