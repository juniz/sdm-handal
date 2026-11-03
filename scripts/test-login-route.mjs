/**
 * Test harness for src/app/api/auth/login/route.js
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {
	validateLoginInput,
	checkRateLimit,
	recordFailedAttempt,
	clearRateLimit,
	safeComparePassword,
	verifyTurnstileToken,
	_resetRateLimitStore,
} from "../src/lib/login-security.js";

async function runRouteTests() {
	console.log("=== Running Login Route Unit Tests ===");
	let passCount = 0;

	// Mock DB state
	let mockUsersResult = [];
	let lastDbQuery = null;
	const mockQuery = async (sql, params) => {
		lastDbQuery = { sql, params };
		return mockUsersResult;
	};

	// Mock Next cookies & auth
	let lastCookieSet = null;
	const mockCookies = async () => ({
		set: (name, val, opts) => {
			lastCookieSet = { name, val, opts };
		},
	});

	let lastCreatedPayload = null;
	const mockCreateToken = async (payload) => {
		lastCreatedPayload = payload;
		return "mocked-jwt-token-xyz";
	};

	const mockSetServerCookie = (store, token) => {
		lastCookieSet = { token };
	};

	// Mock NextResponse
	class MockNextResponse {
		constructor(body, init = {}) {
			this.body = body;
			this.status = init.status || 200;
			this.headers = new Map(Object.entries(init.headers || {}));
		}
		static json(body, init = {}) {
			return new MockNextResponse(body, init);
		}
	}

	// Read and evaluate route.js with mocked imports
	const routePath = path.resolve("src/app/api/auth/login/route.js");
	let routeCode = fs.readFileSync(routePath, "utf8");

	// Replace module imports with injected scope variables
	routeCode = routeCode
		.replace(/import\s+\{\s*NextResponse\s*\}\s+from\s+["']next\/server["'];?/, "")
		.replace(/import\s+\{\s*query\s*\}\s+from\s+["']@\/lib\/db["'];?/, "")
		.replace(/import\s+\{\s*cookies\s*\}\s+from\s+["']next\/headers["'];?/, "")
		.replace(
			/import\s+\{\s*createToken,\s*setServerCookie\s*\}\s+from\s+["']@\/lib\/auth["'];?/,
			""
		)
		.replace(
			/import\s+\{[\s\S]*?\}\s+from\s+["']@\/lib\/login-security["'];?/,
			""
		)
		.replace(/export\s+async\s+function\s+POST/, "async function POST");

	const context = {
		NextResponse: MockNextResponse,
		query: mockQuery,
		cookies: mockCookies,
		createToken: mockCreateToken,
		setServerCookie: mockSetServerCookie,
		validateLoginInput,
		checkRateLimit,
		recordFailedAttempt,
		clearRateLimit,
		safeComparePassword,
		verifyTurnstileToken,
		process,
		console,
		Buffer,
		URLSearchParams,
		exports: {},
	};

	vm.createContext(context);
	const wrappedCode = `(async () => {\n${routeCode}\nreturn { POST };\n})()`;
	const { POST } = await vm.runInContext(wrappedCode, context);

	assert.equal(typeof POST, "function", "POST handler must be a function");

	function makeRequest(body, headers = {}) {
		const headerMap = new Map(
			Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
		);
		return {
			headers: {
				get: (name) => headerMap.get(name.toLowerCase()) || null,
			},
			json: async () => {
				if (body instanceof Error) throw body;
				return body;
			},
		};
	}

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

	// 1. Malformed JSON
	await testAsync("Returns 400 for malformed JSON request body", async () => {
		const req = makeRequest(new Error("Unexpected token in JSON"));
		const res = await POST(req);
		assert.equal(res.status, 400);
		assert.match(res.body.message, /format payload json tidak valid/i);
	});

	// 2. Input validation fail (SQLi in NIP)
	await testAsync("Returns 400 for SQL injection payload in NIP", async () => {
		const req = makeRequest({
			nip: "' OR '1'='1",
			password: "ValidPassword123!",
			turnstileToken: "dummy-dev-token",
		});
		const res = await POST(req);
		assert.equal(res.status, 400);
		assert.match(res.body.message, /format nip tidak valid/i);
	});

	// 3. Input validation fail (empty password)
	await testAsync("Returns 400 for empty password", async () => {
		const req = makeRequest({
			nip: "198001012010011001",
			password: "",
			turnstileToken: "dummy-dev-token",
		});
		const res = await POST(req);
		assert.equal(res.status, 400);
		assert.match(res.body.message, /password tidak boleh kosong/i);
	});

	// 4. Rate Limiting enforced (5 failed attempts -> 429)
	await testAsync("Enforces 429 rate limit when attempts exceeded", async () => {
		_resetRateLimitStore();
		const testIp = "203.0.113.50";
		const testNip = "198001012010011999";

		// Exhaust attempts
		for (let i = 0; i < 5; i++) {
			recordFailedAttempt(testIp, testNip);
		}

		const req = makeRequest(
			{
				nip: testNip,
				password: "SecretPassword123!",
				turnstileToken: "dummy-dev-token",
			},
			{ "x-forwarded-for": `${testIp}, 10.0.0.1` }
		);

		const res = await POST(req);
		assert.equal(res.status, 429);
		assert.match(res.body.message, /terlalu banyak percobaan/i);
		assert.ok(res.headers.get("Retry-After"));
	});

	// 5. Cloudflare Turnstile rejection
	await testAsync("Returns 403 when Turnstile token is invalid or missing", async () => {
		_resetRateLimitStore();
		const prevEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";
		process.env.TURNSTILE_SECRET_KEY = "test-secret";

		try {
			const req = makeRequest({
				nip: "198001012010011001",
				password: "SecretPassword123!",
				turnstileToken: "",
			});
			const res = await POST(req);
			assert.equal(res.status, 403);
			assert.match(res.body.message, /turnstile/i);
		} finally {
			process.env.NODE_ENV = prevEnv;
		}
	});

	// 6. User not found -> 401 + records failed attempt
	await testAsync("Returns 401 when user is not found in database", async () => {
		_resetRateLimitStore();
		process.env.NODE_ENV = "development";
		mockUsersResult = [];

		const req = makeRequest(
			{
				nip: "198001012010011001",
				password: "SecretPassword123!",
				turnstileToken: "dummy-dev-token",
			},
			{ "x-real-ip": "198.51.100.2" }
		);

		const res = await POST(req);
		assert.equal(res.status, 401);
		assert.equal(res.body.message, "NIP atau password salah");

		// Rate limit store should now have 1 failed attempt recorded
		const check = checkRateLimit("198.51.100.2", "198001012010011001");
		assert.equal(check.allowed, true); // 1st attempt still allowed
	});

	// 7. Wrong password -> 401 + records failed attempt
	await testAsync("Returns 401 when password mismatch occurs", async () => {
		_resetRateLimitStore();
		process.env.NODE_ENV = "development";
		mockUsersResult = [
			{
				id: 42,
				username: Buffer.from("198001012010011001"),
				password: Buffer.from("CorrectPassword123!"),
				nama: "Dr. Budi Santoso",
				cap: "MEDIS",
				tmp_lahir: "Surabaya",
				tgl_lahir: "1980-01-01",
				alamat: "Jl. Pemuda No. 1",
				photo: "budi.jpg",
			},
		];

		const req = makeRequest(
			{
				nip: "198001012010011001",
				password: "WrongPassword999!",
				turnstileToken: "dummy-dev-token",
			},
			{ "x-forwarded-for": "198.51.100.10" }
		);

		const res = await POST(req);
		assert.equal(res.status, 401);
		assert.equal(res.body.message, "NIP atau password salah");
	});

	// 8. Successful authentication
	await testAsync("Returns 200, JWT token, user object without password on success", async () => {
		_resetRateLimitStore();
		process.env.NODE_ENV = "development";
		mockUsersResult = [
			{
				id: 42,
				username: Buffer.from("198001012010011001"),
				password: Buffer.from("CorrectPassword123!"),
				nama: "Dr. Budi Santoso",
				cap: "MEDIS",
				tmp_lahir: "Surabaya",
				tgl_lahir: "1980-01-01",
				alamat: "Jl. Pemuda No. 1",
				photo: "budi.jpg",
			},
		];

		// Pre-populate 2 failed attempts
		recordFailedAttempt("198.51.100.20", "198001012010011001");
		recordFailedAttempt("198.51.100.20", "198001012010011001");

		const req = makeRequest(
			{
				nip: "198001012010011001",
				password: "CorrectPassword123!",
				turnstileToken: "dummy-dev-token",
			},
			{ "x-forwarded-for": "198.51.100.20" }
		);

		const res = await POST(req);
		assert.equal(res.status, 200);
		assert.equal(res.body.message, "Login berhasil");
		assert.equal(res.body.token, "mocked-jwt-token-xyz");
		assert.equal(res.body.user.id, 42);
		assert.equal(res.body.user.username, "198001012010011001");
		assert.equal(res.body.user.nama, "Dr. Budi Santoso");
		assert.equal(res.body.user.departemen, "MEDIS");
		assert.equal(res.body.user.password, undefined, "Password must not be returned");

		// Rate limit must be cleared
		assert.ok(lastCookieSet, "Server cookie must be set");
		assert.equal(lastCreatedPayload.id, 42);
	});

	console.log(`\n=== All ${passCount} route integration tests passed! ===\n`);
}

runRouteTests().catch((err) => {
	console.error("\n❌ Route test failed:", err);
	process.exit(1);
});
