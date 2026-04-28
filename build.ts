import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: [
    'src/index.ts',
    'src/parse/index.ts',
    'src/what/index.ts',
    'src/select/index.ts',
    'src/optimize/index.ts',
  ],
  outdir: './dist',
  target: 'bun',
  plugins: [dts()],
})
