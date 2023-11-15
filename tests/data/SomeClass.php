<?php

declare(strict_types=1);

namespace App\Model\Services;

use Nette\SmartObject;
use Nette\Database\Table\ActiveRow;

use App\Model\Entities\DbArtifact;
use App\Model\Entities\DbBucket;

class SomeClass {

	use SmartObject;

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
	}
}
