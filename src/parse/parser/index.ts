/**
 * CSS parser. Recursive-descent over the tokenizer output. Produces an
 * AST shape compatible with css-tree v3 (so consumer walker callbacks
 * remain unchanged).
 *
 * Implemented contexts:
 *   stylesheet | declarationList | declaration | atrule | atrulePrelude
 *   selectorList | selector | rule | block | value | mediaQuery
 *   mediaQueryList | raw
 *
 * Options recognised (all match css-tree):
 *   parseValue, parseAtrulePrelude, parseCustomProperty, parseRulePrelude,
 *   filename, positions, context, onParseError
 */

import type {
  Atrule,
  AtrulePrelude,
  AttributeSelector,
  Block,
  ClassSelector,
  Combinator,
  CommentNode,
  CssLocation,
  CssNode,
  Declaration,
  DeclarationList,
  Identifier,
  IdSelector,
  ParenthesesNode,
  ParseContext,
  ParseOptions,
  PseudoClassSelector,
  PseudoElementSelector,
  Raw,
  Rule,
  Selector,
  SelectorList,
  StringNode,
  StyleSheet,
  TypeSelector,
  UrlNode,
  Value,
} from '../types'
import { CssList } from '../list'
import type { Token } from '../tokenizer'
import { decodeName, decodeString, Tokenizer, TokenType } from '../tokenizer'

interface ParserState {
  source: string
  // Parallel typed-array storage from the tokenizer. Direct reads avoid
  // per-token Object allocation in the hot loop.
  types: Uint8Array
  starts: Uint32Array
  ends: Uint32Array
  count: number
  /**
   * Effective end of token stream visible to the parser. Equals `count` for
   * normal parsing; gets temporarily lowered when we recurse into a
   * sub-range (e.g. a declaration's value tokens) so the parser sees
   * "virtual EOF" at the right boundary without re-tokenizing.
   */
  end: number
  pos: number
  positions: boolean
  filename: string | undefined
  parseValue: boolean
  parseAtrulePrelude: boolean
  parseCustomProperty: boolean
  parseRulePrelude: boolean
  // eslint-disable-next-line pickier/no-unused-vars
  onParseError?: (error: SyntaxError, fallbackNode: CssNode) => void
  tokenizer: Tokenizer
}

function makeState(source: string, options: ParseOptions): ParserState {
  const tokenizer = new Tokenizer(source)
  return {
    source,
    types: tokenizer.types,
    starts: tokenizer.starts,
    ends: tokenizer.ends,
    count: tokenizer.count,
    end: tokenizer.count,
    pos: 0,
    positions: options.positions ?? false,
    filename: options.filename,
    parseValue: options.parseValue ?? true,
    parseAtrulePrelude: options.parseAtrulePrelude ?? true,
    parseCustomProperty: options.parseCustomProperty ?? false,
    parseRulePrelude: options.parseRulePrelude ?? true,
    onParseError: options.onParseError,
    tokenizer,
  }
}

// ----- token-stream helpers -----
// Read directly from the parallel typed arrays. `peek(s)` materialises a
// `Token` view object lazily — most parser code only needs `.type` /
// `.start` / `.end` which the helpers below expose without an alloc.

function peekType(s: ParserState): TokenType {
  return s.pos < s.end ? (s.types[s.pos]! as TokenType) : TokenType.EOF
}

function peek(s: ParserState): Token {
  const i = s.pos
  if (i >= s.end)
    return { type: TokenType.EOF, start: s.starts[i]! ?? s.source.length, end: s.ends[i]! ?? s.source.length }
  return { type: s.types[i]! as TokenType, start: s.starts[i]!, end: s.ends[i]! }
}

function consume(s: ParserState): Token {
  const i = s.pos++
  if (i >= s.end)
    return { type: TokenType.EOF, start: s.starts[i]! ?? s.source.length, end: s.ends[i]! ?? s.source.length }
  return { type: s.types[i]! as TokenType, start: s.starts[i]!, end: s.ends[i]! }
}

function tokenSlice(s: ParserState, t: Token): string {
  return s.source.slice(t.start, t.end)
}

function skipWhitespace(s: ParserState): void {
  const types = s.types
  const end = s.end
  while (s.pos < end) {
    const t = types[s.pos]!
    if (t === TokenType.WhiteSpace || t === TokenType.Comment)
      s.pos++
    else
      break
  }
}

function skipWhitespaceOnly(s: ParserState): void {
  const types = s.types
  const end = s.end
  while (s.pos < end && types[s.pos]! === TokenType.WhiteSpace)
    s.pos++
}

function loc(s: ParserState, startTok: Token, endTok: Token): CssLocation | null {
  if (!s.positions)
    return null
  const start = s.tokenizer.locate(startTok.start)
  const end = s.tokenizer.locate(endTok.end)
  return {
    source: s.filename ?? '<unknown>',
    start: { offset: startTok.start, line: start.line, column: start.column },
    end: { offset: endTok.end, line: end.line, column: end.column },
  }
}

function emptyLoc(s: ParserState): CssLocation | null {
  if (!s.positions)
    return null
  const t = peek(s)
  const p = s.tokenizer.locate(t.start)
  return {
    source: s.filename ?? '<unknown>',
    start: { offset: t.start, line: p.line, column: p.column },
    end: { offset: t.start, line: p.line, column: p.column },
  }
}

// ----- node constructors -----

function rawNode(value: string, start: Token, end: Token, s: ParserState): Raw {
  return { type: 'Raw', value, loc: loc(s, start, end) }
}

function newList<T>(): CssList<T> {
  return new CssList<T>()
}

/**
 * Report a parse problem to the consumer. Always returns the supplied
 * fallback node so call sites can `return reportError(…, raw)`. The
 * `onParseError` hook lets consumers (linters, IDEs) surface
 * the parser's recovery substitutions.
 */
function reportError(s: ParserState, message: string, at: Token, fallback: CssNode): CssNode {
  if (s.onParseError) {
    const { line, column } = s.tokenizer.locate(at.start)
    const err = new SyntaxError(`${s.filename ?? '<input>'}:${line}:${column}: ${message}`) as SyntaxError & { line: number, column: number, offset: number }
    err.line = line
    err.column = column
    err.offset = at.start
    s.onParseError(err, fallback)
  }
  return fallback
}

// ----- top-level dispatch -----

export function parse(source: string, options: ParseOptions = {}): CssNode {
  const s = makeState(source, options)
  const ctx: ParseContext = options.context ?? 'stylesheet'

  switch (ctx) {
    case 'stylesheet': return parseStyleSheet(s)
    case 'atrule': return parseAtrule(s) ?? makeEmptyStyleSheet(s)
    case 'atrulePrelude': return parseAtrulePreludeContext(s)
    case 'mediaQuery':
    case 'mediaQueryList': return parseRawAsValue(s)
    case 'rule': return parseRule(s)
    case 'selectorList': return parseSelectorList(s)
    case 'selector': return parseSelector(s)
    case 'block': return parseBlock(s)
    case 'declarationList': return parseDeclarationList(s)
    case 'declaration': return parseDeclaration(s) ?? makeEmptyStyleSheet(s)
    case 'value': return parseValue(s)
    case 'raw': return parseRawAsValue(s)
    default: return parseStyleSheet(s)
  }
}

function makeEmptyStyleSheet(s: ParserState): StyleSheet {
  return { type: 'StyleSheet', children: newList<CssNode>(), loc: emptyLoc(s) }
}

function parseRawAsValue(s: ParserState): Raw {
  const start = peek(s)
  let end = start
  while (peekType(s) !== TokenType.EOF) {
    end = consume(s)
  }
  return { type: 'Raw', value: s.source.slice(start.start, end.end), loc: loc(s, start, end) }
}

// ----- stylesheet -----

function parseStyleSheet(s: ParserState): StyleSheet {
  const startTok = peek(s)
  const children = newList<CssNode>()
  const types = s.types
  const end = s.end
  // Hot loop: read type from the typed array directly to avoid the
  // per-iteration Token-object alloc that `peek()` would do.
  while (s.pos < end) {
    const t = types[s.pos]!
    if (t === TokenType.WhiteSpace) {
      s.pos++
      continue
    }
    if (t === TokenType.Comment) {
      const tok: Token = { type: TokenType.Comment, start: s.starts[s.pos]!, end: s.ends[s.pos]! }
      const node = makeComment(s, tok)
      s.pos++
      children.appendData(node)
      continue
    }
    if (t === TokenType.EOF)
      break
    if (t === TokenType.CDO || t === TokenType.CDC) {
      s.pos++
      continue
    }
    if (t === TokenType.AtKeyword) {
      const at = parseAtrule(s)
      if (at)
        children.appendData(at)
      continue
    }
    // Top-level safety: a stray `}` (mismatched braces in malformed input)
    // would otherwise let parseRule return without advancing — guard against
    // the infinite loop here rather than embedding the check inside parseRule.
    if (t === TokenType.RightCurlyBracket) {
      s.pos++
      continue
    }
    const before = s.pos
    const r = parseRule(s)
    children.appendData(r)
    if (s.pos === before)
      s.pos++
  }
  const lastIdx = s.end - 1
  const endTok: Token = lastIdx >= 0
    ? { type: s.types[lastIdx]! as TokenType, start: s.starts[lastIdx]!, end: s.ends[lastIdx]! }
    : { type: TokenType.EOF, start: 0, end: 0 }
  return { type: 'StyleSheet', children, loc: loc(s, startTok, endTok) }
}

function makeComment(s: ParserState, t: Token): CommentNode {
  return { type: 'Comment', value: s.source.slice(t.start + 2, t.end - 2), loc: loc(s, t, t) }
}

// ----- at-rule -----

function parseAtrule(s: ParserState): Atrule | null {
  const startTok = peek(s)
  if (startTok.type !== TokenType.AtKeyword)
    return null
  s.pos++
  const name = lowerIfNeeded(s.source, startTok.start + 1, startTok.end)

  // Collect prelude tokens until ; or { — pre-scan for the boundary.
  skipWhitespace(s)
  const preludeStartPos = s.pos
  const preludeStartTok = peek(s)
  const types = s.types
  const tend = s.end
  let scanPos = preludeStartPos
  let preludeEndPos = preludeStartPos
  while (scanPos < tend) {
    const t = types[scanPos]!
    if (t === TokenType.EOF || t === TokenType.Semicolon || t === TokenType.LeftCurlyBracket)
      break
    if (t !== TokenType.WhiteSpace && t !== TokenType.Comment)
      preludeEndPos = scanPos + 1
    scanPos++
  }

  let prelude: AtrulePrelude | Raw | null = null
  if (preludeEndPos > preludeStartPos) {
    const preludeStartByte = s.starts[preludeStartPos]!
    const preludeEndByte = s.ends[preludeEndPos - 1]!
    const preludeEndTok: Token = { type: types[preludeEndPos - 1]! as TokenType, start: s.starts[preludeEndPos - 1]!, end: preludeEndByte }
    const raw = s.source.slice(preludeStartByte, preludeEndByte).trim()
    if (raw.length > 0) {
      if (s.parseAtrulePrelude) {
        try {
          // Run the prelude parser on the existing token stream — temporarily
          // restrict `s.end` to the prelude boundary so the loop sees EOF.
          const savedEnd = s.end
          s.end = preludeEndPos
          s.pos = preludeStartPos
          const children = newList<CssNode>()
          while (peekType(s) !== TokenType.EOF) {
            const node = parseValueChild(s)
            if (node)
              children.appendData(node)
          }
          promoteRatiosDeep(children)
          s.end = savedEnd
          // pos lands on the ; or { boundary so parseAtrule's caller can
          // dispatch on the next token without re-walking.
          s.pos = scanPos
          if (children.isEmpty)
            prelude = rawNode(raw, preludeStartTok, preludeEndTok, s)
          else
            prelude = { type: 'AtrulePrelude', children, loc: null }
        }
        catch (err) {
          const fallback = rawNode(raw, preludeStartTok, preludeEndTok, s)
          reportError(s, `Failed to parse @${name} prelude: ${(err as Error).message}`, preludeStartTok, fallback)
          prelude = fallback
          s.pos = scanPos
        }
      }
      else {
        prelude = rawNode(raw, preludeStartTok, preludeEndTok, s)
        s.pos = scanPos
      }
    }
    else {
      s.pos = scanPos
    }
  }
  else {
    s.pos = scanPos
  }

  let block: Block | null = null
  if (peekType(s) === TokenType.Semicolon) {
    consume(s)
  }
  else if (peekType(s) === TokenType.LeftCurlyBracket) {
    block = parseBlock(s, AT_RULES_WITH_NESTED_RULES.has(name))
  }

  return { type: 'Atrule', name, prelude, block, loc: loc(s, startTok, peek(s)) }
}

/**
 * Pseudo-class names whose argument is a selector list and needs to be
 * re-parsed by `parseSelectorList` (rather than collected as a value).
 */
const SELECTOR_LIST_PSEUDOS_PARSE: ReadonlySet<string> = new Set([
  'is', 'not', 'where', 'has', 'matches', '-moz-any', '-webkit-any',
])

/**
 * At-rules whose block contains nested *rules* (selector { … }), as
 * opposed to direct declarations. Used to switch parser mode inside the
 * block. Lives here (not on _collections) because it's a parser concern.
 */
const AT_RULES_WITH_NESTED_RULES: ReadonlySet<string> = new Set([
  'media',
  'supports',
  'document',
  'layer',
  'container',
  'scope',
  'starting-style',
  '-moz-document',
  // keyframes — children are rules with `from` / `to` / `50%` preludes
  'keyframes',
  '-webkit-keyframes',
  '-moz-keyframes',
  '-o-keyframes',
])

function parseAtrulePreludeContext(s: ParserState): AtrulePrelude {
  const startTok = peek(s)
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF) {
    const t = peek(s)
    if (t.type === TokenType.WhiteSpace) {
      s.pos++
      continue
    }
    const node = parseValueChild(s)
    if (node)
      children.appendData(node)
  }
  return { type: 'AtrulePrelude', children, loc: loc(s, startTok, peek(s)) }
}

// ----- rule -----

function parseRule(s: ParserState): Rule {
  const startTok = peek(s)

  let prelude: SelectorList | Raw
  if (s.parseRulePrelude) {
    // Parse the selector list straight from the existing token stream —
    // `parseSelectorList` stops at `,`-terminated boundaries internally and
    // at the leading `{` of the block, so no re-tokenization is needed.
    prelude = parseSelectorList(s)
  }
  else {
    // Raw fallback: collect tokens up to `{` and slice the text.
    const preludeStart = peek(s)
    let preludeEnd = preludeStart
    while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.LeftCurlyBracket)
      preludeEnd = consume(s)
    const preludeText = s.source.slice(preludeStart.start, preludeEnd.end).trim()
    prelude = rawNode(preludeText, preludeStart, preludeEnd, s)
  }

  // Rules support CSS Nesting (`.foo { color: red; & .bar { color: blue } }`)
  // — `allowNested` flips on the lookahead that distinguishes a nested
  // rule from a declaration with the same opening tokens.
  const block = parseBlock(s, true)
  return { type: 'Rule', prelude, block, loc: loc(s, startTok, peek(s)) }
}

// ----- block -----

function parseBlock(s: ParserState, allowNested: boolean = false): Block {
  const startTok = peek(s)
  if (peekType(s) !== TokenType.LeftCurlyBracket)
    return { type: 'Block', children: newList<CssNode>(), loc: emptyLoc(s) }
  s.pos++ // {
  const children = newList<CssNode>()
  const types = s.types
  const end = s.end
  while (s.pos < end) {
    const t = types[s.pos]!
    if (t === TokenType.RightCurlyBracket || t === TokenType.EOF)
      break
    if (t === TokenType.WhiteSpace) {
      s.pos++
      continue
    }
    if (t === TokenType.Comment) {
      const tok: Token = { type: TokenType.Comment, start: s.starts[s.pos]!, end: s.ends[s.pos]! }
      s.pos++
      children.appendData(makeComment(s, tok))
      continue
    }
    if (t === TokenType.AtKeyword) {
      const at = parseAtrule(s)
      if (at)
        children.appendData(at)
      continue
    }
    if (allowNested && lookahead(s, isCurlyAheadBeforeSemicolon)) {
      const r = parseRule(s)
      children.appendData(r)
      continue
    }
    const decl = parseDeclaration(s)
    if (decl)
      children.appendData(decl)
    if (s.pos < end && types[s.pos]! === TokenType.Semicolon)
      s.pos++
  }
  if (peekType(s) === TokenType.RightCurlyBracket)
    s.pos++
  return { type: 'Block', children, loc: loc(s, startTok, peek(s)) }
}

function lookahead(s: ParserState, predicate: (s: ParserState) => boolean): boolean {
  const saved = s.pos
  const r = predicate(s)
  s.pos = saved
  return r
}

function isCurlyAheadBeforeSemicolon(s: ParserState): boolean {
  const types = s.types
  const end = s.end
  while (s.pos < end) {
    const t = types[s.pos]!
    if (t === TokenType.LeftCurlyBracket)
      return true
    if (t === TokenType.Semicolon || t === TokenType.RightCurlyBracket || t === TokenType.EOF)
      return false
    s.pos++
  }
  return false
}

// ----- declarationList -----

function parseDeclarationList(s: ParserState): DeclarationList {
  const startTok = peek(s)
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.RightCurlyBracket) {
    const t = peek(s)
    if (t.type === TokenType.WhiteSpace) {
      s.pos++
      continue
    }
    if (t.type === TokenType.Comment) {
      children.appendData(makeComment(s, consume(s)))
      continue
    }
    if (t.type === TokenType.Semicolon) {
      s.pos++
      continue
    }
    if (t.type === TokenType.AtKeyword) {
      const at = parseAtrule(s)
      if (at)
        children.appendData(at)
      continue
    }
    const decl = parseDeclaration(s)
    if (decl)
      children.appendData(decl)
    if (peekType(s) === TokenType.Semicolon)
      consume(s)
  }
  return { type: 'DeclarationList', children, loc: loc(s, startTok, peek(s)) }
}

// ----- declaration -----

function parseDeclaration(s: ParserState): Declaration | null {
  skipWhitespace(s)
  const startTok = peek(s)
  if (startTok.type !== TokenType.Ident && startTok.type !== TokenType.Hash && !(startTok.type === TokenType.Delim && s.source[startTok.start] === '*' && s.source[startTok.start + 1] === ' ')) {
    if (startTok.type === TokenType.Delim && s.source[startTok.start] === '*') {
      // ie *property
      s.pos++
    }
    else {
      reportError(s, `Expected property name`, startTok, { type: 'Raw', value: '', loc: null })
      const types = s.types
      const end = s.end
      while (s.pos < end) {
        const t = types[s.pos]!
        if (t === TokenType.EOF || t === TokenType.Semicolon || t === TokenType.RightCurlyBracket)
          break
        s.pos++
      }
      return null
    }
  }
  const propStart = s.starts[s.pos]!
  const propEnd = s.ends[s.pos]!
  s.pos++
  let property = s.source.slice(propStart, propEnd)

  skipWhitespaceOnly(s)
  if (peekType(s) !== TokenType.Colon) {
    reportError(s, `Expected ':' after property "${property}"`, peek(s), { type: 'Raw', value: '', loc: null })
    const types = s.types
    const end = s.end
    while (s.pos < end) {
      const t = types[s.pos]!
      if (t === TokenType.EOF || t === TokenType.Semicolon || t === TokenType.RightCurlyBracket)
        break
      s.pos++
    }
    return null
  }
  s.pos++ // :

  skipWhitespaceOnly(s)
  // Pre-scan the value token range. We track:
  //   - lastNonWsPos: index after the last non-whitespace value token
  //     (where the parsable value ends — excludes trailing whitespace/!important)
  //   - importantPos: position of the `important` ident if !important detected
  //   - endPos: stop position (Semicolon/RightCurly/EOF)
  // This avoids re-tokenizing the value text — the parser walks the
  // already-tokenised stream directly.
  const types = s.types
  const starts = s.starts
  const tend = s.end
  const valueStartPos = s.pos
  let scanPos = valueStartPos
  let lastNonWsPos = valueStartPos
  let importantIdentPos = -1
  let bangPos = -1
  while (scanPos < tend) {
    const t = types[scanPos]!
    if (t === TokenType.EOF || t === TokenType.Semicolon || t === TokenType.RightCurlyBracket)
      break
    if (t === TokenType.Delim && s.source.charCodeAt(starts[scanPos]!) === 33 /* ! */) {
      // potential !important — peek next non-ws
      let look = scanPos + 1
      while (look < tend && types[look]! === TokenType.WhiteSpace) look++
      if (look < tend && types[look]! === TokenType.Ident) {
        const ts = starts[look]!
        const te = s.ends[look]!
        // Inline lowercase compare for "important" (9 chars)
        if (te - ts === 9
          && (s.source.charCodeAt(ts) | 32) === 105
          && (s.source.charCodeAt(ts + 1) | 32) === 109
          && (s.source.charCodeAt(ts + 2) | 32) === 112
          && (s.source.charCodeAt(ts + 3) | 32) === 111
          && (s.source.charCodeAt(ts + 4) | 32) === 114
          && (s.source.charCodeAt(ts + 5) | 32) === 116
          && (s.source.charCodeAt(ts + 6) | 32) === 97
          && (s.source.charCodeAt(ts + 7) | 32) === 110
          && (s.source.charCodeAt(ts + 8) | 32) === 116) {
          bangPos = scanPos
          importantIdentPos = look
          scanPos = look + 1
          continue
        }
      }
    }
    if (t !== TokenType.WhiteSpace && t !== TokenType.Comment)
      lastNonWsPos = scanPos + 1
    scanPos++
  }

  // The value range, parser-relative: [valueStartPos, valueEndPos).
  // `lastNonWsPos` already excludes both the trailing whitespace AND the
  // !important suffix because we don't update it inside the bang branch.
  void bangPos
  const valueEndPos = lastNonWsPos
  const importantTok: Token | null = importantIdentPos >= 0
    ? { type: TokenType.Ident, start: starts[importantIdentPos]!, end: s.ends[importantIdentPos]! }
    : null

  // `property` came directly from a single Ident token's source slice, so
  // it can't have leading/trailing whitespace — the previous `.trim()`
  // here was load-bearing only when the slice path included whitespace
  // chars, which doesn't happen with the tokenizer.
  const isCustom = property.startsWith('--')
  let value: Value | Raw
  const valueStartByte = starts[valueStartPos]!
  const valueEndByte = valueEndPos > valueStartPos ? s.ends[valueEndPos - 1]! : valueStartByte
  const valueStartTok: Token = { type: types[valueStartPos]! as TokenType, start: valueStartByte, end: s.ends[valueStartPos]! }
  const valueEndTok: Token = valueEndPos > valueStartPos
    ? { type: types[valueEndPos - 1]! as TokenType, start: starts[valueEndPos - 1]!, end: valueEndByte }
    : valueStartTok

  if ((isCustom && !s.parseCustomProperty) || !s.parseValue) {
    const valueText = s.source.slice(valueStartByte, valueEndByte).trim()
    value = { type: 'Raw', value: valueText, loc: loc(s, valueStartTok, valueEndTok) }
  }
  else if (valueEndPos === valueStartPos) {
    value = { type: 'Value', children: newList<CssNode>(), loc: loc(s, valueStartTok, valueEndTok) }
  }
  else {
    // Run parseValueChildren on the existing token stream by temporarily
    // shrinking `s.end` to the value boundary so the parser sees a virtual
    // EOF at the right place. No re-tokenization required.
    const savedEnd = s.end
    s.end = valueEndPos
    s.pos = valueStartPos
    value = parseValueChildren(s)
    s.end = savedEnd
  }

  // Position the parser at the boundary token (Semicolon / RightCurly / EOF).
  // `scanPos` already advanced past !important when it was detected.
  s.pos = scanPos

  return {
    type: 'Declaration',
    property,
    important: importantTok ? true : false,
    value,
    loc: loc(s, startTok, peek(s)),
  }
}

// ----- value -----

function parseValue(s: ParserState): Value {
  return parseValueChildren(s)
}

function parseValueChildren(s: ParserState): Value {
  const startTok = peek(s)
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF
    && peekType(s) !== TokenType.Semicolon
    && peekType(s) !== TokenType.RightCurlyBracket
    && peekType(s) !== TokenType.RightParenthesis
    && peekType(s) !== TokenType.RightSquareBracket) {
    const node = parseValueChild(s)
    if (node)
      children.appendData(node)
  }
  promoteRatios(children)
  return { type: 'Value', children, loc: loc(s, startTok, peek(s)) }
}

/**
 * Recursive ratio promotion — walk every nested children list (Function,
 * Parentheses, AtrulePrelude, etc.) and run `promoteRatios` on each.
 */
function promoteRatiosDeep(list: CssList<CssNode>): void {
  for (const child of list) {
    if ('children' in child && (child as any).children instanceof CssList)
      promoteRatiosDeep((child as any).children)
  }
  promoteRatios(list)
}

/**
 * Walk a children list and promote `Number / Number` sequences (with
 * optional WhiteSpace around the slash) into a single `Ratio` node.
 * Mirrors css-tree's handling of `aspect-ratio: 16/9`.
 */
function promoteRatios(list: CssList<CssNode>): void {
  let cur = list.head
  while (cur) {
    if (cur.data.type === 'Number') {
      // skip whitespace
      let slashItem = cur.next
      while (slashItem && slashItem.data.type === 'WhiteSpace')
        slashItem = slashItem.next
      if (slashItem && slashItem.data.type === 'Operator' && (slashItem.data as { value: string }).value === '/') {
        let rightItem = slashItem.next
        while (rightItem && rightItem.data.type === 'WhiteSpace')
          rightItem = rightItem.next
        if (rightItem && rightItem.data.type === 'Number') {
          // Build Ratio and splice it in.
          const ratio: CssNode = {
            type: 'Ratio',
            left: cur.data as any,
            right: rightItem.data as any,
            loc: null,
          }
          // Remove items between cur (exclusive end) and rightItem (inclusive)
          let toRemove = cur.next
          while (toRemove && toRemove !== rightItem.next) {
            const nxt = toRemove.next
            list.remove(toRemove)
            toRemove = nxt
          }
          list.replace(cur, list.createItem(ratio))
          cur = list.head // restart — list pointer changed
          continue
        }
      }
    }
    cur = cur.next
  }
}

function parseValueChild(s: ParserState): CssNode | null {
  const i = s.pos
  if (i >= s.end)
    return null
  const ttype = s.types[i]! as TokenType
  const tstart = s.starts[i]!
  const tend = s.ends[i]!
  const src = s.source
  switch (ttype) {
    case TokenType.WhiteSpace: {
      s.pos++
      return s.positions
        ? { type: 'WhiteSpace', value: ' ', loc: locRange(s, tstart, tend) }
        : { type: 'WhiteSpace', value: ' ', loc: null }
    }
    case TokenType.Comment: {
      s.pos++
      return { type: 'Comment', value: src.slice(tstart + 2, tend - 2), loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Number: {
      s.pos++
      return { type: 'Number', value: src.slice(tstart, tend), loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Percentage: {
      s.pos++
      return { type: 'Percentage', value: src.slice(tstart, tend - 1), loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Dimension: {
      s.pos++
      // Manual scan: number portion ends where the unit (alpha/`-`/escape)
      // begins. Faster than the previous regex.
      let unitStart = tstart
      // optional sign
      const c0 = src.charCodeAt(unitStart)
      if (c0 === 43 /* + */ || c0 === 45 /* - */)
        unitStart++
      // integer/fractional digits and a single dot
      let sawDot = false
      while (unitStart < tend) {
        const c = src.charCodeAt(unitStart)
        if (c >= 48 && c <= 57) {
          unitStart++
          continue
        }
        if (c === 46 && !sawDot) {
          sawDot = true
          unitStart++
          continue
        }
        break
      }
      // optional scientific notation
      const eC = src.charCodeAt(unitStart)
      if ((eC === 69 || eC === 101) /* e/E */) {
        let look = unitStart + 1
        const sgn = src.charCodeAt(look)
        if (sgn === 43 || sgn === 45) look++
        let any = false
        while (look < tend) {
          const c = src.charCodeAt(look)
          if (c >= 48 && c <= 57) { look++; any = true; continue }
          break
        }
        if (any) unitStart = look
      }
      return {
        type: 'Dimension',
        value: src.slice(tstart, unitStart),
        unit: src.slice(unitStart, tend),
        loc: s.positions ? locRange(s, tstart, tend) : null,
      }
    }
    case TokenType.Ident: {
      s.pos++
      return { type: 'Identifier', name: decodeName(src, tstart, tend), loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.String: {
      s.pos++
      const innerStart = tstart + 1
      const closesProperly = tend - tstart >= 2 && src.charCodeAt(tend - 1) === src.charCodeAt(tstart)
      const innerEnd = closesProperly ? tend - 1 : tend
      const value = decodeString(src, innerStart, innerEnd)
      return { type: 'String', value, loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Url: {
      s.pos++
      // url(<inner>) — strip `url(` and the matching `)` (and any quotes
      // on the inner if present), avoiding a regex+slice chain.
      let a = tstart + 4 // past `url(`
      while (a < tend && isWhitespaceCode(src.charCodeAt(a))) a++
      let b = tend
      if (b > a && src.charCodeAt(b - 1) === 41 /* ) */) b--
      while (b > a && isWhitespaceCode(src.charCodeAt(b - 1))) b--
      let value: string
      if (b - a >= 2) {
        const q0 = src.charCodeAt(a)
        const q1 = src.charCodeAt(b - 1)
        if ((q0 === 34 || q0 === 39) && q0 === q1)
          value = src.slice(a + 1, b - 1)
        else
          value = src.slice(a, b)
      }
      else {
        value = src.slice(a, b)
      }
      return { type: 'Url', value, loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Hash: {
      s.pos++
      return { type: 'Hash', name: src.slice(tstart + 1, tend), loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Function: {
      return parseFunction(s)
    }
    case TokenType.LeftParenthesis: {
      return parseParentheses(s)
    }
    case TokenType.Comma: {
      s.pos++
      return { type: 'Operator', value: ',', loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Colon: {
      s.pos++
      return { type: 'Operator', value: ':', loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.Delim: {
      s.pos++
      const code = src.charCodeAt(tstart)
      const ch = src[tstart]!
      // ASCII bitmap: `/ + - * = > < ~ | $ ^ ! &` — Operator semantics in
      // value contexts. Anything else falls through as an Identifier
      // (e.g. `&` mid-value, `!` outside !important, etc.).
      if (isValueOperatorChar(code))
        return { type: 'Operator', value: ch, loc: s.positions ? locRange(s, tstart, tend) : null }
      return { type: 'Identifier', name: ch, loc: s.positions ? locRange(s, tstart, tend) : null }
    }
    case TokenType.LeftSquareBracket: {
      // `[…]` inside a value (e.g. `grid-template-columns: [start] 1fr`)
      // becomes a `Brackets` node — matches css-tree's shape so consumers
      // walking nested values don't see a Raw blob here.
      s.pos++
      const children = newList<CssNode>()
      while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.RightSquareBracket) {
        const inner = parseValueChild(s)
        if (inner)
          children.appendData(inner)
      }
      const endByte = s.pos < s.end ? s.ends[s.pos]! : tend
      if (peekType(s) === TokenType.RightSquareBracket)
        s.pos++
      return { type: 'Brackets', children, loc: s.positions ? locRange(s, tstart, endByte) : null }
    }
    case TokenType.AtKeyword:
    case TokenType.LeftCurlyBracket:
    case TokenType.RightCurlyBracket:
    case TokenType.RightParenthesis:
    case TokenType.RightSquareBracket:
    case TokenType.Semicolon:
    case TokenType.EOF:
    case TokenType.CDO:
    case TokenType.CDC:
    case TokenType.BadString:
    case TokenType.BadUrl: {
      s.pos++
      return { type: 'Raw', value: src.slice(tstart, tend), loc: s.positions ? locRange(s, tstart, tend) : null }
    }
  }
  s.pos++
  return null
}

function isWhitespaceCode(c: number): boolean {
  return c === 32 || c === 9 || c === 10 || c === 12 || c === 13
}

function isValueOperatorChar(code: number): boolean {
  // / + - * = > < ~ | $ ^ ! &
  return code === 47 || code === 43 || code === 45 || code === 42
    || code === 61 || code === 62 || code === 60 || code === 126
    || code === 124 || code === 36 || code === 94 || code === 33
    || code === 38
}

/**
 * Slice `source[start:end]` and lowercase it, but only allocate a new
 * string when the slice actually contains uppercase ASCII. Pure-ASCII
 * lowercase identifiers (the common case) fast-path through `slice`.
 */
function lowerIfNeeded(source: string, start: number, end: number): string {
  for (let i = start; i < end; i++) {
    const c = source.charCodeAt(i)
    if (c >= 65 && c <= 90)
      return source.slice(start, end).toLowerCase()
  }
  return source.slice(start, end)
}

function locRange(s: ParserState, startByte: number, endByte: number): CssLocation {
  const start = s.tokenizer.locate(startByte)
  const end = s.tokenizer.locate(endByte)
  return {
    source: s.filename ?? '<unknown>',
    start: { offset: startByte, line: start.line, column: start.column },
    end: { offset: endByte, line: end.line, column: end.column },
  }
}

function parseFunction(s: ParserState): CssNode {
  const startTok = consume(s) // function token (including `(`)
  // Fast path: scan for any uppercase ASCII before allocating a lower-case
  // copy. Most function names in real stylesheets (`rgb`, `var`, `calc`,
  // `linear-gradient`, …) are already lowercase, so the scan-with-no-upper
  // path saves the `.toLowerCase()` allocation per Function token.
  const name = lowerIfNeeded(s.source, startTok.start, startTok.end - 1)
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.RightParenthesis) {
    const node = parseValueChild(s)
    if (node)
      children.appendData(node)
  }
  if (peekType(s) === TokenType.RightParenthesis)
    consume(s)

  // Normalise url("…") / url('…') into a Url node (matches css-tree shape).
  // Walk the linked list directly — avoids the `toArray()` allocation.
  if (name === 'url') {
    for (let cur: any = children.head; cur != null; cur = cur.next) {
      if (cur.data.type === 'String')
        return { type: 'Url', value: (cur.data as any).value, loc: loc(s, startTok, peek(s)) } as UrlNode
    }
  }

  return { type: 'Function', name, children, loc: loc(s, startTok, peek(s)) }
}

function parseParentheses(s: ParserState): ParenthesesNode {
  const startTok = consume(s) // (
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.RightParenthesis) {
    const node = parseValueChild(s)
    if (node)
      children.appendData(node)
  }
  if (peekType(s) === TokenType.RightParenthesis)
    consume(s)
  return { type: 'Parentheses', children, loc: loc(s, startTok, peek(s)) }
}

// ----- selectorList / selector -----

function parseSelectorList(s: ParserState): SelectorList {
  const startTok = peek(s)
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF) {
    skipWhitespace(s)
    if (peekType(s) === TokenType.EOF || peekType(s) === TokenType.LeftCurlyBracket)
      break
    const sel = parseSelector(s)
    // Skip empty selectors entirely — these arise from malformed input
    // like `,, .a {}` where parseSelector hits a `,` without finding any
    // segment. Adding them would surface as `Rule.prelude.children: [{},…]`
    // and break round-trips downstream.
    if ((sel.children as any).head !== null)
      children.appendData(sel)
    skipWhitespace(s)
    if (peekType(s) === TokenType.Comma) {
      consume(s)
      continue
    }
    break
  }
  return { type: 'SelectorList', children, loc: loc(s, startTok, peek(s)) }
}

function parseSelector(s: ParserState): Selector {
  const startTok = peek(s)
  const children = newList<CssNode>()
  let lastWasCombinator = true
  while (peekType(s) !== TokenType.EOF
    && peekType(s) !== TokenType.Comma
    && peekType(s) !== TokenType.LeftCurlyBracket) {
    const t = peek(s)
    if (t.type === TokenType.WhiteSpace) {
      consume(s)
      // descendant combinator only between segments — and only when the
      // next token isn't itself a combinator (`>`/`+`/`~` or `||`).
      if (!lastWasCombinator
        && peekType(s) !== TokenType.EOF
        && peekType(s) !== TokenType.Comma
        && peekType(s) !== TokenType.LeftCurlyBracket
        && !isExplicitCombinator(s)
        && !isColumnCombinator(s)) {
        const c: Combinator = { type: 'Combinator', name: ' ', loc: loc(s, t, t) }
        children.appendData(c)
        lastWasCombinator = true
      }
      continue
    }
    // Column combinator `||` — two consecutive `|` Delim tokens (CSS
    // Selectors 4). Detect before the single-char combinator path.
    if (
      t.type === TokenType.Delim
      && s.source.charCodeAt(t.start) === 124 /* | */
      && s.types[s.pos + 1] === TokenType.Delim
      && s.source.charCodeAt(s.starts[s.pos + 1]!) === 124
    ) {
      const startCol = peek(s)
      consume(s)
      const endCol = consume(s)
      const c: Combinator = { type: 'Combinator', name: '||', loc: loc(s, startCol, endCol) }
      children.appendData(c)
      lastWasCombinator = true
      skipWhitespace(s)
      continue
    }
    if (isExplicitCombinator(s)) {
      const ct = consume(s)
      const ch = s.source[ct.start]!
      const c: Combinator = { type: 'Combinator', name: ch, loc: loc(s, ct, ct) }
      children.appendData(c)
      lastWasCombinator = true
      skipWhitespace(s)
      continue
    }
    const seg = parseSelectorSegment(s)
    if (!seg)
      break
    children.appendData(seg)
    lastWasCombinator = false
  }
  // A trailing combinator (descendant or otherwise) is meaningless — the
  // selector ended before another segment arrived. Strip it so the AST
  // doesn't carry a phantom `Combinator` that round-trips to extra
  // whitespace at the end of the rule prelude.
  while (children.tail && (children.tail.data as CssNode).type === 'Combinator')
    children.remove(children.tail)
  return { type: 'Selector', children, loc: loc(s, startTok, peek(s)) }
}

function isExplicitCombinator(s: ParserState): boolean {
  const t = peek(s)
  if (t.type !== TokenType.Delim)
    return false
  const ch = s.source[t.start]!
  return ch === '>' || ch === '+' || ch === '~'
}

function isColumnCombinator(s: ParserState): boolean {
  // `||` — two consecutive `|` Delim tokens.
  if (s.types[s.pos] !== TokenType.Delim)
    return false
  if (s.source.charCodeAt(s.starts[s.pos]!) !== 124 /* | */)
    return false
  if (s.types[s.pos + 1] !== TokenType.Delim)
    return false
  return s.source.charCodeAt(s.starts[s.pos + 1]!) === 124
}

function parseSelectorSegment(s: ParserState): CssNode | null {
  const t = peek(s)
  switch (t.type) {
    case TokenType.Ident: {
      consume(s)
      // Namespace prefix? `svg|circle` → TypeSelector(name="svg|circle").
      // We keep the prefix as part of the name (matches css-tree shape).
      // Skip when the trailing `|` is part of `||` (column combinator) or
      // `|=` (attribute hyphen-match) — neither is a namespace separator.
      if (peekType(s) === TokenType.Delim && s.source[peek(s).start] === '|'
        && s.source[peek(s).start + 1] !== '='
        && !(s.types[s.pos + 1] === TokenType.Delim && s.source.charCodeAt(s.starts[s.pos + 1]!) === 124)) {
        consume(s)
        if (peekType(s) === TokenType.Ident) {
          const local = consume(s)
          const node: TypeSelector = {
            type: 'TypeSelector',
            name: `${tokenSlice(s, t)}|${tokenSlice(s, local)}`,
            loc: loc(s, t, local),
          }
          return node
        }
        if (peekType(s) === TokenType.Delim && s.source[peek(s).start] === '*') {
          const star = consume(s)
          const node: TypeSelector = {
            type: 'TypeSelector',
            name: `${tokenSlice(s, t)}|*`,
            loc: loc(s, t, star),
          }
          return node
        }
      }
      const node: TypeSelector = { type: 'TypeSelector', name: tokenSlice(s, t), loc: loc(s, t, t) }
      return node
    }
    // `@keyframes` rule preludes (`0%`, `100%`) parse as Percentage tokens.
    // Treat them as a TypeSelector so the round-trip preserves the literal.
    case TokenType.Percentage: {
      consume(s)
      const node: TypeSelector = { type: 'TypeSelector', name: tokenSlice(s, t), loc: loc(s, t, t) }
      return node
    }
    case TokenType.Number: {
      consume(s)
      const node: TypeSelector = { type: 'TypeSelector', name: tokenSlice(s, t), loc: loc(s, t, t) }
      return node
    }
    case TokenType.Delim: {
      const ch = s.source[t.start]!
      if (ch === '*') {
        consume(s)
        const node: TypeSelector = { type: 'TypeSelector', name: '*', loc: loc(s, t, t) }
        return node
      }
      if (ch === '.') {
        consume(s)
        if (peekType(s) === TokenType.Ident) {
          const id = consume(s)
          const node: ClassSelector = { type: 'ClassSelector', name: tokenSlice(s, id), loc: loc(s, t, id) }
          return node
        }
        return null
      }
      if (ch === '&') {
        consume(s)
        return { type: 'NestingSelector', loc: loc(s, t, t) }
      }
      consume(s)
      return null
    }
    case TokenType.Hash: {
      consume(s)
      const node: IdSelector = { type: 'IdSelector', name: s.source.slice(t.start + 1, t.end), loc: loc(s, t, t) }
      return node
    }
    case TokenType.Colon: {
      consume(s)
      const isElement = peekType(s) === TokenType.Colon
      if (isElement)
        consume(s)
      return parsePseudo(s, isElement, t)
    }
    case TokenType.LeftSquareBracket: {
      return parseAttribute(s)
    }
  }
  return null
}

function parsePseudo(s: ParserState, isElement: boolean, startTok: Token): PseudoClassSelector | PseudoElementSelector | null {
  const t = peek(s)
  if (t.type === TokenType.Ident) {
    consume(s)
    const name = lowerIfNeeded(s.source, t.start, t.end)
    const node = isElement
      ? { type: 'PseudoElementSelector' as const, name, children: null, loc: loc(s, startTok, t) }
      : { type: 'PseudoClassSelector' as const, name, children: null, loc: loc(s, startTok, t) }
    return node
  }
  if (t.type === TokenType.Function) {
    consume(s)
    const name = lowerIfNeeded(s.source, t.start, t.end - 1)
    const children = newList<CssNode>()

    // Pseudo-classes that take a selector list re-parse their argument.
    const isSelectorListPseudo = !isElement && SELECTOR_LIST_PSEUDOS_PARSE.has(name)
    if (isSelectorListPseudo) {
      // Slurp the argument tokens up to the matching `)` and re-parse them.
      const argStart = peek(s)
      let argEnd = argStart
      let depth = 1
      while (peekType(s) !== TokenType.EOF && depth > 0) {
        if (peekType(s) === TokenType.LeftParenthesis || peekType(s) === TokenType.Function)
          depth++
        else if (peekType(s) === TokenType.RightParenthesis) {
          depth--
          if (depth === 0)
            break
        }
        argEnd = consume(s)
      }
      if (peekType(s) === TokenType.RightParenthesis)
        consume(s)
      const inner = s.source.slice(argStart.start, argEnd.end).trim()
      if (inner.length > 0) {
        const sub = makeState(inner, { positions: false })
        const list = parseSelectorList(sub)
        children.appendData(list)
      }
    }
    else {
      while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.RightParenthesis) {
        const inner = parseValueChild(s)
        if (inner)
          children.appendData(inner)
      }
      if (peekType(s) === TokenType.RightParenthesis)
        consume(s)
    }

    if (isElement) {
      const node: PseudoElementSelector = { type: 'PseudoElementSelector', name, children, loc: loc(s, startTok, peek(s)) }
      return node
    }
    const node: PseudoClassSelector = { type: 'PseudoClassSelector', name, children, loc: loc(s, startTok, peek(s)) }
    return node
  }
  return null
}

function parseAttribute(s: ParserState): AttributeSelector | null {
  const startTok = consume(s) // [
  skipWhitespace(s)
  const nameTok = peek(s)
  if (nameTok.type !== TokenType.Ident)
    return null
  consume(s)
  const name: Identifier = { type: 'Identifier', name: tokenSlice(s, nameTok), loc: loc(s, nameTok, nameTok) }
  skipWhitespace(s)
  let matcher: string | null = null
  let value: StringNode | Identifier | null = null
  let flags: string | null = null
  const next = peek(s)
  if (next.type === TokenType.Delim) {
    const ch = s.source[next.start]!
    const ch2 = s.source[next.start + 1]
    if (ch === '=') {
      matcher = '='
      consume(s)
    }
    else if ((ch === '~' || ch === '|' || ch === '^' || ch === '$' || ch === '*') && ch2 === '=') {
      // Two consecutive delim tokens
      consume(s)
      const eq = peek(s)
      if (eq.type === TokenType.Delim && s.source[eq.start] === '=') {
        consume(s)
        matcher = `${ch}=`
      }
    }
    skipWhitespace(s)
    const v = peek(s)
    if (v.type === TokenType.String) {
      consume(s)
      const closesProperly = v.end - v.start >= 2 && s.source.charCodeAt(v.end - 1) === s.source.charCodeAt(v.start)
      const text = decodeString(s.source, v.start + 1, closesProperly ? v.end - 1 : v.end)
      value = { type: 'String', value: text, loc: loc(s, v, v) }
    }
    else if (v.type === TokenType.Ident) {
      consume(s)
      value = { type: 'Identifier', name: tokenSlice(s, v), loc: loc(s, v, v) }
    }
    skipWhitespace(s)
    const flagTok = peek(s)
    if (flagTok.type === TokenType.Ident) {
      consume(s)
      flags = tokenSlice(s, flagTok)
    }
  }
  skipWhitespace(s)
  let endTok = peek(s)
  if (peekType(s) === TokenType.RightSquareBracket) {
    endTok = consume(s)
  }
  return { type: 'AttributeSelector', name, matcher, value, flags, loc: loc(s, startTok, endTok) }
}

// expose some helpers for the public surface
export { TokenType }
