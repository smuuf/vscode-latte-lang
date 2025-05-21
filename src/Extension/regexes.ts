export const NAME_CORE = '[a-zA-Z_][a-zA-Z0-9_]*'
export const NAME_REGEX = new RegExp(NAME_CORE)
export const VARIABLE_REGEX = new RegExp(`\\$${NAME_CORE}`)
export const CLASS_NAME_REGEX = new RegExp(`\\\\?(?:${NAME_CORE})(?:\\\\${NAME_CORE})*`)

export const METHOD_CALL_REGEX = new RegExp(
	`(?<subject>\\$${NAME_CORE})\\??->(?<method>[^\\(]*)`,
)
export const METHOD_CALL_REGEX_ALONE = new RegExp(
	`^\s*(?<subject>\\$${NAME_CORE})\\??->(?<method>[^\\(]*)`, // Intentionally without the end ")".
)

export const WORD_REGEX = /[a-zA-Z_][a-zA-Z0-9_-]*/
export const QUOTED_STRING_REGEX = /(")(?<s1>(?:\\"|[^"])+)\1|(')(?<s2>(?:\\'|[^'])+)\2/
export const QUOTED_STRING_REGEX_ALONE =
	/^\s*(?:(")(?<s1>(?:\\"|[^"])+)\1\s*|\s*(')(?<s2>(?:\\'|[^'])+)\2)\s*$/

export const NUMBER_LITERAL_ALONE = /^[0-9][0-9_]*(\.[0-9][0-9_]*)?$/
