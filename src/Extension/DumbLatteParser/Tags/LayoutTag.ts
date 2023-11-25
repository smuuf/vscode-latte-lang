import path from 'path'
import DumbTag from '../Scanner/DumbTag'
import { AbstractTag, ParsingContext, Range, TagReferencingTargetFile } from '../types'
import { ArgsParser } from '../argsParser'
import { stripIndentation } from '../../utils/stripIndentation'

/**
 * {layout "file"}
 */
export default class LayoutTag extends AbstractTag implements TagReferencingTargetFile {
	// Not readonly, because ExtendsTag extends this class and needs to specify
	// another dumb name.
	public static DUMB_NAME = 'layout'

	constructor(
		range: Range,
		readonly relativePath: string,
		readonly relativePathOffset: integer,
		readonly absolutePath: string | null,
	) {
		super(range)
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): LayoutTag | null {
		const args = dumbTag.args

		const ap = new ArgsParser(args)
		let originalTargetPathOffset = ap.offset
		let relativePath = ap.consumeQuotedStringOrWord()
		if (!relativePath) {
			return null
		}

		let absolutePath: string | null = null
		if (parsingContext.filePath) {
			const dirname = path.dirname(parsingContext.filePath)
			absolutePath = path.resolve(dirname, relativePath)
		}

		return new this(
			dumbTag.tagRange,
			relativePath,
			dumbTag.argsOffset + originalTargetPathOffset,
			absolutePath,
		)
	}

	public getDescription(): string {
		return stripIndentation(`
		Specifies a layout file \`${this.absolutePath}\` which this template will extend.

		Example:
		\`\`\`latte
		{layout 'layout.latte'}
		\`\`\`

		[Documentation](https://latte.nette.org/en/template-inheritance#toc-layout-inheritance)
		`)
	}
}
