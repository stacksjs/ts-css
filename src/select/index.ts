/**
 * Public surface — drop-in compatible with css-select v5.
 *
 *   selectAll(selector, root, options) → ElementNode[]
 *   selectOne(selector, root, options) → ElementNode | null
 *   is(node, selector, options)         → boolean
 *   compile(selector, options)          → CompiledQuery
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
  if (typeof selector === 'string')
    return compileSelectorString(selector, options)
  return compileGeneric(selector, options)
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
