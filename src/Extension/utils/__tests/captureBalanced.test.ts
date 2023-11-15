import { readTestDataFile } from '../../../../tests/testUtils'
import { captureBalanced } from '../captureBalanced'
import { BalancedCaptureResult } from '../types'

const EXPECTED_1 = `use SmartObject;

	public function __construct(
		private EntityFileSystemService $entityFileSystemService,
	) {}

	public function someClass_method_1_public(string $stringArg): bool {
		return true;
	}

	public function someClass_method_2_public(SomeClass $someClassArg): SomeSubClass {
		return $this;
	}

	public static function someClass_method_3_public_static(): string {
		return self::class;
	}

	private function someClass_method_4_private(): array|bool {
		return [];
	}

	/**
	 * lol dockblock
	 * @return int
	 */
	protected function someClass_method_5_protected(): int {
		return 1;
	}`

const EXPECTED_2 = `private EntityFileSystemService $entityFileSystemService,`
const EXPECTED_3 = `return $this;`

test('captureBalanced: PHP class contents', () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: BalancedCaptureResult | null

	result = captureBalanced(['{', '}'], str, 0)
	expect(result?.content.trim()).toBe(EXPECTED_1)
	expect(result?.offset).toBe(210)

	result = captureBalanced(['(', ')'], str, 0)
	expect(result?.content.trim()).toBe('strict_types=1')
	expect(result?.offset).toBe(15)

	result = captureBalanced(['(', ')'], str, 256)
	expect(result?.content.trim()).toBe(EXPECTED_2)
	expect(result?.offset).toBe(260)

	result = captureBalanced(['{', '}'], str, 256)
	expect(result?.content.trim()).toBe('')
	expect(result?.offset).toBe(325)

	result = captureBalanced(['{', '}'], str, 476)
	expect(result?.content.trim()).toBe(EXPECTED_3)
	expect(result?.offset).toBe(500)
})

test('captureBalanced: Basics', () => {
	let str: string
	let result: BalancedCaptureResult | null

	str = 'aaa{abc}ccc'
	result = captureBalanced(['{', '}'], str, 0)
	expect(result?.content).toBe('abc')
	expect(result?.offset).toBe(4)

	str = "aaa'abc'ccc"
	result = captureBalanced(["'", "'"], str, 0)
	expect(result?.content).toBe('abc')
	expect(result?.offset).toBe(4)
})
