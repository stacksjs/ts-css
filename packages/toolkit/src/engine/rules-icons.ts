import type { CssConfig, ParsedClass } from './types'
import type { UtilityRule } from './rules'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Pure-CSS iconify rule — `i-{collection}-{name}`.
 *
 * Behaves like UnoCSS's `presetIcons`: a class such as `i-hugeicons-user-group`
 * or `i-mdi-home` resolves to a CSS mask-image of the SVG, painted with
 * `currentColor`. Uses Antfu's "icons in pure CSS" technique
 * (https://antfu.me/posts/icons-in-pure-css):
 *
 *     -webkit-mask: var(--svg) no-repeat;
 *             mask: var(--svg) no-repeat;
 *     mask-size: 100% 100%;
 *     background-color: currentColor;
 *
 * Icon data is loaded synchronously from `@iconify-json/{collection}` packages
 * the project has installed. The first match for a collection caches the
 * entire icon set so subsequent lookups in the same collection are O(1) map
 * reads. No network calls; works offline; tree-shakes per-class because we
 * only emit CSS for classes that actually appeared in the scanned files.
 *
 * @example
 *   class="i-hugeicons-user-group h-5 w-5 text-blue-500"
 *
 *   → ships <span> sized 1.25rem × 1.25rem painted blue, no `<svg>` runtime.
 */

interface IconifyJSONIcon {
  body: string
  width?: number
  height?: number
  left?: number
  top?: number
  rotate?: number
  hFlip?: boolean
  vFlip?: boolean
}

interface IconifyJSONCollection {
  prefix?: string
  icons: Record<string, IconifyJSONIcon>
  aliases?: Record<string, { parent: string }>
  width?: number
  height?: number
  /** Icons grouped by category — some collections (like material-symbols) use
   * an `info` block plus a flat `icons` map; others ship a separate
   * `icons.json`. We only need `icons` + dimensions. */
}

const collectionCache = new Map<string, IconifyJSONCollection | null>()

function loadCollection(collection: string): IconifyJSONCollection | null {
  if (collectionCache.has(collection)) return collectionCache.get(collection)!

  // Project-relative resolution. We deliberately avoid Node's `require.resolve`
  // because it surprises with hoisting in monorepos; reading the JSON
  // directly from `node_modules` is faster and predictable.
  const candidates = [
    join(process.cwd(), 'node_modules', '@iconify-json', collection, 'icons.json'),
    join(process.cwd(), 'node_modules', '.bun', '@iconify-json', collection, 'icons.json'),
  ]
  // Bun's isolated installs store packages as
  // `.bun/@iconify-json+<collection>@<version>/node_modules/@iconify-json/<collection>`.
  // The comment above previously claimed this walk existed but it never did,
  // so isolated installs silently emitted no icon CSS at all.
  const bunStore = join(process.cwd(), 'node_modules', '.bun')
  if (existsSync(bunStore)) {
    try {
      const prefix = `@iconify-json+${collection}@`
      for (const entry of readdirSync(bunStore)) {
        if (entry.startsWith(prefix)) {
          candidates.push(join(bunStore, entry, 'node_modules', '@iconify-json', collection, 'icons.json'))
        }
      }
    }
    catch {
      // unreadable store — fall through to the plain candidates
    }
  }
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const data = JSON.parse(readFileSync(path, 'utf-8')) as IconifyJSONCollection
        collectionCache.set(collection, data)
        return data
      }
      catch {
        // Corrupt JSON — treat as missing
      }
    }
  }
  collectionCache.set(collection, null)
  return null
}

function lookupIcon(collection: IconifyJSONCollection, name: string): IconifyJSONIcon | null {
  const icon = collection.icons[name]
  if (icon) return icon
  // Resolve aliases (e.g. `arrow-back` → `arrow-left`).
  const alias = collection.aliases?.[name]
  if (alias) return collection.icons[alias.parent] ?? null
  return null
}

/**
 * Build the SVG `<svg>` source string for an icon. Iconify body strings
 * embed raw `<path>` / `<g>` markup but no outer `<svg>` wrapper, so we
 * synthesise that here with the icon's viewBox.
 */
function svgFor(collection: IconifyJSONCollection, icon: IconifyJSONIcon): string {
  const w = icon.width ?? collection.width ?? 24
  const h = icon.height ?? collection.height ?? 24
  const left = icon.left ?? 0
  const top = icon.top ?? 0
  // Single-line, no extra whitespace — keeps the data URL short.
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${left} ${top} ${w} ${h}' width='${w}' height='${h}'>${icon.body}</svg>`
}

/**
 * Encode an SVG string into a data URL safe for `mask-image: url(...)`.
 * We use percent-encoding for the few characters that would break a CSS
 * `url("...")` value when the URL is wrapped in single quotes — matches
 * the encoding UnoCSS uses so cached results are byte-identical.
 */
function svgToDataUrl(svg: string): string {
  const encoded = svg
    .replace(/"/g, '\'')
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\?/g, '%3F')
    .replace(/\s+/g, ' ')
  return `url("data:image/svg+xml;utf8,${encoded}")`
}

/**
 * Match `i-{collection}-{name}`.
 *
 * The collection is NOT a single segment: plenty of `@iconify-json/*` packages
 * are hyphenated (`simple-icons`, `material-symbols`, `fa6-brands`, `line-md`,
 * `vscode-icons`). Splitting on the first hyphen read `i-simple-icons-bluesky`
 * as collection `simple`, which does not exist, so every brand icon silently
 * produced no CSS at all.
 *
 * Icon names contain hyphens too, so the split is genuinely ambiguous. Walk the
 * candidate split points and take the first that resolves to a collection that
 * actually holds the icon. `loadCollection` is memoised, so a miss is cheap.
 */
const ICON_RE = /^i-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)-(.+)$/

function resolveIcon(base: string): { collection: IconifyJSONCollection, icon: IconifyJSONIcon } | undefined {
  if (!base.startsWith('i-'))
    return undefined

  const rest = base.slice(2)
  // Split after each hyphen, shortest collection first: `hugeicons` before
  // `hugeicons-arrow`, so the common single-segment case stays the fast path.
  for (let i = rest.indexOf('-'); i !== -1; i = rest.indexOf('-', i + 1)) {
    const collectionName = rest.slice(0, i)
    const iconName = rest.slice(i + 1)
    if (!/^[a-z][a-z0-9-]*$/.test(collectionName))
      continue

    const collection = loadCollection(collectionName)
    if (!collection)
      continue
    const icon = lookupIcon(collection, iconName)
    if (icon)
      return { collection, icon }
  }

  return undefined
}

export const iconRule: UtilityRule = (parsed: ParsedClass, _config: CssConfig) => {
  if (!ICON_RE.test(parsed.base)) return undefined
  const resolved = resolveIcon(parsed.base)
  if (!resolved) return undefined
  const { collection, icon } = resolved

  const url = svgToDataUrl(svgFor(collection, icon))
  // Antfu's pattern — every property is set so the class is fully self-
  // contained (no need for a sidecar `.icon { ... }` reset rule). Both
  // `mask` and `-webkit-mask` for Safari < 17.
  // At zero specificity (`defaults`): `h-5 w-5 i-lucide-bell` is a 20px
  // icon whichever stylesheet declared which rule last.
  return {
    defaults: true,
    properties: {
      'display': 'inline-block',
      'width': '1em',
      'height': '1em',
      'background-color': 'currentColor',
      '-webkit-mask': `${url} no-repeat`,
      'mask': `${url} no-repeat`,
      '-webkit-mask-size': '100% 100%',
      'mask-size': '100% 100%',
      'vertical-align': '-0.125em',
    },
  }
}
