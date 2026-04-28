# Install

`@stacksjs/ts-css` is a single package. There are no transitive dependencies.

## Package managers

::: code-group

```sh [bun]
bun add @stacksjs/ts-css
# or, dev dependency
bun add --dev @stacksjs/ts-css
```

```sh [npm]
npm install @stacksjs/ts-css
# or, dev dependency
npm install --save-dev @stacksjs/ts-css
```

```sh [pnpm]
pnpm add @stacksjs/ts-css
# or, dev dependency
pnpm add --save-dev @stacksjs/ts-css
```

```sh [yarn]
yarn add @stacksjs/ts-css
```

:::

## Local development with `bun link`

If you're contributing to ts-css and want to test the changes against
another project locally, register it once with `bun link`:

```sh
# inside the ts-css repo
bun link

# inside the consumer project
bun link @stacksjs/ts-css
```

That's how [`ts-svg`](https://github.com/stacksjs/ts-svg) consumes ts-css
during development — its `package.json` carries
`"@stacksjs/ts-css": "link:@stacksjs/ts-css"`.

## CLI binary (optional)

The `ts-css` CLI ships with the package and is exposed via Bun's `bin`
field. After installing, you can run:

```sh
bunx ts-css minify input.css
```

For a standalone binary, build from source:

```sh
bun run compile           # builds bin/ts-css for your platform
bun run compile:all       # cross-compile for darwin/linux/windows
```

## Verifying the install

```ts
import { minify, parse } from '@stacksjs/ts-css'

console.log(minify('.a { color: #aabbcc }').css)
// → ".a{color:#abc}"
```

If that prints the minified output, you're set. Continue to
[**Getting started**](./intro.md).
