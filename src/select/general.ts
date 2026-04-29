/**
 * Compile a *simple* selector token (tag/universal/id/class/attr/pseudo)
 * into a predicate. Combinators (descendant/child/sibling/adjacent/parent)
 * are handled at a higher level — see pseudo-selectors/selectors.ts.
 *
 * `next` is the predicate for the rest of the compound chain to the right
 * of this token. When the caller has nothing further to test, it passes the
 * shared `ALWAYS_TRUE` sentinel — each branch detects that and returns a
 * leaf predicate without the trailing `&& next(e)` indirection. Skipping
 * the no-op call shaves ~10 % off `selectAll` on tight loops.
 */

import type { Selector } from '../what'
import type { CompiledQuery, Options } from './types'
import { compileAttribute } from './attributes'
import { ALWAYS_TRUE } from './helpers/always-true'
import { compilePseudo } from './pseudo-selectors'

type Compiled<E> = CompiledQuery<E>

export { ALWAYS_TRUE }

export function compileToken<Node, ElementNode extends Node>(
  token: Selector,
  options: Options<Node, ElementNode>,
  next: Compiled<ElementNode>,
): Compiled<ElementNode> {
  const adapter = options.adapter
  const isLeaf = next === ALWAYS_TRUE
  switch (token.type) {
    case 'tag': {
      const name = options.lowerCaseTags !== false && !options.xmlMode ? token.name.toLowerCase() : token.name
      if (isLeaf)
        return e => adapter.getName(e) === name
      return e => adapter.getName(e) === name && next(e)
    }
    case 'universal':
      return next
    case 'attribute':
      return compileAttribute(token, options, next)
    case 'pseudo':
    case 'pseudo-element':
      return compilePseudo(token as any, options, next) as any
    case 'descendant':
    case 'child':
    case 'parent':
    case 'sibling':
    case 'adjacent':
    case 'column-combinator':
      // Should never reach here — combinators are handled by selectors.ts
      // before we get a chance to dispatch on them.
      return next
  }
  return _ => { void _; return false }
}
