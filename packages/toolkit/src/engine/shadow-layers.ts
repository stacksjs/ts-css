/**
 * The shared `box-shadow` layer stack.
 *
 * Every shadow-ish utility — `shadow-*`, `ring-*`, `inset-shadow-*`,
 * `inset-ring-*` — writes one custom property and then re-declares the whole
 * stack, because any one of them may be the only such utility on the element.
 * That only composes if all of them agree on the layer list, which is why it
 * lives here instead of being spelled out at each site. It used to be
 * repeated verbatim in fourteen places across four files.
 *
 * The order is Tailwind's and it is visual, not arbitrary: inner shadows
 * paint on top of the outer ones, so the inset layers come first.
 *
 * Every layer carries a transparent fallback. No preflight defines these
 * variables, and a `var()` with no fallback that resolves to nothing
 * invalidates the ENTIRE box-shadow at computed-value time — so a lone
 * `shadow-md` would lose its shadow completely rather than just skipping the
 * ring layers.
 */

/** A shadow that paints nothing. Tailwind's `0 0 #0000`. */
export const SHADOW_NONE = '0 0 #0000'

const LAYERS = [
  'inset-shadow',
  'inset-ring-shadow',
  'ring-offset-shadow',
  'ring-shadow',
  'shadow',
]

export const BOX_SHADOW_LAYERS: string = LAYERS
  .map(layer => `var(--tc-${layer}, ${SHADOW_NONE})`)
  .join(', ')
