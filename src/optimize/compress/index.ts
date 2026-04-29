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
import { generate, walk } from '../../parse'
import { colorNameToHex, compressRgbToHex, hexToShortName, shortenHex } from './color'
import { compressDimension, compressNumber, compressPercentage, roundNumberString } from './number'

export interface CompressOptions {
  /** Round numeric values to this many decimal places. `null` = no rounding. */
  floatPrecision?: number | null
}

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

/**
 * Drop redundant WhiteSpace nodes from a `Parentheses` / `Function` /
 * `Value` container — adjacent to `:` `,` `/` operators and at the
 * boundaries. Run inline as a `leave` callback so the compressor only
 * traverses the AST once instead of twice.
 *
 * Whitespace around `+` and `-` is preserved: in `calc()` (and friends)
 * the spec requires whitespace on both sides of those operators, and a
 * compactor that strips it produces unparseable output (e.g.
 * `calc(100%-1rem)` parses as two adjacent dimensions, not a subtraction).
 */
function isCompactableOperator(node: any): boolean {
  if (!node || node.type !== 'Operator')
    return false
  const v = node.value
  return v === ':' || v === ',' || v === '/'
}

function compactContainerWhitespace(node: { children: any }): void {
  const list = node.children as any
  if (!list)
    return
  // 1. trim leading
  while (list.head && list.head.data.type === 'WhiteSpace')
    list.remove(list.head)
  // 2. trim trailing
  while (list.tail && list.tail.data.type === 'WhiteSpace')
    list.remove(list.tail)
  // 3. drop WhiteSpace adjacent to `: , /` operators only.
  let cur = list.head
  while (cur) {
    const nxt = cur.next
    if (cur.data.type === 'WhiteSpace') {
      const prevIsOp = cur.prev && isCompactableOperator(cur.prev.data)
      const nextIsOp = nxt && isCompactableOperator(nxt.data)
      if (prevIsOp || nextIsOp)
        list.remove(cur)
    }
    cur = nxt
  }
}

export function compressTree(ast: CssNode, options: CompressOptions = {}): void {
  const fp = options.floatPrecision ?? null
  const round = fp === null ? null : (s: string) => roundNumberString(s, fp)
  walk(ast, {
    enter(node, item, list) {
      switch (node.type) {
        case 'Number': {
          const v = round ? round(node.value) : node.value
          node.value = compressNumber(v)
          return
        }
        case 'Percentage': {
          const v = round ? round(node.value) : node.value
          node.value = compressPercentage(v)
          return
        }
        case 'Dimension': {
          const v = round ? round(node.value) : node.value
          const c = compressDimension(v, node.unit)
          node.value = c.value
          node.unit = c.unit
          return
        }
        case 'Hash': {
          const newName = shortenHex(`#${node.name}`).slice(1)
          node.name = newName
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
          // Generator decides whether to quote based on the value's chars
          // (`/[\s"'()\\]/`). Storing a normalized inner string here is a
          // no-op pass — the previous double-trip through `compressUrl`
          // followed by `.replace(/^"|"$/g, '')` was equivalent to leaving
          // the value alone. Kept the case branch for future shrinkers
          // (e.g. dropping a leading `./`).
          return
        case 'Function': {
          // `rgb(...)` / `rgba(...)` → `#rrggbb` (or `#rgb`) when the alpha
          // is opaque. We let the walker process the children first (so any
          // contained Number/Percentage was already shortened) and then
          // replace the whole Function with a Hash on `leave`. Mark the
          // node so the leave handler knows to do the substitution.
          const lname = node.name.toLowerCase()
          if ((lname === 'rgb' || lname === 'rgba') && item && list)
            (node as any).__rgbReplaceCandidate = true
        }
      }
    },
    leave(node, item, list) {
      if (node.type === 'Parentheses' || node.type === 'Function' || node.type === 'Value')
        compactContainerWhitespace(node as any)
      if (node.type === 'Function' && (node as any).__rgbReplaceCandidate && item && list) {
        // Re-stringify the function with its (now-compressed) children and
        // run the rgb→hex compressor. If the result is a `#rrggbb` token,
        // splice it in as a Hash so further passes can shorten it more
        // and the property-aware Identifier swap can apply.
        const text = generate(node as CssNode)
        const replacement = compressRgbToHex(text)
        if (replacement !== text && replacement.startsWith('#')) {
          const hashNode: HashNode = { type: 'Hash', name: replacement.slice(1), loc: node.loc }
          list.replace(item, list.createItem(hashNode))
        }
      }
    },
  })
}
