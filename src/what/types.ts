/**
 * Selector AST mirroring css-what v6 — the segment-list-of-lists shape
 * `parse(selector)` returns. Compatible with css-select consumers.
 */

export type SelectorType
  = | 'attribute'
    | 'pseudo'
    | 'pseudo-element'
    | 'tag'
    | 'universal'
    | 'adjacent'
    | 'child'
    | 'descendant'
    | 'parent'
    | 'sibling'
    | 'column-combinator'

export type AttributeAction
  = | 'any'
    | 'element'
    | 'end'
    | 'equals'
    | 'exists'
    | 'hyphen'
    | 'not'
    | 'start'

export const IgnoreCaseMode: Readonly<Record<string, true | false | 'quirks' | null>> = {
  Unknown: null,
  QuirksMode: 'quirks',
  IgnoreCase: true,
  CaseSensitive: false,
} as const

export type IgnoreCase = boolean | 'quirks' | null

export interface AttributeSelectorNode {
  type: 'attribute'
  name: string
  action: AttributeAction
  value: string
  namespace: string | null
  ignoreCase: IgnoreCase
}

export interface TagSelectorNode {
  type: 'tag'
  name: string
  namespace: string | null
}

export interface UniversalSelectorNode {
  type: 'universal'
  namespace: string | null
}

export interface PseudoSelectorNode {
  type: 'pseudo'
  name: string
  data: string | Selector[][] | null
}

export interface PseudoElementNode {
  type: 'pseudo-element'
  name: string
  data: string | null
}

export interface TraversalNode {
  type: 'adjacent' | 'child' | 'descendant' | 'parent' | 'sibling' | 'column-combinator'
}

export type Selector
  = | AttributeSelectorNode
    | TagSelectorNode
    | UniversalSelectorNode
    | PseudoSelectorNode
    | PseudoElementNode
    | TraversalNode

export interface ParseOptions {
  /**
   * When true, attribute names retain their original case.
   * css-what default mirrors HTML quirks-mode where attributes are
   * case-insensitive unless explicitly flagged.
   */
  xmlMode?: boolean
  /** Lowercase attribute names. */
  lowerCaseAttributeNames?: boolean
  /** Lowercase tag names. */
  lowerCaseTags?: boolean
}
