import { readTestDataFile } from '../../../../tests/testUtils'
import { parsePhpSource } from '../../DumbPhpParser/parser'
import { PhpClassInfo, PhpMethodInfo } from '../../DumbPhpParser/types'
import { PhpClass } from '../PhpClass'

test('Get public methods of class', async () => {
	let result: PhpClassInfo[]
	const classes = new Map()

	result = await parsePhpSource(readTestDataFile(`SomeClass.php`))
	classes.set(result[0].fqn, result[0])
	result = await parsePhpSource(readTestDataFile(`SomeSubClass.php`))
	classes.set(result[0].fqn, result[0])
	const ourClasses = await parsePhpSource(readTestDataFile(`SomeSubSubClass.php`))
	const ourClass = ourClasses[0]

	const p = new PhpClass(ourClass, (fqn) => classes.get(fqn))
	const methodNames = p.getPublicMethods().map((method: PhpMethodInfo) => method.name)

	expect(methodNames).toEqual([
		'someSubSubClass_method_1_public',
		'someSubClass_method_1_public',
		'someSubClass_method_2_public',
		'someSubClass_method_3_public_static',
		'someClass_method_1_public',
		'someClass_method_2_public',
		'someClass_method_3_public_static',
	])
})
