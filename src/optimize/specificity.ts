/**
 * Compute CSS selector specificity per https://www.w3.org/TR/selectors-4/#specificity-rules.
 *
 * Returns an `[a, b, c]` tuple where:
 *   a = id selectors
 *   b = class / attribute / pseudo-class selectors
 *   c = type / pseudo-element selectors
 *
 * Operates on css-tree-style `Selector` nodes (children list of simple
 * selectors + combinators). Mirrors `csso.syntax.specificity` so SVGO's
 * inlineStyles plugin can swap deps cleanly.
 */

import type { CssNode } from '../parse'

export type Specificity = [number, number, number]

export function specificity(node: CssNode): Specificity {
  const result: Specificity = [0, 0, 0]
  visit(node, result)
  return result
}

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
          // The argument is either a SelectorList (multiple selectors) or a
          // flat list of selector tokens. Either way, find each top-level
          // Selector and take the max of their individual specificities.
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
      // `&` adopts the host's specificity — approximate as 0
      return
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
