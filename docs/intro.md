# Introduction

ts-css is a blazingly fast utility-first CSS framework built with Bun for exceptional performance. It generates only the CSS you need, with a familiar Tailwind-compatible syntax and powerful optimization features.

## What is ts-css

ts-css is a modern CSS framework that provides utility classes for building user interfaces. Unlike traditional CSS frameworks that ship pre-built components, ts-css gives you low-level utility classes that let you build completely custom designs without ever leaving your HTML.

### Key Features

-**⚡️ Blazingly Fast**- Built with Bun for exceptional performance. Generate 1000+ utilities in under 10ms
-**🎯 On-Demand Generation**- Only generates CSS for utilities you actually use. Zero bloat, maximum efficiency
-**🎨 Tailwind-Compatible**- Familiar utility classes and syntax. Easy migration path from Tailwind CSS
-**💪 Fully Typed**- Complete TypeScript support with type-safe configuration and API
-**🔧 Highly Configurable**- Customize theme, colors, spacing, variants, shortcuts, and more
-**🔥 Hot Reload**- Watch mode for instant rebuilds during development
-**🎭 Variant Support**- Responsive, state (hover, focus), dark mode, group/peer, and custom variants
-**✨ Modern CSS**- Grid, Flexbox, animations, transforms, filters, backdrop filters, and more
-**🔨 Class Compilation**- Compile groups of utilities into single optimized class names for smaller HTML
-**🧪 Thoroughly Tested**- 999+ tests including comprehensive performance benchmarks

## Why ts-css

### Performance-First

ts-css is built with Bun, making it one of the fastest CSS frameworks available:

```bash

# Generate 1000+ utilities in under 10ms

cssx build

# ✅ Built 1243 classes in 8.45ms

```### On-Demand CSS Generation

Unlike traditional frameworks that ship large CSS files, ts-css scans your source files and generates only the CSS you use:```html
<!-- Only these classes generate CSS -->
<div class="flex items-center justify-between px-4 py-2">
  <h1 class="text-2xl font-bold text-blue-500">Hello ts-css!</h1>
</div>

```This approach results in:

-**Smaller CSS files**- Only ship what you use
-**Faster load times**- Less CSS to download and parse
-**Better performance**- Reduced render-blocking CSS

### Tailwind-Compatible Syntax

If you know Tailwind, you already know ts-css:```html
<!-- Flexbox utilities -->
<div class="flex items-center justify-between">

<!-- Spacing utilities -->
<div class="p-4 m-2 space-y-4">

<!-- Typography utilities -->
<h1 class="text-4xl font-bold text-gray-900">

<!-- Responsive utilities -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- State variants -->
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2">
```### Advanced Optimization

ts-css includes a compile class transformer that optimizes your HTML by compiling groups of utilities into single class names:```html
<!-- Before compilation -->
<div class=":tc: flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-md">
  Content
</div>

<!-- After compilation -->
<div class="tc-abc123">
  Content
</div>

```Benefits:

-**Smaller HTML**- Reduce HTML file size by up to 60%
-**Better caching**- Deterministic class names improve cache hits
-**Automatic deduplication**- Identical class groups share the same compiled name

## How It Works

### 1. Scan Your Files

ts-css scans your source files for utility classes:```typescript
// css.config.ts
const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
}
```### 2. Generate CSS

For each utility class found, ts-css generates the corresponding CSS:```html
<!-- Input -->
<div class="flex items-center p-4 bg-blue-500 text-white rounded">
  Hello!
</div>

```

```css

/*Output*/
.flex { display: flex; }
.items-center { align-items: center; }
.p-4 { padding: 1rem; }
.bg-blue-500 { background-color: #3b82f6; }
.text-white { color: #ffffff; }
.rounded { border-radius: 0.25rem; }

```### 3. Watch for Changes

During development, ts-css watches your files and automatically rebuilds when changes are detected:```bash
cssx watch

# 👀 Watching for changes

# ✅ Built 1243 classes in 8.45ms

```## Getting Started

### Installation

Install ts-css via your package manager:```bash

# Using Bun (recommended)

bun add @stacksjs/ts-css

# Using npm

npm install @stacksjs/ts-css

# Using pnpm

pnpm add @stacksjs/ts-css

```### Configuration

Create a configuration file:```bash
cssx init
```This creates a`css.config.ts`file:```typescript

import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
} satisfies CssOptions

export default config

```### Build CSS

Generate your CSS file:```bash

# One-time build

cssx build

# Watch mode for development

cssx watch
```### Use in Your HTML

Include the generated CSS in your project:```html
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

```## Core Concepts

### Utility-First CSS

Instead of writing custom CSS:```css
/*Traditional approach*/
.card {
  padding: 1rem;
  margin: 0.5rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```Use utility classes directly in your HTML:```html

<!-- Utility-first approach -->
<div class="p-4 m-2 rounded-lg bg-white shadow-md">
  Card content
</div>

```Benefits:

- No context switching between HTML and CSS
- No naming things (avoid "card-container-wrapper-inner")
- Easier to maintain and refactor
- Consistent design system
- LLM-friendly

### Responsive Design

Build responsive layouts with responsive variants:```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <!-- Responsive grid that adapts to screen size -->
</div>

<h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
  <!-- Responsive typography -->
</h1>
```Breakpoints:

-`sm:`- 640px and up
-`md:`- 768px and up
-`lg:`- 1024px and up
-`xl:`- 1280px and up
-`2xl:`- 1536px and up

### State Variants

Style different states with state variants:```html
<!-- Hover, focus, and active states -->
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 active:bg-blue-700">
  Click Me
</button>

<!-- Group hover (child changes when parent is hovered) -->
<div class="group">
  <img class="group-hover:scale-110" src="..." />
</div>

<!-- Dark mode -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>

```### Theme Customization

Customize your design system via configuration:```typescript
const config = {
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      brand: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',
        900: '#0c4a6e',
      },
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
  },
} satisfies CssOptions
```### Shortcuts

Create reusable utility combinations:```typescript
const config = {
  shortcuts: {
    'btn': 'px-4 py-2 rounded font-semibold transition-colors',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'card': 'rounded-lg shadow-md p-6 bg-white',
  },
} satisfies CssOptions

```Use shortcuts like any other utility:```html
<button class="btn-primary">Click Me</button>
<div class="card">Card content</div>
```

## Philosophy

ts-css is built on several core principles:

1.**Performance First**- Built with Bun for maximum speed
2.**Developer Experience**- TypeScript-first, fully typed APIs
3.**Utility-First**- Compose complex components from simple utilities
4.**On-Demand Only**- Never ship unused CSS
5.**Tailwind & UnoCSS-Compatible**- Leverage existing knowledge and tools
6.**Extensible**- Customize everything via configuration
7.**Production-Ready**- Optimizations like class compilation and minification

## Next Steps

Now that you understand what ts-css is and how it works, explore:

- [Installation Guide](./install.md) - Set up ts-css in your project
- [Configuration Guide](./config.md) - Customize ts-css to your needs
- [Usage Guide](./usage.md) - Learn all available utility classes
- [CLI Reference](./features/cli.md) - Explore CLI commands and options
- [Compile Class Transformer](./features/compile-class.md) - Optimize your HTML

## Community & Support

-**GitHub**- [github.com/stacksjs/ts-css](https://github.com/stacksjs/ts-css)
-**Discord**- [Join the Stacks Discord](https://stacksjs.com/discord)
-**Issues**- [Report bugs or request features](https://github.com/stacksjs/ts-css/issues)
-**Discussions**- [Ask questions and share ideas](https://github.com/stacksjs/ts-css/discussions)

## License

ts-css is open-source software licensed under the [MIT license](https://github.com/stacksjs/ts-css/blob/main/LICENSE.md).
