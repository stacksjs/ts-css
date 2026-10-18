# Framework Integration

ts-css integrates seamlessly with modern JavaScript frameworks and build tools. This guide covers integration with React, Vue, Svelte, Next.js, Nuxt, SvelteKit, Astro, and more.

## React

### Create React App

```bash

# Create React app

bunx create-react-app my-app
cd my-app

# Install ts-css

bun add @stacksjs/ts-css

# Initialize ts-css

bunx cssx init
```**Configuration:**```typescript

// css.config.ts
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  output: './src/styles.css',
  minify: process.env.NODE_ENV === 'production',
} satisfies CssOptions

export default config

```**Import CSS:**```tsx
// src/index.tsx or src/App.tsx
import './styles.css'
```**Package.json scripts:**```json

{
  "scripts": {
    "prestart": "cssx build",
    "start": "react-scripts start",
    "prebuild": "cssx build --minify",
    "build": "react-scripts build",
    "dev": "cssx watch & react-scripts start"
  }
}

```**Example component:**```tsx
// src/components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-semibold transition-colors'

  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </button>
  )
}
```### Vite + React```bash

# Create Vite app

bun create vite my-app --template react-ts
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init

```**Configuration:**```typescript
// css.config.ts
const config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  output: './src/styles.css',
  watch: true,
}
```**Concurrent development:**```json

{
  "scripts": {
    "dev": "cssx watch & vite",
    "build": "cssx build --minify && tsc && vite build"
  }
}

```### Next.js```bash

# Create Next.js app

bunx create-next-app@latest my-app
cd my-app

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init
```**Configuration:**```typescript

// css.config.ts
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  output: './styles/styles.css',
  minify: process.env.NODE_ENV === 'production',
}

```**Import in layout:**```tsx
// app/layout.tsx
import '../styles/styles.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```**Development script:**```json

{
  "scripts": {
    "dev": "cssx watch & next dev",
    "build": "cssx build --minify && next build",
    "start": "next start"
  }
}

```**Example Next.js component:**```tsx
// components/Card.tsx
interface CardProps {
  title: string
  description: string
  image?: string
}

export function Card({ title, description, image }: CardProps) {
  return (
    <div className="rounded-lg shadow-md overflow-hidden bg-white">
      {image && (
        <img src={image} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}
```## Vue

### Vue 3 + Vite```bash

# Create Vue app

bun create vite my-app --template vue-ts
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init

```**Configuration:**```typescript
// css.config.ts
const config = {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}', './index.html'],
  output: './src/styles.css',
}
```**Import CSS:**```typescript

// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

createApp(App).mount('#app')

```**Example component:**```vue
<!-- src/components/Button.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
})

const variantClasses = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
}

const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
</script>

<template>
  <button
    class="rounded font-semibold transition-colors" :class="[
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <slot />
  </button>
</template>
```**Development:**```json

{
  "scripts": {
    "dev": "cssx watch & vite",
    "build": "cssx build --minify && vue-tsc && vite build"
  }
}

```### Nuxt 3```bash

# Create Nuxt app

bunx nuxi@latest init my-app
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init
```**Configuration:**```typescript

// css.config.ts
const config = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  output: './assets/css/styles.css',
}

```**Import in Nuxt config:**```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/css/styles.css'],
  devtools: { enabled: true },
})
```**Development:**```json

{
  "scripts": {
    "dev": "cssx watch & nuxt dev",
    "build": "cssx build --minify && nuxt build",
    "generate": "cssx build --minify && nuxt generate"
  }
}

```## Svelte

### SvelteKit```bash

# Create SvelteKit app

bun create svelte@latest my-app
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init
```**Configuration:**```typescript

// css.config.ts
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  output: './src/styles.css',
}

```**Import CSS:**```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../styles.css'
</script>

<slot />
```**Example component:**```svelte

<!-- src/lib/components/Card.svelte -->
<script lang="ts">
  export let title: string
  export let description: string
  export let variant: 'default' | 'highlighted' = 'default'

  const variantClasses = {
    default: 'bg-white shadow-md',
    highlighted: 'bg-blue-50 border-2 border-blue-500'
  }
</script>

<div class="rounded-lg p-6 {variantClasses[variant]}">
  <h3 class="text-xl font-bold mb-2">{title}</h3>
  <p class="text-gray-600">{description}</p>
  <slot />
</div>

```**Development:**```json
{
  "scripts": {
    "dev": "cssx watch & vite dev",
    "build": "cssx build --minify && vite build"
  }
}
```### Svelte + Vite```bash

# Create Svelte app

bun create vite my-app --template svelte-ts
cd my-app
bun install
bun add @stacksjs/ts-css
bunx cssx init

```**Configuration:**```typescript
// css.config.ts
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './index.html'],
  output: './src/styles.css',
}
```## Astro```bash

# Create Astro app

bun create astro@latest my-app
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init

```**Configuration:**```typescript
// css.config.ts
const config = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  output: './src/styles.css',
}

```**Import CSS:**```astro

---

// src/layouts/Layout.astro

import '../styles.css'
---

<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>My Astro Site</title>
  </head>
  <body>
    <slot />
  </body>
</html>

```**Example component:**```astro
---

// src/components/Hero.astro
interface Props {
  title: string
  subtitle: string
}

const { title, subtitle } = Astro.props
---

<section class="py-20 px-4 text-center bg-gradient-to-r from-blue-500 to-purple-600">
  <div class="container mx-auto">
    <h1 class="text-5xl font-bold text-white mb-4">{title}</h1>
    <p class="text-xl text-white opacity-90">{subtitle}</p>
  </div>
</section>
```**Development:**```json

{
  "scripts": {
    "dev": "cssx watch & astro dev",
    "build": "cssx build --minify && astro build"
  }
}

```## Solid.js```bash

# Create Solid app

bunx degit solidjs/templates/ts my-app
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init
```**Configuration:**```typescript

// css.config.ts
const config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  output: './src/styles.css',
}

```**Import CSS:**```tsx
// src/index.tsx
import { render } from 'solid-js/web'
import App from './App'
import './styles.css'

render(() => <App />, document.getElementById('root')!)
```## Qwik```bash

# Create Qwik app

bun create qwik@latest
cd my-app
bun install

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init

```**Configuration:**```typescript
// css.config.ts
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  output: './src/styles.css',
}
```**Import in root:**```tsx

// src/root.tsx
import './styles.css'

```## Static Site Generators

### 11ty (Eleventy)```bash

# Install ts-css

bun add @stacksjs/ts-css
bunx cssx init
```**Configuration:**```typescript

// css.config.ts
const config = {
  content: ['./src/**/*.{html,md,njk,liquid}'],
  output: './_site/css/styles.css',
}

```**Template:**```html
<!-- src/_includes/layout.njk -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/css/styles.css">
  </head>
  <body>
    {{ content | safe }}
  </body>
</html>
```**Build script:**```json

{
  "scripts": {
    "build": "cssx build --minify && eleventy",
    "dev": "cssx watch & eleventy --serve"
  }
}

```### Hugo```bash

# In your Hugo project

bun add @stacksjs/ts-css
bunx cssx init
```**Configuration:**```typescript

// css.config.ts
const config = {
  content: [
    './layouts/**/*.html',
    './content/**/*.md',
  ],
  output: './static/css/styles.css',
}

```**Template:**```html
<!-- layouts/_default/baseof.html -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/css/styles.css">
  </head>
  <body>
    {{ block "main" . }}{{ end }}
  </body>
</html>
```## Build Tool Integration

### Webpack```javascript

// webpack.config.js
const { spawn } = require('node:child_process')

module.exports = {
  // ... webpack config

  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.beforeCompile.tap('ts-cssPlugin', () => {
          spawn('cssx', ['build'], { stdio: 'inherit' })
        })
      }
    }
  ]
}

```### Rollup```javascript
// rollup.config.js
import { spawn } from 'node:child_process'

function tsCss() {
  return {
    name: 'css',
    buildStart() {
      return new Promise((resolve) => {
        const proc = spawn('cssx', ['build'])
        proc.on('close', resolve)
      })
    }
  }
}

export default {
  plugins: [tsCss()],
}
```### esbuild```javascript

import { spawn } from 'node:child_process'
// build.js
import*as esbuild from 'esbuild'

// Build CSS first
await new Promise((resolve) => {
  const proc = spawn('cssx', ['build'])
  proc.on('close', resolve)
})

// Then build JS
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
})

```## Best Practices

### 1. Watch Mode in Development

Run ts-css in watch mode during development:```json
{
  "scripts": {
    "dev": "cssx watch & vite dev"
  }
}
```### 2. Build CSS Before Production

Always build CSS before your framework build:```json
{
  "scripts": {
    "build": "cssx build --minify && vite build"
  }
}

```### 3. Gitignore Generated CSS```gitignore

# .gitignore

/src/styles.css
/dist/styles.css
```Regenerate CSS during build instead of committing it.

### 4. Content Paths

Include all files that contain utility classes:```typescript
const config = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,vue,svelte}',
    './public/index.html',
    './components/**/*.{js,ts}',
  ],
}

```### 5. Component Libraries

For shared component libraries:```typescript
// css.config.ts in component library
const config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  output: './dist/styles.css',
}
```Publish both components and CSS:```json

{
  "files": ["dist"],
  "exports": {
    ".": "./dist/index.js",
    "./css": "./dist/styles.css"
  }
}

```## Framework-Specific Tips

### React

Use class composition utilities like`clsx`or`classnames`:

```tsx

import clsx from 'clsx'

function Button({ primary, large, className }) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded',
        primary && 'bg-blue-500 text-white',
        large && 'text-lg px-6 py-3',
        className
      )}
    />
  )
}

```### Vue

Use computed properties for dynamic classes:```vue
<script setup>
import { computed } from 'vue'

const props = defineProps(['variant', 'size'])

const classes = computed(() => [
  'px-4 py-2 rounded',
  props.variant === 'primary' && 'bg-blue-500 text-white',
  props.size === 'large' && 'text-lg px-6 py-3',
])
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
```### Svelte

Use class directives:```svelte
<script>
  export let primary = false
  export let large = false
</script>

<button
  class="px-4 py-2 rounded"
  class:bg-blue-500={primary}
  class:text-white={primary}
  class:text-lg={large}
  class:px-6={large}
  class:py-3={large}
>
  <slot />
</button>

```## Troubleshooting

### CSS Not Updating**Solution:**Ensure watch mode is running:```bash

cssx watch
```### Classes Not Found**Solution:**Check content paths include all files:```typescript

content: ['./src/**/*.{js,jsx,ts,tsx}']

```### Build Failing in CI**Solution:**Run ts-css build before framework build:```yaml

- run: bun run cssx build --minify
- run: bun run build

```

## Related

- [CLI Commands](../features/cli.md) - CLI reference
- [Configuration](../config.md) - Configuration options
- [Watch Mode](../features/watch-mode.md) - Development workflow
- [API Reference](../api-reference.md) - Programmatic usage
