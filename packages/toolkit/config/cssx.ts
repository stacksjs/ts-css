import type { CssOptions } from '../src/engine/types'

const config: CssOptions = {
  content: ['./example/**/*.html'],
  output: './example/output.css',
  minify: false,
}

export default config
