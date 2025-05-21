import { parsePhpTypeCached } from '../../phpTypeParser/phpTypeParser'
import TemplateTypeTag from '../Tags/TemplateTypeTag'
import { parseLatte } from '../latteParser'
import { Range } from '../types'

const SOURCE_1 = `
{templateType A\\B\\C} lol
`

const SOURCE_2 = `
{templateType \\A\\B\\C}
`

const SOURCE_3 = `
lol
{templateType C} hahaha
`

test(`Test parser: TemplateTypeTag`, () => {
	const tag1 = parseLatte(SOURCE_1)[0] as TemplateTypeTag
	const tag2 = parseLatte(SOURCE_2)[0] as TemplateTypeTag
	const tag3 = parseLatte(SOURCE_3)[0] as TemplateTypeTag

	expect(tag1.type).toEqual(parsePhpTypeCached('\\A\\B\\C'))
	expect(tag1.type).toEqual(parsePhpTypeCached('\\A\\B\\C'))
	expect(tag1.range).toEqual({
		startOffset: 1,
		endOffset: 20,
	} as Range)

	expect(tag2.type).toEqual(parsePhpTypeCached('\\A\\B\\C'))
	expect(tag2.type).toEqual(parsePhpTypeCached('A\\B\\C'))
	expect(tag2.range).toEqual({
		startOffset: 1,
		endOffset: 21,
	} as Range)

	expect(tag3.type).toEqual(parsePhpTypeCached('\\C'))
	expect(tag3.type).toEqual(parsePhpTypeCached('C'))
	expect(tag3.range).toEqual({
		startOffset: 5,
		endOffset: 20,
	} as Range)
})
