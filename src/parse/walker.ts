/**
 * Tree-walker for the CSS AST. Mirrors css-tree's `walk(ast, callback)` and
 * `walk(ast, { visit, enter, leave })` shapes — including the `walk.skip`
 * sentinel and the `this.atrule` / `this.rule` context exposed inside
 * callbacks.
 */

import type { Atrule, CssNode, Declaration, Rule } from './types'
import { CssList, type ListItem } from './list'

const SKIP: symbol = Symbol('walkSkip')
const STOP: symbol = Symbol('walkStop')

export interface WalkContext {
  root: CssNode
  stylesheet: CssNode | null
  atrule: Atrule | null
  atrulePrelude: CssNode | null
  rule: Rule | null
  selector: CssNode | null
  block: CssNode | null
  declaration: Declaration | null
  function: CssNode | null
}

export type WalkVisit = CssNode['type']

// Narrow CssNode by its `type` discriminant — used to type the
// `visit: 'Rule'` filter so consumer callbacks receive a `Rule`, not the
// full union.
export type CssNodeOfType<T extends WalkVisit> = Extract<CssNode, { type: T }>

// eslint-disable-next-line pickier/no-unused-vars
type VisitorCallback<N> = (this: WalkContext, node: N, item: ListItem<CssNode> | null, list: CssList<CssNode> | null) => void | symbol

/**
 * Object-form visitor. The `T extends WalkVisit` generic is inferred from
 * the literal value of `visit`, so writing
 *
 *     walk(ast, { visit: 'Rule', enter(node) { … } })
 *
 * narrows `node` to `Rule`. Without `visit`, callbacks receive the full
 * `CssNode` union as `enter`/`leave` arguments.
 */
export interface WalkVisitorObject<T extends WalkVisit | undefined = undefined> {
  visit?: T
  reverse?: boolean
  enter?: VisitorCallback<T extends WalkVisit ? CssNodeOfType<T> : CssNode>
  leave?: VisitorCallback<T extends WalkVisit ? CssNodeOfType<T> : CssNode>
}

/** Plain-function visitor — runs against every node. */
export type WalkVisitorFunction = VisitorCallback<CssNode>

export type WalkVisitor = WalkVisitorFunction | WalkVisitorObject<WalkVisit | undefined>

function newContext(root: CssNode): WalkContext {
  return {
    root,
    stylesheet: null,
    atrule: null,
    atrulePrelude: null,
    rule: null,
    selector: null,
    block: null,
    declaration: null,
    function: null,
  }
}

/**
 * Walk every node of `root`, calling `visitor` (or visitor.enter / .leave).
 * Returns:
 *   - undefined when traversal completes,
 *   - the SKIP / STOP sentinel propagated from a visitor.
 *
 * `walk.skip` / `walk.stop` are exposed as static-symbol sentinels.
 */
export interface WalkFn {
  // 1. visitor function — every node (no narrowing)
  // eslint-disable-next-line pickier/no-unused-vars
  (root: CssNode, visitor: WalkVisitorFunction): symbol | undefined
  // 2. visitor object with `visit: '<NodeType>'` — narrowed callbacks
  // eslint-disable-next-line pickier/no-unused-vars
  <T extends WalkVisit>(root: CssNode, visitor: WalkVisitorObject<T>): symbol | undefined
  skip: symbol
  stop: symbol
}

function walkImpl(root: CssNode, visitor: WalkVisitor): symbol | undefined {
  const ctx = newContext(root)
  const enter = typeof visitor === 'function' ? visitor : visitor.enter
  const leave = typeof visitor === 'function' ? null : (visitor.leave ?? null)
  const filter = typeof visitor === 'function' ? null : (visitor.visit ?? null)
  const reverse = typeof visitor === 'function' ? false : (visitor.reverse ?? false)

  function visitNode(node: CssNode, item: ListItem<CssNode> | null, list: CssList<CssNode> | null): symbol | undefined {
    let pushed: keyof WalkContext | null = null
    let prev: any
    switch (node.type) {
      case 'StyleSheet':
        pushed = 'stylesheet'
        prev = ctx.stylesheet
        ctx.stylesheet = node
        break
      case 'Atrule':
        pushed = 'atrule'
        prev = ctx.atrule
        ctx.atrule = node
        break
      case 'AtrulePrelude':
        pushed = 'atrulePrelude'
        prev = ctx.atrulePrelude
        ctx.atrulePrelude = node
        break
      case 'Rule':
        pushed = 'rule'
        prev = ctx.rule
        ctx.rule = node
        break
      case 'Selector':
        pushed = 'selector'
        prev = ctx.selector
        ctx.selector = node
        break
      case 'Block':
        pushed = 'block'
        prev = ctx.block
        ctx.block = node
        break
      case 'Declaration':
        pushed = 'declaration'
        prev = ctx.declaration
        ctx.declaration = node
        break
      case 'Function':
        pushed = 'function'
        prev = ctx.function
        ctx.function = node
        break
    }

    let result: symbol | undefined
    if ((filter === null || filter === node.type) && enter) {
      const r = enter.call(ctx, node, item, list)
      if (r === SKIP) {
        if (pushed) (ctx as any)[pushed] = prev
        return undefined
      }
      if (r === STOP) {
        if (pushed) (ctx as any)[pushed] = prev
        return STOP
      }
    }

    // descend
    result = walkChildren(node, reverse, visitNode)
    if (result === STOP) {
      if (pushed) (ctx as any)[pushed] = prev
      return STOP
    }

    if ((filter === null || filter === node.type) && leave) {
      const r = leave.call(ctx, node, item, list)
      if (r === STOP) {
        if (pushed) (ctx as any)[pushed] = prev
        return STOP
      }
    }
    if (pushed) (ctx as any)[pushed] = prev
    return undefined
  }

  return visitNode(root, null, null)
}

export const walk: WalkFn = Object.assign(walkImpl, { skip: SKIP, stop: STOP }) as WalkFn

export const walkSkip: symbol = SKIP
export const walkStop: symbol = STOP

function walkChildren(
  node: CssNode,
  reverse: boolean,
  visitNode: (n: CssNode, item: ListItem<CssNode> | null, list: CssList<CssNode> | null) => symbol | undefined,
): symbol | undefined {
  // Composite children
  if ('children' in node && node.children instanceof CssList) {
    return walkList(node.children, reverse, visitNode)
  }
  // Rule prelude/block
  if (node.type === 'Rule') {
    const r1 = visitNode(node.prelude as CssNode, null, null)
    if (r1 === STOP) return STOP
    const r2 = visitNode(node.block as CssNode, null, null)
    if (r2 === STOP) return STOP
    return undefined
  }
  if (node.type === 'Atrule') {
    if (node.prelude) {
      const r = visitNode(node.prelude, null, null)
      if (r === STOP) return STOP
    }
    if (node.block) {
      const r = visitNode(node.block, null, null)
      if (r === STOP) return STOP
    }
    return undefined
  }
  if (node.type === 'Declaration') {
    return visitNode(node.value as CssNode, null, null)
  }
  if (node.type === 'AttributeSelector') {
    const r = visitNode(node.name, null, null)
    if (r === STOP) return STOP
    if (node.value)
      return visitNode(node.value, null, null)
    return undefined
  }
  return undefined
}

function walkList(
  list: CssList<CssNode>,
  reverse: boolean,
  visitNode: (n: CssNode, item: ListItem<CssNode> | null, list: CssList<CssNode> | null) => symbol | undefined,
): symbol | undefined {
  // The list's `forEach` callback already receives the current `ListItem`
  // as its second argument — passing it straight to `visitNode` avoids the
  // O(N) `findItem` linear scan per child that the previous implementation
  // performed (turning every walk into O(N²)).
  let stopped: symbol | undefined
  if (reverse) {
    list.forEachRight((data, item, l) => {
      if (stopped)
        return
      const r = visitNode(data, item, l)
      if (r === STOP)
        stopped = STOP
    })
  }
  else {
    list.forEach((data, item, l) => {
      if (stopped)
        return
      const r = visitNode(data, item, l)
      if (r === STOP)
        stopped = STOP
    })
  }
  return stopped
}
