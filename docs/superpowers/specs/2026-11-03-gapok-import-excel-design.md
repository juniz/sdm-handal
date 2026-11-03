# Import Excel & Template Gaji Pokok — Design Spec

**Date:** 2026-11-03  
**Route:** `/dashboard/penggajian/gapok`  
**Files Affected:**
- `src/app/api/pegawai/gapok/route.js` (modify)
- `src/app/dashboard/penggajian/gapok/page.js` (modify)

---

## 1. Goal

Tambah fitur download template Excel dan upload/import file Excel untuk update massal `gapok` pegawai di halaman `/dashboard/penggajian/gapok`. Template dikelompokkan per departemen.

---

## 2. API Changes (`/api/pegawai/gapok`)

### 2.1 Download Template (`GET /api/pegawai/gapok?action=template`)
- Query pegawai aktif (`stts_aktif = 'AKTIF'`), join `departemen`, urut berdasarkan `d.nama ASC, p.nama ASC`.
- Susun Excel via library `xlsx` (sudah terpasang di project):
  - Kolom: `NIK`, `Nama Pegawai`, `Departemen`, `Jabatan`, `Gaji Pokok`.
  - Beri baris pemisah antar departemen: `[">> DEPARTEMEN: <Nama>", "", "", "", ""]`.
  - Isi nominal `gapok` saat ini (jika ada) untuk memudahkan edit.
- Return buffer `.xlsx` dengan header `attachment; filename="Template_Gaji_Pokok_Pegawai.xlsx"`.

### 2.2 Import Excel (`POST /api/pegawai/gapok`)
- Terima `multipart/form-data` dengan field `file`.
- Parse buffer `.xlsx` / `.xls` via `XLSX.read`:
  - Lewati baris header (`NIK`) dan baris grup (`>> DEPARTEMEN:`).
  - Normalisasi nilai: NIK string, Gaji Pokok float/int (bersihkan titik/koma/spasi).
  - Validasi: NIK ada di tabel `pegawai`, gapok `>= 0`.
- Jalankan bulk update dalam `withTransaction`:
  - `UPDATE pegawai SET gapok = ? WHERE nik = ?`.
- Return JSON summary: `{ status: "success", data: { total_rows, success_count, error_count, errors } }`.

---

## 3. UI Changes (`/dashboard/penggajian/gapok/page.js`)

1. **Header Action:**
   - Tambah tombol "Import Excel" (icon `Upload` / `FileSpreadsheet`) di sebelah "Generate Gaji".
2. **Dialog Import Gaji Pokok:**
   - Tombol "Download Template Excel" memanggil endpoint template.
   - Dropzone / file input `.xlsx, .xls`.
   - Tombol "Upload & Simpan" dengan loading indicator.
   - Alert ringkasan hasil: jumlah baris sukses dan daftar baris gagal (jika ada).
   - Refresh data tabel otomatis saat sukses.

---

## 4. Verification

1. Download template -> file `.xlsx` terunduh, berisi pegawai aktif terurut per departemen.
2. Edit nominal `gapok` di file -> upload via dialog import.
3. Tabel `gapok` terupdate dan audit `Hanya Belum Diatur` berkurang sesuai data baru.
