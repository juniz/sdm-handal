---
target: src/app/dashboard/rapat/page.js
total_score: 16
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-09-10T06-56-52Z
slug: src-app-dashboard-rapat-page-js
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Split filter state (`searchDate` vs `filterDate`); requires manual search trigger button. |
| 2 | Match System / Real World | 1 | Entity mismatch. "Rapat" stores individual attendance signatures, not meeting sessions. |
| 3 | User Control and Freedom | 2 | No delete undo; native `window.confirm` popup; signature canvas lacks stroke-by-stroke undo. |
| 4 | Consistency and Standards | 1 | Ignores `DESIGN.md` tokens; uses arbitrary Tailwind rainbow colors; hides primary CTA in filter. |
| 5 | Error Prevention | 2 | Out-of-bounds urutan numbers allowed; no duplicate attendance detection for same attendee. |
| 6 | Recognition Rather Than Recall | 2 | Meeting title is free text input; forces users to remember exact spelling across attendees. |
| 7 | Flexibility and Efficiency | 1 | No bulk attendee entry; no keyboard navigation or batch reorder actions. |
| 8 | Aesthetic and Minimalist Design | 2 | Cluttered card layout; numeric inputs and chevron buttons compete with meeting metadata. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 2 | Vague toast errors ("Terjadi kesalahan"); form validation focuses only on date. |
| 10 | Help and Documentation | 1 | Zero contextual guidance for signature requirements, duplicate feature, or export rules. |
| **Total** | | **16/40** | **Poor (Core UX overhaul needed)** |

---

## Design Specificity Verdict

- **LLM Assessment**: Severe mental model breakdown. Interface claims to manage "Daftar Rapat" (Meeting List), but treats each attendee signature as standalone meeting card. 25 attendees produce 25 identical cards in 3-column masonry grid. Zero clinical or hospital context for RS Bhayangkara Nganjuk (no room/venue, agenda, notulen minutes, attendance status, or session lifecycle). Deviates completely from `DESIGN.md` clinical cyan tokens, using default Tailwind blues, purples, greens, and yellows.
- **Deterministic Scan**: 2 warnings detected by `detect.mjs` across scanned files.
  - `page.js:326`: `border-accent-on-rounded` (False positive: standard loading spinner).
  - `pdfGenerator.js:381`: `overused-font` Arial (False positive: html2pdf print template for official PDF export).
  - True positives from automated detector: 0. Manual code inspection identified real issues: missing ARIA attributes, missing `aria-label` on icon-only buttons, unhandled keyboard accessibility on canvas, and low text contrast (`text-gray-400`/`text-gray-500`).
- **Visual Overlays**: Skipped. Browser automation tool unavailable in environment; Next.js dev server active on `localhost:3000`.

---

## Overall Impression

Functional attendance-signing tool trapped inside broken meeting-card metaphor. Good PDF generator and signature data handling, but information architecture is inverted: attendees are not grouped by meeting session, primary actions are hidden inside collapsible filter drawer, and reordering is tedious manual labor.

---

## What's Working

1. **Modular Component Structure**: Clean separation between cards, modals, filter accordion, and hooks.
2. **Official PDF Generation**: `pdfGenerator.js` creates well-structured RS Bhayangkara Nganjuk legal attendance documents.
3. **Robust Signature Ingestion**: `SignatureImage.js` handles data URL sanitization and fallback placeholders safely.

---

## Priority Issues

### [P0] Core Mental Model & IA Inversion
- **What**: Attendee signatures displayed as independent meeting cards; primary "Tambah Rapat" CTA hidden inside collapsible filter bar.
- **Why it matters**: Breaks hospital workflow. Staff cannot see meeting rosters as coherent sessions; first-time users cannot find how to add attendance.
- **Fix**: Reorganize into Meeting Session master-detail or structured tabular attendance view. Elevate "Tambah Kehadiran" and "Export PDF" to sticky page header.
- **Suggested command**: `$impeccable shape rapat`

### [P1] Disconnected Date & Search Filter UX
- **What**: Dual date state (`searchDate` vs `filterDate`) requires manual "Cari Rapat" button click; filter bar collapsed by default.
- **Why it matters**: High cognitive friction. Users pick date, expect immediate reactive table update, but see stale list until button clicked.
- **Fix**: Sync date pickers with debounce/instant query; un-nest primary action buttons from filter accordion.
- **Suggested command**: `$impeccable layout rapat`

### [P2] Free-Text Meeting Title Entry Without Autocomplete
- **What**: Meeting name in `RapatModal` is unguided text input.
- **Why it matters**: Typo fragments attendance records across different spellings of same meeting, corrupting PDF exports.
- **Fix**: Convert meeting title to searchable combobox showing active sessions with "Buat Rapat Baru" option.
- **Suggested command**: `$impeccable clarify rapat`

### [P3] Reorder Controls & Touch Accessibility Deficits
- **What**: Manual number inputs and micro-chevrons (`w-3.5`) on every card; delete triggers native browser `confirm()`; low-contrast secondary text.
- **Why it matters**: Fails WCAG 44×44px touch targets; awkward for tablet/mobile staff; accidental deletion risk.
- **Fix**: Switch to drag-and-drop table or dedicated reorder modal; use accessible Tailwind dialog for deletion confirmation.
- **Suggested command**: `$impeccable harden rapat`

---

## Persona Red Flags

- **Alex (Power User: Secretary / IT Admin)**: Logging 30 attendees requires opening modal and typing meeting title 30 separate times. Reordering attendee order requires typing numbers into individual card inputs. Zero batch actions or keyboard shortcuts.
- **Jordan (First-Timer: Hospital Staff)**: Lands on `/dashboard/rapat` and sees no way to add attendance because "Filter & Aksi" accordion is closed. Perplexed by "Urutan: #1" badge on attendance record.
- **Sam (Accessibility: Screen Reader & Keyboard User)**: Signature canvas cannot be operated via keyboard. Icon buttons (`Edit`, `Trash2`, chevrons) lack `aria-label`. Sub-labels (`text-gray-400`) fail WCAG AA contrast against white card surface.

---

## Minor Observations

- `SignatureImage.js` uses hover scale (`group-hover:scale-[2]`), which fails on touch tablets.
- Yellow search highlights (`bg-yellow-200`) clash with brand cyan/slate design system.
- Refetching entire dataset on single item urutan update triggers noticeable UI flicker.

---

## Questions to Consider

- Why is this a masonry card grid instead of dense, clear attendance table with inline status?
- Why should staff create a new "Rapat" entity just to log individual signature?
- What audit trail or authentication protects duplicate digital signatures from unauthorized re-use?
