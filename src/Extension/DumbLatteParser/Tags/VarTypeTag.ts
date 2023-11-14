import { parsePhpType, PhpType } from '../../phpTypeParser/phpTypeParser'
import { isValidTypeSpec, isValidVariableName } from '../regexes'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag, ParsingContext } from '../types'

/**
 * {varType SomeType<a|b>|c $var}
 */
export default class VarTypeTag extends AbstractTag {
	public static readonly DUMB_NAME = 'varType'
	readonly expression = null

	constructor(
		readonly varName: string,
		readonly tagRange: Range,
		readonly varType: PhpType | null,
		readonly nameOffset: integer,
	) {
		super()
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): VarTypeTag | null {
		const tailParts = dumbTag.args.split(/\s+/, 10) // Generous limit.
		const nameOffset = dumbTag.args.indexOf('$')

		// Doesn't contain a variable name.
		if (nameOffset === -1) {
			return null
		}

		// Invalid {varType ...} structure - has too many arguments.
		if (tailParts.length !== 2) {
			return null
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second word.
		if (!isValidTypeSpec(tailParts[0])) {
			return null
		}

		// Invalid {var ...} structure - doesn't have a $variableName as
		// the second arg.
		if (!isValidVariableName(tailParts[1])) {
			return null
		}

		return new this(
			tailParts[1],
			dumbTag.tagRange,
			parsePhpType(tailParts[0])!,
			dumbTag.argsOffset + nameOffset,
		)
	}
}
