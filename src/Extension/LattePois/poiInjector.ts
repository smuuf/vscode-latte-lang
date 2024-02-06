import * as vscode from 'vscode'
import IncludeTag from '../DumbLatteParser/Tags/IncludeTag'
import { AbstractPoi, GotoDefinitionPoi, HoverPoi, PoiType } from './poiTypes'
import { AbstractTag, TagReferencingTargetFile } from '../DumbLatteParser/types'
import { isInstanceOf, narrowType } from '../utils/common'
import { ExtensionCore } from '../ExtensionCore'
import { ZeroVoidRange, getPositionAtOffset } from '../utils/common.vscode'
import LayoutTag from '../DumbLatteParser/Tags/LayoutTag'
import ExtendsTag from '../DumbLatteParser/Tags/ExtendsTag'
import SandboxTag from '../DumbLatteParser/Tags/SandboxTag'
import VarTypeTag from '../DumbLatteParser/Tags/VarTypeTag'
import { getPhpTypeRepr } from '../phpTypeParser/utils'
import TemplateTypeTag from '../DumbLatteParser/Tags/TemplateTypeTag'

export function injectPoisIntoDumbTag(tag: AbstractTag): void {
	tag.pois.push(...buildTagDescriptionPoi(tag))

	switch (true) {
		case isInstanceOf(tag, VarTypeTag):
			narrowType<VarTypeTag>(tag)
			tag.pois.push(...buildVarTypeTagPois(tag))
			break
		case isInstanceOf(tag, IncludeTag):
			narrowType<IncludeTag>(tag)
			tag.pois.push(...buildReferencedFilePois('include', tag))
			break
		case isInstanceOf(tag, LayoutTag) || isInstanceOf(tag, ExtendsTag):
			// "extends" tag is an alias of "layout" tag.
			narrowType<LayoutTag>(tag)
			tag.pois.push(...buildReferencedFilePois('extend', tag))
			break
		case isInstanceOf(tag, SandboxTag):
			narrowType<SandboxTag>(tag)
			tag.pois.push(...buildReferencedFilePois('include sandboxed', tag))
			break
		case isInstanceOf(tag, TemplateTypeTag):
			narrowType<TemplateTypeTag>(tag)
			tag.pois.push(...buildTemplateTypeTagPois(tag))
			break
	}
}

function buildTagDescriptionPoi(tag: AbstractTag): AbstractPoi[] {
	// @ts-ignore
	const tagName: string = tag.constructor.DUMB_NAME
	const tagDescription = tag.getDescription().trim()
	const finalDescription =
		`_tag_ \`${tagName}\`` + (tagDescription ? `\n\n---\n${tagDescription}` : '')

	return [
		{
			type: PoiType.Hover,
			range: [tag.range.startOffset, tag.range.startOffset + tagName.length],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				return finalDescription
			},
		} as HoverPoi,
	]
}

function buildReferencedFilePois(
	description: string,
	tag: TagReferencingTargetFile,
): AbstractPoi[] {
	return [
		{
			type: PoiType.Hover,
			range: [
				tag.relativePathOffset + 1,
				tag.relativePathOffset + tag.relativePath.length + 1,
			],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				const includes = tag.absolutePath ?? tag.relativePath
				return `_${description}_ \`${includes}\``
			},
		} as HoverPoi,
		{
			type: PoiType.GotoDefinition,
			range: [
				tag.relativePathOffset + 1,
				tag.relativePathOffset + tag.relativePath.length + 1,
			],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				// Couldn't resolve to final absolute path. No goto
				// definition.
				if (!tag.absolutePath) {
					return null
				}

				const locationLink: vscode.LocationLink = {
					targetUri: vscode.Uri.parse(tag.absolutePath),
					targetRange: ZeroVoidRange,
					originSelectionRange: new vscode.Range(
						await getPositionAtOffset(tag.relativePathOffset + 1, doc),
						await getPositionAtOffset(
							tag.relativePathOffset + tag.relativePath.length + 1,
							doc,
						),
					),
				}

				return [locationLink]
			},
		} as GotoDefinitionPoi,
	]
}

function buildVarTypeTagPois(tag: VarTypeTag): AbstractPoi[] {
	return [
		{
			type: PoiType.Hover,
			range: [tag.typeRange.startOffset, tag.typeRange.endOffset],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				const repr = getPhpTypeRepr(tag.varType)
				return `_type_ \`${repr}\``
			},
		} as HoverPoi,
		{
			type: PoiType.GotoDefinition,
			range: [tag.typeRange.startOffset, tag.typeRange.endOffset],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				const classInfo = await extCore.phpWorkspaceInfoProvider.getPhpClassInfo(
					tag.varType.repr,
				)
				if (!classInfo || !classInfo.location?.uri) {
					return null
				}

				const locationLink: vscode.LocationLink = {
					targetUri: vscode.Uri.parse(classInfo.location.uri),
					targetRange: ZeroVoidRange,
					originSelectionRange: new vscode.Range(
						await getPositionAtOffset(tag.typeRange.startOffset, doc),
						await getPositionAtOffset(tag.typeRange.endOffset, doc),
					),
				}

				return [locationLink]
			},
		} as GotoDefinitionPoi,
	]
}

function buildTemplateTypeTagPois(tag: TemplateTypeTag): AbstractPoi[] {
	return [
		{
			type: PoiType.Hover,
			range: [tag.typeRange.startOffset, tag.typeRange.endOffset],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				const repr = getPhpTypeRepr(tag.type)
				return `_template type_ \`${repr}\``
			},
		} as HoverPoi,
		{
			type: PoiType.GotoDefinition,
			range: [tag.typeRange.startOffset, tag.typeRange.endOffset],
			contentFn: async (
				doc: TextDoc,
				position: vscode.Position,
				extCore: ExtensionCore,
			) => {
				const classInfo = await extCore.phpWorkspaceInfoProvider.getPhpClassInfo(
					tag.type.repr,
				)
				if (!classInfo || !classInfo.location?.uri) {
					return null
				}

				const locationLink: vscode.LocationLink = {
					targetUri: vscode.Uri.parse(classInfo.location.uri),
					targetRange: ZeroVoidRange,
					originSelectionRange: new vscode.Range(
						await getPositionAtOffset(tag.typeRange.startOffset, doc),
						await getPositionAtOffset(tag.typeRange.endOffset, doc),
					),
				}

				return [locationLink]
			},
		} as GotoDefinitionPoi,
	]
}
