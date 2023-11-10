import { matchRegexAtIndex } from "../common"

test('matchRegexAtIndex', () => {
	let match: RegExpExecArray | null = null
	match = matchRegexAtIndex('123', '112344', 0)
	expect(match).toBeNull()

	match = matchRegexAtIndex('123', '0012344', 2) as RegExpExecArray
	expect(match).toBeTruthy()
	expect(match[0]).toBe('123')

	match = matchRegexAtIndex('\\d+', 'aabb12ccdd', 0)
	expect(match).toBeNull()

	match = matchRegexAtIndex('\\d+', 'aabb12ccdd', 4) as RegExpExecArray
	expect(match).toBeTruthy()
	expect(match[0]).toBe('12')
})
