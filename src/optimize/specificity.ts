/**
 * Compute CSS selector specificity per https://www.w3.org/TR/selectors-4/#specificity-rules.
 *
 * Returns an `[a, b, c]` tuple where:
 *   a = id selectors
 *   b = class / attribute / pseudo-class selectors
 *   c = type / pseudo-element selectors
 *
 * Accepts either:
 *   - a css-tree-style `Selector` / `SelectorList` AST node (csso shape), OR
 *   - a `Selector[][]` returned by `cssWhat.parse(string)` — so callers
 *     can pipe `cssWhat.parse(...)` straight into `syntax.specificity(...)`.
 */

import type { CssNode } from '../parse'
import type { Selector as WhatSelector } from '../what'

export type Specificity = [number, number, number]

export function specificity(input: CssNode | WhatSelector[][] | WhatSelector[] | string): Specificity {
  const result: Specificity = [0, 0, 0]

  if (typeof input === 'string') {
    // Lazy import to avoid a hard cycle.
    const { parse: parseSelector } = require('../what') as typeof import('../what')
    const ast = parseSelector(input)
    visitWhat(ast, result)
    return result
  }

  if (Array.isArray(input)) {
    if (input.length === 0)
      return result
    // distinguish Selector[][] from Selector[]
    if (Array.isArray(input[0]))
      visitWhat(input as WhatSelector[][], result)
    else
      visitWhatGroup(input as WhatSelector[], result)
    return result
  }

  visit(input, result)
  return result
}

// ---- css-tree shape ----

function visit(node: CssNode, result: Specificity): void {
  switch (node.type) {
    case 'IdSelector':
      result[0]++
      return
    case 'ClassSelector':
    case 'AttributeSelector':
      result[1]++
      return
    case 'TypeSelector':
      if (node.name !== '*')
        result[2]++
      return
    case 'PseudoClassSelector': {
      const name = node.name.toLowerCase()
      if (name === 'is' || name === 'matches' || name === '-moz-any' || name === '-webkit-any' || name === 'not' || name === 'has') {
        if (node.children) {
          const selectors: CssNode[] = []
          for (const inner of node.children as Iterable<CssNode>) {
            if (inner.type === 'SelectorList' && 'children' in inner && inner.children) {
              for (const s of inner.children as Iterable<CssNode>)
                selectors.push(s)
            }
            else if (inner.type === 'Selector') {
              selectors.push(inner)
            }
          }
          let max: Specificity = [0, 0, 0]
          for (const sel of selectors) {
            const s = specificity(sel)
            if (compareSpec(s, max) > 0)
              max = s
          }
          result[0] += max[0]
          result[1] += max[1]
          result[2] += max[2]
        }
        return
      }
      if (name === 'where')
        return
      result[1]++
      return
    }
    case 'PseudoElementSelector':
      result[2]++
      return
    case 'Selector':
    case 'SelectorList':
    case 'AtrulePrelude':
      if ('children' in node && node.children) {
        for (const child of node.children as Iterable<CssNode>)
          visit(child, result)
      }
      return
    case 'NestingSelector':
      return
  }
}

// ---- css-what shape (Selector[][] or Selector[]) ----
//
// css-what's `Selector` is one of:
//   { type: 'tag' | 'universal' | 'attribute' | 'pseudo' | 'pseudo-element'
//       | 'descendant' | 'child' | 'parent' | 'sibling' | 'adjacent' | 'column-combinator',
//     … }
//
// For specificity, *only* attribute/pseudo/tag matter — combinators are
// ignored. `:is`/`:not`/`:has`/`:matches` take the max of their args.

function visitWhat(groups: WhatSelector[][], result: Specificity): void {
  // Each top-level group is one comma-separated selector. css-tree-style
  // specificity is computed per-selector; for SelectorList (`a, b`) we
  // sum across all groups (matches csso behaviour).
  for (const g of groups)
    visitWhatGroup(g, result)
}

function visitWhatGroup(tokens: WhatSelector[], result: Specificity): void {
  for (const t of tokens) {
    switch (t.type) {
      case 'tag':
        if (t.name !== '*')
          result[2]++
        break
      case 'attribute':
        // `.foo` and `#bar` are emitted as attribute selectors with name
        // 'class'/'id' — count them like ClassSelector / IdSelector.
        if (t.name === 'id' && t.action === 'equals')
          result[0]++
        else
          result[1]++
        break
      case 'pseudo': {
        const name = t.name.toLowerCase()
        if (name === 'is' || name === 'matches' || name === 'not' || name === 'has' || name === '-moz-any' || name === '-webkit-any') {
          // data is Selector[][] when parsed by css-what's selector-list pseudos
          if (Array.isArray(t.data)) {
            let max: Specificity = [0, 0, 0]
            for (const inner of t.data as WhatSelector[][]) {
              const s: Specificity = [0, 0, 0]
              visitWhatGroup(inner, s)
              if (compareSpec(s, max) > 0)
                max = s
            }
            result[0] += max[0]
            result[1] += max[1]
            result[2] += max[2]
          }
          break
        }
        if (name === 'where')
          break
        result[1]++
        break
      }
      case 'pseudo-element':
        result[2]++
        break
      // combinators don't contribute to specificity
    }
  }
}

function compareSpec(a: Specificity, b: Specificity): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i])
      return a[i]! - b[i]!
  }
  return 0
}

export function specificityToString(s: Specificity): string {
  return s.join(',')
}
