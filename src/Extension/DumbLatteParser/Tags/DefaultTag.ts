import { parsePhpType, PhpType } from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import { stringAfterFirstNeedle } from '../../utils/common'
import { stripIndentation } from '../../utils/stripIndentation'
import { isValidTypeSpec, isValidVariableName } from '../regexes'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag, ParsingContext } from '../types'

/**
 * {default SomeType<a|b>|c $var = "value"}
 * {default $var = "value"}
 */
export default class DefaultTag extends AbstractTag {
	public static readonly DUMB_NAME = 'default'

	constructor(
		range: Range,
		readonly varName: string,
		readonly varType: PhpType | null,
		readonly expression: string | null,
		readonly nameRange: Range,
	) {
		super(range)
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): DefaultTag | null {
		const argsParts = dumbTag.args.split(/\s+/, 10) // Generous limit.
		const nameOffset = dumbTag.args.indexOf('$')

		// Doesn't contain a variable name.
		if (nameOffset === -1) {
			return null
		}

		// Just a variable name without a specified type.
		if (isValidVariableName(argsParts[0])) {
			return new this(
				dumbTag.tagRange,
				argsParts[0],
				null,
				// Extract the expression after "=".
				stringAfterFirstNeedle(dumbTag.args, '=')?.trim() ?? null,
				{
					startOffset: dumbTag.argsOffset + nameOffset,
					endOffset: dumbTag.argsOffset + nameOffset + argsParts[0].length,
				} as Range,
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
			dumbTag.tagRange,
			argsParts[1],
			parsePhpType(argsParts[0])!,
			// Extract the expression after "=".
			stringAfterFirstNeedle(dumbTag.args, '=')?.trim() ?? null,
			{
				startOffset: dumbTag.argsOffset + nameOffset,
				endOffset: dumbTag.argsOffset + nameOffset + argsParts[1].length,
			} as Range,
		)
	}

	public getDescription(): string {
		const typeRepr = getPhpTypeRepr(this.varType)

		return stripIndentation(`
		If not yet defined, this tag defines a new variable \`${this.varName}\` of type \`${typeRepr}\`.

		Example:
		\`\`\`latte
		{default SomeType $someVariable = ...}
		{default $someVariable = ...}
		\`\`\`
		`)
	}
}
