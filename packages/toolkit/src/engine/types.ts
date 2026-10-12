import type { CodeStringsConfig } from './parser'

export interface CompileClassConfig {
  /**
   * Enable compile class transformer
   * @default false
  */
  enabled?: boolean
  /**
   * Trigger string to mark classes for compilation
   * @default ':tc:'
  */
  trigger?: string
  /**
   * Prefix for generated class names
   * @default 'tc-'
  */
  classPrefix?: string
  /**
   * Layer name for compiled classes
   * @default 'shortcuts'
  */
  layer?: string
}

export interface AttributifyConfig {
  /**
   * Enable attributify mode
   * Allows using HTML attributes instead of class names
   * e.g., <div tc-flex tc-bg="blue-500">
   * @default false
  */
  enabled?: boolean
  /**
   * Prefix for attributify attributes (to avoid conflicts with HTML attributes)
   * e.g., with prefix 'tc-': <div tc-flex tc-bg="blue-500">
   * @default 'tc-'
  */
  prefix?: string
  /**
   * Attributes to ignore (won't be treated as utilities)
   * @default ['class', 'className', 'style', 'id', ...]
  */
  ignoreAttributes?: string[]
}

export interface BracketSyntaxConfig {
  /**
   * Enable bracket/grouped syntax
   * Allows grouping utilities like: flex[col jc-center ai-center] or text[white 2rem 700]
   * @default false
  */
  enabled?: boolean
  /**
   * Enable colon syntax for simple values
   * e.g., bg:black, w:100%, text:white
   * @default false
  */
  colonSyntax?: boolean
  /**
   * Mapping of shorthand abbreviations to full utility names
   * e.g., { 'jc': 'justify', 'ai': 'items', 'col': 'col' }
  */
  aliases?: Record<string, string>
}

/**
 * Web-font loading. Crosswind maps `font-*` utilities to family stacks, but it
 * never loaded the actual font files — declare them here and ts-css emits the
 * `@import` / `@font-face` so the fonts render with zero extra wiring.
 */
export interface FontConfig {
  /**
   * Google Fonts families, in css2 syntax. Spaces become `+` automatically.
   * e.g. `['Inter:wght@400;500;600;700', 'JetBrains Mono:wght@400;600;700']`
   */
  google?: string[]
  /**
   * `font-display` strategy applied to the Google `@import` (default `swap`).
   */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  /**
   * Raw `@font-face { … }` blocks emitted verbatim, for self-hosted fonts.
   */
  faces?: string[]
}

export interface CssConfig {
  content: string[]
  output: string
  minify: boolean
  watch: boolean
  verbose?: boolean
  /** Include the preflight/reset CSS in built output (default true). */
  includePreflight?: boolean
  /**
   * Dark mode strategy: 'class' scopes dark: under a .dark ancestor
   * (default); 'media' uses @media (prefers-color-scheme: dark).
  */
  darkMode?: 'class' | 'media'
  theme: Theme
  /** Web fonts to load (Google Fonts `@import` and/or raw `@font-face`). */
  fonts?: FontConfig
  shortcuts: Record<string, string | string[]>
  rules: CustomRule[]
  variants: VariantConfig
  safelist: string[]
  blocklist: string[]
  preflights: Preflight[]
  presets: Preset[]
  compileClass?: CompileClassConfig
  attributify?: AttributifyConfig
  bracketSyntax?: BracketSyntaxConfig
  /**
   * Extraction from string literals in code, not just class attributes.
   * Enabled by default; see `CodeStringsConfig` in the parser.
   */
  codeStrings?: CodeStringsConfig
  /** Generate :root CSS variables from theme colors (e.g., --monokai-bg: #2d2a2e) */
  cssVariables?: boolean
  /**
   * Modules that declare styles through the `css.create()` API. They are
   * evaluated at build time and their atomic CSS is appended to the output.
   *
   * e.g. `['./src/**\/*.styles.ts']`
   */
  styles?: string[]
}

export interface Theme {
  colors: Record<string, string | Record<string, string>>
  spacing: Record<string, string>
  fontSize: Record<string, [string, { lineHeight: string }]>
  fontFamily: Record<string, string[]>
  /** Named line-heights for the `text-{size}/{leading}` slash syntax (e.g. `text-base/loose`). */
  lineHeight?: Record<string, string>
  screens: Record<string, string>
  borderRadius: Record<string, string>
  boxShadow: Record<string, string>
  /** Extend theme values without replacing defaults */
  extend?: Partial<Omit<Theme, 'extend'>>
}

export interface VariantConfig {
  'responsive': boolean
  'hover': boolean
  'focus': boolean
  'active': boolean
  'disabled': boolean
  'dark': boolean
  'light': boolean
  // Group/Peer
  'group': boolean
  'peer': boolean
  // Child (*) and descendant (**)
  '*': boolean
  '**': boolean
  // Ancestor matching (in-*)
  'in': boolean
  // Pseudo-elements
  'before': boolean
  'after': boolean
  'marker': boolean
  'first-letter': boolean
  'first-line': boolean
  'backdrop': boolean
  'details-content': boolean
  // Pseudo-classes - Basic
  'first': boolean
  'last': boolean
  'odd': boolean
  'even': boolean
  'first-of-type': boolean
  'last-of-type': boolean
  'visited': boolean
  'checked': boolean
  'focus-within': boolean
  'focus-visible': boolean
  // Pseudo-classes - Form states
  'placeholder': boolean
  'selection': boolean
  'file': boolean
  'required': boolean
  'valid': boolean
  'invalid': boolean
  'read-only': boolean
  'autofill': boolean
  'user-valid': boolean
  'user-invalid': boolean
  // Pseudo-classes - Additional states
  'open': boolean
  'closed': boolean
  'empty': boolean
  'enabled': boolean
  'only': boolean
  'target': boolean
  'indeterminate': boolean
  'default': boolean
  'optional': boolean
  'inert': boolean
  // Dynamic variants (aria-*, data-*, has:, supports:, not-*)
  'aria': boolean
  'data': boolean
  'has': boolean
  'not': boolean
  'supports': boolean
  // Media
  'print': boolean
  'landscape': boolean
  'portrait': boolean
  'forced-colors': boolean
  // Direction
  'rtl': boolean
  'ltr': boolean
  // Motion
  'motion-safe': boolean
  'motion-reduce': boolean
  // Contrast
  'contrast-more': boolean
  'contrast-less': boolean
}

export interface ParsedClass {
  raw: string
  /**
   * `raw` with every variant prefix and the `!` important marker stripped —
   * the bare utility token (`hover:!bg-red-500` → `bg-red-500`).
   *
   * Rules that recognise a whole class by name must match on this, not on
   * `raw`, or the utility silently generates nothing under any variant.
   */
  base: string
  variants: string[]
  utility: string
  value?: string
  important: boolean
  arbitrary: boolean
  /** The slash modifier originated from bracket syntax such as `/[0.5]`. */
  modifierArbitrary?: boolean
  typeHint?: string // Type hint for arbitrary values, e.g., 'color' in text-[color:var(--muted)]
}

export interface CSSRule {
  selector: string
  properties: Record<string, string>
  mediaQuery?: string
  childSelector?: string // For utilities like space-x that need child selectors
}

export interface UtilityRuleResult {
  properties: Record<string, string>
  childSelector?: string
  pseudoElement?: string // e.g., '::placeholder' — appended to selector without space
  /**
   * Emit the rule under `:where()`, at zero specificity, so a sizing or colour
   * utility on the same element wins whatever order the stylesheets arrive in.
   */
  defaults?: boolean
}

export type CustomRule = [RegExp, (_match: RegExpMatchArray) => Record<string, string> | undefined]

export interface Preflight {
  getCSS: () => string
}

export interface Preset {
  name: string
  theme?: Partial<Theme>
  rules?: CustomRule[]
  shortcuts?: Record<string, string | string[]>
  variants?: Partial<VariantConfig>
  preflights?: Preflight[]
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type CssOptions = DeepPartial<CssConfig>
