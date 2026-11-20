import { describe, expect, it } from 'bun:test'
import { minify, minifyBlock, syntax } from '../src/optimize'
import { parse } from '../src/parse'

describe('minify', () => {
  it('strips comments', () => {
    expect(minify('/* hi */ .a{color:red}').css).toBe('.a{color:red}')
  })
  it('preserves /*!*/ comments by default', () => {
    expect(minify('/*! keep */.a{color:red}').css).toContain('keep')
  })
  it('drops `/*!*/` when comments:false', () => {
    expect(minify('/*! keep */.a{color:red}', { comments: false }).css).toBe('.a{color:red}')
  })
  it('shortens decimals', () => {
    expect(minify('.a{margin:0.5em 10.000px}').css).toBe('.a{margin:.5em 10px}')
  })
  it('drops zero units', () => {
    expect(minify('.a{margin:0px 0em}').css).toBe('.a{margin:0 0}')
  })
  it('dedupes declarations keeping the later one', () => {
    expect(minify('.a{color:red;color:blue}').css).toBe('.a{color:blue}')
  })
  it('respects !important when deduping', () => {
    expect(minify('.a{color:red!important;color:blue}').css).toBe('.a{color:red!important}')
  })
  it('shortens hex colors', () => {
    expect(minify('.a{color:#aabbcc}').css).toBe('.a{color:#abc}')
  })

  it('shortens named colors when hex is strictly shorter', () => {
    // black (5) → #000 (4): replace
    expect(minify('.a{color:black}').css).toBe('.a{color:#000}')
    // white (5) → #fff (4): replace
    expect(minify('.a{color:white}').css).toBe('.a{color:#fff}')
  })

  it('keeps named colors that tie or beat hex', () => {
    // blue (4) ties #00f (4) — keep keyword
    expect(minify('.a{color:blue}').css).toBe('.a{color:blue}')
    // red (3) beats #f00 (4) — keep keyword
    expect(minify('.a{color:red}').css).toBe('.a{color:red}')
  })

  it('only swaps colors inside color properties', () => {
    // font-family is not a color property — `red` stays
    expect(minify('.a{font-family:red}').css).toBe('.a{font-family:red}')
  })

  it('reverses hex → name when name is strictly shorter', () => {
    // #ff0000 (7) → red (3): replace
    expect(minify('.a{color:#ff0000}').css).toBe('.a{color:red}')
  })
})

describe('minifyBlock', () => {
  it('minifies declaration lists in isolation', () => {
    expect(minifyBlock('color:red;color:blue').css).toBe('color:blue')
  })
})

describe('syntax.specificity', () => {
  it('counts ids', () => {
    const sel = parse('#a', { context: 'selector' })
    expect(syntax.specificity(sel)).toEqual([1, 0, 0])
  })
  it('counts classes and attributes', () => {
    const sel = parse('.a[type=button]', { context: 'selector' })
    expect(syntax.specificity(sel)).toEqual([0, 2, 0])
  })
  it('counts type selectors', () => {
    const sel = parse('div p', { context: 'selector' })
    expect(syntax.specificity(sel)).toEqual([0, 0, 2])
  })
  it(':where() contributes nothing', () => {
    const sel = parse(':where(#a) p', { context: 'selector' })
    expect(syntax.specificity(sel)).toEqual([0, 0, 1])
  })
  it(':is() takes max of args', () => {
    const sel = parse(':is(#a, .b)', { context: 'selector' })
    expect(syntax.specificity(sel)).toEqual([1, 0, 0])
  })
  it('accepts a raw selector string', () => {
    expect(syntax.specificity('#a.b div')).toEqual([1, 1, 1])
    expect(syntax.specificity('p > span:not(#x)')).toEqual([1, 0, 2])
  })
  it('accepts cssWhat-style Selector[][] arrays', async () => {
    const { parse: parseWhat } = await import('../src/what')
    const ast = parseWhat('#a.b div')
    expect(syntax.specificity(ast)).toEqual([1, 1, 1])
  })
})

/**
 * `<urange>` is a token of its own in the spec, but the tokenizer splits it
 * like any other value -- `U+0000-00FF` arrives as an identifier `U`, a
 * number `+0000` and a dimension `-00FF` -- and the number rules stripped the
 * `+`. `U0000-00FF` is not a `<urange>`, so the browser discarded the whole
 * descriptor and a subsetted @font-face (every Google Fonts stylesheet) loaded
 * its full character set instead. Reported in stacksjs/ts-css#44.
 */
describe('unicode-range', () => {
  it('should keep the + in every urange form', () => {
    const css = '@font-face{font-family:Inter;src:url(inter.woff2);unicode-range:U+0000-00FF, U+0131, U+00A0, u+4??}'
    expect(minify(css).css).toBe('@font-face{font-family:Inter;src:url(inter.woff2);unicode-range:U+0000-00FF,U+0131,U+00A0,u+4??}')
  })

  /**
   * Not only the `+`: these fragments are not numbers, so no number rule may
   * touch them. `U+0-0` would otherwise lose a digit to the negative-zero
   * rule, and `U+1e5` would be read as an exponent.
   */
  it('should apply no number rule inside the descriptor', () => {
    expect(minify('@font-face{unicode-range:U+0-0,U+1e5,U+0-7F}').css)
      .toBe('@font-face{unicode-range:U+0-0,U+1e5,U+0-7F}')
  })

  it('should match the property name case-insensitively', () => {
    expect(minify('@font-face{UNICODE-RANGE:U+0025-00FF}').css).toBe('@font-face{UNICODE-RANGE:U+0025-00FF}')
  })

  it('should still compress numbers everywhere else', () => {
    expect(minify('.a{margin:0.50px;opacity:+0.5}').css).toBe('.a{margin:.5px;opacity:.5}')
  })
})
