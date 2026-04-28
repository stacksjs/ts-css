# Usage

`@stacksjs/ts-css` is a library first, with a small CLI on top. Most
consumers import it as a library; the CLI is a convenience wrapper for
ad-hoc minification and AST inspection.

## Library

### Full pipeline: parse → walk → generate

```ts
import { generate, parse, walk } from '@stacksjs/ts-css'

const ast = parse(`
  .foo {
    color: red;
    background: url("/assets/bg.png");
  }
`)

walk(ast, {
  visit: 'Url',
  enter(url) {
    console.log('asset:', url.value)
  },
})

console.log(generate(ast))
```

### Selector matching against your tree

```ts
import { selectAll } from '@stacksjs/ts-css'

interface MyEl {
  type: 'el'
  name: string
  attrs: Record<string, string>
  children: MyEl[]
  parent: MyEl | null
}

const adapter = {
  isTag: (n: any): n is MyEl => n?.type === 'el',
  getName: (e: MyEl) => e.name,
  getParent: (e: MyEl) => e.parent,
  getChildren: (e: MyEl) => e.children,
  getSiblings: (e: MyEl) => e.parent?.children ?? [e],
  getAttributeValue: (e: MyEl, n: string) => e.attrs[n],
  hasAttrib: (e: MyEl, n: string) => n in e.attrs,
  getText: () => '',
  removeSubsets: (xs: any[]) => xs,
  existsOne: (test: (e: MyEl) => boolean, xs: any[]): boolean =>
    xs.some(x => adapter.isTag(x) && (test(x) || adapter.existsOne(test, x.children))),
  findAll: (test: (e: MyEl) => boolean, xs: any[]): MyEl[] => {
    const out: MyEl[] = []
    for (const x of xs) {
      if (adapter.isTag(x)) {
        if (test(x)) out.push(x)
        out.push(...adapter.findAll(test, x.children))
      }
    }
    return out
  },
  findOne: (test: (e: MyEl) => boolean, xs: any[]): MyEl | null => {
    for (const x of xs) {
      if (adapter.isTag(x)) {
        if (test(x)) return x
        const r = adapter.findOne(test, x.children)
        if (r) return r
      }
    }
    return null
  },
}

const matches = selectAll('p > .foo:not(.disabled)', root, {
  adapter,
  xmlMode: true,
})
```

### Minify a stylesheet

```ts
import { minify } from '@stacksjs/ts-css'

const { css } = minify(input, {
  comments: 'exclamation', // keep `/*!*/` comments
})
```

### Compute selector specificity

```ts
import { parse, syntax } from '@stacksjs/ts-css'

const sel = parse('#a.b div', { context: 'selector' })
syntax.specificity(sel) // [1, 1, 1]
```

## CLI

```sh
ts-css <command> <file>
```

| Command         | Output                                               |
| --------------- | ---------------------------------------------------- |
| `minify <file>` | Minified CSS on stdout.                              |
| `parse <file>`  | The parsed AST as JSON on stdout.                    |
| `format <file>` | Round-trip through parser/generator (deterministic). |
| `version`       | Print the installed CLI version.                     |

### Examples

```sh
# Minify a stylesheet, write to disk
ts-css minify src/app.css > dist/app.css

# Inspect the AST of a snippet
echo '.a { color: red }' > /tmp/snip.css
ts-css parse /tmp/snip.css | jq '.children[0]'

# Format-only round trip
ts-css format src/app.css
```

### Flags

`ts-css minify`:

| Flag             | Description                          |
| ---------------- | ------------------------------------ |
| `--no-comments`  | Strip `/*!*/` comments too.          |
| `--block`        | Treat input as a `style="…"` body.   |

`ts-css parse`:

| Flag           | Description                                         |
| -------------- | --------------------------------------------------- |
| `--positions`  | Track source-location info on every AST node.       |

## Configuration

You can drop a `css.config.ts` at the project root for defaults:

```ts
// css.config.ts
import type { CSSOptions } from '@stacksjs/ts-css'

const config: CSSOptions = {
  floatPrecision: 3,
  verbose: false,
}

export default config
```

`ts-css` loads it via [`bunfig`](https://github.com/stacksjs/bunfig) — the
same loader used across the Stacks toolchain.
