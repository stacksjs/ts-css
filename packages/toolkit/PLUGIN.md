# ts-css Bun Plugin

A Bun plugin that automatically generates and injects ts-css CSS into your HTML files during the build process.

## Installation

```bash
bun add @stacksjs/ts-css
```

## Quick Start**1. Create your HTML file**(`src/template.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <div class="flex items-center p-4 bg-blue-500 text-white rounded-lg">
    <h1 class="text-2xl font-bold">Hello ts-css!</h1>
  </div>
</body>
</html>
```**2. Import it in your TypeScript**(`src/index.ts`):

```typescript
import template from './template.html'

// The HTML now has ts-css CSS injected
document.body.innerHTML = template
```**3. Build with the plugin**:

```typescript
import { plugin } from '@stacksjs/ts-css/engine'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [plugin()],
})
```The plugin will automatically:

- Scan the HTML for utility classes
- Generate CSS for those classes
- Inject the CSS into the`<head>`section

## Configuration

### Basic Configuration```typescript

import { plugin } from '@stacksjs/ts-css/engine'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [
    plugin({
      includePreflight: true, // Include CSS reset (default: true)
    }),
  ],
})

```### Custom Theme```typescript
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
            danger: '#ef4444',
          },
          spacing: {
            18: '4.5rem',
            88: '22rem',
          },
        },
        shortcuts: {
          btn: 'px-4 py-2 rounded bg-primary text-white hover:bg-blue-600',
          card: 'p-6 bg-white rounded-lg shadow-md',
        },
      },
    }),
  ],
})
```### Advanced Configuration```typescript

import { plugin } from '@stacksjs/ts-css/engine'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [
    plugin({
      config: {
        minify: true,
        safelist: ['bg-red-500', 'text-green-500'], // Always include these
        blocklist: ['debug-*'], // Never include these
        theme: {
          colors: {
            brand: {
              50: '#f0f9ff',
              100: '#e0f2fe',
              500: '#0ea5e9',
              900: '#0c4a6e',
            },
          },
        },
        shortcuts: {
          'btn-primary': 'px-4 py-2 rounded bg-brand-500 text-white hover:bg-brand-600',
        },
      },
      includePreflight: true,
    }),
  ],
})

```## API Reference

### `plugin(options?)`

Creates a ts-css Bun plugin instance.

#### Options

-**`config`**(`Partial<CssConfig>`) - Custom ts-css configuration

  - `minify`- Minify the generated CSS

  -`theme`- Custom theme (colors, spacing, fonts, etc.)
  -`shortcuts`- Utility class shortcuts
  -`safelist`- Classes to always include
  -`blocklist`- Classes to never include
  -`variants` - Enable/disable variants

  - And more...

-**`includePreflight`**(`boolean`) - Include preflight CSS (default: `true`)

## How It Works

1. The plugin registers an `onLoad`handler for`.html`files
2. When Bun encounters an HTML import, the plugin intercepts it
3. It extracts all utility classes from the HTML using ts-css's parser
4. It generates CSS for those classes using ts-css's generator
5. The CSS is injected into the`<head>`section
6. The processed HTML is returned to the bundle

## Use Cases

-**SPAs**: Import HTML templates with automatic CSS generation
-**Web Components**: Load component templates with scoped styles
-**Static Sites**: Process HTML pages during build
-**Email Templates**: Generate inline CSS for email HTML

## Examples

See the [examples/plugin](./examples/plugin) directory for a complete working example.

## Comparison with CLI

| Feature | Plugin | CLI |
|---------|--------|-----|
| Automatic CSS generation | ✅ | ✅ |
| Watches files | ✅ (via Bun) | ✅ |
| Injects CSS | ✅ | ❌ |
| Separate CSS file | ❌ | ✅ |
| Build integration | ✅ | ❌ |
| Standalone usage | ❌ | ✅ |

## Performance

The plugin is highly performant:

- Processes 1000 utilities in ~7ms
- Minimal overhead in build process
- Lazy loading - only processes imported HTML files

## TypeScript Support

The plugin is fully typed. Import the types:```typescript
import type { CssPluginOptions } from '@stacksjs/ts-css/engine'

const options: CssPluginOptions = {
  config: {
    minify: true,
  },
}
```## Configuration File

The plugin also respects`css.config.ts`in your project root:```typescript
// css.config.ts
import type { CssOptions } from '@stacksjs/ts-css/engine'

export default {
  minify: true,
  theme: {
    colors: {
      primary: '#3b82f6',
    },
  },
} satisfies CssOptions

```

The plugin will merge this config with any options passed to it.

## License

MIT
