import Stack from "../Stack"
import { RegionType } from "./types"

type TransferPath = (RegionType | Array<RegionType>)[]
type TransferDefinition = {
	[key in RegionType]?: TransferPath
}


const allowedTransfers: TransferDefinition = {
	[RegionType.HTML_TAG]: [
		RegionType.HTML,
		[
			RegionType.QUOTES_S,
			RegionType.LATTE,
		],
		[
			RegionType.QUOTES_D,
			RegionType.LATTE,
		],
	],
	[RegionType.LATTE]: [
		RegionType.HTML,
		RegionType.HTML_TAG,
		[
			RegionType.QUOTES_S,
			RegionType.HTML_TAG,
		],
		[
			RegionType.QUOTES_D,
			RegionType.HTML_TAG,
		],
	],
	[RegionType.QUOTES_S]: [
		RegionType.HTML,
		RegionType.HTML_TAG,
		RegionType.QUOTES_D,
		RegionType.LATTE,
	],
	[RegionType.QUOTES_D]: [
		RegionType.HTML,
		RegionType.HTML_TAG,
		RegionType.QUOTES_S,
		RegionType.LATTE,
	],
}


const ignoredTransfers: TransferDefinition= {
	[RegionType.QUOTES_S]: [
		RegionType.QUOTES_D,
		RegionType.LATTE,
		RegionType.HTML,
	],
	[RegionType.QUOTES_D]: [
		RegionType.QUOTES_S,
		RegionType.LATTE,
		RegionType.HTML,
	],
	[RegionType.HTML_TAG]: [
		RegionType.LATTE,
		[
			RegionType.QUOTES_S,
			RegionType.HTML_TAG,
		],
		[
			RegionType.QUOTES_D,
			RegionType.HTML_TAG,
		]
	]
}

export function isRegionTransferAllowed(
	newRegion: RegionType,
	stack: Stack<RegionType>,
): boolean {
	const allowedCondition: TransferPath = allowedTransfers[newRegion]!

	if (!allowedCondition) {
		return false
	}

	// If the forbidden path matches with the top items in the stack,
	// the tranfer is forbidden.
	return allowedCondition.some(
		(item) => previousRegionsMatch(item, stack))
}

export function isRegionTransferIgnored(
	newRegion: RegionType,
	stack: Stack<RegionType>,
): boolean {
	const ignoredConditions: TransferPath = ignoredTransfers[newRegion]!

	if (!ignoredConditions) {
		return false
	}

	// If the ignored path matches with the top items in the stack,
	// the tranfer is ignored.
	return ignoredConditions.some(
		(item) => previousRegionsMatch(item, stack))
}

function previousRegionsMatch(
	needle: RegionType | RegionType[],
	stack: Stack<RegionType>,
): boolean {
	if (!stack.size()) {
		return false
	}

	// If the needle regions are provided as an array, we'll check the top
	// items in our region-type stack - if they match items in the needle.
	if (Array.isArray(needle)) {
		for (let i = 0; i < needle.length; i++) {
			if (needle[i] !== stack.top(i)) {
				// Current region-type in traversed region-type stack
				// doesn't match with the corresponding item in needle.
				// No match.
				return false
			}
		}

		return true
	}

	// Needle is a string, simply compare the top item in the stack with it.
	return stack.top() === needle
}
