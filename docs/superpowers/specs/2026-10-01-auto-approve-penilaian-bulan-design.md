# Auto-Approve Penilaian Kinerja Pegawai Berdasarkan Bulan

## 1. Context & Objectives
Fitur auto-approve penilaian kinerja pegawai bulanan ditujukan bagi Administrator SDM/SPI pada halaman **Riwayat Pengawasan** (`/dashboard/penilaian-kinerja/riwayat-pengawasan`).
Fitur ini memproses secara massal penilaian harian pegawai yang masih tertahan di status:
1. `submitted` (menunggu persetujuan supervisor/pending).
2. `draft` (belum disubmit oleh pegawai).

Kriteria seleksi berbasis **Bulan** (`bulan`), **Tahun** (`tahun`), dan opsional **Departemen** (`departemen`).

---

## 2. Architecture & Flow

```
[Web UI: Riwayat Pengawasan]
         |
         | Klik "Auto-Approve Bulan Ini" + Konfirmasi Dialog
         v
[Next.js API: /api/penilaian/auto-approve]
         |
         | Forward JWT Bearer via GraphQL POST
         v
[NestJS Backend: RekapPengawasanResolver.autoApprovePenilaianBulan]
         |
         | Guard: GqlJwtSdmGuard (Role check: IT, SDM, SPI, or Pengawasan ACL)
         v
[RekapPengawasanService -> RekapPengawasanRepository]
         |
         | Database Transaction (TypeORM EntityManager):
         | 1. SELECT penilaian_harian WHERE MONTH = bulan AND YEAR = tahun AND status IN ('draft', 'submitted')
         | 2. Handle 'submitted': status = 'approved', approved_at = NOW(), approved_by = userId
         | 3. Handle 'draft': compute kegiatan score from kegiatan_harian (or 0), compute total score, status = 'approved', approved_at = NOW()
         v
[Return AutoApproveResultDto] -> [Next.js Route] -> [Web UI Toast + Refetch Data]
```

---

## 3. Detailed Component Changes

### A. Backend (`website/backend`)
1. **`src/sdm/dto/rekap-pengawasan-types.ts`**:
   - Tambahkan DTO `AutoApproveResultDto`:
     ```typescript
     @ObjectType()
     export class AutoApproveResultDto {
       @Field(() => Boolean)
       success: boolean;

       @Field(() => String)
       message: string;

       @Field(() => Int)
       totalProcessed: number;

       @Field(() => Int)
       totalSubmitted: number;

       @Field(() => Int)
       totalDraft: number;
     }
     ```

2. **`src/sdm/repositories/rekap-pengawasan.repository.ts`**:
   - Tambahkan method `autoApprovePenilaianBulan(bulan, tahun, departemen, userId)`:
     - Cari seluruh `penilaian_harian` terkait pegawai aktif di bulan & tahun target dengan status `draft` atau `submitted`.
     - Filter departemen jika bukan `'ALL'`.
     - Dalam transaksi database:
       - Ambil parameter bobot kegiatan (`KGT_BOBOT_TINGGI`, `KGT_BOBOT_SEDANG`, `KGT_BOBOT_RENDAH`).
       - Untuk setiap record:
         - Jika `submitted`: status diubah jadi `approved`, `approved_by = userId`, `approved_at = NOW()`, `catatan_supervisor = COALESCE(catatan_supervisor, '[Auto-Approved Pengawasan SDM]')`.
         - Jika `draft`: ambil kegiatan dari `kegiatan_harian`. Jika ada, hitung skor kegiatan. Jika kosong, skor kegiatan = 0. Tentukan `skor_absensi` (gunakan existing atau default 0 bila null). Hitung `skor_total = calculateSkorTotal(skor_kegiatan, skor_absensi, 60)`. Update status jadi `approved`, `approved_by = userId`, `approved_at = NOW()`, `catatan_supervisor = COALESCE(catatan_supervisor, '[Auto-Approved Pengawasan SDM - Draft]')`.
     - Kembalikan rekapitulasi jumlah item diproses.

3. **`src/sdm/rekap-pengawasan.service.ts`**:
   - Panggil repository method dan verifikasi otorisasi user (SDM, IT, SPI, atau pengawasan menu ACL).

4. **`src/sdm/rekap-pengawasan.resolver.ts`**:
   - Expose Mutation:
     ```typescript
     @Mutation(() => AutoApproveResultDto, { name: 'autoApprovePenilaianBulan' })
     async autoApprovePenilaianBulan(
       @CurrentUser() user: any,
       @Args('bulan', { type: () => Int }) bulan: number,
       @Args('tahun', { type: () => Int }) tahun: number,
       @Args('departemen', { type: () => String, nullable: true }) departemen?: string,
     ): Promise<AutoApproveResultDto>
     ```

### B. Frontend (`sdm`)
1. **`src/app/api/penilaian/auto-approve/route.js`**:
   - Endpoint `POST` menerima `{ bulan, tahun, departemen }`.
   - Mengambil token auth dari cookies, mengecek sesi.
   - Mengirim mutasi GraphQL `autoApprovePenilaianBulan` ke backend NestJS.
   - Merespons status sukses / error ke UI.

2. **`src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditFilters.jsx`**:
   - Tambahkan tombol `Auto-Approve Bulan Ini` (ikon centang ganda / check, styling distinct seperti emerald/indigo).
   - Modal konfirmasi:
     - Tampilkan informasi bulan, tahun, dan departemen yang akan diproses.
     - Penjelasan bahwa seluruh status draft dan pending akan disetujui otomatis.
   - State `loading` selama mutasi berjalan.
   - Callback `onAutoApproveSuccess` untuk merefresh tabel rekap pengawasan dan kartu ringkasan.

---

## 4. Edge Cases & Robustness
- **Bulan tanpa draft/pending**: Jika tidak ada data yang memenuhi kriteria, kembalikan pesan ramah tanpa error database.
- **Departemen filter**: `'ALL'` memproses seluruh unit; jika nama unit dipilih, hanya proses anggota unit tersebut.
- **Rollback Transaksi**: Kegagalan database pada baris tertentu akan me-rollback transaksi secara utuh untuk menjaga integritas data.
- **Skor Absensi Kosong pada Draft**: Jika draft belum memiliki absensi, beri fallback 0 agar tidak terjadi `NaN` atau `NULL` pada `skor_total`.

---

## 5. Verification Plan
1. **Backend Build & Lint**:
   - Jalankan `npm run build` di `website/backend` untuk memastikan tidak ada type/schema error.
2. **Frontend Build & Lint**:
   - Pastikan rute Next.js dan komponen JSX bersih dari lint error.
3. **End-to-End Verification**:
   - Trigger endpoint dengan parameter bulan dan verifikasi status `draft` dan `submitted` berubah menjadi `approved` serta perhitungan skor konsisten.
