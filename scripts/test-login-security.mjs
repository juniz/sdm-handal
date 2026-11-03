/**
 * Automated Unit Tests for Login Security Module
 * Tests input validation (SQLi, XSS), rate limiting, timing-safe password comparison, and Turnstile verification.
 */
import assert from "node:assert/strict";
import {
	validateLoginInput,
	checkRateLimit,
	recordFailedAttempt,
	clearRateLimit,
	safeComparePassword,
	verifyTurnstileToken,
	_resetRateLimitStore,
} from "../src/lib/login-security.js";

async function runTests() {
	console.log("=== Running Login Security Unit Tests ===");
	let passCount = 0;

	function test(name, fn) {
		try {
			fn();
			console.log(`  [PASS] ${name}`);
			passCount++;
		} catch (err) {
			console.error(`  [FAIL] ${name}`);
			throw err;
		}
	}

	async function testAsync(name, fn) {
		try {
			await fn();
			console.log(`  [PASS] ${name}`);
			passCount++;
		} catch (err) {
			console.error(`  [FAIL] ${name}`);
			throw err;
		}
	}

	// ---------------------------------------------------------------------------
	// 1. Input Validation Tests (SQL Injection & XSS)
	// ---------------------------------------------------------------------------
	test("validateLoginInput rejects null, undefined, and non-object body", () => {
		assert.equal(validateLoginInput(null).valid, false);
		assert.equal(validateLoginInput(undefined).valid, false);
		assert.equal(validateLoginInput("nip=admin").valid, false);
		assert.equal(validateLoginInput([]).valid, false);
	});

	test("validateLoginInput rejects missing nip or password", () => {
		assert.equal(validateLoginInput({}).valid, false);
		assert.equal(validateLoginInput({ nip: "123" }).valid, false);
		assert.equal(validateLoginInput({ password: "abc" }).valid, false);
	});

	test("validateLoginInput rejects empty nip or empty password", () => {
		assert.equal(validateLoginInput({ nip: "", password: "pass" }).valid, false);
		assert.equal(validateLoginInput({ nip: "   ", password: "pass" }).valid, false);
		assert.equal(validateLoginInput({ nip: "123", password: "" }).valid, false);
	});

	test("validateLoginInput rejects SQL injection payloads in NIP", () => {
		const sqliPayloads = [
			"' OR 1=1 --",
			"admin'; DROP TABLE user; --",
			"' UNION SELECT * FROM pegawaip --",
			"100' OR '1'='1",
			"admin' /* comment */",
			"nip; SHUTDOWN;",
		];

		for (const payload of sqliPayloads) {
			const res = validateLoginInput({ nip: payload, password: "ValidPassword123!" });
			assert.equal(res.valid, false, `Failed to reject SQLi payload: ${payload}`);
			assert.ok(res.error, "Should have error message");
		}
	});

	test("validateLoginInput rejects XSS payloads in NIP", () => {
		const xssPayloads = [
			"<script>alert(1)</script>",
			'"><img src=x onerror=alert(1)>',
			"<svg onload=alert(1)>",
			"<b>bold_nip</b>",
			"javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
		];

		for (const payload of xssPayloads) {
			const res = validateLoginInput({ nip: payload, password: "ValidPassword123!" });
			assert.equal(res.valid, false, `Failed to reject XSS payload: ${payload}`);
			assert.ok(res.error, "Should have error message");
		}
	});

	test("validateLoginInput rejects out-of-bounds lengths", () => {
		const longNip = "a".repeat(51);
		assert.equal(validateLoginInput({ nip: longNip, password: "pass" }).valid, false);

		const longPass = "p".repeat(201);
		assert.equal(validateLoginInput({ nip: "12345", password: longPass }).valid, false);
	});

	test("validateLoginInput accepts valid credentials and trims NIP", () => {
		const res = validateLoginInput({
			nip: "  198001012010011001  ",
			password: "P@sswordSuperSecure!2026",
		});
		assert.equal(res.valid, true);
		assert.equal(res.nip, "198001012010011001");
		assert.equal(res.password, "P@sswordSuperSecure!2026");
	});

	// ---------------------------------------------------------------------------
	// 2. Rate Limiting Tests
	// ---------------------------------------------------------------------------
	test("Rate limiter tracks failed attempts and locks after 5 attempts", () => {
		if (typeof _resetRateLimitStore === "function") {
			_resetRateLimitStore();
		}

		const testIp = "192.0.2.100";
		const testNip = "NIP_RATE_TEST_01";

		// Initial check should pass
		const initialCheck = checkRateLimit(testIp, testNip);
		assert.equal(initialCheck.allowed, true);

		// Record 4 failed attempts - still unlocked
		for (let i = 1; i <= 4; i++) {
			const record = recordFailedAttempt(testIp, testNip);
			assert.equal(record.attempts, i);
			assert.equal(record.locked, false, `Should not be locked at attempt ${i}`);
			const check = checkRateLimit(testIp, testNip);
			assert.equal(check.allowed, true, `Should still be allowed at attempt ${i}`);
		}

		// 5th attempt - should lock
		const fifthRecord = recordFailedAttempt(testIp, testNip);
		assert.equal(fifthRecord.attempts, 5);
		assert.equal(fifthRecord.locked, true, "Should lock on 5th failed attempt");

		// 6th check - must be blocked with retryAfterSeconds > 0
		const blockedCheck = checkRateLimit(testIp, testNip);
		assert.equal(blockedCheck.allowed, false, "6th check must be blocked");
		assert.ok(
			blockedCheck.retryAfterSeconds && blockedCheck.retryAfterSeconds > 0,
			"retryAfterSeconds must be greater than 0"
		);

		// Clearing rate limit unlocks account/IP
		clearRateLimit(testIp, testNip);
		const afterClearCheck = checkRateLimit(testIp, testNip);
		assert.equal(afterClearCheck.allowed, true, "Must be allowed after clearing rate limit");
	});

	// ---------------------------------------------------------------------------
	// 3. Timing-Safe Password Comparison Tests
	// ---------------------------------------------------------------------------
	test("safeComparePassword accurately compares strings and Buffers", () => {
		const rawPassword = "CorrectHorseBatteryStaple!";
		const bufPassword = Buffer.from(rawPassword, "utf8");

		// Exact matches
		assert.equal(safeComparePassword(rawPassword, rawPassword), true);
		assert.equal(safeComparePassword(bufPassword, rawPassword), true);
		assert.equal(safeComparePassword(rawPassword, bufPassword), true);
		assert.equal(safeComparePassword(bufPassword, bufPassword), true);

		// Mismatches
		assert.equal(safeComparePassword(rawPassword, "WrongPassword"), false);
		assert.equal(safeComparePassword(bufPassword, "WrongPassword"), false);
		assert.equal(safeComparePassword("WrongPassword", bufPassword), false);
		assert.equal(safeComparePassword("short", "muchlongersuperpassword"), false);

		// Edge cases: null / undefined
		assert.equal(safeComparePassword(null, rawPassword), false);
		assert.equal(safeComparePassword(rawPassword, null), false);
		assert.equal(safeComparePassword(undefined, undefined), false);
	});

	// ---------------------------------------------------------------------------
	// 4. Cloudflare Turnstile Verification Tests
	// ---------------------------------------------------------------------------
	await testAsync("verifyTurnstileToken allows dummy-dev-token in non-production", async () => {
		const prevEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		try {
			const res = await verifyTurnstileToken("dummy-dev-token", "127.0.0.1");
			assert.equal(res.success, true);
			assert.ok(res.message);
		} finally {
			process.env.NODE_ENV = prevEnv;
		}
	});

	await testAsync("verifyTurnstileToken rejects empty or invalid token", async () => {
		const emptyRes = await verifyTurnstileToken("");
		assert.equal(emptyRes.success, false);

		const nullRes = await verifyTurnstileToken(null);
		assert.equal(nullRes.success, false);

		const whitespaceRes = await verifyTurnstileToken("   ");
		assert.equal(whitespaceRes.success, false);
	});

	console.log(`\n=== All ${passCount} tests passed successfully! ===\n`);
}

runTests().catch((err) => {
	console.error("\n❌ Test execution failed:", err);
	process.exit(1);
});
