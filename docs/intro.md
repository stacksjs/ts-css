# Getting started

`@stacksjs/ts-css` is a pure-TypeScript CSS toolkit — a parser, walker,
generator, selector engine, and minifier — all in one **zero-dependency**
package. It's a drop-in replacement for the four-library quartet most CSS
pipelines pull in:

| Replaces      | Provides                                              |
| ------------- | ----------------------------------------------------- |
| `css-tree`    | Tokenizer, parser, walker, generator, clone, `List`   |
| `css-what`    | Selector parser & stringifier                          |
| `css-select`  | `selectAll` / `selectOne` / `is` against any tree     |
| `csso`        | Minifier + `syntax.specificity`                        |

If you've worked with any of those four libraries before, the migration
is one block of `import` lines (see the [migration guide](./migration.md)).

## Install

```bash
bun add @stacksjs/ts-css
# or
npm i @stacksjs/ts-css
```

## Your first parse

```ts
import { generate, parse, walk } from '@stacksjs/ts-css'

const ast = parse('.foo { color: red }')

walk(ast, (node) => {
  if (node.type === 'Declaration')
    console.log(node.property)
})
// → "color"

console.log(generate(ast))
// → ".foo{color:red}"
```

That's the full pipeline: parse → walk/transform → generate.

## Exploring the AST

Pass a `context` to parse a fragment instead of a full stylesheet:

```ts
parse('color: red', { context: 'declaration' })
parse('color: red; font-size: 12px', { context: 'declarationList' })
parse('.a > .b', { context: 'selector' })
parse('@media (min-width: 800px)', { context: 'atrulePrelude' })
```

The full set of contexts is in the [parser API reference](./api/parse.md).

## Selecting nodes

`ts-css` ships a tree-agnostic selector engine. Provide an `Adapter` for
your tree and you can run any CSS selector against it:

```ts
import { selectAll } from '@stacksjs/ts-css'

const matches = selectAll('p > span.foo:not(.disabled)', root, {
  adapter: myAdapter,
  xmlMode: true,
})
```

[Full selector matcher API →](./api/select.md)

## Minifying

```ts
import { minify } from '@stacksjs/ts-css'

minify('.a { margin: 0px; color: #aabbcc }').css
// → ".a{margin:0;color:#abc}"
```

[Full minifier API →](./api/optimize.md)

## CLI

```bash
ts-css minify input.css > output.css
ts-css parse  input.css | jq
ts-css format input.css
```

## Where to next

- [**Parser** API](./api/parse.md) — `parse`, `walk`, `generate`, `clone`, `List`
- [**Selector parser** API](./api/what.md) — `parse`, `stringify`, `isTraversal`
- [**Selector matcher** API](./api/select.md) — `selectAll`, `selectOne`, `is`
- [**Optimizer** API](./api/optimize.md) — `minify`, `minifyBlock`, `specificity`
- [**Migration** guide](./migration.md) — moving off the four-library setup
