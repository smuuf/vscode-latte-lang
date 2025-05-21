import { PhpClassInfo } from '../types.phpEntities'

export type PhpWorkspaceFileData = {
	classes: Record<string, PhpClassInfo>
}

export type ParsingContext = {
	namespace: string
	uri: string | null
	imports: Map<string, string>
}
