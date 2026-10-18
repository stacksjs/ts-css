# Custom Rules

Custom rules allow you to extend ts-css with your own utility patterns and CSS properties beyond the built-in utilities.

## Overview

While ts-css includes comprehensive built-in utilities, you can add custom rules to:

- Create domain-specific utilities
- Add vendor-prefixed properties
- Support experimental CSS features
- Implement custom design patterns

## Basic Custom Rules

Define custom rules in your configuration:

```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  rules: [
    // Static rule
    [
      /^custom-utility$/,
      () => ({
        'custom-property': 'value',
      }),
    ],

    // Dynamic rule with pattern matching
    [
      /^custom-(\w+)$/,
      match => ({
        'custom-property': match[1],
      }),
    ],
  ],
} satisfies CssOptions

export default config
```## Rule Format

Each custom rule is a tuple:```typescript
type CustomRule = [
  RegExp, // Pattern to match
  (match: RegExpMatchArray) => Record<string, string> | undefined
]

```### Pattern (RegExp)

The first element is a regular expression that matches utility class names:```typescript
/^my-utility-(\d+)$/  // Matches: my-utility-1, my-utility-24, etc.
/^custom-(\w+)$/      // Matches: custom-red, custom-blue, etc.
/^prefix-/            // Matches: anything starting with prefix-
```### Handler Function

The second element is a function that returns CSS properties:```typescript
(match: RegExpMatchArray) => {
  return {
    'property-name': 'value',
    'another-property': 'another-value',
  }
}

```Return`undefined`to skip generating CSS for the match.

## Examples

### Simple Static Rule```typescript

const config = {
  rules: [
    [
      /^glass$/,
      () => ({
        'background': 'rgba(255, 255, 255, 0.1)',
        'backdrop-filter': 'blur(10px)',
        'border': '1px solid rgba(255, 255, 255, 0.2)',
      }),
    ],
  ],
}
```Usage:```html

<div class="glass">Glassmorphism effect</div>

```### Dynamic Numeric Values```typescript
const config = {
  rules: [
    [
      /^aspect-(\d+)\/(\d+)$/,
      match => ({
        'aspect-ratio': `${match[1]} / ${match[2]}`,
      }),
    ],
  ],
}
```Usage:```html

<div class="aspect-16/9">16:9 aspect ratio</div>
<div class="aspect-4/3">4:3 aspect ratio</div>

```### Color Utilities```typescript
const config = {
  rules: [
    [
      /^brand-(\w+)$/,
      (match) => {
        const colors: Record<string, string> = {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#f59e0b',
        }

        const color = colors[match[1]]
        if (!color)
          return undefined

        return {
          color,
        }
      },
    ],
  ],
}
```Usage:```html

<span class="brand-primary">Primary brand color</span>
<span class="brand-secondary">Secondary brand color</span>

```### Grid Template Utilities```typescript
const config = {
  rules: [
    [
      /^grid-areas-(\w+)$/,
      (match) => {
        const templates: Record<string, string> = {
          header: '"header header" "nav main" "footer footer"',
          sidebar: '"sidebar main" "sidebar footer"',
          dashboard: '"header header header" "nav content aside" "footer footer footer"',
        }

        const template = templates[match[1]]
        if (!template)
          return undefined

        return {
          'grid-template-areas': template,
        }
      },
    ],
  ],
}
```Usage:```html

<div class="grid grid-areas-header">
  <header class="grid-area-[header]">Header</header>
  <nav class="grid-area-[nav]">Nav</nav>
  <main class="grid-area-[main]">Main</main>
</div>

```### Animation Utilities```typescript
const config = {
  rules: [
    [
      /^animate-delay-(\d+)$/,
      match => ({
        'animation-delay': `${match[1]}ms`,
      }),
    ],
    [
      /^animate-duration-(\d+)$/,
      match => ({
        'animation-duration': `${match[1]}ms`,
      }),
    ],
  ],
}
```Usage:```html

<div class="animate-delay-500 animate-duration-1000">
  Delayed animation
</div>

```## Advanced Patterns

### Multiple Properties

Generate multiple CSS properties from a single utility:```typescript
const config = {
  rules: [
    [
      /^truncate-(\d+)$/,
      match => ({
        'overflow': 'hidden',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'max-width': `${match[1]}ch`,
      }),
    ],
  ],
}
```### Conditional Logic

Use conditional logic in handlers:```typescript
const config = {
  rules: [
    [
      /^size-(\w+)$/,
      (match) => {
        const value = match[1]

        // Custom size mapping
        if (value === 'xs') {
          return { width: '16px', height: '16px' }
        }
        if (value === 'sm') {
          return { width: '24px', height: '24px' }
        }
        if (value === 'md') {
          return { width: '32px', height: '32px' }
        }
        if (value === 'lg') {
          return { width: '48px', height: '48px' }
        }

        return undefined
      },
    ],
  ],
}

```### Using Theme Values

Access theme values in custom rules:```typescript
import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  theme: {
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '2rem',
      lg: '4rem',
    },
  },

  rules: [
    [
      /^gap-custom-(\w+)$/,
      (match) => {
        const spacingKey = match[1]
        const spacing = config.theme.spacing[spacingKey]

        if (!spacing)
          return undefined

        return {
          gap: spacing,
        }
      },
    ],
  ],
} satisfies CssOptions
```### Vendor Prefixes

Add vendor prefixes for experimental features:```typescript
const config = {
  rules: [
    [
      /^backdrop-blur-(\d+)$/,
      (match) => {
        const value = `blur(${match[1]}px)`return {
          '-webkit-backdrop-filter': value,
          'backdrop-filter': value,
        }
      },
    ],
  ],
}```### Child Selectors

Return utilities that affect child elements:```typescript
const config = {
  rules: [
    [
      /^stack-(\d+)$/,
      match => ({
        '>*+*': {
          'margin-top': `${match[1]*0.25}rem`,
        },
      }),
    ],
  ],
}

```## Complex Examples

### Glassmorphism Utility```typescript

const config = {
  rules: [
    [
      /^glass-(\w+)$/,
      (match) => {
        const variants: Record<string, any> = {
          light: {
            'background': 'rgba(255, 255, 255, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(255, 255, 255, 0.2)',
          },
          dark: {
            'background': 'rgba(0, 0, 0, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(0, 0, 0, 0.2)',
          },
          colored: {
            'background': 'rgba(59, 130, 246, 0.1)',
            'backdrop-filter': 'blur(10px)',
            'border': '1px solid rgba(59, 130, 246, 0.2)',
          },
        }

        return variants[match[1]]
      },
    ],
  ],
}
```### Gradient Utilities```typescript

const config = {
  rules: [
    [
      /^gradient-(\w+)-to-(\w+)$/,
      (match) => {
        const from = match[1]
        const to = match[2]

        const colors: Record<string, string> = {
          red: '#ef4444',
          blue: '#3b82f6',
          green: '#10b981',
          purple: '#8b5cf6',
          pink: '#ec4899',
        }

        const fromColor = colors[from]
        const toColor = colors[to]

        if (!fromColor || !toColor)
          return undefined

        return {
          'background-image': `linear-gradient(to right, ${fromColor}, ${toColor})`,
        }
      },
    ],
  ],
}

```Usage:```html
<div class="gradient-blue-to-purple">
  Blue to purple gradient
</div>
```### Responsive Font Sizes```typescript

const config = {
  rules: [
    [
      /^fluid-text-(\w+)$/,
      (match) => {
        const sizes: Record<string, string> = {
          sm: 'clamp(0.875rem, 2vw, 1rem)',
          md: 'clamp(1rem, 2.5vw, 1.25rem)',
          lg: 'clamp(1.25rem, 3vw, 1.875rem)',
          xl: 'clamp(1.875rem, 4vw, 3rem)',
        }

        const size = sizes[match[1]]
        if (!size)
          return undefined

        return {
          'font-size': size,
        }
      },
    ],
  ],
}

```

## Best Practices

### 1. Use Specific Patterns

✅**Good:**```typescript
/^my-utility-(\d+)$/ // Specific pattern
```

❌**Avoid:**```typescript
/^my-/ // Too broad, might conflict

```### 2. Validate Input```typescript
const config = {
  rules: [
    [
      /^custom-(\d+)$/,
      (match) => {
        const value = Number.parseInt(match[1])

        // Validate range
        if (value < 0 || value > 100) {
          return undefined
        }

        return {
          'custom-property': `${value}%`,
        }
      },
    ],
  ],
}
```### 3. Return Undefined for Invalid Values```typescript

const config = {
  rules: [
    [
      /^size-(\w+)$/,
      (match) => {
        const validSizes = ['sm', 'md', 'lg']

        if (!validSizes.includes(match[1])) {
          return undefined // Don't generate CSS
        }

        return { /*...*/ }
      },
    ],
  ],
}

```### 4. Document Your Rules```typescript
const config = {
  rules: [
    // Custom aspect ratio utility
    // Usage: aspect-16/9, aspect-4/3
    [
      /^aspect-(\d+)\/(\d+)$/,
      match => ({
        'aspect-ratio': `${match[1]} / ${match[2]}`,
      }),
    ],

    // Glassmorphism effect
    // Usage: glass-light, glass-dark
    [
      /^glass-(\w+)$/,
      (match) => {
        // Implementation
      },
    ],
  ],
}
```### 5. Namespace Custom Utilities```typescript

// Prefix with your project/brand name
/^acme-(\w+)$/      // Acme Corp utilities
/^myapp-(\w+)$/     // MyApp utilities
/^custom-(\w+)$/    // Generic custom utilities

```

## Performance

Custom rules have minimal performance impact:

-**Matching:**Regex matching is fast
-**Generation:**Only matched classes generate CSS
-**Output:**Same as built-in utilities

### Optimization Tips

1.**Use specific patterns:**```typescript
   // ✅ Fast
   /^my-utility-(\d+)$/

   // ❌ Slower (too broad)
   /^my-/
   ```

2.**Avoid complex logic:**```typescript
   // ✅ Simple check
   if (value === 'sm')
     return { /*...*/ }

   // ❌ Complex computation
   if (expensiveFunction(value))
     return { /*...*/ }
   ```

3.**Cache computed values:**```typescript
   const computedValues = new Map()

   const rule = [
     /^custom-(\w+)$/,
     (match) => {
       const key = match[1]

       if (computedValues.has(key)) {
         return computedValues.get(key)
       }

       const result = { /*computed properties*/ }
       computedValues.set(key, result)
       return result
     },
   ]
   ```## Troubleshooting

### Rule Not Matching**Check:**1. Pattern is correct:```typescript

   // Test pattern
   /^my-utility-(\d+)$/.test('my-utility-10') // true
   ```2. Class name matches exactly:```html
   <div class="my-utility-10">✅ Matches</div>
   <div class="my-utility-abc">❌ No match</div>
   ```3. Handler returns valid object:```typescript
   (match) => {
     console.log('Match:', match)
     return { /*properties*/ }
   }
   ```### No CSS Generated**Check:**1. Handler returns object (not undefined)

2. Properties are valid CSS
3. Rule is added to config array

### Conflicts with Built-in Utilities**Solution:**Use unique prefixes:```typescript

// ❌ Conflicts with built-in 'flex'
/^flex$/

// ✅ Unique prefix
/^custom-flex$/
```

## Related

- [Configuration](../config.md) - Full configuration guide
- [Shortcuts](../features/shortcuts.md) - Reusable utility combinations
- [Presets](./presets.md) - Share custom rules across projects
- [TypeScript](../features/typescript.md) - Type-safe custom rules
