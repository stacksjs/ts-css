import { expect, test } from 'bun:test'
import { extractClasses } from '../../src/engine/parser'

test('a large inline bundle keeps code classes without treating unrelated attributes as classes', () => {
  const script = Array.from({ length: 32000 }, (_, index) => JSON.stringify(index % 2 ? 'bg-red-500' : 'text-blue-600')).join(',')
  const content = '<script>const styles = [' + script + '];</script>\n<div title="px-99" icon="i-lucide-play" class="flex"></div>'
  expect([...extractClasses(content)].sort()).toEqual(['bg-red-500', 'flex', 'i-lucide-play', 'text-blue-600'])
})

test('markup boundaries inside skipped strings and comments do not leak between scans', () => {
  const content = ["<script>", "const comparison = \"a < b > c\";", "/* <Widget title=\"px-99\"> */", "const style = 'hover:bg-green-500';", "</script>", "<Widget :icon=\"'i-lucide-play'\" title=\"px-99\" className={`text-blue-600`} />"].join('\n')
  const expected = ['hover:bg-green-500', 'i-lucide-play', 'text-blue-600']
  expect([...extractClasses(content)].sort()).toEqual(expected)
  expect([...extractClasses('<div title="px-99" class="flex"></div>')]).toEqual(['flex'])
  expect([...extractClasses(content)].sort()).toEqual(expected)
})
