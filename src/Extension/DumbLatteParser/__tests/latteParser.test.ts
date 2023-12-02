import { readTestDataFile } from '../../../../tests/testUtils'
import { parsePhpType } from '../../phpTypeParser/phpTypeParser'
import DefaultTag from '../Tags/DefaultTag'
import ForeachTag from '../Tags/ForeachTag'
import VarTag from '../Tags/VarTag'
import VarTypeTag from '../Tags/VarTypeTag'
import { parseLatte } from '../latteParser'

test('Test parser', () => {
	const result = parseLatte(readTestDataFile('simple.latte'))

	const expected = [
		new VarTag(
			{
				startOffset: 0,
				endOffset: 11,
			},
			'$prvni',
			null,
			null,
			{
				endOffset: 11,
				startOffset: 5,
			},
		),
		new VarTag(
			{
				startOffset: 13,
				endOffset: 29,
			},
			'$druhy',
			parsePhpType('bool'),
			null,
			{
				startOffset: 23,
				endOffset: 29,
			},
		),
		new VarTypeTag(
			{
				startOffset: 30,
				endOffset: 66,
			},
			'$treti',
			parsePhpType('\\MyNamespace\\MyClass')!,
			{
				startOffset: 60,
				endOffset: 66,
			},
			{
				startOffset: 39,
				endOffset: 60,
			},
		),
		new DefaultTag(
			{
				startOffset: 101,
				endOffset: 121,
			},
			'$ctvrty',
			null,
			'4',
			{
				endOffset: 117,
				startOffset: 110,
			},
		),
		new DefaultTag(
			{
				startOffset: 122,
				endOffset: 150,
			},
			'$paty',
			parsePhpType('int|float'),
			'5',
			{
				endOffset: 146,
				startOffset: 141,
			},
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
		new VarTypeTag(
			{
				startOffset: 278,
				endOffset: 314,
			},
			'$devaty',
			parsePhpType('MyNamespace\\MyClass')!,
			{
				endOffset: 314,
				startOffset: 307,
			},
			{
				startOffset: 287,
				endOffset: 307,
			},
		),
	]

	expect(result).toMatchObject(expected)
})
