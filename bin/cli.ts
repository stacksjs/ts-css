#!/usr/bin/env bun
/**
 * ts-css CLI — minify, parse, or round-trip CSS files.
 */

import { CLI } from '@stacksjs/clapp'
import { existsSync, readFileSync } from 'node:fs'
import { minify, minifyBlock } from '../src/optimize'
import { generate, parse } from '../src/parse'
import { version } from '../package.json'

function readSourceOrExit(file: string): string {
  if (!existsSync(file)) {
    process.stderr.write(`ts-css: file not found: ${file}\n`)
    process.exit(1)
  }
  return readFileSync(file, 'utf8')
}

const cli = new CLI('ts-css')

cli
  .command('minify <file>', 'Minify a CSS file')
  .option('--no-comments', 'Strip /*!*/ comments too')
  .option('--block', 'Treat input as a declarationList (style="…" body)')
  .action(async (file: string, opts: { comments: boolean, block: boolean }) => {
    const css = readSourceOrExit(file)
    const minOptions = { comments: opts.comments === false ? false : ('exclamation' as const) }
    const result = opts.block
      ? minifyBlock(css, minOptions)
      : minify(css, minOptions)
    process.stdout.write(result.css)
  })

cli
  .command('parse <file>', 'Parse a CSS file and print its AST as JSON')
  .option('--positions', 'Include source locations on every node')
  .action(async (file: string, opts: { positions: boolean }) => {
    const css = readSourceOrExit(file)
    const ast = parse(css, { positions: opts.positions })
    process.stdout.write(JSON.stringify(ast, null, 2))
  })

cli
  .command('format <file>', 'Round-trip CSS through parser/generator (deterministic single-line output)')
  .action(async (file: string) => {
    const css = readSourceOrExit(file)
    const ast = parse(css)
    process.stdout.write(generate(ast))
  })

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
