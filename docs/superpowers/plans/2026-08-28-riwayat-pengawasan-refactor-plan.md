# Riwayat Pengawasan Modularization, Stats Enhancement & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan informasi jumlah data Kosong, Pending, dan Draft pada tabel dan drawer audit pengawasan penilaian kinerja pegawai, memecah file `page.js` monolitik menjadi komponen modular, serta memperbaiki bug parsing tanggal kalender dan cascade modal.

**Architecture:** Backend GraphQL (`website/backend`) menghitung agregasi subquery `count_pending` & `count_draft` serta komputasi `hari_kosong`. Frontend API route (`sdm`) meneruskan field tersebut. Halaman `page.js` direfaktor menjadi arsitektur modular yang membagi UI ke 7 komponen independen di folder `components/`.

**Tech Stack:** Next.js (App Router), React, NestJS, GraphQL, TypeORM / Raw SQL, Tailwind CSS, Lucide Icons, Moment.js.

## Global Constraints
- Match existing styling, typography (`font-figtree`, `font-mono`, `font-noto-sans`), and color scheme.
- Maintain single responsibility per component.
- Bulletproof date handling for calendar cells (`String.slice(0, 10)` to prevent timezone offset shifts).

---

### Task 1: Backend GraphQL & Repository Enhancement (`website/backend`)

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts:40-70`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/rekap-pengawasan.service.ts:45-90`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/rekap-pengawasan-types.ts:30-48`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/schema.gql`

**Interfaces:**
- Produces: `hari_pending: number`, `hari_draft: number`, `hari_kosong: number` in `RekapPengawasanDto` and GraphQL query `rekapPengawasanList`.

- [ ] **Step 1: Add subqueries in `rekap-pengawasan.repository.ts`**
Add subqueries for `count_pending` (status = 'submitted') and `count_draft` (status IN ('draft', 'revisi')).

- [ ] **Step 2: Update `rekap-pengawasan.service.ts`**
Compute `hariPending`, `hariDraft`, and `hariKosong = Math.max(0, gapHari - hariPending - hariDraft)` for both locked and draft status.

- [ ] **Step 3: Update `rekap-pengawasan-types.ts` & `schema.gql`**
Add `@Field(() => Int) hari_pending`, `@Field(() => Int) hari_draft`, `@Field(() => Int) hari_kosong`.

- [ ] **Step 4: Verify Backend build**
Run: `npm run build` in `website/backend`.

---

### Task 2: Frontend API Route Update (`sdm`)

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/penilaian/rekap-pengawasan/route.js:78-95`

**Interfaces:**
- Consumes: GraphQL `rekapPengawasanList` fields `hari_pending`, `hari_draft`, `hari_kosong`.
- Produces: JSON response `{ data: [..., hari_pending, hari_draft, hari_kosong] }`.

- [ ] **Step 1: Update GraphQL query in `src/app/api/penilaian/rekap-pengawasan/route.js`**
Include `hari_pending`, `hari_draft`, `hari_kosong` in `rekapPengawasanList.data`.

---

### Task 3: Create Modular Components (`sdm`)

**Files:**
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditHeader.jsx`
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditSummaryCards.jsx`
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditFilters.jsx`
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditCalendarGrid.jsx`
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditActivityModal.jsx`
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditDetailDrawer.jsx`
- Create: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditTable.jsx`

**Interfaces:**
- `AuditHeader`: `{ month, year, onReset }`
- `AuditSummaryCards`: `{ summary, getRatingBadge }`
- `AuditFilters`: `{ month, setMonth, year, setYear, departemen, setDepartemen, sttsKerja, setSttsKerja, searchNama, setSearchNama, departemenList, sttsKerjaList, MONTHS, YEARS }`
- `AuditCalendarGrid`: `{ panelYear, panelMonth, panelSchedule, panelIsTambahanMap, panelEvaluations, onSelectDay }`
- `AuditActivityModal`: `{ isOpen, onClose, selectedDateStr, selectedEval, activities, loading }`
- `AuditDetailDrawer`: `{ isOpen, onClose, selectedEmp, panelMonth, setPanelMonth, panelYear, setPanelYear, panelLoading, panelSchedule, panelIsTambahanMap, panelEvaluations, onSelectDay, MONTHS, YEARS }`
- `AuditTable`: `{ loading, rekapList, meta, onPageChange, onOpenDetail }`

- [ ] **Step 1: Create `AuditHeader.jsx`**
- [ ] **Step 2: Create `AuditSummaryCards.jsx`**
- [ ] **Step 3: Create `AuditFilters.jsx`**
- [ ] **Step 4: Create `AuditCalendarGrid.jsx`** with timezone-safe date matching.
- [ ] **Step 5: Create `AuditActivityModal.jsx`**
- [ ] **Step 6: Create `AuditDetailDrawer.jsx`** with comprehensive 6-metric summary cards.
- [ ] **Step 7: Create `AuditTable.jsx`** with columns: NIK, Nama, Departemen, Status Kerja, Jadwal, Disetujui, Pending, Draft, Kosong, Gap, Rata Skor, Status Rekap, Aksi.

---

### Task 4: Refactor `page.js` Orchestrator (`sdm`)

**Files:**
- Modify: `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`

- [ ] **Step 1: Replace monolithic `page.js` with clean orchestrator**
Import modular components, coordinate state (filters, drawer, activity modal), and execute API requests.

---

### Task 5: Verification & Validation

- [ ] **Step 1: Check Next.js compilation for frontend (`sdm`)**
- [ ] **Step 2: Verify all components render and interoperate cleanly without console warnings/errors**
