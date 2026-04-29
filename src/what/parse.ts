/**
 * Selector parser — string → list-of-lists of selector segments.
 *
 * Returns one inner list per top-level (comma-separated) selector, with
 * traversal segments (descendant/child/sibling/adjacent/column) interleaved
 * between simple selector segments. Mirrors `css-what` v6.
 */

import type { ParseOptions, Selector } from './types'

// Sticky regexes: `y` lets us match from a specific index without slicing.
// Using `lastIndex` directly keeps the parser allocation-light per name.
const RE_NAME_STICKY = /(?:\\(?:[\dA-Fa-f]{1,6} ?|[^])|[\w\-°-￿])+/y
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

function unescapeIfNeeded(name: string): string {
  // Vast majority of CSS selector identifiers have no `\\` escapes — skip
  // the regex replace pipeline and return the string directly.
  return name.indexOf('\\') < 0 ? name : unescape(name)
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

// Action-string lookup as a plain function (no per-parse Map).
function actionFromChar(ch: number): string | null {
  switch (ch) {
    case 126 /* ~ */: return 'element'
    case 94 /* ^ */: return 'start'
    case 36 /* $ */: return 'end'
    case 42 /* * */: return 'any'
    case 33 /* ! */: return 'not'
    case 124 /* | */: return 'hyphen'
    default: return null
  }
}

function isWsCode(c: number): boolean {
  return c === 32 || c === 9 || c === 10 || c === 13 || c === 12
}

export function parse(selector: string, options: ParseOptions = {}): Selector[][] {
  const subselects: Selector[][] = []
  const endIndex = parseSelectorImpl(subselects, selector, options, 0)
  if (endIndex < selector.length)
    throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`)
  return subselects
}

function readName(selector: string, from: number): { value: string, end: number } {
  RE_NAME_STICKY.lastIndex = from
  const m = RE_NAME_STICKY.exec(selector)
  if (!m)
    throw new Error(`Expected name, found ${selector.slice(from)}`)
  return { value: unescapeIfNeeded(m[0]), end: from + m[0].length }
}

function stripWS(selector: string, from: number): number {
  while (from < selector.length && isWsCode(selector.charCodeAt(from)))
    from++
  return from
}

function parseSelectorImpl(subselects: Selector[][], selector: string, options: ParseOptions, startIndex: number): number {
  let tokens: Selector[] = []
  let i = stripWS(selector, startIndex)
  const len = selector.length
  const xmlMode = options.xmlMode === true
  const lowerCaseAttrs = options.lowerCaseAttributeNames !== false && !xmlMode
  const lowerCaseTagsFlag = options.lowerCaseTags !== false

  while (i < len) {
    const code = selector.charCodeAt(i)

    // whitespace → descendant combinator (or just trim if at start)
    if (isWsCode(code)) {
      let trimmed = i + 1
      while (trimmed < len && isWsCode(selector.charCodeAt(trimmed)))
        trimmed++
      if (tokens.length === 0)
        return trimmed
      i = trimmed
      addTraversal(tokens, 'descendant')
      continue
    }

    // explicit combinators
    if (code === 62 /* > */ || code === 60 /* < */ || code === 126 /* ~ */ || code === 43 /* + */ || code === 124 /* | */) {
      let j = i + 1
      while (j < len && isWsCode(selector.charCodeAt(j))) j++
      i = j
      switch (code) {
        case 62: addTraversal(tokens, 'child'); break
        case 60: addTraversal(tokens, 'parent'); break
        case 126: addTraversal(tokens, 'sibling'); break
        case 43: addTraversal(tokens, 'adjacent'); break
        case 124:
          if (i < len && selector.charCodeAt(i) === 124) {
            i++
            i = stripWS(selector, i)
            addTraversal(tokens, 'column-combinator')
          }
          else {
            tokens.push({ type: 'tag', name: '', namespace: '' })
          }
          break
      }
      continue
    }

    if (code === 44 /* , */) {
      if (tokens.length === 0)
        throw new Error('Empty sub-selector')
      subselects.push(tokens)
      tokens = []
      i = stripWS(selector, i + 1)
      continue
    }

    // comment /* ... */
    if (code === 47 /* / */ && selector.charCodeAt(i + 1) === 42 /* * */) {
      const end = selector.indexOf('*/', i + 2)
      if (end < 0)
        throw new Error('Unmatched comment')
      i = stripWS(selector, end + 2)
      continue
    }

    if (code === 42 /* * */) {
      i++
      tokens.push({ type: 'universal', namespace: null })
      continue
    }

    if (code === 35 /* # */) {
      const r = readName(selector, i + 1)
      i = r.end
      tokens.push({
        type: 'attribute',
        name: 'id',
        action: 'equals',
        value: r.value,
        namespace: null,
        ignoreCase: false,
      })
      continue
    }

    if (code === 46 /* . */) {
      const r = readName(selector, i + 1)
      i = r.end
      tokens.push({
        type: 'attribute',
        name: 'class',
        action: 'element',
        value: r.value,
        namespace: null,
        ignoreCase: false,
      })
      continue
    }

    if (code === 91 /* [ */) {
      i = parseAttribute(selector, i, tokens, options, xmlMode, lowerCaseAttrs)
      continue
    }

    if (code === 58 /* : */) {
      i = parsePseudo(selector, i, tokens, options)
      continue
    }

    // tag selector — readName then optional `|tag`
    if (code === 124 /* | */) {
      i++
      const r = readName(selector, i)
      i = r.end
      tokens.push({ type: 'tag', name: lowerCaseTagsFlag ? r.value.toLowerCase() : r.value, namespace: '' })
      continue
    }

    {
      const r1 = readName(selector, i)
      i = r1.end
      if (i < len && selector.charCodeAt(i) === 124 /* | */ && selector.charCodeAt(i + 1) !== 61 /* = */) {
        i++
        const r2 = readName(selector, i)
        i = r2.end
        tokens.push({ type: 'tag', name: lowerCaseTagsFlag ? r2.value.toLowerCase() : r2.value, namespace: r1.value })
      }
      else {
        tokens.push({ type: 'tag', name: lowerCaseTagsFlag ? r1.value.toLowerCase() : r1.value, namespace: null })
      }
    }
  }
  if (tokens.length > 0)
    subselects.push(tokens)
  return i
}

// eslint-disable-next-line pickier/no-unused-vars
function parseAttribute(selector: string, idx: number, tokens: Selector[], options: ParseOptions, xmlMode: boolean, lowerCaseAttrs: boolean): number {
  let i = idx + 1
  const len = selector.length
  let attribute: string
  if (selector.charCodeAt(i) === 124 /* | */)
    throw new Error('Empty namespace not supported')
  if (selector.charCodeAt(i) === 42 /* * */ && selector.charCodeAt(i + 1) === 124 /* | */) {
    i += 2
    const r = readName(selector, i)
    i = r.end
    attribute = r.value
  }
  else {
    const r = readName(selector, i)
    i = r.end
    attribute = r.value
    if (selector.charCodeAt(i) === 124 /* | */ && selector.charCodeAt(i + 1) !== 61 /* = */) {
      i++
      const r2 = readName(selector, i)
      i = r2.end
      attribute = r2.value
    }
  }
  i = stripWS(selector, i)
  let action: 'exists' | 'equals' | 'element' | 'start' | 'end' | 'any' | 'not' | 'hyphen' = 'exists'
  let value = ''
  let ignoreCase: boolean | null = null
  const opCode = selector.charCodeAt(i)
  if (opCode === 61 /* = */) {
    action = 'equals'
    i++
  }
  else if (opCode === 33 /* ! */ && selector.charCodeAt(i + 1) === 61) {
    action = 'not'
    i += 2
  }
  else {
    const a = actionFromChar(opCode)
    if (a !== null && selector.charCodeAt(i + 1) === 61) {
      action = a as any
      i += 2
    }
  }
  if (action !== 'exists') {
    i = stripWS(selector, i)
    const q = selector.charCodeAt(i)
    if (q === 34 /* " */ || q === 39 /* ' */) {
      const end = findEndOfString(selector, i + 1, q)
      value = unescapeIfNeeded(selector.slice(i + 1, end))
      i = end + 1
    }
    else {
      const r = readName(selector, i)
      value = r.value
      i = r.end
    }
    i = stripWS(selector, i)
    const flag = selector.charCodeAt(i)
    if (flag === 105 /* i */ || flag === 73 /* I */) {
      ignoreCase = true
      i++
    }
    else if (flag === 115 /* s */ || flag === 83 /* S */) {
      ignoreCase = false
      i++
    }
  }
  if (selector.charCodeAt(i) !== 93 /* ] */)
    throw new Error('Expected ]')
  i++
  if (ignoreCase === null && !xmlMode && ATTRIBUTES_QUIRKS.has(attribute.toLowerCase()))
    ignoreCase = 'quirks' as any
  void options
  void len
  tokens.push({
    type: 'attribute',
    name: lowerCaseAttrs ? attribute.toLowerCase() : attribute,
    action,
    value,
    namespace: null,
    ignoreCase,
  })
  return i
}

function parsePseudo(selector: string, idx: number, tokens: Selector[], options: ParseOptions): number {
  if (selector.charCodeAt(idx + 1) === 58 /* : */) {
    let i = idx + 2
    const r = readName(selector, i)
    i = r.end
    const name = r.value.toLowerCase()
    let data: string | null = null
    if (selector.charCodeAt(i) === 40 /* ( */) {
      const end = findClose(selector, i)
      data = selector.slice(i + 1, end).trim()
      i = end + 1
    }
    tokens.push({ type: 'pseudo-element', name, data })
    return i
  }
  let i = idx + 1
  const r = readName(selector, i)
  i = r.end
  const name = r.value.toLowerCase()
  if (selector.charCodeAt(i) === 40 /* ( */) {
    const end = findClose(selector, i)
    const inner = selector.slice(i + 1, end)
    i = end + 1
    if (name === 'is' || name === 'not' || name === 'where' || name === 'has' || name === 'matches' || name === '-moz-any' || name === '-webkit-any') {
      const sub: Selector[][] = []
      parseSelectorImpl(sub, inner.trim(), options, 0)
      tokens.push({ type: 'pseudo', name, data: sub })
    }
    else {
      tokens.push({ type: 'pseudo', name, data: inner.trim() })
    }
  }
  else {
    tokens.push({ type: 'pseudo', name, data: null })
  }
  return i
}

function addTraversal(tokens: Selector[], type: 'adjacent' | 'child' | 'descendant' | 'parent' | 'sibling' | 'column-combinator'): void {
  if (tokens.length > 0 && tokens[tokens.length - 1]!.type === 'descendant' && type !== 'descendant')
    tokens.pop()
  if (tokens.length > 0 && (tokens[tokens.length - 1]!.type === type))
    return
  tokens.push({ type } as any)
}

function findEndOfString(selector: string, start: number, qCode: number): number {
  let i = start
  const len = selector.length
  while (i < len) {
    const c = selector.charCodeAt(i)
    if (c === 92 /* \ */) {
      i += 2
      continue
    }
    if (c === qCode)
      return i
    i++
  }
  throw new Error('Unterminated string')
}

// eslint-disable-next-line pickier/no-unused-vars
function findClose(selector: string, openParen: number): number {
  let depth = 1
  let i = openParen + 1
  const len = selector.length
  while (i < len) {
    const c = selector.charCodeAt(i)
    if (c === 92 /* \ */) { i += 2; continue }
    if (c === 34 /* " */ || c === 39 /* ' */) {
      i = findEndOfString(selector, i + 1, c) + 1
      continue
    }
    if (c === 40 /* ( */) depth++
    else if (c === 41 /* ) */) {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  throw new Error('Unterminated parenthesis')
}
