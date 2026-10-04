import type { BunPlugin } from 'bun'
import type { CssConfig, CssOptions } from './types'
import { defaultConfig } from './config'
import { CSSGenerator } from './generator'
import { extractClasses } from './parser'

export interface CssPluginOptions {
  /**
   * Custom config to override default config
  */
  config?: CssOptions
  /**
   * Include preflight CSS
   * @default true
  */
  includePreflight?: boolean
}

/**
 * Crosswind Bun plugin for processing HTML files
 *
 * @example
 * ```typescript
 * import { plugin } from '@ts-css/core'
 *
 * await Bun.build({
 *   entrypoints: ['./src/index.ts'],
 *   outdir: './dist',
 *   plugins: [plugin()],
 * })
 * ```
*/
export function plugin(options: CssPluginOptions = {}): BunPlugin {
  return {
    name: 'bun-plugin-ts-css',
    async setup(build) {
    // Load configuration from css.config.ts or use defaults
      const { loadConfig } = await import('bunfig')
      const loadedConfig = await loadConfig<CssConfig>({
        name: 'css',
        defaultConfig,
      })

      // Merge with provided options. Theme sub-maps merge key-by-key: a
      // shallow spread meant a partial override like
      // `theme: { colors: { brand: '#f00' } }` replaced the ENTIRE default
      // palette and every text-red-500 style stopped resolving.
      const mergedTheme: CssConfig['theme'] = { ...loadedConfig.theme }
      if (options.config?.theme) {
        for (const [key, value] of Object.entries(options.config.theme)) {
          const base = (loadedConfig.theme as unknown as Record<string, unknown>)[key];
          (mergedTheme as unknown as Record<string, unknown>)[key]
            = base && typeof base === 'object' && !Array.isArray(base)
              && value && typeof value === 'object' && !Array.isArray(value)
              ? { ...base, ...value }
              : value
        }
      }

      const config = {
        ...loadedConfig,
        ...options.config,
        theme: mergedTheme,
        shortcuts: {
          ...loadedConfig.shortcuts,
          ...options.config?.shortcuts,
        },
        rules: [
          ...(loadedConfig.rules || []),
          ...(options.config?.rules || []),
        ],
        variants: {
          ...loadedConfig.variants,
          ...options.config?.variants,
        },
        safelist: [
          ...(loadedConfig.safelist || []),
          ...(options.config?.safelist || []),
        ],
        blocklist: [
          ...(loadedConfig.blocklist || []),
          ...(options.config?.blocklist || []),
        ],
        preflights: [
          ...(loadedConfig.preflights || []),
          ...(options.config?.preflights || []),
        ],
        presets: [
          ...(loadedConfig.presets || []),
          ...(options.config?.presets || []),
        ],
      } as CssConfig

      const includePreflight = options.includePreflight ?? true

      // Process HTML files
      build.onLoad({ filter: /\.html?$/ }, async ({ path }) => {
        const html = await Bun.file(path).text()

        // Extract utility classes from HTML. Pass the same extract options
        // the CLI build path uses — the plugin previously ignored
        // attributify/bracketSyntax config entirely.
        const classes = extractClasses(html, {
          attributify: config.attributify,
          bracketSyntax: config.bracketSyntax,
          codeStrings: config.codeStrings,
        })

        // Add safelist classes (strings only; pattern objects are ignored)
        for (const cls of config.safelist) {
          if (typeof cls === 'string') {
            classes.add(cls)
          }
        }

        // Generate CSS
        const generator = new CSSGenerator(config)

        for (const className of classes) {
          generator.generate(className)
        }

        // Generate CSS output
        const css = generator.toCSS(includePreflight, config.minify)

        // Inject CSS into HTML. Fragments without </head> previously came
        // back unchanged — the generated CSS was silently dropped.
        const styleTag = `<style>${css}</style>`
        const contents = html.includes('</head>')
          ? html.replace('</head>', `${styleTag}\n</head>`)
          : `${styleTag}\n${html}`

        return {
          contents,
          loader: 'text',
        }
      })
    },
  }
}

export default plugin
