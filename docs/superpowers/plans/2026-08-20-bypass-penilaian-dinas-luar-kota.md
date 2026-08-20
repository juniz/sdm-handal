# Bypass Penilaian Izin Dinas Luar Kota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengotomatiskan proses pembuatan, pemberian skor penuh (100), dan persetujuan otomatis (*auto-approved*) pada penilaian kinerja harian untuk pegawai yang memiliki izin dinas luar kota yang telah disetujui.

**Architecture:** 
- Pada backend Next.js API (`/api/penilaian/harian`), inisialisasi penilaian harian secara otomatis mendeteksi izin dinas luar kota yang disetujui, menetapkan status `approved` dengan skor 100 untuk absensi dan kegiatan, serta membuat record kegiatan default.
- Pada backend submit action (`/api/penilaian/harian/[id]`), bypass validasi jam checkout shift dan minimal kegiatan.
- Pada frontend Next.js (`/dashboard/penilaian-kinerja/input`), tampilkan banner visual khusus dinas luar kota dan kunci form ke status read-only.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, MySQL (via db-helper), JavaScript / Node.js.

## Global Constraints

- Sesuai dengan spesifikasi `docs/superpowers/specs/2026-08-20-bypass-penilaian-dinas-luar-kota-design.md`.
- Pegawai dengan izin dinas luar kota yang disetujui mendapatkan skor absensi 100, skor kegiatan 100, skor total 100.
- Tidak mengubah alur penilaian untuk kondisi selain dinas luar kota (terlambat, cuti reguler, hadir biasa).

---

### Task 1: Update API Auto-Creation & Auto-Approval Penilaian Harian (`POST /api/penilaian/harian`)

**Files:**
- Modify: `src/app/api/penilaian/harian/route.js:450-500`

**Interfaces:**
- Consumes: `resolveAbsensi(pegawaiId, nik, tanggal, isTambahan)`
- Produces: `POST /api/penilaian/harian` response with `status: 'approved'`, `skor_kegiatan: 100`, `skor_absensi: 100`, `skor_total: 100` and default `kegiatan_harian` item if `nilai_kondisi === 'izin_dinas_luar'`.

- [ ] **Step 1: Update logic in `POST /api/penilaian/harian`**

Modifikasi saat membuat record `penilaian_harian` baru:
Jika `resAbsen.nilai_kondisi === 'izin_dinas_luar'`, set:
- `status`: `'approved'`
- `skor_kegiatan`: `100.00`
- `skor_absensi`: `100.00`
- `skor_total`: `100.00`
- `approved_at`: `new Date()`
- `catatan_supervisor`: `[Auto-Approved Sistem: Izin Dinas Luar Kota - Ref: ${resAbsen.ref_no || '-'}]`
- Sisipkan 1 record kegiatan otomatis ke tabel `kegiatan_harian` dengan judul `'Melaksanakan Tugas / Perjalanan Dinas Luar Kota'`, prioritas `'tinggi'`, status `'selesai'`.

- [ ] **Step 2: Verify syntax & error handling in `route.js`**

- [ ] **Step 3: Commit Task 1**
```bash
git add src/app/api/penilaian/harian/route.js
git commit -m "feat(penilaian): auto-create and auto-approve harian for dinas luar kota"
```

---

### Task 2: Update Submit & Validation Logic in `PUT` & `POST` `/api/penilaian/harian/[id]`

**Files:**
- Modify: `src/app/api/penilaian/harian/[id]/route.js:300-430`

**Interfaces:**
- Consumes: `penilaian_harian.nilai_kondisi`
- Produces: Allow submit without 1 mandatory activity and bypass checkout time validation when `nilai_kondisi === 'izin_dinas_luar'`.

- [ ] **Step 1: Update checkout time and activity validation in `POST /api/penilaian/harian/[id]`**

Di dalam handler `action === 'submit'`:
Jika `harian.nilai_kondisi === 'izin_dinas_luar'`:
- Skip validasi jam checkout shift.
- Jika `kegiatan.length === 0`, jangan throw error "Minimal harus ada 1 kegiatan", melainkan otomatis hitung `skorKegiatan = 100`, `skorTotal = 100`, dan set `status = 'approved'`.

- [ ] **Step 2: Commit Task 2**
```bash
git add src/app/api/penilaian/harian/[id]/route.js
git commit -m "feat(penilaian): bypass submit validations for dinas luar kota"
```

---

### Task 3: Update UI Input Penilaian Kinerja Harian (`/dashboard/penilaian-kinerja/input`)

**Files:**
- Modify: `src/app/dashboard/penilaian-kinerja/input/page.js`

**Interfaces:**
- Consumes: `attendanceInfo`, `harianRecord`
- Produces: Banner info khusus dinas luar kota, auto-creation trigger on page load if applicable, read-only UI with perfect score 100.

- [ ] **Step 1: Add Dinas Luar Kota banner and handling in `DailyInputContent`**

- Jika `attendanceInfo?.nilai_kondisi === 'izin_dinas_luar'` dan belum ada `harianRecord`, jalankan `startDraft()` otomatis agar langsung terbuat dan ter-approve.
- Render banner informatif bernuansa biru/teal di bagian atas:
  ```jsx
  {isDinasLuarKota && (
    <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl flex items-start gap-3 shadow-xs">
      <Plane/CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-sm font-figtree">Izin Dinas Luar Kota Terverifikasi</h4>
        <p className="text-xs mt-0.5 font-medium leading-relaxed">
          Penilaian kinerja harian tanggal ini otomatis diproses dan disetujui penuh (100) oleh sistem. Anda tidak diwajibkan melakukan absensi kantor maupun pengisian kegiatan harian.
        </p>
      </div>
    </div>
  )}
  ```
- Pastikan badge status menampilkan "Disetujui" dan seluruh estimasi nilai menampilkan 100.

- [ ] **Step 2: Commit Task 3**
```bash
git add src/app/dashboard/penilaian-kinerja/input/page.js
git commit -m "feat(penilaian): add dinas luar kota visual banner and auto-sync in input page"
```

---

### Task 4: Build Verification & End-to-End Check

**Files:**
- Test across frontend & backend

- [ ] **Step 1: Run `npm run build` in sdm repository**
```bash
npm run build
```
Verify build compiles with 0 errors.

- [ ] **Step 2: Commit final changes if any**
