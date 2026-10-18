import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { plugin } from '../../src/engine/plugin'

const TEST_DIR = join(import.meta.dir, '.plugin-test')
const DIST_DIR = join(TEST_DIR, 'dist')

describe('bun plugin', () => {
  beforeAll(async () => {
    await mkdir(TEST_DIR, { recursive: true })
    await mkdir(DIST_DIR, { recursive: true })

    // Create test HTML file
    await writeFile(
      join(TEST_DIR, 'index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>
  <div class="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">
    <h1 class="text-2xl font-bold">Hello ts-css!</h1>
  </div>
</body>
</html>`,
    )

    // Create a TypeScript entrypoint that imports the HTML
    await writeFile(
      join(TEST_DIR, 'index.ts'),
      `import html from './index.html'
export default html
`,
    )
  })

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true })
  })

  it('should process HTML files and inject CSS', async () => {
    const result = await Bun.build({
      entrypoints: [join(TEST_DIR, 'index.ts')],
      outdir: DIST_DIR,
      plugins: [
        plugin({
          config: {
            minify: false,
          },
          includePreflight: false,
        }),
      ],
    })

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThan(0)

    // Read the output content
    const output = await result.outputs[0].text()

    // Check that CSS was injected
    expect(output).toContain('<style>')
    expect(output).toContain('</style>')

    // Check for utility classes in the CSS
    expect(output).toContain('.flex')
    expect(output).toContain('display: flex')
    expect(output).toContain('.items-center')
    expect(output).toContain('.p-4')
    expect(output).toContain('padding: 1rem')
    expect(output).toContain('.bg-blue-500')
    expect(output).toContain('.text-white')
    expect(output).toContain('.rounded-lg')
    expect(output).toContain('.shadow-md')
    expect(output).toContain('.text-2xl')
    expect(output).toContain('.font-bold')

    // Check for hover variant (note: double backslash in bundled output)
    expect(output).toContain(':bg-blue-600:hover')
  })

  it('should respect minify option', async () => {
    const result = await Bun.build({
      entrypoints: [join(TEST_DIR, 'index.ts')],
      outdir: DIST_DIR,
      plugins: [
        plugin({
          config: {
            minify: true,
          },
          includePreflight: false,
        }),
      ],
    })

    expect(result.success).toBe(true)
    const output = await result.outputs[0].text()

    // Minified CSS should not contain extra whitespace
    const styleMatch = output.match(/<style>(.*?)<\/style>/s)
    expect(styleMatch).toBeTruthy()

    if (styleMatch) {
      const css = styleMatch[1]
      // Minified CSS should not have newlines or multiple spaces
      expect(css).not.toContain('\n\n')
    }
  })

  it('should work with custom config', async () => {
    const result = await Bun.build({
      entrypoints: [join(TEST_DIR, 'index.ts')],
      outdir: DIST_DIR,
      plugins: [
        plugin({
          config: {
            minify: false,
            theme: {
              colors: {
                custom: '#123456',
              },
            },
          },
          includePreflight: false,
        }),
      ],
    })

    expect(result.success).toBe(true)
    const output = await result.outputs[0].text()

    // Standard utilities should still work
    expect(output).toContain('.flex')
    expect(output).toContain('.p-4')
  })

  it('should include preflight CSS when enabled', async () => {
    const result = await Bun.build({
      entrypoints: [join(TEST_DIR, 'index.ts')],
      outdir: DIST_DIR,
      plugins: [
        plugin({
          config: {
            minify: false,
          },
          includePreflight: true,
        }),
      ],
    })

    expect(result.success).toBe(true)
    const output = await result.outputs[0].text()

    // Check for preflight CSS (reset styles)
    expect(output).toContain('box-sizing: border-box')
  })
})

describe('plugin config merging and injection', () => {
  it('deep-merges partial theme color overrides with the default palette', async () => {
    const { plugin } = await import('../../src/engine/plugin')
    // Exercise the merge logic through the plugin factory: a partial colors
    // override must not wipe the default palette.
    const p = plugin({ config: { theme: { colors: { brand: '#f00' } } as any } })
    let onLoadCb: any
    await p.setup({
      onLoad: (_filter: any, cb: any) => { onLoadCb = cb },
    } as any)
    const dir = '/tmp/tc-plugin-test'
    await Bun.write(`${dir}/index.html`, '<html><head></head><body><div class="bg-brand text-red-500 p-2"></div></body></html>')
    const result = await onLoadCb({ path: `${dir}/index.html` })
    expect(result.contents).toContain('background-color:#f00')
    // default palette still resolves
    expect(result.contents).toContain('.text-red-500')
  })

  it('injects CSS even when the HTML has no </head>', async () => {
    const { plugin } = await import('../../src/engine/plugin')
    const p = plugin()
    let onLoadCb: any
    await p.setup({
      onLoad: (_filter: any, cb: any) => { onLoadCb = cb },
    } as any)
    const dir = '/tmp/tc-plugin-test'
    await Bun.write(`${dir}/fragment.html`, '<div class="p-4"></div>')
    const result = await onLoadCb({ path: `${dir}/fragment.html` })
    expect(result.contents).toContain('<style>')
    expect(result.contents).toContain('padding:1rem')
  })
})
