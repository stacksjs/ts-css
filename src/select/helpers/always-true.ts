/**
 * Singleton "always-matches" predicate. Used as the leaf sentinel in
 * compound-selector chains so each compileX factory can detect the leaf
 * case and skip the trailing `&& next(e)` indirection.
 */

export const ALWAYS_TRUE: (_: any) => boolean = (_: any): boolean => { void _; return true }
