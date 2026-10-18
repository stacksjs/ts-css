# Theme Customization

ts-css's theme system allows you to customize every aspect of your design tokens including colors, spacing, typography, and more. The theme is fully compatible with Tailwind CSS, making migration seamless.

## Overview

The theme configuration defines the design tokens that utilities are generated from. When you use a utility like `bg-blue-500`or`p-4`, ts-css looks up the value in your theme configuration.

```typescript
// css.config.ts
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  theme: {
    colors: {
      primary: '#3b82f6', // bg-primary
      secondary: '#8b5cf6', // bg-secondary
    },
    spacing: {
      4: '1rem', // p-4, m-4, etc.
      8: '2rem', // p-8, m-8, etc.
    },
  },
} satisfies CssOptions

export default config
```## Colors

### Basic Colors

Define simple color values:```typescript
const config = {
  theme: {
    colors: {
      black: '#000000',
      white: '#ffffff',
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      danger: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
    },
  },
}

```**Usage:**```html
<div class="bg-primary text-white">Primary</div>
<div class="bg-danger text-white">Danger</div>
<div class="border-2 border-success">Success</div>
```### Color Scales

Define color palettes with shades:```typescript
const config = {
  theme: {
    colors: {
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      blue: {
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
    },
  },
}

```**Usage:**```html
<div class="bg-gray-100 text-gray-900">Light gray</div>
<div class="bg-blue-500 text-white">Blue 500</div>
<div class="border border-gray-300">Border</div>
```### Custom Color Names

Use any naming convention you prefer:```typescript
const config = {
  theme: {
    colors: {
      brand: {
        light: '#bfdbfe',
        DEFAULT: '#3b82f6',
        dark: '#1e40af',
      },
      accent: '#f59e0b',
      neutral: {
        100: '#f5f5f5',
        900: '#171717',
      },
    },
  },
}

```**Usage:**```html
<div class="bg-brand">Uses DEFAULT value</div>
<div class="bg-brand-light">Light brand</div>
<div class="text-accent">Accent text</div>
```### RGB/HSL Colors

Use any valid CSS color format:```typescript
const config = {
  theme: {
    colors: {
      primary: 'rgb(59, 130, 246)',
      secondary: 'hsl(258, 90%, 66%)',
      transparent: 'transparent',
      current: 'currentColor',
    },
  },
}

```### CSS Variables

Reference CSS custom properties:```typescript
const config = {
  theme: {
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      background: 'var(--color-bg)',
      foreground: 'var(--color-fg)',
    },
  },
}
```**CSS:**```css

:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-bg: #ffffff;
  --color-fg: #000000;
}

.dark {
  --color-bg: #000000;
  --color-fg: #ffffff;
}

```## Spacing

Control padding, margin, width, height, and other space-based utilities:```typescript
const config = {
  theme: {
    spacing: {
      0: '0',
      px: '1px',
      0.5: '0.125rem', // 2px
      1: '0.25rem', // 4px
      1.5: '0.375rem', // 6px
      2: '0.5rem', // 8px
      2.5: '0.625rem', // 10px
      3: '0.75rem', // 12px
      3.5: '0.875rem', // 14px
      4: '1rem', // 16px
      5: '1.25rem', // 20px
      6: '1.5rem', // 24px
      7: '1.75rem', // 28px
      8: '2rem', // 32px
      9: '2.25rem', // 36px
      10: '2.5rem', // 40px
      12: '3rem', // 48px
      14: '3.5rem', // 56px
      16: '4rem', // 64px
      20: '5rem', // 80px
      24: '6rem', // 96px
      32: '8rem', // 128px
      40: '10rem', // 160px
      48: '12rem', // 192px
      56: '14rem', // 224px
      64: '16rem', // 256px
    },
  },
}
```**Usage:**```html

<div class="p-4">Padding 1rem</div>
<div class="m-8">Margin 2rem</div>
<div class="w-64">Width 16rem</div>
<div class="gap-2">Gap 0.5rem</div>

```**Applies to:**- Padding: `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`- Margin:`m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`- Width:`w-*`- Height:`h-*`- Gap:`gap-*`, `gap-x-*`, `gap-y-*`- Inset:`top-*`, `right-*`, `bottom-*`, `left-*`, `inset-*`## Typography

### Font Family```typescript

const config = {
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'serif'],
      mono: ['Fira Code', 'Menlo', 'monospace'],
      display: ['Montserrat', 'sans-serif'],
      body: ['Open Sans', 'sans-serif'],
    },
  },
}
```**Usage:**```html

<div class="font-sans">Sans-serif text</div>
<div class="font-serif">Serif text</div>
<div class="font-mono">Monospace text</div>
<div class="font-display">Display text</div>

```### Font Size

Font sizes include both size and line height:```typescript
const config = {
  theme: {
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px, 16px line height
      'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px, 20px line height
      'base': ['1rem', { lineHeight: '1.5rem' }], // 16px, 24px line height
      'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px, 28px line height
      'xl': ['1.25rem', { lineHeight: '1.75rem' }], // 20px, 28px line height
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px, 32px line height
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px, 36px line height
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px, 40px line height
      '5xl': ['3rem', { lineHeight: '1' }], // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
    },
  },
}
```**Usage:**```html

<p class="text-base">Base text</p>
<h1 class="text-4xl">Large heading</h1>
<small class="text-xs">Small text</small>

```### Font Weight

Font weights are built-in but can be customized via custom rules:```html
<div class="font-thin">Thin (100)</div>
<div class="font-light">Light (300)</div>
<div class="font-normal">Normal (400)</div>
<div class="font-medium">Medium (500)</div>
<div class="font-semibold">Semibold (600)</div>
<div class="font-bold">Bold (700)</div>
<div class="font-extrabold">Extrabold (800)</div>
<div class="font-black">Black (900)</div>
```## Borders

### Border Radius```typescript

const config = {
  theme: {
    borderRadius: {
      'none': '0',
      'sm': '0.125rem', // 2px
      'DEFAULT': '0.25rem', // 4px
      'md': '0.375rem', // 6px
      'lg': '0.5rem', // 8px
      'xl': '0.75rem', // 12px
      '2xl': '1rem', // 16px
      '3xl': '1.5rem', // 24px
      'full': '9999px', // Fully rounded
    },
  },
}

```**Usage:**```html
<div class="rounded">Default radius</div>
<div class="rounded-lg">Large radius</div>
<div class="rounded-full">Fully rounded</div>
<div class="rounded-none">No radius</div>
```## Shadows

### Box Shadow```typescript

const config = {
  theme: {
    boxShadow: {
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      'none': 'none',
    },
  },
}

```**Usage:**```html
<div class="shadow">Default shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-none">No shadow</div>
```## Breakpoints

### Screen Sizes```typescript

const config = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}

```**Usage:**```html
<div class="text-base md:text-lg lg:text-xl">
  Responsive text
</div>
```### Custom Breakpoints```typescript

const config = {
  theme: {
    screens: {
      mobile: '320px',
      tablet: '640px',
      laptop: '1024px',
      desktop: '1280px',
      wide: '1920px',
      ultrawide: '2560px',
    },
  },
}

```**Usage:**```html
<div class="grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4">
  Custom breakpoints
</div>
```## Complete Theme Example```typescript

import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  theme: {
    // Colors
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',

      // Brand colors
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

      // Neutrals
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },

      // Semantic colors
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },

    // Spacing
    spacing: {
      0: '0',
      px: '1px',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },

    // Typography
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
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
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },

    // Borders
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      'DEFAULT': '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      'full': '9999px',
    },

    // Shadows
    boxShadow: {
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      'none': 'none',
    },

    // Breakpoints
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
} satisfies CssOptions

export default config

```## Advanced Patterns

### Theme Variants

Create different themes for different projects:```typescript
// themes/light.ts
// css.config.ts
import { lightTheme } from './themes/light'

export const lightTheme = {
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#3b82f6',
  },
}

// themes/dark.ts
export const darkTheme = {
  colors: {
    background: '#000000',
    foreground: '#ffffff',
    primary: '#60a5fa',
  },
}

const config = {
  theme: lightTheme,
}
```### Dynamic Themes```typescript

const isDark = process.env.THEME === 'dark'

const config = {
  theme: {
    colors: {
      background: isDark ? '#000000' : '#ffffff',
      foreground: isDark ? '#ffffff' : '#000000',
    },
  },
}

```### Extending Default Theme

Merge with the default theme:```typescript
import { defaultConfig } from '@stacksjs/ts-css/engine'

const config = {
  theme: {
    ...defaultConfig.theme,
    colors: {
      ...defaultConfig.theme.colors,
      brand: '#3b82f6', // Add custom color
    },
  },
}
```## Best Practices

### 1. Use Consistent Scales

Maintain consistent spacing and sizing:```typescript
// ✅ Good - consistent scale
spacing: {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  // ... continues consistently
}

// ❌ Avoid - inconsistent scale
spacing: {
  0: '0',
  1: '0.3rem',    // Inconsistent increment
  2: '0.7rem',    // Inconsistent increment
  3: '1.2rem',    // Inconsistent increment
}

```### 2. Name Colors Semantically```typescript
// ✅ Good - semantic names
colors: {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
}

// ❌ Avoid - non-semantic names
colors: {
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
}
```### 3. Document Custom Values```typescript

const config = {
  theme: {
    // Brand colors from design system v2.0
    colors: {
      brand: '#3b82f6', // Primary brand color
      accent: '#f59e0b', // Accent for CTAs
      muted: '#6b7280', // Text muted state
    },

    // Spacing follows 4px grid
    spacing: {
      // ... spacing values
    },
  },
}

```### 4. Organize Large Themes```typescript
// theme/colors.ts
// css.config.ts
import { colors } from './theme/colors'
import { spacing } from './theme/spacing'
import { typography } from './theme/typography'

export const colors = { /*colors*/ }

// theme/spacing.ts
export const spacing = { /*spacing*/ }

// theme/typography.ts
export const typography = { /*typography*/ }

const config = {
  theme: {
    colors,
    spacing,
    ...typography,
  },
}
```## Migration from Tailwind

ts-css themes are 100% compatible with Tailwind CSS:```typescript
// Your existing Tailwind config works as-is
const config = {
  theme: {
    // Copy your entire Tailwind theme here
    extend: {
      // Or use extend pattern
      colors: {
        custom: '#123456',
      },
    },
  },
}

```## Troubleshooting

### Color Not Working**Check:**1. Color is defined in theme:```typescript

   theme: {
     colors: {
       primary: '#3b82f6', // ✅
     },
   }
   ```2. Using correct utility:```html
   <div class="bg-primary">✅ Works</div>
   <div class="background-primary">❌ Wrong utility</div>
   ```### Spacing Values Not Applied**Check:**1. Using numeric keys:```typescript
   spacing: {
     4: '1rem',    // ✅
     'four': '1rem', // ❌ Won't work with p-four
   }
   ```2. Values are strings:```typescript
   spacing: {
     4: '1rem',  // ✅
     8: 2,       // ❌ Should be '2rem'
   }
   ```

## Related

- [Configuration](../config.md) - Full configuration reference
- [Presets](./presets.md) - Share theme configurations
- [Custom Rules](./custom-rules.md) - Extend theme with custom rules
- [Usage Guide](../usage.md) - Using theme utilities
