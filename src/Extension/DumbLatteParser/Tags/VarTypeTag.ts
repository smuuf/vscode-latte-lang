import { parsePhpType, PhpType } from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import { VARIABLE_REGEX } from '../../regexes'
import { stripIndentation } from '../../utils/stripIndentation'
import { ArgsParser } from '../argsParser'
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
		range: Range,
		readonly varName: string,
		readonly varType: PhpType,
		readonly nameRange: Range,
		readonly typeRange: Range,
	) {
		super(range)
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): VarTypeTag | null {
		const ap = new ArgsParser(dumbTag.args)

		const typeMatch = ap.consumeRegex(/.*(?=\$)/) // Everything before the first $ or nothing.
		if (!typeMatch) {
			return null
		}

		const typeStr = typeMatch[0]
		const typeOffset = typeMatch.indices![0][0]
		if (!isValidTypeSpec(typeStr)) {
			// Missing or invalid type specification.
			return null
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
			parsePhpType(typeStr)!,
			{
				startOffset: dumbTag.argsOffset + varNameOffset,
				endOffset: dumbTag.argsOffset + varNameOffset + varName.length,
			} as Range,
			{
				startOffset: dumbTag.argsOffset + typeOffset,
				endOffset: dumbTag.argsOffset + typeOffset + typeStr.length,
			} as Range,
		)
	}

	public getDescription(): string {
		const typeRepr = getPhpTypeRepr(this.varType)

		return stripIndentation(`
		Declares a type of variable \`${this.varName}\` to be \`${typeRepr}\`.

		Example:
		\`\`\`latte
		{varType Nette\Security\User $user}
		{varType string $lang}
		\`\`\`

		[Documentation](https://latte.nette.org/en/type-system#toc-vartype)
		`)
	}
}
