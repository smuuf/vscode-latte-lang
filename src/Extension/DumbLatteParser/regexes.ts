import { parsePhpType } from "../TypeParser/typeParser"

/**
 * Regex of a valid "name" (in php-src called "label").
 * This can be, for example:
 * - Variable name: $<name>
 * - Class name
 * - Qualified class name/namespace: <name>\<name> or \<name\<name>
 *
 * @see https://github.com/php/php-src/blob/6a4031b8c42867582593f2472c919039a700ccea/Zend/zend_language_scanner.l#L1365C7-L1365C47
 */
const NAME = '[a-zA-Z_\\x80-\\xff][a-zA-Z0-9_\\x80-\\xff]*'
const NSD_NAME = `\\\\?(${NAME})(\\\\${NAME})*`

const REGEX_NAME = new RegExp(`^${NAME}$`)
const REGEX_CLASS_NAME = new RegExp(`^${NSD_NAME}$`)
const REGEX_VARIABLE_NAME = new RegExp(`^\\$${NAME}$`)

export function isValidName(s: string): boolean {
	return REGEX_NAME.test(s)
}

export function isValidClassName(s: string): boolean {
	return REGEX_CLASS_NAME.test(s)
}

export function isValidVariableName(s: string): boolean {
	return REGEX_VARIABLE_NAME.test(s)
}

export function isValidTypeSpec(s: string): boolean {
	return !!parsePhpType(s)
}
