#!/usr/bin/env bun
/**
 * ts-css CLI — minify, parse, or round-trip CSS files.
 */

import { CLI } from '@stacksjs/clapp'
import { readFileSync } from 'node:fs'
import { minify } from '../src/optimize'
import { generate, parse } from '../src/parse'
import { version } from '../package.json'

const cli = new CLI('ts-css')

cli
  .command('minify <file>', 'Minify a CSS file')
  .option('--no-comments', 'Strip /*!*/ comments too')
  .option('--block', 'Treat input as a declarationList (style="…" body)')
  .action(async (file: string, opts: { comments: boolean, block: boolean }) => {
    const css = readFileSync(file, 'utf8')
    const result = minify(css, {
      comments: opts.comments === false ? false : 'exclamation',
    })
    process.stdout.write(result.css)
  })

cli
  .command('parse <file>', 'Parse a CSS file and print its AST as JSON')
  .option('--positions', 'Include source locations on every node')
  .action(async (file: string, opts: { positions: boolean }) => {
    const css = readFileSync(file, 'utf8')
    const ast = parse(css, { positions: opts.positions })
    process.stdout.write(JSON.stringify(ast, null, 2))
  })

cli
  .command('format <file>', 'Round-trip CSS through parser/generator (deterministic single-line output)')
  .action(async (file: string) => {
    const css = readFileSync(file, 'utf8')
    const ast = parse(css)
    process.stdout.write(generate(ast))
  })

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
