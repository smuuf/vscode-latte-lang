import { Range } from "../types"
import { RegionType } from "./types"

export default class DumbTag {

	readonly name: string = ''
	readonly tail: string = ''
	readonly closing: boolean = false
	readonly range: Range
	readonly regionType: RegionType

	constructor(
		content: string,
		range: Range,
		regionType: RegionType
	) {
		this.range = range
		this.regionType = regionType

		content = content.trim()
		const firstChar = content[0]

		// Special case for tag like {=$whatever * 2}.
		if (firstChar === '=') {
			this.name = '='
			this.tail = content.substring(1)
			return
		}

		// Special case for tag like {$whatever} or {$whatever|myFilter}.
		if (firstChar === '$') {
			this.name = '$'
			this.tail = content.substring(0)
			return
		}

		// Closing tags.
		if (firstChar === '/') {
			const m = content.match(/[^\s]+/)
			this.name = m![0]
			this.tail = content.substring(this.name.length + 1)
			this.closing = true
			return
		}

		// Closing tags.
		if (firstChar === '/') {
			const m = content.match(/[^\s]+/)
			this.name = m![0]
			this.tail = content.substring(this.name.length + 1)
			return
		}

		const m = content.match(/[^\s]+/)
		this.name = m![0]
		this.tail = content.substring(this.name.length + 1)
	}

}
