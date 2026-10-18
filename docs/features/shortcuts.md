# Shortcuts

Shortcuts allow you to create reusable utility combinations, reducing repetition and maintaining consistency across your project.

## Overview

Instead of writing the same combination of utilities multiple times:

```html
<!-- Repeated pattern -->
<button class="px-4 py-2 rounded font-semibold transition-colors bg-blue-500 text-white hover:bg-blue-600">
  Button 1
</button>

<button class="px-4 py-2 rounded font-semibold transition-colors bg-blue-500 text-white hover:bg-blue-600">
  Button 2
</button>
```Define a shortcut once and reuse it:```typescript

// css.config.ts
const config = {
  shortcuts: {
    'btn-primary': 'px-4 py-2 rounded font-semibold transition-colors bg-blue-500 text-white hover:bg-blue-600',
  },
}

```

```html

<button class="btn-primary">Button 1</button>
<button class="btn-primary">Button 2</button>

```## Configuration

Define shortcuts in your`css.config.ts`:

```typescript

import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  shortcuts: {
    // Button variants
    'btn': 'px-4 py-2 rounded font-semibold transition-colors',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'btn-secondary': 'btn bg-gray-500 text-white hover:bg-gray-600',
    'btn-danger': 'btn bg-red-500 text-white hover:bg-red-600',

    // Card styles
    'card': 'rounded-lg shadow-md p-6 bg-white',
    'card-header': 'font-bold text-xl mb-4',
    'card-body': 'text-gray-700',

    // Form inputs
    'input': 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
    'input-error': 'input border-red-500 focus:ring-red-500',
  },
} satisfies CssOptions

export default config

```## String vs Array Format

Shortcuts can be defined as strings or arrays:

### String Format```typescript

const config = {
  shortcuts: {
    btn: 'px-4 py-2 rounded font-semibold transition-colors',
  },
}
```### Array Format```typescript

const config = {
  shortcuts: {
    btn: ['px-4', 'py-2', 'rounded', 'font-semibold', 'transition-colors'],
  },
}

```Both formats generate the same CSS. Use whichever you prefer for readability.

## Composing Shortcuts

Shortcuts can reference other shortcuts:```typescript
const config = {
  shortcuts: {
    // Base button
    'btn': 'px-4 py-2 rounded font-semibold transition-colors',

    // Variants build on base
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'btn-secondary': 'btn bg-gray-500 text-white hover:bg-gray-600',

    // Sizes build on variants
    'btn-primary-lg': 'btn-primary px-6 py-3 text-lg',
    'btn-primary-sm': 'btn-primary px-2 py-1 text-sm',
  },
}
```## Usage Examples

### Button System```typescript

// Config
const config = {
  shortcuts: {
    // Base
    'btn': 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',

    // Sizes
    'btn-sm': 'btn px-3 py-1.5 text-sm rounded',
    'btn-md': 'btn px-4 py-2 text-base rounded-md',
    'btn-lg': 'btn px-6 py-3 text-lg rounded-lg',

    // Variants
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    'btn-danger': 'btn bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    'btn-ghost': 'btn text-gray-700 hover:bg-gray-100 focus:ring-gray-500',

    // Combined
    'btn-primary-sm': 'btn-primary btn-sm',
    'btn-primary-lg': 'btn-primary btn-lg',
  },
}

```

```html

<button class="btn-primary-sm">Small Primary</button>
<button class="btn-primary-lg">Large Primary</button>
<button class="btn-secondary-md">Medium Secondary</button>
<button class="btn-ghost-sm">Small Ghost</button>

```### Card Components```typescript
const config = {
  shortcuts: {
    // Cards
    'card': 'bg-white rounded-lg shadow overflow-hidden',
    'card-bordered': 'card border border-gray-200',
    'card-hover': 'card transition-shadow hover:shadow-lg',

    // Card sections
    'card-header': 'px-6 py-4 border-b border-gray-200',
    'card-body': 'px-6 py-4',
    'card-footer': 'px-6 py-4 bg-gray-50 border-t border-gray-200',

    // Content
    'card-title': 'text-xl font-bold text-gray-900',
    'card-description': 'text-gray-600 mt-1',
  },
}
```

```html
<div class="card-hover">
  <div class="card-header">
    <h2 class="card-title">Card Title</h2>
    <p class="card-description">Card description</p>
  </div>
  <div class="card-body">
    <p>Card content goes here</p>
  </div>
  <div class="card-footer">
    <button class="btn-primary">Action</button>
  </div>
</div>
```### Form Elements```typescript

const config = {
  shortcuts: {
    // Inputs
    'input': 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
    'input-sm': 'input py-1 text-sm',
    'input-lg': 'input py-3 text-lg',
    'input-error': 'input border-red-500 focus:ring-red-500 focus:border-red-500',

    // Labels
    'label': 'block text-sm font-medium text-gray-700 mb-1',
    'label-required': 'label after:content-["*"] after:ml-1 after:text-red-500',

    // Form groups
    'form-group': 'mb-4',
    'form-error': 'text-red-500 text-sm mt-1',
    'form-help': 'text-gray-500 text-sm mt-1',
  },
}

```

```html

<div class="form-group">
  <label class="label-required">Email</label>
  <input type="email" class="input" placeholder="you@example.com" />
  <p class="form-help">We'll never share your email</p>
</div>

<div class="form-group">
  <label class="label">Password</label>
  <input type="password" class="input-error" />
  <p class="form-error">Password is required</p>
</div>

```### Layout Patterns```typescript
const config = {
  shortcuts: {
    // Containers
    'container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'container-sm': 'max-w-4xl mx-auto px-4',
    'container-xs': 'max-w-2xl mx-auto px-4',

    // Flexbox patterns
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // Grid patterns
    'grid-auto': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    'grid-auto-fit': 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4',
  },
}
```### Typography```typescript

const config = {
  shortcuts: {
    // Headings
    'h1': 'text-4xl font-bold text-gray-900 mb-4',
    'h2': 'text-3xl font-bold text-gray-900 mb-3',
    'h3': 'text-2xl font-semibold text-gray-900 mb-2',

    // Text styles
    'text-muted': 'text-gray-600',
    'text-emphasis': 'text-gray-900 font-semibold',
    'text-link': 'text-blue-500 hover:text-blue-600 underline',

    // Prose
    'prose': 'text-gray-700 leading-relaxed',
    'prose-headings': 'prose font-bold text-gray-900 mt-8 mb-4',
  },
}

```## Dynamic Shortcuts

While shortcuts are static, you can use them with dynamic classes:```tsx
// React
function Button({ variant = 'primary', size = 'md', ...props }) {
  return <button className={`btn-${variant}-${size}`} {...props} />
}

// Usage
<Button variant="primary" size="lg">Click Me</Button>
// Renders: <button class="btn-primary-lg">Click Me</button>
```

## Best Practices

### 1. Use Descriptive Names

✅**Good:**```typescript
shortcuts: {
  'btn-primary': '...',
  'card-hover': '...',
  'input-error': '...',
}

```

❌**Avoid:**```typescript
shortcuts: {
  'bp': '...',  // What does 'bp' mean?
  'ch': '...',  // Too cryptic
  'ie': '...',  // Unclear
}
```### 2. Follow a Naming Convention```typescript

// Component-based naming
'btn-*': 'button styles',
'card-*': 'card styles',
'input-*': 'input styles',

// BEM-inspired naming
'block-element-modifier': 'styles',

```

### 3. Keep Shortcuts Focused

✅**Good:**```typescript
shortcuts: {
  'btn': 'px-4 py-2 rounded font-semibold transition',
  'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
}
```

❌**Avoid:**```typescript
shortcuts: {
  // Too many utilities in one shortcut
  'btn': 'px-4 py-2 rounded font-semibold transition bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
}

```### 4. Compose Larger Patterns```typescript
shortcuts: {
  // Small, reusable pieces
  'btn': 'px-4 py-2 rounded transition',
  'text-button': 'font-semibold',
  'primary-colors': 'bg-blue-500 text-white hover:bg-blue-600',

  // Composed patterns
  'btn-primary': 'btn text-button primary-colors',
}
```### 5. Document Your Shortcuts```typescript

const config = {
  shortcuts: {
    // Buttons
    // Base button styles - use as foundation
    'btn': 'px-4 py-2 rounded font-semibold transition-colors',

    // Primary action button - use for main CTAs
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',

    // Secondary action button - use for secondary actions
    'btn-secondary': 'btn bg-gray-500 text-white hover:bg-gray-600',
  },
}

```## Performance

Shortcuts have zero runtime overhead:

-**Build time:**Shortcuts are resolved during CSS generation
-**Output CSS:**Same as writing utilities directly
-**No JavaScript:**Pure CSS solution

### Example

Input:```typescript
shortcuts: {
  'btn': 'px-4 py-2 rounded bg-blue-500',
}
```HTML:```html

<button class="btn">Click</button>

```Generated CSS:```css
.btn {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0.25rem;
  background-color: #3b82f6;
}
```This is identical to using utilities directly.

## Combining with Other Features

### With Compile Class```typescript

const config = {
  shortcuts: {
    'btn-primary': 'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600',
  },
  compileClass: {
    enabled: true,
  },
}

```

```html

<!-- Use shortcut with compile class -->
<button class=":tc: btn-primary">
  Click Me
</button>

<!-- After compilation -->
<button class="tc-abc123">
  Click Me
</button>

```### With Responsive Variants

Shortcuts work with all variants:```html
<div class="btn-primary md:btn-primary-lg">
  Responsive button
</div>

<div class="card hover:card-hover dark:bg-gray-800">
  Responsive card
</div>
```### With Custom Rules```typescript

const config = {
  shortcuts: {
    'gradient-primary': 'bg-gradient-to-r from-blue-500 to-purple-500',
  },
  rules: [
    [/^from-(\w+)-(\d+)$/, ([, color, shade]) => ({ '--tw-gradient-from': `var(--color-${color}-${shade})`})],
  ],
}```## Organizing Shortcuts

### Separate Files```typescript

// shortcuts/buttons.ts
// css.config.ts
import { buttonShortcuts } from './shortcuts/buttons'
import { cardShortcuts } from './shortcuts/cards'

export const buttonShortcuts = {
  'btn': 'px-4 py-2 rounded font-semibold transition',
  'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
  // ...
}

// shortcuts/cards.ts
export const cardShortcuts = {
  card: 'rounded-lg shadow-md p-6 bg-white',
  // ...
}

const config = {
  shortcuts: {
    ...buttonShortcuts,
    ...cardShortcuts,
  },
}

```### Presets

Share shortcuts across projects using presets:```typescript
// presets/design-system.ts
// css.config.ts
import { designSystemPreset } from './presets/design-system'

export const designSystemPreset = {
  shortcuts: {
    btn: 'px-4 py-2 rounded transition',
    card: 'rounded-lg shadow-md p-6',
    // ... more shortcuts
  },
  theme: {
    colors: {
      primary: '#3b82f6',
      // ... more theme
    },
  },
}

const config = {
  presets: [designSystemPreset],
}
```## Troubleshooting

### Shortcut Not Working**Check:**1. Shortcut is defined in config:```typescript

   shortcuts: {
     'btn': 'px-4 py-2 rounded', // ✅
   }
   ```2. Name matches exactly:```html
   <button class="btn">✅ Works</button>
   <button class="BTN">❌ Wrong case</button>
   ```3. Config is loaded:```bash
   cssx build --verbose
   ```

### Circular References**Problem:**```typescript

shortcuts: {
  'a': 'b',
  'b': 'a', // ❌ Circular reference
}

```**Solution:**Avoid shortcuts that reference each other in a loop.

### Naming Conflicts**Problem:**```typescript

shortcuts: {
  'flex': 'display-flex', // ❌ Conflicts with built-in 'flex' utility
}
```**Solution:**Use unique names:

```typescript
shortcuts: {
  'flex-custom': 'display-flex', // ✅ Unique name
}
```

## Related

- [Configuration](../config.md) - Full configuration options
- [Compile Class](./compile-class.md) - Optimize shortcuts
- [Custom Rules](../advanced/custom-rules.md) - Advanced customization
- [Presets](../advanced/presets.md) - Share configurations
