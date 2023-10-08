import { isValidClassName, isValidVariableName } from "../regexes";
import DumbTag from "../Scanner/DumbTag";
import { Range, AbstractTag } from "../types";


export default class VarTypeTag extends AbstractTag {

	public static readonly DUMB_NAME = 'varType';

	constructor(
		readonly name: string,
		readonly range: Range,
		readonly type: string | null,
	) {
		super()
	}

	static fromDumbTag(dumbTag: DumbTag): VarTypeTag | null {
		const tailParts = dumbTag.tail.split(/\s+/);

		// Invalid {varType ...} structure - has too many arguments.
		if (tailParts.length !== 2) {
			return null;
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second word.
		if (!isValidClassName(tailParts[0])) {
			return null;
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second arg.
		if (!isValidVariableName(tailParts[1])) {
			return null;
		}

		return new this(
			tailParts[1],
			dumbTag.range,
			tailParts[0],
		);
	}

}
