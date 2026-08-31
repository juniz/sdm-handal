---
target: development
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-31T02-50-27Z
slug: src-app-dashboard-development-page-js
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|:---:|---|
| 1 | Visibility of System Status | 2 | Async state relies on blocking browser `window.alert()`; search label flickers `(menunggu...)`; raw debug container rendered in UI |
| 2 | Match System / Real World | 3 | Good Indonesian hospital vocabulary (`Modul IT`, `Departemen`), but lifecycle statuses mix English (`In Testing`, `UAT`, `In Deployment`) and Indonesian |
| 3 | User Control and Freedom | 2 | Progress slider strictly irreversible; delete action stubbed (`onDelete={null}`); modal lacks draft recovery |
| 4 | Consistency and Standards | 1 | Violates `DESIGN.md` clinical cyan tokens (`brand-cyan: #0284C7`); mixes default Tailwind `blue-600` and legacy Bootstrap hex codes |
| 5 | Error Prevention | 2 | Minimum character constraints (10 chars title, 50 chars desc) fail on submit instead of live inline assistive counters |
| 6 | Recognition Rather Than Recall | 2 | 12 technical development lifecycle stages require deep IT domain knowledge for hospital ward nurses and non-IT staff |
| 7 | Flexibility and Efficiency | 2 | No quick filter presets ("My Requests", "Needs IT Action"); no batch approval actions for IT department heads |
| 8 | Aesthetic and Minimalist Design | 2 | 6 competing stat cards at top; stacked redundant progress indicators; debug DOM state leaks |
| 9 | Error Recovery | 2 | Clear in-form validation errors, but async server errors trigger raw alert popups |
| 10 | Help and Documentation | 2 | Modal has "Informasi Penting" box, but complex technical status stages lack contextual tooltips |
| **Total** | | **20/40** | **Acceptable (50%)** |

#### Design Specificity Verdict

**LLM assessment**: Target surface behaves as generic SaaS ticket tracker rather than bespoke hospital IT operations module. Visual token implementation diverges from `DESIGN.md` clinical cyan specification, relying on default Tailwind `blue-600` and raw legacy Bootstrap hex badges. Interaction relies on blocking browser `window.alert()` dialogs rather than structured clinical application notifications.

**Deterministic scan**: Detector reported 2 raw findings on `src/components/development/LogViewer.jsx:69` for `gray-on-color`. Manual verification confirmed both are false positives caused by static regex parsing of ternary expressions (`selectedType === type ? ... : ...`) where active state renders white text on `bg-sky-600` and inactive state renders gray text on parent `bg-gray-950`.

**Visual overlays**: No live overlay injected. Target surface `/dashboard/development` requires authenticated session cookie (HTTP 307 redirect to `/login`).

#### Overall Impression
Functional and complete end-to-end lifecycle tracking from nurse request to developer assignment and audit trail, but visually fragmented by non-compliant color tokens, high cognitive load from 6 competing stat cards and 12 lifecycle stages, blocking alert dialogs, and a leaked debug UI container.

#### What's Working
1. **End-to-End Governance & Audit Trail**: Comprehensive pipeline covering employee submission, IT supervisor approval, developer assignment with estimated hours, percentage tracking, and dedicated `Riwayat` / `Komentar` audit tabs.
2. **Responsive Adaptations**: Mobile accordion collapse for top metrics, collapsible filter drawer, and flex-wrapping layout adjustments.
3. **Structured Tab Chunking**: Clean tabbed layout on detail page (`Detail`, `Komentar`, `Lampiran`, `Riwayat`) keeps supplementary data organized.

#### Priority Issues

- **[P0] Leaked Debug Container in Production DOM**
  - **Why it matters**: `ProgressTracker.jsx` (lines 230–271) renders a bright yellow debug card dumping raw JSON user session objects, NIK, permissions, and internal state variables when user cannot update progress. Exposes internal database schema and employee identifiers.
  - **Fix**: Remove debug container completely or gate strictly behind `process.env.NODE_ENV === "development"`.
  - **Suggested command**: `$impeccable polish src/components/development/ProgressTracker.jsx`

- **[P1] Design System & Color Token Non-Compliance**
  - **Why it matters**: Violates `DESIGN.md` clinical cyan system (`brand-cyan: #0284C7`, `active-cyan: #0EA5E9`, `primary-sky: #E0F2FE`). Relies on default Tailwind `blue-600` and hardcoded legacy Bootstrap hex codes (`#28a745`, `#007bff`, `#6f42c1`), causing visual mismatch with rest of SDM Handal.
  - **Fix**: Refactor status badges, priority chips, and action buttons into unified SDM tokens with guaranteed WCAG AA contrast.
  - **Suggested command**: `$impeccable colorize src/app/dashboard/development/page.js`

- **[P2] Disruptive Native `window.alert()` Dialogs**
  - **Why it matters**: Submissions, approvals, assignments, and API error states trigger synchronous blocking browser alert popups, degrading user experience and breaking mobile web accessibility.
  - **Fix**: Replace native alerts with non-blocking Sonner/Radix toast notifications and inline banner feedback.
  - **Suggested command**: `$impeccable adapt src/app/dashboard/development`

- **[P3] Redundant Administrative Panels & Progress Gauges**
  - **Why it matters**: On detail page (`[id]/page.js`), `ApprovalPanel`, `AssignmentPanel`, and `ProgressTracker` stack vertically above tabs, rendering two separate progress meters and pushing core request content below fold.
  - **Fix**: Consolidate approval and assignment into a unified IT Action Bar; combine progress indicators into single header gauge.
  - **Suggested command**: `$impeccable clarify src/app/dashboard/development/[id]/page.js`

#### Persona Red Flags

- **Jordan (First-Timer / Ward Nurse)**: Blocked by 50-character minimum description without guidance or issue templates; confused by developer lifecycle jargon (`UAT`, `In Deployment`, `In Testing`).
- **Alex (Power User / IT Department Head)**: Forced to open requests individually with no batch approval or quick inline status transitions; intrusive `alert()` dialogs slow operational throughput.
- **Sam (Accessibility-Dependent / Keyboard User)**: Custom slider in `ProgressTracker` lacks ARIA labels; form validation relies on blocking alerts rather than `aria-live` accessible error messages.

#### Minor Observations
- **Fragile Date Parsing**: `RequestCard.js` (lines 78–94) and `[id]/page.js` (lines 293–309) use regex string matching for Indonesian month names (`dateString.includes("Januari")`) rather than standard `Intl.DateTimeFormat`.
- **Search Label DOM Flicker**: Search input displays `(menunggu...)` label text during 500ms debounce instead of subtle inline spinner.
- **Stubbed Actions**: `onDelete` is hardcoded as `null` in `page.js:613`.
- **Unused Component**: `LogViewer.jsx` is defined in `src/components/development/` but never imported or used.

#### Questions to Consider
- *Should medical staff see technical dev stages (`In Testing`, `UAT`, `In Deployment`) or a simplified 4-stage operational view (`Diajukan` $\rightarrow$ `Disetujui` $\rightarrow$ `Dalam Pengerjaan` $\rightarrow$ `Selesai`) with technical sub-states visible only to IT?*
- *Why is progress strictly irreversible in `ProgressTracker` when real software implementations often encounter blockers requiring adjustment?*
- *Could request creation form provide presets (e.g., "SIMRS Bug", "Laporan Baru", "Hardware/Jaringan") to remove blank-canvas friction for hospital employees?*
