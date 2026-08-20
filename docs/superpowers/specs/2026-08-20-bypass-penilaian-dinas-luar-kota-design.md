# Desain: Bypass Penilaian Kinerja Harian untuk Izin Dinas Luar Kota

**Tanggal:** 2026-08-20  
**Status:** Draft / Pending Review  
**Tujuan:** Mengotomatiskan proses penilaian kinerja harian bagi pegawai yang sedang melaksanakan tugas dinas luar kota (berdasarkan `pengajuan_izin` yang telah disetujui), sehingga pegawai tidak diwajibkan melakukan presensi kantor maupun pengisian kegiatan kerja harian, dan mendapatkan nilai penuh (100) berstatus disetujui (*auto-approved*).

---

## 1. Latar Belakang & Masalah

Pegawai yang ditugaskan dinas luar kota memiliki surat/pengajuan izin resmi (`pengajuan_izin` dengan `urgensi = 'Dinas Luar Kota'` dan status `'Disetujui'`). Pada kondisi tersebut:
1. Pegawai tidak berada di lokasi kantor sehingga tidak dapat melakukan absensi datang/pulang reguler.
2. Pegawai tidak mengerjakan to-do list harian kantor reguler sehingga tidak relevan mengisi daftar kegiatan per jam.
3. Sebelumnya, proses pengiriman penilaian harian masih memblokir pengiriman jika item kegiatan kosong (`kegiatan.length === 0`) dan memvalidasi jam checkout shift, serta `skor_kegiatan` menjadi `0` jika tidak ada item kegiatan yang dicatat.

---

## 2. Kebutuhan Fungsional & Solusi

### 2.1 Deteksi Izin Dinas Luar Kota
- Sistem memeriksa tabel `pengajuan_izin` dengan kriteria:
  - `nik = pegawai.nik`
  - `status = 'Disetujui'`
  - `urgensi = 'Dinas Luar Kota'`
  - `tanggal_awal <= tanggal_evaluasi AND tanggal_akhir >= tanggal_evaluasi`
- Jika ditemukan, sistem menetapkan status kondisi menjadi `izin_dinas_luar` dengan referensi nomor pengajuan (`ref_izin_no`).

### 2.2 Auto-Creation & Auto-Approval Penilaian Harian
Ketika draf dibuat atau diakses (`POST /api/penilaian/harian` atau resolusi saat memuat data):
- `penilaian_harian` otomatis dibuat dengan atribut:
  - `sumber_absensi`: `'izin'`
  - `ref_izin_no`: `pengajuan_izin.no_pengajuan`
  - `nilai_kondisi`: `'izin_dinas_luar'`
  - `skor_absensi`: `100.00`
  - `skor_kegiatan`: `100.00`
  - `skor_total`: `100.00`
  - `status`: `'approved'`
  - `approved_at`: `NOW()`
  - `catatan_supervisor`: `'[Auto-Approved Sistem: Izin Dinas Luar Kota - Ref: {no_pengajuan}]'`
- Sistem otomatis menyisipkan 1 record default di `kegiatan_harian`:
  - `judul_kegiatan`: `'Melaksanakan Tugas / Perjalanan Dinas Luar Kota'`
  - `penjabaran`: `'Tugas dinas luar kota sesuai pengajuan izin nomor {no_pengajuan}'`
  - `status_selesai`: `'selesai'`
  - `prioritas`: `'tinggi'`
  - `urutan`: `1`
  - `selesai_at`: `NOW()`

### 2.3 Bypass Validasi API
Pada endpoint `src/app/api/penilaian/harian/route.js` dan `src/app/api/penilaian/harian/[id]/route.js`:
- Jika `nilai_kondisi === 'izin_dinas_luar'` atau `sumber_absensi === 'izin'` untuk Dinas Luar Kota:
  1. Bypass validasi minimal 1 kegiatan harian (jika form disubmit tanpa item tambahan, tetap lolos dengan `skor_kegiatan = 100`).
  2. Bypass validasi jam pulang shift (tidak perlu menunggu jam pulang shift untuk pengiriman).
  3. Perhitungan skor kegiatan: jika tidak ada kegiatan manual, otomatis `skor_kegiatan = 100.00` dan `skor_total = 100.00`.

### 2.4 Antarmuka Pengguna (UI Frontend)
Pada halaman `/dashboard/penilaian-kinerja/input`:
- Jika terdeteksi kondisi `izin_dinas_luar`:
  - Tampilkan banner visual informatif:
    > **Izin Dinas Luar Kota Terverifikasi & Disetujui Otomatis**  
    > *Penilaian harian Anda untuk tanggal ini telah otomatis diproses dengan nilai penuh (100) dan disetujui sistem.*
  - Form berada dalam mode *Read-Only* yang rapi.
  - Estimasi nilai harian menampilkan skor Kegiatan: 100, Absensi: 100, Total: 100.

### 2.5 Sinkronisasi Rekap Bulanan
- Rekap bulanan (`rekap_bulanan`) menghitung hari dinas luar kota yang berstatus `approved` sebagai bagian dari `hari_approved`, sehingga **tidak menimbulkan `gap_hari`** dan **tidak ada pemotongan uang jasa dasar**.

---

## 3. Rencana Perubahan Berkas

| No | Berkas | Aksi | Deskripsi Perubahan |
|---|---|---|---|
| 1 | `src/app/api/penilaian/harian/route.js` | **MODIFY** | Tambah auto-approve dan auto-insert kegiatan saat inisialisasi penilaian harian jika terdeteksi izin dinas luar kota. |
| 2 | `src/app/api/penilaian/harian/[id]/route.js` | **MODIFY** | Bypass validasi jam pulang dan validasi minimal kegiatan untuk izin dinas luar kota, serta pastikan kalkulasi skor tetap 100. |
| 3 | `src/app/api/penilaian/absensi-status/route.js` | **MODIFY** | Pastikan respon endpoint menyertakan flag/kondisi `izin_dinas_luar` dengan lengkap. |
| 4 | `src/app/dashboard/penilaian-kinerja/input/page.js` | **MODIFY** | Tampilkan banner khusus dinas luar kota dan sesuaikan status read-only ketika izin dinas luar kota aktif. |

---

## 4. Rencana Verifikasi & Pengujian

1. **Pengujian API (`POST /api/penilaian/harian`)**:
   - Buat pengajuan izin `Dinas Luar Kota` dengan status `Disetujui`.
   - Panggil `POST /api/penilaian/harian` untuk tanggal izin tersebut.
   - Verifikasi record dibuat dengan `status = 'approved'`, `skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, dan 1 kegiatan default tersimpan.
2. **Pengujian UI (`/dashboard/penilaian-kinerja/input`)**:
   - Buka halaman penilaian pada tanggal izin dinas luar kota.
   - Verifikasi banner info dinas luar kota muncul dengan jelas dan form terkunci (read-only) dengan skor 100.
3. **Pengujian Rekap Kinerja Bulanan**:
   - Periksa apakah tanggal dinas luar kota terhitung sebagai hari approved (tidak ada gap hari).
4. **Build & Lint Validation**:
   - Jalankan `npm run build` di direktori `sdm` untuk memastikan tidak ada error kompilasi.
