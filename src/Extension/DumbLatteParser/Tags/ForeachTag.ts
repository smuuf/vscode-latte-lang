import { stripIndentation } from '../../utils/stripIndentation'
import { isValidVariableName } from '../regexes'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag, ParsingContext } from '../types'

export default class ForeachTag extends AbstractTag {
	public static readonly DUMB_NAME = 'foreach'

	constructor(
		range: Range,
		readonly iteratesVarName: string,
		readonly iteratesAsVarName: string,
	) {
		super(range)
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): ForeachTag | null {
		const argsParts = dumbTag.args.match(/([^\s]+)+\s*as\s*([^\s]+)+/)
		if (!argsParts) {
			return null
		}

		const iteratesVarName = argsParts[1] || ''
		const iteratesAsVarName = argsParts[2] || ''

		// Invalid "$something as $thing" structure - wrong number or parts.
		if (!iteratesVarName || !iteratesAsVarName) {
			return null
		}

		// Invalid {var ...} structure - doesn't have valid variable names.
		// Known issue: This disallows iteration of literals: "[0, 1] as $meh"
		// or destructuring "[...] as ['key1' => $a, ...]", but meh.
		if (
			!isValidVariableName(iteratesVarName) ||
			!isValidVariableName(iteratesAsVarName)
		) {
			return null
		}

		return new this(dumbTag.tagRange, iteratesVarName, iteratesAsVarName)
	}

	public getDescription(): string {
		return stripIndentation(`
		Foreach loop iterating over variable \`${this.iteratesVarName}\`.

		Example:
		\`\`\`latte
		{foreach $langs as $code => $lang}
			<span>{$lang}</span>
		{/foreach}
		\`\`\`

		[Documentation](https://latte.nette.org/en/tags#toc-foreach)
		`)
	}
}
