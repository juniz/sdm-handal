# Design Spec: Bypass Penilaian Kinerja Harian untuk Pengajuan Izin

## 1. Objective
Menambahkan bypass otomatis penilaian kinerja harian (skor 100%, status auto-approved) untuk pegawai yang memiliki `pengajuan_izin` berstatus `'Disetujui'` dengan urgensi selain `'Dinas Dalam Kota'` (mencakup `'Dinas Luar Kota'`, `'Perjalanan Dinas'`, dan `'Lain-lain'`). Fitur diintegrasikan ke dalam modul deteksi cuti/izin admin (`/dashboard/it/deteksi-cuti`), API penilaian harian, serta halaman input penilaian kinerja harian pegawai (`/dashboard/penilaian-kinerja/input`).

---

## 2. Business Rules & Scope

1. **Eligibilitas Bypass**:
   - Sumber data: tabel `pengajuan_izin`.
   - Status: `'Disetujui'` (atau variasi lowercase: `setuju`, `approved`, `acc`).
   - Urgensi yang **DIBYPASS**:
     - `Dinas Luar Kota`
     - `Perjalanan Dinas`
     - `Lain-lain`
   - Urgensi yang **TIDAK DIBYPASS**:
     - `Dinas Dalam Kota` (pegawai tetap wajib presensi dan input kegiatan harian normal).

2. **Atribut Penilaian Harian**:
   - `skor_absensi`: `100`
   - `skor_kegiatan`: `100`
   - `skor_total`: `100`
   - `status`: `'approved'`
   - `sumber_absensi`: `'izin'`
   - `ref_izin_no`: `pengajuan_izin.no_pengajuan`
   - `ref_cuti_no`: `NULL`
   - `nilai_kondisi`:
     - `Dinas Luar Kota` $\rightarrow$ `'izin_dinas_luar'`
     - `Perjalanan Dinas` $\rightarrow$ `'izin_dinas'`
     - `Lain-lain` $\rightarrow$ `'izin_lainnya'`
   - `catatan_supervisor`: `[Auto-Approved Sistem: Izin ${urgensi} - Ref: ${no_pengajuan}]`

3. **Kegiatan Harian Otomatis**:
   - `judul_kegiatan`: `Melaksanakan Izin: ${urgensi}` (khusus `Dinas Luar Kota`: `Melaksanakan Tugas / Perjalanan Dinas Luar Kota`)
   - `penjabaran`: `Izin resmi (${urgensi}) sesuai pengajuan nomor ${no_pengajuan}`
   - `prioritas`: `'tinggi'`
   - `status_selesai`: `'selesai'`
   - `selesai_at`: `NOW()`

---

## 3. Architecture & Code Changes

### A. Backend NestJS (`website/backend`)
- **`src/sdm/repositories/deteksi-cuti.repository.ts`**:
  - Update query `pengajuan_izin` di `findDetectedLeaves`: ubah filter `urgensi` dari hanya dinas luar menjadi `pi.urgensi != 'Dinas Dalam Kota'` atau `pi.urgensi IN ('Perjalanan Dinas', 'Lain-lain', 'Dinas Luar Kota')`.
  - Update mapping `nilai_kondisi` agar dinamis per urgensi (`mapIzinToKondisi`).
  - Update `executeBypassTransaction`:
    - Set `catatan_supervisor`, `judul_kegiatan`, dan `penjabaran` dinamis sesuai `item.urgensi`.
    - Set `nilai_kondisi` sesuai mapped izin.
- **`src/sdm/dto/deteksi-cuti-types.ts`**:
  - Pastikan enum/filter `tipeDispensasi` mendukung filtering izin umum (`ALL`, `CUTI`, `DINAS_LUAR` / `IZIN`).

### B. Next.js SDM App (`sdm`)
- **`src/app/api/it/deteksi-cuti/route.js`**:
  - Update query `pengajuan_izin` agar mencakup urgensi selain `'Dinas Dalam Kota'`.
  - Update fallback REST bypass handler untuk mapping judul kegiatan dan catatan supervisor dinamis.
- **`src/app/api/penilaian/harian/route.js`**:
  - Pada pembuatan penilaian awal (`POST`), tambahkan deteksi `isIzinBypassed = resAbsen.sumber === 'izin' && resAbsen.nilai_kondisi !== 'izin_dinas_dalam'`.
  - Otomatis set 100/100/100, `status = 'approved'`, insert default kegiatan harian izin.
- **`src/app/api/penilaian/harian/[id]/route.js`**:
  - Pada submit/update harian, pertahankan status `approved` dan skor 100 jika `isIzinBypassed`.
- **`src/app/dashboard/penilaian-kinerja/input/page.js`**:
  - Perluas variable `isBypassedLeaveOrDuty` untuk mencakup semua izin yang diizinkan bypass (`attendanceInfo?.sumber === 'izin' && attendanceInfo?.nilai_kondisi !== 'izin_dinas_dalam'`).
  - Tampilkan banner auto-approved yang merefleksikan tipe izin (`Bypass Izin: ${urgensi}`).
- **`src/app/dashboard/it/deteksi-cuti/page.js`**:
  - Update label filter & filter logic dari "Dinas Luar" menjadi "Izin (Dinas & Lainnya)".
  - Tampilkan badge spesifik berdasarkan urgensi izin (`Dinas Luar Kota`, `Perjalanan Dinas`, `Lain-lain`).

---

## 4. Verification Plan

### Automated Tests
- Unit tests di `website/backend`:
  ```bash
  npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/deteksi-cuti.service.spec.ts
  ```
- Build check backend:
  ```bash
  npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend run build
  ```
- Build check frontend:
  ```bash
  npm --prefix /Users/hardiko/Documents/Developer/NEXT/sdm run build
  ```

### Manual Verification
- Cek query detection endpoint untuk memastikan izin `Perjalanan Dinas` dan `Lain-lain` terdeteksi dengan status `perlu_bypass`.
- Cek izin `Dinas Dalam Kota` tidak masuk dalam daftar bypass.
- Jalankan simulasi bypass untuk izin `Perjalanan Dinas` dan `Lain-lain` lalu verifikasi record di `penilaian_harian` dan `kegiatan_harian`.
