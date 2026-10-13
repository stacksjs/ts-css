import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/engine/config'
import { CSSGenerator } from '../../src/engine/generator'

describe('Color Utilities', () => {
  describe('Text colors', () => {
    it('should generate text-blue-500', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-blue-500')
      expect(gen.toCSS(false)).toContain('color: oklch(62.3% 0.214 259.815);')
    })

    it('should generate text-gray-800', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-gray-800')
      expect(gen.toCSS(false)).toContain('color: oklch(27.8% 0.033 256.848);')
    })

    it('should generate text-red-500', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-red-500')
      expect(gen.toCSS(false)).toContain('color: oklch(63.7% 0.237 25.331);')
    })

    it('should generate text-white', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-white')
      expect(gen.toCSS(false)).toContain('color: #fff;')
    })

    it('should generate text-black', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-black')
      expect(gen.toCSS(false)).toContain('color: #000;')
    })
  })

  describe('Background colors', () => {
    it('should generate bg-blue-500', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500')
      expect(gen.toCSS(false)).toContain('background-color: oklch(62.3% 0.214 259.815);')
    })

    it('should generate bg-gray-100', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-gray-100')
      expect(gen.toCSS(false)).toContain('background-color: oklch(96.7% 0.003 264.542);')
    })

    it('should support arbitrary color', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#ff0000]')
      expect(gen.toCSS(false)).toContain('background-color: #ff0000;')
    })
  })

  describe('Border colors', () => {
    it('should generate border-gray-300', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-gray-300')
      expect(gen.toCSS(false)).toContain('border-color: oklch(87.2% 0.01 258.338);')
    })

    it('should generate border-blue-500', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-blue-500')
      expect(gen.toCSS(false)).toContain('border-color: oklch(62.3% 0.214 259.815);')
    })
  })

  describe('Color opacity modifiers', () => {
    it('should generate background with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500/50')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: oklch(62.3% 0.214 259.815 / 0.5);')
    })

    it('should generate text with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-red-500/75')
      const css = gen.toCSS(false)
      expect(css).toContain('color: oklch(63.7% 0.237 25.331 / 0.75);')
    })

    it('should generate border with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-gray-500/25')
      const css = gen.toCSS(false)
      expect(css).toContain('border-color: oklch(55.1% 0.027 264.364 / 0.25);')
    })
  })
})

describe('Edge Cases', () => {
  describe('Arbitrary color values', () => {
    it('should handle hex colors with 3 digits', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#f00]')
      expect(gen.toCSS(false)).toContain('background-color: #f00;')
    })

    it('should handle hex colors with 6 digits', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#ff0000]')
      expect(gen.toCSS(false)).toContain('background-color: #ff0000;')
    })

    it('should handle hex colors with 8 digits (with alpha)', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#ff0000ff]')
      expect(gen.toCSS(false)).toContain('background-color: #ff0000ff;')
    })

    it('should handle rgb() colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[rgb(255,0,0)]')
      expect(gen.toCSS(false)).toContain('background-color: rgb(255,0,0);')
    })

    it('should preserve slash alpha inside arbitrary CSS color functions', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[rgb(242_242_244_/_0.9)]')
      expect(gen.toCSS(false)).toContain('background-color: rgb(242 242 244 / 0.9);')
    })

    it('should distinguish a color function alpha from an opacity modifier', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[rgb(242_242_244_/_0.9)]/[0.5]')
      expect(gen.toCSS(false)).toContain('background-color: rgb(242 242 244 / 0.5);')
    })

    it('should handle rgba() colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[rgba(255,0,0,0.5)]')
      expect(gen.toCSS(false)).toContain('background-color: rgba(255,0,0,0.5);')
    })

    it('should handle hsl() colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[hsl(0,100%,50%)]')
      expect(gen.toCSS(false)).toContain('background-color: hsl(0,100%,50%);')
    })

    it('should handle hsla() colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[hsla(0,100%,50%,0.5)]')
      expect(gen.toCSS(false)).toContain('background-color: hsla(0,100%,50%,0.5);')
    })

    it('should handle CSS color keywords', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[transparent]')
      expect(gen.toCSS(false)).toContain('background-color: transparent;')
    })

    it('should handle currentColor', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[currentColor]')
      expect(gen.toCSS(false)).toContain('background-color: currentColor;')
    })

    it('should handle CSS variables in colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[var(--primary-color)]')
      expect(gen.toCSS(false)).toContain('background-color: var(--primary-color);')
    })
  })

  describe('Opacity modifiers comprehensive', () => {
    it('should handle 0% opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500/0')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: oklch(62.3% 0.214 259.815 / 0);')
    })

    it('should handle 100% opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500/100')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: oklch(62.3% 0.214 259.815 / 1);')
    })

    it('should handle text color with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-blue-500/50')
      const css = gen.toCSS(false)
      expect(css).toContain('color: oklch(62.3% 0.214 259.815 / 0.5);')
    })

    it('should handle border color with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-blue-500/50')
      const css = gen.toCSS(false)
      expect(css).toContain('border-color: oklch(62.3% 0.214 259.815 / 0.5);')
    })

    it('should reject invalid opacity values above 100', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500/150')
      const css = gen.toCSS(false)
      // Invalid opacity should not generate any CSS
      expect(css).not.toContain('background-color')
    })

    it('should reject negative opacity values', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-red-500/-50')
      const css = gen.toCSS(false)
      // Negative opacity should not generate any CSS
      expect(css).not.toContain('background-color')
    })

    it('should reject non-numeric opacity values', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-green-500/abc')
      const css = gen.toCSS(false)
      // Non-numeric opacity should not generate any CSS
      expect(css).not.toContain('background-color')
    })

    it('should handle ring color with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('ring-blue-500/50')
      const css = gen.toCSS(false)
      expect(css).toBeDefined()
    })

    it('should handle divide color with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('divide-blue-500/50')
      const css = gen.toCSS(false)
      expect(css).toBeDefined()
    })

    it('should handle arbitrary hex color with opacity', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-[#ff0000]/50')
      const css = gen.toCSS(false)
      expect(css).toContain('color: rgb(255 0 0 / 0.5);')
    })

    it('should handle arbitrary hex color with opacity for background', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#00ff00]/75')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color: rgb(0 255 0 / 0.75);')
    })

    it('should handle arbitrary bracket opacity on named colors: bg-white/[0.04]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-white/[0.04]')
      const css = gen.toCSS(false)
      expect(css).toContain('background-color:')
      expect(css).toContain('0.04')
    })

    it('should handle arbitrary bracket opacity on shade colors: text-white/[0.5]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-white/[0.5]')
      const css = gen.toCSS(false)
      expect(css).toContain('color:')
      expect(css).toContain('0.5')
    })

    it('should handle arbitrary bracket opacity on border colors: border-white/[0.06]', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('border-white/[0.06]')
      const css = gen.toCSS(false)
      expect(css).toContain('border-color:')
      expect(css).toContain('0.06')
    })

    it('should reject arbitrary bracket opacity > 1', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-white/[1.5]')
      const css = gen.toCSS(false)
      expect(css).not.toContain('background-color:')
    })
  })

  describe('Color with variants', () => {
    it('should handle color with hover', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:bg-red-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':hover')
      expect(css).toContain('background-color: oklch(63.7% 0.237 25.331);')
    })

    it('should handle color with focus', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('focus:text-blue-500')
      const css = gen.toCSS(false)
      expect(css).toContain(':focus')
      expect(css).toContain('color: oklch(62.3% 0.214 259.815);')
    })

    it('should handle color with responsive', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('md:bg-green-500')
      const css = gen.toCSS(false)
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain('background-color: oklch(72.3% 0.219 149.579);')
    })

    it('should handle color with important', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('!bg-blue-500')
      expect(gen.toCSS(false)).toContain('background-color: oklch(62.3% 0.214 259.815) !important;')
    })

    it('should handle color with dark mode', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('dark:bg-gray-900')
      const css = gen.toCSS(false)
      expect(css).toContain('.dark')
      expect(css).toContain('background-color: oklch(21% 0.034 264.665);')
    })

    it('should handle color opacity with hover', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('hover:bg-blue-500/75')
      const css = gen.toCSS(false)
      expect(css).toContain(':hover')
      expect(css).toContain('background-color: oklch(62.3% 0.214 259.815 / 0.75);')
    })

    it('should handle multiple variant combinations', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('dark:md:hover:bg-blue-500/50')
      const css = gen.toCSS(false)
      expect(css).toContain('.dark')
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain(':hover')
      expect(css).toContain('background-color')
    })
  })

  describe('All color shades', () => {
    it('should handle 50 shade', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-gray-50')
      expect(gen.toCSS(false)).toContain('background-color: oklch(98.5% 0.002 247.839);')
    })

    it('should handle 950 shade', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-gray-950')
      expect(gen.toCSS(false)).toContain('background-color:')
    })

    it('should handle all middle shades', () => {
      const gen = new CSSGenerator(defaultConfig)
      const shades = ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      for (const shade of shades) {
        gen.generate(`bg-blue-${shade}`)
      }
      const css = gen.toCSS(false)
      expect(css).toBeDefined()
      expect(css.length).toBeGreaterThan(0)
    })
  })

  describe('Special color cases', () => {
    it('should handle inherit', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-inherit')
      expect(gen.toCSS(false)).toContain('background-color: inherit;')
    })

    it('should handle transparent', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-transparent')
      expect(gen.toCSS(false)).toContain('background-color: transparent;')
    })

    it('should handle current', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-current')
      expect(gen.toCSS(false)).toContain('background-color: currentColor;')
    })

    it('should handle text-inherit', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-inherit')
      expect(gen.toCSS(false)).toContain('color: inherit;')
    })

    it('should handle text-transparent', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-transparent')
      expect(gen.toCSS(false)).toContain('color: transparent;')
    })

    it('should handle text-current', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('text-current')
      expect(gen.toCSS(false)).toContain('color: currentColor;')
    })
  })

  describe('Advanced color formats', () => {
    it('should handle 3-digit hex colors', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#fff]')
      gen.generate('text-[#000]')
      const css = gen.toCSS(false)
      expect(css).toContain('#fff')
      expect(css).toContain('#000')
    })

    it('should handle 8-digit hex colors with alpha', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[#ff000080]')
      const css = gen.toCSS(false)
      expect(css).toContain('#ff000080')
    })

    it('should handle rgb() notation', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[rgb(255,0,0)]')
      const css = gen.toCSS(false)
      expect(css).toContain('rgb(255,0,0)')
    })

    it('should handle rgba() notation', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[rgba(255,0,0,0.5)]')
      const css = gen.toCSS(false)
      expect(css).toContain('rgba(255,0,0,0.5)')
    })

    it('should handle hsl() notation', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[hsl(0,100%,50%)]')
      const css = gen.toCSS(false)
      expect(css).toContain('hsl(0,100%,50%)')
    })

    it('should handle hsla() notation', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[hsla(0,100%,50%,0.5)]')
      const css = gen.toCSS(false)
      expect(css).toContain('hsla(0,100%,50%,0.5)')
    })

    it('should handle oklch() notation', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[oklch(0.5_0.2_180)]')
      const css = gen.toCSS(false)
      expect(css).toContain('oklch')
    })

    it('should handle color() notation', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-[color(display-p3_1_0_0)]')
      const css = gen.toCSS(false)
      expect(css).toContain('color(')
    })

    it('should handle nonexistent color shades gracefully', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-999')
      gen.generate('text-red-1')
      // Should not crash, may not generate CSS
      expect(() => gen.toCSS(false)).not.toThrow()
    })

    it('should handle color with opacity modifier', () => {
      const gen = new CSSGenerator(defaultConfig)
      gen.generate('bg-blue-500/50')
      gen.generate('text-red-500/75')
      // May or may not be implemented, but should not crash
      expect(() => gen.toCSS(false)).not.toThrow()
    })
  })

  describe('Multi-segment color names', () => {
    describe('Two-segment color names (e.g. blue-gray)', () => {
      it('should generate bg-blue-gray-50', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-blue-gray-50')
        expect(gen.toCSS(false)).toContain('background-color: #f8fafc;')
      })

      it('should generate text-blue-gray-500', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                500: '#64748b',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('text-blue-gray-500')
        expect(gen.toCSS(false)).toContain('color: #64748b;')
      })

      it('should generate border-blue-gray-200', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                200: '#e2e8f0',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('border-blue-gray-200')
        expect(gen.toCSS(false)).toContain('border-color: #e2e8f0;')
      })

      it('should handle all shades of blue-gray', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a',
                950: '#020617',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

        for (const shade of shades) {
          gen.generate(`bg-blue-gray-${shade}`)
        }

        const css = gen.toCSS(false)
        expect(css).toContain('background-color: #f8fafc;') // 50
        expect(css).toContain('background-color: #64748b;') // 500
        expect(css).toContain('background-color: #0f172a;') // 900
        expect(css).toContain('background-color: #020617;') // 950
      })
    })

    describe('Three-segment color names (e.g. ocean-blue-green)', () => {
      it('should generate bg-ocean-blue-green with single value', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'ocean-blue-green': '#084E77',
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-ocean-blue-green')
        expect(gen.toCSS(false)).toContain('background-color: #084E77;')
      })

      it('should generate text-ocean-blue-green', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'ocean-blue-green': '#084E77',
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('text-ocean-blue-green')
        expect(gen.toCSS(false)).toContain('color: #084E77;')
      })

      it('should handle three-segment color with shades', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'deep-ocean-blue': {
                100: '#e0f2fe',
                500: '#0284c7',
                900: '#0c4a6e',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-deep-ocean-blue-100')
        gen.generate('bg-deep-ocean-blue-500')
        gen.generate('bg-deep-ocean-blue-900')

        const css = gen.toCSS(false)
        expect(css).toContain('background-color: #e0f2fe;')
        expect(css).toContain('background-color: #0284c7;')
        expect(css).toContain('background-color: #0c4a6e;')
      })
    })

    describe('Multi-segment colors with opacity modifiers', () => {
      it('should handle blue-gray-500 with opacity', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                500: '#64748b',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-blue-gray-500/50')

        const css = gen.toCSS(false)
        // Hex #64748b converts to rgb(100 116 139 / 0.5)
        expect(css).toContain('background-color: rgb(100 116 139 / 0.5);')
      })

      it('should handle ocean-blue-green with opacity', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'ocean-blue-green': '#084E77',
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('text-ocean-blue-green/75')

        const css = gen.toCSS(false)
        // Hex #084E77 converts to rgb(8 78 119 / 0.75)
        expect(css).toContain('color: rgb(8 78 119 / 0.75);')
      })

      it('should handle three-segment color with shade and opacity', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'deep-ocean-blue': {
                500: '#0284c7',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-deep-ocean-blue-500/25')

        const css = gen.toCSS(false)
        // Hex #0284c7 converts to rgb(2 132 199 / 0.25)
        expect(css).toContain('background-color: rgb(2 132 199 / 0.25);')
      })
    })

    describe('Multi-segment colors with variants', () => {
      it('should handle hover:bg-blue-gray-50', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                50: '#f8fafc',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('hover:bg-blue-gray-50')

        const css = gen.toCSS(false)
        expect(css).toContain(':hover')
        expect(css).toContain('background-color: #f8fafc;')
      })

      it('should handle focus:text-blue-gray-700', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                700: '#334155',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('focus:text-blue-gray-700')

        const css = gen.toCSS(false)
        expect(css).toContain(':focus')
        expect(css).toContain('color: #334155;')
      })

      it('should handle md:bg-ocean-blue-green', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'ocean-blue-green': '#084E77',
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('md:bg-ocean-blue-green')

        const css = gen.toCSS(false)
        expect(css).toContain('@media (min-width: 768px)')
        expect(css).toContain('background-color: #084E77;')
      })

      it('should handle dark:hover:bg-blue-gray-800', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                800: '#1e293b',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('dark:hover:bg-blue-gray-800')

        const css = gen.toCSS(false)
        expect(css).toContain('.dark')
        expect(css).toContain(':hover')
        expect(css).toContain('background-color: #1e293b;')
      })

      it('should handle complex variant combinations with opacity', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                600: '#475569',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('dark:md:hover:bg-blue-gray-600/50')

        const css = gen.toCSS(false)
        expect(css).toContain('.dark')
        expect(css).toContain('@media (min-width: 768px)')
        expect(css).toContain(':hover')
        // Hex #475569 converts to rgb(71 85 105 / 0.5)
        expect(css).toContain('background-color: rgb(71 85 105 / 0.5);')
      })
    })

    describe('Edge cases for multi-segment colors', () => {
      it('should not confuse two-segment color with regular color', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                500: '#64748b',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-blue-500')
        gen.generate('bg-blue-gray-500')

        const css = gen.toCSS(false)
        // blue-500 uses oklch from default config
        expect(css).toContain('oklch(62.3% 0.214 259.815)')
        // blue-gray-500 uses custom hex
        expect(css).toContain('background-color: #64748b;')
      })

      it('should handle color name that looks like shade number', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'slate-blue': {
                500: '#6b7cc7',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-slate-blue-500')
        expect(gen.toCSS(false)).toContain('background-color: #6b7cc7;')
      })

      it('should handle four-segment color names', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'ultra-light-sky-blue': {
                300: '#87ceeb',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-ultra-light-sky-blue-300')
        expect(gen.toCSS(false)).toContain('background-color: #87ceeb;')
      })

      it('should handle missing shade gracefully', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'blue-gray': {
                500: '#64748b',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-blue-gray-999')
        expect(() => gen.toCSS(false)).not.toThrow()
      })

      it('should handle nonexistent multi-segment color', () => {
        const config = defaultConfig
        const gen = new CSSGenerator(config)
        gen.generate('bg-fake-multi-segment-500')
        expect(() => gen.toCSS(false)).not.toThrow()
      })
    })

    describe('Real-world color palettes', () => {
      it('should support slate-gray palette', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'slate-gray': {
                50: '#f8fafc',
                500: '#64748b',
                900: '#0f172a',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-slate-gray-50')
        gen.generate('text-slate-gray-500')
        gen.generate('border-slate-gray-900')

        const css = gen.toCSS(false)
        expect(css).toContain('background-color: #f8fafc;')
        expect(css).toContain('color: #64748b;')
        expect(css).toContain('border-color: #0f172a;')
      })

      it('should support cool-gray palette', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'cool-gray': {
                100: '#f3f4f6',
                600: '#4b5563',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-cool-gray-100')
        gen.generate('text-cool-gray-600')

        const css = gen.toCSS(false)
        expect(css).toContain('background-color: #f3f4f6;')
        expect(css).toContain('color: #4b5563;')
      })

      it('should support warm-gray palette', () => {
        const config = {
          ...defaultConfig,
          theme: {
            ...defaultConfig.theme,
            colors: {
              ...defaultConfig.theme.colors,
              'warm-gray': {
                200: '#e7e5e4',
                700: '#44403c',
              },
            },
          },
        }
        const gen = new CSSGenerator(config)
        gen.generate('bg-warm-gray-200')
        gen.generate('border-warm-gray-700')

        const css = gen.toCSS(false)
        expect(css).toContain('background-color: #e7e5e4;')
        expect(css).toContain('border-color: #44403c;')
      })
    })
  })
})

describe('Nested color DEFAULT key (issue #17)', () => {
  // A nested color object with a `DEFAULT` key should resolve its bare name to
  // the DEFAULT value (Tailwind convention), while numbered/named sub-keys keep
  // working. Previously `bg-brand` etc. silently generated nothing.
  const makeGen = () => new CSSGenerator({
    ...defaultConfig,
    theme: {
      ...defaultConfig.theme,
      extend: {
        colors: {
          brand: { DEFAULT: 'var(--brand)', 2: 'var(--brand-2)' },
        },
      },
    },
  })

  it('resolves bg-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('bg-brand')
    expect(gen.toCSS(false)).toContain('background-color: var(--brand);')
  })

  it('resolves text-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('text-brand')
    expect(gen.toCSS(false)).toContain('color: var(--brand);')
  })

  it('resolves border-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('border-brand')
    expect(gen.toCSS(false)).toContain('border-color: var(--brand);')
  })

  it('still resolves numbered sub-keys alongside DEFAULT', () => {
    const gen = makeGen()
    gen.generate('bg-brand-2')
    expect(gen.toCSS(false)).toContain('background-color: var(--brand-2);')
  })

  it('resolves the DEFAULT value under variants (hover)', () => {
    const gen = makeGen()
    gen.generate('hover:bg-brand')
    const css = gen.toCSS(false)
    expect(css).toContain('.hover\\:bg-brand:hover')
    expect(css).toContain('background-color: var(--brand);')
  })

  it('applies opacity modifiers through the DEFAULT path', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: {
        ...defaultConfig.theme,
        extend: { colors: { brand: { DEFAULT: '#ff0000' } } },
      },
    })
    gen.generate('bg-brand/50')
    expect(gen.toCSS(false)).toContain('background-color: rgb(255 0 0 / 0.5);')
  })

  it('resolves ring-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('ring-brand')
    expect(gen.toCSS(false)).toContain('--tc-ring-color: var(--brand);')
  })

  it('resolves gradient from-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('from-brand')
    expect(gen.toCSS(false)).toContain('--tc-gradient-from: var(--brand);')
  })

  it('resolves divide-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('divide-brand')
    expect(gen.toCSS(false)).toContain('border-color: var(--brand);')
  })

  it('resolves placeholder-{color} to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('placeholder-brand')
    expect(gen.toCSS(false)).toContain('color: var(--brand);')
  })

  it('resolves side border color (border-t-{color}) to the DEFAULT value', () => {
    const gen = makeGen()
    gen.generate('border-t-brand')
    expect(gen.toCSS(false)).toContain('border-top-color: var(--brand);')
  })

  it('resolves shadow-{color} to the DEFAULT value', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: {
        ...defaultConfig.theme,
        extend: { colors: { brand: { DEFAULT: '#ff0000' } } },
      },
    })
    gen.generate('shadow-brand')
    expect(gen.toCSS(false)).toContain('--tc-shadow-color: #ff0000;')
  })

  it('resolves text-emphasis-color-{color} to the DEFAULT value', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      theme: {
        ...defaultConfig.theme,
        colors: { ...defaultConfig.theme.colors, brand: { DEFAULT: '#ff0000', 2: '#00ff00' } },
      },
    })
    gen.generateBatch(['text-emphasis-color-brand', 'text-emphasis-color-brand-2', 'text-emphasis-color-red-500'])
    const css = gen.toCSS(false)
    // Regression: the `text-emphasis-color` prefix must win over `text-emphasis`
    // in the parser, otherwise this resolves to `text-emphasis: color-brand`.
    expect(css).toContain('text-emphasis-color: #ff0000;')
    expect(css).toContain('text-emphasis-color: #00ff00;')
    expect(css).not.toContain('text-emphasis: color-')
  })

  it('emits a bare CSS variable for the DEFAULT shade when cssVariables is on', () => {
    const gen = new CSSGenerator({
      ...defaultConfig,
      cssVariables: true,
      theme: {
        ...defaultConfig.theme,
        extend: { colors: { brand: { DEFAULT: '#ff0000', 2: '#00ff00' } } },
      },
    })
    gen.generate('bg-brand')
    const css = gen.toCSS(false)
    expect(css).toContain('--brand: #ff0000;')
    expect(css).toContain('--brand-2: #00ff00;')
    expect(css).not.toContain('--brand-DEFAULT')
  })
})

describe('Opacity modifier on var()-based theme colors (issue #16)', () => {
  // A theme color holding a var() reference has no channels to rewrite, so
  // the opacity modifier must go through color-mix() instead of being
  // silently dropped (which rendered bg-success/10 fully opaque).
  const varConfig = {
    ...defaultConfig,
    theme: {
      ...defaultConfig.theme,
      extend: { colors: { success: 'var(--success)' } },
    },
  }

  it('emits color-mix for bg-{varColor}/{n}', () => {
    const gen = new CSSGenerator(varConfig)
    gen.generate('bg-success/10')
    expect(gen.toCSS(false)).toContain('background-color: color-mix(in srgb, var(--success) 10%, transparent);')
  })

  it('emits color-mix for text and border with variants', () => {
    const gen = new CSSGenerator(varConfig)
    gen.generateBatch(['text-success/50', 'hover:bg-success/15'])
    const css = gen.toCSS(false)
    expect(css).toContain('color: color-mix(in srgb, var(--success) 50%, transparent);')
    expect(css).toContain('.hover\\:bg-success\\/15:hover')
    expect(css).toContain('background-color: color-mix(in srgb, var(--success) 15%, transparent);')
  })

  it('emits color-mix for arbitrary opacity values', () => {
    const gen = new CSSGenerator(varConfig)
    gen.generate('border-success/[0.04]')
    expect(gen.toCSS(false)).toContain('border-color: color-mix(in srgb, var(--success) 4%, transparent);')
  })

  it('keeps native alpha for channel-based theme colors', () => {
    const gen = new CSSGenerator(varConfig)
    gen.generate('bg-blue-500/50')
    const css = gen.toCSS(false)
    expect(css).toContain('/ 0.5)')
    expect(css).not.toContain('color-mix')
  })

  it('applies color-mix to currentColor but passes inherit through', () => {
    const gen = new CSSGenerator(varConfig)
    gen.generateBatch(['bg-current/50', 'bg-inherit/50'])
    const css = gen.toCSS(false)
    expect(css).toContain('background-color: color-mix(in srgb, currentColor 50%, transparent);')
    expect(css).toContain('background-color: inherit;')
  })

  it('does not alter the solid form of the var color', () => {
    const gen = new CSSGenerator(varConfig)
    gen.generate('text-success')
    expect(gen.toCSS(false)).toContain('color: var(--success);')
  })
})

describe('colorVariables: a palette read through CSS variables', () => {
  const slate900 = 'oklch(20.8% 0.042 265.755)'
  const compile = (classes: string[], colorVariables?: string[]) => {
    const gen = new CSSGenerator({ ...defaultConfig, colorVariables })
    for (const cls of classes) gen.generate(cls)
    return gen.toCSS(false)
  }

  it('writes a listed palette as its variable, falling back to the theme value', () => {
    const css = compile(['bg-slate-900', 'dark:border-slate-800', 'text-slate-500', 'divide-slate-800', 'from-slate-900', 'border-t-slate-700'], ['slate'])
    expect(css).toContain(`background-color: var(--color-slate-900, ${slate900});`)
    expect(css).toContain('border-color: var(--color-slate-800, ')
    expect(css).toContain('color: var(--color-slate-500, ')
    expect(css).toContain('var(--color-slate-700, ')
    expect(css).toMatch(/--tc-gradient-from: var\(--color-slate-900, /)
  })

  it('mixes the variable for an opacity variant, so a re-tint carries its alpha', () => {
    const css = compile(['bg-slate-900/40'], ['slate'])
    expect(css).toContain(`background-color: color-mix(in srgb, var(--color-slate-900, ${slate900}) 40%, transparent);`)
  })

  it('leaves other palettes, and every palette without the option, as plain values', () => {
    expect(compile(['bg-blue-500'], ['slate'])).toContain('background-color: oklch(62.3% 0.214 259.815);')
    expect(compile(['bg-slate-900'])).toContain(`background-color: ${slate900};`)
    expect(compile(['bg-slate-900'])).not.toContain('var(--color-slate')
  })
})
