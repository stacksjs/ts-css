import type { CSSConfig } from './types'

export const defaultConfig: CSSConfig = {
  floatPrecision: 3,
  verbose: false,
}

let _config: CSSConfig | null = null

export async function getConfig(): Promise<CSSConfig> {
  if (!_config) {
    const { loadConfig } = await import('bunfig')
    _config = await loadConfig({
      name: 'ts-css',
      defaultConfig,
    })
  }
  return _config
}

export const config: CSSConfig = defaultConfig
