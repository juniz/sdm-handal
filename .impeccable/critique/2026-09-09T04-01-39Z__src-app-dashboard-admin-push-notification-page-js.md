---
target: /dashboard/admin/push-notification
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-09-09T04-01-39Z
slug: src-app-dashboard-admin-push-notification-page-js
---
Method: dual-agent (A: 54616347-02ae-4847-888c-28dc6452d019 · B: CLI detector)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | "OneSignal Aktif" badge is hardcoded visual flair without live API health check or recipient subscriber reach |
| 2 | Match System / Real World | 2 | Missing hospital organizational units (IGD, Bangsal, ICU) and shift taxonomy; exposes OneSignal technical terms |
| 3 | User Control and Freedom | 3 | Form reset relies on native blocking `window.confirm()`; quick route chips overwrite URL without undo |
| 4 | Consistency and Standards | 2 | Monospace breadcrumb breaks DESIGN.md; invalid Tailwind `text-slate-650`; buttons use ad-hoc classes |
| 5 | Error Prevention | 3 | Modal prevents accidental single-click send, but mass broadcast lacks high-friction warning button; URL lacks schema validation |
| 6 | Recognition Rather Than Recall | 2 | No clinical message presets/templates; past notifications stored only in local browser storage without 1-click clone |
| 7 | Flexibility and Efficiency | 2 | Binary targeting (1 user vs everyone) forces tedious individual messages for unit staff; no keyboard shortcuts (Cmd+Enter) |
| 8 | Aesthetic and Minimalist Design | 3 | Clean layout with restrained elevation; inner preview sub-panel introduces unnecessary double border nesting |
| 9 | Error Recovery | 2 | Transient Sonner toasts only; missing inline field error states or accessible error bindings |
| 10 | Help and Documentation | 2 | No helper text explaining PWA push permission requirements or mobile deep-linking behaviors |
| **Total** | | **23/40** | **Moderate (Usable with Significant Operational Friction)** |

#### Design Specificity Verdict

**Verdict:** Generic Internal Push Console with Nascent Clinical Alignment (Grade: C+)

- **LLM Assessment:** Visual token alignment is much improved (`sky-600`, `rounded-lg`, restrained preview), but interaction architecture remains a developer-centric push tool rather than RS Bhayangkara Nganjuk workforce operational hub. Hospital admins are restricted to binary targeting (1 individual vs 300+ hospital-wide), forcing admins either to spam off-duty staff or manually compose individual notifications. Common hospital communication patterns (STR/SIP expiration, shift swap approvals, emergency on-call) lack reusable templates.
- **Deterministic scan:** `detect.mjs` executed cleanly (0 structural rule violations).
- **Visual overlays:** Browser overlay injection skipped (native browser automation runner not exposed in current agent harness).

#### Overall Impression
The visual overhaul successfully purged rogue Indigo colors and oversized phone bezels, delivering a clean 12-column layout with preview and sent history. However, deep domain audit reveals significant accessibility gaps (form labels unlinked, dialog un-trapped, pseudo-radios lacking ARIA) and hospital operational deficits (lack of unit/department targeting, absence of reusable templates, native `window.confirm`). Addressing these transforms the screen into a compliant, high-velocity clinical administrative tool.

#### What's Working
1. **Synchronous Mobile Viewport Simulation:** Live phone preview card provides immediate mental model of mobile OS lockscreen rendering and truncation limits.
2. **Proactive Character Guardrails:** Real-time character counter warns at 45/50 characters for title, preventing truncated subject lines on mobile devices.
3. **Double-Confirmation Architecture:** Explicit review dialog prevents single-click transmission mistakes before reaching external push gateway.

#### Priority Issues
- **[P0] Critical Accessibility & Modal Dialog Trapping**
  - *Why it matters:* Form inputs lack programmatic `htmlFor`/`id` bindings. Target selector buttons lack radiogroup semantics. Confirmation modal lacks `role="dialog"`, `aria-modal="true"`, focus trap, and Escape key dismissal, violating WCAG 2.1 AA.
  - *Fix:* Associate inputs with labels, add ARIA attributes to target selectors, and wrap modal with Radix UI `Dialog` or proper focus-trap/escape listener.
  - *Suggested command:* `$impeccable harden`
- **[P1] Hospital Unit/Department Target Segmentation**
  - *Why it matters:* Admins cannot notify specific clinical units (e.g. IGD nurses, Rawat Inap) without blasting the entire hospital or sending dozens of individual alerts.
  - *Fix:* Introduce segmented target option `Per Unit / Departemen` using `nama_departemen` already available in `/api/pegawai` dataset.
  - *Suggested command:* `$impeccable layout`
- **[P2] Sent History Re-Use ("Kirim Ulang") & Template Presets**
  - *Why it matters:* Sent history items in right column are inert text; admins must manually retype recurring messages from scratch.
  - *Fix:* Enable 1-click "Pakai Ulang" (clone to form) on history cards, and provide quick preset templates (Pengingat STR/SIP, Jadwal Dinas, Pengumuman Cuti).
  - *Suggested command:* `$impeccable clarify`
- **[P3] Design Token Polish & Native Dialog Removal**
  - *Why it matters:* `window.confirm()` disrupts clinical flow and PWA experience. Invalid Tailwind class `text-slate-650` produces dirty markup. Monospace breadcrumb violates DESIGN.md Figtree standard.
  - *Fix:* Replace `window.confirm` with in-app confirmation modal or quiet inline reset state; fix `text-slate-650` to `text-slate-600`; replace breadcrumb font with Figtree.
  - *Suggested command:* `$impeccable polish`

#### Persona Red Flags
- **Alex (Impatient Hospital Operations Admin):** Cannot message 25 nurses in Rawat Inap without blasting the whole hospital. Cannot click past notification in history to re-populate fields. No `Cmd+Enter` keyboard shortcut. Jarring native `window.confirm` prompt on reset.
- **Sam (Accessibility-Dependent Staff / Keyboard Navigator):** Form inputs lack programmatic label linkage. Screen readers receive zero indication of target switch status or live lockscreen preview changes. Trapped when modal opens if keyboard navigation is restricted.

#### Minor Observations
1. **OneSignal Gateway Telemetry:** Status badge is hardcoded visual flair. Could query OneSignal API to show live device reach or subscriber count.
2. **Notification Urgency:** No priority level selection (Normal vs Cito/Darurat) for urgent clinical call-ins.
3. **Double-Border Nesting:** Inner phone preview card nested in `bg-slate-50/50` sub-panel creates unnecessary nested borders.
