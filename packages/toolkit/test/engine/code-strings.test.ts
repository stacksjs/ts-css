import { describe, expect, it } from 'bun:test'
import { extractClasses } from '../../src/engine/parser'

/**
 * Extraction from string literals in code.
 *
 * Utility classes routinely live in code rather than markup — a helper that
 * returns a class string, an icon keyed by status, a signal holding the current
 * variant. Attribute-scoped extraction cannot see any of it, so those classes
 * silently never generate and the element renders unstyled with no error.
 *
 * The quiet failure is what makes it worth testing hard: nothing about the
 * build looks wrong, so projects work around it instead of reporting it.
 */
describe('code-string extraction', () => {
  it('takes classes out of a helper that returns a class string', () => {
    const source = `
      const buttonClass = (active) => active
        ? 'bg-blue-500 text-white ring-2 ring-blue-500/30'
        : 'bg-white text-stone-600 hover:bg-stone-50'
    `
    const classes = extractClasses(source)

    expect(classes.has('bg-blue-500')).toBe(true)
    expect(classes.has('ring-blue-500/30')).toBe(true)
    expect(classes.has('hover:bg-stone-50')).toBe(true)
    expect(classes.has('text-stone-600')).toBe(true)
  })

  it('takes classes out of a lookup table', () => {
    const source = `
      const toastIcon = {
        success: 'i-hugeicons-checkmark-circle-02 text-green-500 dark:text-green-400',
        error: 'i-hugeicons-alert-02 text-red-500',
      }
    `
    const classes = extractClasses(source)

    expect(classes.has('i-hugeicons-checkmark-circle-02')).toBe(true)
    expect(classes.has('dark:text-green-400')).toBe(true)
    expect(classes.has('i-hugeicons-alert-02')).toBe(true)
  })

  it('reads template literals and skips their interpolations', () => {
    const source = 'const cls = `flex-shrink-0 h-5 w-5 ${variant.icon} mt-0.5`'
    const classes = extractClasses(source)

    expect(classes.has('flex-shrink-0')).toBe(true)
    expect(classes.has('mt-0.5')).toBe(true)
    // The hole is code, not a class name.
    expect(classes.has('variant.icon')).toBe(false)
    expect(classes.has('${variant.icon}')).toBe(false)
  })

  it('keeps arbitrary values intact', () => {
    const source = `const cls = 'text-[13px] bg-[#f7f5f1] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'`
    const classes = extractClasses(source)

    expect(classes.has('text-[13px]')).toBe(true)
    expect(classes.has('bg-[#f7f5f1]')).toBe(true)
    expect(classes.has('shadow-[0_1px_2px_rgba(0,0,0,0.08)]')).toBe(true)
  })

  /**
   * The reason code strings are held to a stricter standard than attributes.
   * In `class="block"` the author is naming a class. In `status === 'block'`
   * they are not, and emitting `display: block` for it is CSS nobody asked for.
   * The offenders are exactly the short words that appear most in code.
   */
  it('does not take bare words from code', () => {
    const source = `
      const state = 'hidden'
      const layout = 'grid'
      const position = 'fixed'
      const kind = 'table'
      // Note: this block is intentionally static.
    `
    const classes = extractClasses(source)

    for (const word of ['hidden', 'grid', 'fixed', 'table', 'static', 'block'])
      expect(classes.has(word)).toBe(false)
  })

  it('still takes bare words from a class attribute', () => {
    // The stricter rule applies only to code strings — markup is unambiguous.
    const classes = extractClasses('<div class="grid hidden"></div>')

    expect(classes.has('grid')).toBe(true)
    expect(classes.has('hidden')).toBe(true)
  })

  /**
   * An apostrophe in a comment opens a quote span that, read naively, swallows
   * the rest of the file — and with it every real string literal after it.
   * Single-quoted literals stop at end of line, exactly as they do in
   * JavaScript, so the damage cannot cross a line.
   */
  it('does not let an apostrophe in prose swallow the file', () => {
    const source = [
      `// don't let this run away`,
      `const cls = 'bg-emerald-500 rounded-xl'`,
    ].join('\n')
    const classes = extractClasses(source)

    expect(classes.has('bg-emerald-500')).toBe(true)
    expect(classes.has('rounded-xl')).toBe(true)
  })

  it('handles escaped quotes inside a literal', () => {
    const source = `const cls = 'text-sm before:content-[\\'—\\'] font-medium'`
    const classes = extractClasses(source)

    expect(classes.has('text-sm')).toBe(true)
    expect(classes.has('font-medium')).toBe(true)
  })

  it('can be switched off', () => {
    const source = `const cls = 'bg-blue-500'`

    expect(extractClasses(source).has('bg-blue-500')).toBe(true)
    expect(extractClasses(source, { codeStrings: { enabled: false } }).has('bg-blue-500')).toBe(false)
  })

  it('does not disturb attribute extraction', () => {
    const markup = `<div class="flex items-center gap-2" :class="open ? 'bg-white' : 'bg-black'"></div>`
    const classes = extractClasses(markup)

    expect(classes.has('flex')).toBe(true)
    expect(classes.has('items-center')).toBe(true)
    expect(classes.has('gap-2')).toBe(true)
    expect(classes.has('bg-white')).toBe(true)
    expect(classes.has('bg-black')).toBe(true)
  })

  it('does not treat unrelated markup attributes as code strings', () => {
    const markup = `
      <form>
        <input type="hidden" name="_token" value="test-csrf-token">
        <div data-state="bg-blue-500" v-html="'<strong>Bold text</strong>'"></div>
      </form>
    `
    const classes = extractClasses(markup)

    expect(classes.has('test-csrf-token')).toBe(false)
    expect(classes.has('bg-blue-500')).toBe(false)
    expect(classes.has('<strong>Bold')).toBe(false)
  })

  it('keeps extracting utility strings from code beside markup', () => {
    const source = `
      const token = 'test-csrf-token'
      const classes = 'bg-blue-500 text-white'
      const view = <input value="test-csrf-token" className={\`px-4 \${classes}\`} />
    `
    const classes = extractClasses(source)

    expect(classes.has('test-csrf-token')).toBe(true)
    expect(classes.has('bg-blue-500')).toBe(true)
    expect(classes.has('text-white')).toBe(true)
    expect(classes.has('px-4')).toBe(true)
  })
})

// Comments and regex literals used to be read as code: a backtick in a doc
// comment opened a multi-line "template", a quote inside a regex opened a
// "string", and every literal after that was read inside out. A page that
// inlines a bundled library before its own script lost every class its own
// code named.
describe('code-string extraction past comments and regexes', () => {
  it('keeps quote tracking straight after a backtick in a comment', () => {
    const source = `
      /** Returns \`null\` when there is nothing to show. */
      function pick() { return null }
      const ICONS = { slack: "i-hugeicons-slack", discord: "i-hugeicons-discord" }
    `
    const classes = extractClasses(source)
    expect(classes.has('i-hugeicons-slack')).toBe(true)
    expect(classes.has('i-hugeicons-discord')).toBe(true)
  })

  it('keeps quote tracking straight after a regex holding quotes', () => {
    const source = `
      const escape = s => s.replace(/[&<>"']/g, c => map[c])
      const tone = 'text-rose-600 ring-1'
    `
    const classes = extractClasses(source)
    expect(classes.has('text-rose-600')).toBe(true)
    expect(classes.has('ring-1')).toBe(true)
  })

  it('ignores classes that only appear in comments', () => {
    const classes = extractClasses(`// use 'bg-red-500' here\nconst a = 'px-4 py-2'`)
    expect(classes.has('bg-red-500')).toBe(false)
    expect(classes.has('px-4')).toBe(true)
  })

  it('still reads division as division', () => {
    const classes = extractClasses(`const half = total / 2; const c = 'gap-3 mt-2'; const r = a / b`)
    expect(classes.has('gap-3')).toBe(true)
  })
})
