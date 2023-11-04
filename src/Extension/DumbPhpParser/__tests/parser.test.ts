import { parsePhp as parsePhpSource } from '../parser'
import { readTestDataFile } from '../../../../tests/testUtils'
import { SymbolVisibility } from '../types'
import { parsePhpType } from '../../phpTypeParser/phpTypeParser'
import { dump } from '../../utils/common'

test('Detect classes: Basic', async () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: any

	result = await parsePhpSource(str)

	const expected = [
		{
			fqn: 'App\\Model\\Services\\SomeClass',
			namespace: 'App\\Model\\Services',
			name: 'SomeClass',
			parentFqn: null,
			location: {
				uri: null,
				offset: str.indexOf('SomeClass'),
			},
			methods: new Map([
				[
					'__construct',
					{
						name: '__construct',
						offset: str.indexOf('__construct'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: false,
						},
						returnType: parsePhpType('mixed'),
					},
				],
				[
					'someClass_method_1_public',
					{
						name: 'someClass_method_1_public',
						offset: str.indexOf('someClass_method_1_public'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: false,
						},
						returnType: parsePhpType('bool'),
					},
				],
				[
					'someClass_method_2_public',
					{
						name: 'someClass_method_2_public',
						offset: str.indexOf('someClass_method_2_public'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: false,
						},
						returnType: parsePhpType('App\\Model\\Services\\SomeSubClass'),
					},
				],
				[
					'someClass_method_3_public_static',
					{
						name: 'someClass_method_3_public_static',
						offset: str.indexOf('someClass_method_3_public_static'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: true,
						},
						returnType: parsePhpType('string'),
					},
				],
				[
					'someClass_method_4_private',
					{
						name: 'someClass_method_4_private',
						offset: str.indexOf('someClass_method_4_private'),
						flags: {
							visibility: SymbolVisibility.PRIVATE,
							static: false,
						},
						returnType: parsePhpType('array|bool'),
					},
				],
				[
					'someClass_method_5_protected',
					{
						name: 'someClass_method_5_protected',
						offset: str.indexOf('someClass_method_5_protected'),
						flags: {
							visibility: SymbolVisibility.PROTECTED,
							static: false,
						},
						returnType: parsePhpType('int'),
					},
				],
			]),
		},
	]

	expect(result).toEqual(expected)
})

test('Detect classes: Subclass', async () => {
	const str = readTestDataFile(`SomeSubClass.php`)
	let result: any

	result = await parsePhpSource(str)

	const expected = [
		{
			fqn: 'App\\Model\\Services\\SomeSubClass',
			namespace: 'App\\Model\\Services',
			name: 'SomeSubClass',
			parentFqn: 'App\\Model\\Services\\SomeClass',
			location: {
				uri: null,
				offset: str.indexOf('SomeSubClass'),
			},
			methods: new Map([
				[
					'someSubClass_method_1_public',
					{
						name: 'someSubClass_method_1_public',
						offset: str.indexOf('someSubClass_method_1_public'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: false,
						},
						returnType: parsePhpType('bool'),
					},
				],
				[
					'someSubClass_method_2_public',
					{
						name: 'someSubClass_method_2_public',
						offset: str.indexOf('someSubClass_method_2_public'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: false,
						},
						returnType: parsePhpType('App\\Model\\Services\\SomeClass'),
					},
				],
				[
					'someSubClass_method_3_public_static',
					{
						name: 'someSubClass_method_3_public_static',
						offset: str.indexOf('someSubClass_method_3_public_static'),
						flags: {
							visibility: SymbolVisibility.PUBLIC,
							static: true,
						},
						returnType: parsePhpType('string'),
					},
				],
				[
					'someSubClass_method_4_private',
					{
						name: 'someSubClass_method_4_private',
						offset: str.indexOf('someSubClass_method_4_private'),
						flags: {
							visibility: SymbolVisibility.PRIVATE,
							static: false,
						},
						returnType: parsePhpType('array'),
					},
				],
				[
					'someSubClass_method_5_protected',
					{
						name: 'someSubClass_method_5_protected',
						offset: str.indexOf('someSubClass_method_5_protected'),
						flags: {
							visibility: SymbolVisibility.PROTECTED,
							static: false,
						},
						returnType: parsePhpType('int'),
					},
				],
			]),
		},
	]

	expect(result).toEqual(expected)
})
