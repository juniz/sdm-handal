# Development Request Print Out & PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur print out fisik (`window.print()`) dan ekspor berkas PDF untuk rekap pengajuan di `/dashboard/development` serta lembar formulir resmi pengajuan di `/dashboard/development/[id]`.

**Architecture:** Menggunakan dedicated print view components (`DevelopmentListPrintView` & `DevelopmentDetailPrintView`) yang dirender dalam modal preview universal (`DevelopmentPrintModal`). Cetak fisik memanfaatkan CSS `@media print` murni, dan ekspor PDF memanfaatkan dynamic import `html2canvas` + `jsPDF` untuk konsistensi visual di sisi klien tanpa merusak tampilan kerja.

**Tech Stack:** Next.js (App Router, Client Components), React, Tailwind CSS, Lucide Icons, Moment.js, jsPDF, html2canvas.

## Global Constraints
- Mengikuti arsitektur dan konvensi kode Next.js SDM yang ada.
- Dynamic import `html2canvas` dan `jsPDF` agar tidak memicu error SSR (Server Side Rendering).
- Format kertas A4 standar, styling cetak `@media print` terisolasi sehingga tidak mencetak navigasi, sidebar, atau backdrop modal.
- Menggunakan logo instansi `/logo-kop.png` dengan fallback teks yang rapi jika gambar tidak termuat.

---

### Task 1: Print & Export Utility Helper
**Files:**
- Create: `src/lib/development-print-utils.js`

**Interfaces:**
- Produces:
  - `exportToPdfFromElement(elementId, fileName, orientation)`: Promise<boolean>
  - `triggerBrowserPrint()`: void
  - `formatPrintDate(date)`: string

- [ ] **Step 1: Buat utility helper `src/lib/development-print-utils.js`**
- [ ] **Step 2: Uji import dan penanganan fallback canvas scale serta dynamic import**
- [ ] **Step 3: Commit Task 1**

---

### Task 2: Universal Print Modal Component
**Files:**
- Create: `src/components/development/DevelopmentPrintModal.jsx`

**Interfaces:**
- Consumes: `src/lib/development-print-utils.js`
- Produces: `DevelopmentPrintModal` component
  - Props: `isOpen`, `onClose`, `title`, `fileName`, `orientation`, `children`

- [ ] **Step 1: Buat komponen modal preview dengan controls (Cetak, Download PDF, Tutup) dan styling A4 preview box**
- [ ] **Step 2: Pasang loading state saat proses render/download PDF berjalan**
- [ ] **Step 3: Commit Task 2**

---

### Task 3: List / Rekapitulasi Print Layout Component
**Files:**
- Create: `src/components/development/DevelopmentListPrintView.jsx`

**Interfaces:**
- Produces: `DevelopmentListPrintView` component
  - Props: `requests`, `statistics`, `filters`, `masterData`, `printDate`

- [ ] **Step 1: Implementasi kop laporan instansi dan metadata cetak**
- [ ] **Step 2: Implementasi tabel data rekap dengan format badge monokrom cetak**
- [ ] **Step 3: Implementasi ringkasan statistik dan 2 kolom tanda tangan pengesahan**
- [ ] **Step 4: Commit Task 3**

---

### Task 4: Detail / Lembar Form Satuan Print Layout Component
**Files:**
- Create: `src/components/development/DevelopmentDetailPrintView.jsx`

**Interfaces:**
- Produces: `DevelopmentDetailPrintView` component
  - Props: `request`, `statusHistory`, `notes`, `user`, `printDate`

- [ ] **Step 1: Implementasi kop form resmi "Formulir Permintaan Pengembangan Sistem Informasi"**
- [ ] **Step 2: Implementasi Bagian I (Data Pemohon) & Bagian II (Rincian Kebutuhan)**
- [ ] **Step 3: Implementasi Bagian III (Approval) & Bagian IV (Penugasan Teknis IT)**
- [ ] **Step 4: Implementasi Bagian V (Lembar 3 Tanda Tangan: Pemohon, Ka. Unit, IT SIMRS)**
- [ ] **Step 5: Commit Task 4**

---

### Task 5: Component Index Export
**Files:**
- Modify: `src/components/development/index.js`

- [ ] **Step 1: Tambahkan export `DevelopmentPrintModal`, `DevelopmentListPrintView`, dan `DevelopmentDetailPrintView`**
- [ ] **Step 2: Commit Task 5**

---

### Task 6: Integrasi Halaman Rekap `/dashboard/development`
**Files:**
- Modify: `src/app/dashboard/development/page.js`

- [ ] **Step 1: Tambahkan tombol "Cetak Rekap" pada header tindakan halaman**
- [ ] **Step 2: Hubungkan state `showPrintModal` dan render `DevelopmentPrintModal` + `DevelopmentListPrintView`**
- [ ] **Step 3: Commit Task 6**

---

### Task 7: Integrasi Halaman Detail `/dashboard/development/[id]`
**Files:**
- Modify: `src/app/dashboard/development/[id]/page.js`

- [ ] **Step 1: Tambahkan tombol "Cetak Form" pada header detail**
- [ ] **Step 2: Hubungkan state `showPrintModal` dan render `DevelopmentPrintModal` + `DevelopmentDetailPrintView`**
- [ ] **Step 3: Commit Task 7**

---

### Task 8: Verifikasi & Uji Integrasi
- [ ] **Step 1: Jalankan validasi linting / build check**
- [ ] **Step 2: Uji preview responsif dan cetak fisik via browser simulator**
- [ ] **Step 3: Pastikan tidak ada regresi pada fungsionalitas CRUD yang sudah ada**
