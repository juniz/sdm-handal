const SAFE_FETCH_SYMBOL = Symbol.for("sdm.node2shell.safeFetchInstalled");

/**
 * Checks if a Brotli library version is vulnerable to CVE-2026-111497 (Node2Shell).
 * Vulnerable ranges: 1.0.3 - 1.0.9, 1.1.0, 1.2.0.
 * Patched versions: >= 1.0.10 (1.0.x), >= 1.1.1 (1.1.x), >= 1.2.1 (1.2.x+).
 *
 * @param {string} [version]
 * @returns {boolean}
 */
export function isVulnerableBrotli(
	version = process.versions?.brotli ?? ""
) {
	const clean = String(version ?? "").trim();
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(clean);
	if (!match) {
		return true;
	}

	const major = Number(match[1]);
	const minor = Number(match[2]);
	const patch = Number(match[3]);

	if (major === 1 && minor === 0) {
		return patch >= 3 && patch < 10;
	}
	if (major === 1 && minor === 1) {
		return patch < 1;
	}
	if (major === 1 && minor === 2) {
		return patch < 1;
	}
	if (major < 1) {
		return true;
	}

	return false;
}

/**
 * Evaluates runtime Brotli version for CVE-2026-111497.
 * Logs a critical warning by default; throws Error when strict mode is enabled.
 *
 * @param {{
 *   nodeEnv?: string,
 *   brotliVersion?: string,
 *   strict?: boolean,
 *   logger?: { warn: (msg: string) => void }
 * }} [options]
 */
export function assertSafeBrotliRuntime({
	nodeEnv = process.env.NODE_ENV || "development",
	brotliVersion = process.versions?.brotli ?? "unknown",
	strict = process.env.NODE2SHELL_STRICT_RUNTIME === "true",
	logger = console,
} = {}) {
	if (!isVulnerableBrotli(brotliVersion)) {
		return;
	}

	const msg =
		`CRITICAL [CVE-2026-111497 / Node2Shell]: Vulnerable Brotli decoder (${brotliVersion}) ` +
		`detected on Node.js ${process.version} (env=${nodeEnv}). ` +
		`Application-layer guards active; upgrade Node.js to >=22.23.4, >=24.22.1, or >=26.12.1.`;

	if (strict) {
		throw new Error(msg);
	}

	logger.warn(msg);
}

/**
 * Detects whether a Content-Encoding header contains the 'br' (Brotli) token.
 *
 * @param {string | string[] | null | undefined} contentEncodingHeader
 * @returns {boolean}
 */
export function hasBrotliEncoding(contentEncodingHeader) {
	if (!contentEncodingHeader) {
		return false;
	}
	const raw = Array.isArray(contentEncodingHeader)
		? contentEncodingHeader.join(",")
		: String(contentEncodingHeader);

	return raw
		.split(",")
		.map((token) => token.split(";")[0].trim().toLowerCase())
		.includes("br");
}

/**
 * Produces an Accept-Encoding header value guaranteed not to advertise 'br'.
 *
 * @param {string | null | undefined} [value]
 * @returns {string}
 */
export function sanitizeAcceptEncoding(value) {
	if (!value || !String(value).trim()) {
		return "gzip, deflate";
	}
	const allowed = String(value)
		.split(",")
		.map((token) => token.trim())
		.filter((token) => {
			const name = token.split(";")[0].trim().toLowerCase();
			return name.length > 0 && name !== "br";
		});

	return allowed.length > 0 ? allowed.join(", ") : "identity";
}

/**
 * Wraps globalThis.fetch idempotently so outbound HTTP requests never advertise
 * Brotli ('br') decompression via Undici.
 */
export function installSafeFetchWrapper() {
	const currentFetch = globalThis.fetch;
	if (typeof currentFetch !== "function" || currentFetch[SAFE_FETCH_SYMBOL]) {
		return;
	}

	const wrappedFetch = function safeFetch(input, init) {
		const baseHeaders =
			init?.headers ??
			(typeof Request !== "undefined" && input instanceof Request
				? input.headers
				: undefined);
		const headers = new Headers(baseHeaders);
		headers.set(
			"Accept-Encoding",
			sanitizeAcceptEncoding(headers.get("accept-encoding"))
		);

		return currentFetch(input, {
			...init,
			headers,
		});
	};

	wrappedFetch[SAFE_FETCH_SYMBOL] = true;
	globalThis.fetch = wrappedFetch;
}
