/**
 * Pseudo-selector dispatcher. Three families:
 *  - filters: take a string or selector list, modify selection (`:nth-child`, `:not`, `:is`, `:where`, `:has`)
 *  - pseudos: simple boolean predicates (`:empty`, `:root`, `:checked`, etc.)
 *  - aliases: rewrite to attribute / sub-selectors
 */

import type { Selector } from '../../what'
import type { CompiledQuery, Options } from '../types'
import { compileGeneric, parseAndCompile } from './selectors'

interface PseudoToken {
  type: 'pseudo' | 'pseudo-element'
  name: string
  data: string | Selector[][] | null
}

export function compilePseudo<Node, ElementNode extends Node>(
  token: PseudoToken,
  options: Options<Node, ElementNode>,
  next: CompiledQuery<ElementNode>,
): CompiledQuery<ElementNode> {
  const adapter = options.adapter
  const name = token.name
  const data = token.data

  // -------- combinatorial pseudos: take selector lists --------
  if (token.type === 'pseudo' && (name === 'is' || name === 'where' || name === 'matches' || name === '-moz-any' || name === '-webkit-any')) {
    if (!Array.isArray(data))
      return next
    const tests = (data as Selector[][]).map(seg => parseAndCompile(seg, options))
    return e => tests.some(t => t(e)) && next(e)
  }
  if (token.type === 'pseudo' && name === 'not') {
    if (!Array.isArray(data))
      return next
    const tests = (data as Selector[][]).map(seg => parseAndCompile(seg, options))
    return e => !tests.some(t => t(e)) && next(e)
  }
  if (token.type === 'pseudo' && name === 'has') {
    if (!Array.isArray(data))
      return next
    const tests = (data as Selector[][]).map(seg => parseAndCompile(seg, options))
    return (e) => {
      const stack = adapter.getChildren(e).slice()
      while (stack.length > 0) {
        const cur = stack.shift()!
        if (adapter.isTag(cur) && tests.some(t => t(cur as any)))
          return next(e)
        if (cur && (cur as any).children)
          stack.push(...adapter.getChildren(cur))
      }
      return false
    }
  }

  // -------- nth-* pseudos --------
  if (token.type === 'pseudo' && (name === 'nth-child' || name === 'nth-last-child' || name === 'nth-of-type' || name === 'nth-last-of-type')) {
    const fn = compileNth(typeof data === 'string' ? data : '', name, options)
    return e => fn(e) && next(e)
  }

  // -------- structural pseudos --------
  if (token.type === 'pseudo' && name === 'first-child') {
    return e => isNthSibling(e, options, true, false, false) && next(e)
  }
  if (token.type === 'pseudo' && name === 'last-child') {
    return e => isNthSibling(e, options, false, true, false) && next(e)
  }
  if (token.type === 'pseudo' && name === 'first-of-type') {
    return e => isNthSibling(e, options, true, false, true) && next(e)
  }
  if (token.type === 'pseudo' && name === 'last-of-type') {
    return e => isNthSibling(e, options, false, true, true) && next(e)
  }
  if (token.type === 'pseudo' && name === 'only-child') {
    return (e) => {
      const sibs = adapter.getSiblings(e).filter(s => adapter.isTag(s))
      return sibs.length === 1 && sibs[0] === e && next(e)
    }
  }
  if (token.type === 'pseudo' && name === 'only-of-type') {
    return (e) => {
      const tag = adapter.getName(e)
      const sibs = adapter.getSiblings(e).filter(s => adapter.isTag(s) && adapter.getName(s as any) === tag)
      return sibs.length === 1 && sibs[0] === e && next(e)
    }
  }

  // -------- simple pseudos --------
  if (token.type === 'pseudo' && name === 'empty') {
    return e => adapter.getChildren(e).length === 0 && next(e)
  }
  if (token.type === 'pseudo' && name === 'root') {
    return (e) => {
      const p = adapter.getParent(e)
      return (p == null || !adapter.isTag(p as any)) && next(e)
    }
  }
  if (token.type === 'pseudo' && name === 'scope') {
    if (options.context && Array.isArray(options.context)) {
      return e => (options.context as any[]).includes(e) && next(e)
    }
    if (options.context) {
      return e => (e as any) === options.context && next(e)
    }
    return (e) => {
      const p = adapter.getParent(e)
      return (p == null || !adapter.isTag(p as any)) && next(e)
    }
  }
  if (token.type === 'pseudo' && (name === 'link' || name === 'any-link' || name === 'visited' || name === 'hover' || name === 'active' || name === 'focus' || name === 'focus-visible' || name === 'focus-within' || name === 'target' || name === 'target-within' || name === 'enabled' || name === 'disabled' || name === 'checked' || name === 'required' || name === 'optional' || name === 'valid' || name === 'invalid' || name === 'selected' || name === 'placeholder-shown' || name === 'read-only' || name === 'read-write' || name === 'in-range' || name === 'out-of-range' || name === 'default' || name === 'indeterminate')) {
    // Stateful pseudos — without a real DOM we treat them as always-false
    // (matches css-select's `xmlMode` defaults). Consumers who need real
    // matching can pass `options.pseudos[name]` callbacks.
    if (options.pseudos && options.pseudos[name]) {
      const ext = options.pseudos[name]
      if (typeof ext === 'function')
        return e => ext(e, undefined) && next(e)
    }
    return _ => { void _; return false }
  }

  // -------- pseudo-elements --------
  if (token.type === 'pseudo-element') {
    // We don't model pseudo-elements; treat as no-op pass-through filter
    // (matches css-select's behaviour for ::before/::after/etc.).
    return next
  }

  // -------- caller-provided extensions --------
  if (options.pseudos && options.pseudos[name]) {
    const ext = options.pseudos[name]
    if (typeof ext === 'function') {
      return e => ext(e, typeof data === 'string' ? data : undefined) && next(e)
    }
    if (typeof ext === 'string') {
      const re = parseAndCompile(parseRaw(ext), options)
      return e => re(e) && next(e)
    }
  }

  // unknown — fail closed
  return _ => { void _; return false }
}

function parseRaw(text: string): Selector[] {
  // small helper avoiding an outer dep cycle on what.parse for inline css
  void text
  return []
}

function isNthSibling<Node, ElementNode extends Node>(
  e: ElementNode,
  options: Options<Node, ElementNode>,
  first: boolean,
  last: boolean,
  ofType: boolean,
): boolean {
  const adapter = options.adapter
  const siblings = adapter.getSiblings(e).filter(s => adapter.isTag(s))
  if (ofType) {
    const tag = adapter.getName(e)
    const filtered = siblings.filter(s => adapter.getName(s as any) === tag)
    if (first)
      return filtered[0] === e
    if (last)
      return filtered[filtered.length - 1] === e
    return false
  }
  if (first)
    return siblings[0] === e
  if (last)
    return siblings[siblings.length - 1] === e
  return false
}

function parseAnPlusB(s: string): { a: number, b: number } | null {
  const trimmed = s.trim()
  if (trimmed === 'odd')
    return { a: 2, b: 1 }
  if (trimmed === 'even')
    return { a: 2, b: 0 }
  const m = /^([+-]?\d*)n([+-]\d+)?$/.exec(trimmed.replace(/\s+/g, ''))
  if (m) {
    const a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : Number(m[1])
    const b = m[2] ? Number(m[2]) : 0
    return { a, b }
  }
  const num = Number(trimmed)
  if (!Number.isNaN(num))
    return { a: 0, b: num }
  return null
}

function compileNth<Node, ElementNode extends Node>(
  arg: string,
  kind: string,
  options: Options<Node, ElementNode>,
): (e: ElementNode) => boolean {
  const ab = parseAnPlusB(arg)
  if (!ab)
    return () => false
  const { a, b } = ab
  const adapter = options.adapter
  const ofType = kind === 'nth-of-type' || kind === 'nth-last-of-type'
  const reverse = kind === 'nth-last-child' || kind === 'nth-last-of-type'
  return (e) => {
    let siblings = adapter.getSiblings(e).filter(s => adapter.isTag(s))
    if (ofType) {
      const tag = adapter.getName(e)
      siblings = siblings.filter(s => adapter.getName(s as any) === tag)
    }
    if (reverse)
      siblings = siblings.reverse()
    const idx = siblings.indexOf(e) + 1
    if (idx === 0)
      return false
    if (a === 0)
      return idx === b
    return ((idx - b) / a) >= 0 && ((idx - b) % a) === 0
  }
}

export { compileGeneric }
