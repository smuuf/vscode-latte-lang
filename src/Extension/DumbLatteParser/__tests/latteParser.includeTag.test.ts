import IncludeTag from '../Tags/IncludeTag'
import { parseLatte } from '../latteParser'

const EXPECTATIONS: object = {
	'{include file-a.latte}': '/base-dir/file-a.latte',
	"{include 'file-a.latte'}": '/base-dir/file-a.latte',
	'{include ./dir-1/file-a.latte}': '/base-dir/dir-1/file-a.latte',
	'{include ./dir-1/dir-2/file-a.latte}': '/base-dir/dir-1/dir-2/file-a.latte',
	"{include './dir-1/file-a'}": '/base-dir/dir-1/file-a',
	"{include file-a'}": "/base-dir/file-a'", // Extra trailing quotes.
	"{include 'file-a}": "/base-dir/'file-a", // Extra leading quotes.
	"{include '../file-a'}": null,
	"{include '../file-a.latte'}": null, // Doesn't start with the base dir.
	"{include '../dir-1/file-a'}": null, // Doesn't start with the base dir.
	"{include '../../../dir-1/file-a'}": null,
	"{include '../../../file-a}": null, // Outside of FS.
	"{include ../../../file-a'}": null, // Outside of FS.
	'{include blockname}': null, // Block instead of file.
}

for (const [subject, expected] of Object.entries(EXPECTATIONS)) {
	test(`Test parser: IncludeTag: ${subject}`, () => {
		const filePath = '/base-dir/latte-file.latte'
		const result = parseLatte(subject, filePath)

		if (expected !== null) {
			expect(result).toMatchObject([new IncludeTag(expected, 9)])
		} else {
			expect(result).toEqual([])
		}
	})
}
