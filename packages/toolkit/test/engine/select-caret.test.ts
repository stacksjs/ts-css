/**
 * The select caret follows the text colour (stacksjs/ts-css#45).
 *
 * `form-select` drew its chevron as an SVG in a data URI with the stroke
 * written in as `#6b7280`. A data URI cannot read `currentColor` or a custom
 * property, so the arrow was the one part of the control that could not follow
 * a dark theme, and apps restated the whole background once per theme.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { tailwindFormsPreflight } from '../../src/engine/preflight-forms'
import { SELECT_CARET } from '../../src/engine/select-caret'

function generated(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false)
}

/** Any colour written into the value: hex, a named colour function, a data-URI stroke. */
const LITERAL_COLOR = /#[0-9a-f]{3,8}\b|%23[0-9a-f]{3,8}|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i

describe('select caret', () => {
  it('should draw the caret in currentColor', () => {
    const css = generated('form-select')
    expect(css).toContain('linear-gradient(45deg, transparent 50%, currentColor 50%)')
    expect(css).toContain('linear-gradient(135deg, currentColor 50%, transparent 50%)')
  })

  /** The check the issue asked for: nothing in the caret can be a fixed colour. */
  it('should leave no literal colour in the caret', () => {
    const image = generated('form-select').match(/background-image:\s*([^;]+);/)?.[1] ?? ''
    expect(image).not.toBe('')
    expect(image).not.toMatch(LITERAL_COLOR)
    expect(image).not.toContain('data:image')
  })

  /** In em, so a compact picker gets a smaller arrow, closer in, not a crowded one. */
  it('should size and place the caret relative to the select\'s font', () => {
    const css = generated('form-select')
    expect(css).toContain('background-size: 0.3125em 0.3125em')
    expect(css).toContain('background-position: calc(100% - 1.3125em) 50%, calc(100% - 1em) 50%')
    expect(css).toContain('background-repeat: no-repeat')
  })

  it('should keep room for the caret so a long label stops short of it', () => {
    expect(generated('form-select')).toContain('padding-right: 2.25em')
  })

  it('should keep the select printable with its background', () => {
    expect(generated('form-select')).toContain('print-color-adjust: exact')
  })

  /** One definition, so the utility and the preflight cannot drift apart. */
  it('should give the forms preflight the same caret', () => {
    const preflight = tailwindFormsPreflight.getCSS()
    const block = preflight.match(/select \{\n {2}background-image[\s\S]*?\n\}/)?.[0] ?? ''
    expect(block).not.toBe('')
    for (const [property, value] of Object.entries(SELECT_CARET))
      expect(block).toContain(`${property}: ${value};`)
    expect(preflight).not.toMatch(/stroke='%23/)
  })

  /** A multi-line select lists its options and has no arrow to draw. */
  it('should still clear the caret from a multiselect', () => {
    expect(generated('form-multiselect')).toContain('background-image: initial')
  })
})
