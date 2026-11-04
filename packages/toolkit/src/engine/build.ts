import type { CssConfig } from './types'
import { CSSGenerator } from './generator'
import { resolveSafelist } from './safelist'
import { Scanner } from './scanner'
import { containsApply, processStylesheet } from './stylesheet'
import { collectStyles } from './style/collect'
import { resetStyles } from './style/registry'
import { CompileClassTransformer } from './transformer-compile-class'

export interface BuildResult {
  css: string
  classes: Set<string>
  duration: number
  compiledClasses?: Map<string, { className: string, utilities: string[] }>
  transformedFiles?: Map<string, string>
  /** Content patterns that matched no files (likely config typos). */
  unmatchedPatterns?: string[]
  /** Absolute paths of the `css.create()` modules that were evaluated. */
  styleModules?: string[]
}

/**
 * Build CSS from content patterns
*/
export async function build(config: CssConfig): Promise<BuildResult> {
  const startTime = performance.now()

  // Initialize compile class transformer if enabled
  const transformer = config.compileClass?.enabled
    ? new CompileClassTransformer({
      trigger: config.compileClass.trigger,
      classPrefix: config.compileClass.classPrefix,
      layer: config.compileClass.layer,
    })
    : null

  // Scan files for utility classes
  const scanner = new Scanner(config.content, transformer, {
    attributify: config.attributify,
    bracketSyntax: config.bracketSyntax,
    codeStrings: config.codeStrings,
  })
  const { classes, transformedFiles, unmatchedPatterns } = await scanner.scan()

  // Patterns filter what the scanner found, so this runs after the scan.
  for (const cls of resolveSafelist(config.safelist, classes))
    classes.add(cls)

  // Generate CSS
  const generator = new CSSGenerator(config)

  for (const className of classes) {
    generator.generate(className)
  }

  // Compiled class groups (:tc: markers) emit under their own hashed
  // selector. Previously the group's utilities were dumped into the main
  // class set instead — but the transformer had just REMOVED those class
  // names from the markup, so the rewritten `class="tc-<hash>"` matched
  // nothing and elements rendered unstyled.
  if (transformer) {
    const compiledClasses = transformer.getCompiledClasses()
    for (const [, { className, utilities }] of compiledClasses) {
      generator.generateCompiledClass(className, utilities)
    }
  }

  // A preflight is shipped verbatim, so an `@apply` in one reaches the
  // browser as an unknown at-rule and is dropped there without a word. Say so
  // rather than leaving the author to find it in devtools.
  if (config.includePreflight !== false) {
    for (const preflight of config.preflights) {
      if (containsApply(preflight.getCSS())) {
        console.warn('⚠️  @apply in a preflight is not expanded and will not reach the browser. Put the CSS in the `input` stylesheet instead.')
        break
      }
    }
  }

  // Preflight CSS is now added by generator.toCSS()
  let css = generator.toCSS(config.includePreflight !== false, config.minify)

  // The authored stylesheet goes after the utilities, so a rule written by
  // hand beats a utility of equal specificity -- which is the reason to have
  // written it there.
  if (config.input) {
    const source = await Bun.file(config.input).text()
    const processed = processStylesheet(source, generator, config.theme)
    for (const utility of processed.unknownUtilities)
      console.warn(`⚠️  @apply ${utility}: not a utility this config generates (${config.input})`)
    for (const path of processed.unknownThemePaths)
      console.warn(`⚠️  theme(${path}): no such value in the theme (${config.input})`)
    css += `\n${processed.css}`
  }

  // Styles declared through the `css.create()` API live in modules, not in
  // class attributes, so the scanner never sees them. Evaluating those modules
  // registers their atomic rules; append the result after the utilities so a
  // style object wins over a utility of equal specificity.
  let styleModules: string[] | undefined
  if (config.styles && config.styles.length > 0) {
    // Reset first so a rebuild reflects the current source exactly. Without it
    // a watch session would keep emitting rules for declarations the author
    // has since deleted.
    resetStyles()
    const collected = await collectStyles(config.styles, { minify: config.minify })
    styleModules = collected.modules
    if (collected.css)
      css += (config.minify ? '' : '\n') + collected.css
    unmatchedPatterns.push(...collected.unmatchedPatterns)
  }

  const duration = performance.now() - startTime

  return {
    css,
    classes,
    duration,
    compiledClasses: transformer?.getCompiledClasses(),
    transformedFiles,
    unmatchedPatterns,
    styleModules,
  }
}

/**
 * Write CSS to output file
*/
export async function writeCSS(css: string, outputPath: string): Promise<void> {
  await Bun.write(outputPath, css)
}

/**
 * Write transformed files to disk
*/
export async function writeTransformedFiles(transformedFiles: Map<string, string>): Promise<void> {
  const writes = Array.from(transformedFiles.entries()).map(([path, content]) =>
    Bun.write(path, content),
  )
  await Promise.all(writes)
}

/**
 * Build and write CSS to output file
*/
export async function buildAndWrite(config: CssConfig): Promise<BuildResult> {
  const result = await build(config)
  await writeCSS(result.css, config.output)

  // Write transformed files if compile class is enabled
  if (result.transformedFiles && result.transformedFiles.size > 0) {
    await writeTransformedFiles(result.transformedFiles)
  }

  return result
}
