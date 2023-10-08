import DumbTag from "./Scanner/DumbTag"
import { Scanner } from "./Scanner/Scanner"
import { TagFactory } from "./Tags/TagFactory"
import { AbstractTag } from "./types"


export function parseLatte(source: string): AbstractTag[] {
	const scanner = new Scanner(source)
	return  Array.from(createTags(scanner.scan()))
}


function* createTags(dumbTags: DumbTag[]): Generator<AbstractTag> {
	for (const dumbTag of dumbTags) {
		const tag = TagFactory.createFromDumbTag(dumbTag)
		if (tag) {
			yield tag
		}
	}
}
