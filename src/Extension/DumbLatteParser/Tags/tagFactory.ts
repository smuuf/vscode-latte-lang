import DumbTag from '../Scanner/DumbTag'
import { AbstractTag, ParsingContext } from '../types'
import DefaultTag from './DefaultTag'
import ForeachTag from './ForeachTag'
import IncludeTag from './IncludeTag'
import VarTag from './VarTag'
import VarTypeTag from './VarTypeTag'
import LayoutTag from './LayoutTag'
import ExtendsTag from './ExtendsTag'
import SandboxTag from './SandboxTag'
import CaptureTag from './CaptureTag'
import TemplateTypeTag from './TemplateTypeTag'

// NOTE: 'unknown' to avoid (I think nonsensical) "Type 'typeof VarTag' is
// not assignable to type 'typeof AbstractTag'." error, which I don't know
// how to handle better.
const KNOWN_TAG_TYPES: (unknown | typeof AbstractTag)[] = [
	VarTag,
	VarTypeTag,
	DefaultTag,
	ForeachTag,
	IncludeTag,
	LayoutTag,
	ExtendsTag,
	SandboxTag,
	CaptureTag,
	TemplateTypeTag,
]

export function createFromDumbTag(
	dumbTag: DumbTag | null,
	parsingContext: ParsingContext,
): AbstractTag | null {
	if (!dumbTag) {
		return null
	}

	const name = dumbTag.name
	for (let tagTypeClass of KNOWN_TAG_TYPES) {
		// NOTE: This cast is also necessary for typescript to shut up
		// about accessing undefined static properties of tag classes which are
		// defined on their abstract class.
		if ((tagTypeClass as typeof AbstractTag).DUMB_NAME !== name) {
			continue
		}

		const tag = (tagTypeClass as typeof AbstractTag).fromDumbTag(
			dumbTag,
			parsingContext,
		)

		if (tag !== null) {
			return tag
		}
	}

	return null
}
