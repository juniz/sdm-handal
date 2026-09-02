# Design Spec: Deteksi & Bypass Izin Dinas Luar Kota

## 1. Objective
Menambahkan deteksi otomatis dan bypass penilaian harian 100% untuk pegawai dengan `pengajuan_izin` berstatus `'Disetujui'` dan `urgensi = 'Dinas Luar Kota'` yang overlap dengan jadwal kerja shift. Fitur diintegrasikan ke dalam Tab 1 ("Deteksi Cuti & Dinas Luar") di `/dashboard/it/deteksi-cuti`.

---

## 2. Backend Design (NestJS GraphQL)

### A. DTOs (`src/sdm/dto/deteksi-cuti-types.ts`)
- `DeteksiCutiFilterInput`:
  - `tipeDispensasi?: string` (`'ALL' | 'CUTI' | 'DINAS_LUAR'`)
- `DeteksiCutiItemDto`:
  - `jenis_dispensasi: string` (`'cuti' | 'izin_dinas'`)
  - `ref_izin_no?: string`
- `BypassCutiItemInput`:
  - `jenis_dispensasi?: string`

### B. Repository Layer (`src/sdm/repositories/deteksi-cuti.repository.ts`)
1. **`findDetectedLeaves(filter)`**:
   - Ambil `pengajuan_cuti` (status `'Disetujui'`).
   - Ambil `pengajuan_izin` (status `'Disetujui'` AND `urgensi = 'Dinas Luar Kota'`).
   - Gabungkan list dengan penanda `jenis_dispensasi`.
   - Iterasi tanggal & overlap shift kerja (abaikan shift `OFF`, `Libur`, `-`).
   - Format `nilai_kondisi`:
     - Cuti: `mapCutiToKondisi(urgensi)`
     - Dinas Luar Kota: `'izin_dinas_luar'`
2. **`executeBypassTransaction(items)`**:
   - Jika `item.jenis_dispensasi === 'izin_dinas'`:
     - `sumber_absensi = 'izin'`, `ref_izin_no = item.no_pengajuan`, `ref_cuti_no = NULL`, `nilai_kondisi = 'izin_dinas_luar'`.
     - `catatan_supervisor = '[Auto-Approved Sistem: Izin Dinas Luar Kota - Ref: ' + item.no_pengajuan + ']'`.
     - Insert default `kegiatan_harian`:
       - `judul_kegiatan = 'Melaksanakan Tugas / Perjalanan Dinas Luar Kota'`
       - `penjabaran = 'Tugas dinas luar kota sesuai pengajuan izin resmi ' + item.no_pengajuan`
   - Jika `item.jenis_dispensasi === 'cuti'`:
     - `sumber_absensi = 'cuti'`, `ref_cuti_no = item.no_pengajuan`, `ref_izin_no = NULL`.
     - Default activity cuti.
   - Skor: 100/100/100, `status = 'approved'`, `dibuat_oleh = item.pegawai_id`.

---

## 3. Frontend Design (Next.js `sdm`)

1. **GraphQL Client (`src/lib/deteksi-cuti-gql-client.js`)**:
   - Request `jenis_dispensasi` dan `ref_izin_no` pada query `deteksiCuti`.
   - Kirim `jenis_dispensasi` pada mutation `bypassCuti`.
2. **UI (`src/app/dashboard/it/deteksi-cuti/page.js`)**:
   - Tab 1 header: "Deteksi Cuti & Dinas Luar".
   - Filter bar: Tambah filter tipe dispensasi (Semua, Hanya Cuti, Hanya Dinas Luar Kota).
   - Table row & mobile card: Badge tipe dispensasi (Cuti: Cyan/Sky badge, Dinas Luar Kota: Indigo/Purple badge).
   - Modal konfirmasi bulk bypass: Tampilkan rincian cuti vs dinas luar kota.

---

## 4. Verification Plan
1. Unit tests di `website/backend` (`deteksi-cuti.repository.spec.ts` & `deteksi-cuti.service.spec.ts`).
2. NestJS build (`npm run build` di `website/backend`).
3. Next.js build (`npm run build` di `sdm`).
