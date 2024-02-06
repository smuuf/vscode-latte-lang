import { readTestDataFile } from '../../../../tests/testUtils'
import { parsePhpSource } from '../../phpParser/parser'
import {
	PhpClassInfo,
	PhpClassPropertyInfo,
	SymbolVisibility,
} from '../../phpParser/types'
import { parsePhpType } from '../../phpTypeParser/phpTypeParser'
import { PhpClass } from '../PhpClass'

async function preparePhpClass(): Promise<PhpClass> {
	const classes = new Map()

	const someClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeClass.php`))
	).classes['SomeClass']

	const someSubClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeSubClass.php`))
	).classes['SomeSubClass']

	// Create a map of "known classes".
	classes.set(someClassInfo.fqn, someClassInfo)

	return new PhpClass(someSubClassInfo, (fqn) => classes.get(fqn))
}

test('Get public properties of PHP class', async () => {
	const cls = await preparePhpClass()
	const props = await cls.getProperties({ visibility: SymbolVisibility.PUBLIC })
	const result = props.map((prop: PhpClassPropertyInfo) => [prop.name, prop.type])

	expect(result).toEqual([
		['someSubClass_prop_1', parsePhpType('string')],
		['someSubClass_prop_2', parsePhpType('\\CurlHandle')],
		['someClass_prop_1', parsePhpType('?string')],
		['someClass_prop_2_static', parsePhpType('int|bool')],
		// 3 is protected.
		['someClass_prop_4', parsePhpType('\\App\\Model\\Entities\\DbArtifact')],
		['someClass_prop_5', parsePhpType('\\DbArtifact')],
		[
			'entityFileSystemService',
			parsePhpType('\\Entity\\Service\\EntityFileSystemService|bool'),
		],
		['globalFileSystemService', parsePhpType('\\GlobalFileSystemService')],
	])

	const props2 = await cls.getPublicProperties()
	const result2 = props2.map((prop: PhpClassPropertyInfo) => [prop.name, prop.type])
	expect(result2).toEqual(result)
})

test('Get protected properties of PHP class', async () => {
	const cls = await preparePhpClass()
	const props = await cls.getProperties({ visibility: SymbolVisibility.PROTECTED })
	const result = props.map((prop: PhpClassPropertyInfo) => [prop.name, prop.type])

	expect(result).toEqual([['someClass_prop_3_protected', parsePhpType('bool')]])
})
