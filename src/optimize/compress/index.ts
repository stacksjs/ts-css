/**
 * Run all compressors over the AST in place.
 *
 * Identifier ↔ Hash conversions happen only when the surrounding
 * declaration's property is known to accept a color (so `font-family: red`
 * isn't treated as a color, and `color: red` is). The list+item args
 * from the walker callback let us swap nodes in place without rebuilding
 * the parent list.
 */

import type { CssNode, HashNode, Identifier } from '../../parse'
import { walk } from '../../parse'
import { colorNameToHex, hexToShortName, shortenHex } from './color'
import { compressDimension, compressNumber, compressPercentage } from './number'
import { compressUrl } from './url'

const COLOR_PROPERTIES: ReadonlySet<string> = new Set([
  'color',
  'background',
  'background-color',
  'border',
  'border-color',
  'border-top',
  'border-top-color',
  'border-right',
  'border-right-color',
  'border-bottom',
  'border-bottom-color',
  'border-left',
  'border-left-color',
  'border-block',
  'border-block-color',
  'border-block-start-color',
  'border-block-end-color',
  'border-inline',
  'border-inline-color',
  'border-inline-start-color',
  'border-inline-end-color',
  'outline',
  'outline-color',
  'caret-color',
  'fill',
  'stroke',
  'flood-color',
  'lighting-color',
  'stop-color',
  'column-rule',
  'column-rule-color',
  'text-decoration',
  'text-decoration-color',
  'text-emphasis',
  'text-emphasis-color',
  'text-shadow',
  'box-shadow',
  'accent-color',
  'scrollbar-color',
])

export function compressTree(ast: CssNode): void {
  walk(ast, function compressVisitor(node, item, list) {
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
        // Hex normalisation runs unconditionally — `#aabbcc` → `#abc`.
        const newName = shortenHex(`#${node.name}`).slice(1)
        node.name = newName
        // If a shorter named keyword exists for the resulting hex, swap
        // the Hash out for an Identifier (only inside a color property).
        if (item && list && this.declaration && COLOR_PROPERTIES.has(this.declaration.property.toLowerCase())) {
          const short = hexToShortName(`#${newName}`)
          if (short && short.length < newName.length + 1) {
            const ident: Identifier = { type: 'Identifier', name: short, loc: node.loc }
            list.replace(item, list.createItem(ident))
          }
        }
        return
      }
      case 'Identifier': {
        // Named color → short hex when the substitution is *strictly* shorter.
        // `blue` (4) and `#00f` (4) tie — we keep the keyword (more readable
        // and survives gzip the same).
        if (!item || !list || !this.declaration)
          return
        if (!COLOR_PROPERTIES.has(this.declaration.property.toLowerCase()))
          return
        const hex = colorNameToHex(node.name)
        if (hex && hex.length < node.name.length) {
          const hashNode: HashNode = { type: 'Hash', name: hex.slice(1), loc: node.loc }
          list.replace(item, list.createItem(hashNode))
        }
        return
      }
      case 'Url':
        // Generator picks quoting via compressUrl — strip the quotes
        // we'd produce so the round-trip is stable.
        node.value = compressUrl(node.value).replace(/^"|"$/g, '')
        return
    }
  })
}
