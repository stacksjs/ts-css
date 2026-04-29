/**
 * Selector AST → string. Inverse of `parse`.
 */

import type { Selector } from './types'

const COMBINATORS: Record<string, string> = {
  child: ' > ',
  parent: ' < ',
  sibling: ' ~ ',
  adjacent: ' + ',
  descendant: ' ',
  'column-combinator': ' || ',
}

export function stringify(selector: Selector[][]): string {
  return selector.map(stringifySegments).join(', ')
}

function stringifySegments(tokens: Selector[]): string {
  return tokens.map((t, i) => stringifyOne(t, tokens[i - 1])).join('')
}

function stringifyOne(token: Selector, _prev?: Selector): string {
  switch (token.type) {
    case 'tag': return `${nsPrefix(token.namespace)}${escapeIdent(token.name)}`
    case 'universal': return `${nsPrefix(token.namespace)}*`
    case 'attribute': {
      if (token.name === 'id' && token.action === 'equals' && !token.ignoreCase && !token.namespace)
        return `#${escapeIdent(token.value)}`
      if (token.name === 'class' && token.action === 'element' && !token.ignoreCase && !token.namespace)
        return `.${escapeIdent(token.value)}`
      let out = `[${nsPrefix(token.namespace)}${escapeIdent(token.name)}`
      if (token.action !== 'exists') {
        const op = ACTION_OP[token.action] ?? '='
        out += op
        out += `"${token.value.replace(/"/g, '\\"')}"`
        if (token.ignoreCase === true)
          out += ' i'
        else if (token.ignoreCase === false)
          out += ' s'
      }
      out += ']'
      return out
    }
    case 'pseudo':
      if (token.data === null)
        return `:${token.name}`
      if (typeof token.data === 'string')
        return `:${token.name}(${token.data})`
      return `:${token.name}(${stringify(token.data as Selector[][])})`
    case 'pseudo-element':
      return token.data === null ? `::${token.name}` : `::${token.name}(${token.data})`
    case 'descendant':
    case 'child':
    case 'parent':
    case 'sibling':
    case 'adjacent':
    case 'column-combinator':
      return COMBINATORS[token.type] ?? ' '
  }
  return ''
}

const ACTION_OP: Record<string, string> = {
  equals: '=',
  element: '~=',
  start: '^=',
  end: '$=',
  any: '*=',
  not: '!=',
  hyphen: '|=',
}

function nsPrefix(ns: string | null): string {
  if (ns === null)
    return ''
  if (ns === '')
    return '|'
  return `${escapeIdent(ns)}|`
}

// Valid CSS identifier chars: ASCII letters, digits, `-`, `_`, and any
// non-ASCII (>= 0x80). Anything else needs an escape. `\W` rejects
// non-ASCII, so we use an explicit positive set.
const RE_INVALID_ID_CHAR = /[^\w°-￿-]/g

function escapeIdent(name: string): string {
  if (name === '')
    return ''
  return name.replace(RE_INVALID_ID_CHAR, m => `\\${m}`)
}
