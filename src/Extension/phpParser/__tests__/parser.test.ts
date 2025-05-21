import { parsePhpSource as parsePhpSource } from '../parser'
import { readTestDataFile } from '../../../../tests/testUtils'
import { SymbolVisibility } from '../types'
import { parsePhpTypeCached } from '../../phpTypeParser/phpTypeParser'
import { dump } from '../../utils/common'

test('Parse classes', async () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: any

	result = (await parsePhpSource(str)).classes['SomeClass']

	const expected = {
		name: 'SomeClass',
		fqn: 'App\\Model\\Services\\SomeClass',
		namespace: 'App\\Model\\Services',
		parentFqn: null,
		location: {
			offset: 237,
			uri: '<unknown>',
		},
		methods: {
			__construct: {
				name: '__construct',
				flags: {
					visibility: 'public',
					static: false,
				},
				location: {
					offset: 529,
					uri: '<unknown>',
				},
				returnType: {
					name: 'mixed',
					repr: 'mixed',
					iteratesAs: null,
					nullable: false,
				},
			},
			someClass_method_1_public: {
				name: 'someClass_method_1_public',
				flags: {
					visibility: 'public',
					static: false,
				},
				location: {
					offset: 690,
					uri: '<unknown>',
				},
				returnType: {
					name: 'bool',
					repr: 'bool',
					iteratesAs: null,
					nullable: false,
				},
			},
			someClass_method_2_public: {
				name: 'someClass_method_2_public',
				flags: {
					visibility: 'public',
					static: false,
				},
				location: {
					offset: 779,
					uri: '<unknown>',
				},
				returnType: {
					name: 'App\\Model\\Services\\SomeSubClass',
					repr: 'App\\Model\\Services\\SomeSubClass',
					iteratesAs: null,
					nullable: false,
				},
			},
			someClass_method_3_public_static: {
				name: 'someClass_method_3_public_static',
				flags: {
					visibility: 'public',
					static: true,
				},
				location: {
					offset: 883,
					uri: '<unknown>',
				},
				returnType: {
					name: 'string',
					repr: 'string',
					iteratesAs: null,
					nullable: false,
				},
			},
			someClass_method_4_private: {
				name: 'someClass_method_4_private',
				flags: {
					visibility: 'private',
					static: false,
				},
				location: {
					offset: 978,
					uri: '<unknown>',
				},
				returnType: {
					types: [
						{
							name: 'array',
							repr: 'array',
							iteratesAs: null,
							nullable: false,
						},
						{
							name: 'bool',
							repr: 'bool',
							iteratesAs: null,
							nullable: false,
						},
					],
					repr: 'array|bool',
					iteratesAs: null,
					nullable: false,
				},
			},
			someClass_method_5_protected: {
				name: 'someClass_method_5_protected',
				flags: {
					visibility: 'protected',
					static: false,
				},
				location: {
					offset: 1102,
					uri: '<unknown>',
				},
				returnType: {
					name: 'App\\Model\\Services\\MyInt',
					repr: 'App\\Model\\Services\\MyInt',
					iteratesAs: null,
					nullable: false,
				},
			},
		},
		properties: {
			someClass_prop_1: {
				name: 'someClass_prop_1',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					name: 'string',
					repr: 'string',
					iteratesAs: null,
					nullable: true,
				},
				location: {
					offset: 283,
					uri: '<unknown>',
				},
			},
			someClass_prop_2_static: {
				name: 'someClass_prop_2_static',
				flags: {
					static: true,
					visibility: 'public',
				},
				type: {
					types: [
						{
							name: 'int',
							repr: 'int',
							iteratesAs: null,
							nullable: false,
						},
						{
							name: 'bool',
							repr: 'bool',
							iteratesAs: null,
							nullable: false,
						},
					],
					repr: 'int|bool',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 325,
					uri: '<unknown>',
				},
			},
			someClass_prop_3_protected: {
				name: 'someClass_prop_3_protected',
				flags: {
					static: false,
					visibility: 'protected',
				},
				type: {
					name: 'bool',
					repr: 'bool',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 371,
					uri: '<unknown>',
				},
			},
			someClass_prop_4: {
				name: 'someClass_prop_4',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					name: 'App\\Model\\Entities\\DbArtifact',
					repr: 'App\\Model\\Entities\\DbArtifact',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 413,
					uri: '<unknown>',
				},
			},
			someClass_prop_5: {
				name: 'someClass_prop_5',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					name: 'DbArtifact',
					repr: 'DbArtifact',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 451,
					uri: '<unknown>',
				},
			},
			entityFileSystemService: {
				name: 'entityFileSystemService',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					types: [
						{
							name: 'Entity\\Service\\EntityFileSystemService',
							repr: 'Entity\\Service\\EntityFileSystemService',
							iteratesAs: null,
							nullable: false,
						},
						{
							name: 'bool',
							repr: 'bool',
							iteratesAs: null,
							nullable: false,
						},
					],
					repr: 'Entity\\Service\\EntityFileSystemService|bool',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 560,
					uri: '<unknown>',
				},
			},
			globalFileSystemService: {
				name: 'globalFileSystemService',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					name: 'GlobalFileSystemService',
					repr: 'GlobalFileSystemService',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 624,
					uri: '<unknown>',
				},
			},
		},
	}

	expect(result).toEqual(expected)
})

test('Detect classes: Subclass', async () => {
	const str = readTestDataFile(`SomeSubClass.php`)
	let result: any

	result = (await parsePhpSource(str)).classes['SomeSubClass']

	const expected = {
		name: 'SomeSubClass',
		fqn: 'App\\Model\\Services\\SomeSubClass',
		namespace: 'App\\Model\\Services',
		parentFqn: 'App\\Model\\Services\\SomeClass',
		location: {
			offset: 64,
			uri: '<unknown>',
		},
		methods: {
			someSubClass_method_1_public: {
				name: 'someSubClass_method_1_public',
				flags: {
					visibility: 'public',
					static: false,
				},
				location: {
					offset: 185,
					uri: '<unknown>',
				},
				returnType: {
					name: 'bool',
					repr: 'bool',
					iteratesAs: null,
					nullable: false,
				},
			},
			someSubClass_method_2_public: {
				name: 'someSubClass_method_2_public',
				flags: {
					visibility: 'public',
					static: false,
				},
				location: {
					offset: 277,
					uri: '<unknown>',
				},
				returnType: {
					name: 'App\\Model\\Services\\SomeClass',
					repr: 'App\\Model\\Services\\SomeClass',
					iteratesAs: null,
					nullable: false,
				},
			},
			someSubClass_method_3_public_static: {
				name: 'someSubClass_method_3_public_static',
				flags: {
					visibility: 'public',
					static: true,
				},
				location: {
					offset: 381,
					uri: '<unknown>',
				},
				returnType: {
					name: 'string',
					repr: 'string',
					iteratesAs: null,
					nullable: false,
				},
			},
			someSubClass_method_4_private: {
				name: 'someSubClass_method_4_private',
				flags: {
					visibility: 'private',
					static: false,
				},
				location: {
					offset: 479,
					uri: '<unknown>',
				},
				returnType: {
					name: 'array',
					repr: 'array',
					iteratesAs: null,
					nullable: false,
				},
			},
			someSubClass_method_5_protected: {
				name: 'someSubClass_method_5_protected',
				flags: {
					visibility: 'protected',
					static: false,
				},
				location: {
					offset: 555,
					uri: '<unknown>',
				},
				returnType: {
					name: 'int',
					repr: 'int',
					iteratesAs: null,
					nullable: false,
				},
			},
		},
		properties: {
			someSubClass_prop_1: {
				name: 'someSubClass_prop_1',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					name: 'string',
					repr: 'string',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 112,
					uri: '<unknown>',
				},
			},
			someSubClass_prop_2: {
				name: 'someSubClass_prop_2',
				flags: {
					static: false,
					visibility: 'public',
				},
				type: {
					name: 'CurlHandle',
					repr: 'CurlHandle',
					iteratesAs: null,
					nullable: false,
				},
				location: {
					offset: 149,
					uri: '<unknown>',
				},
			},
		},
	}

	expect(result).toEqual(expected)
})
