# Configuration

ts-css is configured using a `css.config.ts`(or`css.config.js`) file in your project root. The configuration file is automatically loaded when running any ts-css command.

## Quick Start

Create a configuration file using the init command:

```bash
cssx init
```This creates a basic`css.config.ts`file:```typescript

import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
} satisfies CssOptions

export default config

```

## Configuration Options

### content

-**Type:**`string[]`
-**Required:**Yes
-**Default:**`[]`Glob patterns to scan for utility classes. Supports all file types including HTML, JavaScript, TypeScript, JSX, and TSX.```typescript
const config = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    './components/**/*.vue',
    './pages/**/*.svelte',
  ],
} satisfies CssOptions
```**Tips:**- Use specific patterns to improve scan performance

- Exclude `node_modules` and build directories
- Include all file types where you use utility classes

### output

-**Type:**`string`
-**Required:**Yes
-**Default:**`'./styles.css'`Path to the output CSS file.```typescript
const config = {
  output: './dist/styles/styles.css',
} satisfies CssOptions

```

### theme

-**Type:**`object`-**Required:**No
-**Default:**Default Tailwind-compatible theme

Customize colors, spacing, fonts, and other design tokens.```typescript
const config = {
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      danger: '#ef4444',
      // Add custom colors
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
    fontSize: {
      'xs': '0.75rem',
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px',
    },
  },
} satisfies CssOptions
```

### preflight

-**Type:**`boolean`
-**Required:**No
-**Default:**`true`Include CSS reset/normalize styles (similar to Tailwind's preflight).```typescript
const config = {
  preflight: true, // Include reset styles
} satisfies CssOptions

```

Preflight includes:

- Modern CSS reset
- Box-sizing border-box
- Default border styles
- Form element normalization

### minify

-**Type:**`boolean`
-**Required:**No
-**Default:**`false`Minify the output CSS for production.```typescript
const config = {
  minify: true, // Enable minification
} satisfies CssOptions
```

When enabled, the output CSS is minified by removing:

- Whitespace
- Comments
- Redundant rules

### compileClass

-**Type:**`object`
-**Required:**No
-**Default:**`{ enabled: false }`Configure the compile class transformer to optimize HTML by compiling groups of utilities into single class names.```typescript
const config = {
  compileClass: {
    enabled: true, // Enable the transformer
    trigger: ':tc:', // Trigger string (default)
    classPrefix: 'tc-', // Prefix for generated names (default)
    layer: 'shortcuts', // Layer name (default)
  },
} satisfies CssOptions

```**Options:**-**enabled**- Enable or disable the transformer
-**trigger**- String to mark classes for compilation (e.g., `:tc:`)
-**classPrefix**- Prefix for generated class names (e.g., `tc-`)
-**layer**- CSS layer name for future CSS layers support**Usage:**```html
<!-- Before compilation -->
<div class=":tc: flex items-center justify-between px-4 py-2">
  Content
</div>

<!-- After compilation -->
<div class="tc-abc123">
  Content
</div>
```

See [Compile Class Documentation](./features/compile-class.md) for more details.

### shortcuts

-**Type:**`object`
-**Required:**No
-**Default:**`{}`Define reusable utility combinations as shortcuts.```typescript
const config = {
  shortcuts: {
    'btn': 'px-4 py-2 rounded font-semibold',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'btn-secondary': 'btn bg-gray-200 text-gray-800 hover:bg-gray-300',
    'card': 'rounded-lg shadow-md p-6 bg-white',
    'input': 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
  },
} satisfies CssOptions

```**Usage:**```html
<button class="btn-primary">Click Me</button>
<div class="card">Card content</div>
<input class="input" type="text" />
```

### rules

-**Type:**`object`
-**Required:**No
-**Default:**`{}`Add custom utility rules.```typescript
const config = {
  rules: {
    // Static rule
    'custom-utility': {
      'property-name': 'value',
    },
    // Dynamic rule with pattern matching
    'custom-{value}': match => ({
      'custom-property': match.groups.value,
    }),
  },
} satisfies CssOptions

```**Example:**```typescript
const config = {
  rules: {
    // Add custom gradient utility
    'bg-gradient-primary': {
      'background-image': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    // Add custom spacing utility
    'space-{size}': match => ({
      margin: `${match.groups.size}px`,
    }),
  },
} satisfies CssOptions
```

### presets

-**Type:**`array`
-**Required:**No
-**Default:**`[]`Extend configuration with shareable presets.```typescript
import { myCustomPreset } from './presets/custom'

const config = {
  presets: [
    myCustomPreset,
  ],
} satisfies CssOptions

```**Creating a Preset:**```typescript
// presets/custom.ts
import type { CssOptions } from '@stacksjs/ts-css/engine'

export const myCustomPreset: Partial<CssConfig> = {
  theme: {
    colors: {
      brand: '#3b82f6',
    },
  },
  shortcuts: {
    btn: 'px-4 py-2 rounded',
  },
}
```## Complete Configuration Example```typescript

import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  // Required
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',

  // Optional
  preflight: true,
  minify: process.env.NODE_ENV === 'production',

  // Theme customization
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
  },

  // Compile class transformer
  compileClass: {
    enabled: true,
    trigger: ':tc:',
    classPrefix: 'tc-',
  },

  // Shortcuts
  shortcuts: {
    'btn': 'px-4 py-2 rounded font-semibold transition-colors',
    'btn-primary': 'btn bg-primary text-white hover:bg-blue-600',
    'btn-secondary': 'btn bg-secondary text-white hover:bg-purple-600',
    'card': 'rounded-lg shadow-md p-6 bg-white',
  },

  // Custom rules
  rules: {
    'bg-gradient-primary': {
      'background-image': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
  },
} satisfies CssOptions

export default config

```## Environment-Specific Configuration

You can create different configurations for different environments:```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: isProd ? './dist/styles.min.css' : './dist/styles.css',

  preflight: true,
  minify: isProd,

  compileClass: {
    enabled: isProd, // Only compile in production
  },
} satisfies CssOptions

export default config
```## TypeScript Support

ts-css provides full TypeScript support with type checking and autocomplete:```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

// Use satisfies for type checking while preserving literal types
const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
} satisfies CssOptions

export default config

```## Configuration Loading

ts-css automatically searches for configuration files in this order:

1.`css.config.ts`2.`css.config.js`3.`css.config.mjs`You can also specify a custom config path:```bash
cssx build --config ./config/custom.config.ts
```## Configuration Override

CLI options override configuration file settings:```bash

# Override output path

cssx build --output ./dist/custom.css

# Override content patterns

cssx build --content "./src/**/*.tsx"

```## Best Practices

1.**Use TypeScript**- Enable type checking with`satisfies CssOptions`
2.**Specific Content Patterns**- Use precise glob patterns for better performance
3.**Environment Variables**- Use environment variables for environment-specific settings
4.**Organize Presets**- Extract common configurations into reusable presets
5.**Version Control**- Commit your configuration file to version control
6.**Comment Complex Rules**- Add comments to explain custom rules and utilities

## Related

- [CLI Reference](./features/cli.md)
- [Compile Class Transformer](./features/compile-class.md)
- [Theme Customization](./advanced/theme-customization.md)
- [Custom Rules](./advanced/custom-rules.md)
- [Shortcuts](./features/shortcuts.md)
