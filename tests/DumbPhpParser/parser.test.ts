import { extractClasses, detectNamespace } from '../../src/Extension/DumbPhpParser/parser'
import { dump } from '../../src/Extension/utils/utils'
import { readDataFile } from '../utils'

test('Detect namespace', () => {
	const str = readDataFile(`SomeClass.php`, __dirname)
	let result: string | null

	result = detectNamespace(str)
	expect(result?.trim()).toBe('\\App\\Model\\Services')

	result = detectNamespace('nothing')
	expect(result?.trim()).toBe('\\')
})

test('Detect classes', () => {
	const str = readDataFile(`SomeClass.php`, __dirname)
	let result: any

	result = extractClasses(str, {
		namespace: '\\MyNamespace',
		uri: null,
	})

	const expected = [
		{
			fqn: '\\MyNamespace\\SomeClass',
			namespace: '\\MyNamespace',
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
