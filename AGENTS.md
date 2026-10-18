# Codex Guidelines

## About

`ts-css` (published on npm as `@stacksjs/ts-css`, with its utility engine at `@stacksjs/ts-css/engine`; CLI binary `cssx`, config file `css.config.ts`, class prefix `tc`) is an on-demand CSS engine built with Bun, with two front ends over one atomic output:

- **Utility classes** — Tailwind v4-compatible, with full variant support (responsive, state, dark mode, pseudo-elements), arbitrary values, shortcut aliases, and compile-class HTML optimization.
- **Style objects** — a StyleX-shaped typed API (`css.create`, `css.props`, `css.defineVars`, `css.createTheme`, `css.keyframes`) in `packages/toolkit/src/engine/style/`, collected at build time by evaluating the modules that declare them.

Zero runtime dependencies, 1900+ tests, and both CLI and programmatic APIs.

## Benchmarks

Two modes, and they must stay separate: **cold** (every engine constructed per iteration — a production build) and **warm** (engines held open with no new classes — a watch rebuild). Comparing one engine's cold path against another's warm cache is how the old benchmark ended up claiming a 4-orders-of-magnitude win for Tailwind that did not exist. Tailwind v4's `build()` memoises per candidate set; ts-css's `toCSS()` memoises per revision. Never quote a number without saying which mode it came from.

## Semantics compass

**ts-css targets Tailwind v4 semantics.** When a utility's behavior, value scale, or validity is in question, Tailwind v4 is the reference: a class Tailwind rejects should generate nothing (never pass raw words through to CSS), and a class Tailwind accepts should produce the same declarations. Bracket syntax (`flex[col jc-center]`), colon syntax (`bg:black`), attributify mode, the compile-class transformer, and the `text-shadow-*` / `word-spacing-*` utilities are deliberate extensions beyond Tailwind — keep them working, but design them to be consistent with the same validation rules (numbers/keywords/theme values/arbitrary `[...]` only).

## Linting

- Use **pickier** for linting — never use eslint directly
- Run `bunx --bun pickier .` to lint, `bunx --bun pickier . --fix` to auto-fix
- When fixing unused variable warnings, prefer `// eslint-disable-next-line` comments over prefixing with `_`

## Frontend

- Use **stx** for templating — never write vanilla JS (`var`, `document.*`, `window.*`) in stx templates
- Use **ts-css** as the default CSS framework which enables standard Tailwind-like utility classes
- stx `<script>` tags should only contain stx-compatible code (signals, composables, directives)

## Dependencies

- **buddy-bot** handles dependency updates — not renovatebot
- **better-dx** provides shared dev tooling as peer dependencies — do not install its peers (e.g., `typescript`, `pickier`, `bun-plugin-dtsx`) separately if `better-dx` is already in `package.json`
- If `better-dx` is in `package.json`, ensure `bunfig.toml` includes `linker = "hoisted"`

## Commits

- Use conventional commit messages (e.g., `fix:`, `feat:`, `chore:`)
