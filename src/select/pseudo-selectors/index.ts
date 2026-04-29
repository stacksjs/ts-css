/**
 * Pseudo-selector dispatcher. Three families:
 *  - filters: take a string or selector list, modify selection (`:nth-child`, `:not`, `:is`, `:where`, `:has`)
 *  - pseudos: simple boolean predicates (`:empty`, `:root`, `:checked`, etc.)
 *  - aliases: rewrite to attribute / sub-selectors
 */

import type { Selector } from '../../what'
import type { CompiledQuery, Options } from '../types'
import { parse as parseSelectorString } from '../../what'
import { compileGeneric, parseAndCompile } from './selectors'

interface PseudoToken {
  type: 'pseudo' | 'pseudo-element'
  name: string
  data: string | Selector[][] | null
}

// Pseudo-classes whose match depends on document state (focus, hover, form
// validity, etc.) that ts-css doesn't model. They fail closed unless the
// caller supplies an `options.pseudos[name]` predicate.
const STATEFUL_PSEUDOS: ReadonlySet<string> = new Set([
  'link', 'any-link', 'visited', 'hover', 'active', 'focus',
  'focus-visible', 'focus-within', 'target', 'target-within', 'enabled',
  'disabled', 'checked', 'required', 'optional', 'valid', 'invalid',
  'selected', 'placeholder-shown', 'read-only', 'read-write', 'in-range',
  'out-of-range', 'default', 'indeterminate',
])

const SELECTOR_LIST_PSEUDOS: ReadonlySet<string> = new Set([
  'is', 'where', 'matches', '-moz-any', '-webkit-any',
])

const NTH_PSEUDOS: ReadonlySet<string> = new Set([
  'nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type',
])

export function compilePseudo<Node, ElementNode extends Node>(
  token: PseudoToken,
  options: Options<Node, ElementNode>,
  next: CompiledQuery<ElementNode>,
): CompiledQuery<ElementNode> {
  const adapter = options.adapter
  const name = token.name
  const data = token.data

  // -------- combinatorial pseudos: take selector lists --------
  if (token.type === 'pseudo' && SELECTOR_LIST_PSEUDOS.has(name)) {
    if (!Array.isArray(data))
      return next
    const tests = (data as Selector[][]).map(seg => parseAndCompile(seg, options))
    // For a single sub-selector, skip the array iteration cost.
    if (tests.length === 1) {
      const t0 = tests[0]!
      return e => t0(e) && next(e)
    }
    return (e) => {
      for (const t of tests) {
        if (t(e))
          return next(e)
      }
      return false
    }
  }
  if (token.type === 'pseudo' && name === 'not') {
    if (!Array.isArray(data))
      return next
    const tests = (data as Selector[][]).map(seg => parseAndCompile(seg, options))
    if (tests.length === 1) {
      const t0 = tests[0]!
      return e => !t0(e) && next(e)
    }
    return (e) => {
      for (const t of tests) {
        if (t(e))
          return false
      }
      return next(e)
    }
  }
  if (token.type === 'pseudo' && name === 'has') {
    if (!Array.isArray(data))
      return next
    const tests = (data as Selector[][]).map(seg => parseAndCompile(seg, options))
    // Collapse the sub-test list into a single predicate so the inner
    // descendant loop only invokes one function per node.
    const subjectTest: CompiledQuery<ElementNode> = tests.length === 1
      ? tests[0]!
      : ((node: any) => {
          for (const t of tests) {
            if (t(node))
              return true
          }
          return false
        }) as any
    return (e) => {
      // Iterative DFS using `pop` (O(1)) instead of `shift` (O(n)). The
      // iteration order is reversed but `:has()` doesn't care about order
      // — it stops at the first descendant that satisfies the test.
      const stack: any[] = adapter.getChildren(e).slice()
      while (stack.length > 0) {
        const cur = stack.pop()
        if (!adapter.isTag(cur))
          continue
        if (subjectTest(cur as any))
          return next(e)
        const kids = adapter.getChildren(cur as any)
        for (let i = 0; i < kids.length; i++)
          stack.push(kids[i])
      }
      return false
    }
  }

  // -------- nth-* pseudos --------
  if (token.type === 'pseudo' && NTH_PSEUDOS.has(name)) {
    const fn = compileNth(typeof data === 'string' ? data : '', name, options)
    return e => fn(e) && next(e)
  }

  // -------- structural pseudos --------
  // Each variant scans `getSiblings(e)` once without allocating the
  // filtered intermediate array `[].filter()` would (the previous shape
  // produced one allocation per element-test, which the matcher hits
  // 250+ times per selector even for tiny trees).
  if (token.type === 'pseudo' && name === 'first-child') {
    return (e) => {
      const sibs = adapter.getSiblings(e)
      for (const s of sibs) {
        if (!adapter.isTag(s))
          continue
        return s === e && next(e)
      }
      return false
    }
  }
  if (token.type === 'pseudo' && name === 'last-child') {
    return (e) => {
      const sibs = adapter.getSiblings(e)
      for (let i = sibs.length - 1; i >= 0; i--) {
        const s = sibs[i]!
        if (!adapter.isTag(s))
          continue
        return s === e && next(e)
      }
      return false
    }
  }
  if (token.type === 'pseudo' && name === 'first-of-type') {
    return (e) => {
      const tag = adapter.getName(e)
      const sibs = adapter.getSiblings(e)
      for (const s of sibs) {
        if (!adapter.isTag(s) || adapter.getName(s as any) !== tag)
          continue
        return s === e && next(e)
      }
      return false
    }
  }
  if (token.type === 'pseudo' && name === 'last-of-type') {
    return (e) => {
      const tag = adapter.getName(e)
      const sibs = adapter.getSiblings(e)
      for (let i = sibs.length - 1; i >= 0; i--) {
        const s = sibs[i]!
        if (!adapter.isTag(s) || adapter.getName(s as any) !== tag)
          continue
        return s === e && next(e)
      }
      return false
    }
  }
  if (token.type === 'pseudo' && name === 'only-child') {
    return (e) => {
      const sibs = adapter.getSiblings(e)
      let count = 0
      let found = false
      for (const s of sibs) {
        if (!adapter.isTag(s))
          continue
        count++
        if (count > 1)
          return false
        if (s === e)
          found = true
      }
      return count === 1 && found && next(e)
    }
  }
  if (token.type === 'pseudo' && name === 'only-of-type') {
    return (e) => {
      const tag = adapter.getName(e)
      const sibs = adapter.getSiblings(e)
      let count = 0
      let found = false
      for (const s of sibs) {
        if (!adapter.isTag(s) || adapter.getName(s as any) !== tag)
          continue
        count++
        if (count > 1)
          return false
        if (s === e)
          found = true
      }
      return count === 1 && found && next(e)
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
      // Materialize a Set once at compile time — `Array.includes` is O(n)
      // per element check and `:scope` runs against every candidate.
      const ctx = new Set<any>(options.context as any[])
      return e => ctx.has(e) && next(e)
    }
    if (options.context) {
      const ctx = options.context as any
      return e => (e as any) === ctx && next(e)
    }
    return (e) => {
      const p = adapter.getParent(e)
      return (p == null || !adapter.isTag(p as any)) && next(e)
    }
  }
  if (token.type === 'pseudo' && STATEFUL_PSEUDOS.has(name)) {
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
      // Compile the alias selector string with `compileGeneric` so commas
      // (selector lists) are handled correctly. Previously this routed
      // through a stubbed `parseRaw` that always returned `[]`, which
      // silently caused string-aliased pseudos to never match.
      const aliasGroups = parseSelectorString(ext)
      const re = compileGeneric(aliasGroups, options)
      return e => re(e) && next(e)
    }
  }

  // unknown — fail closed
  return _ => { void _; return false }
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
    // Compute idx in one pass over siblings — no `filter()` allocs and no
    // `reverse()` mutation. For `nth-last-*` we count total matching
    // siblings then take `total - rawIdx + 1`.
    const sibs = adapter.getSiblings(e)
    const tag = ofType ? adapter.getName(e) : ''
    let raw = 0 // 1-based index of `e` among matching siblings
    let total = 0
    for (const s of sibs) {
      if (!adapter.isTag(s))
        continue
      if (ofType && adapter.getName(s as any) !== tag)
        continue
      total++
      if (s === e)
        raw = total
    }
    if (raw === 0)
      return false
    const idx = reverse ? total - raw + 1 : raw
    if (a === 0)
      return idx === b
    return ((idx - b) / a) >= 0 && ((idx - b) % a) === 0
  }
}

export { compileGeneric }
