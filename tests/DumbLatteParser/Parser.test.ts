import { parseLatte } from '../../src/Extension/DumbLatteParser/Parser'
import DefaultTag from '../../src/Extension/DumbLatteParser/Tags/DefaultTag'
import ForeachTag from '../../src/Extension/DumbLatteParser/Tags/ForeachTag'
import VarTag from '../../src/Extension/DumbLatteParser/Tags/VarTag'
import VarTypeTag from '../../src/Extension/DumbLatteParser/Tags/VarTypeTag'
import { parsePhpType } from '../../src/Extension/TypeParser/typeParser'
import { readDataFile } from '../utils'

test('Test parser', () => {
	const result = parseLatte(readDataFile('simple.latte'))

	const expected = [
		new VarTag(
			'$prvni',
			{
				startOffset: 0,
				endOffset: 11,
			},
			null,
			5,
		),
		new VarTag(
			'$druhy',
			{
				startOffset: 13,
				endOffset: 29,
			},
			parsePhpType('bool'),
			23,
		),
		new VarTypeTag(
			'$treti',
			{
				startOffset: 30,
				endOffset: 66,
			},
			parsePhpType('\\MyNamespace\\MyClass'),
			60,
		),
		new DefaultTag(
			'$ctvrty',
			{
				startOffset: 101,
				endOffset: 121,
			},
			null,
			110,
		),
		new DefaultTag(
			'$paty',
			{
				startOffset: 122,
				endOffset: 150,
			},
			parsePhpType('int|float'),
			141,
		),
		new ForeachTag(
			{
				startOffset: 152,
				endOffset: 176,
			},
			'$paty',
			'$sesty',
		),
		new ForeachTag(
			{
				startOffset: 206,
				endOffset: 230,
			},
			'$sedmy',
			'$osmy',
		),
	]

	expect(result).toMatchObject(expected)
})
