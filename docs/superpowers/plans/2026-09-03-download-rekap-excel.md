# Download Rekap Kinerja Format Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur download rekapitulasi kinerja pegawai bulanan dalam format Excel (.xlsx) resmi dengan urutan departemen A-Z, data lengkap lintas-halaman, dan baris total.

**Architecture:** Frontend client-side generator menggunakan `xlsx` (SheetJS) yang memanggil `/api/penilaian/rekap` dengan parameter limit besar (`limit=10000`), melakukan sorting `nama_departemen` lalu `nama`, menyusun layout kop + tabel + ringkasan total, dan men-trigger download via `XLSX.writeFile`.

**Tech Stack:** Next.js (React 19), SheetJS (`xlsx`), Lucide React Icons, Moment.js.

## Global Constraints
- Target route: `/dashboard/penilaian-kinerja/rekap`
- File to modify: `src/app/dashboard/penilaian-kinerja/rekap/page.js`
- Primary sort: `nama_departemen` A-Z, secondary sort: `nama` A-Z.
- Columns: No, NIK, Nama Pegawai, Departemen, Jasa Dasar (Rp), Pengurang (Rp), Insentif Tambahan (Rp), Jasa Final (Rp).
- Excluded columns: Hari Jadwal, Approved, Shift Tambahan, Gap Hari, Skor, Status.

---

### Task 1: Add XLSX import, state, and Excel export helper in Rekap Page

**Files:**
- Modify: `src/app/dashboard/penilaian-kinerja/rekap/page.js`

**Interfaces:**
- Consumes: `/api/penilaian/rekap?bulan=...&tahun=...&departemen=...&status=...&nama=...&page=1&limit=10000`
- Produces: `exportToExcel()` handler and "Download Excel" button in UI.

- [ ] **Step 1: Add imports and state in `page.js`**
  - Import `* as XLSX from "xlsx"`
  - Import `FileSpreadsheet` from `lucide-react`
  - Add state `const [exportingExcel, setExportingExcel] = useState(false);`

- [ ] **Step 2: Implement `exportToExcel` function**
  - Fetch all filtered data with `limit=10000`
  - Sort data by `nama_departemen` ascending, then `nama` ascending
  - Build AOA (Array of Arrays) sheet data with title header, metadata filter, table columns, and formatted total row
  - Configure `!cols` and `!merges`
  - Generate and save workbook via `XLSX.writeFile`
  - Handle errors and loading states

- [ ] **Step 3: Add "Download Excel" button to header UI**
  - Add button beside "Export CSV" button with emerald theme and `FileSpreadsheet` icon
  - Show spinner (`Loader2`) when `exportingExcel` is true

- [ ] **Step 4: Verify build and syntax check**
  - Run `npm run lint` or `next build` dry check

- [ ] **Step 5: Commit changes**
  - `git add src/app/dashboard/penilaian-kinerja/rekap/page.js`
  - `git commit -m "feat(penilaian): add download rekap kinerja in excel format"`
