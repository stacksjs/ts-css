/**
 * CSS Syntax Module Level 3 tokenizer.
 *
 *   https://www.w3.org/TR/css-syntax-3/#tokenization
 *
 * Produces a flat sequence of token offsets that the parser walks. Tokens
 * are recorded as parallel arrays (type + offset) rather than allocations
 * — every other CSS lib does the same for performance.
 */

export const enum TokenType {
  EOF = 0,
  Ident = 1,
  Function = 2,
  AtKeyword = 3,
  Hash = 4,
  String = 5,
  BadString = 6,
  Url = 7,
  BadUrl = 8,
  Delim = 9,
  Number = 10,
  Percentage = 11,
  Dimension = 12,
  WhiteSpace = 13,
  CDO = 14,
  CDC = 15,
  Colon = 16,
  Semicolon = 17,
  Comma = 18,
  LeftSquareBracket = 19,
  RightSquareBracket = 20,
  LeftParenthesis = 21,
  RightParenthesis = 22,
  LeftCurlyBracket = 23,
  RightCurlyBracket = 24,
  Comment = 25,
}

export interface Token {
  type: TokenType
  start: number
  end: number
}

const REPLACEMENT = 0xFFFD

// ----- pre-built character-class lookup -----
// One byte per char code (0-127). Each bit is a class:
//   bit 0 — whitespace (space/tab/CR/LF/FF)
//   bit 1 — digit (0-9)
//   bit 2 — hex digit (0-9 a-f A-F)
//   bit 3 — name-start (letter / underscore — non-ASCII handled separately)
//   bit 4 — newline (CR / LF / FF)
const CHAR_CLASS = (() => {
  const t = new Uint8Array(128)
  for (let c = 0; c < 128; c++) {
    let bits = 0
    if (c === 32 || c === 9 || c === 10 || c === 12 || c === 13)
      bits |= 1
    if (c >= 48 && c <= 57)
      bits |= 2
    if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))
      bits |= 4
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95)
      bits |= 8
    if (c === 10 || c === 12 || c === 13)
      bits |= 16
    t[c] = bits
  }
  return t
})()

function isDigit(code: number): boolean {
  return code < 128 && (CHAR_CLASS[code]! & 2) !== 0
}

function isHexDigit(code: number): boolean {
  return code < 128 && (CHAR_CLASS[code]! & 4) !== 0
}

function isNameStart(code: number): boolean {
  return code >= 0x80 || (code < 128 && (CHAR_CLASS[code]! & 8) !== 0)
}

function isName(code: number): boolean {
  return code === 45 /* - */ || code >= 0x80 || (code < 128 && (CHAR_CLASS[code]! & (2 | 8)) !== 0)
}

function isNonPrintable(code: number): boolean {
  return (code >= 0 && code <= 8) || code === 11 || (code >= 14 && code <= 31) || code === 127
}

function isNewline(code: number): boolean {
  return code < 128 && (CHAR_CLASS[code]! & 16) !== 0
}

function isWhitespace(code: number): boolean {
  return code < 128 && (CHAR_CLASS[code]! & 1) !== 0
}

function isValidEscape(c1: number, c2: number): boolean {
  if (c1 !== 92 /* \ */)
    return false
  if (isNewline(c2))
    return false
  return true
}

function startsIdentifier(c1: number, c2: number, c3: number): boolean {
  if (c1 === 45 /* - */) {
    return isNameStart(c2) || c2 === 45 || isValidEscape(c2, c3)
  }
  if (isNameStart(c1))
    return true
  if (c1 === 92 /* \ */)
    return isValidEscape(c1, c2)
  return false
}

function startsNumber(c1: number, c2: number, c3: number): boolean {
  if (c1 === 43 /* + */ || c1 === 45 /* - */) {
    if (isDigit(c2))
      return true
    if (c2 === 46 /* . */ && isDigit(c3))
      return true
    return false
  }
  if (c1 === 46 /* . */)
    return isDigit(c2)
  return isDigit(c1)
}

export class Tokenizer {
  source: string
  offset = 0
  /**
   * Parallel typed-array storage. The parser walks `count` tokens by
   * index; `types[i]` / `starts[i]` / `ends[i]` are the three fields of
   * the i-th token. This avoids one `Object` allocation per token, which
   * matters a lot on parse — for a 6 KB stylesheet there are ~1500 tokens.
   */
  types: Uint8Array
  starts: Uint32Array
  ends: Uint32Array
  count = 0
  /** Lazy-built `Token`-shaped array — only filled if a consumer
   *  reads `.tokens`. Internally the parser uses the typed arrays. */
  private _tokens: Token[] | null = null
  /**
   * Offset where each line starts; used for line/col reporting. Built
   * lazily by `locate()` — almost every parse runs with `positions: false`
   * and never asks for source locations, so paying the per-newline
   * `lineStarts.push()` during tokenization is pure overhead in the
   * common case. The closures the original loops captured for that push
   * are also gone.
   */
  private _lineStarts: number[] | null = null

  constructor(source: string) {
    this.source = source
    // CSS averages ~3.5 chars/token across realistic stylesheets (selectors,
    // declarations, values, whitespace). Allocating `len/3` covers nearly
    // all inputs without needing `grow()`. Floor at 64 for tiny snippets.
    const cap = Math.max(64, Math.ceil(source.length / 3))
    this.types = new Uint8Array(cap)
    this.starts = new Uint32Array(cap)
    this.ends = new Uint32Array(cap)
    this.tokenize()
  }

  /** Public alias kept for back-compat — built lazily on first read. */
  get lineStarts(): number[] {
    if (this._lineStarts == null)
      this._lineStarts = buildLineStarts(this.source)
    return this._lineStarts
  }

  /** Lazy `Token[]` view for backwards-compat. */
  get tokens(): Token[] {
    if (this._tokens != null)
      return this._tokens
    const out: Token[] = Array.from({ length: this.count })
    for (let i = 0; i < this.count; i++)
      out[i] = { type: this.types[i]! as TokenType, start: this.starts[i]!, end: this.ends[i]! }
    this._tokens = out
    return out
  }

  private addToken(type: TokenType, start: number, end: number): void {
    if (this.count >= this.types.length)
      this.grow()
    this.types[this.count] = type
    this.starts[this.count] = start
    this.ends[this.count] = end
    this.count++
  }

  private grow(): void {
    const oldLen = this.types.length
    const newLen = oldLen * 2
    // eslint-disable-next-line pickier/no-unused-vars
    const t = new Uint8Array(newLen); t.set(this.types); this.types = t
    // eslint-disable-next-line pickier/no-unused-vars
    const s = new Uint32Array(newLen); s.set(this.starts); this.starts = s
    const e = new Uint32Array(newLen); e.set(this.ends); this.ends = e
  }

  private tokenize(): void {
    const src = this.source
    let i = 0
    const len = src.length

    while (i < len) {
      const c1 = src.charCodeAt(i)

      // comment /* ... */
      if (c1 === 47 /* / */ && src.charCodeAt(i + 1) === 42 /* * */) {
        const start = i
        i += 2
        while (i < len && !(src.charCodeAt(i) === 42 && src.charCodeAt(i + 1) === 47))
          i++
        i = i < len ? i + 2 : len
        this.addToken(TokenType.Comment, start, i)
        continue
      }

      // whitespace
      if (isWhitespace(c1)) {
        const start = i
        while (i < len && isWhitespace(src.charCodeAt(i)))
          i++
        this.addToken(TokenType.WhiteSpace, start, i)
        continue
      }

      // string
      if (c1 === 34 /* " */ || c1 === 39 /* ' */) {
        i = this.consumeString(c1, i)
        continue
      }

      // hash
      if (c1 === 35 /* # */) {
        if (i + 1 < len && (isName(src.charCodeAt(i + 1)) || isValidEscape(src.charCodeAt(i + 1), src.charCodeAt(i + 2)))) {
          const start = i
          i++
          i = this.consumeName(i)
          this.addToken(TokenType.Hash, start, i)
          continue
        }
        this.addToken(TokenType.Delim, i, i + 1)
        i++
        continue
      }

      // ( ) [ ] { } , : ;
      switch (c1) {
        case 40: this.addToken(TokenType.LeftParenthesis, i, i + 1); i++; continue
        case 41: this.addToken(TokenType.RightParenthesis, i, i + 1); i++; continue
        case 91: this.addToken(TokenType.LeftSquareBracket, i, i + 1); i++; continue
        case 93: this.addToken(TokenType.RightSquareBracket, i, i + 1); i++; continue
        case 123: this.addToken(TokenType.LeftCurlyBracket, i, i + 1); i++; continue
        case 125: this.addToken(TokenType.RightCurlyBracket, i, i + 1); i++; continue
        case 44: this.addToken(TokenType.Comma, i, i + 1); i++; continue
        case 58: this.addToken(TokenType.Colon, i, i + 1); i++; continue
        case 59: this.addToken(TokenType.Semicolon, i, i + 1); i++; continue
      }

      // CDO/CDC
      if (c1 === 60 /* < */ && src.startsWith('!--', i + 1)) {
        this.addToken(TokenType.CDO, i, i + 4)
        i += 4
        continue
      }
      if (c1 === 45 /* - */ && src.startsWith('->', i + 1)) {
        this.addToken(TokenType.CDC, i, i + 3)
        i += 3
        continue
      }

      // @ keyword
      if (c1 === 64 /* @ */) {
        const c2 = src.charCodeAt(i + 1)
        const c3 = src.charCodeAt(i + 2)
        const c4 = src.charCodeAt(i + 3)
        if (startsIdentifier(c2, c3, c4)) {
          const start = i
          i++
          i = this.consumeName(i)
          this.addToken(TokenType.AtKeyword, start, i)
          continue
        }
        this.addToken(TokenType.Delim, i, i + 1)
        i++
        continue
      }

      // number / percentage / dimension
      const c2 = src.charCodeAt(i + 1)
      const c3 = src.charCodeAt(i + 2)
      if (startsNumber(c1, c2, c3)) {
        i = this.consumeNumeric(i)
        continue
      }

      // ident-like (function, url, ident)
      if (startsIdentifier(c1, c2, c3)) {
        i = this.consumeIdentLike(i)
        continue
      }

      // \\ escape
      if (c1 === 92 /* \ */) {
        if (isValidEscape(c1, c2)) {
          i = this.consumeIdentLike(i)
          continue
        }
        this.addToken(TokenType.Delim, i, i + 1)
        i++
        continue
      }

      // anything else: delim
      this.addToken(TokenType.Delim, i, i + 1)
      i++
    }
    this.addToken(TokenType.EOF, len, len)
  }

  private consumeString(quote: number, start: number): number {
    const src = this.source
    const len = src.length
    let i = start + 1
    while (i < len) {
      const c = src.charCodeAt(i)
      if (c === quote) {
        i++
        this.addToken(TokenType.String, start, i)
        return i
      }
      if (isNewline(c)) {
        this.addToken(TokenType.BadString, start, i)
        return i
      }
      if (c === 92 /* \ */) {
        const c2 = src.charCodeAt(i + 1)
        if (isNewline(c2)) {
          i += 2
          continue
        }
        if (i + 1 < len) {
          i = this.consumeEscapeSkip(i + 1)
          continue
        }
      }
      i++
    }
    this.addToken(TokenType.String, start, i)
    return i
  }

  private consumeEscapeSkip(i: number): number {
    const src = this.source
    if (i >= src.length)
      return i
    const c = src.charCodeAt(i)
    if (isHexDigit(c)) {
      let n = 1
      i++
      while (n < 6 && i < src.length && isHexDigit(src.charCodeAt(i))) {
        i++
        n++
      }
      if (i < src.length && isWhitespace(src.charCodeAt(i)))
        i++
      return i
    }
    return i + 1
  }

  private consumeName(start: number): number {
    const src = this.source
    const len = src.length
    let i = start
    // Fast path: pure ASCII name chars — no escape, no non-ASCII. Inline
    // `isName` so the JIT keeps the loop body in a single branch path.
    while (i < len) {
      const c = src.charCodeAt(i)
      if (c < 128 && (CHAR_CLASS[c]! & (2 | 8)) !== 0) {
        i++
        continue
      }
      if (c === 45 /* - */) {
        i++
        continue
      }
      // Slow path: non-ASCII or escape — fall back to the general check.
      if (c >= 0x80) {
        i++
        continue
      }
      if (c === 92 /* \ */ && isValidEscape(c, src.charCodeAt(i + 1))) {
        i = this.consumeEscapeSkip(i + 1)
        continue
      }
      break
    }
    return i
  }

  private consumeNumber(start: number): number {
    const src = this.source
    let i = start
    if (src.charCodeAt(i) === 43 || src.charCodeAt(i) === 45)
      i++
    while (i < src.length && isDigit(src.charCodeAt(i)))
      i++
    if (src.charCodeAt(i) === 46 && isDigit(src.charCodeAt(i + 1))) {
      i += 2
      while (i < src.length && isDigit(src.charCodeAt(i)))
        i++
    }
    const eC = src.charCodeAt(i)
    if (eC === 69 || eC === 101) {
      const next = src.charCodeAt(i + 1)
      const next2 = src.charCodeAt(i + 2)
      if (isDigit(next)) {
        i += 2
        while (i < src.length && isDigit(src.charCodeAt(i)))
          i++
      }
      else if ((next === 43 || next === 45) && isDigit(next2)) {
        i += 3
        while (i < src.length && isDigit(src.charCodeAt(i)))
          i++
      }
    }
    return i
  }

  private consumeNumeric(start: number): number {
    const src = this.source
    const numEnd = this.consumeNumber(start)
    const c1 = src.charCodeAt(numEnd)
    const c2 = src.charCodeAt(numEnd + 1)
    const c3 = src.charCodeAt(numEnd + 2)

    if (startsIdentifier(c1, c2, c3)) {
      const end = this.consumeName(numEnd)
      this.addToken(TokenType.Dimension, start, end)
      return end
    }
    if (c1 === 37 /* % */) {
      this.addToken(TokenType.Percentage, start, numEnd + 1)
      return numEnd + 1
    }
    this.addToken(TokenType.Number, start, numEnd)
    return numEnd
  }

  private consumeIdentLike(start: number): number {
    const src = this.source
    const nameEnd = this.consumeName(start)
    const c = src.charCodeAt(nameEnd)
    // Only `url` (3 chars) needs special handling; avoid the
    // `slice(...).toLowerCase()` allocation per ident in the hot path.
    if (c === 40 /* ( */ && nameEnd - start === 3) {
      const c0 = src.charCodeAt(start) | 32
      const c1 = src.charCodeAt(start + 1) | 32
      const c2 = src.charCodeAt(start + 2) | 32
      if (c0 === 117 && c1 === 114 && c2 === 108) {
        let i = nameEnd + 1
        while (i < src.length && isWhitespace(src.charCodeAt(i)))
          i++
        const next = src.charCodeAt(i)
        if (next === 34 || next === 39) {
          // function url("...")
          this.addToken(TokenType.Function, start, nameEnd + 1)
          return nameEnd + 1
        }
        return this.consumeUrl(start, nameEnd)
      }
    }
    if (c === 40 /* ( */) {
      this.addToken(TokenType.Function, start, nameEnd + 1)
      return nameEnd + 1
    }
    this.addToken(TokenType.Ident, start, nameEnd)
    return nameEnd
  }

  private consumeUrl(start: number, nameEnd: number): number {
    const src = this.source
    const len = src.length
    let i = nameEnd + 1
    while (i < len && isWhitespace(src.charCodeAt(i)))
      i++
    while (i < len) {
      const c = src.charCodeAt(i)
      if (c === 41 /* ) */) {
        i++
        this.addToken(TokenType.Url, start, i)
        return i
      }
      if (isWhitespace(c)) {
        const wsStart = i
        while (i < len && isWhitespace(src.charCodeAt(i)))
          i++
        if (i >= len) {
          this.addToken(TokenType.Url, start, i)
          return i
        }
        if (src.charCodeAt(i) === 41) {
          i++
          this.addToken(TokenType.Url, start, i)
          return i
        }
        // bad url — recover by consuming to next ) or eof
        return this.consumeBadUrl(start, wsStart)
      }
      if (c === 34 || c === 39 || c === 40 || isNonPrintable(c)) {
        return this.consumeBadUrl(start, i)
      }
      if (c === 92 /* \ */) {
        if (isValidEscape(c, src.charCodeAt(i + 1))) {
          i = this.consumeEscapeSkip(i + 1)
          continue
        }
        return this.consumeBadUrl(start, i)
      }
      i++
    }
    this.addToken(TokenType.Url, start, i)
    return i
  }

  private consumeBadUrl(start: number, from: number): number {
    const src = this.source
    let i = from
    while (i < src.length) {
      const c = src.charCodeAt(i)
      if (c === 41) {
        i++
        break
      }
      if (c === 92 && isValidEscape(c, src.charCodeAt(i + 1))) {
        i = this.consumeEscapeSkip(i + 1)
        continue
      }
      i++
    }
    this.addToken(TokenType.BadUrl, start, i)
    return i
  }

  /** Resolve `offset` to (line, column) for error messages. */
  locate(offset: number): { line: number, column: number } {
    const ls = this.lineStarts
    let lo = 0
    let hi = ls.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (ls[mid]! <= offset)
        lo = mid
      else
        hi = mid - 1
    }
    const lineStart = ls[lo]!
    return { line: lo + 1, column: offset - lineStart + 1 }
  }
}

function buildLineStarts(source: string): number[] {
  const out = [0]
  const len = source.length
  for (let i = 0; i < len; i++) {
    const c = source.charCodeAt(i)
    if (c === 10) {
      out.push(i + 1)
    }
    else if (c === 13) {
      // \r without \n, OR \r\n (treat the LF position consistently)
      if (source.charCodeAt(i + 1) !== 10)
        out.push(i + 1)
    }
  }
  return out
}

/** Decode a CSS-escaped name slice (e.g. `\\26 B` → `&B`). */
/**
 * Decode a CSS string literal slice to its actual character value.
 * `start` / `end` exclude the surrounding quote characters.
 *
 * Handles:
 *   - hex escapes (`\26 ` → `&`)
 *   - `\"` / `\'` / `\\`
 *   - escaped newlines (CSS: backslash followed by newline is removed)
 *   - any other `\<char>` → `<char>`
 */
export function decodeString(source: string, start: number, end: number): string {
  // Fast path: no escapes → return the slice directly. The vast majority of
  // CSS strings/identifiers have no backslash escapes, so a one-pass scan
  // saves us the per-char concat allocation that the slow path does.
  for (let k = start; k < end; k++) {
    if (source.charCodeAt(k) === 92 /* \\ */)
      return decodeStringSlow(source, start, end, k)
  }
  return source.slice(start, end)
}

function decodeStringSlow(source: string, start: number, end: number, firstEscape: number): string {
  let out = source.slice(start, firstEscape)
  let i = firstEscape
  while (i < end) {
    const c = source.charCodeAt(i)
    if (c !== 92 /* \\ */) {
      out += source[i]!
      i++
      continue
    }
    // backslash at end-of-input
    if (i + 1 >= end) {
      i++
      continue
    }
    // backslash + newline = continuation (removed entirely)
    const next = source.charCodeAt(i + 1)
    if (next === 10) {
      i += 2
      continue
    }
    if (next === 13) {
      i += source.charCodeAt(i + 2) === 10 ? 3 : 2
      continue
    }
    // hex escape
    if (isHexDigit(next)) {
      let j = i + 1
      let hex = ''
      while (hex.length < 6 && j < end && isHexDigit(source.charCodeAt(j))) {
        hex += source[j]
        j++
      }
      const code = Number.parseInt(hex, 16)
      if (j < end && isWhitespace(source.charCodeAt(j)))
        j++
      out += code === 0 || (code >= 0xD800 && code <= 0xDFFF) || code > 0x10FFFF
        ? String.fromCodePoint(REPLACEMENT)
        : String.fromCodePoint(code)
      i = j
      continue
    }
    // escape of any other char (including \" \' \\) — keep the char
    out += source[i + 1]
    i += 2
  }
  return out
}

export function decodeName(source: string, start: number, end: number): string {
  // Fast path: no escapes → return the slice directly.
  for (let k = start; k < end; k++) {
    if (source.charCodeAt(k) === 92 /* \\ */)
      return decodeNameSlow(source, start, end, k)
  }
  return source.slice(start, end)
}

function decodeNameSlow(source: string, start: number, end: number, firstEscape: number): string {
  let out = source.slice(start, firstEscape)
  let i = firstEscape
  while (i < end) {
    const c = source.charCodeAt(i)
    if (c !== 92 /* \\ */) {
      out += source[i]!
      i++
      continue
    }
    // hex escape
    let j = i + 1
    let hex = ''
    while (hex.length < 6 && j < end && isHexDigit(source.charCodeAt(j))) {
      hex += source[j]
      j++
    }
    if (hex.length > 0) {
      const code = Number.parseInt(hex, 16)
      if (j < end && isWhitespace(source.charCodeAt(j)))
        j++
      out += code === 0 || (code >= 0xD800 && code <= 0xDFFF) || code > 0x10FFFF
        ? String.fromCodePoint(REPLACEMENT)
        : String.fromCodePoint(code)
      i = j
      continue
    }
    if (j < end) {
      out += source[j]
      i = j + 1
      continue
    }
    out += String.fromCodePoint(REPLACEMENT)
    i = j
  }
  return out
}
