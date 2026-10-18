import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// End-to-end tests for the CLI config resolution (issue #15): `--config`
// with a relative path must resolve from the invocation cwd (not the CLI's
// install dir), and with no flag the cwd's css.config.ts must be
// auto-discovered — including output path, safelist, and shortcuts.

const CLI = join(import.meta.dir, '..', '..', 'bin', 'cssx.ts')
const TEST_DIR = join(import.meta.dir, '.cli-test')

async function runCli(args: string[], cwd: string, entry = CLI): Promise<{ exitCode: number, out: string }> {
  const proc = Bun.spawn(['bun', entry, ...args], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { exitCode, out: stdout + stderr }
}

describe('CLI config resolution (issue #15)', () => {
  beforeAll(async () => {
    await mkdir(join(TEST_DIR, 'src'), { recursive: true })
    await writeFile(
      join(TEST_DIR, 'css.config.ts'),
      `export default {
  content: ['./src/**/*.html'],
  output: './out/styles.css',
  minify: false,
  safelist: ['animate-pulse', 'bg-blue-500'],
  shortcuts: { btn: 'px-4 hover:bg-blue-700' },
}
`,
    )
    await writeFile(join(TEST_DIR, 'src', 'index.html'), '<div class="p-4 btn">hi</div>')
  })

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true })
  })

  it('resolves a relative --config path against cwd', async () => {
    await rm(join(TEST_DIR, 'out'), { recursive: true, force: true })
    const { exitCode, out } = await runCli(['build', '--config', './css.config.ts'], TEST_DIR)
    expect(out).not.toContain('Failed to load config')
    expect(exitCode).toBe(0)
    const css = await Bun.file(join(TEST_DIR, 'out', 'styles.css')).text()
    expect(css).toContain('.bg-blue-500')
  })

  it('auto-discovers css.config.ts in cwd without --config', async () => {
    await rm(join(TEST_DIR, 'out'), { recursive: true, force: true })
    const { exitCode } = await runCli(['build'], TEST_DIR)
    expect(exitCode).toBe(0)
    // The config's output path was honored (not the ./dist/styles.css default)
    expect(await Bun.file(join(TEST_DIR, 'out', 'styles.css')).exists()).toBe(true)
  })

  it('honors safelist keyframes and shortcut variants through the build', async () => {
    await rm(join(TEST_DIR, 'out'), { recursive: true, force: true })
    const { exitCode } = await runCli(['build'], TEST_DIR)
    expect(exitCode).toBe(0)
    const css = await Bun.file(join(TEST_DIR, 'out', 'styles.css')).text()
    // Safelisted animate-pulse builds without crashing and pulls its keyframes
    expect(css).toContain('@keyframes pulse')
    // Shortcut from the discovered config expands variants onto its selector
    expect(css).toContain('.btn:hover')
  })

  it('honors --no-preflight', async () => {
    await rm(join(TEST_DIR, 'out'), { recursive: true, force: true })
    const { exitCode } = await runCli(['build', '--no-preflight'], TEST_DIR)
    expect(exitCode).toBe(0)
    const css = await Bun.file(join(TEST_DIR, 'out', 'styles.css')).text()
    expect(css).not.toContain('box-sizing: border-box')
    expect(css).toContain('.p-4')
  })

  it('includes preflight by default', async () => {
    await rm(join(TEST_DIR, 'out'), { recursive: true, force: true })
    const { exitCode } = await runCli(['build'], TEST_DIR)
    expect(exitCode).toBe(0)
    const css = await Bun.file(join(TEST_DIR, 'out', 'styles.css')).text()
    expect(css).toContain('box-sizing: border-box')
  })

  it('errors clearly when --config points at a missing file', async () => {
    const { exitCode, out } = await runCli(['build', '--config', './nope.config.ts'], TEST_DIR)
    expect(exitCode).toBe(1)
    expect(out).toContain('Config file not found')
  })
})

describe('CLI analyze', () => {
  it('counts real occurrences and groups negatives/arbitrary correctly', async () => {
    await Bun.write(join(TEST_DIR, 'src', 'more.html'), '<div class="p-4 p-4 -mt-2 [mask-type:luminance]"><span class="p-4"></span></div>')
    const { exitCode, out } = await runCli(['analyze', '--json'], TEST_DIR)
    expect(exitCode).toBe(0)
    const stats = JSON.parse(out.slice(out.indexOf('{')))
    const top = stats.topClasses[0]
    // p-4 appears 4 times across the fixture files — must rank first with a real count
    expect(top.class).toBe('p-4')
    expect(top.count).toBeGreaterThanOrEqual(3)
    // negative utilities group under their root, not 'other'; arbitrary props under 'arbitrary'
    expect(stats.utilityGroups.mt).toBe(1)
    expect(stats.utilityGroups.arbitrary).toBe(1)
    expect(stats.outputSize).toBeGreaterThan(0)
  })
})

describe('CLI diagnostics', () => {
  it('warns when a content pattern matches no files', async () => {
    await writeFile(
      join(TEST_DIR, 'typo.config.ts'),
      `export default { content: ['./nonexistent/**/*.html'], output: './out/t.css', minify: false }\n`,
    )
    const { exitCode, out } = await runCli(['build', '--config', './typo.config.ts'], TEST_DIR)
    expect(exitCode).toBe(0)
    expect(out).toContain('Content pattern matched no files')
  })
})

describe('public CLI entry and generated config', () => {
  it('initializes and builds a project through the root launcher', async () => {
    const cwd = join(import.meta.dir, '.cli-init-test')
    const launcher = join(import.meta.dir, '..', '..', '..', '..', 'cssx')
    await mkdir(join(cwd, 'src'), { recursive: true })
    try {
      const initialized = await runCli(['init'], cwd, launcher)
      expect(initialized.exitCode).toBe(0)
      const config = await Bun.file(join(cwd, 'css.config.ts')).text()
      const moduleName = /from '([^']+)'/.exec(config)?.[1]
      expect(moduleName).toBe('@stacksjs/ts-css/engine')
      expect(Bun.resolveSync(moduleName!, cwd)).toBeTruthy()
      await writeFile(join(cwd, 'src', 'index.html'), '<main class="flex p-4 dark:bg-gray-900">HQ</main>')
      const built = await runCli(['build'], cwd, launcher)
      expect(built.exitCode).toBe(0)
      const css = await Bun.file(join(cwd, 'dist', 'styles.css')).text()
      expect(css).toContain('display: flex')
      expect(css).toContain('padding: 1rem')
      expect(css).toContain('dark\\:bg-gray-900')
    }
    finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })
})
