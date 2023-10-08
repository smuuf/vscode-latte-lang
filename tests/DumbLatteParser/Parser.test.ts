import { parseLatte } from "../../src/DumbLatteParser/Parser"
import DefaultTag from "../../src/DumbLatteParser/Tags/DefaultTag"
import VarTag from "../../src/DumbLatteParser/Tags/VarTag"
import VarTypeTag from "../../src/DumbLatteParser/Tags/VarTypeTag"
import { readDataFile } from "../utils"


test('Test parser', () => {
	const result = parseLatte(readDataFile('simple.latte'))

	const expected = [
		new VarTag(
			'$prvni',
			{
				start: {line: 0, character: 0, offset: 0},
				end: {line: 0, character: 11, offset: 11},
			},
			null,
		),
		new VarTag(
			'$druhy',
			{
				start: {line: 1, character: 0, offset: 13},
				end: {line: 1, character: 16, offset: 29},
			},
			'bool',
		),
		new VarTypeTag(
			'$treti',
			{
				start: {line: 1, character: 17, offset: 30},
				end: {line: 1, character: 53, offset: 66},
			},
			'\\MyNamespace\\MyClass',
		),
		new DefaultTag(
			'$ctvrty',
			{
				start: {line: 3, character: 0, offset: 101},
				end: {line: 3, character: 20, offset: 121},
			},
			null,
		),
		new DefaultTag(
			'$paty',
			{
				start: {line: 3, character: 21, offset: 122},
				end: {line: 3, character: 49, offset: 150},
			},
			'int|float',
		),
	]
console.log(result)
	expect(result).toMatchObject(expected)
})
