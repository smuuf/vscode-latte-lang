import { parseLatte } from "../../src/Extension/DumbLatteParser/Parser"
import DefaultTag from "../../src/Extension/DumbLatteParser/Tags/DefaultTag"
import ForeachTag from "../../src/Extension/DumbLatteParser/Tags/ForeachTag"
import VarTag from "../../src/Extension/DumbLatteParser/Tags/VarTag"
import VarTypeTag from "../../src/Extension/DumbLatteParser/Tags/VarTypeTag"
import { parsePhpType } from "../../src/Extension/TypeParser/typeParser"
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
			parsePhpType('bool'),
		),
		new VarTypeTag(
			'$treti',
			{
				start: {line: 1, character: 17, offset: 30},
				end: {line: 1, character: 53, offset: 66},
			},
			parsePhpType('\\MyNamespace\\MyClass'),
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
			parsePhpType('int|float'),
		),
		new ForeachTag(
			{
				start: {line: 4, character: 0, offset: 152},
				end: {line: 4, character: 24, offset: 176},
			},
			'$paty',
			'$sesty',
		),
		new ForeachTag(
			{
				start: {line: 7, character: 5, offset: 206},
				end: {line: 7, character: 29, offset: 230},
			},
			'$sedmy',
			'$osmy',
		),
	]

	expect(result).toMatchObject(expected)
})
