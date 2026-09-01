# Implementation Plan - Menu Deteksi Cuti Pegawai & Bypass Penilaian Kinerja Harian

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun menu admin deteksi cuti pegawai pada table `penilaian_harian` untuk mendeteksi cuti yang disetujui, mencocokkan jadwal shift kerja, dan mem-bypass skor absensi (100) serta kegiatan harian (100) dengan status `approved` otomatis.

**Architecture:** 
Next.js App Router (JavaScript). Endpoint baru `/api/it/deteksi-cuti` menangani scanning overlap cuti vs jadwal dan eksekusi batch bypass `penilaian_harian` + `kegiatan_harian`. Frontend admin di `/dashboard/it/deteksi-cuti` menyediakan filter rentang tanggal, filter departemen, summary cards, dan multi-select batch action. Resolver existing `/api/penilaian/harian` dan UI input turut diupdate untuk sinkronisasi on-the-fly.

**Tech Stack:** Next.js 14 (App Router), React, Tailwind CSS, Lucide React, MySQL (via db-helper), Jose JWT, Moment.js.

## Global Constraints
- Target database: MySQL (`penilaian_harian`, `kegiatan_harian`, `pengajuan_cuti`, `jadwal_pegawai`, `jadwal_tambahan`, `pegawai`, `departemen`).
- Akses menu & endpoint admin dibatasi untuk role `IT`, `SDM`, dan `SPI`.
- Bypass skor cuti: `skor_absensi = 100.00`, `skor_kegiatan = 100.00`, `skor_total = 100.00`, `status = 'approved'`.
- Selalu sisipkan 1 record default di `kegiatan_harian` saat bypass.

---

### Task 1: Backend Endpoint API Deteksi Cuti

**Files:**
- Create: `src/app/api/it/deteksi-cuti/route.js`

**Interfaces:**
- Consumes: `pengajuan_cuti`, `jadwal_pegawai`, `jadwal_tambahan`, `penilaian_harian`, `kegiatan_harian`, `pegawai`, `departemen`
- Produces: 
  - `GET /api/it/deteksi-cuti?tanggal_awal=...&tanggal_akhir=...&departemen=...&status=...&search=...` -> `{ success: true, summary: {...}, data: [...] }`
  - `POST /api/it/deteksi-cuti` -> `{ items: [...] }` -> `{ success: true, message: "...", processed_count: N }`

- [ ] **Step 1: Buat API Route `src/app/api/it/deteksi-cuti/route.js`**
  - Implementasikan GET dengan autentikasi JWT + check role IT/SDM/SPI.
  - Implementasikan query overlap antara `pengajuan_cuti` (status 'Disetujui'), `jadwal_pegawai`/`jadwal_tambahan` untuk tanggal tersebut (hanya yang memiliki shift, bukan libur/off/kosong), dan `penilaian_harian`.
  - Implementasikan POST untuk memproses array item cuti: insert/update `penilaian_harian` dengan `sumber_absensi = 'cuti'`, `ref_cuti_no`, `nilai_kondisi`, `skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, `status = 'approved'`, `approved_at = NOW()`, serta insert default `kegiatan_harian`.

- [ ] **Step 2: Uji endpoint GET & POST menggunakan curl / test script**
  - Pastikan query mengembalikan summary data dan list detail dengan status bypass (`belum_dibuat`, `perlu_bypass`, `approved_100`).

- [ ] **Step 3: Commit**
  ```bash
  git add src/app/api/it/deteksi-cuti/route.js
  git commit -m "feat(api): add endpoint for leave detection and daily evaluation bypass"
  ```

---

### Task 2: On-the-Fly Resolver Penilaian Cuti

**Files:**
- Modify: `src/app/api/penilaian/harian/route.js`
- Modify: `src/app/api/penilaian/harian/[id]/route.js`

**Interfaces:**
- `POST /api/penilaian/harian`: auto-approve saat membuat draf jika terdeteksi `sumber === 'cuti'`.
- `POST /api/penilaian/harian/[id]`: bypass validasi jam pulang dan validasi minimal kegiatan jika `sumber_absensi === 'cuti'`.

- [ ] **Step 1: Update `src/app/api/penilaian/harian/route.js`**
  - Modifikasi inisialisasi POST: jika `resAbsen.sumber === 'cuti'`, set `skor_kegiatan = 100`, `skor_absensi = 100`, `skor_total = 100`, `status = 'approved'`, `approved_at = NOW()`, dan auto-insert kegiatan harian default cuti.

- [ ] **Step 2: Update `src/app/api/penilaian/harian/[id]/route.js`**
  - Modifikasi submit action: jika `harian.sumber_absensi === 'cuti'`, bypass validasi jam pulang shift dan validasi `kegiatan.length === 0`, serta set skor 100 dan status `approved`.

- [ ] **Step 3: Commit**
  ```bash
  git add src/app/api/penilaian/harian/route.js src/app/api/penilaian/harian/[id]/route.js
  git commit -m "feat(penilaian): add auto-approval and validation bypass for leave days"
  ```

---

### Task 3: Menu Admin Link di Dashboard

**Files:**
- Modify: `src/app/dashboard/page.js`

- [ ] **Step 1: Tambahkan menu "Deteksi Cuti" ke dalam `ADMIN_ACTIONS`**
  - Import icon `Briefcase` atau `CalendarCheck` dari `lucide-react`.
  - Tambahkan item:
    ```javascript
    { title: "Deteksi Cuti", description: "Deteksi cuti & bypass penilaian kinerja", icon: Briefcase, href: "/dashboard/it/deteksi-cuti" }
    ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/app/dashboard/page.js
  git commit -m "feat(dashboard): add Deteksi Cuti to admin actions"
  ```

---

### Task 4: Halaman UI Deteksi Cuti Admin

**Files:**
- Create: `src/app/dashboard/it/deteksi-cuti/page.js`

- [ ] **Step 1: Buat Halaman UI `src/app/dashboard/it/deteksi-cuti/page.js`**
  - Header dengan judul & refresh button.
  - 3 Summary KPI Cards: Total Hari Cuti Terjadwal, Sudah Approved 100%, Belum Diproses (Perlu Bypass).
  - Filter Bar: Rentang Tanggal (Tanggal Awal - Tanggal Akhir), Departemen, Status Bypass, Search Input NIK/Nama.
  - Multi-select Checkbox + tombol aksi massal: "Bypass Semua Terpilih" dan "Bypass Semua yang Belum Diproses".
  - Tabel Desktop & Responsive Mobile Cards dengan indikator status, nomor pengajuan cuti, shift kerja, dan tombol bypass satuan.
  - Feedback toast / notification (Sonner) & loading states.

- [ ] **Step 2: Commit**
  ```bash
  git add src/app/dashboard/it/deteksi-cuti/page.js
  git commit -m "feat(ui): add deteksi cuti admin monitoring and bypass page"
  ```

---

### Task 5: Banner & Lock Read-Only di Halaman Input Pegawai

**Files:**
- Modify: `src/app/dashboard/penilaian-kinerja/input/page.js`

- [ ] **Step 1: Update Banner & Read-Only State**
  - Tambah banner informatif jika `attendanceInfo?.sumber === 'cuti'` atau `harianRecord?.sumber_absensi === 'cuti'`: *"Cuti Terverifikasi & Disetujui Otomatis (100%)"*.
  - Pastikan tanggal cuti otomatis terkunci dalam mode read-only dengan skor 100/100/100.

- [ ] **Step 2: Commit**
  ```bash
  git add src/app/dashboard/penilaian-kinerja/input/page.js
  git commit -m "feat(input): add verified leave banner and read-only lock"
  ```

---

### Task 6: Verifikasi & Build Validation

- [ ] **Step 1: Jalankan typecheck / build validation**
  ```bash
  npm run build
  ```
- [ ] **Step 2: Verifikasi alur integrasi end-to-end**
  - Verifikasi menu admin dapat dibuka.
  - Verifikasi endpoint scan & bypass berfungsi tanpa error.
