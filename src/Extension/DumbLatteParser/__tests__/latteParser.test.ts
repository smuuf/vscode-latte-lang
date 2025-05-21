import { readTestDataFile } from '../../../../tests/testUtils'
import { parsePhpTypeCached } from '../../phpTypeParser/phpTypeParser'
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
				startOffset: 5,
				endOffset: 11,
			},
		),
		new VarTag(
			{
				startOffset: 13,
				endOffset: 29,
			},
			'$druhy',
			parsePhpTypeCached('bool'),
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
			parsePhpTypeCached('\\MyNamespace\\MyClass')!,
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
				startOffset: 110,
				endOffset: 117,
			},
		),
		new DefaultTag(
			{
				startOffset: 122,
				endOffset: 150,
			},
			'$paty',
			parsePhpTypeCached('int|float'),
			'5',
			{
				startOffset: 141,
				endOffset: 146,
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
				endOffset: 315,
			},
			'$devaty',
			parsePhpTypeCached('?MyNamespace\\MyClass')!,
			{
				startOffset: 308,
				endOffset: 315,
			},
			{
				startOffset: 287,
				endOffset: 308,
			},
		),
	]

	expect(result).toMatchObject(expected)
})
