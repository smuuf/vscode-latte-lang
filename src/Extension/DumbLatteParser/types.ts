import DumbTag from './Scanner/DumbTag'
import { AbstractPoi } from './poiTypes'

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

	getPois(): AbstractPoi[] {
		return []
	}
}

export type ParsingContext = {
	filePath: string | null
}

export type LatteFileStaticAnalysisResult = {
	tags: AbstractTag[]
	pois: AbstractPoi[] // POIs - points of interest.
}
