# ts-css

A CSS engine with two front ends and one atomic output: Tailwind-compatible **utility classes** for laying out markup, and StyleX-style **typed style objects** for styles that have to be computed, tokenised, or merged across a component boundary. Both compile into the same deduplicated atomic CSS, with nothing left at runtime.

## Installation

```bash
bun add @stacksjs/ts-css
```

## Quick Start

### Programmatic API

```typescript
import { CSSGenerator, defaultConfig } from '@stacksjs/ts-css/engine'

const gen = new CSSGenerator(defaultConfig)
gen.generate('flex')
gen.generate('items-center')
gen.generate('gap-4')
gen.generate('p-8')
gen.generate('bg-blue-500')
gen.generate('text-white')
gen.generate('rounded-lg')
gen.generate('hover:bg-blue-600')
gen.generate('dark:bg-gray-900')

const css = gen.toCSS(true) // true = include preflight
```

### Build API

```typescript
import { build } from '@stacksjs/ts-css/engine'

const result = await build({
  content: ['./src/**/*.html', './src/**/*.tsx'],
  output: './dist/styles.css',
  minify: true,
})
```

### Style API

```typescript
import { css } from '@stacksjs/ts-css/engine'

const theme = css.defineVars({
  accent: '#0b7',
  surface: { default: '#fff', '@media (prefers-color-scheme: dark)': '#111' },
})

const styles = css.create({
  card: {
    padding: 16,
    backgroundColor: theme.surface,
    ':hover': { transform: 'translateY(-2px)' },
    '@media (min-width: 768px)': { padding: 24 },
  },
  danger: { color: 'red' },
  sized: (width: number) => ({ width }),
})

// { className: 'tc9faijott tcze3ap6z …', style: { '--tc2hxvo7bz': '120px' } }
css.props(styles.card, isDangerous && styles.danger, styles.sized(120))
```

`css.props()` merges **per property**, not per class: a later argument replaces
an earlier one's `color` class outright rather than relying on the cascade to
outrank it. `null` removes a property, and falsy arguments are skipped.

Style factories turn their arguments into inline custom properties, so a
component rendered at a thousand widths still emits one rule.

| | |
| --- | --- |
| `css.create(styles)` | compile named style objects into atomic classes |
| `css.props(...styles)` | merge compiled styles into `className` / `style` |
| `css.defineVars(vars)` | declare custom properties, get typed `var()` references |
| `css.createTheme(vars, overrides)` | redeclare a variable group under a generated class |
| `css.keyframes(frames)` | declare an animation, get its generated name |
| `css.firstThatWorks(...values)` | progressive-enhancement fallbacks, in CSS order |
| `css.defineConsts(consts)` | build-time constants that never become CSS |

Point `styles` at the modules that declare them and `cssx build` emits their
CSS alongside the utilities. Outside the CLI, `collectStyles(patterns)` returns
the stylesheet directly and `stylePlugin()` collects styles during a
`Bun.build()`.

### CLI

```bash
cssx build
cssx build --watch
cssx build --minify
```

## Configuration

Create a `css.config.ts` in your project root:

```typescript
import type { CssConfig } from '@stacksjs/ts-css/engine'

export default {
  content: ['./src/**/*.{html,tsx,stx}'],
  styles: ['./src/**/*.styles.ts'],
  output: './dist/styles.css',
  minify: false,

  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a5a',
        },
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
      },
    },
  },

  safelist: ['bg-brand-500', 'text-white'],
  blocklist: ['opacity-0'],
} satisfies Partial<CssConfig>
```

### Theme

The default theme includes Tailwind-compatible values for:

- **colors** - Full color palette (slate, gray, zinc, red, orange, yellow, green, blue, indigo, purple, pink, etc.) with 50-950 shades in oklch
- **spacing** - 0 through 96, plus `px` (1px), fractional values
- **fontSize** - xs through 9xl with line-height pairs
- **fontFamily** - sans, serif, mono
- **screens** - sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **borderRadius** - none, sm, DEFAULT, md, lg, xl, 2xl, 3xl, full
- **boxShadow** - sm, DEFAULT, md, lg, xl, 2xl, inner, none

All theme values can be extended or overridden via `theme.extend`.

## Utilities

### Layout

| Utility | CSS |
|---------|-----|
| `block`, `inline-block`, `flex`, `grid`, `hidden` | `display: *` |
| `static`, `fixed`, `absolute`, `relative`, `sticky` | `position: *` |
| `top-*`, `right-*`, `bottom-*`, `left-*`, `inset-*` | Positioning |
| `z-*` | `z-index` |
| `overflow-*`, `overflow-x-*`, `overflow-y-*` | Overflow |
| `float-*`, `clear-*` | Float & clear (includes logical `start`/`end`) |
| `isolate`, `isolation-auto` | Isolation |
| `object-cover`, `object-contain`, `object-fill`, `object-none` | Object fit |
| `object-top`, `object-center`, `object-bottom`, etc. | Object position |
| `columns-*` | Multi-column layout |
| `break-before-*`, `break-after-*`, `break-inside-*` | Break behavior |
| `box-border`, `box-content` | Box sizing |
| `aspect-auto`, `aspect-square`, `aspect-video` | Aspect ratio |
| `visible`, `invisible`, `collapse` | Visibility |

### Flexbox

| Utility | CSS |
|---------|-----|
| `flex-row`, `flex-col`, `flex-row-reverse`, `flex-col-reverse` | Direction |
| `flex-wrap`, `flex-nowrap`, `flex-wrap-reverse` | Wrap |
| `flex-1`, `flex-auto`, `flex-initial`, `flex-none` | Flex shorthand |
| `grow`, `grow-0`, `shrink`, `shrink-0` | Grow & shrink |
| `basis-*` | Flex basis (supports fractions: `basis-1/2`) |
| `justify-*`, `items-*`, `self-*` | Alignment |
| `justify-items-*`, `justify-self-*` | Justify items/self |
| `content-*` | Align content |
| `order-*`, `order-first`, `order-last`, `order-none` | Order |

### Grid

| Utility | CSS |
|---------|-----|
| `grid-cols-*`, `grid-rows-*` | Template columns/rows (1-12, none, subgrid) |
| `col-span-*`, `col-start-*`, `col-end-*` | Column placement |
| `row-span-*`, `row-start-*`, `row-end-*` | Row placement |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense` | Auto flow |
| `auto-cols-*`, `auto-rows-*` | Auto columns/rows |
| `gap-*`, `gap-x-*`, `gap-y-*` | Gap |
| `place-content-*`, `place-items-*`, `place-self-*` | Place shortcuts |

Arbitrary grid templates use underscore-to-space conversion:

```html
<div class="grid grid-cols-[120px_1fr_200px]">
<!-- grid-template-columns: 120px 1fr 200px -->
```

### Spacing

| Utility | CSS |
|---------|-----|
| `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*` | Padding |
| `ps-*`, `pe-*` | Padding inline start/end (logical) |
| `m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*` | Margin |
| `ms-*`, `me-*` | Margin inline start/end (logical) |
| `space-x-*`, `space-y-*` | Space between children |

Negative values supported: `-m-4`, `-translate-x-1`.

### Sizing

| Utility | CSS |
|---------|-----|
| `w-*`, `h-*` | Width & height |
| `size-*` | Width + height shorthand |
| `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*` | Min/max sizing |

Values: spacing scale, `auto`, `full` (100%), `screen` (100vw/vh), `min`, `max`, `fit`, fractions (`w-1/2`).

### Colors

All color utilities support opacity modifiers:

```html
<!-- Integer opacity (0-100 scale) -->
<div class="bg-blue-500/50">       <!-- 50% opacity -->
<div class="text-white/75">        <!-- 75% opacity -->
<div class="border-black/10">      <!-- 10% opacity -->

<!-- Arbitrary opacity (0-1 scale) -->
<div class="bg-white/[0.04]">      <!-- 4% opacity -->
<div class="text-black/[0.87]">    <!-- 87% opacity -->
```

| Utility | CSS |
|---------|-----|
| `bg-*` | Background color |
| `text-*` | Text color |
| `border-*` | Border color |
| `ring-*` | Ring color |
| `divide-*` | Divide color (supports opacity: `divide-white/10`) |
| `placeholder-*` | Placeholder color |
| `accent-*` | Accent color |
| `caret-*` | Caret color |
| `fill-*`, `stroke-*` | SVG fill & stroke |

Special values: `current` (currentColor), `transparent`, `inherit`, `white`, `black`.

### Typography

| Utility | CSS |
|---------|-----|
| `text-xs` through `text-9xl` | Font size |
| `font-thin` through `font-black` | Font weight |
| `font-sans`, `font-serif`, `font-mono` | Font family |
| `italic`, `not-italic` | Font style |
| `tracking-*` | Letter spacing |
| `leading-*` | Line height |
| `text-left`, `text-center`, `text-right`, `text-justify` | Alignment |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | Text transform |
| `underline`, `overline`, `line-through`, `no-underline` | Decoration |
| `decoration-*` | Decoration style, color, thickness |
| `truncate`, `text-ellipsis`, `text-clip` | Text overflow |
| `text-wrap`, `text-nowrap`, `text-balance`, `text-pretty` | Text wrap |
| `line-clamp-*` | Line clamp |
| `indent-*` | Text indent |
| `antialiased`, `subpixel-antialiased` | Font smoothing |
| `tabular-nums`, `lining-nums`, `oldstyle-nums`, etc. | Font variant numeric |
| `hyphens-none`, `hyphens-manual`, `hyphens-auto` | Hyphens |
| `whitespace-*` | White space |
| `break-normal`, `break-words`, `break-all` | Word break |

### Borders

| Utility | CSS |
|---------|-----|
| `border`, `border-0`, `border-2`, `border-4`, `border-8` | Border width |
| `border-t`, `border-r`, `border-b`, `border-l` | Side borders |
| `border-s`, `border-e` | Logical side borders (inline-start/end) |
| `border-x`, `border-y` | Axis borders |
| `border-solid`, `border-dashed`, `border-dotted`, `border-double`, `border-none` | Style |
| `rounded-*` | Border radius |
| `rounded-s-*`, `rounded-e-*` | Logical border radius |
| `rounded-ss-*`, `rounded-se-*`, `rounded-es-*`, `rounded-ee-*` | Corner-specific logical radius |
| `outline-*` | Outline width, style, color |
| `outline-offset-*` | Outline offset |
| `ring-*`, `ring-offset-*` | Ring |
| `divide-x`, `divide-y` | Divide width |
| `divide-*` | Divide color, style, opacity |

### Effects & Filters

| Utility | CSS |
|---------|-----|
| `shadow-*` | Box shadow |
| `shadow-{color}` | Shadow color |
| `opacity-*` | Opacity (0-100) |
| `mix-blend-*` | Mix blend mode |
| `bg-blend-*` | Background blend mode |
| `blur-*`, `brightness-*`, `contrast-*`, `grayscale-*` | Filters |
| `invert-*`, `saturate-*`, `sepia-*`, `hue-rotate-*` | Filters |
| `drop-shadow-*` | Drop shadow filter |
| `backdrop-blur-*`, `backdrop-brightness-*`, etc. | Backdrop filters |

### Backgrounds & Gradients

| Utility | CSS |
|---------|-----|
| `bg-fixed`, `bg-local`, `bg-scroll` | Background attachment |
| `bg-clip-border`, `bg-clip-padding`, `bg-clip-content`, `bg-clip-text` | Background clip |
| `bg-top`, `bg-center`, `bg-bottom`, etc. | Background position |
| `bg-repeat`, `bg-no-repeat`, `bg-repeat-x`, `bg-repeat-y` | Background repeat |
| `bg-auto`, `bg-cover`, `bg-contain` | Background size |

**Linear gradients:**

```html
<div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
```

Directions: `bg-gradient-to-{t,tr,r,br,b,bl,l,tl}`.

**Radial gradients:**

```html
<div class="bg-radial from-white to-blue-500">
<div class="bg-radial-at-t from-yellow-200 to-orange-500">
```

Positions: `bg-radial-at-{t,tr,r,br,b,bl,l,tl,c}`.

**Conic gradients:**

```html
<div class="bg-conic from-red-500 via-yellow-500 to-green-500">
<div class="bg-conic-from-r from-blue-500 to-purple-500">
```

Starting angles: `bg-conic-from-{t,tr,r,br,b,bl,l,tl}`.

### Transforms & Transitions

| Utility | CSS |
|---------|-----|
| `scale-*`, `scale-x-*`, `scale-y-*` | Scale |
| `rotate-*` | Rotate |
| `translate-x-*`, `translate-y-*` | Translate |
| `skew-x-*`, `skew-y-*` | Skew |
| `origin-*` | Transform origin |
| `transition`, `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | Transition property |
| `duration-*` | Transition duration |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out` | Timing function |
| `delay-*` | Transition delay |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none` | Animation |
| `perspective-*` | 3D perspective |
| `backface-visible`, `backface-hidden` | Backface visibility |

### Interactivity

| Utility | CSS |
|---------|-----|
| `cursor-*` | Cursor style |
| `pointer-events-none`, `pointer-events-auto` | Pointer events |
| `resize`, `resize-x`, `resize-y`, `resize-none` | Resize |
| `select-none`, `select-text`, `select-all`, `select-auto` | User select |
| `scroll-auto`, `scroll-smooth` | Scroll behavior |
| `scroll-m-*`, `scroll-p-*` | Scroll margin/padding |
| `snap-x`, `snap-y`, `snap-both`, `snap-mandatory`, `snap-proximity` | Scroll snap |
| `snap-start`, `snap-end`, `snap-center`, `snap-align-none` | Snap align |
| `touch-auto`, `touch-none`, `touch-manipulation`, `touch-pan-*` | Touch action |
| `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform` | Will change |
| `appearance-none`, `appearance-auto` | Appearance |
| `scrollbar-auto`, `scrollbar-thin`, `scrollbar-none` | Scrollbar width |

### Content

```html
<div class="before:content-['*'] before:text-red-500">Required</div>
<div class="before:content-empty before:block before:h-4"></div>
<div class="after:content-[attr(data-count)]"></div>
```

| Utility | CSS |
|---------|-----|
| `content-none` | `content: none` |
| `content-empty` | `content: ""` |
| `content-['text']` | `content: 'text'` |
| `content-[attr(data-*)]` | `content: attr(data-*)` |

### SVG

| Utility | CSS |
|---------|-----|
| `fill-none`, `fill-current`, `fill-{color}` | Fill |
| `stroke-none`, `stroke-current`, `stroke-{color}` | Stroke color |
| `stroke-0`, `stroke-1`, `stroke-2` | Stroke width |

### Tables

| Utility | CSS |
|---------|-----|
| `border-collapse`, `border-separate` | Border collapse |
| `border-spacing-*` | Border spacing |
| `table-auto`, `table-fixed` | Table layout |
| `caption-top`, `caption-bottom` | Caption side |

## Variants

### Pseudo-class Variants

```html
<div class="hover:bg-blue-600 focus:ring-2 active:scale-95">
<div class="first:mt-0 last:mb-0 odd:bg-gray-50 even:bg-white">
<div class="disabled:opacity-50 checked:bg-blue-500 required:border-red-500">
<div class="focus-within:ring-2 focus-visible:outline-2">
<div class="visited:text-purple-600 target:ring-2">
<div class="open:rotate-180 empty:hidden">
<div class="valid:border-green-500 invalid:border-red-500 read-only:opacity-75">
<div class="autofill:bg-yellow-50 indeterminate:bg-gray-300">
```

### Negation Variants

```html
<div class="not-first:mt-4 not-last:mb-4">
<div class="not-disabled:cursor-pointer not-empty:block">
<div class="not-checked:bg-gray-100 not-only:border-b">
<div class="not-first-of-type:pt-4 not-last-of-type:pb-4">
```

### Pseudo-element Variants

```html
<div class="before:content-[''] before:block before:h-4">
<div class="after:content-['*'] after:text-red-500">
<li class="marker:text-blue-500">Item</li>
<input class="placeholder:text-gray-400">
<p class="selection:bg-blue-200">Selectable text</p>
<input class="file:bg-blue-50 file:border-0" type="file">
```

### Responsive Variants

```html
<div class="p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20">
```

| Variant | Breakpoint |
|---------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

### Dark & Light Mode

```html
<div class="bg-white dark:bg-gray-900 light:bg-gray-50">
<div class="text-gray-900 dark:text-white">
```

Uses class-based strategy (`.dark`/`.light` parent class).

### Group & Peer Variants

```html
<!-- Group: parent state affects children -->
<div class="group">
  <p class="group-hover:text-blue-500">Hovering parent</p>
  <p class="group-focus:ring-2">Parent focused</p>
  <p class="group-has-[:checked]:bg-blue-50">Parent has checked input</p>
</div>

<!-- Named groups (for nesting) -->
<div class="group/card">
  <div class="group/button">
    <span class="group-hover/card:text-blue-500">Card hovered</span>
  </div>
</div>

<!-- Peer: sibling state affects element -->
<input class="peer" />
<p class="peer-invalid:text-red-500">Error message</p>
<p class="peer-has-[:checked]:text-green-500">Checked sibling</p>
```

### has: Variant

```html
<div class="has-[:focus]:ring-2">         <!-- :has(:focus) -->
<div class="has-[input:checked]:bg-blue-50"> <!-- :has(input:checked) -->
<div class="has-[>img]:p-4">             <!-- :has(>img) -->
```

### aria-* Variants

```html
<div class="aria-disabled:opacity-50">          <!-- [aria-disabled="true"] -->
<div class="aria-expanded:rotate-180">          <!-- [aria-expanded="true"] -->
<div class="aria-[sort=ascending]:text-blue-500"> <!-- [aria-sort=ascending] -->
```

### data-* Variants

```html
<div class="data-loading:opacity-50">           <!-- [data-loading] -->
<div class="data-[state=active]:bg-white">       <!-- [data-state=active] -->
<div class="data-[theme=dark]:bg-black">         <!-- [data-theme=dark] -->
```

### Media Query Variants

```html
<div class="landscape:flex-row portrait:flex-col">
<div class="motion-safe:animate-bounce motion-reduce:animate-none">
<div class="contrast-more:border-2 contrast-less:border-0">
<div class="forced-colors:border print:hidden">
```

Media variants stack with responsive variants:

```html
<div class="lg:landscape:flex-row">
<!-- @media (min-width: 1024px) and (orientation: landscape) -->
```

### @supports Variant

```html
<div class="supports-[display:grid]:grid">
<div class="supports-[backdrop-filter:blur(0)]:backdrop-blur-sm">
```

### Container Queries

```html
<div class="@container">
  <div class="@sm:flex @md:grid @lg:grid-cols-3">
</div>
```

### Direction Variants

```html
<div class="rtl:text-right ltr:text-left">
```

## Arbitrary Values

Use brackets for any CSS value:

```html
<div class="w-[350px] h-[calc(100vh-4rem)] p-[clamp(1rem,3vw,2rem)]">
<div class="text-[#1a1a1a] bg-[rgb(255,0,0)] border-[oklch(50%_0.2_240)]">
<div class="grid-cols-[120px_1fr_200px]">  <!-- underscores become spaces -->
<div class="text-[clamp(1rem,3vw,2rem)]">
<div class="font-[600]">
<div class="tracking-[0.2em]">
<div class="leading-[1.7]">
```

### Arbitrary Properties

```html
<div class="[mask-type:luminance]">
<div class="[text-wrap:balance]">
```

### Type Hints

```html
<div class="text-[color:var(--brand)]">
<div class="text-[length:var(--size)]">
```

## Important Modifier

Prefix with `!` to apply `!important`:

```html
<div class="!p-4 !text-red-500">
```

## Presets

```typescript
import type { Preset } from '@stacksjs/ts-css/engine'

const myPreset: Preset = {
  name: 'my-preset',
  theme: {
    extend: {
      colors: {
        brand: '#3b82f6',
      },
    },
  },
  shortcuts: {
    btn: 'px-4 py-2 rounded font-semibold',
  },
}

export default {
  presets: [myPreset],
}
```

## Shortcuts

Define reusable class combinations:

```typescript
export default {
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-semibold transition-colors',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'card': 'rounded-xl border border-gray-200 p-6 shadow-sm',
  },
}
```

## Performance

Optimisations that carry the most weight:

- **O(1) static utility map** for ~80% of common utilities (display, flex, grid, transitions, etc.)
- **Pre-computed color map** with a flat cache for instant colour lookups
- **Class-level caching** prevents duplicate generation
- **Selector and media-query caching** avoids rebuilding either across rebuilds
- **Negative match cache** to skip known-unmatched utilities
- **Memoised `toCSS()`** — serialising is O(rules) and watch mode calls it every
  pass, usually with nothing new to say; a revision counter turns an unchanged
  rebuild into three integer comparisons
- **Theme-derived tables memoised per sub-object** — a build reusing the default
  theme skips the palette scan entirely, which was two thirds of a cold build
- **Allocation-lean serialiser** — sorts an index array and groups in one pass,
  rather than a wrapper object per rule plus two intermediate arrays
- **Content-hashed atomic rules** so two components declaring `padding: 16`
  share one class

Cold build, Apple M3 Pro, Bun 1.3.14 — every engine constructed from scratch
per iteration, all given a utilities-only input so they are asked for the same
thing:

| Scenario | ts-css | UnoCSS | Tailwind v4 | Tailwind v3 |
| --- | ---: | ---: | ---: | ---: |
| Simple utilities (10) | **11.52 µs** | 901.82 µs | 987.70 µs | 11.77 ms |
| Real-world components (~60) | **64.95 µs** | 1.77 ms | 1.21 ms | 11.95 ms |
| Full project (~800) | **208.23 µs** | 4.55 ms | 1.66 ms | 13.11 ms |
| 1000 arbitrary values | **992.54 µs** | 97.71 ms | 3.33 ms | 26.55 ms |

Warm rebuild — engines held open the way watch mode holds them, every one
answering from its own cache:

| Scenario | ts-css | Tailwind v4 | UnoCSS |
| --- | ---: | ---: | ---: |
| Simple utilities (10) | **34.47 ns** | 100.65 ns | 34.66 µs |
| Full project (~800) | **796.45 ns** | 1.89 µs | 358.63 µs |

Style objects vs StyleX, with a correctness gate asserting both emit the same
number of atomic rules:

| Workload | ts-css | StyleX |
| --- | ---: | ---: |
| component (8 declarations) | **28.81 µs** | 507.29 µs |
| design system (200) | **531.81 µs** | 11.05 ms |

Full methodology, including the two flaws an earlier revision of the benchmark
had, is in the [repository README](https://github.com/stacksjs/ts-css#performance).

## License

MIT
