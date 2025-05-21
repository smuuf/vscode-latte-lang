<?php

const FINAL_STUB_FILENAME = 'php-stubs.json';
const STUB_URLS = [
	'https://raw.githubusercontent.com/php/php-src/master/ext/standard/basic_functions.stub.php',
	'https://raw.githubusercontent.com/php/php-src/master/ext/json/json.stub.php',
];

const FN_REGEX = '#function (?<fname>[a-zA-Z_][a-zA-Z0-9_]*)\(.*?\):(?<rtype>.*)\{\}#m';

function line(string $s): void {
	echo "$s\n";
}

class StubsProcessor {

	private const OLD_FILE_AGE = 3600 * 24;
	private array $stubs = [];

	public function __construct(
		private string $workDir,
	) {}

	private function buildTempFilePath(string $name): string {
		return self::buildFilePath("temp/$name.temp");
	}

	private function buildFilePath(string $name): string {
		return sprintf("{$this->workDir}/$name");
	}

	public static function isOldFile(string $filepath): string {
		return time() - filemtime($filepath) > self::OLD_FILE_AGE;
	}

	public function processPhpStubFileUrl(string $url): void {

		$localFile = self::buildTempFilePath(basename($url));

		$alreadyExists = file_exists($localFile);
		$isOld = $alreadyExists && self::isOldFile($localFile);

		!$alreadyExists && line("Downloading '$url'");
		$isOld && line("File '$localFile' is too old");

		if (!$alreadyExists || $isOld) {
			line("Downloading '$url' into '$localFile'");
			$content = file_get_contents($url);
			file_put_contents($localFile, $content);
		} else {
			line("Will use existing '$localFile'");
		}

		$this->processPhpStubFile($localFile);

	}

	public function processPhpStubFile(string $path): void {

		line("Processing PHP stub file '$path'");
		$content = file_get_contents($path);
		preg_match_all(FN_REGEX, $content, $matches, PREG_SET_ORDER);

		$fnCount = count($matches);
		line("Will process $fnCount PHP function stubs");

		foreach ($matches as $m) {
			$fName = trim($m['fname']);
			$data = [
				'rtype' => trim($m['rtype']),
			];
			$this->stubs[$fName] = $data;
		}

		line("Done processing stub PHP file");

	}

	public function getStubs(): array {
		return $this->stubs;
	}

	public function dumpJsonStubFile(string $fileName): void {
		line("Dumping JSON stub file '$fileName'");
		$json = json_encode($this->stubs);

		$filePath = self::buildFilePath($fileName);
		file_put_contents($filePath, $json);
	}

}

$sp = new StubsProcessor(__DIR__);
foreach (STUB_URLS as $url) {
	$sp->processPhpStubFileUrl($url);
}

$sp->dumpJsonStubFile(FINAL_STUB_FILENAME);

