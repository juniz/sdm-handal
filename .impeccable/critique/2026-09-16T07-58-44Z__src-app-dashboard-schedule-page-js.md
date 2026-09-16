---
target: /dashboard/schedule
total_score: 36
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-16T07-58-44Z
slug: src-app-dashboard-schedule-page-js
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4/4 | Save button spinner, Sonner toasts for sync confirmation, explicit "Libur" badge |
| 2 | Match Between System and Real World | 4/4 | Monday-start calendar (`isoWeek`), Indonesian labels, unified 24h composite shift view |
| 3 | User Control and Freedom | 4/4 | Modal backdrop click dismissal, Escape key handler, "Hari Ini" jump button, "Kosongkan" clear button |
| 4 | Consistency and Standards | 4/4 | Aligned with `DESIGN.md` cyan tokens, 8px segmented tabs, Lucide SVG icons |
| 5 | Error Prevention | 3/4 | Disabled out-of-month dates, context display of active shift before modification |
| 6 | Recognition Rather Than Recall | 4/4 | Color-coded shift legend (P/S/M/L) with working hours, unified schedule visibility |
| 7 | Flexibility and Efficiency | 3/4 | Fast toggle between Semua / Regular / Tambahan, monthly shift counters |
| 8 | Aesthetic and Minimalist Design | 4/4 | Eliminated wall-of-blue, crisp semantic chips, clean slate cards |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3/4 | Non-blocking Sonner error toasts and inline fetch alerts |
| 10 | Help and Documentation | 3/4 | On-screen shift legend with duty hours and subtitle guidance |
| **Total** | | **36/40** | **Excellent (Ship Ready)** |

---

### What Changed
- Refactored `src/app/dashboard/schedule/page.js` to full `DESIGN.md` compliance.
- Replaced hardcoded blues (`bg-blue-600`, `bg-blue-500`) with brand cyan (`#0284C7`, `#0EA5E9`, `sky-50`–`sky-700`).
- Swapped bouncy spring pill tabs for 8px segmented control.
- Replaced ASCII `<` and `>` with Lucide `ChevronLeft` and `ChevronRight`.
- Unified regular & additional schedules in single composite view with stacked badges.
- Fixed line 294 `{shift === "L" ? "" : shift}` bug; "Libur" now renders as explicit emerald badge.
- Added color-coded shift legend with operational hours.
- Added monthly tally chips (Regular, Tambahan, Libur).
- Replaced `window.alert()` with Sonner toast notifications.
- Added modal Escape key dismissal, backdrop close, and button loading state.
