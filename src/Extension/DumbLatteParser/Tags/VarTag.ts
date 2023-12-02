import { parsePhpType, PhpType } from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import { VARIABLE_REGEX } from '../../regexes'
import { stringAfterFirstNeedle } from '../../utils/common'
import { stripIndentation } from '../../utils/stripIndentation'
import { ArgsParser } from '../argsParser'
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
		readonly nameRange: Range,
	) {
		super(range)
	}

	static fromDumbTag(dumbTag: DumbTag, parsingContext: ParsingContext): VarTag | null {
		const ap = new ArgsParser(dumbTag.args)

		const typeMatch = ap.consumeRegex(/[^\$]*(?=\$)/) // Everything non-"$" before the first $, or nothing.
		let typeStr = typeMatch ? typeMatch[0] : null
		if (typeStr && !isValidTypeSpec(typeStr)) {
			// Discard type specification if it's invalid. We'll just act
			// as there was no type specification.
			typeStr = null
		}

		const varMatch = ap.consumeRegex(VARIABLE_REGEX)
		if (!varMatch) {
			return null
		}

		const varName = varMatch[0]
		const varNameOffset = varMatch.indices![0][0]
		if (!isValidVariableName(varName)) {
			// Missing or invalid variable name specification.
			return null
		}

		return new this(
			dumbTag.tagRange,
			varName,
			typeStr ? parsePhpType(typeStr) : null,
			// Extract the expression after "=".32-
			stringAfterFirstNeedle(dumbTag.args, '=')?.trim() ?? null,
			{
				startOffset: dumbTag.argsOffset + varNameOffset,
				endOffset: dumbTag.argsOffset + varNameOffset + varName.length,
			} as Range,
		)
	}

	public getDescription(): string {
		const typeRepr = getPhpTypeRepr(this.varType)

		return stripIndentation(`
		Defines variable \`${this.varName}\` of type \`${typeRepr}\`.

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
