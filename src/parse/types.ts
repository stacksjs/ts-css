/**
 * AST node types for the CSS parser.
 *
 * Mirrors the css-tree v3 node taxonomy so existing consumers (CSSO,
 * SVGO-style optimisers, etc.) can swap to ts-css without touching their
 * walker callbacks. Node shapes are intentionally narrow — we don't
 * model spec-aware lexer types (no `<color>` / `<length>` validation),
 * because the SVGO/csso pipelines that we target don't use them.
 */

import type { CssList } from './list'

export type CssNodeType
  = | 'AnPlusB'
    | 'Atrule'
    | 'AtrulePrelude'
    | 'AttributeSelector'
    | 'Block'
    | 'Brackets'
    | 'CDC'
    | 'CDO'
    | 'ClassSelector'
    | 'Combinator'
    | 'Comment'
    | 'Declaration'
    | 'DeclarationList'
    | 'Dimension'
    | 'Function'
    | 'Hash'
    | 'IdSelector'
    | 'Identifier'
    | 'MediaFeature'
    | 'MediaQuery'
    | 'MediaQueryList'
    | 'NestingSelector'
    | 'Nth'
    | 'Number'
    | 'Operator'
    | 'Parentheses'
    | 'Percentage'
    | 'PseudoClassSelector'
    | 'PseudoElementSelector'
    | 'Ratio'
    | 'Raw'
    | 'Rule'
    | 'Selector'
    | 'SelectorList'
    | 'StyleSheet'
    | 'TypeSelector'
    | 'UnicodeRange'
    | 'Url'
    | 'Value'
    | 'WhiteSpace'
    | 'String'

export interface BaseNode {
  type: CssNodeType
  loc?: CssLocation | null
}

export interface CssLocation {
  source: string
  start: { offset: number, line: number, column: number }
  end: { offset: number, line: number, column: number }
}

// ----- Containers -----

export interface StyleSheet extends BaseNode {
  type: 'StyleSheet'
  children: CssList<CssNode>
}

export interface Rule extends BaseNode {
  type: 'Rule'
  prelude: SelectorList | Raw
  block: Block
}

export interface Atrule extends BaseNode {
  type: 'Atrule'
  name: string
  prelude: AtrulePrelude | Raw | null
  block: Block | null
}

export interface AtrulePrelude extends BaseNode {
  type: 'AtrulePrelude'
  children: CssList<CssNode>
}

export interface Block extends BaseNode {
  type: 'Block'
  children: CssList<CssNode>
}

// ----- Declarations -----

export interface Declaration extends BaseNode {
  type: 'Declaration'
  /**
   * `true` when the declaration ends with `!important`. The string-form
   * (e.g. `'!ie'` for IE-prefix hacks) is occasionally produced by other
   * libraries, so the type stays permissive — but ts-css's parser always
   * sets `boolean`.
   */
  important: boolean | string
  property: string
  value: Value | Raw
}

export interface DeclarationList extends BaseNode {
  type: 'DeclarationList'
  children: CssList<CssNode>
}

export interface Value extends BaseNode {
  type: 'Value'
  children: CssList<CssNode>
}

// ----- Selectors -----

export interface SelectorList extends BaseNode {
  type: 'SelectorList'
  children: CssList<CssNode>
}

export interface Selector extends BaseNode {
  type: 'Selector'
  children: CssList<CssNode>
}

export interface TypeSelector extends BaseNode {
  type: 'TypeSelector'
  name: string
}

export interface IdSelector extends BaseNode {
  type: 'IdSelector'
  name: string
}

export interface ClassSelector extends BaseNode {
  type: 'ClassSelector'
  name: string
}

export interface AttributeSelector extends BaseNode {
  type: 'AttributeSelector'
  name: Identifier
  matcher: string | null
  value: StringNode | Identifier | null
  flags: string | null
}

export interface PseudoClassSelector extends BaseNode {
  type: 'PseudoClassSelector'
  name: string
  children: CssList<CssNode> | null
}

export interface PseudoElementSelector extends BaseNode {
  type: 'PseudoElementSelector'
  name: string
  children: CssList<CssNode> | null
}

export interface Combinator extends BaseNode {
  type: 'Combinator'
  name: string
}

export interface NestingSelector extends BaseNode {
  type: 'NestingSelector'
}

// ----- Atomic values -----

export interface Identifier extends BaseNode {
  type: 'Identifier'
  name: string
}

export interface NumberNode extends BaseNode {
  type: 'Number'
  value: string
}

export interface PercentageNode extends BaseNode {
  type: 'Percentage'
  value: string
}

export interface DimensionNode extends BaseNode {
  type: 'Dimension'
  value: string
  unit: string
}

export interface StringNode extends BaseNode {
  type: 'String'
  value: string
}

export interface UrlNode extends BaseNode {
  type: 'Url'
  value: string
}

export interface HashNode extends BaseNode {
  type: 'Hash'
  name: string
}

export interface OperatorNode extends BaseNode {
  type: 'Operator'
  value: string
}

export interface FunctionNode extends BaseNode {
  type: 'Function'
  name: string
  children: CssList<CssNode>
}

export interface ParenthesesNode extends BaseNode {
  type: 'Parentheses'
  children: CssList<CssNode>
}

export interface BracketsNode extends BaseNode {
  type: 'Brackets'
  children: CssList<CssNode>
}

export interface RawNode extends BaseNode {
  type: 'Raw'
  value: string
}

export interface CommentNode extends BaseNode {
  type: 'Comment'
  value: string
}

export interface WhiteSpaceNode extends BaseNode {
  type: 'WhiteSpace'
  value: string
}

export interface CDONode extends BaseNode { type: 'CDO' }
export interface CDCNode extends BaseNode { type: 'CDC' }

export interface NthNode extends BaseNode {
  type: 'Nth'
  nth: AnPlusBNode | Identifier
  selector: SelectorList | null
}

export interface AnPlusBNode extends BaseNode {
  type: 'AnPlusB'
  a: string | null
  b: string | null
}

export interface RatioNode extends BaseNode {
  type: 'Ratio'
  left: NumberNode
  right: NumberNode
}

export interface UnicodeRangeNode extends BaseNode {
  type: 'UnicodeRange'
  value: string
}

export interface MediaQueryListNode extends BaseNode {
  type: 'MediaQueryList'
  children: CssList<CssNode>
}

export interface MediaQueryNode extends BaseNode {
  type: 'MediaQuery'
  children: CssList<CssNode>
}

export interface MediaFeatureNode extends BaseNode {
  type: 'MediaFeature'
  name: string
  value: NumberNode | DimensionNode | RatioNode | Identifier | null
}

// ----- Aliases -----

export type Raw = RawNode

export type CssNode
  = | StyleSheet | Rule | Atrule | AtrulePrelude | Block
    | Declaration | DeclarationList | Value
    | SelectorList | Selector | TypeSelector | IdSelector | ClassSelector
    | AttributeSelector | PseudoClassSelector | PseudoElementSelector
    | Combinator | NestingSelector
    | Identifier | NumberNode | PercentageNode | DimensionNode
    | StringNode | UrlNode | HashNode | OperatorNode
    | FunctionNode | ParenthesesNode | BracketsNode
    | RawNode | CommentNode | WhiteSpaceNode | CDONode | CDCNode
    | NthNode | AnPlusBNode | RatioNode | UnicodeRangeNode
    | MediaQueryListNode | MediaQueryNode | MediaFeatureNode

export type ParseContext
  = | 'stylesheet'
    | 'atrule'
    | 'atrulePrelude'
    | 'mediaQuery'
    | 'mediaQueryList'
    | 'rule'
    | 'selectorList'
    | 'selector'
    | 'block'
    | 'declarationList'
    | 'declaration'
    | 'value'
    | 'raw'

export interface ParseOptions {
  /** Source filename used in error/loc reports. */
  filename?: string
  /** Track source locations on every node. */
  positions?: boolean
  /** Grammar context to parse `source` as (default `'stylesheet'`). */
  context?: ParseContext
  /** When false, declaration values are stored as `Raw` rather than parsed. */
  parseValue?: boolean
  /** When false, at-rule preludes are stored as `Raw` rather than parsed. */
  parseAtrulePrelude?: boolean
  /** When false, custom-property values are stored as `Raw`. */
  parseCustomProperty?: boolean
  /** When false, rule preludes (selector lists) are stored as `Raw`. */
  parseRulePrelude?: boolean
  /** Forwarded to consumer's error handler. */
  // eslint-disable-next-line pickier/no-unused-vars
  onParseError?: (error: SyntaxError, fallbackNode: CssNode) => void
}
