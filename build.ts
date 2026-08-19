import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  splitting: true,
  minify: true,
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

// The CLI the `bin` field points at. Nothing built it, so `dist/bin/cli.js`
// has never existed and every install logged a failed bin link — the command
// was declared and unavailable. Built separately so it lands under dist/bin/,
// which is where the manifest already looks for it.
await Bun.build({
  minify: true,
  entrypoints: ['bin/cli.ts'],
  outdir: './dist/bin',
  target: 'bun',
})
