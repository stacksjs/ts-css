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
})
