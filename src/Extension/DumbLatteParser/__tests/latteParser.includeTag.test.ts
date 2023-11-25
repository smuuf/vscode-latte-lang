import IncludeTag from '../Tags/IncludeTag'
import { parseLatte } from '../latteParser'

const EXPECTATIONS: object = {
	'{include file-a.latte}': ['file-a.latte', '/base-dir/file-a.latte'],
	"{include 'file-a.latte'}": ['file-a.latte', '/base-dir/file-a.latte'],
	'{include ./dir-1/file-a.latte}': [
		'./dir-1/file-a.latte',
		'/base-dir/dir-1/file-a.latte',
	],
	'{include ./dir-1/dir-2/file-a.latte}': [
		'./dir-1/dir-2/file-a.latte',
		'/base-dir/dir-1/dir-2/file-a.latte',
	],
	"{include './dir-1/file-a'}": ['./dir-1/file-a', '/base-dir/dir-1/file-a'],
	"{include file-a'}": ["file-a'", "/base-dir/file-a'"], // Extra trailing quotes.
	"{include 'file-a}": ["'file-a", "/base-dir/'file-a"], // Extra leading quotes.
	"{include '../file-a'}": ['../file-a', '/file-a'],
	"{include '../file-a.latte'}": ['../file-a.latte', '/file-a.latte'],
	"{include '../dir-1/file-a'}": ['../dir-1/file-a', '/dir-1/file-a'],
	"{include '../../../dir-1/file-a'}": ['../../../dir-1/file-a', '/dir-1/file-a'],
	"{include '../../../file-a}": ["'../../../file-a", '/file-a'], // Extra leading quote.
	"{include ../../../file-a'}": ["../../../file-a'", "/file-a'"], // Extra trailing quote.
	'{include blockname}': null, // Block instead of file.
}

for (const [subject, expected] of Object.entries(EXPECTATIONS)) {
	test(`Test parser: IncludeTag: ${subject}`, () => {
		const filePath = '/base-dir/latte-file.latte'
		const result = parseLatte(subject, filePath)
		const tag = result[0] as IncludeTag

		if (expected !== null) {
			expect([tag.relativePath, tag.absolutePath]).toMatchObject(expected)
		} else {
			expect(result).toEqual([])
		}
	})
}
