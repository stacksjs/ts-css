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
import { decodeName, Tokenizer, TokenType } from '../tokenizer'

interface ParserState {
  source: string
  tokens: Token[]
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
    tokens: tokenizer.tokens,
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

function peekType(s: ParserState): TokenType {
  return s.tokens[s.pos]!.type
}

function peek(s: ParserState): Token {
  return s.tokens[s.pos]!
}

function consume(s: ParserState): Token {
  return s.tokens[s.pos++]!
}

function tokenSlice(s: ParserState, t: Token): string {
  return s.source.slice(t.start, t.end)
}

function skipWhitespace(s: ParserState): void {
  while (s.pos < s.tokens.length) {
    const t = s.tokens[s.pos]!.type
    if (t === TokenType.WhiteSpace || t === TokenType.Comment)
      s.pos++
    else
      break
  }
}

function skipWhitespaceOnly(s: ParserState): void {
  while (s.pos < s.tokens.length && s.tokens[s.pos]!.type === TokenType.WhiteSpace)
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
  while (peekType(s) !== TokenType.EOF) {
    const tok = peek(s)
    if (tok.type === TokenType.WhiteSpace) {
      s.pos++
      continue
    }
    if (tok.type === TokenType.Comment) {
      const node = makeComment(s, tok)
      consume(s)
      children.appendData(node)
      continue
    }
    if (tok.type === TokenType.CDO || tok.type === TokenType.CDC) {
      consume(s)
      continue
    }
    if (tok.type === TokenType.AtKeyword) {
      const at = parseAtrule(s)
      if (at)
        children.appendData(at)
      continue
    }
    const r = parseRule(s)
    children.appendData(r)
  }
  const endTok = s.tokens[s.tokens.length - 1]!
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
      if (s.parseAtrulePrelude && (name === 'media' || name === 'supports' || name === 'import' || name === 'charset' || name === 'namespace' || name === 'keyframes' || name === '-webkit-keyframes' || name === '-moz-keyframes' || name === '-o-keyframes' || name === 'page' || name === 'font-face' || name === 'document' || name === 'layer' || name === 'container')) {
        // Reparse the prelude tokens as an AtrulePrelude with mixed tokens.
        const sub = makeState(raw, { positions: false })
        const children = newList<CssNode>()
        while (peekType(sub) !== TokenType.EOF) {
          const tok = sub.tokens[sub.pos]!
          if (tok.type === TokenType.WhiteSpace) {
            sub.pos++
            continue
          }
          const node = parseValueChild(sub)
          if (node)
            children.appendData(node)
        }
        prelude = { type: 'AtrulePrelude', children, loc: null }
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
    block = parseBlock(s, name === 'media' || name === 'supports' || name === 'document' || name === 'layer' || name === 'container')
  }

  return { type: 'Atrule', name, prelude, block, loc: loc(s, startTok, peek(s)) }
}

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

  // collect prelude until {
  const preludeStart = peek(s)
  let preludeEnd = preludeStart
  while (peekType(s) !== TokenType.EOF && peekType(s) !== TokenType.LeftCurlyBracket) {
    preludeEnd = consume(s)
  }
  const preludeText = s.source.slice(preludeStart.start, preludeEnd.end).trim()
  let prelude: SelectorList | Raw
  if (s.parseRulePrelude && preludeText.length > 0) {
    const subState = makeState(preludeText, { positions: false })
    prelude = parseSelectorList(subState)
  }
  else {
    prelude = rawNode(preludeText, preludeStart, preludeEnd, s)
  }

  const block = parseBlock(s, false)
  return { type: 'Rule', prelude, block, loc: loc(s, startTok, peek(s)) }
}

// ----- block -----

function parseBlock(s: ParserState, allowNested: boolean = false): Block {
  const startTok = peek(s)
  if (peekType(s) !== TokenType.LeftCurlyBracket)
    return { type: 'Block', children: newList<CssNode>(), loc: emptyLoc(s) }
  consume(s) // {
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
    if (t.type === TokenType.AtKeyword) {
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
    if (peekType(s) === TokenType.Semicolon)
      consume(s)
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
  while (s.pos < s.tokens.length) {
    const t = s.tokens[s.pos]!.type
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
      while (s.pos < s.tokens.length && s.tokens[s.pos]!.type === TokenType.WhiteSpace)
        s.pos++
      const next = s.tokens[s.pos]
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
  return { type: 'Value', children, loc: loc(s, startTok, peek(s)) }
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
      const slice = tokenSlice(s, t)
      const value = slice.length >= 2 ? slice.slice(1, slice.endsWith(slice[0]!) ? -1 : undefined) : ''
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
      const slice = tokenSlice(s, v)
      const text = slice.length >= 2 ? slice.slice(1, -1) : ''
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
