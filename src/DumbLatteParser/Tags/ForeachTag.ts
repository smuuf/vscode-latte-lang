import { isValidVariableName } from "../regexes";
import DumbTag from "../Scanner/DumbTag";
import { Range, AbstractTag } from "../types";


export default class ForeachTag extends AbstractTag {

	public static readonly DUMB_NAME = 'foreach';

	constructor(
		readonly range: Range,
		readonly iteratesVariableName: string,
		readonly iteratesAsVariableName: string,
	) {
		super()
	}

	static fromDumbTag(dumbTag: DumbTag): ForeachTag | null {
		const tailParts = dumbTag.tail.split(/\s+/);

		// Invalid "$something as $thing" structure - wrong number or parts.
		if (tailParts.length !== 3) {
			return null;
		}

		// Invalid "$something as $thing" structure - doesn't have the
		// word "as" inbetween.
		if (tailParts[1] !== "as") {
			return null;
		}

		// Invalid {var ...} structure - doesn't have valid variable names.
		// Known issue: This disallows iteration of literals: "[0, 1] as $meh"
		// or destructuring "[...] as ['key1' => $a, ...]", but meh.
		if (
			!isValidVariableName(tailParts[0])
			|| !isValidVariableName(tailParts[2])
		) {
			return null;
		}

		return new this(
			dumbTag.range,
			tailParts[0],
			tailParts[2],
		);
	}

}
