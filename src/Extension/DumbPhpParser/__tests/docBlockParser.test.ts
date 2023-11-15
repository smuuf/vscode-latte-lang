import { cleanDocBlockString, parseDocBlockString } from '../docBlockParser'

const INPUT_1 = `
/**
 * ahojky mňauky
 * @whatever first second third arg
 * @return array<bool>
 */
`

const EXPECTED_1_CLEAN = `ahojky mňauky
@whatever first second third arg
@return array<bool>`

test('Docblock parser: Clean', () => {
	expect(cleanDocBlockString(INPUT_1)).toBe(EXPECTED_1_CLEAN)
})

test('Docblock parser: Parse', () => {
	expect(parseDocBlockString(INPUT_1)).toStrictEqual({
		text: EXPECTED_1_CLEAN,
		tags: new Map([
			['whatever', 'first second third arg'],
			['return', 'array<bool>'],
		]),
	})
})
