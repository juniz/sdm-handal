# Desain: Menu Deteksi Cuti Pegawai & Bypass Penilaian Kinerja Harian

**Tanggal:** 2026-09-01  
**Status:** Draft / Pending Review  
**Tujuan:** Menyediakan menu admin untuk mendeteksi cuti pegawai yang disetujui (`pengajuan_cuti`), mencocokkannya dengan jadwal shift kerja, dan mengeksekusi bypass penilaian harian (`penilaian_harian`) dengan nilai penuh 100% serta status disetujui otomatis (*auto-approved*), baik secara massal (batch) melalui dashboard admin maupun on-the-fly di halaman input penilaian.

---

## 1. Latar Belakang & Masalah

1. Pegawai yang mengambil hak cuti resmi (`pengajuan_cuti` dengan status `'Disetujui'`) tidak hadir di kantor dan tidak mengerjakan to-do list harian kerja.
2. Sebelumnya, data cuti di `penilaian_harian` masih berstatus `draft` dengan `skor_kegiatan = 0`, sehingga jika pegawai tidak mengisi form, tanggal tersebut tidak berstatus `approved` dan menimbulkan `gap_hari` pada rekap bulanan (`rekap_bulanan`), yang berdampak pada pemotongan uang jasa dasar.
3. Administrator SDM / IT membutuhkan menu khusus untuk memonitor, mendeteksi, dan mem-bypass data penilaian harian pegawai yang sedang cuti secara massal per rentang tanggal atau per bulan.

---

## 2. Kebutuhan Fungsional & Solusi

### 2.1 Deteksi Cuti Berdasarkan Jadwal Shift
Sistem mendeteksi cuti dengan kriteria:
1. `pengajuan_cuti` dengan `status = 'Disetujui'` di mana `tanggal_awal <= target_date AND tanggal_akhir >= target_date`.
2. Pegawai memiliki jadwal shift aktif pada `target_date` di `jadwal_pegawai` atau `jadwal_tambahan` (bukan `OFF` / `Libur` / kosong).
3. Status keterkaitan di `penilaian_harian`:
   - `belum_dibuat`: Belum ada record `penilaian_harian` untuk pegawai dan tanggal tersebut.
   - `draft` / `submitted` / `revisi`: Record sudah ada tetapi belum disetujui atau skor belum 100%.
   - `approved_100`: Record sudah berstatus `approved` dengan skor 100 (sudah tuntas).

### 2.2 Aturan Bypass & Auto-Approval (Nilai Penuh 100)
Ketika dilakukan bypass (baik via menu deteksi cuti maupun on-the-fly saat draf diakses):
- Record `penilaian_harian` di-create/update dengan atribut:
  - `sumber_absensi`: `'cuti'`
  - `ref_cuti_no`: `pengajuan_cuti.no_pengajuan`
  - `nilai_kondisi`: `mapCutiToKondisi(urgensi)` (contoh: `cuti_tahunan`, `sakit`, `cuti_melahirkan`, dll.)
  - `skor_absensi`: `100.00`
  - `skor_kegiatan`: `100.00`
  - `skor_total`: `100.00`
  - `status`: `'approved'`
  - `approved_at`: `NOW()`
  - `catatan_supervisor`: `'[Auto-Approved Sistem: Cuti {urgensi} - Ref: {no_pengajuan}]'`
- Sistem otomatis memastikan 1 record di `kegiatan_harian`:
  - `judul_kegiatan`: `'Melaksanakan Cuti {urgensi}'`
  - `penjabaran`: `'Cuti {urgensi} sesuai pengajuan nomor {no_pengajuan}'`
  - `status_selesai`: `'selesai'`
  - `prioritas`: `'tinggi'`
  - `urutan`: `1`
  - `selesai_at`: `NOW()`

### 2.3 Bypass Validasi API
Pada endpoint API `src/app/api/penilaian/harian/route.js` dan `src/app/api/penilaian/harian/[id]/route.js`:
- Jika `sumber_absensi === 'cuti'` atau terdeteksi `pengajuan_cuti` yang disetujui:
  1. Bypass validasi minimal 1 kegiatan harian manual.
  2. Bypass validasi jam pulang shift.
  3. Set skor otomatis 100/100/100 dan status `approved`.

---

## 3. Arsitektur Komponen & Endpoint

### 3.1 Backend API

#### 1. `GET /api/it/deteksi-cuti`
- **Tujuan**: Scan dan ambil daftar cuti pegawai yang beririsan dengan jadwal shift.
- **Otorisasi**: Admin (IT, SDM, SPI).
- **Parameter**:
  - `tanggal_awal` (YYYY-MM-DD)
  - `tanggal_akhir` (YYYY-MM-DD)
  - `departemen` (Opsional, ID departemen atau 'ALL')
  - `search` (Opsional, NIK/Nama)
  - `status_filter` (Opsional, 'ALL', 'belum_dibuat', 'perlu_bypass', 'approved_100')
- **Output**:
  ```json
  {
    "success": true,
    "summary": {
      "total_cuti_shift": 15,
      "approved_100": 10,
      "perlu_bypass": 5
    },
    "data": [
      {
        "pegawai_id": 123,
        "nik": "19890101",
        "nama": "Dr. John Doe",
        "departemen": "MEDIS",
        "departemen_nama": "Pelayanan Medis",
        "tanggal": "2026-09-01",
        "shift": "Pagi",
        "no_pengajuan": "CUT/2026/09/001",
        "urgensi": "Tahunan",
        "nilai_kondisi": "cuti_tahunan",
        "penilaian_id": 456,
        "penilaian_status": "draft",
        "skor_total": 0,
        "status_bypass": "perlu_bypass"
      }
    ]
  }
  ```

#### 2. `POST /api/it/deteksi-cuti`
- **Tujuan**: Eksekusi bypass penilaian harian secara massal atau satuan.
- **Otorisasi**: Admin (IT, SDM, SPI).
- **Body**:
  ```json
  {
    "items": [
      {
        "pegawai_id": 123,
        "tanggal": "2026-09-01",
        "no_pengajuan": "CUT/2026/09/001",
        "urgensi": "Tahunan",
        "shift": "Pagi"
      }
    ]
  }
  ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Berhasil memproses 5 data cuti menjadi Approved (100%)",
    "processed_count": 5
  }
  ```

#### 3. Modifikasi Resolver Existing
- `src/app/api/penilaian/harian/route.js`: Auto-approve saat POST inisialisasi jika `sumber === 'cuti'`.
- `src/app/api/penilaian/harian/[id]/route.js`: Bypass jam pulang & validasi minimal kegiatan jika `sumber_absensi === 'cuti'`, pertahankan skor 100.
- `src/app/api/penilaian/absensi-status/route.js`: Return flag kondisi cuti konsisten.

---

### 3.2 Frontend UI

#### 1. Dashboard Admin Actions (`src/app/dashboard/page.js`)
- Tambahkan tombol menu:
  ```javascript
  {
    title: "Deteksi Cuti",
    description: "Deteksi cuti & bypass penilaian kinerja",
    icon: CalendarCheck,
    href: "/dashboard/it/deteksi-cuti"
  }
  ```

#### 2. Halaman Deteksi Cuti (`src/app/dashboard/it/deteksi-cuti/page.js`)
- **Header**: Judul, Deskripsi, Tombol Refresh.
- **Summary Cards**:
  - Total Jadwal Cuti Terdeteksi
  - Sudah Approved 100%
  - Belum Diproses (Perlu Bypass)
- **Filter Controls**:
  - Filter Rentang Tanggal (Tanggal Awal & Tanggal Akhir)
  - Filter Departemen (Dropdown Departemen)
  - Filter Status Bypass (Semua / Belum Diproses / Sudah Selesai)
  - Pencarian Nama/NIK
- **Tabel & Aksi**:
  - Checkbox multi-select + "Pilih Semua"
  - Tombol aksi massal: *"Bypass Terpilih"* & *"Bypass Semua yang Belum Diproses"*
  - Kolom: Checkbox, Pegawai (Nama, NIK, Dept), Tanggal & Shift, Info Cuti (Jenis & No. Ref), Status Penilaian, Aksi (Bypass Satuan).
  - Responsive Card View untuk tampilan mobile.

#### 3. Halaman Input Pegawai (`src/app/dashboard/penilaian-kinerja/input/page.js`)
- Banner informatif: *"Cuti Terverifikasi & Disetujui Otomatis (100%)"*.
- Mode *read-only* terkunci ketika tanggal yang dipilih merupakan tanggal cuti disetujui.

---

## 4. Rencana Perubahan Berkas

| No | Berkas | Aksi | Deskripsi Perubahan |
|---|---|---|---|
| 1 | `src/app/api/it/deteksi-cuti/route.js` | **NEW** | Endpoint scan pengajuan cuti vs jadwal & eksekusi bulk bypass penilaian harian. |
| 2 | `src/app/dashboard/it/deteksi-cuti/page.js` | **NEW** | Halaman UI Admin untuk scan, preview, dan eksekusi bypass cuti. |
| 3 | `src/app/dashboard/page.js` | **MODIFY** | Tambah menu kartu "Deteksi Cuti" di bagian `ADMIN_ACTIONS`. |
| 4 | `src/app/api/penilaian/harian/route.js` | **MODIFY** | Auto-approve 100% dan auto-insert kegiatan harian saat inisialisasi tanggal cuti. |
| 5 | `src/app/api/penilaian/harian/[id]/route.js` | **MODIFY** | Bypass jam pulang, minimal kegiatan, dan set status approved 100% untuk sumber cuti. |
| 6 | `src/app/dashboard/penilaian-kinerja/input/page.js` | **MODIFY** | Tambah banner info cuti terverifikasi dan kunci form menjadi read-only. |

---

## 5. Rencana Verifikasi & Pengujian

1. **Pengujian Scan API (`GET /api/it/deteksi-cuti`)**:
   - Query rentang tanggal di mana terdapat pegawai dengan cuti disetujui dan memiliki jadwal kerja.
   - Pastikan data terdeteksi dengan status `belum_dibuat` atau `perlu_bypass`.
2. **Pengujian Eksekusi Bypass (`POST /api/it/deteksi-cuti`)**:
   - Jalankan bypass massal untuk item terpilih.
   - Verifikasi record `penilaian_harian` tercipta dengan status `approved`, skor `100.00`, dan `kegiatan_harian` terisi default.
3. **Pengujian Frontend UI (`/dashboard/it/deteksi-cuti`)**:
   - Buka menu di browser sebagai role IT / SDM.
   - Uji filter tanggal, departemen, dan search.
   - Uji tombol bypass per baris dan bypass massal.
4. **Pengujian Input Pegawai (`/dashboard/penilaian-kinerja/input`)**:
   - Login / buka tanggal cuti pegawai, pastikan muncul banner info cuti 100% dan form berstatus approved (read-only).
5. **Build & Lint Validation**:
   - Jalankan `npm run build` di direktori `sdm` untuk memastikan tidak ada error kompilasi.
