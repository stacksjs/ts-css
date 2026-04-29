# @stacksjs/ts-css

> Pure-TypeScript CSS toolkit for Bun & Node. Zero runtime dependencies.

`ts-css` is a CSS toolkit for build tools, linters, design-system pipelines,
SSR templating, runtime style transforms — anything that needs to read,
walk, query, transform, or minify CSS in a JS/TS environment. Written from
scratch in TypeScript with strict types and the CSS Syntax Module Level 3
tokenizer.

It bundles every common CSS pipeline primitive — tokenizer, AST parser,
visitor walker, generator, selector parser, selector matcher, and minifier —
into a single zero-dep package. The shape of each sub-API mirrors the
de-facto community standard for that capability (`css-tree`-style AST and
walker, `css-what`-style selector tokens, the `css-select` adapter contract,
`csso`-style minify result), so adopting `ts-css` rarely requires call-site
changes — but the project stands on its own and isn't pitched as "the
replacement for X."

## Highlights

- **Zero runtime deps.** Only ts-css's own code. Ships ~4.5k lines of TS.
- **One install for the whole CSS pipeline.** Tokenizer, parser, walker,
  generator, selector parser/matcher, and minifier — all behind sub-module
  imports at `@stacksjs/ts-css/parse`, `/what`, `/select`, `/optimize`.
- **Familiar API shapes.** Visitor/walker callbacks, AST node types, and
  the `css-select` adapter contract follow the conventions established by
  the popular community libraries, so most existing call sites work
  unchanged.
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

The matcher is decoupled from any DOM implementation: pass an `Adapter`
describing your tree (HTML, XML, an SVG AST, your design-system component
graph, anything with `parent`/`children`/`name`/`attrs`-like access) and
ts-css will match standard CSS selectors against it.

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

## API surface

`ts-css` exposes a complete CSS pipeline. The named exports below cover the
endpoints most build/lint/transform tools reach for:

| Capability                       | Export                       |
| -------------------------------- | ---------------------------- |
| Parse a stylesheet to an AST (`stylesheet`/`rule`/`declaration`/`selectorList`/etc. contexts) | `parse(source, opts?)` |
| Walk the AST with `enter`/`leave` callbacks, `visit` filtering, and a `walk.skip` sentinel | `walk(ast, fn \| visitor)` |
| Stringify any AST node back to CSS source | `generate(node)` |
| Deep-clone an AST subtree | `clone(node)` |
| Doubly-linked children container with cursor-safe `forEach(data, item, list)` mid-walk mutation | `List` / `ListItem` |
| Tokenize a selector string into segments | `cssWhat.parse(selector)` |
| Detect combinator/traversal segments | `cssWhat.isTraversal(seg)` |
| Match a selector against an arbitrary tree via the `Adapter` contract | `selectAll`, `selectOne`, `is`, `compile` |
| Minify with declaration/value compression and whitespace collapse | `minify`, `minifyBlock` |
| Compute selector specificity tuple | `syntax.specificity(node)` |

A namespace export (`csstree`, `cssWhat`, `cssSelect`, `csso`) is also
available so existing code that imports from those packages can typically
switch by just changing the import path.

## CLI

```bash
ts-css minify input.css > output.css
ts-css parse  input.css                # AST as JSON on stdout
ts-css format input.css                # round-trip through parser/generator
```

## What's not (yet) in scope

This is a pragmatic toolkit — full surface area where it's load-bearing,
trimmed where edge cases would force in spec data or rarely-used passes:

- ❌ **No CSS-spec-aware value lexer.** Validating that `red` is a valid
  `<color>`, or that `1px` is the right syntax for a given property, is
  thousands of lines of spec grammar that most pipelines don't need. The
  AST preserves enough information to layer that on top if you do.
- ❌ **No cross-rule restructuring pass.** Reordering rules across the
  whole stylesheet to fold compatible declarations is complex and gives
  marginal gains beyond gzip. Declaration-level minification (numbers,
  colors, dedup, longhand collapse) ships fully.

Everything else round-trips byte-equivalent.

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

End-to-end (parse → minify → generate) on a 6 KB representative fixture
(Apple M3 Pro, Bun 1.3):

| Pipeline                    | Time/iter |
| --------------------------- | --------- |
| `ts-css.minify(source)`     | **~270 µs** |
| `csso.minify(source)`       | ~890 µs    |

→ **~3.3× faster end-to-end** with zero runtime deps. Per-API breakdown
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

`ts-css` is an independent implementation. The visitor / linked-list shape
in `src/parse`, the selector tokenizer model in `src/what`, the adapter
pattern in `src/select`, and the minification plan in `src/optimize` all
follow conventions established by the long-standing community libraries in
each area, so call sites that already use those conventions tend to drop in
without changes. All such projects are MIT-licensed.
