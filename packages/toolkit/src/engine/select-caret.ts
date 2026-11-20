/**
 * The caret a single-line `<select>` draws, in the text's own colour.
 *
 * It used to be an SVG in a data URI with the stroke written in as `#6b7280`.
 * A data URI is a separate document: it cannot read `currentColor` or a custom
 * property, so on any palette that was not grey-on-white the arrow was the one
 * part of the control that did not match, and an app with light and dark themes
 * had to restate the whole background per theme (stacksjs/ts-css#45).
 *
 * Two gradients can read `currentColor` where the URI cannot. Each paints half
 * of a square tile, and the two tiles side by side make the caret, so it takes
 * the select's `color` under any theme mechanism with nothing to override.
 *
 * A mask does not work here, though it looks like the obvious tool: a mask on
 * a `<select>` clips the WHOLE control, and a `<select>` does not reliably
 * render `::after` to carry one instead.
 *
 * Sized in em, so the caret and the room kept for it scale with the select's
 * own font: a compact 13px picker gets a smaller arrow, closer in, than a 16px
 * field, rather than one fixed size that crowds the small one.
 */
export const SELECT_CARET: Readonly<Record<string, string>> = {
  'background-image': 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
  // Each tile is 0.3125em square; the right one ends 1em in from the edge.
  'background-position': 'calc(100% - 1.3125em) 50%, calc(100% - 1em) 50%',
  'background-size': '0.3125em 0.3125em',
  'background-repeat': 'no-repeat',
  // The 1em inset, the 0.625em caret and a gap, so a long label stops short of it.
  'padding-right': '2.25em',
  'print-color-adjust': 'exact',
}

/** The same declarations as a CSS block body, for the forms preflight. */
export function selectCaretCSS(indent = '  '): string {
  return Object.entries(SELECT_CARET).map(([property, value]) => `${indent}${property}: ${value};`).join('\n')
}
