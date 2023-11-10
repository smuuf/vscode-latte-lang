import * as vscode from 'vscode'
import DumbTag from './Scanner/DumbTag'
import { Scanner } from './Scanner/Scanner'
import { AbstractTag, ParsingContext } from './types'
import { isString } from '../utils/common'
import { createFromDumbTag } from './Tags/TagFactory'

export function parseLatte(
	source: string,
	uri: vscode.Uri | string | null = null,
): AbstractTag[] {
	const scanner = new Scanner(source)

	const parsingContext: ParsingContext = {
		filePath: uri
			? isString(uri)
				? (uri as string)
				: (uri as vscode.Uri).path
			: null,
	}

	return createTags(scanner.scan(), parsingContext)
}

function createTags(dumbTags: DumbTag[], parsingContext: ParsingContext): AbstractTag[] {
	const result = []
	for (const dumbTag of dumbTags) {
		const tag = createFromDumbTag(dumbTag, parsingContext)
		if (tag) {
			result.push(tag)
		}
	}

	return result
}
