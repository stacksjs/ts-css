/**
 * Deep clone a CSS AST node. List children are cloned via list iteration
 * so the result is structurally independent from the input.
 */

import type { CssNode } from './types'
import { CssList } from './list'

export function clone<T extends CssNode>(node: T): T {
  return cloneAny(node) as T
}

function cloneAny(value: any): any {
  if (value === null || typeof value !== 'object')
    return value
  if (value instanceof CssList) {
    const out = new CssList<any>()
    for (const child of value)
      out.appendData(cloneAny(child))
    return out
  }
  if (Array.isArray(value))
    return value.map(cloneAny)
  // typed AST node
  if ('type' in value && typeof value.type === 'string') {
    const out: Record<string, any> = { type: value.type }
    for (const k of Object.keys(value)) {
      if (k === 'type')
        continue
      out[k] = cloneAny(value[k])
    }
    return out
  }
  // plain object
  const out: Record<string, any> = {}
  for (const k of Object.keys(value))
    out[k] = cloneAny(value[k])
  return out
}
