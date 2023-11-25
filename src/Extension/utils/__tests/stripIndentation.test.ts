import { stripIndentation } from '../stripIndentation'

const INPUT_1 = `
	Foreach loop iterating over variable XXX.

	Example:
	\`\`\`latte
	{foreach $langs as $code => $lang}
		<span>{$lang}</span>
	{/foreach}
	\`\`\`

	[Documentation](https://latte.nette.org/en/tags#toc-foreach)
`

const OUTPUT_1 = `
Foreach loop iterating over variable XXX.

Example:
\`\`\`latte
{foreach $langs as $code => $lang}
	<span>{$lang}</span>
{/foreach}
\`\`\`

[Documentation](https://latte.nette.org/en/tags#toc-foreach)
`

test('stripIndentation', () => {
	expect(stripIndentation(INPUT_1)).toBe(OUTPUT_1)
})
