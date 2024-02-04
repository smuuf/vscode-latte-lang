import { readTestDataFile } from '../../../../tests/testUtils'
import { parsePhpSource } from '../../DumbPhpParser/parser'
import { PhpClassInfo, PhpClassPropInfo } from '../../DumbPhpParser/types'
import { parsePhpType } from '../../phpTypeParser/phpTypeParser'
import { PhpClass } from '../PhpClass'

test('Get public properties of PHP class', async () => {
	let result: PhpClassInfo[]
	const classes = new Map()

	result = await parsePhpSource(readTestDataFile(`SomeClass.php`))
	classes.set(result[0].fqn, result[0])
	const ourClasses = await parsePhpSource(readTestDataFile(`SomeSubClass.php`))
	const ourClass = ourClasses[0]

	const p = new PhpClass(ourClass, (fqn) => classes.get(fqn))
	const methodNames = (await p.getPublicProps()).map((prop: PhpClassPropInfo) => [
		prop.name,
		prop.type,
	])

	expect(methodNames).toEqual([
		['someClass_prop_1', parsePhpType('?string')],
		['someClass_prop_2', parsePhpType('int|bool')],
		['someClass_prop_3', parsePhpType('int')],
		['someClass_prop_4', parsePhpType('\\DateTime')],
		['someSubClass_prop_1', parsePhpType('string')],
		['someSubClass_prop_2', parsePhpType('\\CurlHandle')],
	])
})
