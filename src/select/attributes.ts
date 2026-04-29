/**
 * Attribute-selector matchers. One factory per `AttributeAction` returning
 * a predicate over the consumer's element type (via the adapter).
 */

import type { AttributeSelectorNode } from '../what'
import type { Adapter, CompiledQuery, Options } from './types'
import { ALWAYS_TRUE } from './helpers/always-true'

function isWsCode(c: number): boolean {
  return c === 32 || c === 9 || c === 10 || c === 12 || c === 13
}

/**
 * Whitespace-separated token containment — equivalent to the `~=` operator
 * (and the `.class` shorthand), but without the regex compile + RegExp.test
 * overhead of a per-element check.
 */
function containsWsToken(haystack: string, needle: string): boolean {
  const nlen = needle.length
  const hlen = haystack.length
  if (nlen === 0 || nlen > hlen)
    return false
  let idx = haystack.indexOf(needle)
  while (idx >= 0) {
    const before = idx === 0 || isWsCode(haystack.charCodeAt(idx - 1))
    const afterIdx = idx + nlen
    const after = afterIdx === hlen || isWsCode(haystack.charCodeAt(afterIdx))
    if (before && after)
      return true
    idx = haystack.indexOf(needle, idx + 1)
  }
  return false
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
  const isLeaf = next === ALWAYS_TRUE
  switch (action) {
    case 'exists':
      if (isLeaf)
        return e => adapter.hasAttrib(e, name)
      return e => adapter.hasAttrib(e, name) && next(e)

    case 'equals':
      if (!ci) {
        // String equality with `null`/`undefined` already short-circuits to
        // false, so we can skip the explicit null guard — matches
        // css-select's equality fast path.
        if (isLeaf)
          return e => adapter.getAttributeValue(e, name) === value
        return e => adapter.getAttributeValue(e, name) === value && next(e)
      }
      if (isLeaf) {
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return v.toLowerCase() === value
        }
      }
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return v.toLowerCase() === value && next(e)
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
      if (isLeaf) {
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return (ci ? v.toLowerCase() : v).startsWith(value)
        }
      }
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return (ci ? v.toLowerCase() : v).startsWith(value) && next(e)
      }

    case 'end':
      if (value === '')
        return () => false
      if (isLeaf) {
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return (ci ? v.toLowerCase() : v).endsWith(value)
        }
      }
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return (ci ? v.toLowerCase() : v).endsWith(value) && next(e)
      }

    case 'any': {
      if (value === '')
        return () => false
      if (ci) {
        if (isLeaf) {
          return (e) => {
            const v = adapter.getAttributeValue(e, name)
            if (v == null)
              return false
            return v.toLowerCase().indexOf(value) >= 0
          }
        }
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return v.toLowerCase().indexOf(value) >= 0 && next(e)
        }
      }
      if (isLeaf) {
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return v.indexOf(value) >= 0
        }
      }
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return v.indexOf(value) >= 0 && next(e)
      }
    }

    case 'element': {
      if (value === '' || /\s/.test(value))
        return () => false
      if (ci) {
        if (isLeaf) {
          return (e) => {
            const v = adapter.getAttributeValue(e, name)
            if (v == null)
              return false
            return containsWsToken(v.toLowerCase(), value)
          }
        }
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return containsWsToken(v.toLowerCase(), value) && next(e)
        }
      }
      if (isLeaf) {
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          return containsWsToken(v, value)
        }
      }
      return (e) => {
        const v = adapter.getAttributeValue(e, name)
        if (v == null)
          return false
        return containsWsToken(v, value) && next(e)
      }
    }

    case 'hyphen':
      if (isLeaf) {
        return (e) => {
          const v = adapter.getAttributeValue(e, name)
          if (v == null)
            return false
          const lower = ci ? v.toLowerCase() : v
          if (lower === value)
            return true
          if (lower.startsWith(value) && lower.charAt(value.length) === '-')
            return true
          return false
        }
      }
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

