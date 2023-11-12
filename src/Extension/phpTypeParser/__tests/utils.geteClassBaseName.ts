import { getClassBaseName } from '../utils'

test('Extracting base name of a class', () => {
	expect(getClassBaseName('Ahoj')).toBe('Ahoj')
	expect(getClassBaseName('Ahoj/Vole')).toBe('Ahoj/Vole')
	expect(getClassBaseName('Ahoj\\Vole')).toBe('Vole')
	expect(getClassBaseName('Ahoj\\Vole\\Nazdar')).toBe('Nazdar')
	expect(getClassBaseName('\\Ahoj\\Vole/Nazdar')).toBe('Vole/Nazdar')
	expect(getClassBaseName('\\Ahoj\\Vole/Nazdar\\Kámo')).toBe('Kámo')
})
