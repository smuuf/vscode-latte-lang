import { Range } from '../types'
import { DumbTagConstructorArgs, RegionType } from './types'

export default class DumbTag {
	readonly name: string = ''
	readonly args: string = ''
	readonly tagRange: Range
	readonly nameOffset: integer
	readonly argsOffset: integer
	readonly regionType: RegionType
	readonly closing: boolean = false

	// constructor(
	// 	content: string,
	// 	range: Range,
	// 	regionType: RegionType,
	// ) {
	constructor({
		name,
		nameOffset,
		args,
		argsOffset,
		tagRange,
		regionType,
	}: DumbTagConstructorArgs) {
		this.name = name
		this.nameOffset = nameOffset
		this.args = args
		this.argsOffset = argsOffset
		this.tagRange = tagRange
		this.regionType = regionType

		// The tag name may contain a special-cased prefix, so deal with that.
		const firstChar = name[0]

		// Special case for tag like {=$whatever * 2}.
		if (firstChar === '=') {
			this.name = '='
			this.args = name
			this.argsOffset += 1
			return
		}

		// Special case for tag like {$whatever} or {$whatever|myFilter}.
		if (firstChar === '$') {
			this.name = '$'
			this.args = name
			this.argsOffset += 1
			return
		}

		// Closing tags.
		if (firstChar === '/') {
			this.name = name.substring(1)
			this.args = ''
			this.closing = true
			return
		}
	}
}
