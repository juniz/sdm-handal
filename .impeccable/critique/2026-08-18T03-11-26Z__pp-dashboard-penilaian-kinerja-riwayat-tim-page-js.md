---
target: riwayat-tim
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-18T03-11-26Z
slug: pp-dashboard-penilaian-kinerja-riwayat-tim-page-js
---
# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|-----------|
| 1 | Visibility of System Status | 2/4 | Search debounce lacks typing feedback; error states fail silently to `console.error`; panel month change triggers full-body spinner. |
| 2 | Match System / Real World | 3/4 | Good domain terminology (*Shift Tambahan, Hari Wajib, Gap Hari*), but mixed with untranslated raw status codes (*OPEN, LOCKED, OK*). |
| 3 | User Control and Freedom | 2/4 | Nested modal-on-drawer navigation trap; no previous/next employee navigation in drawer; no URL search params for bookmarking. |
| 4 | Consistency and Standards | 2/4 | Invalid/hallucinated Tailwind classes (`text-slate-550`, `text-slate-850`, `text-rose-955`) and broken `primary-800`/`900` gradient syntax. |
| 5 | Error Prevention | 2/4 | Raw numeric input for Year allows unbounded invalid values (`-1`, `99999`); no unified period boundaries. |
| 6 | Recognition Rather Than Recall | 2/4 | Calendar status badges lack a persistent legend; modal strips employee monthly targets/gap context. |
| 7 | Flexibility and Efficiency | 2/4 | No batch review/sign-off, no export to CSV/PDF for HR payroll, no keyboard shortcuts, no quick filter for "Gap > 0". |
| 8 | Aesthetic and Minimalist Design | 2/4 | Calendar grid suffers from severe visual noise; arbitrary decorative background blurs (`blur-3xl`, `blur-2xl`) add visual clutter. |
| 9 | Error Recovery | 1/4 | API catches fail silently to console with zero user-facing error banners, alerts, or retry actions. |
| 10 | Help and Documentation | 1/4 | No tooltips or inline explanations for metrics (*Gap Hari*, *Skor Absensi* calculation, or *Rekap Status* rules). |
| **Total** | | **19/40** | **Poor (47.5%)** |

---

# Design Specificity Verdict

**LLM Assessment**:
The interface demonstrates authentic domain awareness for hospital SDM / HR performance tracking—specifically handling 3-shift rotation patterns (Pagi, Siang, Malam, Tambahan/Lembur), schedule reconciliation (`total_hari_jadwal` vs `hari_approved`), and dual appraisal metrics (`skor_kegiatan` vs `skor_absensi`). However, the interaction model falls into generic SaaS patterns: raw un-searchable department dropdowns that choke on hospital sub-unit scales, fragmented filter inputs, and an overwhelming 31-day visual grid rather than an exception-driven clinical supervisor workflow.

**Deterministic Scan**:
The bundled detector flagged 2 warnings (`gray-on-color` on lines 272 and 277). Upon AST & source inspection, both findings were verified as **false positives** caused by static regex cross-pairing of ternary template literal branches (`isRevisi ? "bg-rose-50/20 text-rose-900" : "bg-slate-50 text-slate-700"`). The actual runtime styling correctly pairs tint-on-tint and neutral-on-neutral. However, static code review uncovered multiple invalid Tailwind utility classes (`text-slate-550`, `text-slate-850`, `text-rose-955`, `hover:border-slate-350`, `shadow-2xs`) and unconfigured `primary-800`/`900` gradients that fail silently at runtime.

**Visual Overlays**:
Automated browser overlay injection was not active (headless execution). Findings are synthesized from AST inspection and static component evaluation.

---

# Overall Impression

A functional and domain-rich hospital team appraisal dashboard that is severely held back by a 3-tier nested modal navigation trap (Table → Slide-over Drawer → Center Modal Dialog), micro-typography that drops below 8px, hallucinated Tailwind utility classes, and silent API error handling.

---

# What's Working

1. **Domain-Grounded Shift & Attendance Matrix**: Directly incorporates hospital scheduling nuances (`h1..h31`), shift codes, extra shifts (`isTambahan`), and dual performance pillars.
2. **Transparent Multi-Component Scoring Breakdown**: Clear separation of *Skor Kegiatan*, *Skor Absensi*, and *Kondisi Absensi* ensures clinical auditability and objective review.
3. **Smooth Slide-Over Drawer Base**: The initial drawer slide provides excellent contextual continuity over a disruptive full-page redirect.

---

# Priority Issues

### 🔴 [P0] Invalid Tailwind Classes & Broken Gradient Tokens
- **Why it matters**: Classes like `text-slate-550`, `text-slate-850`, `text-rose-955`, `hover:border-slate-350`, `shadow-2xs`, and `from-primary-900 to-primary-800` do not exist in Tailwind and evaluate to no-ops, causing unstyled text, broken borders, and degraded contrast.
- **Fix**: Replace with standard Tailwind color and shadow tokens (`text-slate-600`, `text-slate-900`, `text-rose-700`, `border-slate-300`, `shadow-xs`, `bg-slate-900 text-white`).
- **Suggested command**: `$impeccable polish`

### 🟠 [P1] 3-Tier Modal-on-Drawer Navigation Trap
- **Why it matters**: Clicking a day inside the slide-over drawer (`z-50`) pops a centered modal (`z-[60]`). On tablets or smaller screens, this causes dual-scroll locks, viewport clipping, and high cognitive fatigue when reviewing dozens of staff members.
- **Fix**: Flatten the hierarchy: replace the floating modal with an inline expandable accordion or an integrated split-pane detail panel inside the drawer.
- **Suggested command**: `$impeccable layout`

### 🟠 [P1] Silent API Failures & Lack of Error Recovery
- **Why it matters**: Data fetch errors in `loadTeamHistory`, `loadPanelHistory`, and `viewDetail` only log to `console.error`. If a network glitch happens, the user is left with a blank or frozen UI without recovery options.
- **Fix**: Add visible alert banners with retry buttons ("Coba Lagi") and explicit empty/error state illustrations.
- **Suggested command**: `$impeccable harden`

### 🟡 [P2] Illegible Micro-Typography in Calendar Grid
- **Why it matters**: Text sizes drop to `text-[6px]`, `text-[7px]`, and `text-[8px]` to fit 4 lines of data into 60px calendar cells, violating WCAG readability standards and causing eye strain.
- **Fix**: Introduce a view switcher (**Kalender Visual** vs **Daftar Hari / List Kronologis**) and set minimum typography to 12px with intuitive status icons.
- **Suggested command**: `$impeccable typeset`

### 🟡 [P2] Fragmented Filter Controls & No URL Query State Sync
- **Why it matters**: Month, Year, Department, and Search are split across 4 separate un-synced controls. Refreshing the browser resets the view, preventing supervisors from sharing or bookmarking department audit links.
- **Fix**: Combine Month and Year into an integrated period picker, enhance Department with a searchable combobox, and sync state to Next.js `useSearchParams`.
- **Suggested command**: `$impeccable clarify`

---

# Persona Red Flags

- **Ns. Hendra (Head Nurse / Supervisor — Power User)**: Must review 30 nurses before payroll cutoff. Reviewing each nurse requires opening the drawer, clicking a calendar cell to pop a modal, closing the modal, closing the drawer, and scrolling to the next nurse—over 120 clicks with zero keyboard navigation or "Next Staff" shortcut.
- **Siti (First-Time Assessor / HR Staff)**: Struggles to distinguish between "KOSONG", "OFF", and "DRAF" days because the calendar lacks a persistent legend and metric explanations.
- **Dr. Rian (Department Head on iPad / Mobile)**: Inspecting team logs during hospital rounds encounters clipped modal dialogs, double-scrolling, and obscured action buttons behind mobile browser bars.

---

# Minor Observations

1. **Hardcoded Year in Month Formatting**: Line 410 uses `moment('2026-${val}-01')` rather than the active `teamYear` state.
2. **Debounce Lag on Dropdowns**: The 300ms debounce wraps discrete `<select>` elements where immediate dispatch is expected.
3. **Pulsing Animation Distraction**: Constant `animate-pulse` on `PENDING` chips in the 31-day grid causes unnecessary visual movement.
4. **Unbounded Year Input**: Number input allows arbitrary values (`-1`, `99999`) without min/max constraints.

---

# Questions to Consider

1. *What if supervisors had an "Exception Queue" tab that surfaces all staff with `Gap Hari > 0` or `PENDING/REVISI` status, cutting review time by 80%?*
2. *Can the Table $\rightarrow$ Drawer $\rightarrow$ Modal hierarchy be transformed into a unified Master-Detail split view with Next/Prev employee keyboard shortcuts?*
3. *How should the system clarify payroll lock deadlines to prevent premature closing before revisions are completed?*
