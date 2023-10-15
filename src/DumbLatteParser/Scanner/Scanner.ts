import DumbTag from "./DumbTag"
import { Position } from "../types"
import { RegionType, ScannerState } from "./types"
import Stack from "../Stack"
import { isRegionTransferAllowed, isRegionTransferIgnored } from "./RegionPolicies"
import { isString } from "../../helpers"


const WORD_REGEX = /[a-zA-Z_][a-zA-Z0-9_-]*/
const QUOTED_STRING_REGEX = /(")(?<s1>(?:\\"|[^"])+)\1|(')(?<s2>(?:\\'|[^'])+)\1/


export class Scanner {

	private source: string
	private state!: ScannerState
	private tags!: DumbTag[]

	constructor(source: string) {
		this.source = source
		this.initState()
	}

	private initState(): void {
		this.state = {
			offset: -1,
			line: 0,
			character: -1,
			maxOffset: this.source.length - 1,
			lastLatteOpenTagOffset: 0,
			regionTypeStack: new Stack<RegionType>()
		}

		this.tags = []
		this.state.regionTypeStack.push(RegionType.HTML)
	}

	private error(msg: string): void {
		throw new Error(`Offset ${this.state.offset}: ${msg}`)
	}

	public scan(): DumbTag[] {
		const state = this.state

		while (state.offset < state.maxOffset) {
			state.offset += 1
			state.character += 1

			const char = this.source[state.offset]
			// Uncomment for debugging.
			//console.log(state.offset, state.regionTypeStack.stack, char)

			// Known issue: We don't handle escaped things (for example '\"')
			// or detection/processing of double Latte syntax.
			switch (char) {
				case "\n":
					this.handleNewline()
					break
				case "{":
					this.openLatteTag()
					break
				case "}":
					this.closeLatteTag()
					break
				case "n": // n:whatever Latte tags.
					// If in HTML tag and the "n" is followed by ":" ...
					if (
						this.source[state.offset + 1] === ":"
						&& this.state.regionTypeStack.top() === RegionType.HTML_TAG
					) {
						state.offset += 2
						this.collectNLatteTag()
					}
					break
				case "<":
					this.openHtmlTag()
					break
				case ">":
					this.closeHtmlTag()
					break
				case '"':
					this.handleQuotesDouble()
					break
				case "'":
					this.handleQuotesSingle()
					break
				default:
					break
			}
		}

		return this.tags
	}

	private handleNewline(): void {
		this.state.line += 1
		this.state.character = -1 // Start of next scanner loop will do 0
	}

	private openLatteTag(): void {
		this.enterRegion(RegionType.LATTE)
		this.state.lastLatteOpenTagOffset = this.state.offset
	}

	private collectRegex(
		regex: RegExp,
		returnGroups: (string | number)[] = [0]
	): string | null {
		const state = this.state

		// We don't really expect super long words, so don't create
		// unnecessarily too long slice of the source string.
		const rest = this.source.substring(state.offset, state.offset + 1000)

		const result = regex.exec(rest)
		if (result) {
			const wholeFound = result[0]
			let found = null

			// Get the first found of the requested return groups.
			for (const retGroup of returnGroups) {
				if (result.groups && isString(retGroup)) {
					found = result.groups[retGroup]
					if (found !== undefined) {
						break
					}
				} else {
					found = result[retGroup as number]
					if (found !== undefined) {
						break
					}
				}
			}

			if (found === null) {
				return null
			}

			// Advance the character pointer state.
			state.offset += wholeFound.length - 1 + result.index
			state.character += wholeFound.length - 1 + result.index

			// ... and take any newlines into account.
			const lines = countChar("\n", wholeFound)
			if (lines) {
				state.line += lines
				// How many characters are at the end of the string after
				// the last newline.
				state.character = wholeFound.length - wholeFound.lastIndexOf("\n") - 2 + result.index
			}

			return found
		}

		return ''
	}

	private collectLiteral(str: string): string | null {
		const literalLength = str.length
		if (literalLength === 0) {
			return null
		}

		const origin = this.state.offset
		let offset = 1 // Start at the next character from the current pointer.

		while (offset < literalLength) {
			if (this.source[origin + offset] !== str[offset]) {
				return null
			}
			offset += 1
		}

		// Advance the character pointer state.
		const state = this.state
		state.offset += literalLength
		state.character += literalLength

		// ... and take any newlines into account.
		const lines = countChar("\n", str)
		if (lines) {
			state.line += lines
			// How many characters are at the end of the string after
			// the last newline.
			state.character = literalLength - str.lastIndexOf("\n") - 1
		}

		return str
	}

	private collectNLatteTag(): void {
		const state = this.state
		const originalState = { ...state } // Clone for potential revert.

		const tagName = this.collectRegex(WORD_REGEX)
		if (!tagName) {
			return
		}

		if (!this.collectLiteral("=")) {
			return
		}

		const tagArg = this.collectRegex(QUOTED_STRING_REGEX, ['s1', 's2']);
		if (!tagArg) {
			return
		}

		const start: Position = {
			line: originalState.line,
			character: originalState.character,
			offset: originalState.offset,
		}

		const end: Position = {
			line: state.line,
			character: state.character,
			offset: state.offset,
		}

		const dumbTag = new DumbTag(
			`${tagName} ${tagArg}`,
			{start: start, end: end},
			RegionType.LATTE,
		)

		this.tags.push(dumbTag)
		this.state = state
	}

	private closeLatteTag(): void {
		const state = this.state

		const tagContent = this.source.substring(
			state.lastLatteOpenTagOffset + 1,
			state.offset,
		)

		const start: Position = {
			line: state.line,
			character: state.character
				- (state.offset - state.lastLatteOpenTagOffset),
			offset: state.lastLatteOpenTagOffset,
		}

		const end: Position = {
			line: state.line,
			character: state.character,
			offset: state.offset,
		}

		const dumbTag = new DumbTag(
			tagContent,
			{start: start, end: end},
			state.regionTypeStack.top()!,
		)

		this.tags.push(dumbTag)
		this.exitRegion(RegionType.LATTE)
	}

	private openHtmlTag(): void {
		this.enterRegion(RegionType.HTML_TAG)
	}

	private closeHtmlTag(): void {
		this.exitRegion(RegionType.HTML_TAG)
	}

	private handleQuotesDouble(): void {
		if (this.state.regionTypeStack.top() === RegionType.QUOTES_D) {
			this.exitRegion(RegionType.QUOTES_D)
		} else {
			this.enterRegion(RegionType.QUOTES_D)
		}
	}

	private handleQuotesSingle(): void {
		if (this.state.regionTypeStack.top() === RegionType.QUOTES_S) {
			this.exitRegion(RegionType.QUOTES_S)
		} else {
			this.enterRegion(RegionType.QUOTES_S)
		}
	}

	private enterRegion(regionType: RegionType): void {
		if (isRegionTransferIgnored(regionType, this.state.regionTypeStack)) {
			return
		}

		if (!isRegionTransferAllowed(regionType, this.state.regionTypeStack)) {
			const currentRegionType = this.state.regionTypeStack.top()
			this.error(`Unexpected change of region type from '${currentRegionType}' into '${regionType}'`)
		}

		this.state.regionTypeStack.push(regionType)
	}

	private exitRegion(regionType: RegionType): void {
		if (!this.state.regionTypeStack.size()) {
			this.error("Region type stack is empty - cannot exit region type")
		}

		if (isRegionTransferIgnored(regionType, this.state.regionTypeStack)) {
			return
		}

		if (this.state.regionTypeStack.top() !== regionType) {
			this.error(`Trying to exit non-entered region type '${regionType}'`)
		}

		this.state.regionTypeStack.pop()
	}

}

function countChar(char: string, string: string): number {
	return string.split(char).length - 1
}