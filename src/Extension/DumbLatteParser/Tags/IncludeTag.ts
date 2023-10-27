import path from 'path'
import DumbTag from '../Scanner/DumbTag'
import { AbstractTag, ParsingContext, Range } from '../types'
import { ArgsParser } from '../argsParser'

/**
 * Reference: https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L211
 *
 * {include [file] "file" [with blocks] [,] [params]}
 * {include [block] name [,] [params]}
 */
export default class IncludeTag extends AbstractTag {
	public static readonly DUMB_NAME = 'include'

	constructor(readonly targetFile: string, readonly targetOffset: integer) {
		super()
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

		let targetOffset = ap.offset
		let includeTarget = ap.consumeQuotedStringOrWord()
		if (!includeTarget || includeTarget[0] === '#') {
			// We care about files only and "#" represents an explicit block name.
			return null
		}

		// If Latte would interpret it as a block name, we don't want it.
		// https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L221
		if (includeTarget.match(/^[\w-]+$/)) {
			return null
		}

		if (parsingContext.filePath) {
			const dirname = path.dirname(parsingContext.filePath)
			includeTarget = path.resolve(dirname, includeTarget)
			if (!includeTarget.startsWith(dirname)) {
				return null
			}
		}

		return new this(includeTarget, dumbTag.argsOffset + targetOffset)
	}
}
