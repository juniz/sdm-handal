# Mapping Jenis Pegawai untuk Print Gaji Kontrak >= 2018 — Design Spec

**Date:** 2026-10-27  
**Route:** `/dashboard/penggajian/data-gaji`  
**Files Affected:**
- `database/create_gaji_mapping_tables.sql` (new)
- `src/app/api/gaji-pegawai/mapping/route.js` (new)
- `src/components/penggajian/MappingJenisModal.jsx` (new)
- `src/app/dashboard/penggajian/data-gaji/page.js` (modify)
- `src/app/api/gaji-pegawai/print/route.js` (modify)
- `src/components/penggajian/PrintGajiReport.js` (modify)

---

## 1. Goal

Sediakan fitur mapping kategori jenis pegawai (misal: Nakes, Apoteker, Administrasi, Radiologi, dll. secara dinamis) pada halaman `/dashboard/penggajian/data-gaji`. Gunakan mapping tersebut untuk memisahkan halaman/tabel laporan cetak gaji (`PrintGajiReport.js`) bagi kelompok pegawai dengan tanggal mulai kontrak tahun 2018 ke atas (`>= 2018`).

---

## 2. Database Schema

Dibuat otomatis saat endpoint dipanggil (`CREATE TABLE IF NOT EXISTS`) serta didokumentasikan di `database/create_gaji_mapping_tables.sql`:

1. **`gaji_kategori_jenis`**
   - `id INT PRIMARY KEY AUTO_INCREMENT`
   - `nama VARCHAR(100) NOT NULL UNIQUE`
   - `urutan INT NOT NULL DEFAULT 0`
   - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
   - Seed awal (jika tabel kosong):
     - `(1, 'Nakes', 1)`
     - `(2, 'Apoteker', 2)`
     - `(3, 'Administrasi', 3)`
     - `(4, 'Radiologi', 4)`

2. **`gaji_pegawai_mapping`**
   - `nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci PRIMARY KEY`
   - `kategori_id INT NOT NULL`
   - `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
   - `INDEX idx_kategori_id (kategori_id)`

---

## 3. Backend API

### 3.1 `GET /api/gaji-pegawai/mapping`
- Memastikan tabel `gaji_kategori_jenis` & `gaji_pegawai_mapping` tersedia dan ter-seed.
- Mengambil daftar seluruh kategori (`ORDER BY urutan ASC, nama ASC`).
- Mengambil daftar pegawai kontrak (`p.stts_kerja NOT IN ('POL', 'PNS') AND p.stts_aktif = 'AKTIF'`) beserta:
  - `p.nik`, `p.nama`, `p.jbtn`, `p.departemen`, `d.nama as nama_departemen`, `p.mulai_kontrak`
  - `gpm.kategori_id`, `gkj.nama as nama_kategori`

### 3.2 `POST /api/gaji-pegawai/mapping`
Mendukung payload `action`:
- `add_kategori`: `{ action: "add_kategori", nama, urutan }` → tambah kategori baru.
- `update_kategori`: `{ action: "update_kategori", id, nama, urutan }` → ubah nama/urutan kategori.
- `delete_kategori`: `{ action: "delete_kategori", id }` → hapus kategori & lepas mapping terkait.
- `set_mapping`: `{ action: "set_mapping", nik_list: [...], kategori_id: number | null }` → simpan atau hapus (`null`) mapping untuk satu atau banyak NIK sekaligus (`INSERT ... ON DUPLICATE KEY UPDATE`).

### 3.3 `GET /api/gaji-pegawai/print`
- Tambahkan `LEFT JOIN gaji_pegawai_mapping gpm ON gp.nik = gpm.nik` dan `LEFT JOIN gaji_kategori_jenis gkj ON gpm.kategori_id = gkj.id`.
- Pilih kolom tambahan: `gpm.kategori_id`, `gkj.nama as kategori_jenis`, `COALESCE(gkj.urutan, 9999) as kategori_urutan`.

---

## 4. Frontend UI (`MappingJenisModal.jsx` & `data-gaji/page.js`)

1. **Header Button (`data-gaji/page.js`):**
   - Tambahkan tombol `"Mapping Jenis"` di samping tombol `"Cetak Laporan"` dan `"Pengaturan"`.
2. **Modal `MappingJenisModal.jsx`:**
   - **Tab 1 — Mapping Pegawai:**
     - Filter pencarian (NIK/Nama), filter Departemen, filter Status Mapping (`Semua`, `Belum Dimapping`, atau per Kategori), dan toggle `Hanya Kontrak >= 2018` (default: aktif).
     - Fitur Bulk Action: pilih beberapa pegawai lewat checkbox → pilih kategori tujuan → klik `"Terapkan"`.
     - Dropdown langsung pada tiap baris pegawai untuk mengubah kategori secara instan.
   - **Tab 2 — Kelola Kategori:**
     - Form tambah kategori baru (`nama`, `urutan`).
     - Daftar kategori dengan aksi edit nama/urutan dan hapus kategori.

---

## 5. Print Report Logic (`PrintGajiReport.js`)

Saat `groupByContract === true`:
1. **Kontrak `< 2018` (`BELOW_2018`):**
   - Tetap 1 grup gabungan dengan sub-label `TMT KONTRAK: DI BAWAH TAHUN 2018`.
2. **Kontrak `>= 2018` (`2018_AND_ABOVE`):**
   - Dikelompokkan berdasarkan `kategori_jenis` (diurutkan menurut `kategori_urutan ASC, kategori_jenis ASC`).
   - Setiap kategori yang memiliki pegawai dirender menjadi grup/halaman terpisah (lengkap dengan nomor urut mulai dari 1, total grup, dan blok tanda tangan Karumkit & Bendahara) dengan sub-label:
     `TMT KONTRAK: TAHUN 2018 KE ATAS - [NAMA KATEGORI UPPERCASE]`
   - Pegawai `>= 2018` yang belum memiliki kategori (`kategori_jenis == null`) dikelompokkan di akhir bagian 2018 ke atas dengan sub-label:
     `TMT KONTRAK: TAHUN 2018 KE ATAS (BELUM DIMAPPING)`
3. **Belum Ada Kontrak (`NO_CONTRACT`):**
   - Tetap dirender di grup terakhir bila ada data (`TMT KONTRAK: BELUM ADA TMT KONTRAK`).

---

## 6. Verification Plan

1. Buka `/dashboard/penggajian/data-gaji`, klik tombol **Mapping Jenis**.
2. Tambah/edit kategori jenis (misal Nakes, Apoteker, Administrasi, Radiologi) dan petakan pegawai kontrak `>= 2018` ke kategori tersebut.
3. Klik **Cetak Laporan** → pilih **Kelompok Kontrak** → klik **Buka Laporan**.
4. Pastikan PDF menampilkan:
   - Grup `< 2018` dalam 1 tabel gabungan.
   - Grup `>= 2018` terpisah per halaman/tabel sesuai kategori jenis (`TAHUN 2018 KE ATAS - NAKES`, `TAHUN 2018 KE ATAS - APOTEKER`, dst.) masing-masing dengan rekap total dan tanda tangan sendiri.
