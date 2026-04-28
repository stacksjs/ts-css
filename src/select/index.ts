/**
 * Public surface — drop-in compatible with css-select v5.
 *
 *   selectAll(selector, root, options) → ElementNode[]
 *   selectOne(selector, root, options) → ElementNode | null
 *   is(node, selector, options)         → boolean
 *   compile(selector, options)          → CompiledQuery
 *
 * Compiled-selector cache: the same selector string compiled with the
 * same adapter + options is reused. Disable with `cacheResults: false`.
 */

import type { Selector } from '../what'
import type { Adapter, CompiledQuery, Options } from './types'
import { parse } from '../what'
import { compileGeneric, parseAndCompile } from './pseudo-selectors/selectors'

function getAdapter<Node, ElementNode extends Node>(options: Options<Node, ElementNode>): Adapter<Node, ElementNode> {
  if (!options || !options.adapter)
    throw new Error('css-select: adapter is required')
  return options.adapter
}

// ----- compiled-selector cache -----
// Keyed by Adapter (object identity) so different trees can't poison each
// other's cache. The inner key is a deterministic string capturing the
// selector + the options that affect compile output.
const adapterCaches = new WeakMap<object, Map<string, CompiledQuery<any>>>()

function cacheKey(selector: string, options: Options<any, any>): string {
  // Only options that change compile output need to be in the key.
  return `${options.xmlMode ? '1' : '0'}|${options.lowerCaseAttributeNames === false ? '0' : '1'}|${options.lowerCaseTags === false ? '0' : '1'}|${selector}`
}

function getCache(adapter: object): Map<string, CompiledQuery<any>> {
  let cache = adapterCaches.get(adapter)
  if (!cache) {
    cache = new Map()
    adapterCaches.set(adapter, cache)
  }
  return cache
}

function compileSelectorString<Node, ElementNode extends Node>(
  selector: string,
  options: Options<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  const ast = parse(selector, {
    xmlMode: options.xmlMode,
    lowerCaseAttributeNames: options.lowerCaseAttributeNames,
    lowerCaseTags: options.lowerCaseTags,
  })
  return compileGeneric(ast, options)
}

export function compile<Node, ElementNode extends Node>(
  selector: string | Selector[][],
  options: Options<Node, ElementNode>,
): CompiledQuery<ElementNode> {
  if (typeof selector !== 'string')
    return compileGeneric(selector, options)

  // Fast path: use the per-adapter cache unless the consumer opted out.
  if (options.cacheResults === false || !options.adapter)
    return compileSelectorString(selector, options)

  const cache = getCache(options.adapter as unknown as object)
  const key = cacheKey(selector, options)
  let compiled = cache.get(key)
  if (compiled !== undefined)
    return compiled as CompiledQuery<ElementNode>
  compiled = compileSelectorString(selector, options)
  cache.set(key, compiled)
  return compiled as CompiledQuery<ElementNode>
}

/** Drop the cached compile of `selector` for `adapter`, or all entries
 *  if `selector` is omitted. */
export function clearSelectorCache(adapter: object, selector?: string): void {
  if (selector === undefined) {
    adapterCaches.delete(adapter)
    return
  }
  const cache = adapterCaches.get(adapter)
  if (!cache)
    return
  for (const key of cache.keys()) {
    if (key.endsWith(`|${selector}`))
      cache.delete(key)
  }
}

export function selectAll<Node, ElementNode extends Node>(
  selector: string | Selector[][] | CompiledQuery<ElementNode>,
  root: Node | Node[],
  options: Options<Node, ElementNode>,
): ElementNode[] {
  const adapter = getAdapter(options)
  const test = typeof selector === 'function' ? selector : compile(selector, options)
  const elems = Array.isArray(root) ? root : [root]
  return adapter.findAll(test, elems)
}

export function selectOne<Node, ElementNode extends Node>(
  selector: string | Selector[][] | CompiledQuery<ElementNode>,
  root: Node | Node[],
  options: Options<Node, ElementNode>,
): ElementNode | null {
  const adapter = getAdapter(options)
  const test = typeof selector === 'function' ? selector : compile(selector, options)
  const elems = Array.isArray(root) ? root : [root]
  return adapter.findOne(test, elems)
}

export function is<Node, ElementNode extends Node>(
  node: ElementNode,
  selector: string | Selector[][] | CompiledQuery<ElementNode>,
  options: Options<Node, ElementNode>,
): boolean {
  const test = typeof selector === 'function' ? selector : compile(selector, options)
  return test(node)
}

export type {
  Adapter,
  CompiledQuery,
  Options,
  Predicate,
} from './types'

// expose internals for advanced use
export { parseAndCompile }
