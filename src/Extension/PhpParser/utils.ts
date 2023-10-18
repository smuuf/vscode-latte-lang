import { Position } from "./types"


const NL = '\n'


export function makePositionFromOffset(
	offset: number,
	str: string,
): Position {
	let line: number = 0
	let lastIndex: number = 0
	let nextIndex: number = 0

	while (true) {
		// Iteratively find more and more newline characters in the string and
		// keep track of their count.
		nextIndex = str.indexOf(NL, lastIndex)
		if (nextIndex === -1) {
			break
		}

		line++
		lastIndex = nextIndex
	}

	if (line === 0) {
		return {
			offset: offset,
			line: 0,
			character: offset,
		}
	}

	// At this point we know the offset of the latest newline character (we
	// still have it in the nextIndex variable) and we can calculate the
	// character position on the final line.
	return {
		offset: offset,
		line: 0,
		character: str.length - str.lastIndexOf(NL) - 1 + nextIndex,
	}
}


export function makePositionsComplete(
	incompletePositions: Position[],
	str: string,
): void {
	let line: number = 1
	let offset: number = 0
	let nextNewlineOffset = -1
	let previousNewlineOffset = -1

	// Sort the incomplete positions first.
	incompletePositions.sort((a, b) => a.offset - b.offset)

	// Modify the array in-place. We don't actually care about the array,
	// but we want to mutate the position objects inside it.
	incompletePositions.forEach((position) => {
		while (position.offset > offset) {
			previousNewlineOffset = nextNewlineOffset
			nextNewlineOffset = str.indexOf(NL, offset + 1)
			if (nextNewlineOffset === -1) {
				return
			}

			line++
			offset = nextNewlineOffset
		}

		position.line = line
		position.character = position.offset - previousNewlineOffset
	})

}
