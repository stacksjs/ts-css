import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

// Utilities must treat their value maps as allowlists, not alias tables:
// an unknown bare word (often a semantic class name like `z-modal` or
// `order-summary`) must generate NO css, while numbers, keywords, and
// arbitrary [...] values keep working. Mirrors the grid-placement fix.

function css(cls: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(cls)
  return gen.toCSS(false).trim()
}

describe('z-index value validation', () => {
  it('rejects unknown words', () => {
    expect(css('z-foo')).toBe('')
    expect(css('z-modal')).toBe('')
  })

  it('accepts any integer, negatives, auto, and arbitrary', () => {
    expect(css('z-40')).toContain('z-index: 40;')
    expect(css('z-100')).toContain('z-index: 100;')
    expect(css('-z-1')).toContain('z-index: -1;')
    expect(css('z-auto')).toContain('z-index: auto;')
    expect(css('z-[999]')).toContain('z-index: 999;')
  })
})

describe('order value validation', () => {
  it('rejects unknown words', () => {
    expect(css('order-foo')).toBe('')
    expect(css('order-summary')).toBe('')
  })

  it('accepts integers, keywords, and arbitrary', () => {
    expect(css('order-3')).toContain('order: 3;')
    expect(css('order-13')).toContain('order: 13;')
    expect(css('order-first')).toContain('order: -9999;')
    expect(css('order-none')).toContain('order: 0;')
    expect(css('-order-1')).toContain('order: -1;')
    expect(css('order-[42]')).toContain('order: 42;')
  })
})

describe('opacity value validation', () => {
  it('rejects unknown words', () => {
    expect(css('opacity-foo')).toBe('')
  })

  it('accepts scale steps, off-scale integers, and arbitrary', () => {
    expect(css('opacity-50')).toContain('opacity: 0.5;')
    expect(css('opacity-33')).toContain('opacity: 0.33;')
    expect(css('opacity-[0.125]')).toContain('opacity: 0.125;')
  })

  it('rejects out-of-range integers', () => {
    expect(css('opacity-150')).toBe('')
  })
})

describe('transition/animation time value validation', () => {
  it('rejects unknown words instead of emitting fooms', () => {
    expect(css('duration-foo')).toBe('')
    expect(css('delay-foo')).toBe('')
    expect(css('animate-duration-foo')).toBe('')
    expect(css('animate-delay-foo')).toBe('')
    expect(css('animate-iteration-foo')).toBe('')
  })

  it('keeps presets and bare numbers', () => {
    expect(css('duration-300')).toContain('transition-duration: 300ms;')
    expect(css('duration-250')).toContain('transition-duration: 250ms;')
    expect(css('delay-0')).toContain('transition-delay: 0s;')
    expect(css('animate-duration-500')).toContain('animation-duration: 500ms;')
    expect(css('animate-iteration-3')).toContain('animation-iteration-count: 3;')
    expect(css('animate-iteration-infinite')).toContain('animation-iteration-count: infinite;')
  })

  it('passes arbitrary values through verbatim (no double ms suffix)', () => {
    expect(css('duration-[2s]')).toContain('transition-duration: 2s;')
    expect(css('delay-[150ms]')).toContain('transition-delay: 150ms;')
    expect(css('duration-[var(--speed)]')).toContain('transition-duration: var(--speed);')
  })
})

describe('transform value validation', () => {
  it('rejects unknown words for scale/rotate/skew/translate', () => {
    expect(css('scale-foo')).toBe('')
    expect(css('scale-x-foo')).toBe('')
    expect(css('rotate-foo')).toBe('')
    expect(css('rotate-x-foo')).toBe('')
    expect(css('skew-x-foo')).toBe('')
    expect(css('skew-y-foo')).toBe('')
    expect(css('translate-x-foo')).toBe('')
    expect(css('-translate-y-foo')).toBe('')
  })

  it('keeps numeric and unit forms', () => {
    expect(css('scale-150')).toContain('transform: scale(1.5);')
    expect(css('scale-x-50')).toContain('transform: scaleX(0.5);')
    expect(css('rotate-45')).toContain('transform: rotate(45deg);')
    expect(css('-rotate-90')).toContain('transform: rotate(-90deg);')
    expect(css('rotate-x-30')).toContain('transform: rotateX(30deg);')
    expect(css('skew-x-12')).toContain('transform: skewX(12deg);')
    expect(css('translate-x-4')).toContain('transform: translateX(1rem);')
    expect(css('-translate-y-1/2')).toContain('transform: translateY(-50%);')
    expect(css('translate-x-full')).toContain('transform: translateX(100%);')
  })

  it('keeps arbitrary transform values', () => {
    expect(css('scale-[1.7]')).toContain('transform: scale(1.7);')
    expect(css('rotate-[17deg]')).toContain('transform: rotate(17deg);')
    expect(css('rotate-[0.5turn]')).toContain('transform: rotate(0.5turn);')
    expect(css('translate-x-[10px]')).toContain('transform: translateX(10px);')
    expect(css('skew-y-[3deg]')).toContain('transform: skewY(3deg);')
  })
})

describe('typography value validation', () => {
  it('rejects unknown words', () => {
    expect(css('leading-foo')).toBe('')
    expect(css('tracking-foo')).toBe('')
    expect(css('-tracking-foo')).toBe('')
    expect(css('line-clamp-foo')).toBe('')
    expect(css('indent-foo')).toBe('')
    expect(css('word-spacing-foo')).toBe('')
  })

  it('does not quote bare words as content (content-wrapper)', () => {
    expect(css('content-wrapper')).toBe('')
    expect(css('content-area')).toBe('')
  })

  it('keeps named scales, numbers, and arbitrary values', () => {
    expect(css('leading-tight')).toContain('line-height: 1.25;')
    expect(css('leading-7')).toContain('line-height: 1.75rem;')
    expect(css('leading-[1.15]')).toContain('line-height: 1.15;')
    expect(css('tracking-wide')).toContain('letter-spacing: 0.025em;')
    expect(css('-tracking-wide')).toContain('letter-spacing: -0.025em;')
    expect(css('tracking-[0.2em]')).toContain('letter-spacing: 0.2em;')
    expect(css('line-clamp-3')).toContain('-webkit-line-clamp: 3;')
    expect(css('indent-4')).toContain('text-indent: 1rem;')
    expect(css('-indent-2')).toContain('text-indent: -0.5rem;')
  })

  it('keeps content keywords and arbitrary strings', () => {
    expect(css('content-none')).toContain('content: none;')
    expect(css('content-center')).toContain('align-content:')
    expect(css("content-['hello']")).toContain('content: \'hello\';')
  })

  it('line-clamp-none unsets the clamp', () => {
    const out = css('line-clamp-none')
    expect(out).toContain('-webkit-line-clamp: none;')
    expect(out).toContain('overflow: visible;')
  })
})

describe('sizing value validation', () => {
  it('rejects unknown words', () => {
    expect(css('w-foo')).toBe('')
    expect(css('w-sidebar')).toBe('')
    expect(css('h-foo')).toBe('')
    expect(css('size-foo')).toBe('')
    expect(css('min-w-foo')).toBe('')
    expect(css('max-h-foo')).toBe('')
  })

  it('keeps keywords, scale, fractions, off-scale numbers, and arbitrary', () => {
    expect(css('w-full')).toContain('width: 100%;')
    expect(css('w-dvw')).toContain('width: 100dvw;')
    expect(css('w-4')).toContain('width: 1rem;')
    expect(css('w-1/2')).toContain('width: 50%;')
    expect(css('h-screen')).toContain('height: 100vh;')
    expect(css('size-8')).toContain('width: 2rem;')
    expect(css('max-w-2xl')).toContain('max-width: 42rem;')
    expect(css('min-h-screen')).toContain('min-height: 100vh;')
    expect(css('w-[calc(100%-2rem)]')).toContain('width: calc(100% - 2rem);')
    expect(css('max-w-[70ch]')).toContain('max-width: 70ch;')
  })
})

describe('spacing family value validation', () => {
  it('rejects unknown words', () => {
    expect(css('p-foo')).toBe('')
    expect(css('m-header')).toBe('')
    expect(css('mx-foo')).toBe('')
    expect(css('gap-foo')).toBe('')
    expect(css('gap-x-foo')).toBe('')
    expect(css('top-bar')).toBe('')
    expect(css('inset-foo')).toBe('')
    expect(css('-left-foo')).toBe('')
    expect(css('basis-foo')).toBe('')
    expect(css('stroke-foo')).toBe('')
    expect(css('underline-offset-foo')).toBe('')
    expect(css('outline-offset-foo')).toBe('')
  })

  it('keeps scale, off-scale numbers, negatives, and keywords', () => {
    expect(css('p-4')).toContain('padding: 1rem;')
    expect(css('p-4.5')).toContain('padding: 1.125rem;')
    expect(css('-m-2')).toContain('margin: -0.5rem;')
    expect(css('gap-4.5')).toContain('gap: 1.125rem;')
    expect(css('top-1/2')).toContain('top: 50%;')
    expect(css('-top-4')).toContain('top: -1rem;')
    expect(css('inset-0')).toContain('top: 0')
    expect(css('basis-1/3')).toContain('flex-basis: 33.33')
    expect(css('basis-64')).toContain('flex-basis: 16rem;')
    expect(css('stroke-2')).toContain('stroke-width: 2;')
    expect(css('underline-offset-4')).toContain('text-underline-offset: 4px;')
    expect(css('outline-offset-2')).toContain('outline-offset: 2px;')
  })

  it('keeps arbitrary values', () => {
    expect(css('p-[3vw]')).toContain('padding: 3vw;')
    expect(css('gap-[calc(1rem+2px)]')).toContain('gap: calc(1rem + 2px);')
    expect(css('top-[10vh]')).toContain('top: 10vh;')
    expect(css('basis-[12ch]')).toContain('flex-basis: 12ch;')
    expect(css('underline-offset-[3px]')).toContain('text-underline-offset: 3px;')
  })
})

describe('visual utilities value validation', () => {
  it('rejects unknown words', () => {
    expect(css('blur-foo')).toBe('')
    expect(css('brightness-foo')).toBe('')
    expect(css('contrast-foo')).toBe('')
    expect(css('saturate-foo')).toBe('')
    expect(css('hue-rotate-foo')).toBe('')
    expect(css('backdrop-blur-foo')).toBe('')
    expect(css('backdrop-brightness-foo')).toBe('')
    expect(css('drop-shadow-foo')).toBe('')
    expect(css('columns-foo')).toBe('')
    expect(css('aspect-foo')).toBe('')
    expect(css('self-foo')).toBe('')
    expect(css('justify-self-foo')).toBe('')
    expect(css('ring-foo')).toBe('')
    expect(css('border-spacing-foo')).toBe('')
  })

  it('keeps named scales, numbers, and arbitrary values', () => {
    // Each filter function is named so several can compose on one element;
    // the shared `filter` declaration lists them all.
    expect(css('blur-sm')).toContain('--tc-blur: blur(4px);')
    expect(css('blur-12')).toContain('--tc-blur: blur(12px);')
    expect(css('blur-[5em]')).toContain('--tc-blur: blur(5em);')
    expect(css('brightness-150')).toContain('--tc-brightness: brightness(1.5);')
    expect(css('hue-rotate-90')).toContain('--tc-hue-rotate: hue-rotate(90deg);')
    expect(css('backdrop-blur-md')).toContain('--tc-backdrop-blur: blur(12px);')
    expect(css('backdrop-saturate-200')).toContain('--tc-backdrop-saturate: saturate(2);')
    expect(css('columns-3')).toContain('columns: 3;')
    expect(css('columns-13')).toContain('columns: 13;')
    expect(css('aspect-video')).toContain('aspect-ratio: 16 / 9;')
    expect(css('aspect-16/9')).toContain('aspect-ratio: 16 / 9;')
    expect(css('aspect-[4/3]')).toContain('aspect-ratio: 4/3;')
    expect(css('self-center')).toContain('align-self: center;')
    expect(css('ring-2')).toContain('calc(2px + var(--tc-ring-offset-width, 0px))')
    expect(css('ring-[6px]')).toContain('calc(6px + var(--tc-ring-offset-width, 0px))')
    expect(css('border-spacing-2')).toContain('border-spacing: 0.5rem 0.5rem;')
  })
})

describe('between-element utilities value validation', () => {
  it('rejects unknown words', () => {
    expect(css('space-x-foo')).toBe('')
    expect(css('space-y-foo')).toBe('')
    expect(css('divide-x-foo')).toBe('')
    expect(css('divide-y-foo')).toBe('')
    expect(css('ring-opacity-foo')).toBe('')
    expect(css('border-opacity-foo')).toBe('')
  })

  it('keeps scale values, numbers, negatives, reverse, and arbitrary', () => {
    expect(css('space-x-2')).toContain('calc(0.5rem * var(--tc-space-x-reverse))')
    expect(css('space-y-4.5')).toContain('calc(1.125rem * ')
    expect(css('-space-x-2')).toContain('calc(-0.5rem * ')
    expect(css('space-x-reverse')).toContain('--tc-space-x-reverse: 1;')
    expect(css('space-x-[3ch]')).toContain('calc(3ch * ')
    expect(css('divide-y-2')).toContain('calc(2px * ')
    expect(css('divide-x-3')).toContain('calc(3px * ')
    expect(css('divide-x-[1.5px]')).toContain('calc(1.5px * ')
    expect(css('divide-y')).toContain('calc(1px * ')
    expect(css('ring-opacity-50')).toContain('--tc-ring-opacity: 0.5;')
    expect(css('ring-opacity-33')).toContain('--tc-ring-opacity: 0.33;')
    expect(css('border-opacity-75')).toContain('--tc-border-opacity: 0.75;')
  })
})

describe('gradient stop value validation', () => {
  it('rejects unknown words', () => {
    expect(css('from-foo')).toBe('')
    expect(css('via-foo')).toBe('')
    expect(css('to-foo')).toBe('')
  })

  it('keeps theme colors, opacity modifiers, and arbitrary values', () => {
    expect(css('from-blue-500')).toContain('--tc-gradient-from: oklch(62.3% 0.214 259.815);')
    expect(css('from-blue-500/50')).toContain('/ 0.5)')
    expect(css('via-transparent')).toContain('transparent')
    expect(css('to-[#ff3e54]')).toContain('--tc-gradient-to: #ff3e54;')
    expect(css('from-[var(--brand)]')).toContain('--tc-gradient-from: var(--brand);')
  })
})

describe('hex alpha handling in opacity modifiers', () => {
  it('expands 4-digit hex per digit (opacity modifier replaces alpha)', () => {
    expect(css('bg-[#f00a]/50')).toContain('background-color: rgb(255 0 0 / 0.5);')
  })

  it('keeps 3, 6, and 8-digit hex working', () => {
    expect(css('bg-[#f00]/50')).toContain('background-color: rgb(255 0 0 / 0.5);')
    expect(css('bg-[#ff0000]/25')).toContain('background-color: rgb(255 0 0 / 0.25);')
    expect(css('bg-[#ff000080]/50')).toContain('background-color: rgb(255 0 0 / 0.5);')
  })
})

describe('scroll margin/padding, column-gap, perspective validation', () => {
  it('rejects unknown words', () => {
    expect(css('scroll-m-foo')).toBe('')
    expect(css('scroll-mt-foo')).toBe('')
    expect(css('scroll-p-foo')).toBe('')
    expect(css('scroll-px-foo')).toBe('')
    expect(css('column-gap-foo')).toBe('')
    expect(css('perspective-foo')).toBe('')
  })

  it('keeps scale, off-scale numbers, and arbitrary', () => {
    expect(css('scroll-mt-4')).toContain('scroll-margin-top: 1rem;')
    expect(css('scroll-p-4.5')).toContain('scroll-padding: 1.125rem;')
    expect(css('scroll-m-[10px]')).toContain('scroll-margin: 10px;')
    expect(css('column-gap-8')).toContain('column-gap: 2rem;')
    expect(css('perspective-1000')).toContain('perspective: 1000px;')
    expect(css('perspective-none')).toContain('perspective: none;')
    expect(css('perspective-[75vw]')).toContain('perspective: 75vw;')
  })
})

describe('outline, mask, and text-shadow value validation', () => {
  it('rejects unknown words', () => {
    expect(css('outline-foo')).toBe('')
    expect(css('mask-clip-foo')).toBe('')
    expect(css('mask-origin-foo')).toBe('')
    expect(css('mask-position-somewhere')).toBe('')
    expect(css('mask-repeat-nope')).toBe('')
    expect(css('mask-size-big')).toBe('')
    expect(css('mask-image-foo')).toBe('')
    expect(css('text-shadow-foo')).toBe('')
  })

  it('keeps keywords, numbers, and arbitrary values', () => {
    expect(css('outline-2')).toContain('outline-width: 2px;')
    expect(css('outline-3')).toContain('outline-width: 3px;')
    expect(css('outline-dashed')).toContain('outline-style: dashed;')
    expect(css('outline-hidden')).toContain('outline: 2px solid transparent;')
    expect(css('mask-clip-border')).toContain('mask-clip: border-box;')
    expect(css('mask-position-top-left')).toContain('mask-position: top left;')
    expect(css('mask-size-cover')).toContain('mask-size: cover;')
    expect(css('mask-image-none')).toContain('mask-image: none;')
    expect(css('mask-image-[url(/img/mask.png)]')).toContain('mask-image: url(/img/mask.png);')
    // The scale's colour now routes through --tc-text-shadow-color so a
    // text-shadow-<color> utility can recolour it without restating offsets.
    expect(css('text-shadow-sm')).toContain('text-shadow: 0 1px 2px var(--tc-text-shadow-color, rgba(0, 0, 0, 0.05));')
  })
})

describe('border-radius side/corner value validation', () => {
  it('rejects unknown words', () => {
    expect(css('rounded-t-foo')).toBe('')
    expect(css('rounded-tr-brand')).toBe('')
    expect(css('rounded-s-card')).toBe('')
    expect(css('rounded-ee-foo')).toBe('')
  })

  it('bare side/corner forms take the DEFAULT radius', () => {
    expect(css('rounded-t')).toContain('border-top-left-radius: 0.25rem;')
    expect(css('rounded-s')).toContain('border-start-start-radius: 0.25rem;')
    expect(css('rounded-tr')).toContain('border-top-right-radius: 0.25rem;')
  })

  it('keeps theme keys and arbitrary values', () => {
    expect(css('rounded-t-lg')).toContain('border-top-left-radius: 0.5rem;')
    expect(css('rounded-e-full')).toContain('border-start-end-radius: 9999px;')
    expect(css('rounded-bl-[6px]')).toContain('border-bottom-left-radius: 6px;')
  })
})

describe('decoration, SVG dash, text-emphasis, and color expression validation', () => {
  it('rejects unknown words', () => {
    expect(css('decoration-foo')).toBe('')
    expect(css('stroke-dasharray-foo')).toBe('')
    expect(css('stroke-dashoffset-foo')).toBe('')
    expect(css('text-emphasis-foo')).toBe('')
  })

  it('keeps valid forms', () => {
    expect(css('decoration-wavy')).toContain('text-decoration-style: wavy;')
    expect(css('decoration-2')).toContain('text-decoration-thickness: 2px;')
    expect(css('decoration-blue-500')).toContain('text-decoration-color:')
    expect(css('stroke-dasharray-4')).toContain('stroke-dasharray: 4;')
    expect(css('stroke-dashoffset-2.5')).toContain('stroke-dashoffset: 2.5;')
    expect(css('text-emphasis-dot')).toContain('text-emphasis: dot;')
  })

  it('parses short hex divide colors and hwb() arbitrary colors', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: { ...defaultConfig.theme, extend: { colors: { rosy: '#f00a' } } },
    })
    gen.generate('divide-rosy/50')
    expect(gen.toCSS(false)).toContain('rgb(255 0 0 / 0.5)')
    expect(css('accent-[hwb(120_0%_0%)]')).toContain('accent-color: hwb(120 0% 0%);')
  })
})

describe('negative spacing validity', () => {
  it('rejects negative padding (invalid CSS)', () => {
    expect(css('-p-4')).toBe('')
    expect(css('-px-2')).toBe('')
    expect(css('-pt-1')).toBe('')
  })

  it('keeps negative margins', () => {
    expect(css('-m-4')).toContain('margin: -1rem;')
    expect(css('-mx-2')).toContain('margin-left: -0.5rem;')
  })
})

describe('form-* utilities', () => {
  it('generates the @tailwindcss/forms styles (previously dead rules)', () => {
    expect(css('form-input')).toContain('appearance: none;')
    expect(css('form-select')).toContain('background-image:')
    expect(css('form-checkbox')).toContain('border-radius: 0px;')
    expect(css('form-radio')).toContain('border-radius: 100%;')
    expect(css('form-textarea')).toContain('padding-left: 0.75rem;')
    expect(css('form-multiselect')).toContain('print-color-adjust: unset;')
  })
})

describe('transition defaults', () => {
  it('sets default duration and easing so transitions actually animate', () => {
    const out = css('transition-colors')
    expect(out).toContain('transition-duration: 150ms;')
    expect(out).toContain('transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);')
  })

  it('transition-none stays a plain disable', () => {
    const out = css('transition-none')
    expect(out).toContain('transition-property: none;')
    expect(out).not.toContain('transition-duration')
  })
})

describe('ring composition', () => {
  it('rings layer with shadows and honor inset/offset variables', () => {
    const gen = new CSSGenerator(defaultConfig)
    gen.generateBatch(['ring-2', 'ring-inset', 'ring-offset-2', 'shadow-md'])
    const out = gen.toCSS(false)
    // ring sets the ring var and composes with the shadow slot
    expect(out).toContain('--tc-ring-shadow: var(--tc-ring-inset,) 0 0 0 calc(2px + var(--tc-ring-offset-width, 0px))')
    // The five-layer stack, shared by every shadow-ish utility so they
    // compose: inset shadow, inset ring, ring offset, ring, shadow.
    expect(out).toContain('box-shadow: var(--tc-inset-shadow, 0 0 #0000), var(--tc-inset-ring-shadow, 0 0 #0000), var(--tc-ring-offset-shadow, 0 0 #0000), var(--tc-ring-shadow, 0 0 #0000), var(--tc-shadow, 0 0 #0000);')
    // ring-inset and ring-offset feed the same variables
    expect(out).toContain('--tc-ring-inset: inset;')
    expect(out).toContain('--tc-ring-offset-width: 2px;')
  })
})

describe('Tailwind v4 radius and shadow scales', () => {
  it('supports the full v4 radius scale', () => {
    expect(css('rounded-xs')).toContain('border-radius: 0.125rem;')
    expect(css('rounded-sm')).toContain('border-radius: 0.25rem;')
    expect(css('rounded-4xl')).toContain('border-radius: 2rem;')
  })

  it('supports the full v4 shadow scale', () => {
    expect(css('shadow-2xs')).toContain('--tc-shadow: 0 1px rgb(0 0 0 / 0.05);')
    expect(css('shadow-xs')).toContain('--tc-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);')
    expect(css('shadow-sm')).toContain('--tc-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);')
  })
})
