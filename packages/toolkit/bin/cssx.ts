#!/usr/bin/env bun
import type { CssConfig } from '../src/engine/types'
import { existsSync, statSync, watch } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { Glob } from 'bun'
import { CLI } from '@stacksjs/clapp'
import { version } from '../package.json'
import { build, buildAndWrite } from '../src/engine/build'
import { config, getConfig } from '../src/engine/config'
import { tailwindPreflight } from '../src/engine/preflight'

const cli = new CLI('cssx')

interface GlobalOptions {
  verbose?: boolean
  config?: string
}

interface BuildOptions extends GlobalOptions {
  output?: string
  minify?: boolean
  watch?: boolean
  content?: string
  noPreflight?: boolean
}

interface InitOptions {
  force?: boolean
}

interface AnalyzeOptions extends GlobalOptions {
  json?: boolean
  top?: number
}

/**
 * Load custom config if specified
*/
async function loadCustomConfig(configPath?: string): Promise<CssConfig> {
  if (configPath) {
    // Resolve against cwd — a bare `import('./x.ts')` resolves relative to
    // this module inside the installed package, so the documented
    // `--config ./css.config.ts` form never found the project's file.
    const absolutePath = resolve(process.cwd(), configPath)
    if (!existsSync(absolutePath)) {
      console.error(`❌ Config file not found: ${absolutePath}`)
      process.exit(1)
    }
    try {
      const customConfig = await import(absolutePath)
      return { ...config, ...(customConfig.default || customConfig) }
    }
    catch (error) {
      console.error(`❌ Failed to load config file: ${absolutePath}`)
      console.error(error)
      process.exit(1)
    }
  }
  // No --config: auto-discover css.config.{ts,js,...} in cwd via
  // bunfig, so a project's output/content/theme/safelist are honored.
  return getConfig()
}

/**
 * Resolve the config file path in play (explicit --config or the
 * auto-discovered css.config.* in cwd), if any.
*/
function resolveConfigPath(configPath?: string): string | null {
  if (configPath)
    return resolve(process.cwd(), configPath)
  for (const candidate of ['css.config.ts', 'css.config.js', 'css.config.mjs']) {
    const abs = resolve(process.cwd(), candidate)
    if (existsSync(abs))
      return abs
  }
  return null
}

/**
 * Merge CLI options with config
*/
function mergeConfig(baseConfig: CssConfig, options: BuildOptions): CssConfig {
  return {
    ...baseConfig,
    output: options.output || baseConfig.output,
    minify: options.minify ?? baseConfig.minify,
    content: options.content ? [options.content] : baseConfig.content,
    verbose: options.verbose ?? baseConfig.verbose,
    // clapp exposes --no-preflight as preflight: false; keep the declared
    // noPreflight form working too. The flag was previously declared but
    // never read, so it silently did nothing.
    includePreflight: options.noPreflight === true || (options as { preflight?: boolean }).preflight === false
      ? false
      : baseConfig.includePreflight,
  }
}

/**
 * Run the build process
*/
async function runBuild(buildConfig: CssConfig, options: BuildOptions): Promise<void> {
  // Honor verbose from the config file too — the field was typed and
  // merged but only the CLI flag was ever read.
  const verbose = options.verbose ?? buildConfig.verbose ?? false
  try {
    const startMsg = verbose ? '🚀 Building CSS (verbose mode)...' : '🚀 Building CSS...'
    console.log(startMsg)

    if (verbose) {
      console.log(`📂 Content patterns: ${buildConfig.content.join(', ')}`)
      console.log(`📝 Output: ${buildConfig.output}`)
      console.log(`🗜️  Minify: ${buildConfig.minify ? 'Yes' : 'No'}`)
    }

    const result = await buildAndWrite(buildConfig)

    if (result.unmatchedPatterns && result.unmatchedPatterns.length > 0) {
      for (const pattern of result.unmatchedPatterns) {
        console.warn(`⚠️  Content pattern matched no files: ${pattern}`)
      }
    }

    console.log(`✅ Built ${result.classes.size} classes in ${result.duration.toFixed(2)}ms`)
    console.log(`📝 Output: ${buildConfig.output}`)

    // Show compile class stats if enabled
    if (result.compiledClasses && result.compiledClasses.size > 0) {
      console.log(`🔨 Compiled ${result.compiledClasses.size} class groups`)
      if (result.transformedFiles) {
        console.log(`📝 Transformed ${result.transformedFiles.size} files`)
      }

      if (verbose) {
        console.log(`\n📦 Compiled classes:`)
        for (const [, { className, utilities }] of result.compiledClasses) {
          console.log(`  ${className} ← ${utilities.join(' ')}`)
        }
      }
    }

    if (verbose && result.classes.size > 0) {
      const classesArray = Array.from(result.classes).sort()
      console.log(`\n📋 Classes found (${result.classes.size}):`)
      classesArray.forEach(cls => console.log(`  - ${cls}`))
    }

    // Show size info
    if (existsSync(buildConfig.output)) {
      const file = Bun.file(buildConfig.output)
      const sizeKB = (file.size / 1024).toFixed(2)
      console.log(`📦 File size: ${sizeKB} KB`)
    }
  }
  catch (error) {
    console.error('❌ Build failed:', error)
    if (verbose && error instanceof Error) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

/**
 * Setup file watching
*/
function setupWatch(buildConfig: CssConfig, options: BuildOptions): void {
  console.log('👀 Watching for changes...')

  // Reload the config file on change — the watcher previously closed over
  // the resolved config forever, so edits to css.config.ts (theme,
  // content, safelist) were silently ignored until a restart. Re-imports
  // are cache-busted with a query param since Bun caches module imports.
  const configRef = { current: buildConfig }
  const configPath = resolveConfigPath(options.config)
  if (configPath) {
    try {
      watch(configPath, async () => {
        try {
          const fresh = await import(`${configPath}?t=${Date.now()}`)
          configRef.current = mergeConfig({ ...config, ...(fresh.default || fresh) }, options)
          console.log(`\n⚙️  ${configPath} changed, rebuilding with fresh config...`)
          await runBuild(configRef.current, options)
        }
        catch (error) {
          console.warn('⚠️  Failed to reload config:', error instanceof Error ? error.message : error)
        }
      })
    }
    catch {
      // config file not watchable — non-fatal
    }
  }

  // Derive a real directory per content pattern. Splitting on '**' alone
  // handed fs.watch glob strings ('src/*.html') or file paths, which throw
  // ENOENT and killed the whole watcher on the first non-** pattern.
  const watchDirs = new Set<string>()
  for (const pattern of buildConfig.content) {
    // Cut at the first glob metacharacter, then drop any filename remainder
    const metaIdx = pattern.search(/[*?[{]/)
    let dir = metaIdx === -1 ? pattern : pattern.slice(0, metaIdx)
    if (metaIdx !== -1 || !existsSync(dir) || !statSync(dir).isDirectory()) {
      dir = dir.slice(0, dir.lastIndexOf('/') + 1) || '.'
    }
    // Walk up to the nearest existing directory
    while (dir !== '.' && dir !== '/' && !existsSync(dir)) {
      const parent = dirname(dir)
      if (parent === dir)
        break
      dir = parent
    }
    if (existsSync(dir)) {
      watchDirs.add(dir)
    }
    else {
      console.warn(`⚠️  Skipping watch for missing path: ${pattern}`)
    }
  }

  // Debounce: one save fires multiple fs events (rename + change); without
  // coalescing each triggered its own concurrent rebuild.
  let rebuildTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleRebuild = (filename: string): void => {
    if (rebuildTimer)
      clearTimeout(rebuildTimer)
    rebuildTimer = setTimeout(async () => {
      rebuildTimer = null
      console.log(`\n📝 ${filename} changed, rebuilding...`)
      await runBuild(configRef.current, options)
    }, 50)
  }

  for (const dir of watchDirs) {
    try {
      watch(dir, { recursive: true }, (_eventType, filename) => {
        if (filename && /\.(?:html|js|ts|jsx|tsx|stx)$/.test(filename)) {
          scheduleRebuild(filename)
        }
      })
    }
    catch (error) {
      console.warn(`⚠️  Could not watch ${dir}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`\n👀 Watching: ${Array.from(watchDirs).join(', ')}`)
}

// Build command
cli
  .command('build', 'Build CSS from content files')
  .option('--output <path>', 'Output CSS file path')
  .option('--minify', 'Minify CSS output')
  .option('--watch', 'Watch for file changes')
  .option('--content <pattern>', 'Content file pattern (can override config)')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Show detailed output')
  .option('--no-preflight', 'Skip preflight CSS')
  .example('cssx build')
  .example('cssx build --output ./dist/styles.css')
  .example('cssx build --minify --watch')
  .example('cssx build --verbose')
  .example('cssx build --config ./custom.config.ts')
  .action(async (options: BuildOptions) => {
    const baseConfig = await loadCustomConfig(options.config)
    const buildConfig = mergeConfig(baseConfig, options)

    await runBuild(buildConfig, options)

    // watch: true from the config file works like --watch (the field was
    // typed and scaffolded by init but never read).
    if (options.watch || buildConfig.watch) {
      setupWatch(buildConfig, options)
    }
  })

// Watch command (alias for build --watch)
cli
  .command('watch', 'Build and watch for changes')
  .option('--output <path>', 'Output CSS file path')
  .option('--minify', 'Minify CSS output')
  .option('--content <pattern>', 'Content file pattern')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Show detailed output')
  .example('cssx watch')
  .example('cssx watch --output ./dist/styles.css')
  .example('cssx watch --verbose')
  .action(async (options: BuildOptions) => {
    const baseConfig = await loadCustomConfig(options.config)
    const buildConfig = mergeConfig(baseConfig, options)

    await runBuild(buildConfig, options)
    setupWatch(buildConfig, options)
  })

// Init command - Create a config file
cli
  .command('init', 'Create a css.config.ts file')
  .option('--force', 'Overwrite existing config file')
  .example('cssx init')
  .example('cssx init --force')
  .action(async (options: InitOptions) => {
    const configPath = './css.config.ts'

    if (existsSync(configPath) && !options.force) {
      console.error('❌ Config file already exists. Use --force to overwrite.')
      process.exit(1)
    }

    const defaultConfig = `import type { CssOptions } from '@stacksjs/ts-css/engine'

const config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,stx}'],
  output: './dist/styles.css',
  minify: false,
  watch: false,
} satisfies CssOptions

export default config
`

    try {
      await Bun.write(configPath, defaultConfig)
      console.log('✅ Created css.config.ts')
      console.log('\nNext steps:')
      console.log('  1. Update the content paths in css.config.ts')
      console.log('  2. Run: cssx build')
    }
    catch (error) {
      console.error('❌ Failed to create config file:', error)
      process.exit(1)
    }
  })

// Analyze command - Show statistics
cli
  .command('analyze', 'Analyze utility class usage')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Show detailed output')
  .option('--json', 'Output as JSON')
  .option('--top <n>', 'Show top N most used classes', { default: 10 })
  .example('cssx analyze')
  .example('cssx analyze --top 20')
  .example('cssx analyze --json')
  .action(async (options: AnalyzeOptions) => {
    try {
      const baseConfig = await loadCustomConfig(options.config)

      if (!options.json) {
        console.log('🔍 Analyzing utility classes...\n')
      }

      const result = await build(baseConfig)

      // Count real occurrences across the content files so "top classes"
      // reflects usage, not scan order (the classes set is de-duplicated).
      const counts = new Map<string, number>()
      for (const cls of result.classes) counts.set(cls, 0)
      for (const pattern of baseConfig.content) {
        const glob = new Glob(pattern)
        for await (const file of glob.scan('.')) {
          let content: string
          try {
            content = await Bun.file(file).text()
          }
          catch {
            continue
          }
          for (const cls of result.classes) {
            let idx = content.indexOf(cls)
            while (idx !== -1) {
              counts.set(cls, counts.get(cls)! + 1)
              idx = content.indexOf(cls, idx + cls.length)
            }
          }
        }
      }

      // Group classes by utility root: strip variants (last colon outside
      // brackets), important markers, and negative signs; arbitrary
      // properties group under 'arbitrary'. The old split('-')[0] put every
      // negative utility in 'other' and arbitrary props under '[mask'.
      const utilityRoot = (cls: string): string => {
        let base = cls
        const bracketIdx = base.indexOf('[')
        const lastColon = base.lastIndexOf(':', bracketIdx === -1 ? base.length : bracketIdx)
        if (lastColon !== -1)
          base = base.slice(lastColon + 1)
        if (base.startsWith('!'))
          base = base.slice(1)
        if (base.endsWith('!'))
          base = base.slice(0, -1)
        if (base.startsWith('-'))
          base = base.slice(1)
        if (base.startsWith('['))
          return 'arbitrary'
        return base.split('-')[0] || 'other'
      }
      const utilityGroups = new Map<string, string[]>()
      for (const cls of result.classes) {
        const utility = utilityRoot(cls)
        if (!utilityGroups.has(utility)) {
          utilityGroups.set(utility, [])
        }
        utilityGroups.get(utility)!.push(cls)
      }

      const stats = {
        totalClasses: result.classes.size,
        buildTime: result.duration,
        // Size of the CSS just built — the previous file-size read reported
        // a stale artifact (analyze never writes the output file).
        outputSize: Buffer.byteLength(result.css),
        utilityGroups: Object.fromEntries(
          Array.from(utilityGroups.entries())
            .map(([key, value]) => [key, value.length] as [string, number])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        ),
        topClasses: [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, options.top || 10)
          .map(([cls, count]) => ({ class: cls, count })),
      }

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2))
      }
      else {
        console.log(`📊 Total classes: ${stats.totalClasses}`)
        console.log(`⏱️  Build time: ${stats.buildTime.toFixed(2)}ms`)
        console.log(`📦 Output size: ${(stats.outputSize / 1024).toFixed(2)} KB\n`)

        console.log(`🏷️  Utility groups (top ${options.top}):`)
        const topGroups = Object.entries(stats.utilityGroups).slice(0, options.top || 10)
        for (const [utility, count] of topGroups) {
          console.log(`  ${utility.padEnd(20)} ${count} classes`)
        }

        if (options.verbose) {
          console.log(`\n📋 All classes:`)
          for (const cls of Array.from(result.classes).sort()) {
            console.log(`  - ${cls}`)
          }
        }
      }
    }
    catch (error) {
      console.error('❌ Analysis failed:', error)
      process.exit(1)
    }
  })

// Clean command - Remove output file
cli
  .command('clean', 'Remove the output CSS file')
  .option('--config <path>', 'Path to config file')
  .option('--output <path>', 'Output CSS file path (defaults to the config output)')
  .example('cssx clean')
  .action(async (options: GlobalOptions & { output?: string }) => {
    try {
      const baseConfig = await loadCustomConfig(options.config)
      if (options.output)
        baseConfig.output = options.output

      if (!existsSync(baseConfig.output)) {
        console.log('ℹ️  Output file does not exist')
        return
      }

      await unlink(baseConfig.output)
      console.log(`✅ Removed ${baseConfig.output}`)
    }
    catch (error) {
      console.error('❌ Failed to remove output file:', error)
      process.exit(1)
    }
  })

// Preflight command - Generate just the preflight CSS
cli
  .command('preflight', 'Generate preflight CSS only')
  .option('--output <path>', 'Output CSS file path', { default: './preflight.css' })
  .example('cssx preflight')
  .example('cssx preflight --output ./reset.css')
  .action(async (options: { output?: string }) => {
    try {
      const outputPath = options.output || './preflight.css'
      const preflightCSS = tailwindPreflight.getCSS()

      await Bun.write(outputPath, preflightCSS)
      console.log(`✅ Generated preflight CSS`)
      console.log(`📝 Output: ${outputPath}`)

      const file = Bun.file(outputPath)
      const sizeKB = (file.size / 1024).toFixed(2)
      console.log(`📦 File size: ${sizeKB} KB`)
    }
    catch (error) {
      console.error('❌ Failed to generate preflight CSS:', error)
      process.exit(1)
    }
  })

// Version command
cli
  .command('version', 'Show the version of ts-css')
  .action(() => {
    console.log(version)
  })

cli.version(version)
cli.help()

// Parse arguments
cli.parse()
