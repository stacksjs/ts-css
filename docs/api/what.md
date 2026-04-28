# Selector parser API

Replaces `css-what`. Pure-string-to-selector-AST parsing — separate from
the matcher, so you can analyse selectors (specificity, rewrites, lint
rules) without running them.

```ts
import { isTraversal, parseSelector, stringifySelector } from '@stacksjs/ts-css'
// or:
import { parse, stringify, isTraversal } from '@stacksjs/ts-css/what'
```

## `parse(selector, options?)`

Parse a CSS selector string into a list-of-lists of selector segments.

```ts
parse(selector: string, options?: ParseOptions): Selector[][]
```

The outer array is **comma-separated selectors**; the inner arrays are
**simple selectors and combinators** in source order.

```ts
import { parse } from '@stacksjs/ts-css/what'

parse('div > p, .foo')
// [
//   [{type:'tag',name:'div'}, {type:'child'}, {type:'tag',name:'p'}],
//   [{type:'attribute',name:'class',action:'element',value:'foo'}],
// ]
```

### Options

| Option                       | Default | Description                                              |
| ---------------------------- | ------- | -------------------------------------------------------- |
| `xmlMode`                    | `false` | Disable HTML quirks (case-insensitive tags / attrs).     |
| `lowerCaseAttributeNames`    | `true`  | Lowercase attribute names (HTML default).                 |
| `lowerCaseTags`              | `true`  | Lowercase tag names.                                      |

## `stringify(ast)`

Inverse of `parse` — turn a selector AST back into a string.

```ts
stringify(ast: Selector[][]): string
```

```ts
import { parse, stringify } from '@stacksjs/ts-css/what'

const ast = parse('div > p:not(.x)')
stringify(ast) // 'div > p:not(.x)'
```

## `isTraversal(token)`

Returns `true` if `token` is a combinator (descendant / child / sibling /
adjacent / parent / column-combinator) and not a simple selector.

```ts
isTraversal(token: Selector): boolean
```

## Segment types

The `Selector` union contains:

```ts
type Selector =
  | { type: 'tag',                name: string, namespace: string | null }
  | { type: 'universal',                        namespace: string | null }
  | { type: 'attribute',          name: string, action: AttributeAction, value: string, namespace: string | null, ignoreCase: boolean | 'quirks' | null }
  | { type: 'pseudo',             name: string, data: string | Selector[][] | null }
  | { type: 'pseudo-element',     name: string, data: string | null }
  | { type: 'descendant' }
  | { type: 'child' }
  | { type: 'parent' }
  | { type: 'sibling' }
  | { type: 'adjacent' }
  | { type: 'column-combinator' }
```

`AttributeAction` is one of:
`'any'`, `'element'`, `'end'`, `'equals'`, `'exists'`, `'hyphen'`, `'not'`, `'start'`.

| `[a]` form           | `action`     |
| -------------------- | ------------ |
| `[a]`                | `'exists'`   |
| `[a="x"]`            | `'equals'`   |
| `[a~="x"]`           | `'element'`  |
| `[a\|="x"]`          | `'hyphen'`   |
| `[a^="x"]`           | `'start'`    |
| `[a$="x"]`           | `'end'`      |
| `[a*="x"]`           | `'any'`      |
| `[a!="x"]`           | `'not'`      |

## Pseudo-class shape

For pseudo-classes that take a selector list (`:is`, `:not`, `:where`,
`:has`, `:matches`, `:-moz-any`, `:-webkit-any`), the `data` field is
**already parsed** as a `Selector[][]`. For other pseudo-classes that take
a string (e.g. `:nth-child(2n+1)`), `data` is the raw inner string.
