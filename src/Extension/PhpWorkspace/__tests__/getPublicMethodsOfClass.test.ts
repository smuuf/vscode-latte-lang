import { parsePhpSource } from '../../phpParser/parser'
import { PhpClassInfo, PhpMethodInfo } from '../../phpParser/types'
import { PhpClass } from '../PhpClass'
import { readTestDataFile } from '../../../../tests/testUtils'

test('Get public methods of PHP class', async () => {
	const classes = new Map()

	const someClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeClass.php`))
	).classes['SomeClass']

	const someSubClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeSubClass.php`))
	).classes['SomeSubClass']

	const someSubSubClassInfo: PhpClassInfo = (
		await parsePhpSource(readTestDataFile(`SomeSubSubClass.php`))
	).classes['SomeSubSubClass']

	// Create a map of "known classes".
	classes.set(someClassInfo.fqn, someClassInfo)
	classes.set(someSubClassInfo.fqn, someSubClassInfo)

	const p = new PhpClass(someSubSubClassInfo, (fqn) => classes.get(fqn))
	const methodNames = (await p.getPublicMethods()).map(
		(method: PhpMethodInfo) => method.name,
	)

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
