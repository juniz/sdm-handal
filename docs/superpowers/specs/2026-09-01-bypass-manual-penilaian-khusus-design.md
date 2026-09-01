# Design Spec: Bypass Manual Penilaian Khusus Pegawai

## 1. Objective
Menambahkan fitur Bypass Penilaian Harian 100% untuk pegawai tertentu tanpa bergantung pada data pengajuan cuti maupun izin di database. Fitur ini diakses melalui Tab "Bypass Khusus Pegawai" di halaman `/dashboard/it/deteksi-cuti`.

---

## 2. Arsitektur Backend (NestJS GraphQL)

### A. DTOs & Types (`src/sdm/dto/deteksi-cuti-types.ts`)
```typescript
@InputType()
export class BypassManualPegawaiInput {
  @Field(() => Int)
  pegawai_id: number;

  @Field()
  tanggal_awal: string; // YYYY-MM-DD

  @Field()
  tanggal_akhir: string; // YYYY-MM-DD

  @Field({ nullable: true })
  shift?: string; // Optional: jika kosong, sistem auto-lookup dari jadwal_pegawai / default shift

  @Field({ nullable: true })
  alasan?: string; // e.g., "Tugas Khusus Luar Kota / Dispensasi"
}

@ObjectType()
export class BypassManualResultDto {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  processedCount: number;

  @Field(() => [String], { nullable: true })
  processedDates?: string[];
}
```

### B. Repository Layer (`src/sdm/repositories/deteksi-cuti.repository.ts`)
Method baru:
```typescript
async executeManualBypassTransaction(
  input: BypassManualPegawaiInput,
): Promise<BypassManualResultDto>
```
Logika:
1. Validasi rentang tanggal (`tanggal_awal` <= `tanggal_akhir`).
2. Generate array tanggal dari `tanggal_awal` s.d. `tanggal_akhir`.
3. Jalankan `this.dataSource.transaction(async (manager) => { ... })`.
4. Untuk setiap tanggal:
   - Cek shift: jika `input.shift` diberikan gunakan nilai tsb; jika tidak, cari dari `jadwal_pegawai` / `jadwal_tambahan` pada kolom `h${day}`. Jika tidak ada jadwal, gunakan fallback `'Pagi'` atau `'Non-Shift'`.
   - Cek record `penilaian_harian` (`WHERE pegawai_id = ? AND DATE(tanggal) = DATE(?)`).
   - Jika ada: `UPDATE` skor 100/100/100, `status = 'approved'`, `sumber_absensi = 'manual_bypass'`, `nilai_kondisi = 'Bypass Khusus'`, `catatan_supervisor = input.alasan`.
   - Jika belum ada: `INSERT` record `penilaian_harian` baru dengan nilai di atas.
   - Cek `kegiatan_harian`: jika belum ada kegiatan untuk `penilaian_id`, `INSERT` kegiatan default: `Bypass Nilai Khusus (${input.alasan || 'Penetapan Khusus SDM/IT'})`.
5. Return summary hari yang berhasil di-bypass.

### C. Service & Resolver
- **`DeteksiCutiService`**:
  - `processManualBypass(userId, dept, input: BypassManualPegawaiInput)`
  - Memverifikasi hak akses IT/SDM/SPI melalui `isAuthorized(userId, dept)`.
- **`DeteksiCutiResolver`**:
  - Mutation `@Mutation(() => BypassManualResultDto, { name: 'bypassManualPegawai' })`.

---

## 3. Integrasi Frontend (Next.js `sdm`)

1. **GraphQL Client Helper (`src/lib/deteksi-cuti-gql-client.js`)**:
   - Fungsi `executeBypassManualGql(input)` memanggil mutation `bypassManualPegawai`.
   - Fungsi `searchPegawaiList(keyword)` untuk auto-suggest input pegawai.

2. **Halaman `/dashboard/it/deteksi-cuti/page.js`**:
   - Navigation Tab:
     - **Tab 1: Deteksi Cuti Terjadwal** (Tabel & Bulk Scan Cuti yang sudah ada).
     - **Tab 2: Bypass Khusus Pegawai** (Form input manual pegawai tertentu).
   - Form Bypass Khusus:
     - Input Pegawai (Search NIK / Nama Pegawai).
     - Rentang Tanggal (Tanggal Awal & Tanggal Akhir).
     - Pilihan Shift ("Auto dari Jadwal Pegawai", "Pagi", "Siang", "Malam", "Non-Shift").
     - Alasan / Keterangan Dispensasi.
     - Tombol konfirmasi & modal eksekusi.

---

## 4. Rencana Verifikasi
1. Unit tests di `website/backend` (`deteksi-cuti.service.spec.ts` & `deteksi-cuti.repository.spec.ts`).
2. Build NestJS (`npm run build` di `website/backend`).
3. Build Next.js (`npm run build` di `sdm`).
