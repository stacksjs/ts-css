/**
 * Attribute-selector matchers. One factory per `AttributeAction` returning
 * a predicate over the consumer's element type (via the adapter).
 */

import type { AttributeSelectorNode } from '../what'
import type { Adapter, CompiledQuery, Options } from './types'

type Predicate<E> = (e: E) => boolean

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function caseInsensitive(value: string, attr: AttributeSelectorNode, options: Options<unknown, any>): boolean {
  if (attr.ignoreCase === true)
    return true
  if (attr.ignoreCase === false)
    return false
  if (attr.ignoreCase === 'quirks')
    return !options.xmlMode
  return false
}

export function compileAttribute<Node, ElementNode extends Node>(
  selector: AttributeSelectorNode,
  options: Options<Node, ElementNode>,
  next: CompiledQuery<ElementNode>,
): CompiledQuery<ElementNode> {
  const adapter = options.adapter
  const action = selector.action
  const name = selector.name
  let value = selector.value
  const ci = caseInsensitive(value, selector, options as any)
  if (ci)
    value = value.toLowerCase()
  return wrap(action, name, value, ci, adapter, next)
}

function wrap<Node, ElementNode extends Node>(
  action: string,
  name: string,
  value: string,
  ci: boolean,
  adapter: Adapter<Node, ElementNode>,
  next: CompiledQuery<ElementNode>,
): CompiledQuery<ElementNode> {
  switch (action) {
    case 'exists':
      return e => adapter.hasAttrib(e, name) && next(e)

    case 'equals':
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return (ci ? v.toLowerCase() : v) === value && next(e)
      }

    case 'not':
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return next(e)
        return (ci ? v.toLowerCase() : v) !== value && next(e)
      }

    case 'start':
      if (value === '')
        return () => false
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return (ci ? v.toLowerCase() : v).startsWith(value) && next(e)
      }

    case 'end':
      if (value === '')
        return () => false
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return (ci ? v.toLowerCase() : v).endsWith(value) && next(e)
      }

    case 'any': {
      if (value === '')
        return () => false
      const re = new RegExp(escapeRegExp(value), ci ? 'i' : '')
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return re.test(v) && next(e)
      }
    }

    case 'element': {
      // ~= "value" — matches when whitespace-separated list contains value
      if (value === '' || /\s/.test(value))
        return () => false
      const wsRe = new RegExp(`(?:^|\\s)${escapeRegExp(value)}(?:$|\\s)`, ci ? 'i' : '')
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return wsRe.test(v) && next(e)
      }
    }

    case 'hyphen':
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        const lower = ci ? v.toLowerCase() : v
        if (lower === value)
          return next(e)
        if (lower.startsWith(value) && lower.charAt(value.length) === '-')
          return next(e)
        return false
      }
  }
  return _ => { void _; return false }
}

export type { Predicate }
