# Migration guide

Migrating from `css-tree` / `css-select` / `css-what` / `csso` to
`@stacksjs/ts-css` is one block of `import` lines.

## The diff

```diff
- import * as csstree from 'css-tree'
- import * as csswhat from 'css-what'
- import { is, selectAll, selectOne } from 'css-select'
- import * as csso from 'csso'

+ import {
+   csstree,                       // namespace mirror of css-tree
+   cssWhat as csswhat,            // namespace mirror of css-what
+   csso,                          // namespace mirror of csso
+   is, selectAll, selectOne,      // top-level css-select APIs
+ } from '@stacksjs/ts-css'
```

That's it. Every method real consumers use is preserved.

## Per-library compatibility

### `css-tree`

| Surface                                      | Compat |
| -------------------------------------------- | ------ |
| `parse(source, opts)` — all `context` modes  | ✅     |
| `walk(ast, cb)` & `walk(ast, { visit, enter, leave })` | ✅ |
| `walk.skip` / `walk.stop`                    | ✅     |
| `this.atrule` / `this.rule` context inside callbacks | ✅ |
| `generate(node)`                             | ✅     |
| `clone(node)`                                | ✅     |
| `List` class — `forEach(data, item, list)`, `insert`, `remove`, `replace`, `prepend`, `append`, `prependList`, `appendList`, `insertList`, `createItem`, `first`, `last`, `isEmpty` | ✅ |
| Lexer (`syntax.lexer.match*`, `syntax.match*`) | ❌ — see below |

### `css-what`

| Surface              | Compat |
| -------------------- | ------ |
| `parse(selector)`    | ✅     |
| `stringify(ast)`     | ✅     |
| `isTraversal(token)` | ✅     |
| Selector segment shape (incl. `ignoreCase: 'quirks'`) | ✅ |

### `css-select`

| Surface                                     | Compat |
| ------------------------------------------- | ------ |
| `selectAll(sel, root, opts)`                | ✅     |
| `selectOne(sel, root, opts)`                | ✅     |
| `is(node, sel, opts)`                       | ✅     |
| `compile(sel, opts)`                        | ✅     |
| `Adapter` interface                         | ✅ — same shape, including state hooks (`isActive`, etc.) |
| `pseudos` extension                         | ✅     |
| `:has`, `:is`, `:not`, `:where`, `:matches` | ✅     |
| `:nth-child`, `:nth-last-child`, `:nth-of-type`, `:nth-last-of-type`, `:first-child`, `:last-child`, `:only-child`, `:first-of-type`, `:last-of-type`, `:only-of-type` | ✅ |
| `:empty`, `:root`, `:scope`                 | ✅     |
| Stateful pseudos via adapter hooks          | ✅     |

### `csso`

| Surface                                      | Compat |
| -------------------------------------------- | ------ |
| `minify(source, opts)`                       | ✅     |
| `minifyBlock(source, opts)`                  | ✅     |
| `syntax.specificity(node)`                   | ✅     |
| Restructuring across rules / selectors       | ❌ — declaration-level only |

## What's intentionally not ported

We dropped two large chunks of the original libs that real consumers
rarely need:

### `css-tree`'s lexer (`syntax.lexer`)

`css-tree` ships ~3000 lines of CSS spec data that lets you ask "is the
string `red 1px solid` a valid `<border>` shorthand?". This is great for
linters and editors, but downstream consumers like CSSO, SVGO, and most
formatters never touch it.

The AST that ts-css produces is **rich enough** for you to add lexer
behaviour back on top — every node carries its source slice and a typed
discriminated union, so a value-type checker is a straightforward
external library.

### CSSO's restructuring pass

`csso` does heroic work to merge declarations across rules:

```css
.a { color: red; padding: 4px }
.b { color: red }
.c { padding: 4px }
```

→ rewritten to share declarations between rules. Beyond gzip's reach
this saves **single-digit percent**, costs ~1000 lines, and breaks subtly
in edge cases (specificity, source-order dependencies, vendor-prefix
collisions). ts-css does declaration-level minification (numbers,
colors, dedup-within-rule) which catches the bulk of the bytes.

If you have a use case where restructuring matters, file an issue —
adding it back is straightforward, but we'd rather not ship dead code.

## Real-world swap: `ts-svg`

[`ts-svg`](https://github.com/stacksjs/ts-svg)'s SVGO port uses ts-css.
The migration was 7 files and looked like:

```diff
- import * as csstree from 'css-tree'
- import * as csswhat from 'css-what'
- import { is, selectAll, selectOne } from 'css-select'
- import { syntax } from 'csso'
- import * as csso from 'csso'

+ import { csstree, cssWhat as csswhat, csso, is, selectAll, selectOne } from '@stacksjs/ts-css'
+ const { syntax } = csso
```

The full SVGO test suite (82 tests) passes after the swap with no
behaviour changes, and removes 4 transitive dep trees from `node_modules`.
