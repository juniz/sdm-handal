# Task 4: Refactor `page.js` Orchestrator (`sdm`)

## Context & Objective
Refactor `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js` to replace the 917-line monolithic code with a clean, modular orchestrator component that imports and uses the 7 subcomponents created in Task 3.

## Target File
- `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`

## Implementation Steps
1. Import React hooks: `useState`, `useEffect`, `useCallback`.
2. Import `moment` and `AlertCircle` from `lucide-react`.
3. Import modular subcomponents:
   - `AuditHeader` from `./components/AuditHeader`
   - `AuditSummaryCards` from `./components/AuditSummaryCards`
   - `AuditFilters` from `./components/AuditFilters`
   - `AuditTable` from `./components/AuditTable`
   - `AuditDetailDrawer` from `./components/AuditDetailDrawer`
   - `AuditActivityModal` from `./components/AuditActivityModal`
4. Define constant arrays `MONTHS` and `YEARS`.
5. Maintain state:
   - Filter state: `month`, `year`, `departemen`, `sttsKerja`, `searchNama`, `page`
   - Data state: `rekapList`, `meta`, `summary`, `loading`, `errorMsg`
   - Filter options state: `departemenList`, `sttsKerjaList`
   - Slide-over panel state: `panelOpen`, `selectedEmp`, `panelMonth`, `panelYear`, `panelLoading`, `panelSchedule`, `panelIsTambahanMap`, `panelEvaluations`
   - Activity modal state: `activityModalOpen`, `selectedDateStr`, `selectedEval`, `activityLoading`, `activities`
6. Handlers & fetch callbacks:
   - `fetchDepartments()`, `fetchSttsKerja()`
   - `loadRekapData()` with debounced trigger
   - `handleResetFilters()`
   - `handleOpenDetail(emp)`
   - `handleCloseDetail()` -> closes panel and ensures activity modal is also closed if open
   - `loadEmployeePanelData()`
   - `handleViewDayActivities(dateStr, dayEval)`
   - `getRatingBadge(score)` helper
7. Render clean layout (~150-200 lines).

## Report File
Write your report to `/Users/hardiko/Documents/Developer/NEXT/sdm/.superpowers/sdd/2026-08-28-riwayat-pengawasan-refactor/task-4-report.md`.
