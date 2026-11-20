/**
 * Compose a token list into a test function.
 *
 * Tokens carry simple selectors (tag/class/attr/pseudo) interleaved with
 * combinators (descendant/child/sibling/adjacent). Each token becomes one
 * link in a chain — combinators wrap the running chain so it tests the
 * left-hand chain on a new pivot. We iterate left-to-right (matching
 * `css-select`'s compile model) but sort tokens *within each compound* by
 * procedure cost so cheap tests (tag) wind up outermost and fail-fast.
 */

import type { AttributeSelectorNode, Selector } from '../../what'
import type { Adapter, CompiledQuery, Options } from '../types'
import { compileToken } from '../general'
import { ALWAYS_TRUE } from '../helpers/always-true'

// Lower = more expensive → wrapped innermost → runs last.
// Higher = cheaper → wrapped outermost → runs first (lets us fail-fast).
const PROCEDURE: Record<string, number> = {
  universal: 50,
  tag: 30,
  attribute: 1,
  pseudo: 0,
  'pseudo-element': 0,
}

// Within `attribute`, equality is cheaper than substring/regex.
const ATTRIBUTE_PROCEDURE: Record<string, number> = {
  exists: 10,
  equals: 8,
  not: 7,
  start: 6,
  end: 6,
  hyphen: 5,
  any: 4,
  element: 3,
}

function tokenProcedure(t: Selector): number {
  const base = PROCEDURE[t.type] ?? 0
  if (t.type === 'attribute')
    return base + (ATTRIBUTE_PROCEDURE[(t as AttributeSelectorNode).action] ?? 0)
  return base
}

export function compileGeneric<Node, ElementNode extends Node>(
  segments: Selector[][],
  options: Options<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  if (segments.length === 1)
    return parseAndCompile(segments[0]!, options)
  const compiled = segments.map(seg => parseAndCompile(seg, options))
  return e => compiled.some(c => c(e))
}

/**
 * The element a relative selector is measured from.
 *
 * Mutable on purpose: `:has()` compiles its argument once and then evaluates
 * it from a different subject for every candidate, so the anchor is read at
 * match time rather than captured at compile time the way `:scope` captures
 * `options.context`.
 */
export interface SelectorAnchor<ElementNode> {
  current: ElementNode | null
}

export function isCombinator(token: Selector): boolean {
  return token.type === 'descendant' || token.type === 'child' || token.type === 'sibling'
    || token.type === 'adjacent' || token.type === 'parent' || token.type === 'column-combinator'
}

/**
 * Compile one complex selector.
 *
 * With an `anchor`, `tokens` is a RELATIVE selector (Selectors 4), as in the
 * argument to `:has()`: its leftmost compound is the anchor itself, and an
 * argument with no leading combinator takes the implied descendant one. So
 * `> span` is "a span whose parent is the anchor" and `section span` is "a
 * span under a section under the anchor". Without the anchor, the empty
 * leading compound was ALWAYS_TRUE, which made `> span` "a span whose parent
 * is anything" and let `section span` match through a section OUTSIDE the
 * subject.
 */
export function parseAndCompile<Node, ElementNode extends Node>(
  tokens: Selector[],
  options: Options<Node, ElementNode>,
  anchor?: SelectorAnchor<ElementNode>,
): CompiledQuery<ElementNode> {
  const adapter = options.adapter
  // Split into compound buckets; combinator markers stay in `combs`.
  const compounds: Selector[][] = [[]]
  const combs: Selector[] = []
  for (const t of tokens) {
    if (isCombinator(t)) {
      combs.push(t)
      compounds.push([])
    }
    else {
      compounds[compounds.length - 1]!.push(t)
    }
  }

  if (anchor && compounds[0]!.length > 0) {
    compounds.unshift([])
    combs.unshift({ type: 'descendant' } as Selector)
  }

  // Build left-to-right. Within each compound, sort by procedure ascending
  // so the cheapest test ends up outermost (runs first).
  let func: CompiledQuery<ElementNode> = anchor
    ? (elem => elem === anchor.current)
    : ALWAYS_TRUE
  for (let ci = 0; ci < compounds.length; ci++) {
    const compound = compounds[ci]!.slice().sort((a, b) => tokenProcedure(a) - tokenProcedure(b))
    for (const t of compound)
      func = compileToken(t, options, func)
    if (ci < combs.length)
      func = wrapCombinator(combs[ci]!, func, adapter)
  }
  return func
}

function wrapCombinator<Node, ElementNode extends Node>(
  comb: Selector,
  after: CompiledQuery<ElementNode>,
  adapter: Adapter<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  switch (comb.type) {
    case 'descendant':
    case 'column-combinator':
      return (elem: any) => {
        let p: any = adapter.getParent(elem)
        while (p) {
          if (adapter.isTag(p) && after(p))
            return true
          p = adapter.getParent(p)
        }
        return false
      }
    case 'child':
      return (elem: any) => {
        const p: any = adapter.getParent(elem)
        return p != null && adapter.isTag(p) && after(p)
      }
    case 'sibling':
      return (elem: any) => {
        const sibs: any[] = adapter.getSiblings(elem) as any
        for (const s of sibs) {
          if (s === elem)
            return false
          if (adapter.isTag(s) && after(s))
            return true
        }
        return false
      }
    case 'adjacent':
      return (elem: any) => {
        const sibs: any[] = adapter.getSiblings(elem) as any
        let prev: any = null
        for (const s of sibs) {
          if (s === elem)
            return prev != null && adapter.isTag(prev) && after(prev)
          prev = s
        }
        return false
      }
    case 'parent':
      return (elem: any) => adapter.existsOne(after, adapter.getChildren(elem))
  }
  return _ => { void _; return false }
}
