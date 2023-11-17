import { PhpType } from '../phpTypeParser/phpTypeParser'

type LocationInfo = {
	uri: string
	offset: integer
} | null

export type PhpMethodInfo = {
	name: string
	location: LocationInfo
	flags: PhpMethodFlags
	returnType?: PhpType | null
}

export type PhpMethodFlags = {
	visibility: SymbolVisibility
	static: boolean
}

export type PhpClassMethods = Map<string, PhpMethodInfo>

export type PhpClassInfo = {
	name: string
	namespace: string
	parentFqn: string | null
	fqn: string
	location: LocationInfo
	methods: PhpClassMethods
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
