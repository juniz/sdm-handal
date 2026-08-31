---
target: pengajuan tukar dinas
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-26T07-53-32Z
slug: src-app-dashboard-pengajuan-tukar-dinas-page-js
---
Method: dual-agent (A: 6671e67b-8e55-46f4-9fc4-5c68a6a4b285 · B: a86089d9-b932-44c2-b9f6-db122da5ce4f)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Status badges exist (`Proses Pengajuan`, `Disetujui`, `Ditolak`), but lack multi-stage lifecycle progression (Draft → Rekan Acknowledged → PJ Review → Roster Sync). |
| 2 | Match System / Real World | 2 | Shift swap is modeled as a detached administrative form with PJ picked first, rather than a clinical shift trade between two staff members. |
| 3 | User Control and Freedom | 2 | Users can delete pending requests, but cannot edit or revise a submitted request without full deletion and re-entry. |
| 4 | Consistency and Standards | 2 | Form modal uses 4 contrasting pastel background boxes (blue, orange, green, purple); error boundary uses raw black buttons; duplicate component trees. |
| 5 | Error Prevention | 1 | No schedule conflict checks or roster cross-referencing. Requester can swap with someone already on duty or select themselves. |
| 6 | Recognition Rather Than Recall | 1 | Requester must memorize dates, colleagues' shift assignments, and shift codes with zero schedule preview or roster calendar. |
| 7 | Flexibility and Efficiency | 2 | Filter only searches `nama_pemohon` and `nik`, making colleague lookups impossible for staff viewing their own swap history. |
| 8 | Aesthetic and Minimalist Design | 2 | Saturated pastel containers, 10 table columns on desktop, and redundant labels on mobile cards create visual clutter. |
| 9 | Error Recovery | 2 | Validation relies on transient toasts. Error boundary exposes internal component names (`PengajuanFormModal`). |
| 10 | Help and Documentation | 1 | No contextual guidance on hospital exchange policies, shift swap deadlines, or monthly swap quotas. |
| **Total** | | **17/40** | **Poor (Major UX overhaul required)** |

#### Design Specificity Verdict

**LLM Assessment**: The surface currently behaves as a generic CRUD database interface rather than a specialized, mission-critical clinical scheduling tool for **RS Bhayangkara Nganjuk**. Hospital shift trades require bilateral consent, roster verification, and rest-period compliance; presenting this as a blind 7-field form modal with conflicting pastel colors introduces clinical staffing risk and high cognitive friction.

**Deterministic Scan**: The automated detector (`detect.mjs`) returned **0 hard anti-pattern violations** across 5 evaluated files (1,673 lines of code). The code is cleanly structured with zero AI-slop gradients, proper semantic badge contrast, and solid responsive separation. However, static analysis confirmed the LLM's finding regarding the 4-color pastel container nesting in `PengajuanFormModal.jsx` (gray, orange, green, purple panels).

**Visual Overlays**: Browser overlay was skipped because headless browser automation (Puppeteer) is not installed in the local environment and the Next.js dev server enforces JWT authentication on the route.

#### Overall Impression

The page is functionally structured and responsive, with careful React unmounting guards. However, the core experience suffers from **clinical workflow blindness**: swapping shifts requires heavy memory recall, has no schedule conflict safeguards, and uses a noisy pastel color scheme that deviates from the clean slate/cyan design system in `DESIGN.md`.

#### What's Working

1. **Defensive React Lifecycle Guards**: Effective use of `useRef(isMounted)` and `requestAnimationFrame` guards in modals prevents Radix dialog DOM unmounting crashes on mobile browsers.
2. **Dual-View Responsive Architecture**: Clean split between a comprehensive desktop table view and touch-friendly mobile card view.
3. **Thorough Indonesian Date Localization**: Accurate formatting via `moment-timezone` and `date-fns/locale/id` (`DD MMM YYYY` and `DD MMMM YYYY`), matching Indonesian administrative standards.

#### Priority Issues

- **[P0] Blind Shift Entry & Zero Conflict Prevention**
  - **Why it matters**: Allowing nurses to swap shifts without checking existing duty schedules or minimum rest periods creates serious hospital staffing and patient safety hazards.
  - **Fix**: Connect the form modal to the hospital schedule roster API; auto-populate current scheduled duty for selected dates; validate that replacement colleague is not already on duty.
  - **Suggested command**: `$impeccable harden`

- **[P1] "Pastel Rainbow" Container Aesthetic & Visual Noise**
  - **Why it matters**: `PengajuanFormModal.jsx` uses 4 competing colored boxes (Blue-100, Orange-100, Green-100, Purple-100) with saturated gradients, violating the "Quiet Surface Rule" in `DESIGN.md`.
  - **Fix**: Refactor modal into clean neutral cards (`bg-slate-50` / white on `#F8FAFC`), subtle slate borders (`#E2E8F0`), and unified brand cyan accents (`#0284C7`).
  - **Suggested command**: `$impeccable distill`

- **[P2] Inverted Information Architecture & Missing Bilateral Stepper**
  - **Why it matters**: Requesting the Penanggung Jawab (PJ) supervisor before specifying the shift details confuses users. The workflow also lacks colleague acknowledgment before supervisor approval.
  - **Fix**: Reorder form flow (*1. Jadwal Saya → 2. Jadwal & Pegawai Pengganti → 3. Penanggung Jawab & Alasan*); introduce a 4-stage lifecycle stepper (*Draft → Menunggu Rekan → Menunggu PJ → Terverifikasi*).
  - **Suggested command**: `$impeccable layout`

- **[P3] Search and Filtering Blindspots**
  - **Why it matters**: Filter search only queries `nama_pemohon` and `nik`. When logged-in employees view their own history, filtering by colleague name or request number is impossible.
  - **Fix**: Extend table filter predicate to search `nama_pengganti` and `no_pengajuan`, and add date range filters.
  - **Suggested command**: `$impeccable clarify`

#### Persona Red Flags

- **Jordan (First-Time Ward Nurse)**: Opens modal to swap an urgent night shift; is greeted with "Penanggung Jawab" first; cannot see colleague's current schedule without leaving the app to check WhatsApp/PDF roster. High abandonment and error risk.
- **Alex (Head Nurse / Penanggung Jawab)**: Faces a 10-column table on desktop; cannot approve/reject directly from the Detail modal (must close and open a secondary modal with delay); lacks predefined rejection reasons.
- **Casey (Mobile Ward Staff)**: Filter bar requires extra tap to expand; mobile cards have repetitive text labels ("Dinas Asal:", "Dinas Ganti:", "Pengganti:") instead of a clear visual side-by-side exchange card.

#### Minor Observations

1. **Duplicate Component Trees**: Components exist in both `src/components/` and `src/components/pengajuan-tukar-dinas/`.
2. **Commented-out Validation Code**: `usePengajuanTukarDinas.js` contains ~70 lines of dead validation and retry code.
3. **Hardcoded Shift Dropdown Values**: Shift options (`Pagi`, `Siang`, `Malam`) are hardcoded in the modal instead of being sourced from `/api/jam-jaga`.

#### Questions to Consider

- *What if shift exchange was initiated directly from the employee's monthly roster view with one click ("Ajukan Tukar pada Tanggal Ini") instead of starting as a blank form?*
- *What if the system required bilateral digital confirmation from the replacement colleague before alerting the Penanggung Jawab?*
- *What if the desktop table used a compact 6-column summary with expandable drawer details to reduce visual scanning load?*
