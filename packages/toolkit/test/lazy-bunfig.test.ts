import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The library entries, `./engine` above all, are bundled into hosts that are
// not Bun: the stx and Stacks VS Code extensions run on Node, which cannot
// parse the module-scope `await` and `import.meta.require` in bunfig's logger.
// bunfig is therefore only ever imported when a config file is loaded, and the
// build keeps it external, so such a host can leave it out of its bundle.

const root = join(import.meta.dir, '..')

describe('bunfig stays out of the library graph until a config is loaded', () => {
  for (const file of ['src/config.ts', 'src/engine/config.ts', 'src/engine/plugin.ts']) {
    it(`${file} imports bunfig lazily`, () => {
      const source = readFileSync(join(root, file), 'utf8')
      expect(source).not.toMatch(/^import[^\n]*from 'bunfig'/m)
      expect(source).toContain('await import(\'bunfig\')')
    })
  }

  it('the library build keeps its dependencies external', () => {
    const build = readFileSync(join(root, 'build.ts'), 'utf8')
    expect(build).toContain('external: [\'bunfig\', \'@stacksjs/clapp\']')
  })
})
