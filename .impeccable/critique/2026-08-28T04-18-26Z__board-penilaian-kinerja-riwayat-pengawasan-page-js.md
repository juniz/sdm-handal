---
target: src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-28T04-18-26Z
slug: board-penilaian-kinerja-riwayat-pengawasan-page-js
---
Method: dual-agent (A: 9300123f-7a09-4185-a240-19ea1907a069 · B: aced2ad1-9c20-4e37-89e6-e34f239f4123)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 3/4 | Loading spinners present; lacks search debounce indicator and drawer cache feedback |
| 2 | Match System / Real World | 4/4 | High fidelity hospital domain language (`Wajib Kerja`, `Gap Hari`, `Shift Tambahan`, `Status Rekap`) |
| 3 | User Control and Freedom | 3/4 | Reset filter available; lacks `Escape` key dismiss on drawer and modal |
| 4 | Consistency and Standards | 2/4 | Severe color token mismatch (`bg-primary-900` mixed with `text-slate-900`); mixed typography weights |
| 5 | Error Prevention | 3/4 | Clean dropdown filters; drawer month/year can desync from main table view without alert |
| 6 | Recognition Rather Than Recall | 3/4 | Status badges color-coded; shift codes (`P`, `S`, `M`) lack on-screen legend |
| 7 | Flexibility and Efficiency | 2/4 | No keyboard shortcuts, batch actions, quick anomaly filter presets, or 1-click export |
| 8 | Aesthetic and Minimalist Design | 2/4 | 13 unpinned columns create horizontal sprawl; metric overload on table rows |
| 9 | Error Recovery | 3/4 | Error alert visible on API failure; lacks direct retry button |
| 10 | Help and Documentation | 2/4 | Page subtitle clear; zero contextual tooltips for audit formulas (`Compliance %`, `Gap Hari`) |
| **Total** | | **27/40** | **Acceptable (67.5%)** |

### Design Specificity Verdict

- **LLM Assessment**: Highly tailored for hospital SDM/SPI operational realities (shift rosters, multi-tier supervisor approvals, gap calculation, rekap locks). Fails on execution craft: dark token header clashes, 13-column unpinned table sprawl, and stacked modal-over-drawer navigation.
- **Deterministic Scan**: 8 files scanned (`page.js` + 7 components). 2 raw warnings reported by static analyzer in `AuditCalendarGrid.jsx` (`gray-on-color`), verified as 100% false positives caused by ternary styling branches (`isRevisi ? ... : ...`). Net real deterministic defects: 0.
- **Visual Overlays**: Skipped. Interactive browser automation tool unavailable in environment.

### Overall Impression
Solid domain-specific foundation for hospital performance auditing, but usability is held back by horizontal table sprawl, token contrast bugs in headers, and modal stacking friction.

### What's Working
1. **Accurate Hospital Shift & Audit Modeling**: Integrates work shifts (`P`/`S`/`M`/`OFF`), attendance scores, and daily task verification.
2. **Automated Anomaly & Gap Detection**: Proactively computes `gap_hari` and compliance rates without manual counting.
3. **Structured 3-Tier Drilldown**: Smooth navigation flow from macro institutional metrics down to daily staff tasks.

### Priority Issues

#### [P1] Header Contrast & Color Token Defects
- **What**: Header components (`AuditHeader.jsx`, `AuditDetailDrawer.jsx`, `AuditActivityModal.jsx`) mix `bg-primary-900` with `text-slate-900` / `text-slate-600`.
- **Why it matters**: Severe WCAG text contrast failure causing illegible dark-on-dark text.
- **Fix**: Standardize to clean white surface (`bg-white border-slate-200 text-slate-900`) or true dark palette (`text-white text-primary-100`).
- **Suggested command**: `$impeccable polish`

#### [P1] 13-Column Table Sprawl & Unpinned Employee Identity
- **What**: Table spans 13 columns without sticky pinning for NIK and Employee Name.
- **Why it matters**: Horizontal scrolling on laptop screens hides employee identity when reviewing status, gap count, and action buttons.
- **Fix**: Make `NIK` and `Nama Pegawai` sticky on left (`sticky left-0 bg-white shadow-sm`), collapse individual day counters into a visual progress mini-bar, and highlight `Gap Hari > 0` with alert badge.
- **Suggested command**: `$impeccable layout`

#### [P2] Modal Stacking & Missing Keyboard Exit Affordances
- **What**: Clicking a calendar day in the drawer opens a modal on top of the slide-over drawer (`z-50` layered). Neither supports `Esc` key dismiss.
- **Why it matters**: Traps keyboard users; high interaction friction when auditing multiple days in succession.
- **Fix**: Add global `Escape` key listener and embed daily activity inspection inline inside drawer below calendar.
- **Suggested command**: `$impeccable harden`

#### [P2] Missing SPI Audit Export & Quick Action Filters
- **What**: No export to Excel/CSV/PDF and no quick filter presets for non-compliant staff (`Gap Hari > 0`).
- **Why it matters**: Hospital audit workflows require formal compliance exports and instant triage of lagging units.
- **Fix**: Add 1-click "Export Rekap" button and quick filter chips ("Semua", "Perlu Audit (Gap > 0)", "Status Draft").
- **Suggested command**: `$impeccable bolder`

### Persona Red Flags

- **Alex (Power User / SDM Auditor)**: Must click 30+ times across nested dialogs to inspect 10 employees. No keyboard shortcuts to cycle rows. No batch export.
- **Sam (Accessibility-Dependent User)**: Calendar day grid cells are non-semantic `<div>` elements without `role="button"`, `tabIndex`, or keyboard focus rings. Severe contrast drops in headers.
- **Jordan (First-Timer / Junior Supervisor)**: Unclear distinction between `Kosong` vs `Gap Hari`. Shift codes (`P`, `S`, `M`) lack hover legends or tooltip definitions.

### Minor Observations
- Hardcoded `YEARS` constant duplicated across 3 component files.
- Error state lacks a direct "Coba Lagi" (Retry) action button.
- Calendar drawer lacks empty-state feedback when no shift schedule is configured.

### Questions to Consider
- *What if table day columns were condensed into an interactive status progress bar that expands on hover?*
- *Why stack a modal over a slide-over drawer when daily activity output can expand inline beneath the calendar?*
- *Could an executive "Unduh Laporan Audit SPI" action be pinned directly in the header?*
