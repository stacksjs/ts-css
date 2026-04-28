/**
 * Selector parser — string → list-of-lists of selector segments.
 *
 * Returns one inner list per top-level (comma-separated) selector, with
 * traversal segments (descendant/child/sibling/adjacent/column) interleaved
 * between simple selector segments. Mirrors `css-what` v6.
 */

import type { ParseOptions, Selector } from './types'

const RE_NAME = /^(?:\\(?:[\dA-Fa-f]{1,6} ?|[^])|[\w\-°-￿])+/
const RE_ESCAPE = /\\([\dA-Fa-f]{1,6} ?|[^])/g

function unescape(name: string): string {
  return name.replace(RE_ESCAPE, (_m, escape: string) => {
    if (escape.length > 1 && /^[\dA-Fa-f]/.test(escape)) {
      const code = Number.parseInt(escape, 16)
      if (code >= 0xD800 && code <= 0xDFFF)
        return '�'
      return String.fromCodePoint(code)
    }
    return escape
  })
}

const ACTIONS: Record<string, string> = {
  '~': 'element',
  '^': 'start',
  '$': 'end',
  '*': 'any',
  '!': 'not',
  '|': 'hyphen',
}

const ATTRIBUTES_QUIRKS = new Set([
  'accept', 'accept-charset', 'align', 'alink', 'axis', 'bgcolor', 'charset',
  'checked', 'clear', 'codetype', 'color', 'compact', 'declare', 'defer',
  'dir', 'direction', 'disabled', 'enctype', 'face', 'frame', 'hreflang',
  'http-equiv', 'lang', 'language', 'link', 'media', 'method', 'multiple',
  'nohref', 'noresize', 'noshade', 'nowrap', 'readonly', 'rel', 'rev',
  'rules', 'scope', 'scrolling', 'selected', 'shape', 'target', 'text',
  'type', 'valign', 'valuetype', 'vlink',
])

export function parse(selector: string, options: ParseOptions = {}): Selector[][] {
  const subselects: Selector[][] = []
  const endIndex = parseSelector(subselects, `${selector}`, options, 0)
  if (endIndex < selector.length)
    throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`)
  return subselects
}

function parseSelector(subselects: Selector[][], selector: string, options: ParseOptions, selectorIndex: number): number {
  let tokens: Selector[] = []

  function getName(offset: number): string {
    const sub = selector.slice(selectorIndex + offset)
    const m = RE_NAME.exec(sub)
    if (!m)
      throw new Error(`Expected name, found ${sub}`)
    selectorIndex += offset + m[0].length
    return unescape(m[0])
  }

  function stripWS(start: number): void {
    while (selectorIndex + start < selector.length && isWhitespace(selector.charAt(selectorIndex + start)))
      start++
    selectorIndex += start
  }

  function isEscaped(pos: number): boolean {
    let backslashes = 0
    while (selector.charAt(--pos) === '\\') backslashes++
    return (backslashes & 1) === 1
  }

  stripWS(0)
  while (selector !== '') {
    const firstChar = selector.charAt(selectorIndex)

    if (isWhitespace(firstChar)) {
      let trimmed = 1
      while (isWhitespace(selector.charAt(selectorIndex + trimmed)))
        trimmed++
      if (tokens.length === 0)
        return selectorIndex
      stripWS(trimmed)
      addTraversal(tokens, 'descendant')
    }
    else if (firstChar === '>' || firstChar === '<' || firstChar === '~' || firstChar === '+' || firstChar === '|') {
      // combinator
      while (selectorIndex < selector.length && isWhitespace(selector.charAt(selectorIndex + 1)))
        selectorIndex++
      stripWS(1)
      switch (firstChar) {
        case '>': addTraversal(tokens, 'child'); break
        case '<': addTraversal(tokens, 'parent'); break
        case '~': addTraversal(tokens, 'sibling'); break
        case '+': addTraversal(tokens, 'adjacent'); break
        case '|':
          if (selector.charAt(selectorIndex) === '|') {
            selectorIndex++
            stripWS(0)
            addTraversal(tokens, 'column-combinator')
          }
          else {
            // namespace-only — treat as part of next tag
            tokens.push({ type: 'tag', name: '', namespace: '' })
          }
          break
      }
    }
    else if (firstChar === ',') {
      if (tokens.length === 0)
        throw new Error('Empty sub-selector')
      subselects.push(tokens)
      tokens = []
      stripWS(1)
    }
    else if (selector.startsWith('/*', selectorIndex)) {
      const end = selector.indexOf('*/', selectorIndex + 2)
      if (end < 0)
        throw new Error('Unmatched comment')
      selectorIndex = end + 2
      stripWS(0)
    }
    else {
      if (firstChar === '*') {
        selectorIndex++
        tokens.push({ type: 'universal', namespace: null })
      }
      else if ('><~+'.includes(firstChar)) {
        // shouldn't reach
      }
      else if (firstChar === '#') {
        const name = getName(1)
        tokens.push({
          type: 'attribute',
          name: 'id',
          action: 'equals',
          value: name,
          namespace: null,
          ignoreCase: false,
        })
      }
      else if (firstChar === '.') {
        const name = getName(1)
        tokens.push({
          type: 'attribute',
          name: 'class',
          action: 'element',
          value: name,
          namespace: null,
          ignoreCase: false,
        })
      }
      else if (firstChar === '[') {
        // attribute selector
        const sub = selector.slice(selectorIndex + 1)
        let attribute: string
        let nameEnd = 0
        // namespace-prefixed?
        if (sub.charAt(0) === '|') {
          throw new Error('Empty namespace not supported')
        }
        else if (sub.charAt(0) === '*' && sub.charAt(1) === '|') {
          nameEnd = 2
          attribute = getName(3)
        }
        else {
          // just name
          const m = RE_NAME.exec(sub)
          if (!m)
            throw new Error(`Expected attribute name, got ${sub}`)
          nameEnd = m[0].length
          attribute = unescape(m[0])
          selectorIndex += 1 + nameEnd
          // namespace?
          if (selector.charAt(selectorIndex) === '|' && selector.charAt(selectorIndex + 1) !== '=') {
            selectorIndex++
            const m2 = RE_NAME.exec(selector.slice(selectorIndex))
            if (!m2)
              throw new Error('expected attr name after namespace')
            selectorIndex += m2[0].length
            attribute = unescape(m2[0])
          }
        }
        stripWS(0)
        let action: 'exists' | 'equals' | 'element' | 'start' | 'end' | 'any' | 'not' | 'hyphen' = 'exists'
        let value = ''
        let ignoreCase: boolean | null = null
        const ch = selector.charAt(selectorIndex)
        if (ch === '=') {
          action = 'equals'
          selectorIndex++
        }
        else if (ch === '!' && selector.charAt(selectorIndex + 1) === '=') {
          action = 'not'
          selectorIndex += 2
        }
        else if ((ACTIONS as any)[ch] && selector.charAt(selectorIndex + 1) === '=') {
          action = (ACTIONS as any)[ch]
          selectorIndex += 2
        }
        if (action !== 'exists') {
          stripWS(0)
          const q = selector.charAt(selectorIndex)
          if (q === '"' || q === '\'') {
            const end = findEndOfString(selector, selectorIndex + 1, q)
            value = unescape(selector.slice(selectorIndex + 1, end))
            selectorIndex = end + 1
          }
          else {
            const m3 = RE_NAME.exec(selector.slice(selectorIndex))
            if (!m3)
              throw new Error('expected value')
            value = unescape(m3[0])
            selectorIndex += m3[0].length
          }
          stripWS(0)
          // case flag
          const flag = selector.charAt(selectorIndex)
          if (flag === 'i' || flag === 'I') {
            ignoreCase = true
            selectorIndex++
          }
          else if (flag === 's' || flag === 'S') {
            ignoreCase = false
            selectorIndex++
          }
        }
        if (selector.charAt(selectorIndex) !== ']')
          throw new Error('Expected ]')
        selectorIndex++
        if (ignoreCase === null) {
          // quirks-mode default for HTML attributes
          if (!options.xmlMode && ATTRIBUTES_QUIRKS.has(attribute.toLowerCase()))
            ignoreCase = 'quirks' as any
        }
        tokens.push({
          type: 'attribute',
          name: options.lowerCaseAttributeNames !== false && !options.xmlMode ? attribute.toLowerCase() : attribute,
          action,
          value,
          namespace: null,
          ignoreCase,
        })
      }
      else if (firstChar === ':') {
        if (selector.charAt(selectorIndex + 1) === ':') {
          // pseudo-element
          selectorIndex += 2
          const name = getName(0).toLowerCase()
          let data: string | null = null
          if (selector.charAt(selectorIndex) === '(') {
            const end = findClose(selector, selectorIndex)
            data = selector.slice(selectorIndex + 1, end).trim()
            selectorIndex = end + 1
          }
          tokens.push({ type: 'pseudo-element', name, data })
        }
        else {
          selectorIndex += 1
          const name = getName(0).toLowerCase()
          if (selector.charAt(selectorIndex) === '(') {
            const end = findClose(selector, selectorIndex)
            const inner = selector.slice(selectorIndex + 1, end)
            selectorIndex = end + 1
            // selector-list pseudos
            if (name === 'is' || name === 'not' || name === 'where' || name === 'has' || name === 'matches' || name === '-moz-any' || name === '-webkit-any') {
              const sub: Selector[][] = []
              parseSelector(sub, inner.trim(), options, 0)
              tokens.push({ type: 'pseudo', name, data: sub })
            }
            else {
              tokens.push({ type: 'pseudo', name, data: inner.trim() })
            }
          }
          else {
            tokens.push({ type: 'pseudo', name, data: null })
          }
        }
      }
      else {
        // tag selector
        let name = ''
        if (firstChar === '|') {
          // |tag — no namespace
          selectorIndex++
          name = getName(0)
          tokens.push({ type: 'tag', name: options.lowerCaseTags !== false ? name.toLowerCase() : name, namespace: '' })
        }
        else {
          name = getName(0)
          if (selector.charAt(selectorIndex) === '|') {
            selectorIndex++
            const tag = getName(0)
            tokens.push({ type: 'tag', name: options.lowerCaseTags !== false ? tag.toLowerCase() : tag, namespace: name })
          }
          else {
            tokens.push({ type: 'tag', name: options.lowerCaseTags !== false ? name.toLowerCase() : name, namespace: null })
          }
        }
      }
    }
    if (selectorIndex >= selector.length)
      break
  }
  if (tokens.length > 0)
    subselects.push(tokens)
  return selectorIndex
}

function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f'
}

function addTraversal(tokens: Selector[], type: 'adjacent' | 'child' | 'descendant' | 'parent' | 'sibling' | 'column-combinator'): void {
  // Replace trailing descendant if a stronger combinator follows
  if (tokens.length > 0 && tokens[tokens.length - 1]!.type === 'descendant' && type !== 'descendant') {
    tokens.pop()
  }
  if (tokens.length > 0 && (tokens[tokens.length - 1]!.type === type)) {
    return
  }
  tokens.push({ type } as any)
}

function findEndOfString(selector: string, start: number, q: string): number {
  let i = start
  while (i < selector.length) {
    if (selector.charAt(i) === '\\') {
      i += 2
      continue
    }
    if (selector.charAt(i) === q)
      return i
    i++
  }
  throw new Error('Unterminated string')
}

function findClose(selector: string, openParen: number): number {
  let depth = 1
  let i = openParen + 1
  while (i < selector.length) {
    const c = selector.charAt(i)
    if (c === '\\') { i += 2; continue }
    if (c === '"' || c === '\'') {
      i = findEndOfString(selector, i + 1, c) + 1
      continue
    }
    if (c === '(') depth++
    else if (c === ')') { depth--; if (depth === 0) return i }
    i++
  }
  throw new Error('Unterminated parenthesis')
}
