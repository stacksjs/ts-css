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
  source: string
}

const REPLACEMENT = 0xFFFD

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57
}

function isHexDigit(code: number): boolean {
  return isDigit(code) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102)
}

function isUppercaseLetter(code: number): boolean {
  return code >= 65 && code <= 90
}

function isLowercaseLetter(code: number): boolean {
  return code >= 97 && code <= 122
}

function isLetter(code: number): boolean {
  return isUppercaseLetter(code) || isLowercaseLetter(code)
}

function isNonAscii(code: number): boolean {
  return code >= 0x80
}

function isNameStart(code: number): boolean {
  return isLetter(code) || isNonAscii(code) || code === 95 /* _ */
}

function isName(code: number): boolean {
  return isNameStart(code) || isDigit(code) || code === 45 /* - */
}

function isNonPrintable(code: number): boolean {
  return (code >= 0 && code <= 8) || code === 11 || (code >= 14 && code <= 31) || code === 127
}

function isNewline(code: number): boolean {
  return code === 10 || code === 13 || code === 12
}

function isWhitespace(code: number): boolean {
  return isNewline(code) || code === 9 || code === 32
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
  tokens: Token[] = []
  /** Offset where each line starts; used for line/col reporting. */
  lineStarts: number[] = [0]

  constructor(source: string) {
    this.source = source
    this.tokenize()
  }

  private addToken(type: TokenType, start: number, end: number): void {
    this.tokens.push({ type, start, end, source: this.source })
  }

  private tokenize(): void {
    const src = this.source
    let i = 0
    const len = src.length

    while (i < len) {
      const c1 = src.charCodeAt(i)

      // newline tracking
      if (c1 === 10) // \n
        this.lineStarts.push(i + 1)
      else if (c1 === 13 && src.charCodeAt(i + 1) !== 10) // \r without \n
        this.lineStarts.push(i + 1)

      // comment /* ... */
      if (c1 === 47 /* / */ && src.charCodeAt(i + 1) === 42 /* * */) {
        const start = i
        i += 2
        while (i < len && !(src.charCodeAt(i) === 42 && src.charCodeAt(i + 1) === 47)) {
          if (src.charCodeAt(i) === 10)
            this.lineStarts.push(i + 1)
          i++
        }
        i = i < len ? i + 2 : len
        this.addToken(TokenType.Comment, start, i)
        continue
      }

      // whitespace
      if (isWhitespace(c1)) {
        const start = i
        while (i < len && isWhitespace(src.charCodeAt(i))) {
          if (src.charCodeAt(i) === 10)
            this.lineStarts.push(i + 1)
          i++
        }
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
          if (c2 === 10)
            this.lineStarts.push(i + 2)
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
    let i = start
    while (i < src.length) {
      const c = src.charCodeAt(i)
      if (isName(c)) {
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
    const lower = src.slice(start, nameEnd).toLowerCase()
    if (lower === 'url' && c === 40 /* ( */) {
      // skip opening (
      let i = nameEnd + 1
      // skip whitespace
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
    while (i < len && isWhitespace(src.charCodeAt(i))) {
      if (src.charCodeAt(i) === 10)
        this.lineStarts.push(i + 1)
      i++
    }
    while (i < len) {
      const c = src.charCodeAt(i)
      if (c === 41 /* ) */) {
        i++
        this.addToken(TokenType.Url, start, i)
        return i
      }
      if (isWhitespace(c)) {
        const wsStart = i
        while (i < len && isWhitespace(src.charCodeAt(i))) {
          if (src.charCodeAt(i) === 10)
            this.lineStarts.push(i + 1)
          i++
        }
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

  private consumeBadUrl(start: number, _from: number): number {
    const src = this.source
    let i = _from
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
    let lo = 0
    let hi = this.lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (this.lineStarts[mid]! <= offset)
        lo = mid
      else
        hi = mid - 1
    }
    const lineStart = this.lineStarts[lo]!
    return { line: lo + 1, column: offset - lineStart + 1 }
  }
}

/** Decode a CSS-escaped name slice (e.g. `\\26 B` → `&B`). */
export function decodeName(source: string, start: number, end: number): string {
  let out = ''
  let i = start
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
