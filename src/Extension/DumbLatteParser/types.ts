import { AbstractPoi } from '../LattePois/poiTypes'
import DumbTag from './Scanner/DumbTag'

export interface Range {
	startOffset: integer
	endOffset: integer
}

export abstract class AbstractTag {
	static DUMB_NAME: string = ''
	static fromDumbTag: (
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	) => AbstractTag | null
	public readonly range: Range

	public constructor(range: Range) {
		this.range = range
	}

	readonly pois: AbstractPoi[] = []
	getDescription(): string {
		return ''
	}
}

export interface TagReferencingTargetFile {
	relativePath: string
	relativePathOffset: integer
	absolutePath: string | null
}

export type ParsingContext = {
	filePath: string | null
}

export type LatteFileStaticAnalysisResult = {
	tags: AbstractTag[]
	pois: AbstractPoi[] // POIs - points of interest.
}
