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
import { findAll as ourFindAll, findOne as ourFindOne, prepareContext } from './helpers/querying'
import { compileGeneric, parseAndCompile } from './pseudo-selectors/selectors'

function getAdapter<Node, ElementNode extends Node>(options: Options<Node, ElementNode>): Adapter<Node, ElementNode> {
  if (!options || !options.adapter)
    throw new Error('css-select: adapter is required')
  return options.adapter
}

// ----- compiled-selector cache -----
// Two-level lookup: outer keyed by Adapter (object identity), inner keyed
// by a 3-bit flag-signature integer encoding the options that change
// compile output. The innermost map is keyed by selector text. This avoids
// the per-call `${flags}|${selector}` string concat the previous
// single-level cache did — meaningful when consumers call selectAll in a
// hot loop.
const adapterCaches = new WeakMap<object, (Map<string, CompiledQuery<any>> | undefined)[]>()

function flagSig(options: Options<any, any>): number {
  return ((options.xmlMode ? 1 : 0) << 0)
    | ((options.lowerCaseAttributeNames === false ? 1 : 0) << 1)
    | ((options.lowerCaseTags === false ? 1 : 0) << 2)
}

function getCache(adapter: object, sig: number): Map<string, CompiledQuery<any>> {
  let bucket = adapterCaches.get(adapter)
  if (!bucket) {
    bucket = []
    adapterCaches.set(adapter, bucket)
  }
  let m = bucket[sig]
  if (!m) {
    m = new Map()
    bucket[sig] = m
  }
  return m
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

  const cache = getCache(options.adapter as unknown as object, flagSig(options))
  let compiled = cache.get(selector)
  if (compiled !== undefined)
    return compiled as CompiledQuery<ElementNode>
  compiled = compileSelectorString(selector, options)
  cache.set(selector, compiled)
  return compiled as CompiledQuery<ElementNode>
}

/** Drop the cached compile of `selector` for `adapter`, or all entries
 *  if `selector` is omitted. */
export function clearSelectorCache(adapter: object, selector?: string): void {
  if (selector === undefined) {
    adapterCaches.delete(adapter)
    return
  }
  const bucket = adapterCaches.get(adapter)
  if (!bucket)
    return
  for (const m of bucket) {
    if (m)
      m.delete(selector)
  }
}

export function selectAll<Node, ElementNode extends Node>(
  selector: string | Selector[][] | CompiledQuery<ElementNode>,
  root: Node | Node[],
  options: Options<Node, ElementNode>,
): ElementNode[] {
  const adapter = getAdapter(options)
  const test = typeof selector === 'function' ? selector : compile(selector, options)
  const ctx = prepareContext(root, adapter)
  return ourFindAll(test, ctx, adapter, options.xmlMode === true)
}

export function selectOne<Node, ElementNode extends Node>(
  selector: string | Selector[][] | CompiledQuery<ElementNode>,
  root: Node | Node[],
  options: Options<Node, ElementNode>,
): ElementNode | null {
  const adapter = getAdapter(options)
  const test = typeof selector === 'function' ? selector : compile(selector, options)
  const ctx = prepareContext(root, adapter)
  return ourFindOne(test, ctx, adapter, options.xmlMode === true)
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
