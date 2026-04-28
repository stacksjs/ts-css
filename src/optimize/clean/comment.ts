/**
 * Strip CSS comments (except `/*!*\/` license-style comments by default).
 */

import type { CssNode } from '../../parse'
import { walk } from '../../parse'

export function removeComments(ast: CssNode, options: { exclamation?: boolean | 'first-exclamation' } = {}): void {
  const exclamation = options.exclamation ?? false
  let firstSeen = false
  walk(ast, (node, item, list) => {
    if (node.type !== 'Comment')
      return
    const isExclamation = node.value.startsWith('!')
    if (exclamation === true && isExclamation)
      return
    if (exclamation === 'first-exclamation' && isExclamation && !firstSeen) {
      firstSeen = true
      return
    }
    if (item && list)
      list.remove(item)
  })
}
