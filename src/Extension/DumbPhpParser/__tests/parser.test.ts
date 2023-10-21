import { extractClasses, detectNamespace } from '../parser'
import { readTestDataFile } from '../../../tests/testUtils'

test('Detect namespace', () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: string | null

	result = detectNamespace(str)
	expect(result?.trim()).toBe('App\\Model\\Services')

	result = detectNamespace('nothing')
	expect(result?.trim()).toBe('')
})

test('Detect classes', () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: any

	result = extractClasses(str, {
		namespace: 'MyNamespace',
		uri: null,
	})

	const expected = [
		{
			fqn: 'MyNamespace\\SomeClass',
			namespace: 'MyNamespace',
			name: 'SomeClass',
			location: {
				uri: null,
				offset: 199,
			},
			methods: new Map([
				['__construct', { name: '__construct', offset: 250 }],
				['wakeupArtifact', { name: 'wakeupArtifact', offset: 351 }],
				['wakeupBucket', { name: 'wakeupBucket', offset: 519 }],
			]),
		},
	]

	expect(result).toEqual(expected)
})
