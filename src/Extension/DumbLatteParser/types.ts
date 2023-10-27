import * as vscode from 'vscode'
import DumbTag from './Scanner/DumbTag'

export interface Range {
	startOffset: integer
	endOffset: integer
}

export abstract class AbstractTag {
	static DUMB_NAME: string = ''
	static tagName: string = ''
	static range: Range
	static fromDumbTag: (
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	) => AbstractTag | null
	static new: (...args: any) => typeof AbstractTag
}

export type ParsingContext = {
	filePath: string | null
}
