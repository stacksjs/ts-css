/**
 * Iterative tree search for selectAll / selectOne. Mirrors `css-select`'s
 * approach: use a stack of `(children, index)` pairs to walk the tree
 * depth-first without recursion, avoiding the per-recursion frame and the
 * `out.push(...spread)` allocations a naive recursive findAll incurs.
 *
 * We deliberately ignore `adapter.findAll` even when the consumer supplies
 * one, because forcing every selectAll through the adapter's recursion is
 * the single biggest cost on tree walks. Adapters are still consulted for
 * `isTag` / `getChildren` / `getName`.
 */

import type { Adapter, CompiledQuery } from '../types'

export function findAll<Node, ElementNode extends Node>(
  query: CompiledQuery<ElementNode>,
  nodes: ReadonlyArray<Node>,
  adapter: Adapter<Node, ElementNode>,
  xmlMode: boolean,
): ElementNode[] {
  const result: ElementNode[] = []
  const nodeStack: ReadonlyArray<Node>[] = [nodes]
  const indexStack: number[] = [0]
  for (; ;) {
    if (indexStack[0]! >= nodeStack[0]!.length) {
      if (nodeStack.length === 1)
        return result
      nodeStack.shift()
      indexStack.shift()
      continue
    }
    const element = nodeStack[0]![indexStack[0]!++]!
    if (!adapter.isTag(element))
      continue
    if (query(element as unknown as ElementNode))
      result.push(element as unknown as ElementNode)
    if (xmlMode || adapter.getName(element as unknown as ElementNode) !== 'template') {
      const children = adapter.getChildren(element as unknown as ElementNode) as Node[]
      if (children.length > 0) {
        nodeStack.unshift(children)
        indexStack.unshift(0)
      }
    }
  }
}

export function findOne<Node, ElementNode extends Node>(
  query: CompiledQuery<ElementNode>,
  nodes: ReadonlyArray<Node>,
  adapter: Adapter<Node, ElementNode>,
  xmlMode: boolean,
): ElementNode | null {
  const nodeStack: ReadonlyArray<Node>[] = [nodes]
  const indexStack: number[] = [0]
  for (; ;) {
    if (indexStack[0]! >= nodeStack[0]!.length) {
      if (nodeStack.length === 1)
        return null
      nodeStack.shift()
      indexStack.shift()
      continue
    }
    const element = nodeStack[0]![indexStack[0]!++]!
    if (!adapter.isTag(element))
      continue
    if (query(element as unknown as ElementNode))
      return element as unknown as ElementNode
    if (xmlMode || adapter.getName(element as unknown as ElementNode) !== 'template') {
      const children = adapter.getChildren(element as unknown as ElementNode) as Node[]
      if (children.length > 0) {
        nodeStack.unshift(children)
        indexStack.unshift(0)
      }
    }
  }
}

/**
 * Convert the user-supplied root into a search context. Mirrors
 * `css-select`'s `prepareContext` — a single root node is replaced by its
 * children (so the root itself isn't a candidate); arrays go through
 * `removeSubsets` to avoid testing nested selections twice.
 */
export function prepareContext<Node, ElementNode extends Node>(
  elements: Node | Node[],
  adapter: Adapter<Node, ElementNode>,
): ReadonlyArray<Node> {
  if (Array.isArray(elements))
    return adapter.removeSubsets(elements)
  return adapter.getChildren(elements as unknown as ElementNode) as Node[]
}
