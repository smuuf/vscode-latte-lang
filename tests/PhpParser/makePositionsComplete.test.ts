import { makePositionsComplete } from "../../src/Extension/PhpParser/utils";
import { dump } from "../../src/Extension/utils/utils";
import { readDataFile } from "../utils"


test('Make positions complete', () => {
	const str = readDataFile(`SomeClass.php`, __dirname);

	const positions = [
		{ offset: 0, line: 0, character: 0 },
		{ offset: 1, line: 0, character: 0 },
		{ offset: 10, line: 0, character: 0 },
		{ offset: 40, line: 0, character: 0 },
		{ offset: 60, line: 0, character: 0 },
		{ offset: 80, line: 0, character: 0 },
		{ offset: 120, line: 0, character: 0 },
		{ offset: 160, line: 0, character: 0 },
		{ offset: 180, line: 0, character: 0 },
		{ offset: 240, line: 0, character: 0 },
		{ offset: 320, line: 0, character: 0 },
		{ offset: 356, line: 0, character: 0 },
		{ offset: 457, line: 0, character: 0 },
		{ offset: 789, line: 0, character: 0 }, // Outside of the string.
		{ offset: 890, line: 0, character: 0 }, // Outside of the string.
	]

	makePositionsComplete(positions, str)

	const expected = [
		{ offset: 0, line: 1, character: 1 },
		{ offset: 1, line: 2, character: 2 },
		{ offset: 10, line: 4, character: 4 },
		{ offset: 40, line: 6, character: 8 },
		{ offset: 60, line: 6, character: 28 },
		{ offset: 80, line: 8, character: 17 },
		{ offset: 120, line: 9, character: 34 },
		{ offset: 160, line: 12, character: 2 },
		{ offset: 180, line: 12, character: 22 },
		{ offset: 240, line: 18, character: 9 },
		{ offset: 320, line: 19, character: 58 },
		{ offset: 356, line: 22, character: 24 },
		{ offset: 457, line: 24, character: 44 },
		{ offset: 789, line: 0, character: 0 }, // Outside of the string.
		{ offset: 890, line: 0, character: 0 }, // Outside of the string.
	]

	expect(positions).toStrictEqual(expected)
})
