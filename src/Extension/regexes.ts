export const VARIABLE_REGEX = new RegExp('\\$[a-zA-Z_][a-zA-Z0-9_]*')
export const CLASS_NAME_REGEX = new RegExp(
	`\\\\?(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\\\\[a-zA-Z_][a-zA-Z0-9_]*)*`,
)

export const METHOD_CALL_REGEX = new RegExp(
	`(?<subject>\\$[a-zA-Z_][a-zA-Z0-9_]*)\\??->(?<method>[^\\(]*)`,
)
export const METHOD_CALL_REGEX_WHOLE = new RegExp(
	`^(?<subject>\\$[a-zA-Z_][a-zA-Z0-9_]*)\\??->(?<method>[^\\(]*)$`,
)

export const WORD_REGEX = /[a-zA-Z_][a-zA-Z0-9_-]*/
export const QUOTED_STRING_REGEX = /(")(?<s1>(?:\\"|[^"])+)\1|(')(?<s2>(?:\\'|[^'])+)\2/
export const QUOTED_STRING_REGEX_WHOLE =
	/^(?:(")(?<s1>(?:\\"|[^"])+)\2|(')(?<s2>(?:\\'|[^'])+)\3)$/
