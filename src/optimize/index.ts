/**
 * CSS minifier — the API surface that csso users (notably SVGO's
 * `minifyStyles` and `inlineStyles`) depend on.
 */

export { dedupeDeclarations, removeComments } from './clean'
export { compressTree } from './compress'
export { minify, minifyBlock } from './minify'
export type { MinifyOptions, MinifyResult } from './minify'
export { specificity, specificityToString } from './specificity'
export type { Specificity } from './specificity'

import { specificity as _specificity } from './specificity'

/** Mirror csso's `syntax` namespace export. */
export const syntax: { specificity: typeof _specificity } = {
  specificity: _specificity,
}
