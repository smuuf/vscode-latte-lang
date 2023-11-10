import { extractBaseClassName } from '../phpTypeParser'

test('Extracting base name of a class', () => {
	expect(extractBaseClassName('Ahoj')).toBe('Ahoj')
	expect(extractBaseClassName('Ahoj/Vole')).toBe('Ahoj/Vole')
	expect(extractBaseClassName('Ahoj\\Vole')).toBe('Vole')
	expect(extractBaseClassName('Ahoj\\Vole\\Nazdar')).toBe('Nazdar')
	expect(extractBaseClassName('\\Ahoj\\Vole/Nazdar')).toBe('Vole/Nazdar')
	expect(extractBaseClassName('\\Ahoj\\Vole/Nazdar\\Kámo')).toBe('Kámo')
})
