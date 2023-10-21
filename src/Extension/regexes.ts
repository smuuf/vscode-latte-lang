export const VARIABLE_REGEX = new RegExp('\\$[a-zA-Z_][a-zA-Z0-9_]*')
export const CLASS_NAME_REGEX = new RegExp(
	`\\\\?(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\\\\[a-zA-Z_][a-zA-Z0-9_]*)*`,
)
export const METHOD_CALL_REGEX = new RegExp(`(\\$[a-zA-Z_][a-zA-Z0-9_]*)->([^\\(]*)`)
