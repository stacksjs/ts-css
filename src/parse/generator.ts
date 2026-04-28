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
      return joinBlockChildren(node.children)
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
        if (node.value.type === 'String')
          out += `"${escapeStringContent(node.value.value)}"`
        else
          out += node.value.name
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
      return `"${escapeStringContent(node.value)}"`
    case 'Url':
      return /[\s"'()\\]/.test(node.value)
        ? `url("${escapeStringContent(node.value)}")`
        : `url(${node.value})`
    case 'Hash':
      return `#${node.name}`
    case 'Operator':
      return node.value
    case 'Function':
      return `${node.name}(${joinChildren(node.children, '')})`
    case 'Parentheses':
      return `(${joinChildren(node.children, '')})`
    case 'Brackets':
      return `[${joinChildren(node.children, '')}]`
    case 'Raw':
      return node.value
    case 'Comment':
      // Match css-tree default: comments are parsed but not regenerated
      // (so consumers like csso can decide whether to keep them by
      // walking the AST first and removing the ones they don't want).
      // `!`-comments are emitted so license headers survive a round-trip
      // when nothing has explicitly removed them from the tree.
      return node.value.startsWith('!') ? `/*${node.value}*/` : ''
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
  let prev: CssNode | null = null
  // Track lookahead so we can drop WhiteSpace adjacent to certain
  // operators (`:` / `,` / `/`) — css-tree compact output behaviour.
  const arr: CssNode[] = []
  for (const child of list as Iterable<CssNode>)
    arr.push(child)

  for (let i = 0; i < arr.length; i++) {
    const child = arr[i]!
    if (child.type === 'WhiteSpace') {
      const prevNode = prev
      const nextNode = arr[i + 1] ?? null
      if (isCompactOperator(prevNode) || isCompactOperator(nextNode))
        continue
    }
    const text = generate(child)
    if (!text)
      continue
    if (!first && separator && !isStructuralSeparator(prev))
      out += separator
    first = false
    out += text
    prev = child
  }
  return out
}

/**
 * Block children mix Declarations (need `;` separator) and nested Rules /
 * Atrules (need no separator). `;` only goes between Declarations.
 */
function joinBlockChildren(list: { head: any, [Symbol.iterator]: any }): string {
  let out = ''
  let prev: CssNode | null = null
  for (const child of list as Iterable<CssNode>) {
    const text = generate(child)
    if (!text)
      continue
    if (prev && needsSemicolon(prev, child))
      out += ';'
    out += text
    prev = child
  }
  return out
}

function needsSemicolon(prev: CssNode, next: CssNode): boolean {
  // Only put a `;` between two declarations (or a declaration and the
  // next sibling). Rules/Atrules close themselves with `}` or `;`.
  return prev.type === 'Declaration' && next.type !== 'Comment'
}

function isCompactOperator(node: CssNode | null): boolean {
  if (!node || node.type !== 'Operator')
    return false
  const v = node.value
  return v === ':' || v === ',' || v === '/'
}

function isStructuralSeparator(node: CssNode | null): boolean {
  if (!node)
    return false
  // Operators (`,`) and Combinators handle their own spacing — don't add
  // an extra separator after them.
  return node.type === 'Operator' || node.type === 'Combinator'
}

/**
 * Escape `"` and `\\` for CSS string output. The parser stores decoded
 * string values in the AST, so the generator is responsible for putting
 * the escapes back. Control chars (< 0x20 / DEL) become hex escapes.
 */
function escapeStringContent(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    if (ch === 92 /* \\ */)
      out += '\\\\'
    else if (ch === 34 /* " */)
      out += '\\"'
    else if (ch < 32 || ch === 127)
      out += `\\${ch.toString(16)} `
    else
      out += s[i]
  }
  return out
}
