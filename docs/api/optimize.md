# Optimizer API

Replaces `csso`. Compact a CSS string, remove duplicate declarations,
shorten colors, and compute selector specificity.

```ts
import { minify, minifyBlock, specificity, syntax } from '@stacksjs/ts-css'
// or:
import { /* … */ } from '@stacksjs/ts-css/optimize'
```

## `minify(source, options?)`

Parse, compress, and re-stringify a full stylesheet.

```ts
minify(source: string, options?: MinifyOptions): { css: string, ast: CssNode }
```

```ts
minify('.a { margin: 0px 0.5em 10.000px; color: #aabbcc }').css
// → ".a{margin:0 .5em 10px;color:#abc}"
```

## `minifyBlock(source, options?)`

Same, but parse `source` as a declaration list (the body of a `style="…"`
attribute).

```ts
minifyBlock('color: red; color: blue').css
// → "color:blue"
```

## `MinifyOptions`

| Option              | Default          | Description                                                |
| ------------------- | ---------------- | ---------------------------------------------------------- |
| `comments`          | `'exclamation'`  | `false` to strip all, `true` / `'exclamation'` to keep `/*!*/` comments, `'first-exclamation'` to keep just the first. |
| `restructure`       | `true`           | (Reserved — currently a no-op; declaration-level minification only.) |
| `forceMediaMerge`   | `false`          | (Reserved.)                                                  |
| `usage`             | `null`           | Usage hints (`{tags, ids, classes, force}`) — accepted for API parity. |

## What gets compressed

Inside any `Value`, ts-css compresses:

| Input              | Output     |
| ------------------ | ---------- |
| `0.5em`            | `.5em`     |
| `10.000px`         | `10px`     |
| `0px` / `0em` / …  | `0`        |
| `#aabbcc`          | `#abc`     |
| `#aabbccdd`        | `#abcd`    |
| `rgb(255,0,0)`     | `#f00`     |
| `url("/x.png")`    | `url(/x.png)` (when safe) |

In each `Block`, duplicate declarations are folded with **last wins**
semantics (respecting `!important`):

```css
.a { color: red; color: blue }      → .a { color: blue }
.a { color: red !important;
     color: blue }                  → .a { color: red !important }
```

Comments matching `options.comments` rule are stripped.

## `specificity(node)`

Compute the specificity of a `Selector` AST.

```ts
import { parse, syntax } from '@stacksjs/ts-css'

const sel = parse('#a.b div', { context: 'selector' })
syntax.specificity(sel) // [1, 1, 1]
```

Returns a `[a, b, c]` tuple per
[selectors level 4](https://www.w3.org/TR/selectors-4/#specificity-rules):

- `a` — id selectors
- `b` — class / attribute / pseudo-class selectors
- `c` — type / pseudo-element selectors

`:is()`, `:not()`, `:has()`, `:matches()`, `:-moz-any()`, `:-webkit-any()`
take the **maximum** specificity of their arguments.
`:where()` always contributes `[0,0,0]`.

The `syntax.specificity` re-export mirrors `csso.syntax.specificity` so
existing call sites work without changes.

## Compose your own pipeline

If you want finer control, all the building blocks are exported:

```ts
import { compressTree, dedupeDeclarations, removeComments } from '@stacksjs/ts-css/optimize'
import { generate, parse } from '@stacksjs/ts-css/parse'

const ast = parse(input)
removeComments(ast, { exclamation: true })
compressTree(ast)
dedupeDeclarations(ast)
const out = generate(ast)
```
