import { stringAfterFirstNeedle } from '../common'

test('matchRegexAtIndex', () => {
	expect(stringAfterFirstNeedle('aaa', 'b')).toBe(null)
	expect(stringAfterFirstNeedle('aba2', 'b')).toBe('a2')
	expect(stringAfterFirstNeedle('abab2', 'b')).toBe('ab2')
})
