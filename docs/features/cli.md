# CLI Commands

ts-css provides a powerful command-line interface for building, watching, and analyzing your CSS.

## Installation

Install ts-css globally or locally:

```bash

# Global (use anywhere)

bun add --global @stacksjs/ts-css

# Local (project-specific)

bun add @stacksjs/ts-css
```## Commands

### `build`Build CSS from your content files.```bash

cssx build [options]

```**Options:**- `--output <path>`- Output CSS file path
-`--minify`- Minify CSS output
-`--watch`- Watch for file changes
-`--content <pattern>`- Content file pattern
-`--config <path>`- Path to config file
-`--verbose`- Show detailed output
-`--no-preflight` - Skip preflight CSS**Examples:**```bash

# Basic build

cssx build

# Build with custom output

cssx build --output ./dist/styles.css

# Build and minify

cssx build --minify

# Build with specific content

cssx build --content "./src/**/*.tsx"

# Build with custom config

cssx build --config ./custom.config.ts

# Build with verbose output

cssx build --verbose

# Build without preflight CSS

cssx build --no-preflight
```**Output:**```bash

🚀 Building CSS...
✅ Built 1243 classes in 8.45ms
📝 Output: ./dist/styles.css
📦 File size: 24.35 KB

```###`watch`Build and watch for changes (equivalent to`build --watch`).

```bash

cssx watch [options]

```**Options:**- `--output <path>`- Output CSS file path
-`--minify`- Minify CSS output
-`--content <pattern>`- Content file pattern
-`--config <path>`- Path to config file
-`--verbose` - Show detailed output**Examples:**```bash

# Basic watch mode

cssx watch

# Watch with custom output

cssx watch --output ./dist/styles.css

# Watch with minification

cssx watch --minify

# Watch with verbose output

cssx watch --verbose
```**Output:**```bash

🚀 Building CSS...
✅ Built 1243 classes in 8.45ms
📝 Output: ./dist/styles.css
📦 File size: 24.35 KB
👀 Watching for changes...

👀 Watching: ./src, ./components

📝 src/App.tsx changed, rebuilding...
✅ Built 1245 classes in 7.23ms

```###`init`Create a`css.config.ts`configuration file.```bash
cssx init [options]
```**Options:**- `--force` - Overwrite existing config file**Examples:**```bash

# Create config

cssx init

# Force overwrite

cssx init --force

```**Output:**```bash
✅ Created css.config.ts

Next steps:

  1. Update the content paths in css.config.ts
  2. Run: cssx build

```**Generated file:**```typescript

import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
  minify: false,
  watch: false,
} satisfies CssOptions

export default config

```###`analyze`Analyze utility class usage and show statistics.```bash
cssx analyze [options]
```**Options:**- `--config <path>`- Path to config file

-`--verbose`- Show detailed output
-`--json`- Output as JSON
-`--top <n>` - Show top N most used classes (default: 10)**Examples:**```bash

# Basic analysis

cssx analyze

# Show top 20 utilities

cssx analyze --top 20

# JSON output

cssx analyze --json

# Detailed analysis

cssx analyze --verbose

```**Output:**```bash
🔍 Analyzing utility classes...

📊 Total classes: 1243
⏱️  Build time: 8.45ms
📦 Output size: 24.35 KB

🏷️  Utility groups (top 10):
  flex                 156 classes
  text                 142 classes
  bg                   98 classes
  p                    87 classes
  m                    76 classes
  w                    54 classes
  h                    43 classes
  border               38 classes
  rounded              32 classes
  shadow               28 classes
```**JSON output**(`--json`):

```json
{
  "totalClasses": 1243,
  "buildTime": 8.45,
  "outputSize": 24932,
  "utilityGroups": {
    "flex": 156,
    "text": 142,
    "bg": 98
  },
  "topClasses": [
    "flex",
    "items-center",
    "justify-between"
  ]
}
```###`clean`Remove the output CSS file.```bash

cssx clean [options]

```**Options:**- `--config <path>` - Path to config file**Examples:**```bash

# Clean output

cssx clean

# Clean with custom config

cssx clean --config ./custom.config.ts
```**Output:**```bash

✅ Removed ./dist/styles.css

```###`preflight`Generate only the preflight (reset) CSS.```bash
cssx preflight [options]
```**Options:**- `--output <path>`- Output CSS file path (default:`./preflight.css`)**Examples:**```bash

# Generate preflight CSS

cssx preflight

# Custom output path

cssx preflight --output ./reset.css

```**Output:**```bash
✅ Generated preflight CSS
📝 Output: ./preflight.css
📦 File size: 3.21 KB
```###`version`Show the ts-css version.```bash

cssx version

# or

cssx --version

```**Output:**```bash
1.0.0
```###`help`Show help information.```bash

cssx --help

# or

cssx [command] --help

```## Global Options

These options work with all commands:

-`--config <path>`- Path to custom config file
-`--verbose`- Show detailed output

## Configuration Priority

CLI options override configuration file settings:```bash

# Config file specifies: output: './dist/styles.css'

cssx build --output ./public/app.css

# Actual output: ./public/app.css (CLI option wins)

```Priority order (highest to lowest):

1. CLI options
2. Config file
3. Default values

## Using with Package Managers

### Bun (recommended)```bash

# Run locally installed

bunx cssx build

# Run scripts

bun run build

```### npm```bash

# Run locally installed

npx cssx build

# Run scripts

npm run build
```### pnpm```bash

# Run locally installed

pnpm dlx cssx build

# Run scripts

pnpm build

```### Yarn```bash

# Run locally installed

yarn cssx build

# Run scripts

yarn build
```## npm Scripts

Add ts-css commands to your`package.json`:

```json
{
  "scripts": {
    "dev": "cssx watch & vite dev",
    "build": "cssx build --minify && vite build",
    "css:build": "cssx build",
    "css:watch": "cssx watch",
    "css:analyze": "cssx analyze --verbose",
    "css:clean": "cssx clean"
  }
}
```## Continuous Integration

### GitHub Actions```yaml

# .github/workflows/ci.yml

name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:

      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies

        run: bun install

      - name: Build CSS

        run: bun run cssx build --minify

      - name: Run tests

        run: bun test

```### GitLab CI```yaml

# .gitlab-ci.yml

build:
  image: oven/bun:latest
  script:

    - bun install
    - bun run cssx build --minify

  artifacts:
    paths:

      - dist/styles.css

```### Vercel```json

{
  "buildCommand": "cssx build --minify && next build",
  "outputDirectory": ".next"
}

```### Netlify```toml
[build]
command = "cssx build --minify && npm run build"
publish = "dist"
```## Advanced Usage

### Custom Configuration Files

Specify different configs for different environments:```bash

# Development

cssx build --config ./css.dev.config.ts

# Production

cssx build --config ./css.prod.config.ts --minify

# Testing

cssx build --config ./css.test.config.ts

```### Programmatic Usage

While the CLI is convenient, you can also use ts-css programmatically:```typescript
import { build, buildAndWrite } from '@stacksjs/ts-css/engine'

// Build only (get result)
const result = await build({
  content: ['./src/**/*.tsx'],
  output: './dist/styles.css',
  minify: true,
})

console.log(`Built ${result.classes.size} classes in ${result.duration}ms`)

// Build and write to file
await buildAndWrite({
  content: ['./src/**/*.tsx'],
  output: './dist/styles.css',
  minify: true,
})
```### Combine Multiple Commands```bash

# Clean, build, and analyze

cssx clean && cssx build --minify && cssx analyze

# Watch in one terminal, dev server in another

cssx watch &
npm run dev

```### Environment Variables

Use environment variables for dynamic configuration:```bash

# Set environment

export NODE_ENV=production

# Build with env-specific config

cssx build --minify
```

```typescript
// css.config.ts
const isProd = process.env.NODE_ENV === 'production'

const config = {
  output: isProd ? './dist/styles.min.css' : './dist/styles.css',
  minify: isProd,
}
```

## Troubleshooting

### Command Not Found**Problem:**`command not found: cssx`**Solutions:**1. Install globally

   ```bash
   bun add --global @stacksjs/ts-css
   ```2. Or use with package runner:```bash
   bunx cssx build

# or

   npx cssx build
   ```3. Or use npm scripts:```json
   {
     "scripts": {
       "build": "cssx build"
     }
   }
   ```### Permission Denied**Problem:**Permission errors when writing files**Solutions:**1. Check output directory permissions:```bash
   ls -la ./dist
   ```2. Create directory if it doesn't exist:```bash
   mkdir -p ./dist
   ```3. Fix permissions:```bash
   chmod -R u+w ./dist
   ```### Config Not Loading**Problem:**Custom config not being used**Solutions:**1. Verify config path:```bash
   cssx build --config ./css.config.ts --verbose
   ```2. Check config file syntax:```typescript
   // Must have default export
   export default config
   ```3. Ensure TypeScript is installed:```bash
   bun add --dev typescript
   ```### Build Failures**Problem:**Build fails with errors**Solutions:**1. Run with verbose output:```bash
   cssx build --verbose
   ```2. Check content patterns:```bash

# Test if files exist

   ls -la ./src/**/*.tsx
   ```3. Validate config:```typescript
   // Use type checking
   import type { CssOptions } from '@stacksjs/ts-css/engine'

   const config = {
     content: ['./src/**/*.tsx'],
     output: './dist/styles.css',
   } satisfies CssOptions // Type error will show if invalid
   ```

## Performance Tips

1.**Use specific content patterns:**```bash

# ❌ Slow

   cssx build --content "./**/*.tsx"

# ✅ Fast

   cssx build --content "./src/**/*.tsx"
   ```

2.**Exclude unnecessary files:**```typescript
   content: [
     './src/**/*.tsx',
     '!./src/**/*.test.tsx', // Exclude tests
   ]
   ```

3.**Use watch mode in development:**```bash

# Faster than rebuilding manually

   cssx watch
   ```

4.**Enable minify only in production:**```bash

# Development (fast)

   cssx build

# Production (optimized)

   cssx build --minify
   ```

## Related

- [Configuration](../config.md) - Configuration options
- [Watch Mode](./watch-mode.md) - Automatic rebuilding
- [Programmatic API](../api-reference.md) - Use ts-css in code
