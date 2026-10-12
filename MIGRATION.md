# Migration notes

## Unreleased — Tailwind v4 alignment

This batch of work brought the engine's utility surface in line with Tailwind
v4 (checked against `tailwindcss@4.3.3` throughout). Most of it is additive,
but **six changes alter what existing classes compile to**.

None of them is an error. Nothing throws, no build fails, and no test in a
consuming app will go red. They are all *visual* changes, so an app will not
tell you it has shifted — it will just look different. The container-query
change is the one worth actively looking for, because the old behaviour was
wrong in a way a design may have been calibrated around.

Every "to keep the old behaviour" snippet below was run through the engine
before being written down.

---

## Breaking changes

### 1. Container query breakpoints now use their own scale

**The one most likely to move your layout.**

Container query variants were reading `theme.screens` — the *viewport*
breakpoints — so `@sm:` fired at 640px. A container is an element, and
Tailwind's container scale is much smaller.

| Variant | Before | After |
| --- | --- | --- |
| `@sm:` | 640px | 24rem (384px) |
| `@md:` | 768px | 28rem (448px) |
| `@lg:` | 1024px | 32rem (512px) |
| `@xl:` | 1280px | 36rem (576px) |
| `@2xl:` | 1536px | 42rem (672px) |

This is not a restyle — it is a breakpoint firing at a different width, so
elements may now switch layout at a different container size than before.

The scale also gained the sizes below `xs` that the viewport scale had no
room for (`@3xs` 16rem through `@7xl` 80rem), and the variant grammar is
complete: `@max-md:`, `@min-[400px]:`, `@max-[600px]:`, and named containers
`@sm/sidebar:`.

**To keep the old behaviour**, either override the scale in `css.config.ts`:

```ts
export default {
  theme: {
    containers: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
}
```

…or swap the affected classes to explicit widths — `@sm:flex` →
`@min-[640px]:flex`. Both produce `@container (width >= 640px)`.

> Note the at-rule itself now uses range syntax, `(width >= 24rem)` rather
> than `(min-width: 24rem)`, matching Tailwind. Anything that understands
> `@container` understands range syntax, and it lets `@max-*` express a
> genuinely exclusive bound.

### 2. `blur-sm` doubled; `blur-xs` added

v4 renamed the bottom of the blur scale. What v3 called `blur-sm` is now
`blur-xs`, and `blur-sm` moved up a step.

| Class | Before | After |
| --- | --- | --- |
| `blur-xs` | *did not exist* | 4px |
| `blur-sm` | 4px | **8px** |

`md` (12px) through `3xl` (64px) are unchanged. `backdrop-blur-*` is
corrected identically, since Tailwind drives both from one theme scale.

**To keep the old behaviour**, swap `blur-sm` → `blur-xs` and
`backdrop-blur-sm` → `backdrop-blur-xs`. There is no config override for
this one: the blur scale is a static map, not a themeable value.

### 3. `ring` default width 3px → 1px

The bare `ring` carried the v3 width.

**To keep the old behaviour**, use `ring-3`. Any bare number works as a
width, so `ring-3` produces exactly what `ring` used to.

### 4. `ring` default colour → `currentcolor`

A `ring` with no colour utility beside it was a fixed blue
(`rgba(59, 130, 246, 0.5)`). It now inherits the element's text colour,
which is what you want from a utility whose job is to follow the element —
but it means a colourless ring on dark text is now near-black rather than
blue. **Check focus rings in particular.**

**To keep the old behaviour**, set the colour explicitly. Either is fine:

```html
<div class="ring ring-blue-500/50">        <!-- the theme blue -->
<div class="ring ring-[rgba(59,130,246,0.5)]">  <!-- the exact old value -->
```

Unaffected: `ring-offset-color` is still `#fff` (v4's value too), and the
forms preflight keeps its own explicit `#2563eb` focus ring, which was always
a deliberate focus colour rather than the utility default.

### 5. The `drop-shadow` scale adopted v4's values

v4 did not merely rename these. `md`, `lg` and `xl` were **redrawn as a
single shadow each** where v3 stacked two, and all the offsets and opacities
changed.

| Class | Before (v3) | After (v4) |
| --- | --- | --- |
| `drop-shadow-xs` | *did not exist* | `0 1px 1px /0.05` |
| `drop-shadow-sm` | `0 1px 1px /0.05` | `0 1px 2px /0.15` |
| `drop-shadow` | `0 1px 2px /0.1` + `0 1px 1px /0.06` | *unchanged* |
| `drop-shadow-md` | `0 4px 3px /0.07` + `0 2px 2px /0.06` | `0 3px 3px /0.12` |
| `drop-shadow-lg` | `0 10px 8px /0.04` + `0 4px 3px /0.1` | `0 4px 4px /0.15` |
| `drop-shadow-xl` | `0 20px 13px /0.03` + `0 8px 5px /0.08` | `0 9px 7px /0.1` |
| `drop-shadow-2xl` | `0 25px 50px /0.15`† | *unchanged* |

† `0 25px 25px rgb(0 0 0 / 0.15)`.

**To keep the old behaviour**: a v3 `drop-shadow-sm` maps cleanly to
`drop-shadow-xs`. The other three have no equivalent in the new scale, so
they need arbitrary values:

```html
<!-- old drop-shadow-xl -->
<div class="drop-shadow-[0_20px_13px_rgb(0_0_0_/_0.03)]">
```

(Stacking two `drop-shadow()` calls in one arbitrary value is not supported;
if you need the exact two-layer v3 look, set `filter` directly.)

### 6. `open:` matches more than before

`open:` resolved to a bare `[open]`, so it caught `<details>` and `<dialog>`
but missed popovers and open `<select>`s. It now matches all three, as v4
does:

```css
:is([open], :popover-open, :open)
```

This breaks in the direction of matching *more*, so an `open:` utility may now
apply where it previously did nothing. `not-open:` and `in-open:` derive from
the same definition and widen with it. `closed:` — an addition of this engine,
with no Tailwind equivalent — negates exactly what `open:` matches.

**To keep the old behaviour**, use an arbitrary variant: `[&[open]]:flex`.

---

## Fixes to classes that previously emitted nothing

These are not breaking — they are classes that silently produced no CSS and
now work. Worth scanning for, because markup using them was quietly having no
effect.

- **`shadow-2xl` and `shadow-inner`** — the top of the box-shadow scale was
  unavailable. If you worked around this with an arbitrary shadow, you can
  drop the workaround.
- **`in-range`, `out-of-range`, `placeholder-shown`, `only-of-type`** —
  accepted by the parser but dropped by the generator, so they validated and
  then vanished.
- **`mask-repeat-x` / `mask-repeat-y`**.
- **`overflow-ellipsis`** — Tailwind's legacy alias for `text-ellipsis`.

## Added

Non-breaking additions, for reference:

- **Variants** — `*:` / `**:` (child, descendant), `first-letter:`,
  `first-line:`, `backdrop:`, `details-content:`, `user-valid:`,
  `user-invalid:`, `inert:`, the `nth-*` family (`nth-3`, `nth-[3n+1]`,
  `nth-last-*`, `nth-of-type-*`), `in-*` (ancestor matching), `starting:`
  (`@starting-style`), `pointer-*` / `any-pointer-*`, `inverted-colors:`,
  `noscript:`.
- **`not-*` is now compositional** rather than a fixed list of eight, so it
  negates any variant — including at-rule ones, where it negates the
  *condition* (`not-md:` is `@media not (min-width: 768px)`).
- **Masks** — the complete v4 family: modes, composites, positions, repeats,
  clips, plus linear/edge/radial/conic gradient masks.
- **Shadows** — `inset-shadow-*`, `inset-ring-*`, and colour support on
  `drop-shadow-*` and `text-shadow-*`.
- **Safe alignment** — `justify-*-safe`, `items-*-safe`, `self-*-safe`,
  `content-*-safe`, `place-*-safe`, `justify-items-*-safe`.
- **Gradients** — colour-space interpolation (`bg-linear-to-r/oklch`,
  `bg-conic/decreasing`) and `bg-conic-<angle>`.
- `max-w-prose`, `transition-discrete`, `transition-normal`, `ease-initial`.

### One divergence from Tailwind, on purpose

Tailwind interpolates gradients in `oklab` **by default**, emitting the plain
prelude and then overriding it inside an `@supports (background-image:
linear-gradient(in lab, red, red))` block so older browsers still get a
gradient. A utility rule in this engine returns a flat property map and cannot
express a nested at-rule, so an unguarded `in oklab` default would break those
browsers outright.

Interpolation is therefore **opt-in**: without a `/modifier`, gradients stay
in sRGB exactly as before. Matching Tailwind's default needs nested at-rule
support in the rule API first.
