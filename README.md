# @stacksjs/ts-css

> Pure-TypeScript CSS toolkit for Bun & Node. Zero runtime dependencies.

`ts-css` is a single, dependency-free package that replaces the four-library
quartet most CSS pipelines pull in:

| You used to install              | Now you only install         |
| -------------------------------- | ---------------------------- |
| `css-tree` `css-select` `css-what` `csso` | `@stacksjs/ts-css` |

It's a drop-in for the API surface that real consumers (CSSO, SVGO, lint
tools, design-system pipelines) actually touch — written from scratch in
TypeScript with strict types, the CSS Syntax Module Level 3 tokenizer, and
the `css-select` adapter pattern preserved verbatim so existing call sites
don't change.

## Highlights

- **Zero runtime deps.** Only ts-css's own code. Ships ~4.5k lines of TS.
- **Four packages worth of API in one import.** Sub-modules at
  `@stacksjs/ts-css/parse`, `/what`, `/select`, `/optimize`.
- **Drop-in compatible.** Namespace exports (`csstree`, `cssWhat`,
  `cssSelect`, `csso`) keep existing call sites intact.
- **Bun-first.** Built and tested on Bun, works on Node ≥18.
- **Strict TypeScript.** Strict mode, isolatedDeclarations, verbatimModuleSyntax.

## Install

```bash
bun add @stacksjs/ts-css
# or
npm i @stacksjs/ts-css
```

## Quick start

### Parse, walk, generate

```ts
import { generate, parse, walk } from '@stacksjs/ts-css'

const ast = parse(`
  .foo, .bar > .baz {
    color: red;
    background: url("/x.png") no-repeat;
  }
`)

walk(ast, {
  visit: 'Declaration',
  enter(decl) {
    console.log(decl.property, '→', generate(decl.value))
  },
})
// color → red
// background → url("/x.png") no-repeat

console.log(generate(ast))
// .foo,.bar>.baz{color:red;background:url("/x.png") no-repeat}
```

### Match selectors against any tree

```ts
import { selectAll } from '@stacksjs/ts-css'

const adapter = {
  isTag: (n) => n?.type === 'el',
  getName: (e) => e.name,
  getAttributeValue: (e, n) => e.attrs[n],
  // …other adapter methods (see docs/api/select.md)
}

selectAll('p > span.foo:not(.disabled)', root, { adapter, xmlMode: true })
```

The adapter shape is **identical** to `css-select`'s — pass your own and
ts-css matches selectors against your custom tree (HTML, XML, your
design-system AST, anything).

### Minify CSS

```ts
import { minify } from '@stacksjs/ts-css'

minify(`
  .a {
    margin: 0px 0.5em 10.000px;
    color: #aabbcc;
    color: blue; /* later wins */
  }
`).css
// → ".a{margin:0 .5em 10px;color:blue}"
```

### Compute selector specificity

```ts
import { parse, syntax } from '@stacksjs/ts-css'

const sel = parse('#a.b div', { context: 'selector' })
syntax.specificity(sel) // [1, 1, 1]
```

## Migration: drop-in compat

If you already use `css-tree`/`css-select`/`css-what`/`csso`, the migration
is one block of imports:

```diff
- import * as csstree from 'css-tree'
- import * as csswhat from 'css-what'
- import { is, selectAll, selectOne } from 'css-select'
- import * as csso from 'csso'
+ import { csstree, cssWhat as csswhat, csso, is, selectAll, selectOne } from '@stacksjs/ts-css'
```

Every method already used by SVGO and CSSO works without further changes:

| Surface                          | Available |
| -------------------------------- | --------- |
| `csstree.parse(s, opts)`         | ✅ — all `context` modes |
| `csstree.walk(ast, cb \| { visit, enter, leave })` + `walk.skip` | ✅ |
| `csstree.generate(node)`         | ✅ |
| `csstree.clone(node)`            | ✅ |
| `csstree.List` / `ListItem`      | ✅ — same `forEach(data, item, list)` callback shape |
| `cssWhat.parse(selector)`        | ✅ |
| `cssWhat.isTraversal(seg)`       | ✅ |
| `cssSelect.{selectAll,selectOne,is}` | ✅ |
| `csso.{minify,minifyBlock}`      | ✅ |
| `csso.syntax.specificity(node)`  | ✅ |

## CLI

```bash
ts-css minify input.css > output.css
ts-css parse  input.css                # AST as JSON on stdout
ts-css format input.css                # round-trip through parser/generator
```

## What's not (yet) in scope

This is a pragmatic port — full surface area where it's load-bearing,
trimmed where the original libs spend most of their bytes on
edge cases real consumers don't hit:

- ❌ **No CSS-spec-aware lexer.** `css-tree`'s value validator (e.g.
  "is `red` a valid `<color>`?") is ~3000 lines of spec data and grammar
  matchers. We don't ship it. If you need spec validation, the AST already
  preserves enough to add it on top.
- ❌ **No CSSO restructuring pass.** `csso` reorders rules across selectors
  to fold compatible declarations. It's complex and gives marginal gain
  beyond gzip. Declaration-level minification (numbers, colors, dedup)
  ships fully.

Everything else round-trips byte-equivalent or better than the originals.

## Project layout

```
src/
  parse/     # tokenizer, parser, AST types, walker, generator, clone, List
  what/      # selector parser/stringifier
  select/    # selectAll/selectOne/is engine + pseudo-class compilers
  optimize/  # minifier, value compressors, specificity
```

Each sub-module is exported as a separate entry point so you can import
just what you need:

```ts
import { parse, walk } from '@stacksjs/ts-css/parse'
import { selectAll } from '@stacksjs/ts-css/select'
import { minify } from '@stacksjs/ts-css/optimize'
```

## Performance

End-to-end (parse → minify → generate) on a 6 KB representative fixture:

| Pipeline                    | Time/iter |
| --------------------------- | --------- |
| `ts-css.minify(source)`     | **441 µs** |
| `csso.minify(source)`       | 847 µs    |

→ **1.92× faster end-to-end** with zero runtime deps. Per-API breakdown
in [`docs/benchmarks.md`](./docs/benchmarks.md). Run them yourself with
`bun run bench`.

## Documentation

Full docs: see [`./docs`](./docs) or run `bun run dev:docs` to start the
local docs site.

- [Getting started](./docs/intro.md)
- [Parser API](./docs/api/parse.md)
- [Selector parser API](./docs/api/what.md)
- [Selector matcher API](./docs/api/select.md)
- [Optimizer API](./docs/api/optimize.md)
- [Migration guide](./docs/migration.md)
- [Benchmarks](./docs/benchmarks.md)

## License

MIT — see [`LICENSE.md`](./LICENSE.md).

The selector parsing strategy in `src/what` is structurally inspired by
[`css-what`](https://github.com/fb55/css-what); the visitor & List shape in
`src/parse` mirrors [`css-tree`](https://github.com/csstree/csstree); the
minification plan in `src/optimize` follows
[`csso`](https://github.com/css/csso). All four are MIT-licensed; this
project is an independent reimplementation that preserves their public API
surface.
