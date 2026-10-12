import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

function css(className: string): string {
  const gen = new CSSGenerator(defaultConfig)
  gen.generate(className)
  return gen.toCSS(false, true)
}

describe('Container queries', () => {
  describe('the container scale is its own, not the screen scale', () => {
    // This is the bug that motivated the work: container queries used to
    // read theme.screens, so `@sm:` fired at 640px — the viewport
    // breakpoint — instead of 24rem. A container is an element, and the two
    // scales are nowhere near each other.
    it('should resolve @sm to 24rem, not the 640px screen breakpoint', () => {
      const out = css('@sm:flex')
      expect(out).toContain('@container (width >= 24rem)')
      expect(out).not.toContain('640px')
    })

    it('should resolve @md to 28rem, not 768px', () => {
      expect(css('@md:flex')).toContain('@container (width >= 28rem)')
    })

    const scale: [string, string][] = [
      ['@3xs', '16rem'],
      ['@2xs', '18rem'],
      ['@xs', '20rem'],
      ['@sm', '24rem'],
      ['@md', '28rem'],
      ['@lg', '32rem'],
      ['@xl', '36rem'],
      ['@2xl', '42rem'],
      ['@3xl', '48rem'],
      ['@4xl', '56rem'],
      ['@5xl', '64rem'],
      ['@6xl', '72rem'],
      ['@7xl', '80rem'],
    ]

    for (const [variant, size] of scale) {
      it(`should resolve ${variant} to ${size}`, () => {
        expect(css(`${variant}:flex`)).toContain(`@container (width >= ${size})`)
      })
    }

    it('should cover the sizes below xs that the screen scale has no room for', () => {
      // @3xs/@2xs/@xs have no screen-breakpoint equivalent, so they could
      // not have worked at all under the old lookup.
      expect(css('@3xs:flex')).toContain('16rem')
      expect(css('@2xs:flex')).toContain('18rem')
      expect(css('@xs:flex')).toContain('20rem')
    })
  })

  describe('range syntax', () => {
    it('should use an inclusive lower bound', () => {
      expect(css('@sm:flex')).toContain('(width >= 24rem)')
    })

    it('should use an exclusive upper bound for max-*', () => {
      // `width < 28rem`, not a max-width with an 0.02px fudge — container
      // queries can express an exclusive bound directly.
      expect(css('@max-md:hidden')).toContain('(width < 28rem)')
      expect(css('@max-md:hidden')).not.toContain('max-width')
    })
  })

  describe('max-* variants', () => {
    it('should generate @max-sm', () => {
      expect(css('@max-sm:flex')).toContain('@container (width < 24rem)')
    })

    it('should generate @max-7xl', () => {
      expect(css('@max-7xl:flex')).toContain('@container (width < 80rem)')
    })
  })

  describe('arbitrary sizes', () => {
    it('should accept @min-[400px]', () => {
      expect(css('@min-[400px]:flex')).toContain('@container (width >= 400px)')
    })

    it('should accept @max-[600px]', () => {
      expect(css('@max-[600px]:hidden')).toContain('@container (width < 600px)')
    })

    it('should accept an arbitrary rem length', () => {
      expect(css('@min-[30rem]:flex')).toContain('@container (width >= 30rem)')
    })

    it('should accept min- on a scale key too', () => {
      expect(css('@min-sm:flex')).toContain('@container (width >= 24rem)')
    })
  })

  describe('named containers', () => {
    it('should name the container in the at-rule', () => {
      expect(css('@sm/sidebar:flex')).toContain('@container sidebar (width >= 24rem)')
    })

    it('should work with max-*', () => {
      expect(css('@max-lg/main:flex')).toContain('@container main (width < 32rem)')
    })

    it('should work with an arbitrary size', () => {
      expect(css('@min-[400px]/card:flex')).toContain('@container card (width >= 400px)')
    })

    it('should not mistake a slash inside brackets for a container name', () => {
      // @min-[calc(100%/2)] has a slash in its VALUE. Scanning for the name
      // from the right has to skip bracketed text or the name becomes `2)]`.
      const out = css('@min-[calc(100%/2)]:flex')
      expect(out).toContain('@container (width >= calc(100%/2))')
      expect(out).not.toContain('@container 2')
    })
  })

  describe('rejection', () => {
    it('should generate nothing for an unknown scale key', () => {
      expect(css('@bogus:flex')).toBe('')
    })

    it('should generate nothing for an empty arbitrary size', () => {
      expect(css('@min-[]:flex')).toBe('')
    })

    it('should generate nothing for a bare @', () => {
      expect(css('@:flex')).toBe('')
    })
  })

  describe('the container utilities still work', () => {
    it('should generate @container', () => {
      expect(css('@container')).toBe('.\\@container{container-type:inline-size}')
    })

    it('should generate @container-normal', () => {
      expect(css('@container-normal')).toContain('container-type:normal')
    })

    it('should generate a named container', () => {
      const out = css('@container/sidebar')
      expect(out).toContain('container-type:inline-size')
      expect(out).toContain('container-name:sidebar')
    })
  })

  describe('stacking', () => {
    it('should combine with a state variant', () => {
      const out = css('@sm:hover:underline')
      expect(out).toContain('@container (width >= 24rem)')
      expect(out).toContain(':hover')
    })

    it('should nest with a media query rather than merge into it', () => {
      const out = css('md:@sm:flex')
      expect(out).toContain('@media (min-width: 768px)')
      expect(out).toContain('@container (width >= 24rem)')
      // The media query wraps the container query.
      expect(out.indexOf('@media')).toBeLessThan(out.indexOf('@container'))
    })

    it('should keep the screen scale separate when both are used', () => {
      // sm: is 640px (viewport), @sm: is 24rem (container). Same key, two
      // different scales — the thing the old implementation conflated.
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('sm:flex')
      gen.generate('@sm:block')
      const out = gen.toCSS(false, true)
      expect(out).toContain('@media (min-width: 640px)')
      expect(out).toContain('@container (width >= 24rem)')
    })
  })
})
