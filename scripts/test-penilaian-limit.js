const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

async function runTests() {
	const configPath = pathToFileURL(path.resolve(__dirname, "../src/lib/penilaian-config.js")).href;
	const { getPenilaianInputLimitDays, isPenilaianLimitEnabled, is24hLimitEnabled } = await import(configPath);

	function resetEnv(days, legacy) {
		delete process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS;
		delete process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;
		if (days !== undefined) process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS = days;
		if (legacy !== undefined) process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT = legacy;
	}

	// Case 1: NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS=3 -> 3, enabled=true
	resetEnv("3", undefined);
	assert.strictEqual(getPenilaianInputLimitDays(), 3, "Harus return 3 saat env=3");
	assert.strictEqual(isPenilaianLimitEnabled(), true, "Harus enabled saat env=3");
	assert.strictEqual(is24hLimitEnabled(), true, "is24hLimitEnabled harus true saat env=3");

	// Case 2: NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS=0 -> 0, enabled=false (even if legacy is true)
	resetEnv("0", "true");
	assert.strictEqual(getPenilaianInputLimitDays(), 0, "Harus return 0 saat diset 0 secara eksplisit");
	assert.strictEqual(isPenilaianLimitEnabled(), false, "Harus disabled saat env=0");
	assert.strictEqual(is24hLimitEnabled(), false, "is24hLimitEnabled harus false saat env=0");

	// Case 3: Legacy NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT=true and limit days unset -> 1
	resetEnv(undefined, "true");
	assert.strictEqual(getPenilaianInputLimitDays(), 1, "Harus return 1 saat legacy env true");
	assert.strictEqual(isPenilaianLimitEnabled(), true, "Harus enabled saat legacy env true");
	assert.strictEqual(is24hLimitEnabled(), true, "is24hLimitEnabled harus true saat legacy env true");

	// Case 4: Legacy NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT=1 and limit days unset -> 1
	resetEnv(undefined, "1");
	assert.strictEqual(getPenilaianInputLimitDays(), 1, "Harus return 1 saat legacy env 1");
	assert.strictEqual(isPenilaianLimitEnabled(), true, "Harus enabled saat legacy env 1");
	assert.strictEqual(is24hLimitEnabled(), true, "is24hLimitEnabled harus true saat legacy env 1");

	// Case 5: Unset -> 0, enabled=false
	resetEnv(undefined, undefined);
	assert.strictEqual(getPenilaianInputLimitDays(), 0, "Harus return 0 saat unset");
	assert.strictEqual(isPenilaianLimitEnabled(), false, "Harus disabled saat unset");
	assert.strictEqual(is24hLimitEnabled(), false, "is24hLimitEnabled harus false saat unset");

	console.log("✅ All config tests passed!");
}

runTests().catch((err) => {
	console.error("❌ Test failed:", err);
	process.exit(1);
});
