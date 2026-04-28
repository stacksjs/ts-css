# Parser API

Replaces `css-tree`. Tokenizer, recursive-descent parser, walker,
generator, deep clone, and a doubly-linked `List`.

```ts
import { clone, generate, List, parse, walk } from '@stacksjs/ts-css'
// or, when you only need the parser:
import { /* … */ } from '@stacksjs/ts-css/parse'
```

## `parse(source, options?)`

Parse a CSS source string into an AST.

```ts
parse(source: string, options?: ParseOptions): CssNode
```

### Options

| Option                  | Default        | Description                                                              |
| ----------------------- | -------------- | ------------------------------------------------------------------------ |
| `context`               | `'stylesheet'` | What grammar to parse against (see below).                              |
| `parseValue`            | `true`         | When `false`, declaration values are stored as `Raw` nodes.             |
| `parseAtrulePrelude`    | `true`         | When `false`, at-rule preludes are stored as `Raw`.                     |
| `parseRulePrelude`      | `true`         | When `false`, rule preludes (selector lists) are stored as `Raw`.       |
| `parseCustomProperty`   | `false`        | When `true`, custom property values are parsed (otherwise `Raw`).        |
| `positions`             | `false`        | Track source `loc` info on every node.                                  |
| `filename`              | —              | Source filename, used in `loc.source`.                                  |
| `onParseError`          | —              | Called when the parser substitutes a `Raw` node for an error.            |

### Parse contexts

| `context`           | Returns                              | Use for                                              |
| ------------------- | ------------------------------------ | ---------------------------------------------------- |
| `'stylesheet'`      | `StyleSheet`                         | Top-level CSS files (default)                        |
| `'atrule'`          | `Atrule \| StyleSheet`               | A single `@rule …;` or `@rule { … }`                  |
| `'atrulePrelude'`   | `AtrulePrelude`                      | The `(min-width: 800px)` part of a media query        |
| `'rule'`            | `Rule`                               | A single `selector { … }` block                       |
| `'block'`           | `Block`                              | Just the `{ decl; decl; }` body                       |
| `'declarationList'` | `DeclarationList`                    | A `style="…"` attribute body                          |
| `'declaration'`     | `Declaration`                        | A single `prop: value;` line                          |
| `'value'`           | `Value`                              | Just the value side of a declaration                  |
| `'selector'`        | `Selector`                           | A single selector segment (`a > b`)                   |
| `'selectorList'`    | `SelectorList`                       | A comma-separated list (`a, b > c`)                   |

## `walk(ast, visitor)`

Recursively traverse the AST.

```ts
walk(ast: CssNode, visitor: WalkVisitor): symbol | undefined
```

`visitor` is either:
- A function: `(node, item, list) => void | symbol`
- An object: `{ visit?, enter?, leave?, reverse? }`

Inside callbacks, `this` carries traversal context: `this.atrule`,
`this.rule`, `this.selector`, `this.declaration`, etc.

```ts
walk(ast, {
  visit: 'Declaration',
  enter(decl) {
    if (decl.property === 'color')
      decl.value = parse('blue', { context: 'value' })
  },
})
```

### Sentinels

| Constant      | What it does                                              |
| ------------- | --------------------------------------------------------- |
| `walk.skip`   | Return from `enter` to skip the node's children.          |
| `walk.stop`   | Return to halt the entire traversal.                       |

## `generate(node)`

Serialize an AST node back to a CSS string. Output is compact (no
unnecessary whitespace) — comparable to `csstree.generate(node)` with
no formatting options.

```ts
generate(node: CssNode): string
```

## `clone(node)`

Deep-clone an AST node, preserving the `List` structure of children.

```ts
clone<T extends CssNode>(node: T): T
```

## `List<T>`

Doubly linked list — every container node uses one for its `children`.

```ts
import { List } from '@stacksjs/ts-css'

const list = new List<number>()
list.appendData(1)
list.appendData(2)
list.toArray() // [1, 2]
```

### Mutation methods

| Method                      | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `appendData(data)`          | Append a new item built from `data`.               |
| `prependData(data)`         | Prepend a new item.                                |
| `insertData(data, before?)` | Insert before `before` (a `ListItem`), or at tail. |
| `insert(item, before?)`     | Insert an existing `ListItem`.                     |
| `remove(item)`              | Detach an item from the list.                      |
| `replace(old, newItem)`     | Replace `old` with `newItem` (or another `List`).  |
| `clear()`                   | Detach all items.                                  |

### Iteration

| Method                          | Callback signature                              |
| ------------------------------- | ----------------------------------------------- |
| `forEach(fn)`                   | `(data, item, list)` — matches `css-tree`.      |
| `forEachRight(fn)`              | Same, in reverse.                               |
| `reduce(fn, init)`              | `(acc, data, index, list)`                      |
| `some(fn)`                      | `(data, index, list) => boolean`                |
| `map(fn)`                       | Returns a new `List`.                           |
| `filter(fn)`                    | Returns a new `List`.                           |

The `forEach` / `forEachRight` callbacks honor a cursor protocol so
callbacks can safely insert/remove items mid-walk without breaking the
iterator.

## AST node reference

The full discriminated union is `CssNode`. The most common variants:

```ts
interface StyleSheet  { type: 'StyleSheet',  children: List<CssNode> }
interface Rule        { type: 'Rule',        prelude: SelectorList | Raw, block: Block }
interface Atrule      { type: 'Atrule',      name: string, prelude: AtrulePrelude | Raw | null, block: Block | null }
interface Block       { type: 'Block',       children: List<CssNode> }
interface Declaration { type: 'Declaration', property: string, value: Value | Raw, important: boolean | string }
interface Value       { type: 'Value',       children: List<CssNode> }
interface Selector    { type: 'Selector',    children: List<CssNode> }
// + identifiers, numbers, dimensions, hashes, urls, functions, …
```

See `src/parse/types.ts` for the complete type definitions.

## Tokenizer (advanced)

If you need raw token output, import `Tokenizer` directly:

```ts
import { Tokenizer, TokenType } from '@stacksjs/ts-css/parse'

const t = new Tokenizer('.foo { color: red }')
for (const tok of t.tokens) {
  console.log(TokenType[tok.type], tok.start, tok.end)
}
```
