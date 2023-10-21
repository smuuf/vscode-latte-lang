import { readTestDataFile } from '../../../../tests/testUtils'
import { Scanner } from '../Scanner'

test('Scanner: Bad Latte: Unclosed Latte tag', () => {
	const scanner = new Scanner(readTestDataFile('badLatte.latteTag.unclosed.latte'))
	expect(() => scanner.scan()).toThrow('Offset 28: Missing end of latte_tag region')
})

test('Scanner: Bad Latte: Unclosed HTML tag', () => {
	const scanner = new Scanner(readTestDataFile('badLatte.htmlTag.unclosed.latte'))
	expect(() => scanner.scan()).toThrow('Offset 51: Missing end of html_tag region')
})
