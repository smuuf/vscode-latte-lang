import Stack from '../../utils/Stack'
import { RegionType } from './types'

type TransferPath = (RegionType | Array<RegionType>)[]
type TransferDefinition = {
	[key in RegionType]?: TransferPath
}

const allowedTransfers: TransferDefinition = {
	[RegionType.HTML_TAG]: [
		RegionType.HTML,
		[RegionType.QUOTES_S, RegionType.LATTE_TAG],
		[RegionType.QUOTES_D, RegionType.LATTE_TAG],
	],
	[RegionType.LATTE_TAG]: [
		RegionType.HTML,
		RegionType.HTML_TAG,
		[RegionType.QUOTES_S, RegionType.HTML_TAG],
		[RegionType.QUOTES_D, RegionType.HTML_TAG],
	],
	[RegionType.QUOTES_S]: [
		RegionType.HTML,
		RegionType.HTML_TAG,
		RegionType.QUOTES_D,
		RegionType.LATTE_TAG,
	],
	[RegionType.QUOTES_D]: [
		RegionType.HTML,
		RegionType.HTML_TAG,
		RegionType.QUOTES_S,
		RegionType.LATTE_TAG,
	],
}

/**
 * Mapping of region-type transfers which should be ignored.
 *
 * The key is the new region-type (into which the transfer happens), the value
 * is a list of either:
 *
 * 1. Current region-type from which the transfer to the new region-type will be
 *    ignored.
 *    For example: `{RegionType.HTML_TAG: [RegionType.LATTE_TAG]}` means
 *    "if current region-type is LATTE_TAG and the scanner encounters
 *    a start of region of type HTML_TAG, the transfer is ignored and we
 *    stay in LATTE_TAG region type".
 *
 * 2. A list of region-types, which represent a chain in region-type stack
 *    which - if it matches with the top items in the current region-type
 *    stack - will make the new region type to be ignored.
 *    For example: `{RegionType.HTML_TAG: [[RegionType.QUOTES_S,
 *    RegionType.HTML_TAG]]}` means "if we're currently in the QUOTES_S
 *    region-type, which itself is inside HTML_TAG region-type, the transfer
 *    into HTML_TAG region-type is ignored and we stay in QUOTES_S region type".
 *
 * If any of the values in the list for each mapping item matches, the transfer
 * is ignored.
 */
const ignoredTransfers: TransferDefinition = {
	[RegionType.QUOTES_S]: [RegionType.QUOTES_D, RegionType.LATTE_TAG, RegionType.HTML],
	[RegionType.QUOTES_D]: [RegionType.QUOTES_S, RegionType.LATTE_TAG, RegionType.HTML],
	[RegionType.HTML_TAG]: [
		RegionType.LATTE_TAG,
		[RegionType.QUOTES_S, RegionType.HTML_TAG],
		[RegionType.QUOTES_D, RegionType.HTML_TAG],
	],
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
	return allowedCondition.some((item) => previousRegionsMatch(item, stack))
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
	return ignoredConditions.some((item) => previousRegionsMatch(item, stack))
}

function previousRegionsMatch(
	needle: RegionType | RegionType[],
	stack: Stack<RegionType>,
): boolean {
	if (!stack.getSize()) {
		return false
	}

	// If the needle regions are provided as an array, we'll check the top
	// items in our region-type stack - if they match items in the needle.
	if (Array.isArray(needle)) {
		for (let i = 0; i < needle.length; i++) {
			if (needle[i] !== stack.getTop(i)) {
				// Current region-type in traversed region-type stack
				// doesn't match with the corresponding item in needle.
				// No match.
				return false
			}
		}

		return true
	}

	// Needle is a string, simply compare the top item in the stack with it.
	return stack.getTop() === needle
}
