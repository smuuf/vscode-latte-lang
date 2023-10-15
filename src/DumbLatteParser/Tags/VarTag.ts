import { parsePhpType, PhpType } from "../../TypeParser/typeParser";
import { isValidTypeSpec } from "../regexes";
import { isValidClassName, isValidVariableName } from "../regexes";
import DumbTag from "../Scanner/DumbTag";
import { Range, AbstractTag } from "../types";


export default class VarTag extends AbstractTag {

	public static readonly DUMB_NAME = 'var';

	constructor(
		readonly name: string,
		readonly range: Range,
		readonly type: PhpType | null,
	) {
		super()
	}

	static fromDumbTag(dumbTag: DumbTag): VarTag | null {
		const tailParts = dumbTag.tail.split(/\s+/);

		// Just a variable name without a specified type.
		if (isValidVariableName(tailParts[0])) {
			return new this(
				tailParts[0],
				dumbTag.range,
				null,
			);
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second arg.
		if (!isValidVariableName(tailParts[1])) {
			return null;
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second word.
		if (!isValidTypeSpec(tailParts[0])) {
			return null;
		}

		return new this(
			tailParts[1],
			dumbTag.range,
			parsePhpType(tailParts[0])!,
		);
	}

}
