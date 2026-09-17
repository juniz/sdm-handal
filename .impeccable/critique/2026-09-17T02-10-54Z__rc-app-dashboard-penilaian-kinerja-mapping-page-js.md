---
target: /dashboard/penilaian-kinerja/mapping
total_score: 13
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 1
timestamp: 2026-09-17T02-10-54Z
slug: rc-app-dashboard-penilaian-kinerja-mapping-page-js
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Power toggle mutates state instantly without row spinner; selecting unit lacks live affected headcount; search filter lacks result counters. |
| 2 | Match System / Real World | 1 | Exposes raw database keys (`tipe_relasi`, `tipe_unit`, `kode_unit`) instead of clinical operational terms (*Unit Kerja*, *Kepala Ruang*, *Staf Bawahan*); no roster preview. |
| 3 | User Control and Freedom | 2 | Instant status toggle has zero confirmation dialog; edit modal locks unit/employee fields forcing delete-and-recreate. |
| 4 | Consistency and Standards | 1 | Decorative blur orbs (`blur-3xl`) violate `DESIGN.md`; modal mixes native HTML `<select>` with Radix Popover `<SearchableSelect>`. |
| 5 | Error Prevention | 1 | Date range accepts inverted dates (`berlaku_sampai < berlaku_mulai`); allows unit evaluator to evaluate themselves; zero collision/duplicate checks. |
| 6 | Recognition Rather Than Recall | 1 | Unit codes show raw acronyms without department names; admin must memorize hospital roster to verify who reports to whom. |
| 7 | Flexibility and Efficiency | 1 | No bulk operations for annual staff rotations; no hierarchy or unit filtering; search is text-only. |
| 8 | Aesthetic and Minimalist Design | 2 | Heavy gradient banner and decorative blur orbs consume ~180px vertical space, pushing operational clinical data below fold on standard 1366x768 screens. |
| 9 | Error Recovery | 1 | Form submission errors (`errorMsg`) render on root page behind modal backdrop (`page.js:286`). User sees zero feedback inside open modal when save fails. |
| 10 | Help and Documentation | 1 | Zero inline guidance explaining auto-approval mechanics, calendar vs shift day calculations, or precedence between personal and unit mappings. |
| **Total** | | **13/40** | **Critical Deficiency (<20) — High Operational Risk** |

#### Design Specificity Verdict

**Verdict: Severe Abstraction Mismatch (Generic Foreign-Key CRUD vs Clinical Matrix Hierarchy).**

- **LLM Assessment**: The interface treats hospital clinical supervisory governance as flat database foreign-key CRUD. Assigning a supervisor to a clinical unit (`departemen` or `bidang`) renders only raw acronyms (`IGD`, `KPR`) with zero subordinate headcount preview and zero coverage validation. Overlapping assignments produce no conflict warnings, and the system offers no indicator for unmapped or orphaned staff. Clinical procedure auto-approval is implemented as a naked integer input ("3 Hari") without clinical audit disclaimers or hospital accreditation safeguards.
- **Deterministic Scan**: Detector flagged **17 issues**:
  - `design-system-font-size` (16 findings): Micro-scale text (`text-[10px]`, `text-[9px]`) across table headers, status badges, and modal labels (`page.js:325, 341, 354, 435, 467, 523, 572...`).
  - `gray-on-color` (1 finding): Flagged `text-slate-400` with `hover:bg-red-50` in delete button (`page.js:404`); identified as false positive on Tailwind hover pseudo-class.
- **Visual Overlays**: Headless static AST scan verified.

#### Overall Impression

Dangerous disconnect between raw database tables and clinical hospital reality. Fatal UX flaws—specifically form errors trapped behind modal backdrops and single-click deactivation of entire department hierarchies—introduce high daily operational risk for hospital payroll and appraisal workflows.

#### What's Working

1. **Contextual Dropdown Metadata (`SearchableSelect`)**: Employee options display name, NIK, and department sublabel, preventing confusion between identically named hospital staff.
2. **Dual-Tier Mapping Model**: Supporting both macro unit mappings and individual overrides accommodates complex hospital staffing patterns.
3. **Tabular Typography Foundations**: Clean Figtree/Noto Sans typography baseline with restrained vertical rhythm.

#### Priority Issues

- **[P0] Modal Submission Error Rendered Behind Backdrop**
  - *Why it matters*: Submitting invalid form data writes errors to `errorMsg` on base page (`page.js:286`), completely hidden behind modal overlay (`page.js:420`). User clicks repeatedly thinking app crashed.
  - *Fix*: Embed inline alert message and field error borders directly inside modal dialog.
  - *Suggested command*: `$impeccable polish src/app/dashboard/penilaian-kinerja/mapping/page.js`

- **[P0] Destructive Instant Status Toggle Without Safety Confirmation**
  - *Why it matters*: Clicking Power button (`page.js:384-394`) immediately mutates `is_aktif` via PUT request. Accidental click instantly deactivates entire department's supervisory appraisal chain.
  - *Fix*: Require confirmation dialog stating affected subordinate headcount before deactivation, or provide immediate undo toast.
  - *Suggested command*: `$impeccable harden src/app/dashboard/penilaian-kinerja/mapping/page.js`

- **[P1] Blind Unit Mapping Lacking Subordinate Preview & Orphan Detection**
  - *Why it matters*: Unit mapping displays raw unit code without member count or staff list. Admins have no way to verify roster coverage or catch unmapped employees.
  - *Fix*: Add live subordinate headcount badge, expandable covered employee preview, and top-level unmapped employee metric card.
  - *Suggested command*: `$impeccable shape src/app/dashboard/penilaian-kinerja/mapping/page.js`

- **[P2] Uncontrolled Clinical Auto-Approval Without Governance Guardrails**
  - *Why it matters*: Raw numeric input allows arbitrary auto-approval without policy bounds, threatening clinical accreditation standards.
  - *Fix*: Enforce hospital policy bounds (3–14 days), contextual warnings for clinical care units, and audit trail flags.
  - *Suggested command*: `$impeccable clarify src/app/dashboard/penilaian-kinerja/mapping/page.js`

- **[P3] Design Token Violations & AI-Slop Orbs**
  - *Why it matters*: Massive radial blur orbs (`blur-3xl`) and heavy gradient banner consume ~180px vertical space, pushing operational data below fold.
  - *Fix*: Strip blur blobs and replace with quiet hospital card header following `DESIGN.md` tokens.
  - *Suggested command*: `$impeccable distill src/app/dashboard/penilaian-kinerja/mapping/page.js`

#### Persona Red Flags

- **Alex (HR Specialist)**: No "Unmapped Staff" filter. Alex must cross-reference 300 flat table rows against hospital roster in Excel to find employees missing supervisors.
- **Jordan (Head Nurse)**: Receives non-nursing personnel in approval queue because unit mapping blindly assigned whole department code without profession filtering.
- **Morgan (Hospital Director / Auditor)**: No audit trail showing who enabled auto-approval or what percentage of clinical evaluations bypassed human verification.

#### Minor Observations

- `handleDelete` relies on unstyled native `window.confirm()`.
- Search bar lacks keyboard shortcut (`/`) and clear query button (`X`).
- Table empty state is unstyled text with no action to reset filter or create mapping.
- Date picker allows end date earlier than start date without validation.

#### Questions to Consider

- Should supervisor mapping be structured as a two-column Master-Detail matrix (Hospital Units on left, Supervisor & Active Roster on right)?
- Why is Auto-Approval configured per individual mapping rather than through centralized hospital-wide governance?
- How should temporary Acting Supervisors (Plt./Pj.) be assigned during maternity or medical leave without deleting historical mappings?
