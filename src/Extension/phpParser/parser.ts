import * as pp from 'php-parser'
import { AstParser } from './AstParser'
import { PhpWorkspaceFileData } from './types'
import { lruCache } from '../utils/lruCache'

const richParser = new pp.Engine({
	parser: {
		extractDoc: true,
	},
	ast: {
		withPositions: true,
		withSource: true,
	},
})

const liteParser = new pp.Engine({})

export async function parsePhpSource(
	source: string,
	filePath: string | null = null,
): Promise<PhpWorkspaceFileData> {
	let ast = null
	try {
		filePath ??= '<unknown>'
		ast = richParser.parseCode(source, filePath)
	} catch {
		// ... Ignore error, return empty result.
		return {
			classes: {},
		}
	}

	const astParser = new AstParser(ast, filePath ?? '')
	return astParser.parseRoot()
}

async function parsePhpSnippet(source: string): Promise<pp.Program | null> {
	let ast = null
	try {
		ast = liteParser.parseEval(source)
	} catch {
		// ... Ignore error, return empty result.
	}

	return ast
}

const parsePhpSnippetCached = lruCache(
	parsePhpSnippet,
	200,
	(s: string) => s.length < 1000, // Cache only for kind-of short sources.
)
export { parsePhpSnippet, parsePhpSnippetCached }
