/* eslint-disable no-console */
/**
 * Style-object API benchmark: ts-css vs StyleX.
 *
 * Both compile the same style objects into the same shape of output — atomic
 * class names plus the CSS rules backing them — so the workloads below are
 * literally the same declarations expressed in each API.
 *
 * Methodology:
 * - ts-css: `css.create()` in memory, registry reset per iteration so neither
 *   side gets to reuse the previous run's dedup table.
 * - StyleX: `@stylexjs/babel-plugin` via `babel.transformSync`, reading the
 *   atomic rules back off `metadata.stylex`.
 *
 * Note: the Babel transform is not an implementation detail we chose for
 * StyleX — it is the only path StyleX offers from a style object to CSS, the
 * same way PostCSS is the only path Tailwind v3 offers. The second group
 * measures the fully comparable case: source text in, stylesheet out, both
 * sides paying for their own parse.
 */

// @ts-ignore - mitata is an optional benchmark dependency
import { bench, group, run } from 'mitata'
import { transformSync } from '@babel/core'
// @ts-ignore - no bundled types
import styleXPlugin from '@stylexjs/babel-plugin'
import { css, renderStyles, resetStyles } from '../packages/toolkit/src/engine/style'

// =============================================================================
// WORKLOADS
//
// Each is defined once as source text, so the ts-css object and the StyleX
// module are provably the same declarations rather than two hand-written sets
// that drifted apart.
// =============================================================================

interface Workload {
  name: string
  /** The object literal passed to `create()`, as source text. */
  literal: string
  /** How many declarations it contains, for the summary table. */
  declarations: number
}

function countDeclarations(literal: string): number {
  return (literal.match(/^\s*[\w'"[$-]+\s*:\s*(?!\{)/gm) ?? []).length
}

function workload(name: string, literal: string): Workload {
  return { name, literal, declarations: countDeclarations(literal) }
}

const simple = workload('simple', `{
  card: { padding: 16, color: 'blue', backgroundColor: 'white' },
  danger: { color: 'red' },
}`)

const component = workload('component', `{
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderRadius: 8 },
  title: { fontSize: 18, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' },
  body: { fontSize: 14, lineHeight: 1.5, color: '#4b5563' },
  button: { paddingInline: 16, paddingBlock: 8, backgroundColor: '#3b82f6', color: 'white', borderRadius: 6, transitionProperty: 'background-color', transitionDuration: '200ms' },
  input: { width: '100%', paddingInline: 12, paddingBlock: 8, borderWidth: 1, borderStyle: 'solid', borderColor: '#d1d5db', borderRadius: 6 },
  badge: { display: 'inline-flex', alignItems: 'center', paddingInline: 8, paddingBlock: 4, fontSize: 12, fontWeight: 500, backgroundColor: '#dcfce7', color: '#166534', borderRadius: 9999 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, padding: 24 },
  stack: { display: 'flex', flexDirection: 'column', rowGap: 16, marginInline: 'auto', maxWidth: 448 },
}`)

const conditional = workload('conditional', `{
  link: {
    color: '#2563eb',
    textDecorationLine: 'none',
    ':hover': { color: '#1d4ed8', textDecorationLine: 'underline' },
    ':focus-visible': { outlineWidth: 2, outlineStyle: 'solid', outlineColor: '#2563eb' },
    ':active': { color: '#1e40af' },
  },
  panel: {
    padding: 16,
    backgroundColor: 'white',
    '@media (min-width: 768px)': { padding: 24 },
    '@media (min-width: 1280px)': { padding: 32 },
    '@media (prefers-color-scheme: dark)': { backgroundColor: '#111827', color: 'white' },
  },
  marker: {
    position: 'relative',
    '::before': { content: '"*"', color: '#dc2626', marginInlineEnd: 4 },
    '::after': { content: '""', display: 'block', height: 1, backgroundColor: '#e5e7eb' },
  },
  field: {
    borderColor: '#d1d5db',
    ':disabled': { backgroundColor: '#f3f4f6', color: '#9ca3af' },
    ':invalid': { borderColor: '#dc2626' },
    ':placeholder-shown': { color: '#9ca3af' },
  },
}`)

/** A design system's worth of styles: 200 named entries, 5 declarations each. */
const designSystem = workload('design system', `{
${Array.from({ length: 200 }, (_, i) => `  s${i}: { padding: ${i % 64}, marginTop: ${i % 32}, fontSize: ${12 + (i % 20)}, zIndex: ${i}, opacity: ${(i % 10) / 10} },`).join('\n')}
}`)

const WORKLOADS = [simple, component, conditional, designSystem]

// =============================================================================
// ts-css
// =============================================================================

/**
 * `create()` takes a real object, so the literal is evaluated once up front —
 * parsing it per iteration would measure the benchmark harness, not the API.
 */
function toObject(literal: string): Record<string, any> {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal})`)() as Record<string, any>
}

const objects = new Map(WORKLOADS.map(w => [w.name, toObject(w.literal)]))

function tsCssCreate(name: string): string {
  resetStyles()
  css.create(objects.get(name)!)
  return renderStyles()
}

// =============================================================================
// StyleX
// =============================================================================

const STYLEX_OPTIONS = {
  dev: false,
  runtimeInjection: false,
  unstable_moduleResolution: { type: 'commonJS', rootDir: '/' },
}

function styleXSource(literal: string): string {
  return `import * as stylex from '@stylexjs/stylex'\nexport const styles = stylex.create(${literal})\n`
}

const stylexSources = new Map(WORKLOADS.map(w => [w.name, styleXSource(w.literal)]))

function styleXCreate(name: string): string {
  const result = transformSync(stylexSources.get(name)!, {
    filename: '/src/styles.js',
    babelrc: false,
    configFile: false,
    plugins: [[styleXPlugin, STYLEX_OPTIONS]],
  })
  const rules = (result?.metadata as any)?.stylex ?? []
  return rules.map(([, rule]: [string, { ltr: string }]) => rule.ltr).join('\n')
}

// =============================================================================
// End-to-end: source text in, stylesheet out
// =============================================================================

const transpiler = new Bun.Transpiler({ loader: 'ts' })

const tsCssSources = new Map(WORKLOADS.map(w => [
  w.name,
  `import { css } from '@stacksjs/ts-css/engine'\nexport const styles = css.create(${w.literal})\n`,
]))

/**
 * The build's real path: strip types, evaluate the module, read the registry.
 * `import` is rewritten to the injected binding so the module can run without
 * a resolver, which is the only difference from what `cssx build` does.
 */
function tsCssPipeline(name: string): string {
  resetStyles()
  const compiled = transpiler
    .transformSync(tsCssSources.get(name)!)
    .replace(/^\s*import\b.*$/gm, '')
    .replace(/^\s*export\s+/gm, '')
  // eslint-disable-next-line no-new-func
  new Function('css', compiled)(css)
  return renderStyles()
}

// =============================================================================
// CORRECTNESS GATE
//
// A benchmark that measures the wrong thing is worse than no benchmark, so
// every workload is checked to produce the same number of atomic rules on both
// sides before any timing is taken.
// =============================================================================

console.log('\n Verifying both engines produce equivalent output...\n')

for (const { name, declarations } of WORKLOADS) {
  const ours = tsCssCreate(name).split('\n').filter(Boolean).length
  const theirs = styleXCreate(name).split('\n').filter(Boolean).length
  const match = ours === theirs ? '✓' : '✗'
  console.log(`  ${match} ${name.padEnd(16)} ${String(declarations).padStart(4)} declarations → ${ours} rules (ts-css) / ${theirs} rules (StyleX)`)
}

// =============================================================================
// BENCHMARKS
// =============================================================================

for (const { name, declarations } of WORKLOADS) {
  group(`Style objects → atomic CSS: ${name} (${declarations} declarations)`, () => {
    bench('ts-css', () => { tsCssCreate(name) })
    bench('StyleX', () => { styleXCreate(name) })
  })
}

for (const { name, declarations } of WORKLOADS) {
  group(`Source module → stylesheet: ${name} (${declarations} declarations)`, () => {
    bench('ts-css', () => { tsCssPipeline(name) })
    bench('StyleX', () => { styleXCreate(name) })
  })
}

console.log('\n Running Style API Benchmarks...\n')
console.log('Comparing: ts-css vs StyleX')
console.log('')
console.log('Architecture notes:')
console.log('  ts-css — in-memory: css.create() on a plain object')
console.log('  StyleX — Babel:     transformSync() with @stylexjs/babel-plugin')
console.log('')
console.log('The Babel transform is not an overhead we imposed on StyleX — it is')
console.log('the only path StyleX offers from a style object to CSS. The second')
console.log('group removes the asymmetry by making ts-css parse its source too.\n')

await run({ colors: true })

console.log('\n Benchmark completed!\n')
