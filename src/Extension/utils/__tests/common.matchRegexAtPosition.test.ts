import { matchRegexAtPosition } from '../../../../out/Extension/utils/common'

test('matchRegexAtPosition', () => {
	let match: RegExpExecArray | null = null
	match = matchRegexAtPosition('123', '112344', 0)
	expect(match).toBeNull()

	match = matchRegexAtPosition('123', '0012344', 2) as RegExpExecArray
	expect(match).toBeTruthy()
	expect(match[0]).toBe('123')

	match = matchRegexAtPosition('\\d+', 'aabb12ccdd', 0)
	expect(match).toBeNull()

	match = matchRegexAtPosition('\\d+', 'aabb12ccdd', 4) as RegExpExecArray
	expect(match).toBeTruthy()
	expect(match[0]).toBe('12')
})
