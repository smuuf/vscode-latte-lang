<?php

declare(strict_types=1);

namespace App\Model\Services\SubNamespace;

use App\Model\Services;

class SomeSubSubClass extends Services\SomeSubClass {

	public function someSubSubClass_method_1_public(): bool {
		return false;
	}

}
