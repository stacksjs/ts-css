/**
 * @stacksjs/ts-css — pure-TypeScript CSS toolkit.
 *
 * Top-level surface re-exports the four sub-modules:
 *   - parse    — CSS parser/walker/generator   (replaces css-tree)
 *   - what     — selector parser               (replaces css-what)
 *   - select   — selector matching             (replaces css-select)
 *   - optimize — CSS minifier + specificity    (replaces csso)
 */

export * from './config'

// Sub-module namespaces — `import * as csstree from '@stacksjs/ts-css'` etc.
export * as csstree from './parse'
export * as cssWhat from './what'
export * as cssSelect from './select'
export * as csso from './optimize'

// Top-level convenience re-exports
export { clone, generate, List, parse, walk } from './parse'
export type { CssNode, CssNodeType, ListItem, ParseOptions } from './parse'
export { is, selectAll, selectOne } from './select'
export type { Adapter, CompiledQuery, Options } from './select'
export { isTraversal, parse as parseSelector, stringify as stringifySelector } from './what'
export type { Selector, SelectorType } from './what'
export { minify, minifyBlock, specificity, syntax } from './optimize'
export type { MinifyOptions, MinifyResult, Specificity } from './optimize'

export * from './types'
