/**
 * Within a declaration list, drop duplicates earlier in the list when the
 * later occurrence has equal or higher importance. Preserves the LAST
 * occurrence per property.
 */

import type { CssNode, Declaration } from '../../parse'
import { generate, walk } from '../../parse'

export function dedupeDeclarations(ast: CssNode): void {
  walk(ast, (node) => {
    if (node.type !== 'Block' && node.type !== 'DeclarationList')
      return
    const seen = new Map<string, { item: any, list: any, decl: Declaration }>()
    const toRemove: Array<{ item: any, list: any }> = []
    // Walk children to record last-seen per property+important.
    if (!('children' in node) || !node.children)
      return
    let item = (node.children as any).head
    while (item) {
      const data = item.data as CssNode
      if (data.type === 'Declaration') {
        const key = data.property
        const prev = seen.get(key)
        if (prev) {
          const prevImp = !!prev.decl.important
          const curImp = !!data.important
          if (curImp || prevImp === curImp) {
            // current wins → mark previous for removal
            toRemove.push({ item: prev.item, list: node.children })
            seen.set(key, { item, list: node.children, decl: data })
          }
          else {
            // previous important > current
            toRemove.push({ item, list: node.children })
          }
        }
        else {
          seen.set(key, { item, list: node.children, decl: data })
        }
      }
      item = item.next
    }
    for (const { item: it, list } of toRemove)
      (list as any).remove(it)
  })
  void generate
}
