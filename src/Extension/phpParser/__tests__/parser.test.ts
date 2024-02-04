import { parsePhpSource as parsePhpSource } from '../parser'
import { readTestDataFile } from '../../../../tests/testUtils'
import { PhpMethodInfo, PhpClassPropInfo, SymbolVisibility } from '../types'
import { parsePhpType } from '../../phpTypeParser/phpTypeParser'

test('Parse classes', async () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: any

	result = await parsePhpSource(str)

	// const expected = [
	// 	{
	// 		fqn: 'App\\Model\\Services\\SomeClass',
	// 		namespace: 'App\\Model\\Services',
	// 		name: 'SomeClass',
	// 		parentFqn: null,
	// 		location: {
	// 			uri: null,
	// 			offset: str.indexOf('SomeClass'),
	// 		},
	// 		props: {
	// 			someClass_prop_1: {
	// 				name: 'someClass_prop_1',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_prop_1'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: false,
	// 				},
	// 			},
	// 			someClass_prop_2: {
	// 				name: 'someClass_prop_2',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_prop_2'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: false,
	// 				},
	// 			},
	// 			someClass_prop_3: {
	// 				name: 'someClass_prop_3_protected_static',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_prop_3_protected_static'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PROTECTED,
	// 					static: true,
	// 				},
	// 			},
	// 			someClass_prop_4: {
	// 				name: 'someClass_prop_4',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_prop_4'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: false,
	// 				},
	// 				type: parsePhpType('App\\Model\\Services\\SomeSubClass'),
	// 			},
	// 		} as PhpClassPropInfo[],
	// 		methods: {
	// 			__construct: {
	// 				name: '__construct',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('__construct'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: false,
	// 				},
	// 				returnType: parsePhpType('mixed'),
	// 			},
	// 			someClass_method_1_public: {
	// 				name: 'someClass_method_1_public',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_method_1_public'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: false,
	// 				},
	// 				returnType: parsePhpType('bool'),
	// 			},
	// 			someClass_method_2_public: {
	// 				name: 'someClass_method_2_public',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_method_2_public'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: false,
	// 				},
	// 				returnType: parsePhpType('App\\Model\\Services\\SomeSubClass'),
	// 			},

	// 			someClass_method_3_public_static: {
	// 				name: 'someClass_method_3_public_static',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_method_3_public_static'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PUBLIC,
	// 					static: true,
	// 				},
	// 				returnType: parsePhpType('string'),
	// 			},

	// 			someClass_method_4_private: {
	// 				name: 'someClass_method_4_private',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_method_4_private'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PRIVATE,
	// 					static: false,
	// 				},
	// 				returnType: parsePhpType('array|bool'),
	// 			},
	// 			someClass_method_5_protected: {
	// 				name: 'someClass_method_5_protected',
	// 				location: {
	// 					uri: null,
	// 					offset: str.indexOf('someClass_method_5_protected'),
	// 				},
	// 				flags: {
	// 					visibility: SymbolVisibility.PROTECTED,
	// 					static: false,
	// 				},
	// 				returnType: parsePhpType('int'),
	// 			},
	// 		} as PhpClassMethodInfo[],
	// 	},
	// ]

	// expect(result).toEqual(expected)
})

// test('Detect classes: Subclass', async () => {
// 	const str = readTestDataFile(`SomeSubClass.php`)
// 	let result: any

// 	result = await parsePhpSource(str)

// 	const expected = [
// 		{
// 			fqn: 'App\\Model\\Services\\SomeSubClass',
// 			namespace: 'App\\Model\\Services',
// 			name: 'SomeSubClass',
// 			parentFqn: 'App\\Model\\Services\\SomeClass',
// 			location: {
// 				uri: null,
// 				offset: str.indexOf('SomeSubClass'),
// 			},
// 			methods: {
// 				someSubClass_method_1_public: {
// 					name: 'someSubClass_method_1_public',
// 					location: {
// 						uri: null,
// 						offset: str.indexOf('someSubClass_method_1_public'),
// 					},
// 					flags: {
// 						visibility: SymbolVisibility.PUBLIC,
// 						static: false,
// 					},
// 					returnType: parsePhpType('bool'),
// 				},
// 				someSubClass_method_2_public: {
// 					name: 'someSubClass_method_2_public',
// 					location: {
// 						uri: null,
// 						offset: str.indexOf('someSubClass_method_2_public'),
// 					},
// 					flags: {
// 						visibility: SymbolVisibility.PUBLIC,
// 						static: false,
// 					},
// 					returnType: parsePhpType('App\\Model\\Services\\SomeClass'),
// 				},
// 				someSubClass_method_3_public_static: {
// 					name: 'someSubClass_method_3_public_static',
// 					location: {
// 						uri: null,
// 						offset: str.indexOf('someSubClass_method_3_public_static'),
// 					},
// 					flags: {
// 						visibility: SymbolVisibility.PUBLIC,
// 						static: true,
// 					},
// 					returnType: parsePhpType('string'),
// 				},
// 				someSubClass_method_4_private: {
// 					name: 'someSubClass_method_4_private',
// 					location: {
// 						uri: null,
// 						offset: str.indexOf('someSubClass_method_4_private'),
// 					},
// 					flags: {
// 						visibility: SymbolVisibility.PRIVATE,
// 						static: false,
// 					},
// 					returnType: parsePhpType('array'),
// 				},
// 				someSubClass_method_5_protected: {
// 					name: 'someSubClass_method_5_protected',
// 					location: {
// 						uri: null,
// 						offset: str.indexOf('someSubClass_method_5_protected'),
// 					},
// 					flags: {
// 						visibility: SymbolVisibility.PROTECTED,
// 						static: false,
// 					},
// 					returnType: parsePhpType('int'),
// 				},
// 			},
// 		},
// 	]

// 	expect(result).toEqual(expected)
// })

// test('Detect classes: Subclass', async () => {
// 	const str = readTestDataFile(`SomeSubSubClass.php`)
// 	let result: any

// 	result = await parsePhpSource(str)

// 	const expected = [
// 		{
// 			fqn: 'App\\Model\\Services\\SubNamespace\\SomeSubSubClass',
// 			namespace: 'App\\Model\\Services\\SubNamespace',
// 			name: 'SomeSubSubClass',
// 			parentFqn: 'App\\Model\\Services\\SomeSubClass',
// 			location: {
// 				uri: null,
// 				offset: str.indexOf('SomeSubSubClass'),
// 			},
// 			methods: {
// 				someSubSubClass_method_1_public: {
// 					name: 'someSubSubClass_method_1_public',
// 					location: {
// 						uri: null,
// 						offset: str.indexOf('someSubSubClass_method_1_public'),
// 					},
// 					flags: {
// 						visibility: SymbolVisibility.PUBLIC,
// 						static: false,
// 					},
// 					returnType: parsePhpType('bool'),
// 				},
// 			},
// 		},
// 	]

// 	expect(result).toEqual(expected)
// })
