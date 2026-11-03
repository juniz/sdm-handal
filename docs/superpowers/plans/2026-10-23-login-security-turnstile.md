# Login Security & Cloudflare Turnstile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Amankan endpoint login dan halaman login dari script injection, SQL injection, brute force, dan integrasikan verifikasi Cloudflare Turnstile.

**Architecture:** Helper modular `src/lib/login-security.js` mengelola validasi input ketat, in-memory rate limiter per IP+NIP, komparasi password constant-time, serta verifikasi server-side Turnstile. Endpoint Next.js route dan client page memanfaatkan helper ini dengan CSP yang diperbarui.

**Tech Stack:** Next.js 15, Node.js `crypto`, Cloudflare Turnstile API, MySQL2.

## Global Constraints
- Minimal touch pada file di luar auth flow.
- Pertahankan kompatibilitas PWA dan token storage existing di [`client-auth.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/client-auth.js).
- Gunakan Cloudflare test keys resmi saat `NODE_ENV !== "production"` dan ENV belum diisi.
- Bahasa pesan error pengguna: Bahasa Indonesia.

---

### Task 1: Module `src/lib/login-security.js`

**Files:**
- Create: `src/lib/login-security.js`

**Interfaces:**
- Produces:
  - `validateLoginInput(body): { valid: boolean, error?: string, nip?: string, password?: string }`
  - `checkRateLimit(ip, nip): { allowed: boolean, retryAfterSeconds?: number }`
  - `recordFailedAttempt(ip, nip): { attempts: number, locked: boolean }`
  - `clearRateLimit(ip, nip): void`
  - `safeComparePassword(hashOrPlainBuffer, plainStr): boolean`
  - `verifyTurnstileToken(token, remoteIp): Promise<{ success: boolean, message?: string }>`

- [ ] **Step 1: Tulis implementasi `src/lib/login-security.js`**
  Implementasikan validasi input (reject non-string, sanitasi karakter berbahaya, batasi panjang), rate limiting in-memory (5 attempts per 15 min), safe compare timingSafeEqual, dan Turnstile siteverify.

- [ ] **Step 2: Review syntax file**
  Verifikasi tidak ada error sintaksis.

---

### Task 2: Automated Unit Test `scripts/test-login-security.mjs`

**Files:**
- Create: `scripts/test-login-security.mjs`

**Interfaces:**
- Consumes: `src/lib/login-security.js`

- [ ] **Step 1: Tulis skrip test standalone**
  Uji skenario:
  - Validasi lolos input normal, gagal pada XSS `<script>`, SQLi `' OR 1=1`, dan objek payload.
  - Rate limiting memblokir setelah 5 kali gagal berturut-turut dan pulih setelah clear.
  - Password compare akurat dan timing-safe.
  - Turnstile verification lolos dengan dummy test token Cloudflare di dev mode.

- [ ] **Step 2: Jalankan test dan pastikan PASS**
  Run: `node scripts/test-login-security.mjs`

---

### Task 3: Hardening `src/app/api/auth/login/route.js`

**Files:**
- Modify: `src/app/api/auth/login/route.js`

**Interfaces:**
- Consumes: `src/lib/login-security.js`

- [ ] **Step 1: Pasang input sanitization, rate limiting, Turnstile verification, dan timing-safe compare**
  - Ekstrak IP client aman.
  - Panggil `validateLoginInput`.
  - Cek rate limit sebelum query DB.
  - Verifikasi Turnstile token.
  - Catat percobaan gagal jika user tidak ditemukan atau password salah.
  - Reset rate limit jika sukses login.

- [ ] **Step 2: Verifikasi alur route dengan mock request atau unit test**

---

### Task 4: Konfigurasi CSP & ENV

**Files:**
- Modify: `next.config.js`
- Modify: `.env.example`

- [ ] **Step 1: Update CSP `next.config.js`**
  Izinkan `challenges.cloudflare.com` di `script-src` dan `frame-src`.

- [ ] **Step 2: Tambahkan template Turnstile di `.env.example`**
  Cantumkan `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY`.

---

### Task 5: Integrasi Widget Turnstile & Input Guard di `src/app/page.js`

**Files:**
- Modify: `src/app/page.js`

- [ ] **Step 1: Tambahkan script loader Cloudflare Turnstile**
  Muat `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` secara asinkron.

- [ ] **Step 2: Render widget Turnstile di login form**
  Pasang ref container di bawah form password, simpan token di state, disable submit sampai token tersedia.

- [ ] **Step 3: Tangani reset widget saat login gagal**
  Panggil `turnstile.reset()` jika login ditolak atau terjadi error.

- [ ] **Step 4: Tambahkan client-side sanitasi input NIP**
  Cegah karakter injection langsung di event handler.

---

### Task 6: Verifikasi Akhir & Lint

- [ ] **Step 1: Jalankan unit test security**
  `node scripts/test-login-security.mjs`

- [ ] **Step 2: Jalankan lint/build check**
  `npm run lint` atau `next build --no-lint` (dry-run).
