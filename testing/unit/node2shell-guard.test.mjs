import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	isVulnerableBrotli,
	assertSafeBrotliRuntime,
	hasBrotliEncoding,
	sanitizeAcceptEncoding,
	installSafeFetchWrapper,
} from "../../src/lib/security/node2shell-guard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

test("isVulnerableBrotli detects vulnerable Brotli versions (1.0.3-1.0.9, 1.1.0, 1.2.0)", () => {
	assert.equal(isVulnerableBrotli("1.2.0"), true);
	assert.equal(isVulnerableBrotli("1.1.0"), true);
	assert.equal(isVulnerableBrotli("1.0.9"), true);
	assert.equal(isVulnerableBrotli("1.0.3"), true);
	assert.equal(isVulnerableBrotli(""), true);
	assert.equal(isVulnerableBrotli("0.9.0"), true);
});

test("isVulnerableBrotli passes patched Brotli versions (1.0.10+, 1.1.1+, 1.2.1+)", () => {
	assert.equal(isVulnerableBrotli("1.2.1"), false);
	assert.equal(isVulnerableBrotli("1.2.2"), false);
	assert.equal(isVulnerableBrotli("1.3.0"), false);
	assert.equal(isVulnerableBrotli("1.1.1"), false);
	assert.equal(isVulnerableBrotli("1.0.10"), false);
});

test("assertSafeBrotliRuntime logs warning by default and throws when strict=true on vulnerable Brotli", () => {
	const warnings = [];
	const mockLogger = { warn: (msg) => warnings.push(msg) };

	assert.doesNotThrow(() =>
		assertSafeBrotliRuntime({
			nodeEnv: "production",
			brotliVersion: "1.2.0",
			strict: false,
			logger: mockLogger,
		})
	);
	assert.equal(warnings.length, 1);
	assert.match(warnings[0], /CVE-2026-111497/);

	assert.throws(
		() =>
			assertSafeBrotliRuntime({
				nodeEnv: "production",
				brotliVersion: "1.2.0",
				strict: true,
				logger: mockLogger,
			}),
		/CVE-2026-111497/
	);

	assert.doesNotThrow(() =>
		assertSafeBrotliRuntime({
			nodeEnv: "production",
			brotliVersion: "1.2.1",
			strict: true,
			logger: mockLogger,
		})
	);
});

test("hasBrotliEncoding detects br token case-insensitively and with q-params", () => {
	assert.equal(hasBrotliEncoding("br"), true);
	assert.equal(hasBrotliEncoding("BR"), true);
	assert.equal(hasBrotliEncoding("gzip, br"), true);
	assert.equal(hasBrotliEncoding("gzip, br;q=1.0"), true);
	assert.equal(hasBrotliEncoding(["gzip", " deflate, br "]), true);
	assert.equal(hasBrotliEncoding("gzip, deflate"), false);
	assert.equal(hasBrotliEncoding("custom-br-token"), false);
	assert.equal(hasBrotliEncoding(null), false);
	assert.equal(hasBrotliEncoding(undefined), false);
});

test("sanitizeAcceptEncoding strips br and preserves safe encodings", () => {
	assert.equal(sanitizeAcceptEncoding(undefined), "gzip, deflate");
	assert.equal(sanitizeAcceptEncoding(""), "gzip, deflate");
	assert.equal(sanitizeAcceptEncoding("gzip, deflate, br"), "gzip, deflate");
	assert.equal(sanitizeAcceptEncoding("br;q=1.0, gzip;q=0.8"), "gzip;q=0.8");
	assert.equal(sanitizeAcceptEncoding("br"), "identity");
});

test("installSafeFetchWrapper wraps globalThis.fetch idempotently and strips br", async () => {
	const originalFetch = globalThis.fetch;
	const calls = [];

	globalThis.fetch = async (input, init) => {
		calls.push({ input, init });
		return { ok: true };
	};

	try {
		installSafeFetchWrapper();
		installSafeFetchWrapper(); // verify idempotency

		await globalThis.fetch("https://api.onesignal.com/notifications", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept-Encoding": "gzip, deflate, br",
			},
		});

		assert.equal(calls.length, 1);
		const headers = new Headers(calls[0].init.headers);
		assert.equal(headers.get("accept-encoding"), "gzip, deflate");
		assert.equal(headers.get("content-type"), "application/json");
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("src/instrumentation.js registers node2shell runtime check and safe fetch wrapper", () => {
	const instrumentationPath = path.join(rootDir, "src/instrumentation.js");
	assert.equal(fs.existsSync(instrumentationPath), true);
	const content = fs.readFileSync(instrumentationPath, "utf8");
	assert.match(content, /export async function register\(/);
	assert.match(content, /assertSafeBrotliRuntime\(/);
	assert.match(content, /installSafeFetchWrapper\(/);
});

test("src/middleware.js blocks Content-Encoding: br with 415, handles /photos/ anti-cache, and root middleware.js is removed", () => {
	const rootMiddlewarePath = path.join(rootDir, "middleware.js");
	assert.equal(
		fs.existsSync(rootMiddlewarePath),
		false,
		"Duplicate root middleware.js should be removed"
	);

	const srcMiddlewarePath = path.join(rootDir, "src/middleware.js");
	const content = fs.readFileSync(srcMiddlewarePath, "utf8");
	assert.match(content, /hasBrotliEncoding\(/);
	assert.match(content, /status:\s*415/);
	assert.match(content, /CVE-2026-111497/);
	assert.match(content, /X-Photo-Middleware/);
	assert.match(content, /\/api\/:path\*/);
	assert.match(content, /\/photos\/:path\*/);
});

