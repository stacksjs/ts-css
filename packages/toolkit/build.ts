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
    // The utility engine, exposed at `@stacksjs/ts-css/engine`.
    'src/engine/index.ts',
  ],
  outdir: './dist',
  target: 'bun',
  // The library's dependencies stay dependencies. Inlining them put bunfig's
  // logger, with its module-scope `await` and `import.meta.require`, inside
  // every entry - including `./engine`, which editors bundle into a Node
  // extension host that cannot parse either. bunfig is also loaded lazily
  // (see engine/config.ts), so a consumer that never loads a config file can
  // leave it out of its bundle altogether.
  external: ['bunfig', '@stacksjs/clapp'],
  plugins: [dts()],
})

// The CLI the `bin` field points at. Nothing built it, so `dist/bin/cli.js`
// has never existed and every install logged a failed bin link — the command
// was declared and unavailable. Built separately so it lands under dist/bin/,
// which is where the manifest already looks for it.
await Bun.build({
  minify: true,
  entrypoints: ['bin/cli.ts', 'bin/cssx.ts'],
  outdir: './dist/bin',
  target: 'bun',
})
