import { VARIABLE_REGEX } from '../../regexes'
import { stripIndentation } from '../../utils/stripIndentation'
import { ArgsParser } from '../argsParser'
import DumbTag from '../Scanner/DumbTag'
import { Range, AbstractTag, ParsingContext } from '../types'

/**
 * {capture $var}
 * <ul>
 * 	<li>Hello World</li>
 * </ul>
 * {/capture}
 */
export default class CaptureTag extends AbstractTag {
	public static readonly DUMB_NAME = 'capture'

	constructor(range: Range, readonly varName: string, readonly nameOffset: integer) {
		super(range)
	}

	static fromDumbTag(
		dumbTag: DumbTag,
		parsingContext: ParsingContext,
	): CaptureTag | null {
		const argsParser = new ArgsParser(dumbTag.args)
		let match = argsParser.consumeRegex(VARIABLE_REGEX)
		if (!match) {
			return null
		}

		return new this(
			dumbTag.tagRange,
			match[0],
			dumbTag.argsOffset + match.indices![0][0],
		)
	}

	public getDescription(): string {
		return stripIndentation(`
		Captures output of the block into variable \`${this.varName}\`.

		The HTML output is stored as a \`Latte\\Runtime\\Html\` object to avoid unwanted escaping when printing.

		Example:
		\`\`\`
		{capture $var}
			<h1>Hello World</h1>
		{/capture}

		<p>Captured: {$var}</p>
		\`\`\`

		[Documentation](https://latte.nette.org/en/tags#toc-capture)
		`)
	}
}
