# Watch Mode

Watch mode enables automatic CSS rebuilding whenever your source files change, providing instant feedback during development.

## Overview

Instead of manually rebuilding your CSS after every change, watch mode monitors your files and automatically regenerates the CSS when it detects changes.

## Usage

Start watch mode using the CLI:

```bash

# Using the watch command

cssx watch

# Or using build with --watch flag

cssx build --watch
```## How It Works

When you start watch mode, ts-css:

1.**Performs Initial Build**- Generates CSS from your current files
2.**Watches Content Directories**- Monitors all directories matching your content patterns
3.**Detects Changes**- Listens for file modifications, additions, and deletions
4.**Rebuilds Automatically**- Regenerates CSS when changes are detected
5.**Shows Statistics**- Displays build time and class count after each rebuild

## Configuration

Watch mode uses the content patterns from your configuration file:```typescript
// css.config.ts
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}', // Watch all these files
    './components/**/*.vue',
    './pages/**/*.svelte',
  ],
  output: './dist/styles.css',
} satisfies CssOptions

export default config

```## File Types

Watch mode monitors these file extensions by default:

-`.html`- HTML files
-`.js`- JavaScript files
-`.ts`- TypeScript files
-`.jsx`- React JSX files
-`.tsx`- React TypeScript files
-`.stx`- Stacks template files
-`.vue`- Vue single-file components
-`.svelte`- Svelte components

## Features

### Fast Rebuilds

ts-css's watch mode is optimized for speed:```bash
📝 src/App.tsx changed, rebuilding...
✅ Built 1243 classes in 8.45ms
```Typical rebuild times are under 10ms for most projects.

### Verbose Output

Use`--verbose`to see detailed information during watch mode:```bash
cssx watch --verbose

```This shows:

- File paths being watched
- Content patterns being used
- Detailed class information
- Full rebuild statistics

### Multiple Directories

Watch mode automatically monitors all directories specified in your content patterns:```typescript
const config = {
  content: [
    './src/**/*.tsx', // Watches: ./src
    './pages/**/*.tsx', // Watches: ./pages
    './components/**/*.tsx', // Watches: ./components
  ],
} satisfies CssOptions
```## CLI Options

Customize watch mode behavior with CLI options:```bash

# Basic watch

cssx watch

# Watch with custom output

cssx watch --output ./dist/custom.css

# Watch with minification

cssx watch --minify

# Watch with verbose logging

cssx watch --verbose

# Watch with custom config

cssx watch --config ./custom.config.ts

```

## Development Workflow

### Recommended Setup

1.**Terminal 1: Watch Mode**```bash
   cssx watch
   ```

2.**Terminal 2: Dev Server**```bash
   npm run dev

# or

   bun dev
   ```### Package.json Scripts

Add watch mode to your npm scripts:```json
{
  "scripts": {
    "dev": "cssx watch & vite dev",
    "dev:styles": "cssx watch",
    "dev:app": "vite dev",
    "build": "cssx build --minify && vite build"
  }
}
```### Parallel Development

Run watch mode alongside your development server:```bash

# Using npm-run-all

npm-run-all --parallel dev:styles dev:app

# Using concurrently

concurrently "cssx watch" "vite dev"

# Using &

cssx watch & npm run dev

```

## Performance

Watch mode is highly performant thanks to Bun:

| File Count | Rebuild Time |
|------------|--------------|
| 10 files   | ~5ms         |
| 100 files  | ~15ms        |
| 1000 files | ~50ms        |

### Optimization Tips

1.**Use Specific Patterns**```typescript
   // ❌ Too broad
   content: ['./**/*.tsx']

   // ✅ Specific
   content: ['./src/**/*.tsx', './components/**/*.tsx']
   ```

2.**Exclude Unnecessary Directories**```typescript
   // Use negative patterns if needed
   content: [
     './src/**/*.tsx',
     '!./src/tests/**', // Exclude tests
     '!./src/**/*.test.tsx', // Exclude test files
   ]
   ```

3.**Avoid Watching Build Directories**```typescript
   // ❌ Don't watch output directories
   content: ['./dist/**/*.tsx'] // Bad!

   // ✅ Only watch source directories
   content: ['./src/**/*.tsx']
   ```## Troubleshooting

### Watch Not Detecting Changes**Problem:**Files change but CSS doesn't rebuild**Solutions:**1. Check your content patterns:```bash

   cssx watch --verbose
   ```Look for the "👀 Watching:" output to see what's being monitored.

2. Ensure file extensions are supported:```typescript

   // Add all file types you're using
   content: ['./src/**/*.{html,js,ts,jsx,tsx,vue,svelte}']
   ```3. Verify the file is within watched directories:```bash

# The file must match your content patterns

# ./src/components/Button.tsx ✅ matches ./src/**/*.tsx

# ./lib/Button.tsx ❌ doesn't match ./src/**/*.tsx

   ```### High CPU Usage**Problem:**Watch mode uses too much CPU**Solutions:**1. Use more specific content patterns

2. Exclude unnecessary directories
3. Reduce the number of files being watched

### Permission Errors**Problem:**Watch mode fails with permission errors**Solutions:**1. Check directory permissions:```bash

   ls -la ./src
   ```2. Run with appropriate permissions:```bash

# On macOS/Linux

   chmod -R u+rw ./src
   ```## Integration with Build Tools

### Vite```typescript

// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // Vite will handle HMR, ts-css handles CSS
  server: {
    watch: {
      // Don't watch ts-css output to avoid loops
      ignored: ['**/dist/styles.css']
    }
  }
})
```### Next.js```json

{
  "scripts": {
    "dev": "cssx watch & next dev",
    "build": "cssx build --minify && next build"
  }
}

```### Webpack```javascript
// webpack.config.js
module.exports = {
  // Webpack config
  watchOptions: {
    ignored: /dist\/styles\.css/, // Ignore ts-css output
  }
}
```

## Best Practices

1.**Always Use Watch Mode in Development**- Provides instant feedback

   - Catches missing utilities immediately
   - Shows real-time class usage

2.**Use Build Mode in Production**```bash

# Development

   cssx watch

# Production

   cssx build --minify
   ```

3.**Combine with Hot Module Replacement (HMR)**- Let your dev server handle HMR

   - Let ts-css handle CSS generation
   - Both work seamlessly together

4.**Monitor Watch Output**- Check for errors during rebuilds

   - Verify class counts make sense
   - Watch for performance issues

## Related

- [CLI Commands](./cli.md) - All available CLI commands
- [Configuration](../config.md) - Configure watch behavior
