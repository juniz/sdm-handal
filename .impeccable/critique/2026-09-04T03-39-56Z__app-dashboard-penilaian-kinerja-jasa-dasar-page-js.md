---
target: /dashboard/penilaian-kinerja/jasa-dasar
total_score: 38
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-04T03-39-56Z
slug: app-dashboard-penilaian-kinerja-jasa-dasar-page-js
---
Method: dual-agent (A: cdeb0fb7-305d-4714-b249-5463e21986dc · B: 0776c105-fbf9-4c52-9fd9-bcedcf0fa42b)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4 | Real-time Rupiah preview badge while typing nominal; loading spinner on fetch/save/bulk-delete; active/expired status badges. |
| 2 | Match System / Real World | 4 | Natural hospital HR terminology (NIK, Departemen, Jasa Dasar, Tanggal Berlaku); standard Indonesian Rupiah formatting (`Rp X.XXX.XXX`). |
| 3 | User Control and Freedom | 4 | ESC key & backdrop dismiss on all modals; dismissible alert banners with `<X />`; cancellation confirmation on single & bulk deletes. |
| 4 | Consistency and Standards | 4 | Cohesive typography (Figtree/Noto Sans), standard border radii (12px/16px), unified icon set (`lucide-react`), consistent form input styling. |
| 5 | Error Prevention | 4 | Live Rupiah badge eliminates zero-counting errors; `min={berlakuMulai}` prevents inverted date ranges; disabled employee select in edit mode. |
| 6 | Recognition Rather Than Recall | 4 | Employee selector displays full name + NIK + Department; table displays active/expired status badges; Excel template pre-fills active hospital staff. |
| 7 | Flexibility and Efficiency | 3 | Batch Excel import, bulk select/delete, instant search + unit filter; lacks table pagination for 300+ staff rosters. |
| 8 | Aesthetic and Minimalist Design | 4 | Clean white cards against neutral canvas (`border-slate-200/80`); sticky table header with subtle backdrop blur; no decorative clutter. |
| 9 | Error Recovery | 4 | In-modal alert for validation failures; background errors suppressed when modals active; detailed line-by-line Excel validation failure messages. |
| 10 | Help and Documentation | 3 | Explanatory banner in import modal; informative subtitle and field placeholders; lacks inline formula guidance for monthly recap calculation. |
| **Total** | | **38/40** | **Excellent (36–40)** |

#### Design Specificity Verdict

- **LLM assessment**: Strongly Grounded (Authentic Hospital System). Implementation strictly aligned with SDM Handal Design System (`DESIGN.md`) and clinical HR workflows. Visual grammar follows "Pusat Layanan SDM Tepercaya": Figtree for operational hierarchy, Noto Sans for body copy, clinical cyan/sky palette (`sky-600`, `sky-50`, `slate-900`) avoiding generic templates or saturated gradient slop. Pre-filled Excel template generation directly sorts active hospital employees by department and NIK. Tabular numerals with standard Indonesian Rupiah currency formatting (`id-ID`) and status pills ("Aktif" / "Kedaluwarsa") map 1:1 to hospital payroll ledger conventions.
- **Deterministic scan**: CLI detector returned 0 findings on `page.js`. Component dependency check on `confirmation-dialog.jsx` flagged 1 finding (`gray-on-color` at line 26: `text-slate-800 on bg-amber-500`), which is an inert path as `page.js` exclusively uses `primary` and `danger` variants.
- **Visual overlays**: Skipped. No browser automation tool exposed in runtime environment. Fallback: static AST & regex source analysis.

#### Overall Impression

Production-grade, highly polished clinical HR dashboard. All primary usability barriers, contrast issues, and cognitive friction points eliminated. Score rose from 21/40 to 38/40. Interface exhibits crisp hierarchy, error prevention, full keyboard accessibility, and authentic hospital operational grounding.

#### What's Working

1. **Live Rupiah Preview Badge**: Real-time Indonesian currency formatting badge right next to nominal input label (`Rp 3.000.000`) provides instant visual validation, eliminating common missing/extra zero errors during financial data entry.
2. **Enterprise ARIA Dialog Semantics & Cyclic Focus Trapping**: Modals implement `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, ESC dismiss, backdrop dismiss, and cyclic Tab/Shift+Tab trapping, ensuring accessible keyboard interaction.
3. **Smart Pre-populated Excel Generator & Validation**: Template auto-fills live hospital roster sorted by unit, paired with robust line-by-line validation and explicit deletion confirmation dialogs.

#### Priority Issues

- **[P2] Long Roster Pagination**
  - **What**: Table renders all records in a single unpaginated DOM list.
  - **Why it matters**: RS Bhayangkara Nganjuk has hundreds of employees. Unpaginated rendering causes long scroll fatigue on smaller screens.
  - **Fix**: Add client-side pagination (25/50/100 items per page) with page navigation controls.
  - **Suggested command**: `$impeccable layout pagination`

- **[P2] Excel Import Validation Dialog Retention**
  - **What**: On Excel parsing error, import modal closes and displays error banner on background page.
  - **Why it matters**: Closes user context prematurely when inspecting which rows failed while wanting to re-upload.
  - **Fix**: Keep import modal open and render validation error list inside modal dialog.
  - **Suggested command**: `$impeccable harden import-error-handling`

- **[P3] Screen Reader Live Region for Currency Badge**
  - **What**: Nominal live badge does not include `aria-live="polite"`.
  - **Why it matters**: Visual users see formatted currency immediately; screen readers only hear raw numeric input.
  - **Fix**: Add `aria-live="polite"` to preview badge container.
  - **Suggested command**: `$impeccable audit a11y-live-region`

#### Persona Red Flags

- **Alex (Power / Keyboard User)**: Modal cycling and ESC work as expected. Lacks table-level keyboard row navigation or fast page hopping for large datasets.
- **Jordan (First-Timer / Junior HR Staff)**: Protected from payroll data-entry blunders by live Rupiah badge, date constraints, and clear alert messaging.
- **Sam (Accessibility-Dependent User)**: ARIA dialog, modal labelling, and table action labels are fully intact. Adding `aria-live="polite"` to currency badge will give complete parity.
- **Hospital Staff (Admin / Keuangan RS)**: High satisfaction with pre-filled template matching hospital departmental hierarchy.

#### Minor Observations

- Checkbox "Select All" correctly resets when search query or department filter changes, preventing accidental bulk deletion of off-screen items.
- Alert dismiss buttons `<X />` are properly accessible with `aria-label` and smooth transitions.
- Background duplicate alert suppression (`errorMsg && !isModalOpen`) ensures clean visual focus during modal interactions.

#### Questions to Consider

1. Should there be an automated unit-wide percentage adjustment action (e.g. "+5% Jasa Dasar for Unit IGD") to handle annual hospital remuneration updates without requiring Excel export/import round-trips?
2. Should expired configurations ("Kedaluwarsa") be tucked behind an active/all filter toggle by default to keep daily operational tables uncluttered?
