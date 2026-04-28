# Selector matcher API

Replaces `css-select`. Run any CSS selector against any tree-like data
structure via an `Adapter`.

```ts
import { compile, is, selectAll, selectOne } from '@stacksjs/ts-css'
// or:
import { /* … */ } from '@stacksjs/ts-css/select'
```

## `selectAll(selector, root, options)`

Return every element under `root` that matches `selector`.

```ts
selectAll<Node, ElementNode extends Node>(
  selector: string | Selector[][] | CompiledQuery<ElementNode>,
  root: Node | Node[],
  options: Options<Node, ElementNode>,
): ElementNode[]
```

## `selectOne(selector, root, options)`

Return the first match (in document order), or `null`.

```ts
selectOne(...): ElementNode | null
```

## `is(node, selector, options)`

Test whether `node` itself matches `selector`.

```ts
is(node, selector, options): boolean
```

## `compile(selector, options)`

Compile a selector once and reuse the predicate against many trees.

```ts
const test = compile('p > span.foo', options)
adapter.findAll(test, [root])
```

## `Adapter<Node, ElementNode>`

The adapter is the tree-access contract. Every method has the same
signature as `css-select`'s — if you already have one, it works as-is.

| Method                                            | Returns                          | Purpose                                         |
| ------------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| `isTag(node)`                                     | `node is ElementNode`            | Type guard for element-vs-text/comment.         |
| `getName(elem)`                                   | `string`                         | Element tag name.                                |
| `getAttributeValue(elem, name)`                   | `string \| undefined`            | Attribute value (case-sensitive on `name`).      |
| `hasAttrib(elem, name)`                           | `boolean`                        | Whether `elem[name]` is set.                     |
| `getChildren(node)`                               | `Node[]`                         | Direct children of `node`.                       |
| `getParent(elem)`                                 | `ElementNode \| null`            | Parent element (or null for the root).          |
| `getSiblings(elem)`                               | `Node[]`                         | All siblings, including `elem`.                 |
| `getText(node)`                                   | `string`                         | Text content (used by some pseudos).            |
| `findAll(test, elems)`                            | `ElementNode[]`                  | DFS traversal.                                  |
| `findOne(test, elems)`                            | `ElementNode \| null`            | DFS, first match.                               |
| `existsOne(test, elems)`                          | `boolean`                        | DFS, just a check.                              |
| `removeSubsets(nodes)`                            | `Node[]`                         | Remove descendants when their ancestor is also in `nodes`. |

Optional state-aware hooks (always called for `:hover` / `:active` /
`:visited`):

| Method                | Default          | When you'd implement it                       |
| --------------------- | ---------------- | --------------------------------------------- |
| `isActive(elem)`      | always `false`   | DOM-aware match for `:active`                 |
| `isHovered(elem)`     | always `false`   | DOM-aware match for `:hover`                  |
| `isVisited(elem)`     | always `false`   | DOM-aware match for `:visited`                |
| `equals(a, b)`        | `===`            | Custom node equality (rare).                   |

If your tree has no notion of focus/hover, leave these undefined — the
matcher treats stateful pseudos as never-matching.

## `Options`

| Option                       | Default | Description                                                          |
| ---------------------------- | ------- | -------------------------------------------------------------------- |
| `adapter`                    | —       | **Required.** The `Adapter` for your tree.                           |
| `xmlMode`                    | `false` | Disable HTML quirks (case-insensitive tags / attrs).                 |
| `lowerCaseAttributeNames`    | `true`  | Lowercase attribute names before matching.                           |
| `lowerCaseTags`              | `true`  | Lowercase tag names.                                                  |
| `cacheResults`               | `true`  | Cache compiled selectors keyed by selector string.                   |
| `context`                    | —       | Reference node(s) for `:scope`.                                      |
| `pseudos`                    | —       | Map of custom pseudo-class implementations.                          |
| `relativeSelector`           | —       | Match `:has` lazily.                                                  |
| `quirksMode`                 | `false` | Match HTML quirks-mode attribute case rules.                         |

## Supported selectors

| Category              | Examples                                            |
| --------------------- | --------------------------------------------------- |
| Type / universal      | `div`, `*`, `svg\|circle` (namespaces in xmlMode)   |
| Class / id            | `.foo`, `#bar`                                       |
| Attribute             | `[a]`, `[a=x]`, `[a~=x]`, `[a\|=x]`, `[a^=x]`, `[a$=x]`, `[a*=x]` (with `i` / `s` case flags) |
| Combinators           | `a b`, `a > b`, `a + b`, `a ~ b`, `a \|\| b`         |
| Structural pseudos    | `:first-child`, `:last-child`, `:only-child`, `:first-of-type`, `:last-of-type`, `:only-of-type`, `:nth-child(...)`, `:nth-last-child(...)`, `:nth-of-type(...)`, `:nth-last-of-type(...)` |
| Logical pseudos       | `:is(...)`, `:not(...)`, `:where(...)`, `:has(...)`, `:matches(...)` |
| Other pseudos         | `:empty`, `:root`, `:scope`                          |
| Stateful pseudos      | `:hover`, `:active`, `:visited`, `:focus`, etc. — gated on adapter `is*` hooks. |

## Custom pseudo-classes

Add your own via `options.pseudos`:

```ts
selectAll(':my-thing', root, {
  adapter,
  pseudos: {
    'my-thing': elem => adapter.getName(elem).startsWith('x-'),
  },
})
```

The value is either a predicate `(elem, arg?) => boolean` or a string
selector that the matcher will compile.
