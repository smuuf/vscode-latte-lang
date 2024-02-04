import * as pp from 'php-parser'
import {
	PhpClassInfo,
	PhpClassPropInfo,
	PhpMethodInfo,
	PhpWorkspaceFileData,
	SymbolVisibility,
	symbolVisibilityFactory,
} from './types'
import {
	isInstanceOf,
	isString,
	narrowType,
	stringAfterFirstNeedle,
} from '../utils/common'
import {
	PhpType,
	parsePhpType,
	resolveMaybeImportedName,
} from '../phpTypeParser/phpTypeParser'
import { ImportContext } from '../phpTypeParser/types'
import { DocBlockData, parseDocBlockString } from './docBlockParser'

export class AstParser {
	private readonly data: PhpWorkspaceFileData
	private readonly specialized: { [p: string]: (astNode: any) => void } = {
		namespace: this.parseNamespace,
		usegroup: this.parseUseGroup,
		class: this.parseClass,
		method: this.parseMethod,
	}

	private readonly context: ImportContext

	constructor(private rootNode: pp.Program, private uri: string) {
		this.data = {
			classes: {},
		}
		this.context = {
			namespace: '',
			/**
			 * A mapping of base names to fully-qualified class names.
			 * This makes resolving possibly imported names easier.
			 *
			 * E.g. {"World": "\Hello\World", ...}
			 */
			imports: new Map(),
		}
	}

	public parseRoot(): PhpWorkspaceFileData {
		this.parseNode(this.rootNode)
		return this.data
	}

	private parseNode(astNode: pp.Node): void {
		const processor = this.specialized[astNode.kind] ?? this.parseChildren
		processor.apply(this, [astNode])
	}

	private parseChildren(astNode: pp.Block): void {
		if ('children' in astNode) {
			for (const child of astNode.children) {
				this.parseNode(child)
			}
		}
	}

	private parseName(name: string | pp.Identifier | null): string {
		if (isString(name)) {
			narrowType<string>(name)
			return name
		}

		narrowType<pp.Identifier>(name)
		return name.name
	}

	private parseNamespace(astNode: pp.Namespace): void {
		this.insideNamespace(astNode, () => this.parseChildren(astNode))
	}

	private parseUseGroup(astNode: pp.UseGroup): void {
		// pp.useGroup has wrong property name specified, it's 'items' and
		// not 'item'. See https://github.com/glayzzle/php-parser/issues/1008
		// @ts-ignore
		const items = astNode.items

		for (const singleUse of items) {
			const useName = singleUse.name
			// We want to extract the name that's actually used further in the code.
			// E.g. for "A\B\C" we want "C". We also handle aliases, e.g.
			// for "A\B\C as D" we want "D".
			const baseName = this.parseName(
				singleUse.alias ?? useName.substring(useName.lastIndexOf('\\') + 1),
			)

			this.context.imports.set(baseName, useName)
		}
	}

	private parseClass(astNode: pp.Class): void {
		const className = this.parseName(astNode.name)

		const methods: { [key: string]: PhpMethodInfo } = {}
		const props: { [key: string]: PhpClassPropInfo } = {}

		for (const item of astNode.body) {
			switch (item.kind) {
				case 'method':
					const [methodName, info] = this.parseMethod(item as pp.Method)
					methods[methodName] = info
					break
				// case 'propertystatement':
				// 	{propName, info} = this.parseProperty(item)
				// 	props[name] = propName
				// 	break;
			}
		}

		let parentFqn = null
		if (astNode.extends) {
			parentFqn = resolveMaybeImportedName(
				this.parseName(astNode.extends),
				this.context,
			)
		}

		this.data.classes[className] = {
			name: className,
			fqn: `${this.context.namespace}\\${className}`,
			namespace: this.context.namespace,
			parentFqn: parentFqn,
			location: {
				offset: astNode.loc!.start.offset,
				uri: this.uri,
			},
			methods: methods,
		} as PhpClassInfo
	}

	private parseMethod(astNode: pp.Method): [string, PhpMethodInfo] {
		const methodName = this.parseName(astNode.name)

		// We already have our own type-string parser, so let's parse the return
		// type from the method's original non-AST-ed source code.
		let returnTypeStr = stringAfterFirstNeedle(
			astNode?.loc?.source ?? '',
			'):',
		)?.trim()

		// Extract "@return" type in the method's docblock, if there is one.
		const docBlockData = this.parseDocBlock(astNode)
		const docBlockReturnType = docBlockData?.tags.get('return')
		if (docBlockReturnType) {
			returnTypeStr = docBlockReturnType
		}

		const info: PhpMethodInfo = {
			name: methodName,
			flags: {
				visibility: symbolVisibilityFactory(astNode.visibility),
				static: astNode.isStatic,
			},
			location: {
				offset: astNode.loc!.start.offset,
				uri: this.uri,
			},
			returnType: parsePhpType(returnTypeStr ?? 'mixed', this.context),
		}

		return [methodName, info]
	}

	private parseDocBlock(astNode: pp.Node): DocBlockData | null {
		let texts = []
		for (const comment of astNode.leadingComments ?? []) {
			texts.push(comment.value)
		}

		return parseDocBlockString(texts.join('\n'))
	}

	private insideNamespace(namespace: pp.Namespace, fn: Function): void {
		const old = this.context.namespace
		this.context.namespace = namespace.name
		fn()
		this.context.namespace = old
	}
}
