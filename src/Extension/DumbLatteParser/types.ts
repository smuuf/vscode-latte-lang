import DumbTag from "./Scanner/DumbTag"

export interface Range {
	start: Position
	end: Position
}

export interface Position {
	offset: number
	line: number
	character: number
}

export abstract class AbstractTag {
	static DUMB_NAME: string = ''
	static tagName: string = ''
	static range: Range
	static fromDumbTag: (dumbTag: DumbTag) => AbstractTag | null
	static new: (...args: any) => typeof AbstractTag
}
