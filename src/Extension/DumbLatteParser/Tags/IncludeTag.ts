import * as vscode from 'vscode'
import path from 'path'
import DumbTag from '../Scanner/DumbTag'
import { AbstractTag, ParsingContext, Range } from '../types'
import { ArgsParser } from '../argsParser'
import { AbstractPoi, GotoDefinitionPoi, HoverPoi, PoiType } from '../poiTypes'
import { ExtensionCore } from '../../ExtensionCore'
import { getPositionAtOffset, ZeroVoidRange } from '../../utils/common.vscode'

/**
 * Reference: https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L211
 *
 * {include [file] "file" [with blocks] [,] [params]}
 * {include [block] name [,] [params]}
 */
export default class IncludeTag extends AbstractTag {
	public static readonly DUMB_NAME = 'include'

	constructor(
		readonly relativePath: string,
		readonly relativePathOffset: integer,
		readonly absolutePath: string | null,
	) {
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
			relativePath,
			dumbTag.argsOffset + originalTargetPathOffset,
			absolutePath,
		)
	}

	public getPois(): AbstractPoi[] {
		return [
			{
				type: PoiType.Hover,
				range: [
					this.relativePathOffset + 1,
					this.relativePathOffset + this.relativePath.length + 1,
				],
				contentFn: async (
					doc: TextDoc,
					position: vscode.Position,
					extCore: ExtensionCore,
				) => {
					const includes = this.absolutePath ?? this.relativePath
					return `_extends_ \`${includes}\``
				},
			} as HoverPoi,
			{
				type: PoiType.GotoDefinition,
				range: [
					this.relativePathOffset + 1,
					this.relativePathOffset + this.relativePath.length + 1,
				],
				contentFn: async (
					doc: TextDoc,
					position: vscode.Position,
					extCore: ExtensionCore,
				) => {
					// Couldn't resolve to final absolute path. No goto
					// definition.
					if (!this.absolutePath) {
						return null
					}

					const locationLink: vscode.LocationLink = {
						targetUri: vscode.Uri.parse(this.absolutePath),
						targetRange: ZeroVoidRange,
						originSelectionRange: new vscode.Range(
							await getPositionAtOffset(this.relativePathOffset + 1, doc),
							await getPositionAtOffset(
								this.relativePathOffset + this.relativePath.length + 1,
								doc,
							),
						),
					}

					return [locationLink]
				},
			} as GotoDefinitionPoi,
		]
	}
}
