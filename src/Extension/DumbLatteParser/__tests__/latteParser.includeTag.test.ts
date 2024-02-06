import IncludeTag from '../Tags/IncludeTag'
import { parseLatte } from '../latteParser'

const EXPECTATIONS = {
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
	"{include file-a'}": null, // Extra trailing quotes fails the match.
	// Below the extra leading quote doesn't fail the filename regex match, but
	// Latte would interpret it as a block name. See
	// https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L221
	"{include 'file-a}": null,
	"{include '../file-a'}": ['../file-a', '/file-a'],
	"{include '../file-a.latte'}": ['../file-a.latte', '/file-a.latte'],
	"{include '../dir-1/file-a'}": ['../dir-1/file-a', '/dir-1/file-a'],
	"{include '../../../dir-1/file-a'}": ['../../../dir-1/file-a', '/dir-1/file-a'],
	"{include '../../../file-a}": null, // Extra leading quote fails the match.
	"{include ../../../file-a'}": ['../../../file-a', '/file-a'], // Extra trailing quote doesn't fail the match, but is ignored.
	'{include blockname}': null, // Block instead of file fails the match.
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
