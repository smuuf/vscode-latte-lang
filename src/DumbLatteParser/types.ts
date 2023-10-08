import DumbTag from "./Scanner/DumbTag"

export interface Range {
	start: Position
	end: Position
}

export interface Position {
	line: number
	character: number
	offset: number
}

export abstract class AbstractTag {
	static DUMB_NAME: string = ''
	static name: string = ''
	static range: Range
	static fromDumbTag: (dumbTag: DumbTag) => AbstractTag | null
	static new: (...args: any) => typeof AbstractTag
}


