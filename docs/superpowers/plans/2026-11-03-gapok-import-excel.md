# Import Excel & Template Gaji Pokok Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan fitur download template Excel (terkelompok per departemen) dan import update massal gapok di `/dashboard/penggajian/gapok`.

**Architecture:**
1. Endpoint `GET /api/pegawai/gapok?action=template`: query pegawai aktif terurut departemen, buat worksheet dengan header pemisah departemen, return `.xlsx` stream.
2. Endpoint `POST /api/pegawai/gapok`: terima `FormData` file Excel, parse buffer di memori via `xlsx`, update `gapok` pegawai via transaction, return statistik hasil.
3. Halaman `/dashboard/penggajian/gapok/page.js`: tambah tombol "Import Excel" & Dialog upload dengan opsi download template + rekap upload.

**Tech Stack:** Next.js App Router, React 18/19, Tailwind CSS, `xlsx` (SheetJS), Radix Dialog, `lucide-react`.

---

### Task 1: Backend Template & Import Endpoint

**Files:**
- Modify: `src/app/api/pegawai/gapok/route.js`

- [ ] **Step 1: Tambahkan handler `action === 'template'` di `GET`**
- [ ] **Step 2: Tambahkan handler `POST` untuk upload & parse file Excel**
- [ ] **Step 3: Verifikasi sintaks route dengan `node --check`**

---

### Task 2: Frontend Import Dialog di Halaman Gaji Pokok

**Files:**
- Modify: `src/app/dashboard/penggajian/gapok/page.js`

- [ ] **Step 1: Tambah state modal import & fungsi handler download template / upload file**
- [ ] **Step 2: Tambah tombol "Import Excel" di header dan dialog import di JSX**
- [ ] **Step 3: Verifikasi sintaks dan `graphify update .`**
