import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

/**
 * Pages ship stylesheets of their own, and a router appends the next page's
 * after the first. A later sheet that re-declared `.i-x-bell { width: 1em }`
 * after `.w-5` shrank every sized icon already on the page. The icon's box is
 * a default, so it sits at zero specificity: any utility beside it wins in
 * whatever order the sheets arrive.
 */
describe('icon defaults', () => {
  const cwd = process.cwd()
  let root = ''

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'ts-css-icons-'))
    const dir = join(root, 'node_modules', '@iconify-json', 'tsicon')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'icons.json'), JSON.stringify({ prefix: 'tsicon', width: 24, height: 24, icons: { bell: { body: '<path d="M0 0h24v24H0z"/>' } } }))
    process.chdir(root)
  })

  afterAll(() => {
    process.chdir(cwd)
    rmSync(root, { recursive: true, force: true })
  })

  it('emits the icon box under :where(), below any utility', () => {
    const generator = new CSSGenerator({ ...defaultConfig, preflight: false } as any)
    generator.generate('i-tsicon-bell')
    const css = generator.toCSS(false)
    expect(css).toContain(':where(.i-tsicon-bell) {')
    expect(css).toContain('width: 1em;')
    expect(css).not.toMatch(/(^|\n)\.i-tsicon-bell \{/)
  })
})
