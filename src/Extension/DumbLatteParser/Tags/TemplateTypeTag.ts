import { parsePhpTypeCached, PhpType } from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import { stripIndentation } from '../../utils/stripIndentation'
import { ArgsParser } from '../argsParser'
import { isValidTypeSpec, isValidVariableName } from '../regexes'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag, ParsingContext } from '../types'

/**
 * {templateTypeTag N\S\SomeType}
 */
export default class TemplateTypeTag extends AbstractTag {
	public static readonly DUMB_NAME = 'templateType'

	constructor(range: Range, readonly type: PhpType, readonly typeRange: Range) {
		super(range)
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): TemplateTypeTag | null {
		const ap = new ArgsParser(dumbTag.args)

		const typeMatch = ap.consumeRegex(/.+/) // Everything up to the end.
		if (!typeMatch) {
			return null
		}

		const typeStr = typeMatch[0]
		const typeOffset = typeMatch.indices![0][0]
		if (!isValidTypeSpec(typeStr)) {
			// Invalid type specification.
			return null
		}

		return new this(dumbTag.tagRange, parsePhpTypeCached(typeStr)!, {
			startOffset: dumbTag.argsOffset + typeOffset,
			endOffset: dumbTag.argsOffset + typeOffset + typeStr.length,
		} as Range)
	}

	public getDescription(): string {
		const typeRepr = getPhpTypeRepr(this.type)

		return stripIndentation(`
		The types of parameters passed to the template are declared using class \`${typeRepr}\`.

		Example:
		\`\`\`latte
		{templateType MyApp\\CatalogTemplateParameters}
		\`\`\`

		[Documentation](https://latte.nette.org/en/type-system#toc-templatetype)
		`)
	}
}
