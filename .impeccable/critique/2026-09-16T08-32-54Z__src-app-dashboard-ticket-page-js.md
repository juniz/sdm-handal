---
timestamp: 2026-09-16T08-32-54Z
slug: src-app-dashboard-ticket-page-js
---
# Impeccable Critique: /dashboard/ticket

**Target**: `src/app/dashboard/ticket/page.js` & `src/components/ticket/`
**Product**: SDM Handal — RS Bhayangkara Nganjuk
**Total Score**: **31 / 40**
**Rating Band**: Solid / Ready with Minor Polish
**Heuristics**: 1:3, 2:4, 3:3, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3, 10:3
**N/A Heuristics**: none
**P0 Issues**: 0
**P1 Issues**: 1
**P2 Issues**: 1
**P3 Issues**: 2

---

## 1. Design Specificity
- **Grounded Elements**: Header integrates emergency contact `Tim IT Siaga: Ext. 118` with icon; realistic clinical placeholders (`SIMRS IGD`, room/device prompts); department & submitter metadata; closure verification question.
- **Gaps**: Emergency extension hidden on mobile viewports (`hidden md:flex`); priority taxonomy lacks clear clinical operational definitions (patient-care halting vs non-urgent); deletion uses native browser alert.

---

## 2. Nielsen Heuristics Breakdown

| # | Heuristic | Score (0-4) | Status & Observations |
|---|---|:---:|---|
| 1 | Visibility of System Status | 3 | Status badges, skeletons, modal spinners, and toasts present. Search query lacks debounce/loading cue. |
| 2 | Match Between System & Real World | 4 | Natural Indonesian hospital terminology (`Pelaporan Gangguan`, `Baru`, `Diproses`, `Ditunda`, `Selesai`, `Ditutup`). |
| 3 | User Control and Freedom | 3 | Esc key and backdrop dismiss implemented. Ticket deletion uses unstyled browser confirm without undo. |
| 4 | Consistency and Standards | 3 | Follows slate/sky design tokens and Figtree font. Action button cluster uses tight spacing on mobile. |
| 5 | Error Prevention | 3 | Length checks on submit and irreversible close warning. Lacks live character counter and priority criteria hints. |
| 6 | Recognition Rather Than Recall | 3 | Badges and active filter counts present. Collapsed accordion hides filter names. |
| 7 | Flexibility and Efficiency of Use | 3 | "Hanya Pengajuan Saya" toggle provides fast 1-click filter. Lacks keyboard shortcuts and custom sorting. |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained slate borders, no AI gradient slop. Card action header feels slightly dense. |
| 9 | Help Users Recognize, Diagnose, & Recover | 3 | Inline field error messages and toast error dispatching. EmptyState now includes recovery CTA. |
| 10 | Help and Documentation | 3 | Helpful placeholders and hotline extension. Lacks priority level guidance. |

---

## 3. Cognitive Load & Emotional Journey
- **Cognitive Checklist**: 5/8 passes. Fails on: card header action overload, 5 visible filter controls simultaneously, and working memory tax when filter accordion is collapsed.
- **Emotional Arc**: Emergency breakdown creates high anxiety; visible Ext. 118 relieves panic on desktop, but mobile users miss it. Resolution loop via Close modal provides satisfying closure.

---

## 4. Strengths
1. **Clinical Dispatch Integration**: Direct IT hotline (`Ext. 118`) in header ground the page in hospital floor realities.
2. **Design System Discipline**: Fully adheres to `DESIGN.md` slate/sky tokens with zero anti-pattern detector warnings.
3. **Verified Two-Party Closure**: Tickets stay in "Selesai" until the reporting user confirms work completion.

---

## 5. Priority Issues

### [P1] IT Hotline Hidden on Mobile Devices
- **What**: `Ext. 118` hotline uses `hidden md:flex` in `page.js`.
- **Why it matters**: Ward nurses access SDM on mobile during emergencies; losing hotline access risks delayed patient care.
- **Fix**: Render compact phone pill on mobile with `tel:118` link.
- **Command**: `$impeccable adapt`

### [P2] Deletion Uses Native Browser Alert
- **What**: `handleDelete` uses `window.confirm()` in `page.js:79`.
- **Why it matters**: Lacks hospital audit trail and breaks mobile app experience.
- **Fix**: Replace browser alert with styled confirmation dialog or soft cancel status.
- **Command**: `$impeccable harden`

### [P3] Active Filter Criteria Hidden When Accordion Closed
- **What**: Collapsed accordion shows only `"2 aktif"` badge without criteria names.
- **Why it matters**: Users misinterpret filtered empty state as complete queue clearance.
- **Fix**: Show active filter chips under header when collapsed.
- **Command**: `$impeccable clarify`

### [P3] Card Action Touch Targets Sub-44px on Mobile
- **What**: Action buttons collapse to `p-1.5` (~28px) on mobile viewports.
- **Why it matters**: Violates WCAG mobile touch target guidelines, risking misclicks.
- **Fix**: Increase touch padding or consolidate secondary actions into an overflow menu.
- **Command**: `$impeccable distill`

---

## 6. Persona Red Flags
- **Alex (Power User)**: No batch operations or sort order toggles for rapid triage.
- **Jordan (First-Timer)**: Unclear distinction between "Tinggi" and "Kritis" priorities.
- **Sam (Accessibility-Dependent)**: Sub-44px touch targets on mobile viewports.

---

## 7. Detector Findings
- `detect.mjs` scan: **0 violations (`[]`)**.
- Clean token compliance across all components.
