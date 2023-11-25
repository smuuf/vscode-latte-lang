import { parsePhpType, PhpType } from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import { stringAfterFirstNeedle } from '../../utils/common'
import { stripIndentation } from '../../utils/stripIndentation'
import { isValidTypeSpec } from '../regexes'
import { isValidVariableName } from '../regexes'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag, ParsingContext } from '../types'

/**
 * {var SomeType<a|b>|c $var = "value"}
 * {var $var = "value"}
 */
export default class VarTag extends AbstractTag {
	public static readonly DUMB_NAME = 'var'

	constructor(
		range: Range,
		readonly varName: string,
		readonly varType: PhpType | null,
		readonly expression: string | null,
		readonly nameOffset: integer,
	) {
		super(range)
	}

	static fromDumbTag(dumbTag: DumbTag, parsingContext: ParsingContext): VarTag | null {
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
			dumbTag.tagRange,
			argsParts[1],
			parsePhpType(argsParts[0])!,
			// Extract the expression after "=".
			stringAfterFirstNeedle(dumbTag.args, '=')?.trim() ?? null,
			dumbTag.argsOffset + nameOffset,
		)
	}

	public getDescription(): string {
		const typeRepr = getPhpTypeRepr(this.varType)

		return stripIndentation(`
		Defines variable \`${this.varName}\` of type \`${typeRepr}\`

		Example:
		\`\`\`latte
		{var $name = 'John Smith'}
		{var $age = 27}
		{var string $name = $article->getTitle()}
		\`\`\`

		[Documentation](https://latte.nette.org/en/tags#toc-var-default)
		`)
	}
}
