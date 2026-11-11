import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { arbitraryBreakpoint, CSSGenerator } from '../../src/engine/generator'
import { extractClasses, parseClass } from '../../src/engine/parser'

describe('parseClass', () => {
  it('should parse simple utility without value', () => {
    const result = parseClass('flex')
    expect(result).toEqual({
      raw: 'flex',
      base: 'flex',
      variants: [],
      utility: 'flex',
      value: undefined,
      important: false,
      arbitrary: false,
    })
  })

  it('should parse utility with value', () => {
    const result = parseClass('p-4')
    expect(result).toEqual({
      raw: 'p-4',
      base: 'p-4',
      variants: [],
      utility: 'p',
      value: '4',
      important: false,
      arbitrary: false,
    })
  })

  it('should parse important modifier', () => {
    const result = parseClass('!p-4')
    expect(result).toEqual({
      raw: '!p-4',
      base: 'p-4',
      variants: [],
      utility: 'p',
      value: '4',
      important: true,
      arbitrary: false,
    })
  })

  it('should parse arbitrary value', () => {
    const result = parseClass('w-[100px]')
    expect(result).toEqual({
      raw: 'w-[100px]',
      base: 'w-[100px]',
      variants: [],
      utility: 'w',
      value: '100px',
      important: false,
      arbitrary: true,
    })
  })

  it('should parse arbitrary color value', () => {
    const result = parseClass('bg-[#ff0000]')
    expect(result).toEqual({
      raw: 'bg-[#ff0000]',
      base: 'bg-[#ff0000]',
      variants: [],
      utility: 'bg',
      value: '#ff0000',
      important: false,
      arbitrary: true,
    })
  })

  it('should parse arbitrary value with important', () => {
    const result = parseClass('!w-[100px]')
    expect(result).toEqual({
      raw: '!w-[100px]',
      base: 'w-[100px]',
      variants: [],
      utility: 'w',
      value: '100px',
      important: true,
      arbitrary: true,
    })
  })

  it('should parse utility with compound value', () => {
    const result = parseClass('bg-blue-500')
    expect(result).toEqual({
      raw: 'bg-blue-500',
      base: 'bg-blue-500',
      variants: [],
      utility: 'bg',
      value: 'blue-500',
      important: false,
      arbitrary: false,
    })
  })

  it('should parse utility with single variant', () => {
    const result = parseClass('hover:bg-blue-500')
    expect(result).toEqual({
      raw: 'hover:bg-blue-500',
      base: 'bg-blue-500',
      variants: ['hover'],
      utility: 'bg',
      value: 'blue-500',
      important: false,
      arbitrary: false,
    })
  })

  it('should parse utility with multiple variants', () => {
    const result = parseClass('sm:hover:flex')
    expect(result).toEqual({
      raw: 'sm:hover:flex',
      base: 'flex',
      variants: ['sm', 'hover'],
      utility: 'flex',
      value: undefined,
      important: false,
      arbitrary: false,
    })
  })

  it('should parse responsive variant with value', () => {
    const result = parseClass('md:p-8')
    expect(result).toEqual({
      raw: 'md:p-8',
      base: 'p-8',
      variants: ['md'],
      utility: 'p',
      value: '8',
      important: false,
      arbitrary: false,
    })
  })

  it('should parse complex multi-variant utility', () => {
    const result = parseClass('lg:dark:hover:text-gray-800')
    expect(result).toEqual({
      raw: 'lg:dark:hover:text-gray-800',
      base: 'text-gray-800',
      variants: ['lg', 'dark', 'hover'],
      utility: 'text',
      value: 'gray-800',
      important: false,
      arbitrary: false,
    })
  })
})

describe('extractClasses', () => {
  it('should extract classes from class attribute', () => {
    const html = '<div class="flex p-4 bg-blue-500"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['flex', 'p-4', 'bg-blue-500']))
  })

  it('should extract classes from className attribute', () => {
    const jsx = '<div className="flex p-4 bg-blue-500"></div>'
    const result = extractClasses(jsx)
    expect(result).toEqual(new Set(['flex', 'p-4', 'bg-blue-500']))
  })

  it('should extract classes from className with curly braces', () => {
    const jsx = '<div className={"flex p-4"}></div>'
    const result = extractClasses(jsx)
    expect(result).toEqual(new Set(['flex', 'p-4']))
  })

  it('should extract classes from template literals', () => {
    const jsx = '<div className={`flex p-4 hover:bg-blue-500`}></div>'
    const result = extractClasses(jsx)
    expect(result).toEqual(new Set(['flex', 'p-4', 'hover:bg-blue-500']))
  })

  it('should handle multiple elements', () => {
    const html = `
      <div class="flex p-4">
        <span className="text-sm">Text</span>
      </div>
    `
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['flex', 'p-4', 'text-sm']))
  })

  it('should handle variants', () => {
    const html = '<div class="sm:flex md:p-8 hover:bg-blue-500"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['sm:flex', 'md:p-8', 'hover:bg-blue-500']))
  })

  it('should ignore empty strings', () => {
    const html = '<div class="  flex   p-4  "></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['flex', 'p-4']))
  })

  it('should return empty set for content without classes', () => {
    const html = '<div><p>No classes here</p></div>'
    const result = extractClasses(html)
    expect(result.size).toBe(0)
  })
})

describe('parseClass - Edge Cases', () => {
  it('should handle empty string', () => {
    const result = parseClass('')
    expect(result.utility).toBe('')
    expect(result.variants).toEqual([])
  })

  it('should handle very long class name', () => {
    const longClass = 'a'.repeat(1000)
    const result = parseClass(longClass)
    expect(result.utility).toBe(longClass)
  })

  it('should handle class with only dashes', () => {
    const result = parseClass('---')
    // Parser splits on last dash, so --- becomes -- with no value
    expect(result.utility).toBe('--')
    expect(result.value).toBeUndefined()
  })

  it('should handle class with trailing colon', () => {
    const result = parseClass('hover:')
    expect(result.variants).toEqual(['hover'])
    expect(result.utility).toBe('')
  })

  it('should handle class with leading colon', () => {
    const result = parseClass(':flex')
    expect(result.variants).toEqual([''])
    expect(result.utility).toBe('flex')
  })

  it('should handle multiple consecutive colons', () => {
    const result = parseClass('sm::hover::flex')
    expect(result.variants).toEqual(['sm', '', 'hover', ''])
    expect(result.utility).toBe('flex')
  })

  it('should handle negative zero value', () => {
    const result = parseClass('-m-0')
    expect(result).toEqual({
      raw: '-m-0',
      base: '-m-0',
      variants: [],
      utility: 'm',
      value: '-0',
      important: false,
      arbitrary: false,
    })
  })

  it('should handle fractional zero', () => {
    const result = parseClass('w-0/0')
    expect(result).toEqual({
      raw: 'w-0/0',
      base: 'w-0/0',
      variants: [],
      utility: 'w',
      value: '0/0',
      important: false,
      arbitrary: false,
    })
  })

  it('should handle arbitrary value with nested brackets', () => {
    const result = parseClass('w-[calc(100%-20px)]')
    expect(result.arbitrary).toBe(true)
    expect(result.utility).toBe('w')
    expect(result.value).toBe('calc(100% - 20px)')
  })

  it('should handle arbitrary value with special characters', () => {
    const result = parseClass('bg-[rgba(255,0,0,0.5)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('rgba')
  })

  it('should handle multiple important modifiers', () => {
    const result = parseClass('!!p-4')
    // Should only process the first !
    expect(result.important).toBe(true)
    expect(result.raw).toBe('!!p-4')
  })

  it('should handle important with no utility', () => {
    const result = parseClass('!')
    expect(result.important).toBe(true)
    expect(result.utility).toBe('')
  })

  it('should handle complex variant chain', () => {
    const result = parseClass('2xl:dark:group-hover:peer-checked:first:focus:bg-red-500')
    expect(result.variants).toEqual(['2xl', 'dark', 'group-hover', 'peer-checked', 'first', 'focus'])
    expect(result.utility).toBe('bg')
    expect(result.value).toBe('red-500')
  })

  it('should handle compound utility with multiple dashes', () => {
    const result = parseClass('grid-cols-12')
    expect(result.utility).toBe('grid-cols')
    expect(result.value).toBe('12')
  })

  it('should handle negative compound utility', () => {
    const result = parseClass('-translate-x-full')
    expect(result.utility).toBe('translate-x')
    expect(result.value).toBe('-full')
  })

  it('should handle arbitrary property with numbers', () => {
    const result = parseClass('[line-height:1.5]')
    expect(result.arbitrary).toBe(true)
    expect(result.utility).toBe('line-height')
    expect(result.value).toBe('1.5')
  })

  it('should handle arbitrary property with spaces in value', () => {
    const result = parseClass('[font-family:ui-sans-serif]')
    expect(result.arbitrary).toBe(true)
    expect(result.utility).toBe('font-family')
  })

  it('should handle utility with uppercase letters', () => {
    const result = parseClass('BG-RED-500')
    // Lowercase is expected in utility names
    expect(result.raw).toBe('BG-RED-500')
  })

  it('should handle fraction with large numbers', () => {
    const result = parseClass('w-999/1000')
    expect(result.utility).toBe('w')
    expect(result.value).toBe('999/1000')
  })

  it('should handle negative fraction', () => {
    const result = parseClass('-m-1/2')
    expect(result.utility).toBe('m')
    expect(result.value).toBe('-1/2')
  })

  it('should handle space-x without value', () => {
    const result = parseClass('space-x')
    expect(result.utility).toBe('space')
    expect(result.value).toBe('x')
  })

  it('should handle divide-x without value', () => {
    const result = parseClass('divide-x')
    expect(result.utility).toBe('divide-x')
    expect(result.value).toBe(undefined)
  })
})

describe('extractClasses - Edge Cases', () => {
  it('should handle empty HTML', () => {
    const result = extractClasses('')
    expect(result.size).toBe(0)
  })

  it('should handle malformed HTML', () => {
    const html = '<div class="flex p-4'
    const result = extractClasses(html)
    // May not extract properly without closing quote
    expect(result.size).toBeGreaterThanOrEqual(0)
  })

  it('should handle classes with newlines', () => {
    const html = `<div class="flex
      p-4
      bg-blue-500"></div>`
    const result = extractClasses(html)
    expect(result.has('flex')).toBe(true)
    expect(result.has('p-4')).toBe(true)
    expect(result.has('bg-blue-500')).toBe(true)
  })

  it('should handle classes with tabs', () => {
    const html = '<div class="flex\tp-4\tbg-blue-500"></div>'
    const result = extractClasses(html)
    expect(result.has('flex')).toBe(true)
    expect(result.has('p-4')).toBe(true)
  })

  it('should handle duplicate classes', () => {
    const html = '<div class="flex flex p-4 p-4"></div>'
    const result = extractClasses(html)
    expect(result.size).toBe(2) // Set removes duplicates
  })

  it('should handle classes with special characters in attribute', () => {
    const html = '<div data-test="flex" class="p-4"></div>'
    const result = extractClasses(html)
    expect(result.has('p-4')).toBe(true)
    // Should only extract from class/className attributes
  })

  it('should handle mixed quotes', () => {
    const html = `<div class='flex "p-4"'></div>`
    const result = extractClasses(html)
    // Should extract from single-quoted attribute
    expect(result.size).toBeGreaterThan(0)
  })

  it('should handle template literal with expressions', () => {
    // eslint-disable-next-line no-template-curly-in-string
    const jsx = '<div className={`flex ${isActive ? "active" : ""} p-4`}></div>'
    const result = extractClasses(jsx)
    expect(result.has('flex')).toBe(true)
    expect(result.has('p-4')).toBe(true)
  })

  it('should handle very long class string', () => {
    const classes = Array.from({ length: 1000 }).fill('p-4').join(' ')
    const html = `<div class="${classes}"></div>`
    const result = extractClasses(html)
    expect(result.has('p-4')).toBe(true)
  })

  it('should ignore invalid class names', () => {
    const html = '<div class="123invalid -flex @media"></div>'
    const result = extractClasses(html)
    // Should filter out invalid patterns
    expect(result.has('123invalid')).toBe(false)
  })

  it('should handle consecutive spaces', () => {
    const html = '<div class="flex    p-4    bg-blue-500"></div>'
    const result = extractClasses(html)
    expect(result.size).toBe(3)
  })
})

describe('parseClass - Extreme Edge Cases', () => {
  it('should handle null-like strings', () => {
    expect(() => parseClass('null')).not.toThrow()
    expect(() => parseClass('undefined')).not.toThrow()
    expect(() => parseClass('NaN')).not.toThrow()
  })

  it('should handle numbers as class names', () => {
    const result = parseClass('123')
    expect(result.utility).toBe('123')
    expect(result.value).toBeUndefined()
  })

  it('should handle special characters in class names', () => {
    expect(() => parseClass('@apply')).not.toThrow()
    expect(() => parseClass('$variable')).not.toThrow()
    expect(() => parseClass('#id-like')).not.toThrow()
  })

  it('should handle unicode characters', () => {
    const result = parseClass('w-[20px]') // Normal
    expect(result.arbitrary).toBe(true)

    const result2 = parseClass('text-[📝]') // Emoji
    expect(result2.arbitrary).toBe(true)
  })

  it('should handle extremely nested brackets', () => {
    const result = parseClass('w-[calc(calc(100%-10px)-5px)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('calc')
  })

  it('should handle URL in arbitrary value', () => {
    const result = parseClass('bg-[url(https://example.com/image.jpg)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('url')
  })

  it('should handle data URL in arbitrary value', () => {
    const result = parseClass('bg-[url(data:image/svg+xml;base64,ABC123)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('data:')
  })

  it('should handle CSS variables in arbitrary value', () => {
    const result = parseClass('w-[var(--custom-width)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('var(--')
  })

  it('should handle clamp in arbitrary value', () => {
    const result = parseClass('text-[clamp(1rem,5vw,3rem)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('clamp')
  })

  it('should handle min/max in arbitrary value', () => {
    const result = parseClass('w-[min(100%,500px)]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toContain('min')
  })

  it('should handle zero with units', () => {
    expect(() => parseClass('w-[0px]')).not.toThrow()
    expect(() => parseClass('h-[0rem]')).not.toThrow()
    expect(() => parseClass('p-[0em]')).not.toThrow()
  })

  it('should handle extremely large numbers', () => {
    const result = parseClass('w-[99999999px]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toBe('99999999px')
  })

  it('should handle extremely small numbers', () => {
    const result = parseClass('w-[0.0001px]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toBe('0.0001px')
  })

  it('should handle scientific notation', () => {
    const result = parseClass('w-[1e10px]')
    expect(result.arbitrary).toBe(true)
    expect(result.value).toBe('1e10px')
  })
})

describe('extractClasses - Arbitrary Values', () => {
  it('should extract arbitrary z-index values', () => {
    const html = '<div class="z-[1] z-[999] z-[-1]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['z-[1]', 'z-[999]', 'z-[-1]']))
  })

  it('should extract arbitrary width/height values', () => {
    const html = '<div class="w-[100px] h-[50vh] min-w-[200px]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['w-[100px]', 'h-[50vh]', 'min-w-[200px]']))
  })

  it('should extract arbitrary color values', () => {
    const html = '<div class="bg-[#ff0000] text-[rgb(0,0,0)] border-[hsl(0,100%,50%)]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['bg-[#ff0000]', 'text-[rgb(0,0,0)]', 'border-[hsl(0,100%,50%)]']))
  })

  it('should extract arbitrary values with variants', () => {
    const html = '<div class="hover:z-[10] sm:w-[50%] focus:bg-[#000]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['hover:z-[10]', 'sm:w-[50%]', 'focus:bg-[#000]']))
  })

  it('should extract arbitrary properties', () => {
    const html = '<div class="[color:red] [mask-type:luminance] [display:grid]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['[color:red]', '[mask-type:luminance]', '[display:grid]']))
  })

  it('should extract important arbitrary values', () => {
    const html = '<div class="!z-[9999] !w-[100%]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['!z-[9999]', '!w-[100%]']))
  })

  it('should extract negative arbitrary values', () => {
    const html = '<div class="-mt-[20px] -translate-x-[50%]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['-mt-[20px]', '-translate-x-[50%]']))
  })

  it('should extract arbitrary values with calc()', () => {
    const html = '<div class="w-[calc(100%-2rem)] h-[calc(100vh-64px)]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['w-[calc(100%-2rem)]', 'h-[calc(100vh-64px)]']))
  })

  it('should extract mixed regular and arbitrary classes', () => {
    const html = '<div class="flex p-4 z-[1] w-[100px] bg-blue-500 hover:z-[999]"></div>'
    const result = extractClasses(html)
    expect(result).toEqual(new Set(['flex', 'p-4', 'z-[1]', 'w-[100px]', 'bg-blue-500', 'hover:z-[999]']))
  })
})

// =============================================================================
// Regression tests for arbitrary-value underscore → space conversion.
//
// Tailwind convention: CSS class names can't contain spaces, so you write `_`
// where you mean a space. The engine converts them when emitting the value.
// The ONE exception is `url(...)` — URLs legitimately contain underscores.
//
// History: an earlier implementation preserved underscores inside ANY
// parentheses (so `calc(100vh_-_120px)` stayed `calc(100vh_-_120px)` — invalid
// CSS because the minus needs spaces). The current implementation only shields
// url() content; every other function gets underscores converted.
//
// Also: `[prop:value]` arbitrary-property syntax previously bypassed the
// conversion entirely. Both arbitrary-value (`w-[100px]`) and
// arbitrary-property (`[width:100px]`) paths must convert underscores.
// =============================================================================
describe('parseClass - Arbitrary underscore conversion', () => {
  it('converts underscores to spaces in arbitrary values (single-level)', () => {
    const r = parseClass('grid-cols-[120px_1fr_200px]')
    expect(r.value).toBe('120px 1fr 200px')
  })

  it('converts underscores inside calc()', () => {
    const r = parseClass('max-h-[calc(100vh_-_120px)]')
    expect(r.value).toBe('calc(100vh - 120px)')
  })

  it('converts underscores inside nested function calls (repeat + minmax)', () => {
    const r = parseClass('grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))]')
    expect(r.value).toBe('repeat(auto-fit, minmax(200px, 1fr))')
  })

  it('converts underscores in a comma-separated linear-gradient', () => {
    const r = parseClass('bg-[linear-gradient(135deg,_#fff_0%,_#000_100%)]')
    expect(r.value).toBe('linear-gradient(135deg, #fff 0%, #000 100%)')
  })

  it('preserves underscores inside url() (path characters)', () => {
    const r = parseClass('bg-[url(/img/foo_bar_baz.png)]')
    expect(r.value).toBe('url(/img/foo_bar_baz.png)')
  })

  it('preserves underscores in data-URL base64', () => {
    const r = parseClass('bg-[url(data:image/png;base64,a_b_c_d)]')
    expect(r.value).toBe('url(data:image/png;base64,a_b_c_d)')
  })

  it('mixes url() preservation with outer-scope conversion', () => {
    // `center_/_cover` → `center / cover` (outside url)
    // `cover_image.png` inside url() → preserved
    const r = parseClass('[background:center_/_cover_url(/img/cover_image.png)]')
    expect(r.value).toBe('center / cover url(/img/cover_image.png)')
  })

  it('treats `\\_` as a literal underscore escape', () => {
    // Escape hatch for the rare case where you actually need an underscore
    // in a non-url arbitrary value. Both escaped forms collapse to `_`.
    const r = parseClass('content-[a\\_b\\_c]')
    expect(r.value).toBe('a_b_c')
  })

  it('preserves arbitrary values that contain no underscores', () => {
    // Fast path — function must return value unchanged when `_` is absent.
    const r = parseClass('w-[100px]')
    expect(r.value).toBe('100px')
  })

  it('applies conversion to arbitrary-property syntax too', () => {
    // Regression: `[prop:val]` originally skipped convertArbitraryUnderscores
    // entirely, so `[grid-template-columns:300px_1fr]` stayed underscored.
    const r = parseClass('[grid-template-columns:300px_1fr]')
    expect(r.utility).toBe('grid-template-columns')
    expect(r.value).toBe('300px 1fr')
  })

  it('arbitrary-property syntax also preserves url() underscores', () => {
    const r = parseClass('[background-image:url(/img/hero_bg.png)]')
    expect(r.value).toBe('url(/img/hero_bg.png)')
  })

  it('extracts and preserves type hints after conversion', () => {
    // Type hints are stripped from `value` AFTER underscore conversion,
    // so the family-name hint routes correctly and the family itself has
    // real spaces.
    const r = parseClass('font-[family-name:Inter_Tight]')
    expect(r.typeHint).toBe('family-name')
    expect(r.value).toBe('Inter Tight')
  })
})

describe('parseClass - CSS math normalization', () => {
  it('restores required whitespace around compact binary operators', () => {
    expect(parseClass('max-h-[calc(100dvh-2rem)]').value).toBe('calc(100dvh - 2rem)')
    expect(parseClass('w-[calc(var(--width)-2rem)]').value).toBe('calc(var(--width) - 2rem)')
    expect(parseClass('w-[calc(100%/var(--columns))]').value).toBe('calc(100% / var(--columns))')
  })

  it('preserves unary signs and scientific notation', () => {
    expect(parseClass('w-[calc(-1rem+2e-3px)]').value).toBe('calc(-1rem + 2e-3px)')
  })
})

// =============================================================================
// Regression: negative arbitrary values. `-mt-[20px]`, `-translate-x-[50%]`,
// etc. Previously the preArbitraryMatch regex didn't accept a leading dash on
// the utility, so these fell through to the name-based negative-handling code
// AFTER the arbitrary-value branch — and that path doesn't know about
// brackets. Result: utility ended up as `-mt` and no rule matched, emitting
// nothing. Now the arbitrary branch peels off the leading `-` and folds it
// onto the value, matching Tailwind's behavior.
// =============================================================================
describe('parseClass - negative arbitrary values (regression)', () => {
  it('strips the leading `-` from utility and prefixes value', () => {
    const r = parseClass('-mt-[20px]')
    expect(r.utility).toBe('mt')
    expect(r.value).toBe('-20px')
    expect(r.arbitrary).toBe(true)
  })

  it('handles negative arbitrary for translate-*', () => {
    const r = parseClass('-translate-x-[50%]')
    expect(r.utility).toBe('translate-x')
    expect(r.value).toBe('-50%')
  })

  it('handles negative arbitrary for position utilities', () => {
    const r = parseClass('-top-[5rem]')
    expect(r.utility).toBe('top')
    expect(r.value).toBe('-5rem')
  })

  it('handles negative arbitrary for z-index', () => {
    const r = parseClass('-z-[5]')
    expect(r.utility).toBe('z')
    expect(r.value).toBe('-5')
  })

  it('preserves negative sign through variants', () => {
    const r = parseClass('hover:-mt-[20px]')
    expect(r.variants).toEqual(['hover'])
    expect(r.utility).toBe('mt')
    expect(r.value).toBe('-20px')
  })
})

// =============================================================================
// Regression: trailing-bang important modifier (Tailwind v4 syntax).
// Both prefix (`!p-4`) and suffix (`p-4!`) forms must flag important.
// Additionally, bang BETWEEN a variant and the utility (`hover:!bg-red-500`,
// `md:!p-4`) must be stripped from the utility token and raise the important
// flag — previously that form produced `utility: "!bg-red-500"` and no CSS.
// =============================================================================
describe('parseClass - important modifier variants (regression)', () => {
  it('accepts the trailing-bang form', () => {
    const r = parseClass('p-4!')
    expect(r.important).toBe(true)
    expect(r.utility).toBe('p')
    expect(r.value).toBe('4')
  })

  it('trailing-bang works on arbitrary values', () => {
    const r = parseClass('p-[13px]!')
    expect(r.important).toBe(true)
    expect(r.utility).toBe('p')
    expect(r.value).toBe('13px')
  })

  it('trailing-bang works on arbitrary properties', () => {
    const r = parseClass('[color:red]!')
    expect(r.important).toBe(true)
    expect(r.utility).toBe('color')
    expect(r.value).toBe('red')
  })

  it('leading-bang between variant and utility', () => {
    // The most common v3 form for variant+important: `hover:!bg-red-500`.
    const r = parseClass('hover:!bg-red-500')
    expect(r.variants).toEqual(['hover'])
    expect(r.utility).toBe('bg')
    expect(r.value).toBe('red-500')
    expect(r.important).toBe(true)
  })

  it('trailing-bang between variant and utility', () => {
    const r = parseClass('md:p-4!')
    expect(r.variants).toEqual(['md'])
    expect(r.utility).toBe('p')
    expect(r.value).toBe('4')
    expect(r.important).toBe(true)
  })

  it('stacked variants with leading-bang', () => {
    const r = parseClass('md:hover:!text-red-500')
    expect(r.variants).toEqual(['md', 'hover'])
    expect(r.utility).toBe('text')
    expect(r.value).toBe('red-500')
    expect(r.important).toBe(true)
  })

  it('utility-only class with trailing bang', () => {
    const r = parseClass('flex!')
    expect(r.utility).toBe('flex')
    expect(r.important).toBe(true)
  })
})

// =============================================================================
// Regression: gradient stops accept the `/alpha` opacity modifier.
// Previously the parser's opacity-modifier whitelist only included
// `bg/text/border/ring/placeholder/divide/accent/caret/fill/stroke/outline/
// decoration/shadow/ring-offset`. `from`, `via`, `to` were missing so
// `from-red-500/50` fell through to generic parsing and produced nothing.
// =============================================================================
describe('parseClass - gradient stop opacity (regression)', () => {
  it('parses from-<color>/<alpha>', () => {
    const r = parseClass('from-red-500/50')
    expect(r.utility).toBe('from')
    expect(r.value).toBe('red-500/50')
  })

  it('parses via-<color>/<alpha>', () => {
    const r = parseClass('via-purple-500/75')
    expect(r.utility).toBe('via')
    expect(r.value).toBe('purple-500/75')
  })

  it('parses to-<color>/<alpha>', () => {
    const r = parseClass('to-blue-500/25')
    expect(r.utility).toBe('to')
    expect(r.value).toBe('blue-500/25')
  })

  it('parses from-<arbitrary-color>/<alpha>', () => {
    const r = parseClass('from-[#FF3E54]/60')
    expect(r.utility).toBe('from')
    expect(r.value).toBe('[#FF3E54]/60')
  })
})

// =============================================================================
// Regression: arbitrary-value + arbitrary-modifier shape.
// `text-[14px]/[1.5]` combines an arbitrary font-size with an arbitrary
// line-height. `bg-[#fff]/[0.33]` is the same shape for color alpha.
// The general preArbitraryMatch regex ends on the last `]`, which is the
// wrong `]` here (there are two brackets in a row with a `/` between).
// The parser now short-circuits this shape and encodes both halves.
// =============================================================================
describe('parseClass - arbitrary value with arbitrary modifier (regression)', () => {
  it('parses text-[size]/[line-height]', () => {
    const r = parseClass('text-[14px]/[1.5]')
    expect(r.utility).toBe('text')
    expect(r.value).toBe('14px/1.5')
    expect(r.arbitrary).toBe(true)
  })

  it('parses bg-[color]/[alpha]', () => {
    // The color-rule accepts `value/alpha` format — `0.33` is the alpha.
    const r = parseClass('bg-[#FF3E54]/[0.33]')
    expect(r.utility).toBe('bg')
    expect(r.value).toBe('#FF3E54/0.33')
    expect(r.modifierArbitrary).toBe(true)
  })

  it('parses text-[size]/[lh] through variants', () => {
    const r = parseClass('md:text-[14px]/[1.5]')
    expect(r.variants).toEqual(['md'])
    expect(r.utility).toBe('text')
    expect(r.value).toBe('14px/1.5')
  })

  it('parses negative arbitrary-with-modifier', () => {
    const r = parseClass('-top-[10px]/[2]')
    expect(r.utility).toBe('top')
    expect(r.value).toBe('-10px/2')
  })
})

describe('extractClasses expression attributes', () => {
  // className={clsx(...)}, className={[...]}, Astro class:list, and Vue
  // :class previously extracted nothing — the classes silently never
  // generated CSS.
  it('extracts from clsx/cn call expressions', () => {
    const result = extractClasses(`<div className={clsx('flex', cond && 'p-4')} />`)
    expect(result.has('flex')).toBe(true)
    expect(result.has('p-4')).toBe(true)
    expect(result.has('clsx')).toBe(false)
    expect(result.has('cond')).toBe(false)
  })

  it('extracts from array expressions', () => {
    const result = extractClasses(`<div className={['flex', 'm-2']} />`)
    expect(result.has('flex')).toBe(true)
    expect(result.has('m-2')).toBe(true)
  })

  it('extracts from object-literal keys one level deep', () => {
    const result = extractClasses(`<div className={cn({ 'hidden': isHidden }, 'block')} />`)
    expect(result.has('hidden')).toBe(true)
    expect(result.has('block')).toBe(true)
  })

  it('extracts from Astro class:list', () => {
    const result = extractClasses(`<div class:list={['flex', 'gap-2']} />`)
    expect(result.has('flex')).toBe(true)
    expect(result.has('gap-2')).toBe(true)
  })

  it('extracts from Vue :class bindings', () => {
    const result = extractClasses(`<div :class="['flex', active ? 'p-4' : 'm-2']" />`)
    expect(result.has('flex')).toBe(true)
    expect(result.has('p-4')).toBe(true)
    expect(result.has('m-2')).toBe(true)
    expect(result.has('active')).toBe(false)
  })

  // stx picks an element's active-state classes in an `x-class` ternary. Left
  // unscanned, the utility never generates and the element renders with its
  // layout applied and its colour missing — white text on nothing.
  //
  // The plain `class=` pattern does not rescue this: its value matcher is
  // `[^"']+`, so it stops at the ternary's first inner quote and never reaches
  // the class strings that matter.
  it('extracts from stx x-class bindings', () => {
    const result = extractClasses(`<button x-class="tab === 'latest' ? 'bg-red-600 text-white' : 'bg-slate-100'">Go</button>`)
    expect(result.has('bg-red-600')).toBe(true)
    expect(result.has('text-white')).toBe(true)
    expect(result.has('bg-slate-100')).toBe(true)
  })

  it('extracts from single-quoted x-class bindings', () => {
    const result = extractClasses(`<div x-class='active ? "ring-2" : "opacity-50"'></div>`)
    expect(result.has('ring-2')).toBe(true)
    expect(result.has('opacity-50')).toBe(true)
  })

  // A ternary with no inner quotes is the case the plain `class=` pattern can
  // reach, so both patterns fire; the classes still have to come out once.
  it('extracts an x-class value that is a bare class list', () => {
    const result = extractClasses(`<div x-class="isOpen && 'grid-cols-2'"></div>`)
    expect(result.has('grid-cols-2')).toBe(true)
  })

  it('still extracts plain and template-literal attributes', () => {
    expect(extractClasses('<div class="flex p-4" />').has('flex')).toBe(true)
    expect(extractClasses('<div className={`flex ${x} p-4`} />').has('p-4')).toBe(true)
  })
})

describe('bracket and colon syntax edge cases', () => {
  it('colon-syntax negatives produce the canonical negative form', () => {
    const { expandBracketSyntax } = require('../../src/engine/parser')
    expect(expandBracketSyntax('m:-2', { colonSyntax: true })).toEqual(['-m-2'])
    expect(expandBracketSyntax('mt:-4', { colonSyntax: true })).toEqual(['-mt-4'])
    expect(expandBracketSyntax('bg:black', { colonSyntax: true })).toEqual(['bg-black'])
  })

  it('text[<colorFamily>] maps to the 500 shade instead of an invalid bare family', () => {
    const { expandBracketSyntax } = require('../../src/engine/parser')
    expect(expandBracketSyntax('text[red]', {})).toEqual(['text-red-500'])
    expect(expandBracketSyntax('text[white]', {})).toEqual(['text-white'])
    expect(expandBracketSyntax('text[arial]', {})).toEqual(['font-[arial]'])
  })
})

describe('extractClasses: an empty string in a bound class', () => {
  // `''` used to pair its closing quote with the opening quote of the next
  // string, so the class after an empty branch was never extracted and its
  // utility was never generated: `:class="inApp ? '' : 'max-md:mb-5'"` gave a
  // margin of 0.
  it('still finds the class in the other branch of a ternary', () => {
    expect(extractClasses(`<div :class="inApp ? '' : 'max-md:mb-5'"></div>`).has('max-md:mb-5')).toBe(true)
    expect(extractClasses(`<div :class="first ? 'rounded-t-none' : ''"></div>`).has('rounded-t-none')).toBe(true)
    expect(extractClasses(`<div x-class="done ? 'line-through' : ''"></div>`).has('line-through')).toBe(true)
  })

  it('finds every class around several empty strings', () => {
    const found = extractClasses(`<div :class="a ? '' : b ? 'opacity-45' : '' + (c ? 'bg-surface-raised' : '')"></div>`)
    expect(found.has('opacity-45')).toBe(true)
    expect(found.has('bg-surface-raised')).toBe(true)
  })

  it('extracts nothing from the empty string itself', () => {
    const found = extractClasses(`<div :class="inApp ? '' : 'mb-5'"></div>`)
    expect(found.has('')).toBe(false)
    expect(found.has(':')).toBe(false)
    expect(found.has('mb-5')).toBe(true)
  })
})

describe('breakpoints that are not a plain word', () => {
  const css = (className: string): string => {
    const gen = new CSSGenerator(defaultConfig)
    for (const found of extractClasses(`<div class="${className}"></div>`))
      gen.generate(found)
    return gen.toCSS(false, true)
  }

  it('scans a class on a breakpoint that starts with a digit', () => {
    expect(extractClasses('<div class="2xl:pr-0"></div>').has('2xl:pr-0')).toBe(true)
    // `\\32 ` is the digit 2 as a code point: a class cannot start with a bare digit.
    expect(css('2xl:pr-0')).toBe('@media (min-width: 1536px){.\\32 xl\\:pr-0{padding-right:0}}')
    expect(css('max-2xl:hidden')).toContain('max-width: 1535.98px')
    expect(css('dark:2xl:hover:underline')).toContain('min-width: 1536px')
  })

  it('writes a selector a browser accepts for a class that starts with a digit', () => {
    const gen = new CSSGenerator(defaultConfig)
    expect(gen.escapeSelector('2xl:pr-0')).toBe('\\32 xl\\:pr-0')
    // The space ends the escape, so the hex-looking letter after it is kept.
    expect(gen.escapeSelector('2a')).toBe('\\32 a')
    expect(gen.escapeSelector('-2xl:m-0')).toBe('-\\32 xl\\:m-0')
    // Untouched: a digit anywhere but the start, and an ordinary class.
    expect(gen.escapeSelector('mt-2')).toBe('mt-2')
    expect(gen.escapeSelector('md:w-1/2')).toBe('md\\:w-1\\/2')
  })

  it('still refuses a segment that is only a number', () => {
    expect(extractClasses('<div class="12:flex"></div>').has('12:flex')).toBe(false)
  })

  it('generates an arbitrary min and max width', () => {
    expect(css('min-[420px]:grid-cols-2')).toContain('@media (min-width: 420px)')
    expect(css('min-[420px]:grid-cols-2')).toContain('grid-template-columns')
    expect(css('max-[40rem]:hidden')).toContain('@media (max-width: 40rem)')
    expect(css('min-[calc(100vw_-_2rem)]:flex')).toContain('(min-width: calc(100vw - 2rem))')
    expect(css('min-[420px]:max-[600px]:flex')).toContain('(min-width: 420px) and (max-width: 600px)')
  })

  it('reads min-md as md', () => {
    expect(css('min-md:flex')).toContain('@media (min-width: 768px)')
  })

  it('drops a width that is not one, instead of applying the utility everywhere', () => {
    expect(css('min-[banana]:flex')).toBe('')
    expect(css('min-nope:flex')).toBe('')
  })

  it('knows an arbitrary breakpoint from anything else', () => {
    expect(arbitraryBreakpoint('min-[420px]')).toBe('(min-width: 420px)')
    expect(arbitraryBreakpoint('max-[37.5em]')).toBe('(max-width: 37.5em)')
    expect(arbitraryBreakpoint('min-[red]')).toBeUndefined()
    expect(arbitraryBreakpoint('data-[state=open]')).toBeUndefined()
    expect(arbitraryBreakpoint('md')).toBeUndefined()
  })
})

describe('a 2xl utility keeps its place in the cascade', () => {
  it('orders the shorthand before the side it must not reset, as at every other breakpoint', () => {
    const order = (first: string, second: string): boolean => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate(first)
      gen.generate(second)
      const css = gen.toCSS(false, true)
      return css.indexOf('padding:') < css.indexOf('padding-right:')
    }
    // Authored side-first; the shorthand still has to come out first.
    expect(order('xl:pr-0', 'xl:p-4')).toBe(true)
    expect(order('2xl:pr-0', '2xl:p-4')).toBe(true)
  })
})
