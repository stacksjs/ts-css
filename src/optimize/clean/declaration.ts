/**
 * Within a declaration list, drop duplicates earlier in the list when the
 * later occurrence has equal or higher importance. Preserves the LAST
 * occurrence per property.
 */

import type { CssNode, Declaration } from '../../parse'
import { walk } from '../../parse'

export function dedupeDeclarations(ast: CssNode): void {
  walk(ast, (node) => {
    if (node.type !== 'Block' && node.type !== 'DeclarationList')
      return
    if (!('children' in node) || !node.children)
      return
    const list = node.children as any
    // Quick check: at least one Declaration AND a possibly-duplicating
    // sibling. Single-decl (or no-decl) blocks are the common case for
    // nested rules and skipping the Map allocation here is measurable.
    let head = list.head
    if (head == null || head.next == null)
      return
    // Pessimistic-but-cheap pre-scan that also confirms ≥2 declarations.
    let declCount = 0
    for (let it = head; it != null; it = it.next) {
      if ((it.data as CssNode).type === 'Declaration') {
        declCount++
        if (declCount >= 2)
          break
      }
    }
    if (declCount < 2)
      return

    const seen = new Map<string, { item: any, decl: Declaration }>()
    const toRemove: any[] = []
    for (let item = head; item != null; item = item.next) {
      const data = item.data as CssNode
      if (data.type !== 'Declaration')
        continue
      const key = data.property
      const prev = seen.get(key)
      if (prev) {
        const prevImp = !!prev.decl.important
        const curImp = !!data.important
        if (curImp || prevImp === curImp) {
          toRemove.push(prev.item)
          seen.set(key, { item, decl: data })
        }
        else {
          toRemove.push(item)
        }
      }
      else {
        seen.set(key, { item, decl: data })
      }
    }
    for (const it of toRemove)
      list.remove(it)
  })
}
