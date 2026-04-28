# @stacksjs/ts-css

Pure-TypeScript CSS toolkit for Bun/Node. Zero runtime deps.

Drop-in replacement for the `css-tree` + `css-select` + `css-what` + `csso`
quartet that most CSS processing pipelines pull in.

## What's included

| Module                     | Replaces      | What you get                                                  |
| -------------------------- | ------------- | ------------------------------------------------------------- |
| `@stacksjs/ts-css/parse`   | `css-tree`    | Tokenizer, recursive-descent parser, walker, generator, clone |
| `@stacksjs/ts-css/what`    | `css-what`    | Selector parser / stringifier                                 |
| `@stacksjs/ts-css/select`  | `css-select`  | `selectAll` / `selectOne` / `is` against any tree-like adapter |
| `@stacksjs/ts-css/optimize`| `csso`        | `minify` / `minifyBlock`, `syntax.specificity`                |

The top-level `@stacksjs/ts-css` package re-exports all four under their
familiar namespaces (`csstree`, `cssWhat`, `cssSelect`, `csso`) plus the
most-used functions directly.

## Install

```bash
bun add @stacksjs/ts-css
```

## Quick start

### Parse → walk → generate

```ts
import { generate, parse, walk } from '@stacksjs/ts-css'

const ast = parse('.foo { color: red }')
walk(ast, (node) => {
  if (node.type === 'Declaration')
    console.log(node.property)
})
console.log(generate(ast))
```

### Selector matching

```ts
import { selectAll } from '@stacksjs/ts-css'

const els = selectAll('p > span.foo', root, { adapter, xmlMode: true })
```

The adapter shape is identical to `css-select`'s — pass your own
implementation for any tree (HTML, XML, your custom AST, etc.).

### Minify CSS

```ts
import { minify } from '@stacksjs/ts-css'

const { css } = minify('.a { margin: 0px 0.5em 10.000px; color:#aabbcc }')
// → ".a{margin:0 .5em 10px;color:#abc}"
```

### Specificity

```ts
import { syntax } from '@stacksjs/ts-css'
import { parse } from '@stacksjs/ts-css'

const sel = parse('#a.b div', { context: 'selector' })
syntax.specificity(sel) // [1, 1, 1]
```

### Drop-in compatibility

If you're migrating off the original quartet, the namespace import lines
change but the call sites stay the same:

```diff
- import * as csstree from 'css-tree'
- import * as csswhat from 'css-what'
- import { selectAll, selectOne, is } from 'css-select'
- import * as csso from 'csso'
+ import { csstree, cssWhat, csso } from '@stacksjs/ts-css'
+ import { selectAll, selectOne, is } from '@stacksjs/ts-css'
```

## CLI

```bash
ts-css minify input.css > output.css
ts-css parse  input.css | jq          # pretty-print AST
ts-css format input.css               # round-trip through parser/generator
```

## Scope notes

This is a pragmatic port — the full surface area of the original libraries
that real consumers (CSSO, SVGO, lint tools) actually touch. Specifically:

- ❌ No CSS-spec-aware lexer (no `<color>` / `<length>` validation against
  the syntax definitions). Add it back when an actual consumer needs it —
  the AST already preserves enough information to do so.
- ❌ No selector-rewriting CSS restructuring (csso's "merge rules across
  selectors" pass). Marginal real-world gain over gzip.

Everything else round-trips byte-equivalent or better than the originals.

## License

MIT
