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
  AtrulePrelude,
  Atrule,
  AttributeSelector,
  Block,
  ClassSelector,
  Combinator,
  CommentNode,
  CssLocation,
  CssNode,
  Declaration,
  DeclarationList,
  DimensionNode,
  FunctionNode,
  HashNode,
  Identifier,
  IdSelector,
  NumberNode,
  OperatorNode,
  ParenthesesNode,
  ParseContext,
  ParseOptions,
  PercentageNode,
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
  WhiteSpaceNode,
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
  return s.types[s.pos]! as TokenType
}

function peekStart(s: ParserState): number {
  return s.starts[s.pos]!
}

function peek(s: ParserState): Token {
  const i = s.pos
  return { type: s.types[i]! as TokenType, start: s.starts[i]!, end: s.ends[i]! }
}

function consume(s: ParserState): Token {
  const i = s.pos++
  return { type: s.types[i]! as TokenType, start: s.starts[i]!, end: s.ends[i]! }
}

function tokenSlice(s: ParserState, t: Token): string {
  return s.source.slice(t.start, t.end)
}

function skipWhitespace(s: ParserState): void {
  const types = s.types
  const count = s.count
  while (s.pos < count) {
    const t = types[s.pos]!
    if (t === TokenType.WhiteSpace || t === TokenType.Comment)
      s.pos++
    else
      break
  }
}

function skipWhitespaceOnly(s: ParserState): void {
  const types = s.types
  const count = s.count
  while (s.pos < count && types[s.pos]! === TokenType.WhiteSpace)
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
    case 'value': return parseValue(s, false)
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
  // Hot loop: read type from the typed array directly to avoid the
  // per-iteration Token-object alloc that `peek()` would do.
  while (s.types[s.pos]! !== TokenType.EOF) {
    const t = s.types[s.pos]!
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
    const r = parseRule(s)
    children.appendData(r)
  }
  const lastIdx = s.count - 1
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
  consume(s)
  const name = s.source.slice(startTok.start + 1, startTok.end).toLowerCase()

  // collect prelude tokens until ; or {
  skipWhitespace(s)
  const preludeStart = peek(s)
  let preludeEndTok = preludeStart
  while (peekType(s) !== TokenType.EOF
    && peekType(s) !== TokenType.Semicolon
    && peekType(s) !== TokenType.LeftCurlyBracket) {
    preludeEndTok = consume(s)
  }

  let prelude: AtrulePrelude | Raw | null = null
  if (preludeStart !== peek(s)) {
    const raw = s.source.slice(preludeStart.start, preludeEndTok.end).trim()
    if (raw.length > 0) {
      if (s.parseAtrulePrelude) {
        // Always attempt to parse — fall back to Raw if parsing produces
        // nothing useful or throws. No more hardcoded at-rule whitelist:
        // custom at-rules (`@property`, `@scope`, `@layer`, future specs)
        // get a parsed prelude too.
        //
        // Whitespace IS preserved in at-rule preludes: media queries treat
        // it as significant (`screen and (...)`), and so do `@layer foo, bar`
        // and `@import url('x') screen`. `parseValueChild` emits a single
        // WhiteSpace node per whitespace run which the generator turns
        // back into one space.
        try {
          const sub = makeState(raw, { positions: false })
          sub.onParseError = s.onParseError
          const children = newList<CssNode>()
          while (peekType(sub) !== TokenType.EOF) {
            const node = parseValueChild(sub)
            if (node)
              children.appendData(node)
          }
          // The @media `(aspect-ratio: 16/9)` form lives inside Parens
          // here — promote the Number/Operator(/)/Number triples in
          // every container to Ratio nodes, recursively.
          promoteRatiosDeep(children)
          if (children.isEmpty)
            prelude = rawNode(raw, preludeStart, preludeEndTok, s)
          else
            prelude = { type: 'AtrulePrelude', children, loc: null }
        }
        catch (err) {
          const fallback = rawNode(raw, preludeStart, preludeEndTok, s)
          reportError(s, `Failed to parse @${name} prelude: ${(err as Error).message}`, preludeStart, fallback)
          prelude = fallback
        }
      }
      else {
        prelude = rawNode(raw, preludeStart, preludeEndTok, s)
      }
    }
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
  consume(s) // {
  const children = newList<CssNode>()
  while (s.types[s.pos]! !== TokenType.EOF && s.types[s.pos]! !== TokenType.RightCurlyBracket) {
    const t = s.types[s.pos]!
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
    if (s.types[s.pos]! === TokenType.Semicolon)
      s.pos++
  }
  if (peekType(s) === TokenType.RightCurlyBracket)
    consume(s)
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
  const count = s.count
  while (s.pos < count) {
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
    // Custom property starts with --, which is tokenised as ident
    if (startTok.type === TokenType.Delim && s.source[startTok.start] === '*') {
      // ie *property
      consume(s)
    }
    else {
      // skip junk to next ;
      reportError(s, `Expected property name`, startTok, { type: 'Raw', value: '', loc: null })
      while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.Semicolon && peekType(s) !== TokenType.RightCurlyBracket)
        consume(s)
      return null
    }
  }
  const propTok = consume(s)
  let property = s.source.slice(propTok.start, propTok.end)
  // optional `*property` IE hack — already handled via leading delim
  // optional vendor prefix already part of ident

  skipWhitespaceOnly(s)
  if (peekType(s) !== TokenType.Colon) {
    // not a declaration — recover
    reportError(s, `Expected ':' after property "${property}"`, peek(s), { type: 'Raw', value: '', loc: null })
    while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.Semicolon && peekType(s) !== TokenType.RightCurlyBracket)
      consume(s)
    return null
  }
  consume(s) // :

  // collect value tokens up to ; or }
  skipWhitespaceOnly(s)
  const valueStartTok = peek(s)
  let valueEndTok = valueStartTok
  let importantTok: Token | null = null

  while (peekType(s) !== TokenType.EOF
    && peekType(s) !== TokenType.Semicolon
    && peekType(s) !== TokenType.RightCurlyBracket) {
    const lookaheadTok = peek(s)
    if (lookaheadTok.type === TokenType.Delim && s.source[lookaheadTok.start] === '!') {
      // potential !important — preserve current valueEndTok and try to advance
      const before = valueEndTok
      s.pos++ // consume the `!`
      while (s.pos < s.count && s.types[s.pos]! === TokenType.WhiteSpace)
        s.pos++
      const next: Token | null = s.pos < s.count
        ? { type: s.types[s.pos]! as TokenType, start: s.starts[s.pos]!, end: s.ends[s.pos]! }
        : null
      if (next && next.type === TokenType.Ident && s.source.slice(next.start, next.end).toLowerCase() === 'important') {
        importantTok = next
        valueEndTok = before // exclude the `!important` from the value text
        s.pos++
        continue
      }
      // not important — fall back: include the `!` in the value
      valueEndTok = lookaheadTok
      continue
    }
    const t = consume(s)
    valueEndTok = t
  }

  let valueText: string
  if (importantTok) {
    valueText = s.source.slice(valueStartTok.start, valueEndTok.end).trim()
  }
  else {
    valueText = s.source.slice(valueStartTok.start, valueEndTok.end).trim()
  }
  property = property.trim()

  const isCustom = property.startsWith('--')
  let value: Value | Raw
  if ((isCustom && !s.parseCustomProperty) || !s.parseValue) {
    value = { type: 'Raw', value: valueText, loc: loc(s, valueStartTok, valueEndTok) }
  }
  else if (valueText.length === 0) {
    value = { type: 'Value', children: newList<CssNode>(), loc: loc(s, valueStartTok, valueEndTok) }
  }
  else {
    const sub = makeState(valueText, { positions: false })
    value = parseValueChildren(sub)
  }

  return {
    type: 'Declaration',
    property,
    important: importantTok ? true : false,
    value,
    loc: loc(s, startTok, peek(s)),
  }
}

// ----- value -----

function parseValue(s: ParserState, _innerOnly: boolean): Value {
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
  const t = peek(s)
  switch (t.type) {
    case TokenType.WhiteSpace: {
      consume(s)
      const node: WhiteSpaceNode = { type: 'WhiteSpace', value: ' ', loc: loc(s, t, t) }
      return node
    }
    case TokenType.Comment: {
      consume(s)
      return makeComment(s, t)
    }
    case TokenType.Number: {
      consume(s)
      const node: NumberNode = { type: 'Number', value: tokenSlice(s, t), loc: loc(s, t, t) }
      return node
    }
    case TokenType.Percentage: {
      consume(s)
      const node: PercentageNode = { type: 'Percentage', value: s.source.slice(t.start, t.end - 1), loc: loc(s, t, t) }
      return node
    }
    case TokenType.Dimension: {
      consume(s)
      const text = tokenSlice(s, t)
      const m = /^([+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)(.+)$/.exec(text)!
      const node: DimensionNode = { type: 'Dimension', value: m[1]!, unit: m[2]!, loc: loc(s, t, t) }
      return node
    }
    case TokenType.Ident: {
      consume(s)
      const node: Identifier = { type: 'Identifier', name: decodeName(s.source, t.start, t.end), loc: loc(s, t, t) }
      return node
    }
    case TokenType.String: {
      consume(s)
      // Drop the surrounding quotes and decode escapes (`\"` → `"`,
      // `\26 ` → `&`, etc.) so the AST holds the actual string value.
      const innerStart = t.start + 1
      const closesProperly = t.end - t.start >= 2 && s.source.charCodeAt(t.end - 1) === s.source.charCodeAt(t.start)
      const innerEnd = closesProperly ? t.end - 1 : t.end
      const value = decodeString(s.source, innerStart, innerEnd)
      const node: StringNode = { type: 'String', value, loc: loc(s, t, t) }
      return node
    }
    case TokenType.Url: {
      consume(s)
      const slice = tokenSlice(s, t)
      const inner = slice.replace(/^url\(\s*/i, '').replace(/\s*\)$/, '')
      const value = inner.length >= 2 && (inner[0] === '"' || inner[0] === '\'') && inner.endsWith(inner[0]!)
        ? inner.slice(1, -1)
        : inner
      const node: UrlNode = { type: 'Url', value, loc: loc(s, t, t) }
      return node
    }
    case TokenType.Hash: {
      consume(s)
      const node: HashNode = { type: 'Hash', name: s.source.slice(t.start + 1, t.end), loc: loc(s, t, t) }
      return node
    }
    case TokenType.Function: {
      return parseFunction(s)
    }
    case TokenType.LeftParenthesis: {
      return parseParentheses(s)
    }
    case TokenType.Comma: {
      consume(s)
      const node: OperatorNode = { type: 'Operator', value: ',', loc: loc(s, t, t) }
      return node
    }
    case TokenType.Colon: {
      consume(s)
      const node: OperatorNode = { type: 'Operator', value: ':', loc: loc(s, t, t) }
      return node
    }
    case TokenType.Delim: {
      consume(s)
      const ch = s.source[t.start]!
      if (ch === '/' || ch === '+' || ch === '-' || ch === '*' || ch === '=' || ch === '>' || ch === '<' || ch === '~' || ch === '|' || ch === '$' || ch === '^' || ch === '!' || ch === '&') {
        const node: OperatorNode = { type: 'Operator', value: ch, loc: loc(s, t, t) }
        return node
      }
      const node: Identifier = { type: 'Identifier', name: ch, loc: loc(s, t, t) }
      return node
    }
    case TokenType.AtKeyword:
    case TokenType.LeftSquareBracket:
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
      consume(s)
      return { type: 'Raw', value: tokenSlice(s, t), loc: loc(s, t, t) }
    }
  }
  consume(s)
  return null
}

function parseFunction(s: ParserState): CssNode {
  const startTok = consume(s) // function token (including `(`)
  const name = s.source.slice(startTok.start, startTok.end - 1).toLowerCase()
  const children = newList<CssNode>()
  while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.RightParenthesis) {
    const node = parseValueChild(s)
    if (node)
      children.appendData(node)
  }
  if (peekType(s) === TokenType.RightParenthesis)
    consume(s)

  // Normalise url("…") / url('…') into a Url node (matches css-tree shape).
  if (name === 'url') {
    const arr = children.toArray()
    const stringChild = arr.find(c => c.type === 'String') as { type: 'String', value: string } | undefined
    if (stringChild) {
      return { type: 'Url', value: stringChild.value, loc: loc(s, startTok, peek(s)) } as UrlNode
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
      // descendant combinator only between segments
      if (!lastWasCombinator
        && peekType(s) !== TokenType.EOF
        && peekType(s) !== TokenType.Comma
        && peekType(s) !== TokenType.LeftCurlyBracket
        && !isExplicitCombinator(s)) {
        const c: Combinator = { type: 'Combinator', name: ' ', loc: loc(s, t, t) }
        children.appendData(c)
        lastWasCombinator = true
      }
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
  return { type: 'Selector', children, loc: loc(s, startTok, peek(s)) }
}

function isExplicitCombinator(s: ParserState): boolean {
  const t = peek(s)
  if (t.type !== TokenType.Delim)
    return false
  const ch = s.source[t.start]!
  return ch === '>' || ch === '+' || ch === '~'
}

function parseSelectorSegment(s: ParserState): CssNode | null {
  const t = peek(s)
  switch (t.type) {
    case TokenType.Ident: {
      consume(s)
      // Namespace prefix? `svg|circle` → TypeSelector(name="svg|circle").
      // We keep the prefix as part of the name (matches css-tree shape).
      if (peekType(s) === TokenType.Delim && s.source[peek(s).start] === '|'
        && s.source[peek(s).start + 1] !== '=') {
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
    const name = tokenSlice(s, t).toLowerCase()
    const node = isElement
      ? { type: 'PseudoElementSelector' as const, name, children: null, loc: loc(s, startTok, t) }
      : { type: 'PseudoClassSelector' as const, name, children: null, loc: loc(s, startTok, t) }
    return node
  }
  if (t.type === TokenType.Function) {
    consume(s)
    const name = s.source.slice(t.start, t.end - 1).toLowerCase()
    const children = newList<CssNode>()

    // Pseudo-classes that take a selector list re-parse their argument.
    const isSelectorListPseudo = !isElement && (
      name === 'is' || name === 'not' || name === 'where' || name === 'has'
      || name === 'matches' || name === '-moz-any' || name === '-webkit-any'
    )
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
