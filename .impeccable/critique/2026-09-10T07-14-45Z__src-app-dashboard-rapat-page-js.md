---
target: src/app/dashboard/rapat/page.js
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-10T07-14-45Z
slug: src-app-dashboard-rapat-page-js
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 3 | Real-time toast feedback present; `LoadingSkeleton` still renders legacy 3-column card grid causing CLS. |
| 2 | Match Between System and Real World | 4 | Authentic Indonesian hospital administrative terminology (*Presensi*, *Rapat Komite*, *KOP Surat*). |
| 3 | User Control and Freedom | 3 | Smooth modal dismissal via `Escape` and backdrop clicks; quick `Reset Pencarian` button. |
| 4 | Consistency and Standards | 2 | Legacy token drift in `DuplicateRapatModal` (`blue-*` instead of `sky-*`) and `Toast.js`. |
| 5 | Error Prevention | 3 | Form validation prevents empty signature and short strings; unescaped regex in `highlightText` risk on special characters. |
| 6 | Recognition Rather Than Recall | 3 | Active meeting chips in `RapatModal` prevent recall burden and title fragmentation. |
| 7 | Flexibility and Efficiency | 2 | No keyboard accelerators for batch entry; IT reordering requires individual clicks per row. |
| 8 | Aesthetic and Minimalist Design | 3 | Session containers and dense tables are clean; permanent inline reorder inputs add slight visual clutter for IT. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3 | Specific inline field validation messages in form; clear recovery instructions. |
| 10 | Help and Documentation | 2 | Missing contextual tooltips for signature requirements and IT duplication workflow. |
| **Total** | | **28/40** | **Good (Solid foundation; targeted refinements needed)** |

---

## Design Specificity Verdict

- **LLM Assessment**: Greatly improved operational grounding. Session grouping ([RapatSessionGroup.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/rapat/components/RapatSessionGroup.js)) transforms 50-card wall into disciplined hospital attendance rosters with official police hospital letterhead export. Still has minor legacy bleed: `DuplicateRapatModal.js` retains generic Tailwind `blue-*` classes, and `LoadingSkeleton.js` still renders obsolete card grid.
- **Deterministic Scan**: 1 warning detected across 18 scanned files.
  - `pdfGenerator.js:381`: `overused-font` Arial (False positive: institutional print template for police hospital physical attendance sheets).
  - True positives: 0 in automated detector. Manual inspection identified 1 functional defect: `SignatureImage` prop mismatch (`signatureData` vs `base64Data`), causing signature modal to display empty.
- **Visual Overlays**: Skipped. Browser automation tool unavailable in environment. Static AST analysis and manual code verification executed.

---

## Overall Impression

Major leap in usability and visual discipline. Mental model now correctly reflects hospital meeting sessions with dense tabular attendee rosters. Core actions elevated to top header, filters reactive and instant. Remaining tasks: fix signature modal prop mismatch, align skeleton to table layout, and update legacy modal tokens.

---

## What's Working

1. **Grouped Session Architecture**: Consolidating attendance by meeting session eliminates cognitive overload and provides instant session-level PDF generation.
2. **Context-Aware Meeting Autocomplete**: Active meeting suggestion chips prevent typo fragmentation across hospital wards.
3. **Accessible Delete Rails**: `ConfirmDeleteModal` provides safe deletion confirmation with explicit attendee naming, focus trap, and Escape key dismissal.

---

## Priority Issues

### [P1] Signature Preview Prop Mismatch (Functional Defect)
- **What**: In `RapatSessionGroup.js:274`, `<SignatureImage signatureData={activeSignature.tanda_tangan} />` is passed, but `SignatureImage.js` expects `base64Data`.
- **Why it matters**: Clicking "Tersedia" opens an empty modal without signature image, breaking supervisor verification.
- **Fix**: Update `SignatureImage.js` to accept either `base64Data` or `signatureData` and forward `className`.
- **Suggested command**: `$impeccable harden rapat`

### [P1] Loading Skeleton Layout Shift (CLS)
- **What**: `LoadingSkeleton.js` still renders a 3-column card grid from prior design.
- **Why it matters**: Causes jarring Cumulative Layout Shift on page load before session tables mount.
- **Fix**: Refactor `LoadingSkeleton.js` to display simulated session table skeleton.
- **Suggested command**: `$impeccable layout rapat`

### [P2] Legacy Token Drift in Duplicate Modal & Toast
- **What**: `DuplicateRapatModal.js` contains residual `blue-500` / `blue-600` styling; `Toast.js` uses raw green/red.
- **Why it matters**: Minor dilution of `DESIGN.md` clinical cyan / slate palette.
- **Fix**: Align classes with design tokens (`sky-*`, `slate-*`).
- **Suggested command**: `$impeccable colorize rapat`

### [P2] Unescaped Regex in Search Highlighting
- **What**: `highlightText` constructs `new RegExp` directly from user input without escaping regex special characters.
- **Why it matters**: Queries with parentheses (e.g. `Poli (Dalam)`) throw uncaught syntax error.
- **Fix**: Sanitize search term with regex escape utility before compiling RegExp.
- **Suggested command**: `$impeccable harden rapat`

### [P3] Inline Table Reorder Density for IT Users
- **What**: Reorder numeric input and chevrons appear on every single row simultaneously.
- **Why it matters**: Adds visual vibration to table view when only viewing records.
- **Fix**: Add "Atur Urutan" toggle or reveal controls on hover/focus.
- **Suggested command**: `$impeccable distill rapat`

---

## Persona Red Flags

- **Alex (Power User: IT Admin)**: Reordering long lists requires individual numeric clicks; would benefit from rapid-entry mode where modal stays open for next attendee.
- **Jordan (First-Timer: Hospital Staff)**: `DuplicateRapatModal` only searches attendee names instead of meeting titles.
- **Sam (Accessibility User)**: Signature canvas lacks keyboard-operated alternative; chevron icon buttons have small touch targets (`w-3 h-3`).

---

## Minor Observations

- Dead code files: `RapatCard.js` is no longer used by `page.js`.
- Safari date picker styling: native date picker width can be tight on older Safari versions.
