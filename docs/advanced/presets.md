# Presets

Presets allow you to create reusable, shareable configurations that can be used across multiple ts-css projects. They're perfect for maintaining design systems, organizational standards, or common UI patterns.

## Overview

A preset is a configuration object that can include theme customization, shortcuts, custom rules, variants, and preflight CSS. Instead of duplicating configurations across projects, you can package them as presets and import them where needed.

```typescript
// Before: Duplicate configuration in each project
// project-a/css.config.ts
// After: Share configuration via preset
import { companyPreset } from '@company/ts-css-preset'

const config = {
  theme: { colors: { primary: '#3b82f6' } },
  shortcuts: { btn: 'px-4 py-2 rounded' },
}

// project-b/css.config.ts
const config = {
  theme: { colors: { primary: '#3b82f6' } },
  shortcuts: { btn: 'px-4 py-2 rounded' },
}

const config = {
  presets: [companyPreset],
}
```## Creating a Preset

### Basic Preset Structure

A preset is an object that implements the`Preset`interface:```typescript
import type { Preset } from '@stacksjs/ts-css/engine'

export const myPreset: Preset = {
  name: 'my-preset',
  theme: {
    // Theme customization
  },
  shortcuts: {
    // Shortcuts
  },
  rules: [
    // Custom rules
  ],
  variants: {
    // Variant configuration
  },
  preflights: [
    // Preflight CSS
  ],
}

```### Simple Example```typescript
// presets/minimal.ts
import type { Preset } from '@stacksjs/ts-css/engine'

export const minimalPreset: Preset = {
  name: 'minimal',
  theme: {
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
    },
    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      4: '1rem',
      8: '2rem',
    },
  },
  shortcuts: {
    'btn': 'px-4 py-2 border-2 border-black transition-colors',
    'btn-filled': 'btn bg-black text-white hover:bg-gray-800',
    'btn-outline': 'btn bg-white text-black hover:bg-gray-100',
  },
}
```## Using Presets

### Single Preset```typescript

// css.config.ts
import type { CssOptions } from '@stacksjs/ts-css/engine'
import { minimalPreset } from './presets/minimal'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  output: './dist/styles.css',
  presets: [minimalPreset],
} satisfies CssOptions

export default config

```### Multiple Presets

Presets are merged in order, with later presets taking precedence:```typescript
import { basePreset } from './presets/base'
import { componentsPreset } from './presets/components'
import { utilitiesPreset } from './presets/utilities'

const config = {
  presets: [
    basePreset, // Applied first
    componentsPreset, // Applied second, overrides base
    utilitiesPreset, // Applied last, overrides both
  ],
}
```### Extending Presets

You can extend a preset with additional configuration:```typescript
import { companyPreset } from '@company/ts-css-preset'

const config = {
  presets: [companyPreset],

  // Add or override theme values
  theme: {
    colors: {
      accent: '#ff5500', // Add new color
    },
  },

  // Add custom shortcuts
  shortcuts: {
    'project-specific': 'custom utilities',
  },
}

```## Preset Examples

### Design System Preset```typescript

// presets/design-system.ts
import type { Preset } from '@stacksjs/ts-css/engine'

export const designSystemPreset: Preset = {
  name: 'design-system',

  theme: {
    colors: {
      brand: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },

    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },

    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },

    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
    },
  },

  shortcuts: {
    // Buttons
    'btn': 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    'btn-primary': 'btn bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    'btn-success': 'btn bg-success text-white hover:opacity-90 focus:ring-success',
    'btn-danger': 'btn bg-danger text-white hover:opacity-90 focus:ring-danger',

    // Cards
    'card': 'bg-white rounded-lg shadow',
    'card-header': 'px-6 py-4 border-b border-gray-200',
    'card-body': 'px-6 py-4',
    'card-footer': 'px-6 py-4 bg-gray-50 border-t border-gray-200',

    // Forms
    'input': 'block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500',
    'label': 'block text-sm font-medium text-gray-700 mb-1',
  },
}
```### Component Library Preset```typescript

// presets/components.ts
import type { Preset } from '@stacksjs/ts-css/engine'

export const componentsPreset: Preset = {
  name: 'components',

  shortcuts: {
    // Navigation
    'nav': 'flex items-center justify-between px-6 py-4 bg-white shadow',
    'nav-link': 'px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors',
    'nav-link-active': 'nav-link text-blue-500 font-semibold',

    // Badges
    'badge': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    'badge-primary': 'badge bg-blue-100 text-blue-800',
    'badge-success': 'badge bg-green-100 text-green-800',
    'badge-warning': 'badge bg-yellow-100 text-yellow-800',
    'badge-danger': 'badge bg-red-100 text-red-800',

    // Alerts
    'alert': 'p-4 rounded-md',
    'alert-info': 'alert bg-blue-50 text-blue-800 border border-blue-200',
    'alert-success': 'alert bg-green-50 text-green-800 border border-green-200',
    'alert-warning': 'alert bg-yellow-50 text-yellow-800 border border-yellow-200',
    'alert-danger': 'alert bg-red-50 text-red-800 border border-red-200',

    // Modals
    'modal-overlay': 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4',
    'modal': 'bg-white rounded-lg shadow-xl max-w-md w-full',
    'modal-header': 'px-6 py-4 border-b border-gray-200',
    'modal-body': 'px-6 py-4',
    'modal-footer': 'px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2',

    // Tables
    'table': 'min-w-full divide-y divide-gray-200',
    'table-header': 'bg-gray-50',
    'table-row': 'hover:bg-gray-50 transition-colors',
    'table-cell': 'px-6 py-4 whitespace-nowrap text-sm',
  },
}

```### Utility Preset```typescript
// presets/utilities.ts
import type { Preset } from '@stacksjs/ts-css/engine'

export const utilitiesPreset: Preset = {
  name: 'utilities',

  shortcuts: {
    // Layout helpers
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // Container
    'container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'container-sm': 'max-w-4xl mx-auto px-4',
    'container-xs': 'max-w-2xl mx-auto px-4',

    // Typography
    'text-link': 'text-blue-500 hover:text-blue-600 underline',
    'text-muted': 'text-gray-600',
    'text-emphasis': 'text-gray-900 font-semibold',

    // Truncate
    'truncate-1': 'overflow-hidden text-ellipsis line-clamp-1',
    'truncate-2': 'overflow-hidden text-ellipsis line-clamp-2',
    'truncate-3': 'overflow-hidden text-ellipsis line-clamp-3',
  },

  rules: [
    // Custom gradient rule
    [
      /^bg-gradient-(\w+)$/,
      (match) => {
        const direction = match[1]
        const directions: Record<string, string> = {
          t: 'to top',
          r: 'to right',
          b: 'to bottom',
          l: 'to left',
          tr: 'to top right',
          br: 'to bottom right',
          bl: 'to bottom left',
          tl: 'to top left',
        }
        return {
          'background-image': `linear-gradient(${directions[direction] || 'to right'}, var(--tw-gradient-stops))`,
        }
      },
    ],
  ],
}
```### Framework-Specific Preset```typescript

// presets/react.ts
import type { Preset } from '@stacksjs/ts-css/engine'

export const reactPreset: Preset = {
  name: 'react',

  shortcuts: {
    // React-specific component patterns
    'react-button': 'px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    'react-input': 'block w-full px-3 py-2 border rounded-md focus:outline-none disabled:bg-gray-100',
    'react-select': 'block w-full px-3 py-2 border rounded-md focus:outline-none appearance-none',

    // Loading states
    'loading': 'animate-pulse',
    'loading-spinner': 'animate-spin',

    // Focus visible (keyboard navigation)
    'focus-ring': 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  },

  variants: {
    // Enable all variants for React components
    'hover': true,
    'focus': true,
    'active': true,
    'disabled': true,
    'focus-visible': true,
    'focus-within': true,
  },
}

```## Publishing Presets

### As NPM Package

Create a shareable preset package:```bash

# Create package

mkdir my-ts-css-preset
cd my-ts-css-preset
bun init

# Package structure

my-ts-css-preset/
├── package.json
├── src/
│   └── index.ts
└── tsconfig.json
```

```typescript
// src/index.ts
import type { Preset } from '@stacksjs/ts-css/engine'

export const myPreset: Preset = {
  name: 'my-preset',
  // ... configuration
}

export default myPreset
```

```json
// package.json
{
  "name": "@company/ts-css-preset",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "bun run build"
  },
  "peerDependencies": {
    "@stacksjs/ts-css/engine": ">=1.0.0"
  },
  "devDependencies": {
    "@stacksjs/ts-css/engine": "latest",
    "typescript": "latest"
  }
}
```### Usage of Published Preset```bash

bun add @company/ts-css-preset

```

```typescript

// css.config.ts
import { myPreset } from '@company/ts-css-preset'

const config = {
  presets: [myPreset],
}

```## Preset Composition

### Layered Presets

Build complex configurations by layering presets:```typescript
// Base layer - foundational styles
const basePreset: Preset = {
  name: 'base',
  theme: {
    colors: { /*base colors*/ },
  },
}

// Component layer - reusable components
const componentPreset: Preset = {
  name: 'components',
  shortcuts: { /*component shortcuts*/ },
}

// Brand layer - company branding
const brandPreset: Preset = {
  name: 'brand',
  theme: {
    colors: { brand: '#3b82f6' },
  },
}

// Combine in config
const config = {
  presets: [basePreset, componentPreset, brandPreset],
}
```### Conditional Presets

Apply presets based on environment:```typescript
const isDev = process.env.NODE_ENV === 'development'

const config = {
  presets: [
    basePreset,
    componentPreset,
    ...(isDev ? [devPreset] : [prodPreset]),
  ],
}

```## Advanced Preset Patterns

### Preset with Custom Preflight```typescript

import type { Preflight, Preset } from '@stacksjs/ts-css/engine'

const customPreflight: Preflight = {
  getCSS: () => `/*Custom reset*/*{

      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-family: 'Inter', sans-serif;
    }

    body {
      line-height: 1.6;
      color: #333;
    }`,
}

export const presetWithPreflight: Preset = {
  name: 'with-preflight',
  preflights: [customPreflight],
}
```### Preset Factory

Create presets dynamically:```typescript
interface BrandConfig {
  primary: string
  secondary: string
  accent: string
}

export function createBrandPreset(brand: BrandConfig): Preset {
  return {
    name: `brand-${brand.primary}`,
    theme: {
      colors: {
        primary: brand.primary,
        secondary: brand.secondary,
        accent: brand.accent,
      },
    },
    shortcuts: {
      'btn-primary': `btn bg-[${brand.primary}] text-white`,
      'btn-secondary': `btn bg-[${brand.secondary}] text-white`,
      'link': `text-[${brand.accent}] hover:underline`,
    },
  }
}

// Usage
const myBrandPreset = createBrandPreset({
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#10b981',
})

const config = {
  presets: [myBrandPreset],
}

```## Best Practices

### 1. Name Your Presets

Always provide a descriptive name:```typescript
const preset: Preset = {
  name: 'company-design-system', // ✅ Clear and descriptive
  // ...
}
```### 2. Document Your Presets

Include documentation in your preset files:```typescript
/***Company Design System Preset**Includes:*- Brand colors and typography*- Standard component shortcuts*- Form utilities**@example*import { companyPreset } from '@company/ts-css-preset'**const config = {*presets: [companyPreset],*}*/
export const companyPreset: Preset = {
  // ...
}

```### 3. Version Your Presets

Use semantic versioning for published presets:***Major**: Breaking changes to shortcuts or theme***Minor**: New shortcuts or theme additions***Patch**: Bug fixes or improvements

### 4. Keep Presets Focused

Create multiple focused presets rather than one monolithic preset:```typescript
import { componentPreset } from './presets/components'
// ❌ Avoid - everything in one preset
import { everythingPreset } from './presets/everything'
// ✅ Good - focused presets
import { themePreset } from './presets/theme'

import { utilityPreset } from './presets/utilities'
```### 5. Provide Examples

Include usage examples with your preset:```typescript
// presets/example.ts
export const examplePreset: Preset = {
  name: 'example',
  shortcuts: {
    btn: 'px-4 py-2 rounded',
  },
}

// Example usage
const exampleConfig = {
  presets: [examplePreset],
}

// <button class="btn">Click Me</button>

```## Troubleshooting

### Preset Not Applied**Check:**1. Preset is imported correctly:```typescript

   import { myPreset } from './presets/my-preset'
   ```2. Preset is added to config:```typescript
   const config = {
     presets: [myPreset], // ✅
   }
   ```3. Preset has correct structure:```typescript
   const preset: Preset = {
     name: 'my-preset', // Required
     // ...
   }
   ```### Preset Order Issues**Problem:**Later presets override earlier ones**Solution:**Order presets from most general to most specific:```typescript
const config = {
  presets: [
    generalPreset, // Base configuration
    specificPreset, // More specific overrides
  ],
}
```### Type Errors**Problem:**TypeScript errors when creating preset**Solution:**Import and use the`Preset`type:```typescript

import type { Preset } from '@stacksjs/ts-css/engine'

export const myPreset: Preset = {
  name: 'my-preset',
  // TypeScript will validate structure
}

```

## Related*[Configuration](../config.md) - Main configuration options*[Theme Customization](./theme-customization.md) - Customizing themes*[Shortcuts](../features/shortcuts.md) - Creating shortcuts*[Custom Rules](./custom-rules.md) - Adding custom rules
