# Installation

Get started with ts-css by installing it via your package manager or using pre-built binaries.

## Package Managers

Install ts-css as a development dependency in your project:

::: code-group

```sh [bun]
bun add @stacksjs/ts-css

# or

bun install --dev @stacksjs/ts-css
```

```sh [npm]
npm install @stacksjs/ts-css

# or

npm i -D @stacksjs/ts-css
```

```sh [pnpm]
pnpm add @stacksjs/ts-css

# or

pnpm add -D @stacksjs/ts-css
```

```sh [yarn]
yarn add @stacksjs/ts-css
```:::

### Global Installation

For global installation (to use the CLI anywhere):

::: code-group```sh [bun]
bun add --global @stacksjs/ts-css

```

```sh [npm]

npm install --global @stacksjs/ts-css

# or

npm i -g @stacksjs/ts-css

```

```sh [pnpm]

pnpm add --global @stacksjs/ts-css

```

```sh [yarn]

yarn global add @stacksjs/ts-css

```:::

## Quick Start

After installation, initialize a new ts-css project:```bash

# Create configuration file

cssx init

# Build your CSS

cssx build

# Or use watch mode for development

cssx watch
```## Configuration

The`cssx init`command creates a basic`css.config.ts`file:```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
} satisfies CssOptions

export default config

```Customize this configuration to match your project structure. See the [Configuration Guide](./config.md) for all available options.

## Framework Integration

### React / Next.js```bash

# Install ts-css

bun add @stacksjs/ts-css

# Create config

cssx init
```Update your`css.config.ts`:

```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  output: './styles/styles.css',
} satisfies CssOptions

export default config
```Import the generated CSS in your app:```typescript

// app/layout.tsx or pages/_app.tsx
import './styles/styles.css'

```Add build scripts to`package.json`:

```json

{
  "scripts": {
    "dev": "cssx watch & next dev",
    "build": "cssx build && next build"
  }
}

```### Vue / Nuxt```bash

# Install ts-css

bun add @stacksjs/ts-css

# Create config

cssx init
```Update your`css.config.ts`:

```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  output: './assets/css/styles.css',
} satisfies CssOptions

export default config
```Import in your`app.vue`or main layout:```vue

<style>
@import './assets/css/styles.css';
</style>

```### Svelte / SvelteKit```bash

# Install ts-css

bun add @stacksjs/ts-css

# Create config

cssx init
```Update your`css.config.ts`:

```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  output: './static/styles.css',
} satisfies CssOptions

export default config
```Import in your root layout:```html

<!-- src/routes/+layout.svelte -->
<script>
  import '/static/styles.css'
</script>

```### Astro```bash

# Install ts-css

bun add @stacksjs/ts-css

# Create config

cssx init
```Update your`css.config.ts`:

```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  output: './public/styles.css',
} satisfies CssOptions

export default config

```Import in your base layout:```astro

---

// src/layouts/Layout.astro

import '/styles.css'
---

```### Plain HTML```bash

# Install ts-css globally

bun add --global @stacksjs/ts-css

# Create config

cssx init
```Update your`css.config.ts`:

```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.html'],
  output: './dist/styles.css',
} satisfies CssOptions

export default config
```Link the CSS in your HTML:```html

<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/dist/styles.css">
</head>
<body>
  <div class="flex items-center justify-center h-screen">
    <h1 class="text-4xl font-bold text-blue-500">Hello ts-css!</h1>
  </div>
</body>
</html>

```## Binaries

Pre-built binaries are available for different platforms. Download the binary that matches your platform and architecture:

::: code-group```sh [macOS (arm64)]

# Download the binary

curl -fL https://github.com/stacksjs/ts-css/releases/latest/download/cssx-darwin-arm64.zip -o cssx.zip
unzip cssx.zip

# Make it executable and move it to your PATH

chmod +x cssx-darwin-arm64
sudo mv cssx-darwin-arm64 /usr/local/bin/cssx
```

```sh [macOS (x64)]

# Download the binary

curl -fL https://github.com/stacksjs/ts-css/releases/latest/download/cssx-darwin-x64.zip -o cssx.zip
unzip cssx.zip

# Make it executable and move it to your PATH

chmod +x cssx-darwin-x64
sudo mv cssx-darwin-x64 /usr/local/bin/cssx
```

```sh [Linux (arm64)]

# Download the binary

curl -fL https://github.com/stacksjs/ts-css/releases/latest/download/cssx-linux-arm64.zip -o cssx.zip
unzip cssx.zip

# Make it executable and move it to your PATH

chmod +x cssx-linux-arm64
sudo mv cssx-linux-arm64 /usr/local/bin/cssx
```

```sh [Linux (x64)]

# Download the binary

curl -fL https://github.com/stacksjs/ts-css/releases/latest/download/cssx-linux-x64.zip -o cssx.zip
unzip cssx.zip

# Make it executable and move it to your PATH

chmod +x cssx-linux-x64
sudo mv cssx-linux-x64 /usr/local/bin/cssx
```

```sh [Windows (x64)]

# Download the binary

curl -L <https://github.com/stacksjs/ts-css/releases/latest/download/cssx-windows-x64.exe> -o cssx.exe

# Move it to your PATH (adjust the path as needed)

move cssx.exe C:\Windows\System32\cssx.exe
```:::

::: tip
You can also find ts-css binaries in [GitHub releases](https://github.com/stacksjs/ts-css/releases).
:::

## Verify Installation

Verify that ts-css is installed correctly:```bash
cssx --version

```You should see the installed version number.

## Development Workflow

### Watch Mode

During development, use watch mode to automatically rebuild CSS when files change:```bash
cssx watch
```This will:

- Watch all files matching your content patterns
- Automatically rebuild CSS on changes
- Show build statistics in the terminal

### Build for Production

When building for production:```bash
cssx build --minify

```Or configure minification in your`css.config.ts`:

```typescript

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
  minify: process.env.NODE_ENV === 'production',
} satisfies CssOptions

```## Next Steps

- [Configuration Guide](./config.md) - Learn about all configuration options
- [Usage Guide](./usage.md) - Start using utility classes
- [CLI Reference](./features/cli.md) - Explore all CLI commands
- [Compile Class Transformer](./features/compile-class.md) - Optimize your HTML

## Troubleshooting

### Bun Not Found

If you get a "bun: command not found" error, install Bun:```bash
curl -fsSL <https://bun.sh/install> | bash
```### Permission Denied

If you get permission errors when installing globally:```bash

# Use sudo on macOS/Linux

sudo bun add --global @stacksjs/ts-css

# Or install locally and use npx

bun add @stacksjs/ts-css
bunx cssx build

```### TypeScript Errors

If you encounter TypeScript errors in your config file:

1. Ensure you have TypeScript installed:```bash

   bun add --dev typescript
   ```2. Use the`satisfies`keyword for type checking:```typescript
   import type { CssOptions } from '@stacksjs/ts-css/engine'

   const config = {
     content: ['./src/**/*.tsx'],
     output: './dist/styles.css',
   } satisfies CssOptions
   ```### Build Errors

If the build fails:

1. Check that your content patterns are correct
2. Ensure the output directory exists or can be created
3. Run with`--verbose`for detailed error information:```bash

   cssx build --verbose
   ```

## Support

- [GitHub Issues](https://github.com/stacksjs/ts-css/issues)
- [Documentation](https://github.com/stacksjs/ts-css/tree/main/docs)
- [Discord Community](https://stacksjs.com/discord)
