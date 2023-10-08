import DumbTag from "./DumbTag"
import { Position } from "../types"
import { RegionType, ScannerState } from "./types"
import Stack from "../Stack"
import { isRegionTransferAllowed, isRegionTransferIgnored } from "./RegionPolicies"

export class Scanner {

	private source: string
	private state!: ScannerState
	private tags!: DumbTag[]
	private regionTypeStack!: Stack<RegionType>

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
		}

		this.tags = []
		this.regionTypeStack = new Stack<RegionType>()
		this.regionTypeStack.push(RegionType.HTML)
	}

	private error(msg: string): void {
		throw new Error(msg)
	}

	public scan(): DumbTag[] {
		const state = this.state

		while (state.offset < state.maxOffset) {
			state.offset += 1
			state.character += 1

			const char = this.source[state.offset]
			//console.log(state.offset, char)

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

	private closeLatteTag(): void {
		const state = this.state

		const tagString = this.source.substring(
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
			tagString,
			{start: start, end: end},
			this.regionTypeStack.top()!,
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
		if (this.regionTypeStack.top() === RegionType.QUOTES_D) {
			this.exitRegion(RegionType.QUOTES_D)
		} else {
			this.enterRegion(RegionType.QUOTES_D)
		}
	}

	private handleQuotesSingle(): void {
		if (this.regionTypeStack.top() === RegionType.QUOTES_S) {
			this.exitRegion(RegionType.QUOTES_S)
		} else {
			this.enterRegion(RegionType.QUOTES_S)
		}
	}

	private enterRegion(regionType: RegionType): void {
		if (isRegionTransferIgnored(regionType, this.regionTypeStack)) {
			return
		}

		if (!isRegionTransferAllowed(regionType, this.regionTypeStack)) {
			const currentRegionType = this.regionTypeStack.top()
			this.error(`Unexpected change of region type from '${currentRegionType}' into '${regionType}'`)
		}

		this.regionTypeStack.push(regionType)
	}

	private exitRegion(regionType: RegionType): void {
		if (!this.regionTypeStack.size()) {
			this.error("Region type stack is empty - cannot exit region type")
		}

		if (isRegionTransferIgnored(regionType, this.regionTypeStack)) {
			return
		}

		if (this.regionTypeStack.top() !== regionType) {
			this.error(`Trying to exit non-entered region type '${regionType}'`)
		}

		this.regionTypeStack.pop()
	}

}
