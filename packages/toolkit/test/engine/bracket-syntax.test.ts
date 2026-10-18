import { describe, expect, it } from 'bun:test'
import { expandBracketSyntax, extractClasses } from '../../src/engine/parser'

describe('Bracket Syntax', () => {
  describe('expandBracketSyntax', () => {
    describe('flex utilities', () => {
      it('should expand flex[col] to flex-col', () => {
        const result = expandBracketSyntax('flex[col]', { enabled: true })
        expect(result).toEqual(['flex-col'])
      })

      it('should expand flex[row] to flex-row', () => {
        const result = expandBracketSyntax('flex[row]', { enabled: true })
        expect(result).toEqual(['flex-row'])
      })

      it('should expand flex[col-reverse] to flex-col-reverse', () => {
        const result = expandBracketSyntax('flex[col-reverse]', { enabled: true })
        expect(result).toEqual(['flex-col-reverse'])
      })

      it('should expand flex[row-reverse] to flex-row-reverse', () => {
        const result = expandBracketSyntax('flex[row-reverse]', { enabled: true })
        expect(result).toEqual(['flex-row-reverse'])
      })

      it('should expand multiple flex values', () => {
        const result = expandBracketSyntax('flex[col row]', { enabled: true })
        expect(result).toEqual(['flex-col', 'flex-row'])
      })

      it('should expand flex with justify-center alias', () => {
        const result = expandBracketSyntax('flex[jc-center]', { enabled: true })
        expect(result).toEqual(['justify-center'])
      })

      it('should expand flex with items-center alias', () => {
        const result = expandBracketSyntax('flex[ai-center]', { enabled: true })
        expect(result).toEqual(['items-center'])
      })

      it('should expand flex with multiple aliases', () => {
        const result = expandBracketSyntax('flex[col jc-center ai-center]', { enabled: true })
        expect(result).toEqual(['flex-col', 'justify-center', 'items-center'])
      })

      it('should expand flex[wrap] to flex-wrap', () => {
        const result = expandBracketSyntax('flex[wrap]', { enabled: true })
        expect(result).toEqual(['flex-wrap'])
      })

      it('should expand flex[nowrap] to flex-nowrap', () => {
        const result = expandBracketSyntax('flex[nowrap]', { enabled: true })
        expect(result).toEqual(['flex-nowrap'])
      })

      it('should expand flex[wrap-reverse] to flex-wrap-reverse', () => {
        const result = expandBracketSyntax('flex[wrap-reverse]', { enabled: true })
        expect(result).toEqual(['flex-wrap-reverse'])
      })

      it('should expand flex[1] to flex-1', () => {
        const result = expandBracketSyntax('flex[1]', { enabled: true })
        expect(result).toEqual(['flex-1'])
      })

      it('should expand flex[grow] to flex-grow', () => {
        const result = expandBracketSyntax('flex[grow]', { enabled: true })
        expect(result).toEqual(['flex-grow'])
      })

      it('should expand flex[shrink] to flex-shrink', () => {
        const result = expandBracketSyntax('flex[shrink]', { enabled: true })
        expect(result).toEqual(['flex-shrink'])
      })

      it('should expand flex[auto] to flex-auto', () => {
        const result = expandBracketSyntax('flex[auto]', { enabled: true })
        expect(result).toEqual(['flex-auto'])
      })

      it('should expand flex[initial] to flex-initial', () => {
        const result = expandBracketSyntax('flex[initial]', { enabled: true })
        expect(result).toEqual(['flex-initial'])
      })

      it('should expand flex[none] to flex-none', () => {
        const result = expandBracketSyntax('flex[none]', { enabled: true })
        expect(result).toEqual(['flex-none'])
      })

      it('should expand complex flex grouping', () => {
        const result = expandBracketSyntax('flex[col wrap jc-between ai-start]', { enabled: true })
        expect(result).toContain('flex-col')
        expect(result).toContain('flex-wrap')
        expect(result).toContain('justify-between')
        expect(result).toContain('items-start')
      })

      it('should use custom aliases', () => {
        const result = expandBracketSyntax('flex[jc-c]', {
          enabled: true,
          aliases: { 'c': 'center' },
        })
        expect(result).toEqual(['justify-center'])
      })
    })

    describe('text utilities', () => {
      it('should expand text[white] to text-white', () => {
        const result = expandBracketSyntax('text[white]', { enabled: true })
        expect(result).toEqual(['text-white'])
      })

      it('should expand text[black] to text-black', () => {
        const result = expandBracketSyntax('text[black]', { enabled: true })
        expect(result).toEqual(['text-black'])
      })

      it('should expand text[red] to the 500 shade (bare text-red resolves to nothing)', () => {
        const result = expandBracketSyntax('text[red]', { enabled: true })
        expect(result).toEqual(['text-red-500'])
      })

      it('should expand text[2rem] to text-[2rem]', () => {
        const result = expandBracketSyntax('text[2rem]', { enabled: true })
        expect(result).toEqual(['text-[2rem]'])
      })

      it('should expand text[16px] to text-[16px]', () => {
        const result = expandBracketSyntax('text[16px]', { enabled: true })
        expect(result).toEqual(['text-[16px]'])
      })

      it('should expand text[1.5em] to text-[1.5em]', () => {
        const result = expandBracketSyntax('text[1.5em]', { enabled: true })
        expect(result).toEqual(['text-[1.5em]'])
      })

      it('should expand text[100] to font-thin', () => {
        const result = expandBracketSyntax('text[100]', { enabled: true })
        expect(result).toEqual(['font-thin'])
      })

      it('should expand text[200] to font-extralight', () => {
        const result = expandBracketSyntax('text[200]', { enabled: true })
        expect(result).toEqual(['font-extralight'])
      })

      it('should expand text[300] to font-light', () => {
        const result = expandBracketSyntax('text[300]', { enabled: true })
        expect(result).toEqual(['font-light'])
      })

      it('should expand text[400] to font-normal', () => {
        const result = expandBracketSyntax('text[400]', { enabled: true })
        expect(result).toEqual(['font-normal'])
      })

      it('should expand text[500] to font-medium', () => {
        const result = expandBracketSyntax('text[500]', { enabled: true })
        expect(result).toEqual(['font-medium'])
      })

      it('should expand text[600] to font-semibold', () => {
        const result = expandBracketSyntax('text[600]', { enabled: true })
        expect(result).toEqual(['font-semibold'])
      })

      it('should expand text[700] to font-bold', () => {
        const result = expandBracketSyntax('text[700]', { enabled: true })
        expect(result).toEqual(['font-bold'])
      })

      it('should expand text[800] to font-extrabold', () => {
        const result = expandBracketSyntax('text[800]', { enabled: true })
        expect(result).toEqual(['font-extrabold'])
      })

      it('should expand text[900] to font-black', () => {
        const result = expandBracketSyntax('text[900]', { enabled: true })
        expect(result).toEqual(['font-black'])
      })

      it('should expand text[arial] to font-[arial]', () => {
        const result = expandBracketSyntax('text[arial]', { enabled: true })
        expect(result).toEqual(['font-[arial]'])
      })

      it('should expand text[helvetica] to font-[helvetica]', () => {
        const result = expandBracketSyntax('text[helvetica]', { enabled: true })
        expect(result).toEqual(['font-[helvetica]'])
      })

      it('should expand complex text grouping', () => {
        const result = expandBracketSyntax('text[arial white 2rem 700]', { enabled: true })
        expect(result).toContain('font-[arial]')
        expect(result).toContain('text-white')
        expect(result).toContain('text-[2rem]')
        expect(result).toContain('font-bold')
      })

      it('should expand text[sm] to text-sm', () => {
        const result = expandBracketSyntax('text[sm]', { enabled: true })
        expect(result).toEqual(['text-sm'])
      })

      it('should expand text[lg] to text-lg', () => {
        const result = expandBracketSyntax('text[lg]', { enabled: true })
        expect(result).toEqual(['text-lg'])
      })

      it('should expand text[xl] to text-xl', () => {
        const result = expandBracketSyntax('text[xl]', { enabled: true })
        expect(result).toEqual(['text-xl'])
      })

      it('should expand text[2xl] to text-2xl', () => {
        const result = expandBracketSyntax('text[2xl]', { enabled: true })
        expect(result).toEqual(['text-2xl'])
      })
    })

    describe('width utilities', () => {
      it('should expand w[full] to w-full', () => {
        const result = expandBracketSyntax('w[full]', { enabled: true })
        expect(result).toEqual(['w-full'])
      })

      it('should expand w[screen] to w-screen', () => {
        const result = expandBracketSyntax('w[screen]', { enabled: true })
        expect(result).toEqual(['w-screen'])
      })

      it('should expand w[auto] to w-auto', () => {
        const result = expandBracketSyntax('w[auto]', { enabled: true })
        expect(result).toEqual(['w-auto'])
      })

      it('should expand w[100%] to w-[100%]', () => {
        const result = expandBracketSyntax('w[100%]', { enabled: true })
        expect(result).toEqual(['w-[100%]'])
      })

      it('should expand w[50%] to w-[50%]', () => {
        const result = expandBracketSyntax('w[50%]', { enabled: true })
        expect(result).toEqual(['w-[50%]'])
      })

      it('should expand w[200px] to w-[200px]', () => {
        const result = expandBracketSyntax('w[200px]', { enabled: true })
        expect(result).toEqual(['w-[200px]'])
      })

      it('should expand w[min 200px] to min-w-[200px]', () => {
        const result = expandBracketSyntax('w[min 200px]', { enabled: true })
        expect(result).toEqual(['min-w-[200px]'])
      })

      it('should expand w[max 500px] to max-w-[500px]', () => {
        const result = expandBracketSyntax('w[max 500px]', { enabled: true })
        expect(result).toEqual(['max-w-[500px]'])
      })

      it('should expand w[min full] to min-w-full', () => {
        const result = expandBracketSyntax('w[min full]', { enabled: true })
        expect(result).toEqual(['min-w-full'])
      })

      it('should expand w[max screen] to max-w-screen', () => {
        const result = expandBracketSyntax('w[max screen]', { enabled: true })
        expect(result).toEqual(['max-w-screen'])
      })
    })

    describe('height utilities', () => {
      it('should expand h[full] to h-full', () => {
        const result = expandBracketSyntax('h[full]', { enabled: true })
        expect(result).toEqual(['h-full'])
      })

      it('should expand h[screen] to h-screen', () => {
        const result = expandBracketSyntax('h[screen]', { enabled: true })
        expect(result).toEqual(['h-screen'])
      })

      it('should expand h[100vh] to h-[100vh]', () => {
        const result = expandBracketSyntax('h[100vh]', { enabled: true })
        expect(result).toEqual(['h-[100vh]'])
      })

      it('should expand h[min 100vh] to min-h-[100vh]', () => {
        const result = expandBracketSyntax('h[min 100vh]', { enabled: true })
        expect(result).toEqual(['min-h-[100vh]'])
      })

      it('should expand h[max 500px] to max-h-[500px]', () => {
        const result = expandBracketSyntax('h[max 500px]', { enabled: true })
        expect(result).toEqual(['max-h-[500px]'])
      })

      it('should expand h[min screen] to min-h-screen', () => {
        const result = expandBracketSyntax('h[min screen]', { enabled: true })
        expect(result).toEqual(['min-h-screen'])
      })

      it('should expand h[max full] to max-h-full', () => {
        const result = expandBracketSyntax('h[max full]', { enabled: true })
        expect(result).toEqual(['max-h-full'])
      })
    })

    describe('scroll utilities', () => {
      it('should expand scroll[y auto] to overflow-y-auto', () => {
        const result = expandBracketSyntax('scroll[y auto]', { enabled: true })
        expect(result).toEqual(['overflow-y-auto'])
      })

      it('should expand scroll[x auto] to overflow-x-auto', () => {
        const result = expandBracketSyntax('scroll[x auto]', { enabled: true })
        expect(result).toEqual(['overflow-x-auto'])
      })

      it('should expand scroll[y hidden] to overflow-y-hidden', () => {
        const result = expandBracketSyntax('scroll[y hidden]', { enabled: true })
        expect(result).toEqual(['overflow-y-hidden'])
      })

      it('should expand scroll[x hidden] to overflow-x-hidden', () => {
        const result = expandBracketSyntax('scroll[x hidden]', { enabled: true })
        expect(result).toEqual(['overflow-x-hidden'])
      })

      it('should expand scroll[y scroll] to overflow-y-scroll', () => {
        const result = expandBracketSyntax('scroll[y scroll]', { enabled: true })
        expect(result).toEqual(['overflow-y-scroll'])
      })

      it('should expand scroll[y visible] to overflow-y-visible', () => {
        const result = expandBracketSyntax('scroll[y visible]', { enabled: true })
        expect(result).toEqual(['overflow-y-visible'])
      })
    })

    describe('background utilities', () => {
      it('should expand bg[black] to bg-black', () => {
        const result = expandBracketSyntax('bg[black]', { enabled: true })
        expect(result).toEqual(['bg-black'])
      })

      it('should expand bg[white] to bg-white', () => {
        const result = expandBracketSyntax('bg[white]', { enabled: true })
        expect(result).toEqual(['bg-white'])
      })

      it('should expand bg[blue-500] to bg-blue-500', () => {
        const result = expandBracketSyntax('bg[blue-500]', { enabled: true })
        expect(result).toEqual(['bg-blue-500'])
      })

      it('should expand bg[red-500] to bg-red-500', () => {
        const result = expandBracketSyntax('bg[red-500]', { enabled: true })
        expect(result).toEqual(['bg-red-500'])
      })

      it('should expand bg[transparent] to bg-transparent', () => {
        const result = expandBracketSyntax('bg[transparent]', { enabled: true })
        expect(result).toEqual(['bg-transparent'])
      })
    })

    describe('grid utilities', () => {
      it('should expand grid[cols-3] to grid-cols-3', () => {
        const result = expandBracketSyntax('grid[cols-3]', { enabled: true })
        expect(result).toEqual(['grid-cols-3'])
      })

      it('should expand grid[cols-12] to grid-cols-12', () => {
        const result = expandBracketSyntax('grid[cols-12]', { enabled: true })
        expect(result).toEqual(['grid-cols-12'])
      })

      it('should expand grid[rows-2] to grid-rows-2', () => {
        const result = expandBracketSyntax('grid[rows-2]', { enabled: true })
        expect(result).toEqual(['grid-rows-2'])
      })

      it('should expand grid[rows-6] to grid-rows-6', () => {
        const result = expandBracketSyntax('grid[rows-6]', { enabled: true })
        expect(result).toEqual(['grid-rows-6'])
      })

      it('should expand grid[flow-row] to grid-flow-row', () => {
        const result = expandBracketSyntax('grid[flow-row]', { enabled: true })
        expect(result).toEqual(['grid-flow-row'])
      })

      it('should expand grid[flow-col] to grid-flow-col', () => {
        const result = expandBracketSyntax('grid[flow-col]', { enabled: true })
        expect(result).toEqual(['grid-flow-col'])
      })

      it('should expand grid[flow-dense] to grid-flow-dense', () => {
        const result = expandBracketSyntax('grid[flow-dense]', { enabled: true })
        expect(result).toEqual(['grid-flow-dense'])
      })
    })

    describe('padding utilities', () => {
      it('should expand p[4] to p-4', () => {
        const result = expandBracketSyntax('p[4]', { enabled: true })
        expect(result).toEqual(['p-4'])
      })

      it('should expand p[8] to p-8', () => {
        const result = expandBracketSyntax('p[8]', { enabled: true })
        expect(result).toEqual(['p-8'])
      })

      it('should expand p[2 4] to p-2 p-4', () => {
        const result = expandBracketSyntax('p[2 4]', { enabled: true })
        expect(result).toEqual(['p-2', 'p-4'])
      })
    })

    describe('margin utilities', () => {
      it('should expand m[4] to m-4', () => {
        const result = expandBracketSyntax('m[4]', { enabled: true })
        expect(result).toEqual(['m-4'])
      })

      it('should expand m[auto] to m-auto', () => {
        const result = expandBracketSyntax('m[auto]', { enabled: true })
        expect(result).toEqual(['m-auto'])
      })
    })

    describe('other utilities', () => {
      it('should expand border[2] to border-2', () => {
        const result = expandBracketSyntax('border[2]', { enabled: true })
        expect(result).toEqual(['border-2'])
      })

      it('should expand rounded[lg] to rounded-lg', () => {
        const result = expandBracketSyntax('rounded[lg]', { enabled: true })
        expect(result).toEqual(['rounded-lg'])
      })

      it('should expand shadow[md] to shadow-md', () => {
        const result = expandBracketSyntax('shadow[md]', { enabled: true })
        expect(result).toEqual(['shadow-md'])
      })

      it('should expand gap[4] to gap-4', () => {
        const result = expandBracketSyntax('gap[4]', { enabled: true })
        expect(result).toEqual(['gap-4'])
      })

      it('should expand space[x-4] to space-x-4', () => {
        const result = expandBracketSyntax('space[x-4]', { enabled: true })
        expect(result).toEqual(['space-x-4'])
      })
    })

    describe('colon syntax', () => {
      it('should expand bg:black to bg-black when colonSyntax is enabled', () => {
        const result = expandBracketSyntax('bg:black', { enabled: true, colonSyntax: true })
        expect(result).toEqual(['bg-black'])
      })

      it('should expand w:100% to w-[100%] when colonSyntax is enabled', () => {
        const result = expandBracketSyntax('w:100%', { enabled: true, colonSyntax: true })
        expect(result).toEqual(['w-[100%]'])
      })

      it('should expand text:white to text-white when colonSyntax is enabled', () => {
        const result = expandBracketSyntax('text:white', { enabled: true, colonSyntax: true })
        expect(result).toEqual(['text-white'])
      })

      it('should expand p:4 to p-4 when colonSyntax is enabled', () => {
        const result = expandBracketSyntax('p:4', { enabled: true, colonSyntax: true })
        expect(result).toEqual(['p-4'])
      })

      it('should expand m:auto to m-auto when colonSyntax is enabled', () => {
        const result = expandBracketSyntax('m:auto', { enabled: true, colonSyntax: true })
        expect(result).toEqual(['m-auto'])
      })

      it('should expand h:100vh to h-[100vh] when colonSyntax is enabled', () => {
        const result = expandBracketSyntax('h:100vh', { enabled: true, colonSyntax: true })
        expect(result).toEqual(['h-[100vh]'])
      })

      it('should NOT expand bg:black when colonSyntax is disabled', () => {
        const result = expandBracketSyntax('bg:black', { enabled: true, colonSyntax: false })
        expect(result).toEqual(['bg:black'])
      })

      it('should NOT expand bg:black when colonSyntax is undefined', () => {
        const result = expandBracketSyntax('bg:black', { enabled: true })
        expect(result).toEqual(['bg:black'])
      })
    })

    describe('generic utilities', () => {
      it('should expand unknown prefix with generic pattern', () => {
        const result = expandBracketSyntax('custom[a b c]', { enabled: true })
        expect(result).toEqual(['custom-a', 'custom-b', 'custom-c'])
      })

      it('should handle arbitrary values in generic pattern', () => {
        const result = expandBracketSyntax('custom[10px 20%]', { enabled: true })
        expect(result).toEqual(['custom-[10px]', 'custom-[20%]'])
      })

      it('should handle mixed values in generic pattern', () => {
        const result = expandBracketSyntax('custom[solid 2px]', { enabled: true })
        expect(result).toEqual(['custom-solid', 'custom-[2px]'])
      })
    })

    describe('no expansion needed', () => {
      it('should return class as-is when no bracket syntax', () => {
        const result = expandBracketSyntax('flex', { enabled: true })
        expect(result).toEqual(['flex'])
      })

      it('should return class as-is for standard tailwind classes', () => {
        const result = expandBracketSyntax('bg-blue-500', { enabled: true })
        expect(result).toEqual(['bg-blue-500'])
      })

      it('should return class as-is for arbitrary value syntax', () => {
        const result = expandBracketSyntax('w-[100px]', { enabled: true })
        expect(result).toEqual(['w-[100px]'])
      })

      it('should return class as-is for variant classes', () => {
        const result = expandBracketSyntax('hover:bg-blue-500', { enabled: true })
        expect(result).toEqual(['hover:bg-blue-500'])
      })
    })

    describe('edge cases', () => {
      it('should handle empty brackets', () => {
        const result = expandBracketSyntax('flex[]', { enabled: true })
        expect(result).toEqual([])
      })

      it('should handle single space in brackets', () => {
        const result = expandBracketSyntax('flex[ ]', { enabled: true })
        expect(result).toEqual([])
      })

      it('should handle multiple spaces between values', () => {
        const result = expandBracketSyntax('flex[col  row]', { enabled: true })
        expect(result).toEqual(['flex-col', 'flex-row'])
      })

      it('should handle leading/trailing spaces in brackets', () => {
        const result = expandBracketSyntax('flex[ col row ]', { enabled: true })
        expect(result).toEqual(['flex-col', 'flex-row'])
      })
    })

    describe('new utility mappings', () => {
      it('should expand font[bold] to font-bold', () => {
        const result = expandBracketSyntax('font[bold]', { enabled: true })
        expect(result).toEqual(['font-bold'])
      })

      it('should expand font[sans serif mono] to multiple font utilities', () => {
        const result = expandBracketSyntax('font[sans serif mono]', { enabled: true })
        expect(result).toEqual(['font-sans', 'font-serif', 'font-mono'])
      })

      it('should expand font[700] to font-bold', () => {
        const result = expandBracketSyntax('font[700]', { enabled: true })
        expect(result).toEqual(['font-bold'])
      })

      it('should expand opacity[50] to opacity-50', () => {
        const result = expandBracketSyntax('opacity[50]', { enabled: true })
        expect(result).toEqual(['opacity-50'])
      })

      it('should expand z[10] to z-10', () => {
        const result = expandBracketSyntax('z[10]', { enabled: true })
        expect(result).toEqual(['z-10'])
      })

      it('should expand inset[0] to inset-0', () => {
        const result = expandBracketSyntax('inset[0]', { enabled: true })
        expect(result).toEqual(['inset-0'])
      })

      it('should expand inset[x-0 y-auto] to inset-x-0 and inset-y-auto', () => {
        const result = expandBracketSyntax('inset[x-0 y-auto]', { enabled: true })
        expect(result).toEqual(['inset-x-0', 'inset-y-auto'])
      })

      it('should expand top[0] to top-0', () => {
        const result = expandBracketSyntax('top[0]', { enabled: true })
        expect(result).toEqual(['top-0'])
      })

      it('should expand top[50%] to top-[50%]', () => {
        const result = expandBracketSyntax('top[50%]', { enabled: true })
        expect(result).toEqual(['top-[50%]'])
      })

      it('should expand duration[300] to duration-300', () => {
        const result = expandBracketSyntax('duration[300]', { enabled: true })
        expect(result).toEqual(['duration-300'])
      })

      it('should expand delay[150] to delay-150', () => {
        const result = expandBracketSyntax('delay[150]', { enabled: true })
        expect(result).toEqual(['delay-150'])
      })

      it('should expand ease[in-out] to ease-in-out', () => {
        const result = expandBracketSyntax('ease[in-out]', { enabled: true })
        expect(result).toEqual(['ease-in-out'])
      })

      it('should expand translate[x-4] to translate-x-4', () => {
        const result = expandBracketSyntax('translate[x-4]', { enabled: true })
        expect(result).toEqual(['translate-x-4'])
      })

      it('should expand translate[x-4 y-2] to translate-x-4 and translate-y-2', () => {
        const result = expandBracketSyntax('translate[x-4 y-2]', { enabled: true })
        expect(result).toEqual(['translate-x-4', 'translate-y-2'])
      })

      it('should expand rotate[45] to rotate-45', () => {
        const result = expandBracketSyntax('rotate[45]', { enabled: true })
        expect(result).toEqual(['rotate-45'])
      })

      it('should expand scale[75] to scale-75', () => {
        const result = expandBracketSyntax('scale[75]', { enabled: true })
        expect(result).toEqual(['scale-75'])
      })

      it('should expand scale[x-50 y-100] to scale-x-50 and scale-y-100', () => {
        const result = expandBracketSyntax('scale[x-50 y-100]', { enabled: true })
        expect(result).toEqual(['scale-x-50', 'scale-y-100'])
      })

      it('should expand cursor[pointer] to cursor-pointer', () => {
        const result = expandBracketSyntax('cursor[pointer]', { enabled: true })
        expect(result).toEqual(['cursor-pointer'])
      })

      it('should expand ring[2] to ring-2', () => {
        const result = expandBracketSyntax('ring[2]', { enabled: true })
        expect(result).toEqual(['ring-2'])
      })

      it('should expand blur[md] to blur-md', () => {
        const result = expandBracketSyntax('blur[md]', { enabled: true })
        expect(result).toEqual(['blur-md'])
      })

      it('should expand aspect[video] to aspect-video', () => {
        const result = expandBracketSyntax('aspect[video]', { enabled: true })
        expect(result).toEqual(['aspect-video'])
      })

      it('should expand tracking[wide] to tracking-wide', () => {
        const result = expandBracketSyntax('tracking[wide]', { enabled: true })
        expect(result).toEqual(['tracking-wide'])
      })

      it('should expand leading[loose] to leading-loose', () => {
        const result = expandBracketSyntax('leading[loose]', { enabled: true })
        expect(result).toEqual(['leading-loose'])
      })
    })

    describe('variant support in bracket syntax', () => {
      it('should expand hover:flex[col] to hover:flex-col', () => {
        const result = expandBracketSyntax('hover:flex[col]', { enabled: true })
        expect(result).toEqual(['hover:flex-col'])
      })

      it('should expand hover:bg[blue-500] to hover:bg-blue-500', () => {
        const result = expandBracketSyntax('hover:bg[blue-500]', { enabled: true })
        expect(result).toEqual(['hover:bg-blue-500'])
      })

      it('should expand dark:text[white] to dark:text-white', () => {
        const result = expandBracketSyntax('dark:text[white]', { enabled: true })
        expect(result).toEqual(['dark:text-white'])
      })

      it('should expand focus:ring[2] to focus:ring-2', () => {
        const result = expandBracketSyntax('focus:ring[2]', { enabled: true })
        expect(result).toEqual(['focus:ring-2'])
      })

      it('should expand dark:hover:bg[gray-800] to dark:hover:bg-gray-800', () => {
        const result = expandBracketSyntax('dark:hover:bg[gray-800]', { enabled: true })
        expect(result).toEqual(['dark:hover:bg-gray-800'])
      })

      it('should expand sm:flex[col] to sm:flex-col', () => {
        const result = expandBracketSyntax('sm:flex[col]', { enabled: true })
        expect(result).toEqual(['sm:flex-col'])
      })

      it('should expand md:lg:flex[row] to md:lg:flex-row', () => {
        const result = expandBracketSyntax('md:lg:flex[row]', { enabled: true })
        expect(result).toEqual(['md:lg:flex-row'])
      })

      it('should expand hover:flex[col jc-center] to multiple hover classes', () => {
        const result = expandBracketSyntax('hover:flex[col jc-center]', { enabled: true })
        expect(result).toEqual(['hover:flex-col', 'hover:justify-center'])
      })
    })

    describe('responsive variants inside brackets', () => {
      it('should expand flex[md:col] to md:flex-col', () => {
        const result = expandBracketSyntax('flex[md:col]', { enabled: true })
        expect(result).toEqual(['md:flex-col'])
      })

      it('should expand flex[col md:row] to flex-col and md:flex-row', () => {
        const result = expandBracketSyntax('flex[col md:row]', { enabled: true })
        expect(result).toEqual(['flex-col', 'md:flex-row'])
      })

      it('should expand flex[sm:col md:row lg:col-reverse] to multiple', () => {
        const result = expandBracketSyntax('flex[sm:col md:row lg:col-reverse]', { enabled: true })
        expect(result).toEqual(['sm:flex-col', 'md:flex-row', 'lg:flex-col-reverse'])
      })

      it('should expand text[sm md:lg lg:xl] with responsive variants', () => {
        const result = expandBracketSyntax('text[sm md:lg lg:xl]', { enabled: true })
        expect(result).toEqual(['text-sm', 'md:text-lg', 'lg:text-xl'])
      })

      it('should expand bg[gray-100 dark:gray-900] with dark mode', () => {
        const result = expandBracketSyntax('bg[gray-100 dark:gray-900]', { enabled: true })
        expect(result).toEqual(['bg-gray-100', 'dark:bg-gray-900'])
      })

      it('should expand p[4 hover:6] with state variant', () => {
        const result = expandBracketSyntax('p[4 hover:6]', { enabled: true })
        expect(result).toEqual(['p-4', 'hover:p-6'])
      })
    })

    describe('negative value support', () => {
      it('should expand -m[4] to -m-4', () => {
        const result = expandBracketSyntax('-m[4]', { enabled: true })
        expect(result).toEqual(['-m-4'])
      })

      it('should expand m[-4] to -m-4', () => {
        const result = expandBracketSyntax('m[-4]', { enabled: true })
        expect(result).toEqual(['-m-4'])
      })

      it('should expand -mt[2] to -mt-2', () => {
        const result = expandBracketSyntax('-mt[2]', { enabled: true })
        expect(result).toEqual(['-mt-2'])
      })

      it('should expand translate[-x-4] to -translate-x-4', () => {
        const result = expandBracketSyntax('translate[-x-4]', { enabled: true })
        expect(result).toEqual(['-translate-x-4'])
      })

      it('should expand -translate[x-4] to -translate-x-4', () => {
        const result = expandBracketSyntax('-translate[x-4]', { enabled: true })
        expect(result).toEqual(['-translate-x-4'])
      })

      it('should expand top[-4] to -top-4', () => {
        const result = expandBracketSyntax('top[-4]', { enabled: true })
        expect(result).toEqual(['-top-4'])
      })

      it('should expand inset[-2] to -inset-2', () => {
        const result = expandBracketSyntax('inset[-2]', { enabled: true })
        expect(result).toEqual(['-inset-2'])
      })

      it('should expand m[4 -2] to m-4 and -m-2', () => {
        const result = expandBracketSyntax('m[4 -2]', { enabled: true })
        expect(result).toEqual(['m-4', '-m-2'])
      })
    })

    describe('directional padding/margin utilities', () => {
      it('should expand px[4] to px-4', () => {
        const result = expandBracketSyntax('px[4]', { enabled: true })
        expect(result).toEqual(['px-4'])
      })

      it('should expand py[2 4] to py-2 and py-4', () => {
        const result = expandBracketSyntax('py[2 4]', { enabled: true })
        expect(result).toEqual(['py-2', 'py-4'])
      })

      it('should expand mx[auto] to mx-auto', () => {
        const result = expandBracketSyntax('mx[auto]', { enabled: true })
        expect(result).toEqual(['mx-auto'])
      })

      it('should expand mt[4] to mt-4', () => {
        const result = expandBracketSyntax('mt[4]', { enabled: true })
        expect(result).toEqual(['mt-4'])
      })

      it('should expand mb[8] to mb-8', () => {
        const result = expandBracketSyntax('mb[8]', { enabled: true })
        expect(result).toEqual(['mb-8'])
      })
    })

    describe('overflow utilities', () => {
      it('should expand overflow[hidden] to overflow-hidden', () => {
        const result = expandBracketSyntax('overflow[hidden]', { enabled: true })
        expect(result).toEqual(['overflow-hidden'])
      })

      it('should expand overflow[x auto] to overflow-x-auto', () => {
        const result = expandBracketSyntax('overflow[x auto]', { enabled: true })
        expect(result).toEqual(['overflow-x-auto'])
      })

      it('should expand overflow[y scroll] to overflow-y-scroll', () => {
        const result = expandBracketSyntax('overflow[y scroll]', { enabled: true })
        expect(result).toEqual(['overflow-y-scroll'])
      })
    })
  })

  describe('extractClasses with bracket syntax', () => {
    it('should extract and expand bracket syntax classes', () => {
      const html = '<div class="flex[col jc-center] bg:black"></div>'
      const result = extractClasses(html, {
        bracketSyntax: { enabled: true, colonSyntax: true },
      })
      expect(result.has('flex-col')).toBe(true)
      expect(result.has('justify-center')).toBe(true)
      expect(result.has('bg-black')).toBe(true)
    })

    it('should handle complex example correctly', () => {
      const html = `
        <main class="reset:meyer">
          <div class="flex[col jc-center ai-center] bg:black w:100% h[min 100vh] scroll[y auto]">
            <p class="text[arial white 2rem 700]">Hello ts-css!</p>
          </div>
        </main>
      `
      const result = extractClasses(html, {
        bracketSyntax: { enabled: true, colonSyntax: true },
      })

      // flex[col jc-center ai-center]
      expect(result.has('flex-col')).toBe(true)
      expect(result.has('justify-center')).toBe(true)
      expect(result.has('items-center')).toBe(true)

      // bg:black
      expect(result.has('bg-black')).toBe(true)

      // w:100%
      expect(result.has('w-[100%]')).toBe(true)

      // h[min 100vh]
      expect(result.has('min-h-[100vh]')).toBe(true)

      // scroll[y auto]
      expect(result.has('overflow-y-auto')).toBe(true)

      // text[arial white 2rem 700]
      expect(result.has('font-[arial]')).toBe(true)
      expect(result.has('text-white')).toBe(true)
      expect(result.has('text-[2rem]')).toBe(true)
      expect(result.has('font-bold')).toBe(true)

      // reset:meyer (colon syntax)
      expect(result.has('reset-meyer')).toBe(true)
    })

    it('should work with mixed regular and bracket syntax', () => {
      const html = '<div class="flex items-center flex[col] p-4"></div>'
      const result = extractClasses(html, {
        bracketSyntax: { enabled: true },
      })
      expect(result.has('flex')).toBe(true)
      expect(result.has('items-center')).toBe(true)
      expect(result.has('flex-col')).toBe(true)
      expect(result.has('p-4')).toBe(true)
    })

    it('should work with className in JSX', () => {
      const jsx = '<div className="flex[col jc-center] p-4"></div>'
      const result = extractClasses(jsx, {
        bracketSyntax: { enabled: true },
      })
      expect(result.has('flex-col')).toBe(true)
      expect(result.has('justify-center')).toBe(true)
      expect(result.has('p-4')).toBe(true)
    })

    it('should work with template literals', () => {
      const jsx = '<div className={`flex[col] p-4`}></div>'
      const result = extractClasses(jsx, {
        bracketSyntax: { enabled: true },
      })
      expect(result.has('flex-col')).toBe(true)
      expect(result.has('p-4')).toBe(true)
    })

    it('should not expand bracket syntax when disabled', () => {
      const html = '<div class="flex[col]"></div>'
      const result = extractClasses(html)
      // When disabled, it should not extract the bracket syntax as valid class
      expect(result.has('flex-col')).toBe(false)
    })

    it('should handle multiple elements with bracket syntax', () => {
      const html = `
        <div class="flex[col] p-4">
          <span class="text[white 2rem]">Title</span>
          <p class="bg[gray-100] m[4]">Content</p>
        </div>
      `
      const result = extractClasses(html, {
        bracketSyntax: { enabled: true },
      })
      expect(result.has('flex-col')).toBe(true)
      expect(result.has('p-4')).toBe(true)
      expect(result.has('text-white')).toBe(true)
      expect(result.has('text-[2rem]')).toBe(true)
      expect(result.has('bg-gray-100')).toBe(true)
      expect(result.has('m-4')).toBe(true)
    })

    it('should preserve arbitrary values alongside bracket syntax', () => {
      const html = '<div class="w-[calc(100%-20px)] flex[col]"></div>'
      const result = extractClasses(html, {
        bracketSyntax: { enabled: true },
      })
      expect(result.has('w-[calc(100%-20px)]')).toBe(true)
      expect(result.has('flex-col')).toBe(true)
    })

    it('should preserve variants with bracket syntax', () => {
      const html = '<div class="hover:bg-blue-500 flex[col]"></div>'
      const result = extractClasses(html, {
        bracketSyntax: { enabled: true },
      })
      expect(result.has('hover:bg-blue-500')).toBe(true)
      expect(result.has('flex-col')).toBe(true)
    })
  })

  describe('filter utility mappings', () => {
    it('should expand invert[0] to invert-0', () => {
      const result = expandBracketSyntax('invert[0]', { enabled: true })
      expect(result).toEqual(['invert-0'])
    })

    it('should expand invert[100] to invert-100', () => {
      const result = expandBracketSyntax('invert[100]', { enabled: true })
      expect(result).toEqual(['invert-100'])
    })

    it('should expand hue-rotate[90] to hue-rotate-90', () => {
      const result = expandBracketSyntax('hue-rotate[90]', { enabled: true })
      expect(result).toEqual(['hue-rotate-90'])
    })

    it('should expand hue-rotate[45deg] to hue-rotate-45deg', () => {
      const result = expandBracketSyntax('hue-rotate[45deg]', { enabled: true })
      expect(result).toEqual(['hue-rotate-45deg'])
    })

    it('should expand drop-shadow[lg] to drop-shadow-lg', () => {
      const result = expandBracketSyntax('drop-shadow[lg]', { enabled: true })
      expect(result).toEqual(['drop-shadow-lg'])
    })

    it('should expand drop-shadow[md xl] to multiple', () => {
      const result = expandBracketSyntax('drop-shadow[md xl]', { enabled: true })
      expect(result).toEqual(['drop-shadow-md', 'drop-shadow-xl'])
    })

    it('should expand backdrop-invert[0] to backdrop-invert-0', () => {
      const result = expandBracketSyntax('backdrop-invert[0]', { enabled: true })
      expect(result).toEqual(['backdrop-invert-0'])
    })

    it('should expand backdrop-hue-rotate[180deg] to backdrop-hue-rotate-180deg', () => {
      const result = expandBracketSyntax('backdrop-hue-rotate[180deg]', { enabled: true })
      expect(result).toEqual(['backdrop-hue-rotate-180deg'])
    })

    it('should expand animate[spin] to animate-spin', () => {
      const result = expandBracketSyntax('animate[spin]', { enabled: true })
      expect(result).toEqual(['animate-spin'])
    })

    it('should expand animate[bounce ping] to multiple', () => {
      const result = expandBracketSyntax('animate[bounce ping]', { enabled: true })
      expect(result).toEqual(['animate-bounce', 'animate-ping'])
    })
  })

  describe('transition utilities', () => {
    it('should expand transition[all 300 ease-in-out] correctly', () => {
      const result = expandBracketSyntax('transition[all 300 ease-in-out]', { enabled: true })
      expect(result).toEqual(['transition-all', 'duration-300', 'ease-in-out'])
    })

    it('should expand transition[colors 150 linear]', () => {
      const result = expandBracketSyntax('transition[colors 150 linear]', { enabled: true })
      expect(result).toEqual(['transition-colors', 'duration-150', 'ease-linear'])
    })

    it('should expand transition[opacity] to transition-opacity', () => {
      const result = expandBracketSyntax('transition[opacity]', { enabled: true })
      expect(result).toEqual(['transition-opacity'])
    })

    it('should expand transition[transform 200] correctly', () => {
      const result = expandBracketSyntax('transition[transform 200]', { enabled: true })
      expect(result).toEqual(['transition-transform', 'duration-200'])
    })
  })

  describe('important modifier', () => {
    it('should expand p[4!] to !p-4', () => {
      const result = expandBracketSyntax('p[4!]', { enabled: true })
      expect(result).toEqual(['!p-4'])
    })

    it('should expand m[2! 4] to !m-2 and m-4', () => {
      const result = expandBracketSyntax('m[2! 4]', { enabled: true })
      expect(result).toEqual(['!m-2', 'm-4'])
    })

    it('should expand bg[blue-500!] to !bg-blue-500', () => {
      const result = expandBracketSyntax('bg[blue-500!]', { enabled: true })
      expect(result).toEqual(['!bg-blue-500'])
    })

    it('should handle important with variant hover:p[4!]', () => {
      const result = expandBracketSyntax('hover:p[4!]', { enabled: true })
      expect(result).toEqual(['hover:!p-4'])
    })

    it('should handle important with negative m[-4!]', () => {
      const result = expandBracketSyntax('m[-4!]', { enabled: true })
      expect(result).toEqual(['!-m-4'])
    })

    it('should handle important with variant and negative hover:m[-2!]', () => {
      const result = expandBracketSyntax('hover:m[-2!]', { enabled: true })
      expect(result).toEqual(['hover:!-m-2'])
    })
  })

  describe('opacity modifier in grouped syntax', () => {
    it('should expand bg[blue-500/50] to bg-blue-500/50', () => {
      const result = expandBracketSyntax('bg[blue-500/50]', { enabled: true })
      expect(result).toEqual(['bg-blue-500/50'])
    })

    it('should expand text[white/80] to text-white/80', () => {
      const result = expandBracketSyntax('text[white/80]', { enabled: true })
      expect(result).toEqual(['text-white/80'])
    })

    it('should expand border[gray-300/50] to border-gray-300/50', () => {
      const result = expandBracketSyntax('border[gray-300/50]', { enabled: true })
      expect(result).toEqual(['border-gray-300/50'])
    })
  })

  describe('space and gap utilities', () => {
    it('should expand space[x-4 y-2] correctly', () => {
      const result = expandBracketSyntax('space[x-4 y-2]', { enabled: true })
      expect(result).toEqual(['space-x-4', 'space-y-2'])
    })

    it('should expand gap[x-4 y-2] correctly', () => {
      const result = expandBracketSyntax('gap[x-4 y-2]', { enabled: true })
      expect(result).toEqual(['gap-x-4', 'gap-y-2'])
    })

    it('should expand gap[4] to gap-4', () => {
      const result = expandBracketSyntax('gap[4]', { enabled: true })
      expect(result).toEqual(['gap-4'])
    })
  })

  describe('inset utilities', () => {
    it('should expand inset[x-0 y-auto] correctly', () => {
      const result = expandBracketSyntax('inset[x-0 y-auto]', { enabled: true })
      expect(result).toEqual(['inset-x-0', 'inset-y-auto'])
    })

    it('should expand inset[0] to inset-0', () => {
      const result = expandBracketSyntax('inset[0]', { enabled: true })
      expect(result).toEqual(['inset-0'])
    })
  })

  describe('ring utilities', () => {
    it('should expand ring[2 blue-500 offset-2] correctly', () => {
      const result = expandBracketSyntax('ring[2 blue-500 offset-2]', { enabled: true })
      expect(result).toEqual(['ring-2', 'ring-blue-500', 'ring-offset-2'])
    })

    it('should expand ring[4 inset] correctly', () => {
      const result = expandBracketSyntax('ring[4 inset]', { enabled: true })
      expect(result).toEqual(['ring-4', 'ring-inset'])
    })
  })
})
