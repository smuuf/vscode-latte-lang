import DumbTag from '../Scanner/DumbTag'
import { AbstractTag } from '../types'
import DefaultTag from './DefaultTag'
import ForeachTag from './ForeachTag'
import VarTag from './VarTag'
import VarTypeTag from './VarTypeTag'

export abstract class TagFactory {
	// NOTE: 'unknown' to avoid (I think nonsensical) "Type 'typeof VarTag' is
	// not assignable to type 'typeof AbstractTag'." error, which I don't know
	// how to handle better.
	private static readonly KNOWN_TAG_TYPES: (unknown | typeof AbstractTag)[] = [
		VarTag,
		VarTypeTag,
		DefaultTag,
		ForeachTag,
	]

	static createFromDumbTag(dumbTag: DumbTag | null): AbstractTag | null {
		if (!dumbTag) {
			return null
		}

		const name = dumbTag.name
		for (let tagTypeClass of TagFactory.KNOWN_TAG_TYPES) {
			// NOTE: This cast is also necessarry for typescript to shut up
			// about accessing undefined static properties of tag classes which are
			// defined on their abstract class.
			if ((tagTypeClass as typeof AbstractTag).DUMB_NAME !== name) {
				continue
			}

			const tag = (tagTypeClass as typeof AbstractTag).fromDumbTag(dumbTag)
			if (tag !== null) {
				return tag
			}
		}

		return null
	}
}
