# API Reference

This document provides a complete reference for ts-css's programmatic API. Use these functions and types to integrate ts-css into your build tools, custom scripts, or framework plugins.

## Installation

```bash
bun add @stacksjs/ts-css
```## Core Functions

### `build(config: CssConfig): Promise<BuildResult>`Build CSS from content files and return the result.**Parameters:**-`config` - Complete ts-css configuration object**Returns:**`Promise<BuildResult>`**Example:**```typescript

import { build } from '@stacksjs/ts-css/engine'

const result = await build({
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
  minify: true,
  watch: false,
  theme: {
    colors: {
      primary: '#3b82f6',
    },
  },
  shortcuts: {},
  rules: [],
  variants: {
    responsive: true,
    hover: true,
    focus: true,
  },
  safelist: [],
  blocklist: [],
  preflights: [],
  presets: [],
})

console.log(`Built ${result.classes.size} classes in ${result.duration}ms`)
console.log(`Generated CSS:\n${result.css}`)

```###`buildAndWrite(config: CssConfig): Promise<BuildResult>`Build CSS and write it to the output file.**Parameters:**-`config` - Complete ts-css configuration object**Returns:**`Promise<BuildResult>`**Example:**```typescript
import { buildAndWrite } from '@stacksjs/ts-css/engine'

const result = await buildAndWrite({
  content: ['./src/**/*.tsx'],
  output: './dist/styles.css',
  minify: true,
  // ... other config
})

console.log(`CSS written to ./dist/styles.css`)
console.log(`File size: ${result.css.length} bytes`)
```###`writeCSS(css: string, outputPath: string): Promise<void>`Write CSS string to a file.**Parameters:**-`css`- CSS content to write

-`outputPath` - Path to output file**Returns:**`Promise<void>`**Example:**```typescript
import { build, writeCSS } from '@stacksjs/ts-css/engine'

const result = await build(config)
await writeCSS(result.css, './custom/path/output.css')

```###`writeTransformedFiles(transformedFiles: Map<string, string>): Promise<void>`Write transformed files to disk (used with compile class transformer).**Parameters:**-`transformedFiles` - Map of file paths to transformed content**Returns:**`Promise<void>`**Example:**```typescript
import { build, writeTransformedFiles } from '@stacksjs/ts-css/engine'

const result = await build({
  // ... config with compileClass enabled
  compileClass: {
    enabled: true,
  },
})

if (result.transformedFiles) {
  await writeTransformedFiles(result.transformedFiles)
}
```## Generator

### `CSSGenerator`

Class responsible for generating CSS from utility classes.**Constructor:**```typescript
new CSSGenerator(config: CssConfig)

```**Methods:**#### `generate(className: string): void`Generate CSS for a single utility class.```typescript
import { CSSGenerator } from '@stacksjs/ts-css/engine'

const generator = new CSSGenerator(config)
generator.generate('bg-blue-500')
generator.generate('p-4')
generator.generate('flex')

const css = generator.toCSS()
```####`toCSS(minify?: boolean): string`Generate final CSS output.**Parameters:**-`minify` - Whether to minify the output (default: false)**Returns:**`string`- Generated CSS```typescript

const css = generator.toCSS(true) // Minified
const prettyCSS = generator.toCSS(false) // Formatted

```####`reset(): void`Reset the generator state (clear all generated rules).```typescript
generator.reset()
```**Complete example:**```typescript

import { CSSGenerator, defaultConfig } from '@stacksjs/ts-css/engine'

const config = {
  ...defaultConfig,
  theme: {
    ...defaultConfig.theme,
    colors: {
      primary: '#3b82f6',
    },
  },
}

const generator = new CSSGenerator(config)

// Generate utilities
generator.generate('bg-primary')
generator.generate('text-white')
generator.generate('p-4')
generator.generate('hover:bg-blue-600')

// Get CSS
const css = generator.toCSS()
console.log(css)

```## Scanner

### `Scanner`

Class responsible for scanning files for utility classes.**Constructor:**```typescript
new Scanner(
  patterns: string[],
  transformer?: CompileClassTransformer | null
)
```**Methods:**#### `scan(): Promise<{ classes: Set<string>, transformedFiles: Map<string, string> }>`Scan files and extract utility classes.**Returns:**Object with:

-`classes`- Set of found utility classes
-`transformedFiles` - Map of transformed files (if transformer provided)**Example:**```typescript
import { Scanner } from '@stacksjs/ts-css/engine'

const scanner = new Scanner(['./src/**/*.tsx'])
const { classes, transformedFiles } = await scanner.scan()

console.log(`Found ${classes.size} classes:`)
for (const className of classes) {
  console.log(`  - ${className}`)
}

```## Parser

### `parseClass(className: string): ParsedClass`Parse a utility class string into its components.**Parameters:**-`className` - Class name to parse**Returns:**`ParsedClass` object**Example:**```typescript

import { parseClass } from '@stacksjs/ts-css/engine'

const parsed = parseClass('md:hover:bg-blue-500')

console.log(parsed)
// {
//   raw: 'md:hover:bg-blue-500',
//   variants: ['md', 'hover'],
//   utility: 'bg',
//   value: 'blue-500',
//   important: false,
//   arbitrary: false
// }

const important = parseClass('!text-red-500')
console.log(important.important) // true

const arbitrary = parseClass('w-[500px]')
console.log(arbitrary.arbitrary) // true
console.log(arbitrary.value) // '500px'
```## Configuration

### `defaultConfig`

The default ts-css configuration object.**Example:**```typescript
import { defaultConfig } from '@stacksjs/ts-css/engine'

// Extend default config
const config = {
  ...defaultConfig,
  theme: {
    ...defaultConfig.theme,
    colors: {
      ...defaultConfig.theme.colors,
      custom: '#123456',
    },
  },
}

```###`loadConfig(options): Promise<CssConfig>`Load configuration from file (used internally by CLI).**Parameters:**-`options.name`- Config name (default: 'css')
-`options.defaultConfig` - Default configuration**Returns:**`Promise<CssConfig>`**Example:**```typescript
import { defaultConfig, loadConfig } from '@stacksjs/ts-css/engine'

const config = await loadConfig({
  name: 'css',
  defaultConfig,
})
```## Compile Class Transformer

### `CompileClassTransformer`

Class for transforming compile class markers into optimized class names.**Constructor:**```typescript
new CompileClassTransformer(config?: {
  trigger?: string
  classPrefix?: string
  layer?: string
})

```**Methods:**#### `getCompiledClasses(): Map<string, { className: string, utilities: string[] }>`

Get all compiled classes.**Example:**```typescript
import { CompileClassTransformer } from '@stacksjs/ts-css/engine'

const transformer = new CompileClassTransformer({
  trigger: ':tc:',
  classPrefix: 'tc-',
})

// Use with scanner
const scanner = new Scanner(['./src/**/*.tsx'], transformer)
await scanner.scan()

const compiled = transformer.getCompiledClasses()
for (const [hash, data] of compiled) {
  console.log(`${data.className}: ${data.utilities.join(' ')}`)
}
```## Types

### `CssConfig`Complete configuration interface.```typescript

interface CssConfig {
  content: string[]
  output: string
  minify: boolean
  watch: boolean
  verbose?: boolean
  theme: Theme
  shortcuts: Record<string, string | string[]>
  rules: CustomRule[]
  variants: VariantConfig
  safelist: string[]
  blocklist: string[]
  preflights: Preflight[]
  presets: Preset[]
  compileClass?: CompileClassConfig
}

```###`CssOptions`Partial configuration for user configs.```typescript
type CssOptions = Partial<CssConfig>
```###`Theme`Theme configuration interface.```typescript

interface Theme {
  colors: Record<string, string | Record<string, string>>
  spacing: Record<string, string>
  fontSize: Record<string, [string, { lineHeight: string }]>
  fontFamily: Record<string, string[]>
  screens: Record<string, string>
  borderRadius: Record<string, string>
  boxShadow: Record<string, string>
}

```###`BuildResult`Result from build operations.```typescript
interface BuildResult {
  css: string
  classes: Set<string>
  duration: number
  compiledClasses?: Map<string, { className: string, utilities: string[] }>
  transformedFiles?: Map<string, string>
}
```###`ParsedClass`Parsed utility class structure.```typescript

interface ParsedClass {
  raw: string
  variants: string[]
  utility: string
  value?: string
  important: boolean
  arbitrary: boolean
}

```###`Preset`Preset configuration interface.```typescript
interface Preset {
  name: string
  theme?: Partial<Theme>
  rules?: CustomRule[]
  shortcuts?: Record<string, string | string[]>
  variants?: Partial<VariantConfig>
  preflights?: Preflight[]
}
```###`CustomRule`Custom rule definition.```typescript

type CustomRule = [
  RegExp,
  (match: RegExpMatchArray) => Record<string, string> | undefined
]

```###`Preflight`Preflight CSS definition.```typescript
interface Preflight {
  getCSS: () => string
}
```###`CompileClassConfig`Compile class transformer configuration.```typescript

interface CompileClassConfig {
  enabled?: boolean
  trigger?: string
  classPrefix?: string
  layer?: string
}

```###`VariantConfig`Variant configuration interface.```typescript
interface VariantConfig {
  responsive: boolean
  hover: boolean
  focus: boolean
  active: boolean
  disabled: boolean
  dark: boolean
  group: boolean
  peer: boolean
  before: boolean
  after: boolean
  // ... and many more
}
```## Advanced Usage Examples

### Custom Build Pipeline```typescript

import { CSSGenerator, Scanner, writeCSS } from '@stacksjs/ts-css/engine'

async function customBuild() {
  // 1. Configure
  const config = {
    content: ['./src/**/*.tsx'],
    output: './dist/styles.css',
    minify: true,
    theme: {
      colors: { primary: '#3b82f6' },
    },
  }

  // 2. Scan for classes
  const scanner = new Scanner(config.content)
  const { classes } = await scanner.scan()

  console.log(`Found ${classes.size} utility classes`)

  // 3. Generate CSS
  const generator = new CSSGenerator(config)
  for (const className of classes) {
    generator.generate(className)
  }

  // 4. Get CSS
  const css = generator.toCSS(config.minify)

  // 5. Write to file
  await writeCSS(css, config.output)

  console.log(`Built CSS: ${css.length} bytes`)
}

await customBuild()

```### Analyze Utility Usage```typescript
import { parseClass, Scanner } from '@stacksjs/ts-css/engine'

async function analyzeUtilities() {
  const scanner = new Scanner(['./src/**/*.tsx'])
  const { classes } = await scanner.scan()

  const stats = new Map<string, number>()

  for (const className of classes) {
    const parsed = parseClass(className)
    const utility = parsed.utility
    stats.set(utility, (stats.get(utility) || 0) + 1)
  }

  // Sort by usage
  const sorted = Array.from(stats.entries())
    .sort((a, b) => b[1] - a[1])

  console.log('Top 10 utilities:')
  sorted.slice(0, 10).forEach(([utility, count]) => {
    console.log(`  ${utility}: ${count} uses`)
  })
}

await analyzeUtilities()
```### Watch Mode Implementation```typescript

import { watch } from 'node:fs'
import { buildAndWrite } from '@stacksjs/ts-css/engine'

async function watchMode(config: CssConfig) {
  console.log('Watching for changes...')

  // Initial build
  await buildAndWrite(config)

  // Watch directories
  const dirs = new Set(
    config.content.map(pattern => pattern.split('/**')[0])
  )

  for (const dir of dirs) {
    watch(dir, { recursive: true }, async (event, filename) => {
      console.log(`File changed: ${filename}`)
      try {
        await buildAndWrite(config)
        console.log('Rebuilt successfully')
      }
      catch (error) {
        console.error('Build failed:', error)
      }
    })
  }
}

await watchMode(config)

```### Framework Plugin```typescript
import { buildAndWrite } from '@stacksjs/ts-css/engine'

// Usage in vite.config.ts
import { defineConfig } from 'vite'
import { tsCssPlugin } from './plugins/ts-css'

// Example Vite plugin
export function tsCssPlugin(config: CssOptions) {
  return {
    name: 'vite-plugin-ts-css',

    async buildStart() {
      await buildAndWrite(config)
    },

    async handleHotUpdate({ file }: { file: string }) {
      // Check if file matches content patterns
      const shouldRebuild = config.content?.some(pattern =>
        file.match(new RegExp(pattern.replace('*', '.*')))
      )

      if (shouldRebuild) {
        await buildAndWrite(config)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    tsCssPlugin({
      content: ['./src/**/*.tsx'],
      output: './src/styles.css',
    }),
  ],
})
```### Generate Multiple Themes```typescript

import { build, writeCSS } from '@stacksjs/ts-css/engine'

const baseConfig = {
  content: ['./src/**/*.tsx'],
  minify: true,
  // ... other config
}

const themes = {
  light: {
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#3b82f6',
    },
  },
  dark: {
    colors: {
      background: '#000000',
      foreground: '#ffffff',
      primary: '#60a5fa',
    },
  },
}

for (const [name, theme] of Object.entries(themes)) {
  const result = await build({
    ...baseConfig,
    theme,
  })

  await writeCSS(result.css, `./dist/styles-${name}.css`)
  console.log(`Built ${name} theme: ${result.css.length} bytes`)
}

```### Testing Utilities```typescript
import { expect, test } from 'bun:test'
import { CSSGenerator, defaultConfig, parseClass } from '@stacksjs/ts-css/engine'

test('parses utility class', () => {
  const parsed = parseClass('md:hover:bg-blue-500')

  expect(parsed.variants).toEqual(['md', 'hover'])
  expect(parsed.utility).toBe('bg')
  expect(parsed.value).toBe('blue-500')
})

test('generates correct CSS', () => {
  const generator = new CSSGenerator(defaultConfig)
  generator.generate('bg-blue-500')

  const css = generator.toCSS()
  expect(css).toContain('.bg-blue-500')
  expect(css).toContain('background-color: #3b82f6')
})

test('handles important modifier', () => {
  const parsed = parseClass('!text-red-500')
  expect(parsed.important).toBe(true)
})
```## Error Handling```typescript

import { buildAndWrite } from '@stacksjs/ts-css/engine'

try {
  const result = await buildAndWrite(config)
  console.log('Success:', result)
}
catch (error) {
  if (error instanceof Error) {
    console.error('Build failed:', error.message)

    // Check for specific errors
    if (error.message.includes('ENOENT')) {
      console.error('Output directory does not exist')
    }
    else if (error.message.includes('EACCES')) {
      console.error('Permission denied')
    }
  }
}

```## Performance Optimization

### Caching Results```typescript

import { build } from '@stacksjs/ts-css/engine'

const cache = new Map<string, BuildResult>()

async function buildWithCache(config: CssConfig) {
  const key = JSON.stringify(config)

  if (cache.has(key)) {
    console.log('Using cached result')
    return cache.get(key)!
  }

  const result = await build(config)
  cache.set(key, result)

  return result
}
```### Parallel Builds```typescript

import { build, writeCSS } from '@stacksjs/ts-css/engine'

const configs = [
  { output: './dist/app.css', content: ['./src/app/**/*.tsx'] },
  { output: './dist/admin.css', content: ['./src/admin/**/*.tsx'] },
  { output: './dist/public.css', content: ['./src/public/**/*.tsx'] },
]

const results = await Promise.all(
  configs.map(config => build({ ...baseConfig, ...config }))
)

await Promise.all(
  results.map((result, i) =>
    writeCSS(result.css, configs[i].output)
  )
)

```

## Related

- [Configuration](./config.md) - Configuration options
- [CLI Commands](./features/cli.md) - Command-line interface
- [TypeScript](./features/typescript.md) - TypeScript support
- [Framework Integration](./advanced/frameworks.md) - Using with frameworks
