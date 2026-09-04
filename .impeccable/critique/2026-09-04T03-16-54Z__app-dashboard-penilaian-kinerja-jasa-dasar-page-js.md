---
target: /dashboard/penilaian-kinerja/jasa-dasar
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-09-04T03-16-54Z
slug: app-dashboard-penilaian-kinerja-jasa-dasar-page-js
---
Method: dual-agent (A: a6a9a077-177b-47f3-9e67-69690e9e1be1 · B: 94331756-77bb-42c2-8d1c-ad0f3aa27e63)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Full-page spinner wipes table during bulk delete/import; no file parsing or row processing progress. |
| 2 | Match System / Real World | 3 | Indonesian terms used, but flat table ignores hospital hierarchy (Instalasi/Unit Kerja) and remuneration cycle concepts. |
| 3 | User Control and Freedom | 2 | Delete confirmation exists, but modal lacks `Escape`/backdrop click dismissal; no undo for destructive bulk delete. |
| 4 | Consistency and Standards | 2 | Inverted palette tokens (`from-primary-900 to-primary-800` is light sky), decorative blur spheres, and bouncy `scale-105` micro-interactions conflict with `DESIGN.md`. |
| 5 | Error Prevention | 2 | No validation preventing `berlaku_sampai` before `berlaku_mulai`; no client-side check for overlapping active date periods per employee. |
| 6 | Recognition Rather Than Recall | 2 | Form disables employee edit without showing job title/grade reference; table shows raw numbers without salary bracket indicators. |
| 7 | Flexibility and Efficiency | 3 | Excel template export and bulk import present, but table lacks column sorting, pagination, and quick status filters. |
| 8 | Aesthetic and Minimalist Design | 2 | Header cluttered with AI-style decorative blur spheres; non-standard token names (`slate-550`, `slate-750`). |
| 9 | Error Recovery | 1 | **Critical defect**: Form validation errors render on main page behind backdrop (`z-50`), leaving modal user blind to submission failures. |
| 10 | Help and Documentation | 2 | No inline guidance explaining calculation rules, validity period constraints, or expected Excel format columns. |
| **Total** | | **21/40** | **Acceptable** |

#### Design Specificity Verdict

- **LLM assessment**: Generic SaaS CRUD template with consumer/AI decorative overlay (`bg-primary-600/10 rounded-full blur-3xl`, playful `hover:scale-105 active:scale-95` micro-interactions, rainbow icon colors). Lacks hospital-specific remuneration workflows: no departmental aggregation, no payroll period alignment (Bulan Remunerasi / Tahun Anggaran), no salary tier benchmarks, and no active/expired status governance.
- **Deterministic scan**: CLI detector reported 0 findings on `page.js` due to JS parser rule scoping; component scan flagged 1 warning on `src/components/ui/confirmation-dialog.jsx` (`gray-on-color` at line 26: `text-slate-800 on bg-amber-500`). Manual inspection verified 3 AI-slop decorative blur spheres (`page.js:443, 623, 721`), inverted palette classes (`globals.css:68-69`), and 8 bouncy button scale instances.
- **Visual overlays**: Skipped. No browser automation tool exposed in runtime sandbox. Fallback: manual source verification against `DESIGN.md`.

#### Overall Impression

Functional data manager with practical Excel bulk tooling, but compromised by critical modal error bug, inverted palette tokens, cognitive overload on header actions, and decorative consumer-app styling ill-suited for hospital payroll administration.

#### What's Working

1. **Explicit Deletion Safeguard (`ConfirmationDialog`)**: Both single-row and bulk-row deletions require explicit modal confirmation with selected item counts and destructive variant styling.
2. **Pre-populated Excel Template Generator**: Live employee NIK, name, and department pre-populate template export, reducing manual transcription errors during yearly remuneration updates.
3. **Multi-field Search & Filter**: Search field filters across employee name, NIK, and department name simultaneously, paired with searchable unit dropdown.

#### Priority Issues

- **[P0] Modal Validation Errors Rendered Behind Backdrop**
  - **What**: `errorMsg` renders in root container (`page.js:491-495`). Form modal renders in `fixed inset-0 z-50` overlay (`page.js:619-620`). Form submit failure renders error invisible beneath modal backdrop.
  - **Why it matters**: User clicking "Simpan" sees zero feedback when validation fails; interface appears frozen.
  - **Fix**: Move error alert banner inside modal form above action buttons.
  - **Suggested command**: `$impeccable harden`

- **[P1] Zero Accessible Semantics on Interactive Controls**
  - **What**: Table action buttons (`Edit`, `Trash2`, lines 596-608) are icon-only without `aria-label`. Table checkboxes (lines 542, 566) lack accessible names. Form labels lack `htmlFor` / `id` bindings (lines 636, 647, 660, 670, 681).
  - **Why it matters**: Screen readers announce unlabeled buttons and checkboxes; clicking label does not focus input.
  - **Fix**: Add `aria-label="Edit jasa dasar ${row.nama_pegawai}"`, wire explicit `id` and `htmlFor` on all form fields.
  - **Suggested command**: `$impeccable audit`

- **[P1] Inappropriate Consumer-App Aesthetic ("AI-Slop" Styling)**
  - **What**: Decorative floating blur spheres (`bg-primary-600/10 blur-3xl` at lines 443, 623, 721), inverted palette classes (`from-primary-900 to-primary-800` where 900 is light sky), and bouncy `hover:scale-105 active:scale-95` on standard buttons (lines 452, 461, 468, 482, 598, 604, 704, 780).
  - **Why it matters**: Violates `DESIGN.md` Quiet Surface Rule; damages credibility in hospital financial operations.
  - **Fix**: Remove blur orbs, normalize buttons to calm hover transitions (`transition-colors`), standardize palette tokens.
  - **Suggested command**: `$impeccable quieter`

- **[P2] Missing Financial Aggregation & Remuneration Status Lifecycle**
  - **What**: Table shows raw records without aggregate KPIs (Total Pegawai Tercover, Total Anggaran Jasa Dasar/Bulan, Jumlah Data Kedaluwarsa). Column "Berakhir Berlaku" shows unstyled string `"Masih Berlaku"` without semantic status chips.
  - **Why it matters**: HR and finance committee cannot audit monthly commitments or spot expiring contracts without exporting to Excel.
  - **Fix**: Add top KPI metric cards and render semantic status chips (Active: emerald; Expiring: amber; Expired: rose).
  - **Suggested command**: `$impeccable layout`

- **[P2] Missing Date Constraint Validation**
  - **What**: Form allows selecting `berlaku_sampai` earlier than `berlaku_mulai` without blocking submission; no check for overlapping active periods per employee.
  - **Why it matters**: Produces corrupt temporal records in database, impacting payroll calculations.
  - **Fix**: Add min date constraint to `berlaku_sampai` based on `berlaku_mulai`, validate against active records.
  - **Suggested command**: `$impeccable harden`

#### Persona Red Flags

- **Alex (Power User — HR Remuneration Lead)**: Cannot sort table by nominal or expiry date; unpaginated table forces endless scrolling for 400+ staff; no batch edits for adjusting nominals across unit.
- **Jordan (First-Timer — New HR Administration Staff)**: Trapped when modal submit fails because error message renders behind backdrop; import workflow prompts file picker first, then date modal without clear explanation.
- **Sam (Accessibility-Dependent Staff — Screen Reader / Keyboard)**: Table action buttons read as empty "button"; form labels do not focus inputs; modal lacks focus trap and does not close on `Escape`.
- **Budi (Kasubbag Keuangan / Remuneration Auditor)**: Zero audit trail (no record of who changed fee, when, or SK reference); no aggregate monthly budget liability summary per hospital unit.

#### Minor Observations

- `moment.js` imported directly instead of lightweight date utility or native `Intl`.
- `XLSX` library loaded in initial client bundle instead of dynamic import on modal open.
- Table header lacks `sticky top-0`, disappearing on long lists.
- Empty search state has no "Reset Filter" action button.

#### Questions to Consider

1. Should Jasa Dasar provide hospital unit aggregation cards (Total Anggaran Jasa Dasar per Bulan, Total Pegawai Terdaftar) at the top of the dashboard?
2. Should the Excel import workflow validate salary grades and warn when nominal exceeds standard hospital brackets before writing to database?
3. What is the preferred visual tone: strictly clinical and quiet (slate/cyan per `DESIGN.md`), or retaining high-contrast visual accents?
