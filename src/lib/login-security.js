import crypto from "crypto";

// Rate limiter constants
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes (900 seconds)
const MAX_ATTEMPTS = 5;

// In-memory store for rate limiting: key -> array of attempt timestamps (ms)
const rateLimitStore = new Map();

// Periodic prune helper to prevent memory leak
function pruneExpiredEntries(now = Date.now()) {
	for (const [key, timestamps] of rateLimitStore.entries()) {
		const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
		if (valid.length === 0) {
			rateLimitStore.delete(key);
		} else if (valid.length !== timestamps.length) {
			rateLimitStore.set(key, valid);
		}
	}
}

/**
 * Validates login input payload.
 * Enforces string types, length bounds, and filters dangerous characters.
 *
 * @param {any} body
 * @returns {{ valid: boolean, error?: string, nip?: string, password?: string }}
 */
export function validateLoginInput(body) {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return {
			valid: false,
			error: "Permintaan tidak valid, body harus berupa objek JSON",
		};
	}

	const { nip, password } = body;

	if (nip === undefined || password === undefined) {
		return {
			valid: false,
			error: "NIP dan password wajib diisi",
		};
	}

	if (typeof nip !== "string" || typeof password !== "string") {
		return {
			valid: false,
			error: "Format NIP dan password harus berupa teks",
		};
	}

	const trimmedNip = nip.trim();

	if (trimmedNip.length === 0) {
		return {
			valid: false,
			error: "NIP tidak boleh kosong",
		};
	}

	if (trimmedNip.length > 50) {
		return {
			valid: false,
			error: "Panjang NIP maksimal 50 karakter",
		};
	}

	// Reject dangerous meta-characters: < > ' " ; -- /* */ and ASCII control chars [\x00-\x1F\x7F]
	const dangerousCharsRegex = /[<>'";\x00-\x1F\x7F]/;
	if (
		dangerousCharsRegex.test(trimmedNip) ||
		trimmedNip.includes("--") ||
		trimmedNip.includes("/*") ||
		trimmedNip.includes("*/")
	) {
		return {
			valid: false,
			error: "Format NIP tidak valid atau mengandung karakter dilarang",
		};
	}

	if (password.length === 0) {
		return {
			valid: false,
			error: "Password tidak boleh kosong",
		};
	}

	if (password.length > 200) {
		return {
			valid: false,
			error: "Panjang password maksimal 200 karakter",
		};
	}

	return {
		valid: true,
		nip: trimmedNip,
		password,
	};
}

/**
 * Checks if IP or NIP has exceeded rate limits.
 *
 * @param {string} [ip]
 * @param {string} [nip]
 * @returns {{ allowed: boolean, retryAfterSeconds?: number }}
 */
export function checkRateLimit(ip, nip) {
	const now = Date.now();
	pruneExpiredEntries(now);

	const keys = [];
	if (ip && typeof ip === "string" && ip.trim()) {
		keys.push(`ip:${ip.trim().toLowerCase()}`);
	}
	if (nip && typeof nip === "string" && nip.trim()) {
		keys.push(`nip:${nip.trim().toLowerCase()}`);
	}

	let maxRetryAfter = 0;
	let isBlocked = false;

	for (const key of keys) {
		const timestamps = rateLimitStore.get(key) || [];
		const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

		if (active.length >= MAX_ATTEMPTS) {
			isBlocked = true;
			const oldest = active[0];
			const retryAfter = Math.max(
				1,
				Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000)
			);
			if (retryAfter > maxRetryAfter) {
				maxRetryAfter = retryAfter;
			}
		}
	}

	if (isBlocked) {
		return {
			allowed: false,
			retryAfterSeconds: maxRetryAfter,
		};
	}

	return { allowed: true };
}

/**
 * Records a failed login attempt for IP and NIP.
 *
 * @param {string} [ip]
 * @param {string} [nip]
 * @returns {{ attempts: number, locked: boolean }}
 */
export function recordFailedAttempt(ip, nip) {
	const now = Date.now();
	const keys = [];
	if (ip && typeof ip === "string" && ip.trim()) {
		keys.push(`ip:${ip.trim().toLowerCase()}`);
	}
	if (nip && typeof nip === "string" && nip.trim()) {
		keys.push(`nip:${nip.trim().toLowerCase()}`);
	}

	let maxAttempts = 0;

	for (const key of keys) {
		const timestamps = rateLimitStore.get(key) || [];
		const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
		active.push(now);
		rateLimitStore.set(key, active);

		if (active.length > maxAttempts) {
			maxAttempts = active.length;
		}
	}

	return {
		attempts: maxAttempts,
		locked: maxAttempts >= MAX_ATTEMPTS,
	};
}

/**
 * Resets rate limit counters for given IP and NIP on successful login.
 *
 * @param {string} [ip]
 * @param {string} [nip]
 */
export function clearRateLimit(ip, nip) {
	if (ip && typeof ip === "string" && ip.trim()) {
		rateLimitStore.delete(`ip:${ip.trim().toLowerCase()}`);
	}
	if (nip && typeof nip === "string" && nip.trim()) {
		rateLimitStore.delete(`nip:${nip.trim().toLowerCase()}`);
	}
}

/**
 * Timing-safe comparison of password against decrypted database value.
 * Hashes both values with SHA-256 to produce fixed 32-byte buffers before comparing.
 *
 * @param {Buffer|string} decryptedBufferOrStr
 * @param {string|Buffer} inputPassword
 * @returns {boolean}
 */
export function safeComparePassword(decryptedBufferOrStr, inputPassword) {
	try {
		if (decryptedBufferOrStr == null || inputPassword == null) {
			return false;
		}

		const bufA = Buffer.isBuffer(decryptedBufferOrStr)
			? decryptedBufferOrStr
			: Buffer.from(String(decryptedBufferOrStr), "utf8");

		const bufB = Buffer.isBuffer(inputPassword)
			? inputPassword
			: Buffer.from(String(inputPassword), "utf8");

		const hashA = crypto.createHash("sha256").update(bufA).digest();
		const hashB = crypto.createHash("sha256").update(bufB).digest();

		return crypto.timingSafeEqual(hashA, hashB);
	} catch (error) {
		console.error("Error in safeComparePassword:", error);
		return false;
	}
}

/**
 * Verifies Cloudflare Turnstile token via siteverify API.
 * Supports dev mode bypass and Cloudflare official testing keys.
 *
 * @param {string} token
 * @param {string} [remoteIp]
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export function verifyTurnstileToken(token, remoteIp) {
	return (async () => {
		const isDev = process.env.NODE_ENV !== "production";

		// Dev bypass: dummy test token allowed in non-production
		if (isDev && token === "dummy-dev-token") {
			return { success: true, message: "Turnstile dev token bypass aktif" };
		}

		if (!token || typeof token !== "string" || !token.trim()) {
			return {
				success: false,
				message: "Token verifikasi Cloudflare Turnstile wajib disertakan",
			};
		}

		// Cloudflare standard test secret (always passes)
		const CLOUDFLARE_ALWAYS_PASS_SECRET =
			"1x0000000000000000000000000000000AA";

		let secretKey = process.env.TURNSTILE_SECRET_KEY;
		if (!secretKey) {
			if (isDev) {
				secretKey = CLOUDFLARE_ALWAYS_PASS_SECRET;
			} else {
				return {
					success: false,
					message:
						"TURNSTILE_SECRET_KEY belum dikonfigurasi di environment server",
				};
			}
		}

		try {
			const endpoint =
				"https://challenges.cloudflare.com/turnstile/v0/siteverify";
			const params = new URLSearchParams();
			params.append("secret", secretKey);
			params.append("response", token.trim());
			if (remoteIp) {
				params.append("remoteip", remoteIp);
			}

			const response = await fetch(endpoint, {
				method: "POST",
				body: params,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			});

			if (!response.ok) {
				return {
					success: false,
					message: `Verifikasi Turnstile gagal merespons (HTTP ${response.status})`,
				};
			}

			const data = await response.json();
			if (data.success) {
				return { success: true };
			}

			const errors = Array.isArray(data["error-codes"])
				? data["error-codes"].join(", ")
				: "verifikasi ditolak";

			return {
				success: false,
				message: `Verifikasi Turnstile gagal: ${errors}`,
			};
		} catch (error) {
			console.error("Turnstile verification network error:", error);
			return {
				success: false,
				message: `Kesalahan jaringan saat verifikasi Turnstile: ${error.message}`,
			};
		}
	})();
}

/**
 * Testing helper: clears all in-memory rate limit entries.
 */
export function _resetRateLimitStore() {
	rateLimitStore.clear();
}
