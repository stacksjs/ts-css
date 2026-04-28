/**
 * AST → CSS string generator. Produces compact (single-line) output by
 * default. Whitespace-significant nodes (e.g. selector combinators) are
 * preserved as-is.
 */

import type { CssNode } from './types'

export function generate(node: CssNode): string {
  switch (node.type) {
    case 'StyleSheet':
      return joinChildren(node.children, '')
    case 'Rule':
      return `${generate(node.prelude)}{${generate(node.block as CssNode)}}`
    case 'Block':
      return joinChildren(node.children, ';')
    case 'Atrule': {
      let out = `@${node.name}`
      if (node.prelude) {
        const p = generate(node.prelude as CssNode)
        if (p)
          out += ` ${p}`
      }
      if (node.block) {
        out += `{${generate(node.block as CssNode)}}`
      }
      else {
        out += ';'
      }
      return out
    }
    case 'AtrulePrelude':
      return joinChildren(node.children, '')
    case 'SelectorList':
      return joinChildren(node.children, ',')
    case 'Selector':
      return joinChildren(node.children, '')
    case 'TypeSelector':
      return node.name
    case 'IdSelector':
      return `#${node.name}`
    case 'ClassSelector':
      return `.${node.name}`
    case 'NestingSelector':
      return '&'
    case 'AttributeSelector': {
      let out = `[${node.name.name}`
      if (node.matcher && node.value) {
        out += node.matcher
        if (node.value.type === 'String') {
          out += `"${node.value.value.replace(/"/g, '\\"')}"`
        }
        else {
          out += node.value.name
        }
      }
      if (node.flags)
        out += ` ${node.flags}`
      out += ']'
      return out
    }
    case 'PseudoClassSelector':
      return node.children
        ? `:${node.name}(${joinChildren(node.children, '')})`
        : `:${node.name}`
    case 'PseudoElementSelector':
      return node.children
        ? `::${node.name}(${joinChildren(node.children, '')})`
        : `::${node.name}`
    case 'Combinator':
      return node.name === ' ' ? ' ' : node.name
    case 'Declaration':
      return `${node.property}:${generate(node.value as CssNode)}${node.important ? '!important' : ''}`
    case 'DeclarationList':
      return joinChildren(node.children, ';')
    case 'Value':
      return joinChildren(node.children, '')
    case 'Identifier':
      return node.name
    case 'Number':
      return node.value
    case 'Percentage':
      return `${node.value}%`
    case 'Dimension':
      return node.value + node.unit
    case 'String':
      return `"${node.value.replace(/"/g, '\\"')}"`
    case 'Url':
      return /[\s"'()\\]/.test(node.value)
        ? `url("${node.value.replace(/"/g, '\\"')}")`
        : `url(${node.value})`
    case 'Hash':
      return `#${node.name}`
    case 'Operator': {
      const v = node.value
      if (v === ',' || v === ':')
        return v
      return v
    }
    case 'Function':
      return `${node.name}(${joinChildren(node.children, '')})`
    case 'Parentheses':
      return `(${joinChildren(node.children, '')})`
    case 'Brackets':
      return `[${joinChildren(node.children, '')}]`
    case 'Raw':
      return node.value
    case 'Comment':
      return `/*${node.value}*/`
    case 'WhiteSpace':
      return ' '
    case 'CDO':
      return '<!--'
    case 'CDC':
      return '-->'
    case 'AnPlusB': {
      const a = node.a ?? ''
      const b = node.b ?? ''
      if (a && b) {
        const bn = Number(b)
        return `${a === '1' ? '' : a === '-1' ? '-' : a}n${bn >= 0 ? `+${b}` : b}`
      }
      if (a)
        return `${a === '1' ? '' : a === '-1' ? '-' : a}n`
      return b
    }
    case 'Ratio':
      return `${node.left.value}/${node.right.value}`
    case 'UnicodeRange':
      return node.value
    case 'Nth':
      return node.selector
        ? `${generate(node.nth as CssNode)} of ${generate(node.selector as CssNode)}`
        : generate(node.nth as CssNode)
    case 'MediaQueryList':
      return joinChildren(node.children, ',')
    case 'MediaQuery':
      return joinChildren(node.children, '')
    case 'MediaFeature': {
      let out = `(${node.name}`
      if (node.value)
        out += `:${generate(node.value as CssNode)}`
      out += ')'
      return out
    }
  }
  return ''
}

function joinChildren(list: { head: any, [Symbol.iterator]: any }, separator: string): string {
  let out = ''
  let first = true
  for (const child of list as Iterable<CssNode>) {
    const text = generate(child)
    if (!first && separator)
      out += separator
    first = false
    out += text
  }
  return out
}
