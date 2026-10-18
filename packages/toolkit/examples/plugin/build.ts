import { plugin } from '@stacksjs/ts-css/engine'

// Build with the ts-css plugin
// The plugin will automatically process HTML files that are imported in your TypeScript/JavaScript code
const result = await Bun.build({
  entrypoints: ['./src/index.ts'], // Your TS entrypoint that imports HTML files
  outdir: './dist',
  plugins: [
    plugin({
      // Optional: provide custom config
      config: {
        minify: true,
        theme: {
          colors: {
            primary: '#3b82f6',
            secondary: '#10b981',
          },
        },
      },
      // Optional: include preflight CSS
      includePreflight: true,
    }),
  ],
})

if (result.success) {
  console.log('Build complete!')
  console.log(`Generated ${result.outputs.length} output(s)`)
}
else {
  console.error('Build failed:', result.logs)
}
