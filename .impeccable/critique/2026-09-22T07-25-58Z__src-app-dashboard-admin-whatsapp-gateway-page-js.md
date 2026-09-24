---
target: src/app/dashboard/admin/whatsapp-gateway/page.js
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-22T07-25-58Z
slug: src-app-dashboard-admin-whatsapp-gateway-page-js
---
Method: dual-agent (A: 776ae005-9ad2-43c0-b8b4-7a8cd2bf44c8 · B: 9554119e-bfbe-4da7-a263-b8224f10e5c0)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Polling updates status, but no QR expiry countdown timer or connection ping |
| 2 | Match System / Real World | 2 | Exposes developer jargon ("Puppeteer Browser", "LocalAuth") instead of hospital terms |
| 3 | User Control and Freedom | 2 | Cannot cancel ongoing initialization; destructive disconnect lacks safety modal |
| 4 | Consistency and Standards | 3 | Consistent Tailwind styling and Lucide icons; lacks standard focus rings |
| 5 | Error Prevention | 2 | Uses unstyled `window.confirm`; no phone input mask or format validation |
| 6 | Recognition Rather Than Recall | 2 | Good step-by-step scan guide; phone format requires user memory |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts (`Cmd+Enter` to send); no message templates |
| 8 | Aesthetic and Minimalist Design | 2 | Disconnected state leaves large empty void; split focus between banner and top CTA |
| 9 | Error Recovery | 2 | Generic toast errors without actionable guidance when Puppeteer fails |
| 10 | Help and Documentation | 2 | Clear QR scan steps, but lacks operational FAQ or troubleshooting instructions |
| **Total** | | **21/40** | **Acceptable** |

#### Design Specificity Verdict

**LLM assessment**: Generic developer sandbox with superficial hospital text. Mentions "gateway pesan resmi rumah sakit" and "ponsel resmi RS", but exposes low-level runtime internals (`Puppeteer Browser`, `LocalAuth (Persistent)`, raw socket states `READY`, `DISCONNECTED`). Zero domain workflow integration: no queue counters, no hospital service links (patient appointments, doctor shift alerts, payslip blasts). Operates like an isolated Node library tester.

**Deterministic scan**: CLI detector (`detect.mjs`) returned 0 findings on regex scan. Code inspection revealed high rate of false negatives in detector: identified missing focus rings on all buttons/links, WCAG AA contrast failures (`text-amber-600` on white at 3.76:1), missing `htmlFor`/`id` bindings on form inputs, sub-44px touch targets on mobile breadcrumb, and missing `aria-live` on dynamic status containers.

**Visual overlays**: Skipped live browser overlay injection. AST and code-level evidence used directly.

#### Overall Impression
Functional utility that successfully drives the underlying `whatsapp-web.js` service, but feels like an internal developer diagnostic tool rather than a polished hospital operations module. The biggest opportunity is transforming it from a raw socket tester into a reassuring, hospital-grade communication control center with clear feedback, accessible forms, and workflow safeguards.

#### What's Working
1. **Adaptive polling lifecycle**: 3-second polling during `SCAN_QR` / `INITIALIZING` switching to 15 seconds on `READY` keeps overhead low while preserving responsive feedback.
2. **Dual-OS QR scan instructions**: Explicit, step-by-step guidance distinguishing Android ("Titik Tiga") from iOS ("Pengaturan").
3. **Semantic status badge system**: Clear, well-differentiated visual tokens for connection states matching WhatsApp's emerald theme.

#### Priority Issues

- **[P1] Destructive disconnect lacks safety modal & impact warning**
  - **Why it matters**: Disconnecting the gateway halts all automated hospital notifications (patient OTP, pre-registration receipts, shift swaps). Using native `window.confirm` provides zero context on operational fallout and breaks keyboard/screen reader focus.
  - **Fix**: Replace `window.confirm` with accessible `AlertDialog` displaying clear warning: "Memutuskan koneksi akan menghentikan pengiriman pesan otomatis RS."
  - **Suggested command**: `$impeccable harden`

- **[P1] Disconnected state CTA disconnected from canvas (Fitts' Law violation)**
  - **Why it matters**: When disconnected, the center card tells users: "Klik tombol Hubungkan WhatsApp di kanan atas". Users must scan across ~900px to locate the button.
  - **Fix**: Co-locate the primary "Hubungkan WhatsApp" button directly inside the empty state card as a prominent call-to-action.
  - **Suggested command**: `$impeccable layout`

- **[P2] Technical developer jargon exposed to hospital staff**
  - **Why it matters**: Hospital HR/IT staff see "Menjalankan Puppeteer Browser..." and "Mode Sesi: LocalAuth (Persistent)", which causes confusion during troubleshooting.
  - **Fix**: Replace technical strings with domain language: "Menyiapkan Layanan WhatsApp..." and "Penyimpanan Sesi: Aman di Server".
  - **Suggested command**: `$impeccable clarify`

- **[P2] Accessibility & form control non-compliance**
  - **Why it matters**: `<label>` elements lack `htmlFor` and inputs lack `id`. Screen readers cannot associate labels with inputs. Phone input uses `type="text"` instead of `type="tel"` with `inputMode="tel"`, forcing full keyboard on mobile. Contrast on warning text (`text-amber-600`) fails WCAG AA (3.76:1 vs 4.5:1).
  - **Fix**: Add proper `htmlFor`/`id` pairs, `type="tel"`, `aria-live="polite"` on status updates, and darken warning text to `text-amber-700`.
  - **Suggested command**: `$impeccable audit`

- **[P3] QR scan anxiety without expiry indicator**
  - **Why it matters**: Notice says "Kode QR akan diperbarui secara otomatis setiap beberapa detik jika kedaluwarsa", but gives no visual countdown, leaving users rushing or unsure if QR is still fresh.
  - **Fix**: Add a subtle progress ring or countdown indicator showing QR validity freshness.
  - **Suggested command**: `$impeccable animate`

#### Persona Red Flags
- **Alex (IT Admin)**: No live log drawer or ping indicator to diagnose silent browser hangs; no `Cmd+Enter` keyboard shortcut for test message dispatch; cannot cancel an `INITIALIZING` process if browser hangs.
- **Jordan (First-Timer Staff)**: Confused by technical terms ("Puppeteer", "LocalAuth"); disoriented by split CTA location; anxious about QR expiry without timer.
- **Sam (Accessibility)**: Screen reader does not announce dynamic status/QR changes due to missing `aria-live`; inputs unannounced due to missing label `for`/`id`; native `window.confirm` traps/scrambles focus; warning text low contrast.

#### Minor Observations
- Test phone input does not auto-format or strip non-digits as user types.
- Test message card has no pre-filled quick templates (e.g., "Uji Coba Notifikasi Pasien", "Uji Coba Penggajian").
- Bare `border` utilities without semantic border colors (`border-slate-200`).

#### Questions to Consider
- What if the WhatsApp Gateway page showed the delivery health of dependent hospital services (e.g., OTP sent today, receipts delivered)?
- How should the system automatically recover if the background browser crashes without requiring an admin to manually disconnect and reconnect?
