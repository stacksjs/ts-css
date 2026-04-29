/**
 * css-select adapter / option types. Drop-in compatible with css-select v5.
 *
 * The library is generic over the consumer's tree (`Node`/`ElementNode`),
 * communicated via the `Adapter` interface — exactly the shape SVGO etc.
 * already implement, so callers don't need to change a thing.
 */

export interface Adapter<Node, ElementNode extends Node> {
  // eslint-disable-next-line pickier/no-unused-vars
  isTag: (node: Node) => node is ElementNode
  // eslint-disable-next-line pickier/no-unused-vars
  existsOne: (test: (e: ElementNode) => boolean, elems: Node[]) => boolean
  // eslint-disable-next-line pickier/no-unused-vars
  getAttributeValue: (elem: ElementNode, name: string) => string | undefined
  // eslint-disable-next-line pickier/no-unused-vars
  getChildren: (node: Node) => Node[]
  // eslint-disable-next-line pickier/no-unused-vars
  getName: (elem: ElementNode) => string
  // eslint-disable-next-line pickier/no-unused-vars
  getParent: (elem: ElementNode | Node) => ElementNode | null
  // eslint-disable-next-line pickier/no-unused-vars
  getSiblings: (elem: Node) => Node[]
  // eslint-disable-next-line pickier/no-unused-vars
  getText: (node: Node) => string
  // eslint-disable-next-line pickier/no-unused-vars
  hasAttrib: (elem: ElementNode, name: string) => boolean
  // eslint-disable-next-line pickier/no-unused-vars
  removeSubsets: (nodes: Node[]) => Node[]
  /**
   * `findAll` / `findOne` are accepted for adapter-shape compatibility
   * with css-select, but ts-css implements its own iterative tree walker
   * (`select/helpers/querying.ts`) and does NOT call these. They're
   * declared optional so adapters that don't provide them still type-check.
   */
  // eslint-disable-next-line pickier/no-unused-vars
  findAll?: (test: (e: ElementNode) => boolean, elems: Node[]) => ElementNode[]
  // eslint-disable-next-line pickier/no-unused-vars
  findOne?: (test: (e: ElementNode) => boolean, elems: Node[]) => ElementNode | null
  // eslint-disable-next-line pickier/no-unused-vars
  equals?: (a: Node, b: Node) => boolean
  // eslint-disable-next-line pickier/no-unused-vars
  isActive?: (elem: ElementNode) => boolean
  // eslint-disable-next-line pickier/no-unused-vars
  isVisited?: (elem: ElementNode) => boolean
  // eslint-disable-next-line pickier/no-unused-vars
  isHovered?: (elem: ElementNode) => boolean
}

export interface Options<Node, ElementNode extends Node> {
  /** XML mode disables HTML quirks (case-insensitive tags etc.). */
  xmlMode?: boolean
  /** When false, attribute names are not lowercased before lookup. */
  lowerCaseAttributeNames?: boolean
  /** When false, tags are not lowercased. */
  lowerCaseTags?: boolean
  /** Cache compiled selectors when true. */
  cacheResults?: boolean
  /** Adapter providing tree access. */
  adapter: Adapter<Node, ElementNode>
  /** Optional context node for relative selectors (`:has`, `:not`). */
  context?: Node | Node[]
  /** Optional pseudo-class/element extension hooks. */
  // eslint-disable-next-line pickier/no-unused-vars
  pseudos?: Record<string, string | ((elem: ElementNode, value?: string) => boolean)>
  /** Set, treated as already-visited siblings root. */
  rootFunc?: (elem: ElementNode) => boolean
  /** Whether to match `:has` lazily. */
  relativeSelector?: boolean
  /** Whether the parsed selector itself is the document. */
  quirksMode?: boolean
}

// eslint-disable-next-line pickier/no-unused-vars
export type CompiledQuery<ElementNode> = (node: ElementNode) => boolean
// eslint-disable-next-line pickier/no-unused-vars
export type Predicate<Value> = (v: Value) => boolean
