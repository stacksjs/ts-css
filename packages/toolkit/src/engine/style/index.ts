/**
 * The style object API — typed, atomic, StyleX-shaped.
 *
 * Utility classes are unbeatable for the common case; they run out when a
 * style has to be computed, shared as a token, or merged predictably across
 * component boundaries. This is the escape hatch, and it compiles to the same
 * atomic CSS the utility engine emits.
 */

export {
  create,
  createTheme,
  defineConsts,
  defineVars,
  firstThatWorks,
  keyframes,
  props,
} from './api'

export { hashedClassName, hashString } from './hash'

export type { AtomicRule, KeyframesRule, VarRule } from './registry'
export { renderStyles, resetStyles, styleCount } from './registry'

export type {
  CompiledStyle,
  CreatedStyles,
  DynamicStyle,
  KeyframeDefinition,
  StyleArg,
  StyleProps,
  StyleRule,
  StyleValue,
  VarGroup,
  VarValue,
} from './types'

import {
  create,
  createTheme,
  defineConsts,
  defineVars,
  firstThatWorks,
  keyframes,
  props,
} from './api'
import { renderStyles, resetStyles } from './registry'

/**
 * Namespaced entry point, so call sites read as prose.
 *
 * @example
 * ```ts
 * import { css } from '@stacksjs/ts-css/engine'
 *
 * const styles = css.create({ card: { padding: 16 } })
 * <div {...css.props(styles.card)} />
 * ```
 */
export const css: {
  create: typeof create
  props: typeof props
  defineVars: typeof defineVars
  defineConsts: typeof defineConsts
  createTheme: typeof createTheme
  keyframes: typeof keyframes
  firstThatWorks: typeof firstThatWorks
  render: typeof renderStyles
  reset: typeof resetStyles
} = {
  create,
  props,
  defineVars,
  defineConsts,
  createTheme,
  keyframes,
  firstThatWorks,
  render: renderStyles,
  reset: resetStyles,
}
