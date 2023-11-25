import { stripIndentation } from '../../utils/stripIndentation'
import LayoutTag from './LayoutTag'

/**
 * {extends "file"} is an alias to {layout "file"}
 */
export default class ExtendsTag extends LayoutTag {
	public static DUMB_NAME = 'extends'

	public getDescription(): string {
		return stripIndentation(`
		Specifies a layout file \`${this.absolutePath}\` which this template will extend.

		Example:
		\`\`\`latte
		{extends 'layout.latte'}
		\`\`\`

		[Documentation](https://latte.nette.org/en/template-inheritance#toc-layout-inheritance)
		`)
	}
}
