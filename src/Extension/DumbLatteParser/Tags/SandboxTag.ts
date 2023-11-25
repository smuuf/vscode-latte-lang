import { stripIndentation } from '../../utils/stripIndentation'
import IncludeTag from './IncludeTag'

/**
 * Reference: https://github.com/nette/latte/blob/794f252da7437499e467766d633eed85e1a437b7/src/Latte/Essential/CoreExtension.php#L211
 *
 * {include [file] "file" [with blocks] [,] [params]}
 * {include [block] name [,] [params]}
 */
export default class SandboxTag extends IncludeTag {
	public static readonly DUMB_NAME = 'sandbox'

	public getDescription(): string {
		return stripIndentation(`
		Specifies a layout file \`${this.absolutePath}\` which this template will extend.

		Sandbox provides a security layer that gives you control over which tags, PHP functions, methods, etc. can be used in templates.

		Example:
		\`\`\`latte
		{sandbox 'untrusted.latte', level: 3, data: $menu}
		\`\`\`

		[Documentation](https://latte.nette.org/en/sandbox)
		`)
	}
}
