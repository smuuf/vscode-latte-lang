import { readTestDataFile } from '../../../../tests/testUtils'
import DumbTag from '../DumbTag'
import { Scanner } from '../Scanner'
import { RegionType } from '../types'

test('Test basic scanner properties', () => {
	const scanner = new Scanner(readTestDataFile('justString.txt'))
	// Nice little trick with array access - gives us access to private fields
	// of the Scanner object.
	const state = scanner['state']

	expect(state.offset).toBe(-1)
	expect(state.line).toBe(0)
	expect(state.character).toBe(-1)
	expect(state.lastLatteOpenTagOffset).toBe(0)
	expect(state.maxOffset).toBe(47)

	const result = scanner.scan()
	expect(Array.isArray(result)).toBeTruthy()
	expect(result).toHaveLength(0)

	expect(state.offset).toBe(47)
	expect(state.character).toBe(11)
	expect(state.line).toBe(3)
	expect(state.lastLatteOpenTagOffset).toBe(0)
	expect(state.maxOffset).toBe(47)
})

test('Simple template scan', () => {
	const scanner = new Scanner(readTestDataFile('simple.latte'))
	const result = scanner.scan()

	const expected = [
		new DumbTag({
			name: 'var',
			args: '$prvni',
			nameOffset: 1,
			argsOffset: 5,
			tagRange: {
				startOffset: 0,
				endOffset: 11,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'var',
			args: 'bool $druhy',
			nameOffset: 14,
			argsOffset: 18,
			tagRange: {
				startOffset: 13,
				endOffset: 29,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'varType',
			args: '\\MyNamespace\\MyClass $treti',
			nameOffset: 31,
			argsOffset: 39,
			tagRange: {
				startOffset: 30,
				endOffset: 66,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: '$prvni',
			args: '',
			nameOffset: 78,
			argsOffset: 84,
			tagRange: {
				startOffset: 77,
				endOffset: 84,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: '$druhy',
			args: '',
			nameOffset: 87,
			argsOffset: 93,
			tagRange: {
				startOffset: 86,
				endOffset: 93,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'default',
			args: '$ctvrty = 4',
			nameOffset: 102,
			argsOffset: 110,
			tagRange: {
				startOffset: 101,
				endOffset: 121,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'default',
			args: 'int|float $paty = 5',
			nameOffset: 123,
			argsOffset: 131,
			tagRange: {
				startOffset: 122,
				endOffset: 150,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'foreach',
			args: '$paty as $sesty',
			nameOffset: 153,
			argsOffset: 161,
			tagRange: {
				startOffset: 152,
				endOffset: 176,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: '$sesty',
			args: '',
			nameOffset: 180,
			argsOffset: 186,
			tagRange: {
				startOffset: 179,
				endOffset: 186,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: '/foreach',
			args: '',
			nameOffset: 189,
			argsOffset: 197,
			tagRange: {
				startOffset: 188,
				endOffset: 197,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'foreach',
			args: '$sedmy as $osmy',
			nameOffset: 206,
			argsOffset: 215,
			tagRange: {
				startOffset: 206,
				endOffset: 230,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: '$osmy',
			args: '',
			nameOffset: 254,
			argsOffset: 259,
			tagRange: {
				startOffset: 253,
				endOffset: 259,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: '$devaty',
			args: '',
			nameOffset: 262,
			argsOffset: 269,
			tagRange: {
				startOffset: 261,
				endOffset: 269,
			},
			regionType: RegionType.LATTE_TAG,
		}),
		new DumbTag({
			name: 'varType',
			args: 'MyNamespace\\MyClass $devaty',
			nameOffset: 279,
			argsOffset: 287,
			tagRange: {
				startOffset: 278,
				endOffset: 314,
			},
			regionType: RegionType.LATTE_TAG,
		}),
	]

	expect(result).toMatchObject(expected)
})

test('Smoke test of real template scan', () => {
	const scanner = new Scanner(readTestDataFile('real.latte'))
	expect(Array.isArray(scanner.scan())).toBeTruthy()
})
