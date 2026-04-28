import type { CSSConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: CSSConfig = {
  floatPrecision: 3,
  verbose: false,
}

let _config: CSSConfig | null = null

export async function getConfig(): Promise<CSSConfig> {
  if (!_config) {
    _config = await loadConfig({
      name: 'css',
      defaultConfig,
    })
  }
  return _config
}

export const config: CSSConfig = defaultConfig
