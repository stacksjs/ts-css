/**
 * Compose a token list into a test function.
 *
 * Tokens carry simple selectors (tag/class/attr/pseudo) interleaved with
 * combinators (descendant/child/sibling/adjacent). The final predicate
 * tests the SUBJECT — the rightmost compound — and each preceding compound
 * becomes an "ancestor"-style check applied via the combinator.
 */

import type { Selector } from '../../what'
import type { Adapter, CompiledQuery, Options } from '../types'
import { isTraversal } from '../../what'
import { compileToken } from '../general'

const ALWAYS_TRUE = (_: any): boolean => { void _; return true }

export function compileGeneric<Node, ElementNode extends Node>(
  segments: Selector[][],
  options: Options<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  const compiled = segments.map(seg => parseAndCompile(seg, options))
  return e => compiled.some(c => c(e))
}

export function parseAndCompile<Node, ElementNode extends Node>(
  tokens: Selector[],
  options: Options<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  // Split tokens into compound groups separated by traversal combinators.
  const groups: Array<{ simple: Selector[], comb: Selector }> = []
  let cur: Selector[] = []
  for (const t of tokens) {
    if (isTraversal(t)) {
      groups.push({ simple: cur, comb: t })
      cur = []
    }
    else {
      cur.push(t)
    }
  }
  const subjectSimple = cur

  // Build the "subject" predicate (matches the element itself).
  let test = makeCompoundTest(subjectSimple, options)

  // For each preceding compound, wrap with the corresponding combinator.
  for (let i = groups.length - 1; i >= 0; i--) {
    const { simple, comb } = groups[i]!
    const ancestor = makeCompoundTest(simple, options)
    test = wrapCombinator(comb, ancestor, test, options.adapter)
  }
  return test
}

function makeCompoundTest<Node, ElementNode extends Node>(
  simples: Selector[],
  options: Options<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  let chain: CompiledQuery<ElementNode> = ALWAYS_TRUE
  for (let i = simples.length - 1; i >= 0; i--)
    chain = compileToken(simples[i]!, options, chain)
  return chain
}

function wrapCombinator<Node, ElementNode extends Node>(
  comb: Selector,
  ancestor: CompiledQuery<ElementNode>,
  subject: CompiledQuery<ElementNode>,
  adapter: Adapter<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  switch (comb.type) {
    case 'descendant':
      return (e) => {
        if (!subject(e))
          return false
        let p: any = adapter.getParent(e)
        while (p) {
          if (adapter.isTag(p) && ancestor(p))
            return true
          p = adapter.getParent(p)
        }
        return false
      }
    case 'child':
      return (e) => {
        if (!subject(e))
          return false
        const p = adapter.getParent(e)
        return p != null && adapter.isTag(p) && ancestor(p)
      }
    case 'parent':
      return (e) => {
        if (!subject(e))
          return false
        return adapter.existsOne(ancestor, adapter.getChildren(e))
      }
    case 'sibling':
      return (e) => {
        if (!subject(e))
          return false
        const sibs = adapter.getSiblings(e)
        for (const s of sibs) {
          if (s === e)
            return false
          if (adapter.isTag(s) && ancestor(s))
            return true
        }
        return false
      }
    case 'adjacent':
      return (e) => {
        if (!subject(e))
          return false
        const sibs = adapter.getSiblings(e)
        let prev: any = null
        for (const s of sibs) {
          if (s === e)
            return prev != null && adapter.isTag(prev) && ancestor(prev)
          prev = s
        }
        return false
      }
    case 'column-combinator':
      // Approximate as descendant — we don't model table columns.
      return (e) => {
        if (!subject(e))
          return false
        let p: any = adapter.getParent(e)
        while (p) {
          if (adapter.isTag(p) && ancestor(p))
            return true
          p = adapter.getParent(p)
        }
        return false
      }
  }
  return _ => { void _; return false }
}
