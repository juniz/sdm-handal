# Login Security Hardening & Cloudflare Turnstile Design Spec

**Date:** 2026-10-23  
**Project:** `sdm-handal` (`/Users/hardiko/Documents/Developer/NEXT/sdm`)  
**Status:** Approved for Planning

---

## 1. Problem Statement & Audit Findings

Security review of [`src/app/page.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/page.js), [`src/app/api/auth/login/route.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/auth/login/route.js), and [`next.config.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/next.config.js) identified four focus areas:

1. **SQL Injection & Input Type Safety**:
   - [`src/app/api/auth/login/route.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/auth/login/route.js) uses parameterized queries (`?`) with `mysql2`, preventing classic SQL injection.
   - Missing strict type checking (`typeof === "string"`) and length bounds on `nip` and `password` before passing to `AES_ENCRYPT(?, ?)`. Non-string JSON payloads (arrays/objects) can cause unhandled errors or unexpected driver coercion.
2. **Script Injection (XSS) & Log Injection**:
   - `nip` input lacks server-side and client-side character filtering against HTML/script tags (`<`, `>`) and control characters (`\r`, `\n`), exposing server logs (`console.log("Login attempt for NIP:", nip)`) to log injection and downstream components to stored/reflected injection risks.
   - Content Security Policy (CSP) in [`next.config.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/next.config.js) does not whitelist `https://challenges.cloudflare.com` in `script-src` and `frame-src`.
3. **Brute Force & Timing Attacks**:
   - `/api/auth/login` has no rate limiting or lockout mechanism by IP or `nip`.
   - Password comparison uses standard `!==` instead of constant-time `crypto.timingSafeEqual`.
4. **Bot Protection (Cloudflare Turnstile)**:
   - Login form currently has no CAPTCHA/Turnstile challenge verification on client or server.

---

## 2. Architecture & Components

### 2.1 `src/lib/login-security.js` (New Module)
Isolated security utility module for login route:
- **Input Validation & Sanitization (`validateLoginInput(body)`)**:
  - Rejects non-object bodies.
  - Enforces `typeof nip === "string"` and `typeof password === "string"`.
  - Trims `nip`, enforces length `1..50`, rejects HTML/script/SQL meta-characters (`<`, `>`, `'`, `"`, `;`, `--`, `/*`, `*/`) and ASCII control characters (`[\x00-\x1F\x7F]`).
  - Enforces `password` length `1..200`.
- **In-Memory Rate Limiter (`checkRateLimit(ip, nip)`, `recordFailedAttempt(ip, nip)`, `clearRateLimit(ip, nip)`)**:
  - Tracks attempts by both client IP (`ip:<address>`) and normalized NIP (`nip:<nip>`).
  - Threshold: Max **5 failed attempts** within a **15-minute (900s) window**.
  - Lockout duration: **15 minutes** from the 5th failed attempt, returning `{ allowed: false, retryAfterSeconds }`.
  - Periodic pruning of expired entries to prevent memory leaks.
- **Timing-Safe Password Comparison (`safeComparePassword(decryptedBufferOrStr, inputPassword)`)**:
  - Hashes both strings with SHA-256 (`crypto.createHash("sha256")`) to fixed 32-byte buffers and compares via `crypto.timingSafeEqual`, preventing length-leakage and timing side-channels.
- **Cloudflare Turnstile Verification (`verifyTurnstileToken(token, remoteIp)`)**:
  - Uses `process.env.TURNSTILE_SECRET_KEY` (falls back to Cloudflare's official pass test secret key `1x0000000000000000000000000000000AA` when `NODE_ENV !== "production"` and `TURNSTILE_SECRET_KEY` is unset).
  - Sends `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `{ secret, response: token, remoteip: remoteIp }`.
  - Returns `{ success: boolean, message?: string }`.

### 2.2 [`src/app/api/auth/login/route.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/auth/login/route.js)
Request flow:
1. Extract client IP from `x-forwarded-for` (first IP) or `x-real-ip` or `"unknown"`.
2. Parse JSON safely; call `validateLoginInput(body)`. Return `400` if invalid.
3. Call `checkRateLimit(ip, nip)`. If blocked, return `429 Too Many Requests` with `Retry-After` header and clear Indonesian message.
4. Call `verifyTurnstileToken(turnstileToken, ip)`. If invalid, return `400`/`403` without revealing credential validity.
5. Execute parameterized MySQL query.
6. If user not found or `safeComparePassword` fails:
   - Call `recordFailedAttempt(ip, nip)`.
   - Return `401` (`"NIP atau password salah"`).
7. On success:
   - Call `clearRateLimit(ip, nip)`.
   - Issue JWT & set cookie as before.

### 2.3 [`src/app/page.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/page.js)
Client-side protections & Turnstile widget:
- Load `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` via `next/script`.
- Render Turnstile widget inside a container `ref` using `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (fallback in dev: `1x00000000000000000000AA`).
- Store `turnstileToken` in state; disable Submit button until `turnstileToken` is present and inputs are non-empty.
- Client-side input guard on `nip`: strip `<` and `>` characters and cap `maxLength={50}` on NIP and `maxLength={200}` on Password.
- Reset Turnstile widget (`window.turnstile.reset(widgetId)`) and clear `turnstileToken` whenever login fails, token expires, or widget errors.

### 2.4 [`next.config.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/next.config.js) & [`.env.example`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/.env.example)
- Update CSP in [`next.config.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/next.config.js):
  - Add `https://challenges.cloudflare.com` to `script-src`.
  - Add `frame-src 'self' https://challenges.cloudflare.com`.
- Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to [`.env.example`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/.env.example).

---

## 3. Error Handling & Testing Strategy

- **Rate Limit Exceeded (429)**: Returns `{ message: "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam X menit." }` with `Retry-After` header.
- **Turnstile Missing/Invalid (400/403)**: Returns `{ message: "Verifikasi keamanan (Captcha) gagal atau kadaluarsa. Silakan ulangi." }` and triggers client widget reset.
- **Automated Verification**:
  - Unit/integration test script verifying:
    1. SQLi & XSS payloads in `nip` (`' OR 1=1--`, `<script>alert(1)</script>`, non-string objects) are rejected by `validateLoginInput`.
    2. `safeComparePassword` accurately matches valid passwords and rejects invalid ones in constant time.
    3. Rate limiter blocks on the 6th attempt after 5 failures and resets after `clearRateLimit`.
    4. Turnstile verification succeeds with Cloudflare's test key/token and rejects empty tokens.
