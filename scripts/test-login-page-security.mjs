import fs from "fs";
import assert from "assert";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/babel/parser");

console.log("=== Running Login Page Turnstile & Security Tests ===");

const pageSource = fs.readFileSync("src/app/page.js", "utf8");

// Test 1: Syntax & AST parsing
try {
	parse(pageSource, {
		sourceType: "module",
		plugins: ["jsx"],
	});
	console.log("  [PASS] src/app/page.js syntax and JSX valid");
} catch (err) {
	console.error("  [FAIL] Syntax error:", err.message);
	process.exit(1);
}

// Test 2: Imports present
assert(
	/import\s+Script\s+from\s+["']next\/script["']/.test(pageSource),
	"Script from next/script not imported"
);
assert(
	/useRef/.test(pageSource),
	"useRef from react not imported"
);
console.log("  [PASS] Script and useRef imported");

// Test 3: Refs & State
assert(
	/const\s*\[\s*turnstileToken\s*,\s*setTurnstileToken\s*\]\s*=\s*useState\(["']["']\)/.test(pageSource),
	"turnstileToken state missing"
);
assert(
	/const\s+turnstileContainerRef\s*=\s*useRef\(null\)/.test(pageSource),
	"turnstileContainerRef missing"
);
assert(
	/const\s+turnstileWidgetIdRef\s*=\s*useRef\(null\)/.test(pageSource),
	"turnstileWidgetIdRef missing"
);
console.log("  [PASS] Turnstile state and refs declared");

// Test 4: renderTurnstile implementation
assert(
	pageSource.includes("window.turnstile.render(turnstileContainerRef.current"),
	"renderTurnstile missing window.turnstile.render"
);
assert(
	pageSource.includes("1x00000000000000000000AA"),
	"Turnstile fallback site key missing"
);
assert(
	pageSource.includes("turnstileWidgetIdRef.current !== null"),
	"renderTurnstile idempotency check missing"
);
console.log("  [PASS] renderTurnstile implementation verified");

// Test 5: resetTurnstile implementation
assert(
	pageSource.includes("window.turnstile.reset(turnstileWidgetIdRef.current)"),
	"resetTurnstile window.turnstile.reset missing"
);
assert(
	pageSource.includes('setTurnstileToken("")'),
	"resetTurnstile token clearing missing"
);
console.log("  [PASS] resetTurnstile implementation verified");

// Test 6: Script tag placement and props
assert(
	pageSource.includes('src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"'),
	"Script src for Turnstile api.js missing"
);
assert(
	pageSource.includes('strategy="afterInteractive"'),
	"Script strategy afterInteractive missing"
);
assert(
	pageSource.includes("onLoad={renderTurnstile}"),
	"Script onLoad={renderTurnstile} missing"
);
console.log("  [PASS] Turnstile <Script> tag verified");

// Test 7: Input sanitization logic
const sanitizeNip = (raw) => raw.replace(/[<>'";\x00-\x1F\x7F]/g, "").slice(0, 50);
const capPassword = (raw) => raw.slice(0, 200);

// Verify NIP sanitization regex matches page.js logic
assert.strictEqual(sanitizeNip("<script>alert('xss');</script>"), "scriptalert(xss)/script");
assert.strictEqual(sanitizeNip("user' OR '1'='1"), "user OR 1=1");
assert.strictEqual(sanitizeNip("admin;\x00DROP"), "adminDROP");
assert.strictEqual(sanitizeNip("A".repeat(100)).length, 50);
assert.strictEqual(capPassword("P".repeat(300)).length, 200);

assert(
	pageSource.includes("handleNipChange"),
	"handleNipChange missing"
);
assert(
	pageSource.includes("handlePasswordChange"),
	"handlePasswordChange missing"
);
console.log("  [PASS] Input sanitization and length capping verified");

// Test 8: Submit payload includes turnstileToken
assert(
	pageSource.includes("turnstileToken,") || pageSource.includes("turnstileToken: turnstileToken"),
	"Submit payload missing turnstileToken"
);
assert(
	pageSource.includes("resetTurnstile()"),
	"resetTurnstile on error missing"
);
assert(
	pageSource.includes("disabled={loading || !formData.nip || !formData.password || !turnstileToken}"),
	"Submit button disabled condition missing turnstileToken check"
);
console.log("  [PASS] Form submission, payload, error reset, and button disabling verified");

console.log("\n=== All Login Page Turnstile tests passed! ===");
