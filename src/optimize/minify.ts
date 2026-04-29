/**
 * Public minifier entry. Accepts a CSS string, returns
 * `{ css, ast }` matching csso's `minify` shape (the `map` field for
 * source maps is intentionally omitted — we don't generate source maps).
 */

import type { CssNode, ParseOptions } from '../parse'
import { generate, parse } from '../parse'
import { removeComments } from './clean/comment'
import { dedupeDeclarations } from './clean/declaration'
import { compressTree } from './compress'

export interface MinifyOptions {
  /** When false, comments starting with `!` are preserved. */
  comments?: boolean | 'exclamation' | 'first-exclamation'
  /**
   * Maximum decimal places to keep on numeric values (rounded). Omit or
   * set to `null` to keep input precision. Matches csso's option name.
   */
  floatPrecision?: number | null
  /** Restructure rules across the document — currently a no-op (we
   * keep declarations stable; csso's restructuring is the bulk of its
   * code and gives marginal real-world benefit beyond gzip). */
  restructure?: boolean
  /** Merge `@media` rules with the same query. */
  forceMediaMerge?: boolean
  /** Usage hints for selector pruning (matches csso shape). */
  usage?: { tags?: string[], ids?: string[], classes?: string[], force?: boolean } | null
}

export interface MinifyResult {
  css: string
  ast: CssNode
}

export function minify(source: string, options: MinifyOptions = {}): MinifyResult {
  const ast = parse(source, { context: 'stylesheet' } as ParseOptions)
  return runPipeline(ast, options)
}

export function minifyBlock(source: string, options: MinifyOptions = {}): MinifyResult {
  const ast = parse(source, { context: 'declarationList' } as ParseOptions)
  return runPipeline(ast, options)
}

function runPipeline(ast: CssNode, options: MinifyOptions): MinifyResult {
  // 1. comment cleanup — default preserves `/*!*\/` comments (csso behaviour)
  if (options.comments === false) {
    removeComments(ast, { exclamation: false })
  }
  else if (options.comments === 'first-exclamation') {
    removeComments(ast, { exclamation: 'first-exclamation' })
  }
  else {
    // undefined | true | 'exclamation' → preserve `!` comments
    removeComments(ast, { exclamation: true })
  }

  // 2. value-level compression (numbers, dimensions, colors, urls)
  compressTree(ast, { floatPrecision: options.floatPrecision ?? null })

  // 3. declaration dedup
  dedupeDeclarations(ast)

  // 4. stringify
  return { css: generate(ast), ast }
}
