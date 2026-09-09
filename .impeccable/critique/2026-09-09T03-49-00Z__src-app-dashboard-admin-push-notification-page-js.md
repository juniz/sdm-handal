---
target: /dashboard/admin/push-notification
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-09-09T03-49-00Z
slug: src-app-dashboard-admin-push-notification-page-js
---
Method: dual-agent (A: c73457d5-7ce6-4f08-b67c-c5ff9bcd2bf2 · B: CLI detector)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | No delivery logs, recipient reach count, or device subscription status before send |
| 2 | Match System / Real World | 2 | Raw technical OneSignal parameters instead of hospital units (IGD, ICU) or shifts |
| 3 | User Control and Freedom | 1 | "Reset" wipes form immediately with zero undo/confirmation; broadcast cannot be paused |
| 4 | Consistency and Standards | 1 | Rogue Indigo palette violates DESIGN.md Brand Cyan token; non-standard rounded-2xl |
| 5 | Error Prevention | 1 | No confirmation modal before hospital-wide broadcast; Reset button adjacent to Kirim |
| 6 | Recognition Rather Than Recall | 2 | URL requires manual path recall; no sent notification history or reusable templates |
| 7 | Flexibility and Efficiency | 2 | Binary targeting (1 user or Everyone); no unit/department multi-select or shortcuts |
| 8 | Aesthetic and Minimalist Design | 2 | Heavy dark phone mockup violates Quiet Surface Rule and commands 42% of desktop grid |
| 9 | Error Recovery | 2 | Transient Sonner toasts only; lacks persistent inline error recovery |
| 10 | Help and Documentation | 2 | Generic helper card; lacks broadcast etiquette or character limit guidance |
| **Total** | | **17/40** | **Poor (Major UX overhaul required)** |

#### Design Specificity Verdict

**Verdict:** Category-Interchangeable SaaS Prototype (Grade: D / Low Specificity)

- **LLM Assessment:** The current implementation is a generic OneSignal wrapper disconnected from RS Bhayangkara Nganjuk clinical operations. Hospital administrators need targeted communication by Department/Unit (IGD, Rawat Inap, ICU, Farmasi) and Shift (Pagi, Siang, Malam), rather than raw binary targeting (1 employee NIK vs entire hospital). The 5-column skeuomorphic phone bezel consumes 41.6% of the screen while crowding out vital operational feedback: sent history, delivery telemetry, and active device subscription counts.
- **Deterministic scan:** `detect.mjs` executed cleanly (0 structural rule violations). The flaws are architectural, semantic token drift, and domain-specific UX gaps.
- **Visual overlays:** Browser overlay injection skipped (native browser automation runner not exposed in current agent harness).

#### Overall Impression
The reactive form-to-preview binding works smoothly and state management is stable, but the page feels like a generic developer sandbox rather than an enterprise hospital administration console. Replacing the rogue Indigo theme with canonical Brand Cyan, adding hospital-specific unit targeting, providing guardrails on mass broadcasts, and replacing the oversized phone graphic with sent notification history will elevate this from a toy demo to a clinical workforce tool.

#### What's Working
1. **Instant Form-to-Preview Synchronization:** Typing title, body, and URL updates the preview card in real time, preventing unexpected line breaks or text clipping.
2. **Clear Target Mode Segmentation:** Segmented pill control clearly distinguishes single recipient from hospital-wide broadcast, triggering an amber warning banner.
3. **Structured Employee Metadata:** `SearchableSelect` displays employee name, NIK, and department tag cleanly.

#### Priority Issues
- **[P0] Destructive Hospital-Wide Broadcast Without Guardrails or Unit Segmentation**
  - *Why it matters:* Accidental hospital broadcasts alert off-duty staff at all hours. Admins cannot currently target specific wards (IGD, ICU, Rawat Inap).
  - *Fix:* Introduce Department/Unit multi-select targeting and require confirmation modal before mass broadcast.
  - *Suggested command:* `$impeccable harden`
- **[P1] Token Divergence: Rogue Indigo Palette and Rounded Corners**
  - *Why it matters:* Violates SDM Handal `DESIGN.md` (Clinical Signal Rule), introducing unapproved `indigo-*` classes and `rounded-2xl` shapes.
  - *Fix:* Replace Indigo with canonical `sky-600` (Brand Cyan), `sky-500` (Active Cyan), and normalize to `rounded-lg` (8px) / `rounded-xl` (12px).
  - *Suggested command:* `$impeccable polish`
- **[P1] Lack of Delivery Telemetry and Sent Notification History**
  - *Why it matters:* Enterprise administrators cannot audit sent announcements, track delivery success, or verify whether recipients received broadcasts.
  - *Fix:* Balance layout by replacing static phone frame with a "Riwayat Pengiriman" (Sent Logs) table showing timestamp, recipient, title, and delivery status.
  - *Suggested command:* `$impeccable layout`
- **[P2] Dangerous Reset Button & Unassisted Route Input**
  - *Why it matters:* Immediate data wipe on accidental click; manual text entry for URLs causes typos and 404s.
  - *Fix:* Demote Reset to secondary ghost action with dirty-state confirmation; provide route suggestions/combobox for standard internal pages.
  - *Suggested command:* `$impeccable clarify`

#### Persona Red Flags
- **Alex (Impatient Hospital HR Admin):** Cannot notify an entire clinical unit (e.g. all IGD nurses) without either broadcasting to all 400+ employees or typing 15 individual notifications. No keyboard shortcut (`Cmd+Enter`) to send. High risk of accidental form reset.
- **Sam (Accessibility-Dependent User):** Skeuomorphic phone bezel contains micro-text below WCAG AA 4.5:1 contrast ratios. Errors rely solely on floating Sonner toasts without inline aria-describedby linkage.

#### Minor Observations
- Breadcrumb displays English `System Settings / Push Notification` while page title is Indonesian `Kirim Push Notification`.
- Title input lacks character counter (OneSignal mobile notification titles truncate past 45 characters).

#### Questions to Consider
- What if the screen featured a split view with a "Kirim Notifikasi" form on top/left and a "Riwayat Notifikasi Terkirim" table to track delivery audit logs?
- What if hospital operational templates (Cito Recall, Shift Swap Notification, General HR Announcement) were selectable with one click?
