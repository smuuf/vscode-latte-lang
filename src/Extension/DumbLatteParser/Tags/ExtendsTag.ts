import LayoutTag from './LayoutTag'

/**
 * {extends "file"} is an alias to {layout "file"}
 */
export default class ExtendsTag extends LayoutTag {
	public static DUMB_NAME = 'extends'
}
