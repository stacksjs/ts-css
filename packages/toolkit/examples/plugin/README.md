# ts-css Bun Plugin Example

This example demonstrates how to use the ts-css Bun plugin to automatically generate and inject CSS into your HTML files during the build process.

## Project Structure

```examples/plugin/
├── src/
│   ├── index.ts       # TypeScript entrypoint that imports HTML
│   └── index.html     # HTML file with utility classes
├── build.ts           # Build script
└── README.md```## Usage

The plugin works by intercepting HTML imports in your TypeScript/JavaScript code. When you import an HTML file, the plugin:

1. Scans the HTML for ts-css utility classes
2. Generates the corresponding CSS
3. Injects the CSS into the`<head>`section
4. Returns the processed HTML

### Basic Setup```typescript

import { plugin } from '@stacksjs/ts-css/engine'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [plugin()],
})
```**Your TypeScript file**(`src/index.ts`):

```typescript
import html from './index.html'

// Use the HTML content (it will have CSS injected)
document.body.innerHTML = html
```### With Custom Configuration```typescript

import { plugin } from '@stacksjs/ts-css/engine'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [
    plugin({
      config: {
        minify: true,
        theme: {
          colors: {
            primary: '#3b82f6',
            secondary: '#10b981',
          },
        },
      },
      includePreflight: true,
    }),
  ],
})

```## Running This Example```bash

# Build the example

bun run build.ts

# The output will be in ./dist/

```## How It Works

1. The plugin hooks into Bun's module loading system via`onLoad`2. When a`.html`file is imported, the plugin intercepts the load
3. It extracts utility classes from the HTML using ts-css's parser
4. It generates CSS for those classes using ts-css's generator
5. The generated CSS is injected into the`<head>`section
6. The processed HTML is returned as a string in the bundled output

## Options

### `config`Custom ts-css configuration to override defaults. This can include

-`minify`: Minify the generated CSS

- `theme`: Custom theme colors, spacing, fonts, etc.
- `shortcuts`: Define utility class shortcuts
- `safelist`: Classes to always include
- And more...

### `includePreflight`Whether to include preflight (reset) CSS. Default:`true`

## Use Cases

This plugin is ideal for:

- Single Page Applications (SPAs) that import HTML templates
- Component-based architectures where HTML is imported as strings
- Build processes that need automatic CSS generation from HTML
- Projects using Bun's native bundler with HTML assets
