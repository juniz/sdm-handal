---
target: /dashboard/schedule
total_score: 38
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-16T08-02-45Z
slug: src-app-dashboard-schedule-page-js
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4/4 | Subtle overlay during month data fetch, save button spinner, instant Sonner feedback |
| 2 | Match Between System and Real World | 4/4 | ISO Monday week start, Indonesian labels, standard hospital P/S/M/L codes with hours |
| 3 | User Control and Freedom | 4/4 | Escape key dismissal, backdrop click, "Hari Ini" reset, safe "Kosongkan" clear button |
| 4 | Consistency and Standards | 4/4 | Strict `DESIGN.md` cyan tokens, 8px segmented control, Lucide SVG icons |
| 5 | Error Prevention | 4/4 | Non-current month clicks disabled, preselected active state, validated shift select |
| 6 | Recognition Rather Than Recall | 4/4 | Persistent shift legend with duty hours, unified composite 24h schedule |
| 7 | Flexibility and Efficiency | 3/4 | Quick view tabs, "Hari Ini" shortcut, monthly quota chips; multi-day drag missing |
| 8 | Aesthetic and Minimalist Design | 4/4 | Clean clinical hierarchy, compact semantic badges, quiet slate cards |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 4/4 | Immediate Sonner error toasts with server message on save or fetch failure |
| 10 | Help and Documentation | 3/4 | On-screen legend bar with shift codes and operational duty hours |
| **Total** | | **38/40** | **Excellent (Ship Ready)** |

---

### What Changed
- Added error toast handling in `handleSaveShift` (`catch (error) { toast.error(...) }`), eliminating silent failure risk.
- Added `isLoading={isLoadingSchedule}` prop and loading backdrop to `CalendarComponent`, providing clear visual feedback during month transitions.
