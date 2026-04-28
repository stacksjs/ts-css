/**
 * Public configuration shape for ts-css. Loaded by `bunfig` from
 * `css.config.ts` (or `.json` / `.toml`) when present.
 */
export interface CSSConfig {
  /** Default float precision used by the minifier when rounding numeric values. */
  floatPrecision: number
  /** Verbose logging from CLI commands. */
  verbose: boolean
}

export type CSSOptions = Partial<CSSConfig>
