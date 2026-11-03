# Mapping Jenis Pegawai untuk Print Gaji Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan fitur mapping jenis pegawai dinamis (Nakes, Apoteker, Administrasi, Radiologi, dll.) di `/dashboard/penggajian/data-gaji` dan gunakan untuk memisahkan hasil cetak gaji kelompok kontrak >= 2018 per kategori.

**Architecture:** 
1. Database tables `gaji_kategori_jenis` dan `gaji_pegawai_mapping`.
2. API endpoint `/api/gaji-pegawai/mapping` untuk CRUD kategori dan assign mapping NIK.
3. API `/api/gaji-pegawai/print` JOIN kategori.
4. Modal `MappingJenisModal.jsx` di halaman data gaji.
5. Pemisahan grup `>= 2018` per kategori di `PrintGajiReport.js`.

**Tech Stack:** Next.js App Router, React 18/19, Tailwind CSS, Radix Dialog/Select, jsPDF + jspdf-autotable, MySQL / MariaDB.

## Global Constraints

- Kontrak `< 2018`: tetap 1 grup gabungan.
- Kontrak `>= 2018`: dipecah per kategori jenis pegawai.
- Tabel dibuat aman dengan `CREATE TABLE IF NOT EXISTS` dan auto-seed kategori dasar.

---

### Task 1: Database Migration SQL & API Endpoint Mapping

**Files:**
- Create: `database/create_gaji_mapping_tables.sql`
- Create: `src/app/api/gaji-pegawai/mapping/route.js`
- Modify: `src/app/api/gaji-pegawai/print/route.js`

- [ ] **Step 1: Buat file SQL referensi schema**
- [ ] **Step 2: Buat route `/api/gaji-pegawai/mapping/route.js` dengan auto-table & seed**
- [ ] **Step 3: Update `/api/gaji-pegawai/print/route.js` dengan JOIN ke mapping**
- [ ] **Step 4: Verifikasi sintaks route**

---

### Task 2: Frontend Modal `MappingJenisModal.jsx` & Integrasi di `data-gaji/page.js`

**Files:**
- Create: `src/components/penggajian/MappingJenisModal.jsx`
- Modify: `src/app/dashboard/penggajian/data-gaji/page.js`

- [ ] **Step 1: Buat komponen `MappingJenisModal.jsx`**
- [ ] **Step 2: Pasang tombol "Mapping Jenis" dan modal di `data-gaji/page.js`**
- [ ] **Step 3: Verifikasi tampilan UI**

---

### Task 3: Pemisahan Halaman/Tabel Cetak Gaji di `PrintGajiReport.js`

**Files:**
- Modify: `src/components/penggajian/PrintGajiReport.js`

- [ ] **Step 1: Update pengelompokan kontrak di `PrintGajiReport.js` agar `>= 2018` pecah per kategori**
- [ ] **Step 2: Jalankan `graphify update .` dan verifikasi**
