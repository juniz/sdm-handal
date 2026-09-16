---
target: /dashboard/schedule
total_score: 12
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-09-16T07-55-01Z
slug: src-app-dashboard-schedule-page-js
---
Method: dual-agent (A: 789d00ba-65ad-409d-8159-339ce091c791 · B: 1fe35430-5b59-4f70-98e4-1673af9f3d13)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1/4 | Save has zero loading indicator or success toast; "Libur" renders blank string inside solid blue tile |
| 2 | Match Between System and Real World | 2/4 | Calendar starts on Sunday ("Min") instead of Monday ("Sen"); splits 24h work day into isolated tabs |
| 3 | User Control and Freedom | 2/4 | Modal backdrop click does not close; no Escape key listener; no undo for overwriting shifts |
| 4 | Consistency and Standards | 1/4 | Hardcoded generic Tailwind blues (`#2563eb`), bouncy pill tabs, ASCII `<` `>` arrows, abandoned `Calendar` import |
| 5 | Error Prevention | 1/4 | Zero clinical rotation validation (e.g. night shift into morning shift); out-of-month dates clickable |
| 6 | Recognition Rather Than Recall | 1/4 | No shift legend on screen; tab bifurcation hides regular duties while scheduling additional shifts |
| 7 | Flexibility and Efficiency | 1/4 | No bulk fill, pattern templates, or keyboard navigation; requires ~120 clicks to roster one month |
| 8 | Aesthetic and Minimalist Design | 2/4 | Wall-of-blue effect with identical saturated blue tiles regardless of shift type or rest day |
| 9 | Error Recovery | 1/4 | Raw blocking `window.alert()` on network/fetch failures with no recovery paths |
| 10 | Help and Documentation | 0/4 | No tooltips, quota explanations, submission deadlines, or shift policy guides |
| **Total** | | **12/40** | **Poor (Critical Redesign Required)** |

---

### Design Specificity Verdict

**LLM Assessment**:
Category-interchangeable generic calendar widget. Surface has zero institutional grounding for RS Bhayangkara Nganjuk. Missing ward/unit badge (IGD, ICU, Rawat Inap), peer roster visibility for shift handover, shift classification (Pagi, Siang, Malam, Libur), Karu approval states, and monthly hour tallies. Visually diverges from `DESIGN.md` by substituting brand cyan tokens (`#0284C7`, `#0EA5E9`, `#E0F2FE`) with standard consumer SaaS electric blues (`bg-blue-600`, `bg-blue-500`) and bouncy pill buttons.

**Deterministic Scan**:
Automated detector identified 1 warning:
- `border-accent-on-rounded` (`src/app/dashboard/schedule/page.js:97`)
- **False Positive Assessment**: Verified true false positive. Matched spinner element `<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>`. Regex flagged `rounded-full` with `border-b-2`, which produces standard circular loading arc rather than clashing card border.

**Visual Overlays**:
Browser automation tools unavailable in environment. Deterministic AST/regex scan utilized as analytical baseline.

---

### Overall Impression
Functional prototype calendar masquerading as a medical staff scheduling portal. While month grid scales responsively across viewports, clinical workflows are heavily compromised by tab segregation, absence of shift legends, missing bulk actions, and total divergence from the hospital design system.

---

### What's Working
1. **Responsive CSS grid**: `grid-cols-7` layout with `aspect-square` cells maintains legible structure across mobile and desktop without clipping.
2. **Explicit "Set Libur" button**: Acknowledges off-duty day management as an explicit action rather than merely deleting a record.
3. **Adaptive mobile tab labels**: Condenses tab text ("Regular" / "Tambahan") on narrow viewports to avoid header wrapping.

---

### Priority Issues

#### [P0] Severe Design System & Brand Disconnect
- **What**: Hardcoded generic Tailwind blues (`bg-blue-600`, `bg-blue-500`, `#2563eb`), bouncy spring pill tabs (`rounded-full`), and ASCII glyphs `<` `>`.
- **Why it matters**: Violates `DESIGN.md` specifications for RS Bhayangkara Nganjuk (`#0284C7`, `#0EA5E9`, 8px rounded corners, Lucide icons), degrading clinical authority and app consistency.
- **Fix**: Replace blues with design tokens (`brand-cyan`, `pale-cyan`, `neutral-surface`), replace pill tabs with segmented 8px tabs, swap ASCII `<` `>` with Lucide `ChevronLeft`/`ChevronRight`.
- **Suggested command**: `$impeccable polish`

#### [P0] Tab Bifurcation Induces Working Memory Overload & Shift Conflicts
- **What**: Regular and Additional schedules segregated into two mutually exclusive tabs.
- **Why it matters**: Clinicians cannot see combined duty hours. Induces high risk of dangerous consecutive shifts (e.g. night shift immediately followed by morning overtime), triggering severe fatigue and clinical errors.
- **Fix**: Unify into single calendar view with stacked indicators/chips per date (Regular shift badge + Overtime badge).
- **Suggested command**: `$impeccable shape`

#### [P1] "Libur" (L) Renders Blank Inside Active Cell & Missing Shift Legend
- **What**: Line 294 `{shift === "L" ? "" : shift}` renders empty string while cell turns blue. No shift legend exists on page.
- **Why it matters**: Rest days look like broken scheduled shifts. New or fatigued staff cannot decode mystery shift letters (P/S/M).
- **Fix**: Render explicit "L" badge with distinct neutral/emerald treatment; add color-coded shift legend (Pagi, Siang, Malam, Libur) with hour ranges below calendar.
- **Suggested command**: `$impeccable clarify`

#### [P1] Primitive Browser Alerts and Absent Save Feedback
- **What**: Network failures trigger blocking `window.alert()`. Saving has no button loading state or success notification.
- **Why it matters**: Freezes browser thread, causes anxiety over whether mission-critical schedule changes were recorded.
- **Fix**: Implement inline toast notifications, button loading spinners during save, backdrop click-to-close, and Escape key dismissal.
- **Suggested command**: `$impeccable harden`

#### [P2] Missing Clinical Workload Metrics & Roster Summary
- **What**: No summary of total duty hours, total shifts worked, or shift breakdown (P/S/M/L count).
- **Why it matters**: Hospital staff must satisfy mandatory target hours (154–172 hrs/month). Clinicians are forced to manually tally calendar cells with pen and paper.
- **Fix**: Add a monthly metric bar above the calendar showing total shifts, estimated hours, and quota progress.
- **Suggested command**: `$impeccable bolder`

---

### Persona Red Flags

#### Alex (Power User - Senior Nurse / Unit Scheduler)
- **Action**: Rapidly fill monthly roster for upcoming cycle.
- **Red Flags**:
  - **No bulk/pattern entry**: Must click 30 separate cells, wait for modal, select shift, click Save (~120 manual clicks per month).
  - **No keyboard navigation**: Arrow keys do not navigate calendar cells; Enter/Space do not open editor.
  - **No roster metrics**: Cannot see monthly hour totals to ensure hospital staffing compliance.

#### Jordan (First-Timer - Junior Nurse / New Staff)
- **Action**: Check upcoming shift dates and record off-days.
- **Red Flags**:
  - **No shift legend**: Letters "P", "S", "M" have no visible definitions or hours on screen.
  - **Disappearing "L"**: Setting "Libur" turns the cell blue with no text, leaving Jordan confused whether action succeeded.
  - **Crude ASCII navigation**: `<` and `>` buttons have no tooltips or clear hover states.
  - **Harsh browser alert**: If session token expires, Jordan gets a cold `window.alert` popup with no redirect to login.

#### Sam (Accessibility-Dependent User - Screen Reader & Keyboard)
- **Action**: Navigate calendar, inspect assigned shifts, update a date.
- **Red Flags**:
  - **Missing ARIA grid semantics**: Calendar built from generic `div`s and unlabelled `button`s without `role="grid"`, `role="row"`, `role="gridcell"`. Screen reader reads "15 P" without month or weekday context.
  - **Unlabelled nav buttons**: `<button>&lt;</button>` announced as "less than button" without `aria-label="Bulan sebelumnya"`.
  - **Accessible tab failure**: Tabs are `<motion.button>` inside a `div` without `role="tablist"`, `role="tab"`, or `aria-selected`.
  - **Modal accessibility breakdown**: `ShiftModal` lacks `role="dialog"`, `aria-modal="true"`, focus trapping, and Escape key handling; keyboard focus bleeds into background calendar.
  - **Color-only state encoding**: Scheduled state conveyed exclusively by background color changes (`bg-blue-500` vs `bg-white`).

---

### Minor Observations
1. **Unused Import**: `import { Calendar } from "lucide-react"` on line 6 is imported but never rendered.
2. **Hardcoded Weekday Headers**: `["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]` hardcoded rather than derived from configured Indonesian locale.
3. **Dead Modal Backdrop**: Line 84 backdrop lacks `onClick={onClose}`, trapping clicks.
4. **Week Starts on Sunday**: Uses Moment `.startOf("week")` (Sunday) instead of Indonesian work week standard (Monday).
5. **Out-of-Month Date Bleed**: Leading/trailing days from adjacent months can be clicked and submitted, risking data corruption or silent misfiling against current month parameters.

---

### Questions to Consider
1. *Why is an individual employee able to directly overwrite `jadwal_pegawai` in the database without a draft submission or Karu (supervisor) approval gate?*
2. *Why are regular duties and overtime shifts segregated into opposing tabs when nurse fatigue and clinical labor laws evaluate the unified 24-hour day?*
3. *How can clinicians verify they meet mandatory hospital monthly hour targets (e.g. 154 hours) when hours are invisible and shifts are represented as isolated single-letter tiles?*
4. *Why does a clinical platform for RS Bhayangkara Nganjuk use consumer SaaS electric blue with bouncy pill tabs and ASCII arrows instead of its documented cyan design tokens?*
