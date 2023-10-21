import { parsePhpType, PhpType } from '../../phpTypeParser/phpTypeParser'
import { isValidTypeSpec } from '../regexes'
import { isValidVariableName } from '../regexes'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag } from '../types'

export default class VarTag extends AbstractTag {
	public static readonly DUMB_NAME = 'var'

	constructor(
		readonly varName: string,
		readonly tagRange: Range,
		readonly varType: PhpType | null,
		readonly nameOffset: integer,
	) {
		super()
	}

	static fromDumbTag(dumbTag: DumbTag): VarTag | null {
		const argsParts = dumbTag.args.split(/\s+/, 10) // Generous limit.
		const nameOffset = dumbTag.args.indexOf('$')

		// Doesn't contain a variable name.
		if (nameOffset === -1) {
			return null
		}

		// Just a variable name without a specified type.
		if (isValidVariableName(argsParts[0])) {
			return new this(
				argsParts[0],
				dumbTag.tagRange,
				null,
				dumbTag.argsOffset + nameOffset,
			)
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second arg.
		if (!isValidVariableName(argsParts[1])) {
			return null
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second word.
		if (!isValidTypeSpec(argsParts[0])) {
			return null
		}

		return new this(
			argsParts[1],
			dumbTag.tagRange,
			parsePhpType(argsParts[0])!,
			dumbTag.argsOffset + nameOffset,
		)
	}
}
