import { PhpType } from '../phpTypeParser/phpTypeParser'

export type PhpWorkspaceFileData = {
	classes: Record<string, PhpClassInfo>
}

type LocationInfo = {
	uri: string | null
	offset: integer
} | null

/**
 * For keeping track of flags of symbols in a PHP class (both properties and
 * methods).
 */
export type PhpClassSymbolFlags = {
	visibility: SymbolVisibility
	static: boolean
}

export type PhpMethodInfo = {
	name: string
	location: LocationInfo
	flags: PhpClassSymbolFlags
	returnType?: PhpType | null
}

export type PhpClassPropInfo = {
	name: string
	location: LocationInfo
	flags: PhpClassSymbolFlags
	type?: PhpType | null
}

export type PhpClassInfo = {
	name: string
	namespace: string
	parentFqn: string | null
	fqn: string
	location: LocationInfo
	methods: {
		[name: string]: PhpMethodInfo
	}
	properties: {
		[name: string]: PhpClassPropInfo
	}
}

export type ParsingContext = {
	namespace: string
	uri: string | null
	imports: Map<string, string>
}

export enum SymbolVisibility {
	PUBLIC = 'public',
	PROTECTED = 'protected',
	PRIVATE = 'private',
}

export function symbolVisibilityFactory(v: string): SymbolVisibility {
	switch (v) {
		case 'protected':
			return SymbolVisibility.PROTECTED
		case 'private':
			return SymbolVisibility.PRIVATE
	}

	return SymbolVisibility.PUBLIC
}

export const SymbolStatic = 'static'
