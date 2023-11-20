import * as vscode from 'vscode'
import path from 'path'
import DumbTag from '../Scanner/DumbTag'
import { AbstractTag, ParsingContext, Range } from '../types'
import { ArgsParser } from '../argsParser'
import { AbstractPoi, GotoDefinitionPoi, HoverPoi, PoiType } from '../poiTypes'
import { ExtensionCore } from '../../ExtensionCore'
import { getPositionAtOffset, ZeroVoidRange } from '../../utils/common.vscode'

/**
 * {layout "file"}
 */
export default class LayoutTag extends AbstractTag {
	// Not readonly, because ExtendsTag extends this class and needs to specify
	// another dumb name.
	public static DUMB_NAME = 'layout'

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
					return `_use layout_ \`${includes}\``
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
