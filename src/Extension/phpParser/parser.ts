import { Engine } from 'php-parser'
import { AstParser } from './AstParser'
import { PhpWorkspaceFileData } from './types'

export async function parsePhpSource(
	source: string,
	filePath: string | null = null,
): Promise<PhpWorkspaceFileData> {
	const parser = new Engine({
		parser: {
			extractDoc: true,
		},
		ast: {
			withPositions: true,
			withSource: true,
		},
	})

	let ast = null
	try {
		filePath ??= '<unknown>'
		ast = parser.parseCode(source, filePath)
	} catch {
		// ...
	}

	if (!ast) {
		return {
			classes: {},
		}
	}

	const astParser = new AstParser(ast, filePath ?? '')
	return astParser.parseRoot()
}
