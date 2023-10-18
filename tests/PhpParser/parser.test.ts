import { extractClasses, detectNamespace } from "../../src//Extension/PhpParser/parser"
import { dump } from "../../src/Extension/utils/utils";
import { readDataFile } from "../utils"


test('Detect namespace', () => {
	const str = readDataFile(`SomeClass.php`, __dirname);
	let result: string | null

	result = detectNamespace(str)
	expect(result?.trim()).toBe("\\App\\Model\\Services")

	result = detectNamespace('nothing')
	expect(result?.trim()).toBe("\\")
})


test('Detect classes', () => {
	const str = readDataFile(`SomeClass.php`, __dirname);
	let result: any

	result = extractClasses(str, {
		namespace: "\\MyNamespace",
		incompletePositions: [],
		uri: null
	})

	const expected = [
		{
			fqn: "\\MyNamespace\\SomeClass",
			namespace: "\\MyNamespace",
			name: "SomeClass",
			location: {
				uri: null,
				position: {
					offset: 193,
					line: null,
					character: null,
				},
			},
			methods: [
				{
					name: "__construct",
					position: {
						offset: 241,
						line: null,
						character: null,
					},
				},
				{
					name: "wakeupArtifact",
					position: {
						offset: 342,
						line: null,
						character: null,
					},
				},
				{
					name: "wakeupBucket",
					position: {
						offset: 510,
						line: null,
						character: null,
					},
				},
			],
		}
	]

	expect(result).toEqual(expected)
})
