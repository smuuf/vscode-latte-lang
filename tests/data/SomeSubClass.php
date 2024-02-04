<?php

declare(strict_types=1);

namespace App\Model\Services;

class SomeSubClass extends SomeClass {

	public string $someSubClass_prop_1;
	public \CurlHandle $someSubClass_prop_2;

	public function someSubClass_method_1_public(string $stringArg): bool {
		return true;
	}

	public function someSubClass_method_2_public(SomeClass $someClassArg): SomeClass {
		return $this;
	}

	public static function someSubClass_method_3_public_static(): string {
		return self::class;
	}

	private function someSubClass_method_4_private(): array {
		return [];
	}

	protected function someSubClass_method_5_protected(): int {
		return 1;
	}

}
