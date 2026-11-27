import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'
import { extractClasses } from '../../src/engine/parser'

/**
 * Variants that ask about something outside the element stack together.
 *
 * `dark:group-hover:bg-white/5` came out as `.group:hover .x`: the group
 * condition replaced the `.dark ` before it instead of joining it, so the rule
 * applied in light mode too, and in dark mode a later light-mode
 * `group-hover:bg-neutral-50` won. A dark table's sticky cell turned nearly
 * white on hover. Each of dark/light, group-*, in-* and peer-* set the same one
 * prefix; now the theme stays outermost, ancestor conditions add up, and a
 * peer condition sits next to the element.
 */
function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  for (const name of extractClasses(`<div class="${className}"></div>`))
    gen.generate(name)
  return gen.toCSS(false, true)
}

describe('stacked ancestor variants', () => {
  it('dark: and group-hover: both hold, whichever is written first', () => {
    expect(css('dark:group-hover:bg-white/5')).toContain('.dark .group:hover .dark\\:group-hover\\:bg-white\\/5')
    expect(css('group-hover:dark:bg-white/5')).toContain('.dark .group:hover .group-hover\\:dark\\:bg-white\\/5')
  })

  it('dark: keeps its condition beside a peer-* and an in-* variant', () => {
    expect(css('dark:peer-checked:bg-white/5')).toContain('.dark .peer:checked ~ .dark\\:peer-checked\\:bg-white\\/5')
    expect(css('dark:in-focus:underline')).toContain('.dark :where(:focus) .dark\\:in-focus\\:underline')
  })

  it('a group and a peer condition combine, the peer next to the element', () => {
    expect(css('group-hover:peer-checked:underline')).toContain('.group:hover .peer:checked ~ .group-hover\\:peer-checked\\:underline')
  })

  it('a single variant is unchanged', () => {
    expect(css('dark:bg-white/5')).toContain('.dark .dark\\:bg-white\\/5')
    expect(css('group-hover:bg-white/5')).toContain('.group:hover .group-hover\\:bg-white\\/5')
    expect(css('peer-checked:underline')).toContain('.peer:checked ~ .peer-checked\\:underline')
  })
})
