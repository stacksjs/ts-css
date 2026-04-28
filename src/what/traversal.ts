import type { Selector } from './types'

const TRAVERSAL_TYPES = new Set(['adjacent', 'child', 'descendant', 'parent', 'sibling', 'column-combinator'])

/** True when `token` is a traversal/combinator segment (vs. simple selector). */
export function isTraversal(token: Selector): boolean {
  return TRAVERSAL_TYPES.has(token.type)
}
