import { readTestDataFile } from '../../../../tests/testUtils'
import { parsePhpSource } from '../../phpParser/parser'
import { PhpClassInfo, PhpClassPropInfo } from '../../phpParser/types'
import { parsePhpType } from '../../phpTypeParser/phpTypeParser'
import { PhpClass } from '../PhpClass'

test('Get public properties of PHP class', async () => {
	const classes = new Map()

	const someClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeClass.php`))
	).classes['SomeClass']

	const someSubClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeSubClass.php`))
	).classes['SomeSubClass']

	// Create a map of "known classes".
	classes.set(someClassInfo.fqn, someClassInfo)

	const p = new PhpClass(someSubClassInfo, (fqn) => classes.get(fqn))
	const methodNames = (await p.getPublicProps()).map((prop: PhpClassPropInfo) => [
		prop.name,
		prop.type,
	])

	expect(methodNames).toEqual([
		['someSubClass_prop_1', parsePhpType('string')],
		['someSubClass_prop_2', parsePhpType('\\CurlHandle')],
		['someClass_prop_1', parsePhpType('?string')],
		['someClass_prop_2_static', parsePhpType('int|bool')],
		// 3 is protected.
		['someClass_prop_4', parsePhpType('\\App\\Model\\Entities\\DbArtifact')],
		['someClass_prop_5', parsePhpType('\\DbArtifact')],
	])
})
