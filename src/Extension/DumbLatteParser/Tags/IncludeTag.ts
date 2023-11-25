import path from 'path'
import DumbTag from '../Scanner/DumbTag'
import { AbstractTag, ParsingContext, Range, TagReferencingTargetFile } from '../types'
import { ArgsParser } from '../argsParser'
import { stripIndentation } from '../../utils/stripIndentation'

/**
 * Reference: https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L211
 *
 * {include [file] "file" [with blocks] [,] [params]}
 * {include [block] name [,] [params]}
 */
export default class IncludeTag extends AbstractTag implements TagReferencingTargetFile {
	public static DUMB_NAME = 'include'

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
	): IncludeTag | null {
		const args = dumbTag.args

		const ap = new ArgsParser(args)
		const type = ap.consumeAnyOfWords('file', 'block')
		if (type && type !== 'file') {
			// We care about files only, if the include type is specifed.
			return null
		}

		let originalTargetPathOffset = ap.offset
		let relativePath = ap.consumeQuotedStringOrWord()
		if (!relativePath || relativePath[0] === '#') {
			// We care about files only and "#" represents an explicit block name.
			return null
		}

		// If Latte would interpret it as a block name, we don't want it.
		// https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L221
		if (relativePath.match(/^[\w-]+$/)) {
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
		Includes a template file \`${this.absolutePath}\`.


		Example:
		\`\`\`latte
		{include 'file.latte'}
		{include 'template.latte', foo: 'bar', id: 123}
		{include 'template.latte' with blocks}
		\`\`\`

		[Documentation](https://latte.nette.org/en/tags#toc-including-templates)
		`)
	}
}
