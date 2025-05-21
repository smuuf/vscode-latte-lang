import { PhpType } from './phpTypeParser/phpTypeParser'

export type PhpFunctionInfo = {
	name: string
	returnType: PhpType | null
}

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

export type LocationInfo = {
	uri: string | null
	offset: integer
} | null

export type PhpClassPropertyInfo = {
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
		[name: string]: PhpClassPropertyInfo
	}
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
