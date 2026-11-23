/**
 * Two config behaviours a downstream project documented as broken
 * (stacksjs/ts-css#50, stacksjs/ts-css#51) that the engine handles correctly.
 * Pinned here so they stay that way.
 *
 * #51 was real, but it lived in stx's dev-server bridge (stacksjs/stx#1867),
 * which read only `theme.extend` and dropped a top-level `theme.colors`. The
 * engine itself has always honoured both.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function preflightCSS(css: string, minify: boolean): string {
  const gen = new CSSGenerator({
    ...defaultConfig,
    preflights: [{ getCSS: () => css }],
  })
  return gen.toCSS(true, minify)
}

describe('A comment inside a preflight rule (#50)', () => {
  const placements: Record<string, string> = {
    'before the first declaration': '.a {\n  /* note */\n  color: red;\n  background: blue;\n}',
    'between declarations': '.a { color: red; /* note */ background: blue; }',
    'holding a semicolon': '.a { /* a; b */ color: red; background: blue; }',
    'holding a brace': '.a { /* } */ color: red; background: blue; }',
    'with no whitespace': '.a{/*note*/color:red;background:blue}',
    'inside @media': '@media (min-width: 1px) { .a { /* note */ color: red; background: blue; } }',
  }

  for (const [where, css] of Object.entries(placements)) {
    it(`should keep every declaration when the comment sits ${where}, minified`, () => {
      const out = preflightCSS(css, true)
      expect(out).toContain('color:red')
      expect(out).toContain('background:blue')
      expect(out).not.toContain('note')
    })

    it(`should keep every declaration when the comment sits ${where}, unminified`, () => {
      const out = preflightCSS(css, false)
      expect(out).toMatch(/color:\s*red/)
      expect(out).toMatch(/background:\s*blue/)
    })
  }

  it('should keep the custom property after a comment', () => {
    const out = preflightCSS(':root { /* note */ --x: 1px; --y: 2px; }', true)
    expect(out).toContain('--x:1px')
    expect(out).toContain('--y:2px')
  })
})

describe('A top-level theme.colors (#51)', () => {
  function generate(theme: Record<string, unknown>, classes: string[]): string {
    const gen = new CSSGenerator({ ...defaultConfig, theme: { ...defaultConfig.theme, ...theme } as any })
    for (const cls of classes)
      gen.generate(cls)
    return gen.toCSS(false)
  }

  it('should generate a colour declared at the top level', () => {
    const out = generate({ colors: { ...defaultConfig.theme.colors, brand: '#ff0000' } }, ['bg-brand'])
    expect(out).toContain('.bg-brand')
    expect(out).toContain('#ff0000')
  })

  it('should generate a colour declared under extend', () => {
    const out = generate({ extend: { colors: { brand: '#00ff00' } } }, ['bg-brand', 'bg-red-500'])
    expect(out).toContain('#00ff00')
    expect(out).toContain('.bg-red-500')
  })

  it('should let extend win over the top level for the same name', () => {
    const out = generate({
      colors: { ...defaultConfig.theme.colors, brand: '#ff0000' },
      extend: { colors: { brand: '#00ff00' } },
    }, ['bg-brand'])
    expect(out).toContain('#00ff00')
    expect(out).not.toContain('#ff0000')
  })
})
