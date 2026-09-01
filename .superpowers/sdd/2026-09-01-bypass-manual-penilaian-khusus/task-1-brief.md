# Task 1 Brief: Backend DTOs & Repository Layer for Manual Bypass

## Objective
Tambahkan DTO `BypassManualPegawaiInput` & `BypassManualResultDto` serta method `executeManualBypassTransaction` di `DeteksiCutiRepository`.

## Target Workspace
`/Users/hardiko/Documents/Developer/NEXT/website/backend`

## Target Files
- `src/sdm/dto/deteksi-cuti-types.ts`
- `src/sdm/repositories/deteksi-cuti.repository.ts`
- `src/sdm/repositories/deteksi-cuti.repository.spec.ts`

## Detailed Specifications

### 1. `src/sdm/dto/deteksi-cuti-types.ts`
Tambahkan:
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
  shift?: string;

  @Field({ nullable: true })
  alasan?: string;
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

### 2. `DeteksiCutiRepository`
Implementasikan method:
```typescript
async executeManualBypassTransaction(
  input: BypassManualPegawaiInput,
): Promise<BypassManualResultDto>
```
Logika:
1. Parse dan validasi `input.tanggal_awal` & `input.tanggal_akhir`. Loop semua tanggal dari awal ke akhir (format `YYYY-MM-DD`).
2. Masuk ke `this.dataSource.transaction(async (manager) => { ... })`.
3. Untuk setiap tanggal:
   - Tentukan shift: jika `input.shift` diberikan dan bukan `'AUTO'`, gunakan `input.shift`. Jika tidak, cari dari `jadwal_pegawai` / `jadwal_tambahan` kolom `h${day}`. Jika tidak ada / OFF, fallback ke `'Pagi'`.
   - Cek record `penilaian_harian` (`WHERE pegawai_id = ? AND DATE(tanggal) = DATE(?)`).
   - Jika ada: `UPDATE penilaian_harian SET shift_jadwal = ?, sumber_absensi = 'manual_bypass', ref_cuti_no = ?, nilai_kondisi = 'Bypass Khusus', skor_kegiatan = 100, skor_absensi = 100, skor_total = 100, status = 'approved', catatan_supervisor = ? WHERE id = ?`.
   - Jika belum ada: `INSERT INTO penilaian_harian (pegawai_id, tanggal, shift_jadwal, sumber_absensi, ref_cuti_no, nilai_kondisi, skor_kegiatan, skor_absensi, skor_total, status, catatan_supervisor) VALUES (?, ?, ?, 'manual_bypass', ?, 'Bypass Khusus', 100, 100, 100, 'approved', ?)`.
   - Cek `kegiatan_harian` untuk `penilaian_id`. Jika 0 baris: `INSERT INTO kegiatan_harian (penilaian_id, judul_kegiatan, penjabaran, status_selesai, urutan) VALUES (?, ?, ?, 1, 1)` dengan judul `Bypass Nilai Khusus (${input.alasan || 'Dispensasi'})`.
4. Return summary hasil.

### 3. Unit Tests
Update `src/sdm/repositories/deteksi-cuti.repository.spec.ts` menguji eksekusi `executeManualBypassTransaction`.

## Verification
- Run: `npm test -- src/sdm/repositories/deteksi-cuti.repository.spec.ts`
- Run: `npx tsc --noEmit`

## Git Commit
`feat(sdm): add manual bypass DTOs and repository transaction method`
