/**
 * Run all compressors over the AST in place.
 */

import type { CssNode } from '../../parse'
import { walk } from '../../parse'
import { colorNameToHex, hexToShortName, shortenHex } from './color'
import { compressDimension, compressNumber, compressPercentage } from './number'
import { compressString } from './string'
import { compressUrl } from './url'

export function compressTree(ast: CssNode): void {
  walk(ast, (node) => {
    switch (node.type) {
      case 'Number':
        node.value = compressNumber(node.value)
        return
      case 'Percentage':
        node.value = compressPercentage(node.value)
        return
      case 'Dimension': {
        const c = compressDimension(node.value, node.unit)
        node.value = c.value
        node.unit = c.unit
        return
      }
      case 'Hash': {
        const newName = shortenHex(`#${node.name}`).slice(1)
        node.name = newName
        const short = hexToShortName(`#${newName}`)
        if (short) {
          // Replace this Hash by an Identifier in caller-managed list — done
          // by a follow-up pass; here we just leave the shortened hex.
          void short
        }
        return
      }
      case 'Identifier': {
        // Color name → hex (when shorter)
        const hex = colorNameToHex(node.name)
        if (hex && hex.length < node.name.length) {
          // Replace identifier with a shortened hex by mutating in place is
          // not possible (Identifier vs Hash differ in shape) — leave alone
          // unless we're in a property where colors are expected. The csso
          // library does this with full property/value type knowledge; we
          // settle for the safer hex→name reverse direction.
          void hex
        }
        return
      }
      case 'String':
        node.value = node.value
        // re-rendered by generator using its own quoting
        return
      case 'Url':
        node.value = node.value
        // generator already picks quoting via compressUrl shape — re-call:
        node.value = compressUrl(node.value).replace(/^"|"$/g, '')
        return
    }
  })
}
