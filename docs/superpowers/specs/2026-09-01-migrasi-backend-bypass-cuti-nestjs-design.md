# Design Spec: Migrasi Backend Deteksi Cuti & Bypass Penilaian ke NestJS

## 1. Context & Objective
Migrasi backend untuk fitur Deteksi Cuti Pegawai & Bypass Penilaian Harian dari Next.js API Routes (`sdm/src/app/api/it/deteksi-cuti/route.js`) ke NestJS GraphQL backend (`website/backend/src/sdm/`).

Fitur ini menyediakan:
1. **Query `deteksiCuti`**: Memindai data pengajuan cuti yang disetujui, mencocokkan dengan jadwal shift kerja pegawai (`jadwal_pegawai` dan `jadwal_tambahan` tanpa OFF/Libur), dan memeriksa status `penilaian_harian` (`belum_dibuat`, `perlu_bypass`, `approved_100`).
2. **Mutation `bypassCuti`**: Mengeksekusi bypass penilaian harian (`skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, `status = 'approved'`) dan menyisipkan 1 record default di `kegiatan_harian` secara transaksional.

---

## 2. Arsitektur & Komponen NestJS

### A. DTOs & GraphQL Types (`src/sdm/dto/deteksi-cuti-types.ts`)
```typescript
@InputType()
export class DeteksiCutiFilterInput {
  @Field({ nullable: true })
  tanggalAwal?: string;

  @Field({ nullable: true })
  tanggalAkhir?: string;

  @Field({ nullable: true })
  departemen?: string;

  @Field({ nullable: true })
  searchTerm?: string;

  @Field({ nullable: true })
  statusFilter?: string;
}

@ObjectType()
export class DeteksiCutiItemDto {
  @Field(() => Int)
  pegawai_id: number;

  @Field()
  pegawai_nama: string;

  @Field()
  nik: string;

  @Field({ nullable: true })
  departemen?: string;

  @Field({ nullable: true })
  departemen_nama?: string;

  @Field({ nullable: true })
  no_pengajuan?: string;

  @Field({ nullable: true })
  urgensi?: string;

  @Field()
  nilai_kondisi: string;

  @Field()
  tanggal: string;

  @Field()
  shift: string;

  @Field()
  status_bypass: string;

  @Field(() => Int, { nullable: true })
  penilaian_id?: number;

  @Field({ nullable: true })
  penilaian_status?: string;

  @Field(() => Float, { nullable: true })
  skor_total?: number;

  @Field({ nullable: true })
  sumber_absensi?: string;

  @Field({ nullable: true })
  ref_cuti_no?: string;
}

@ObjectType()
export class DeteksiCutiSummaryDto {
  @Field(() => Int)
  total_cuti_shift: number;

  @Field(() => Int)
  approved_100: number;

  @Field(() => Int)
  perlu_bypass: number;
}

@ObjectType()
export class DeteksiCutiResponseDto {
  @Field(() => DeteksiCutiSummaryDto)
  summary: DeteksiCutiSummaryDto;

  @Field(() => [DeteksiCutiItemDto])
  items: DeteksiCutiItemDto[];
}

@InputType()
export class BypassCutiItemInput {
  @Field(() => Int)
  pegawai_id: number;

  @Field()
  tanggal: string;

  @Field({ nullable: true })
  no_pengajuan?: string;

  @Field({ nullable: true })
  urgensi?: string;

  @Field({ nullable: true })
  shift?: string;
}

@InputType()
export class BypassCutiInput {
  @Field(() => [BypassCutiItemInput])
  items: BypassCutiItemInput[];
}

@ObjectType()
export class BypassCutiResultDto {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  processedCount: number;
}
```

---

### B. Repository (`src/sdm/repositories/deteksi-cuti.repository.ts`)
- Injeksi DataSource `@InjectDataSource('sdm') private readonly dataSource: DataSource`.
- Validasi role admin/IT/SDM/SPI:
  ```typescript
  isAuthorized(userId: number, dept: string): Promise<boolean>
  ```
- Scan data cuti + jadwal + penilaian harian:
  - Query `pengajuan_cuti` JOIN `pegawai` LEFT JOIN `departemen` dengan parameter prepared statement.
  - Load batch `penilaian_harian` via `WHERE pegawai_id IN (?) AND tanggal BETWEEN ? AND ?`.
  - Load batch `jadwal_pegawai` & `jadwal_tambahan` via `WHERE id IN (?)`.
  - Loop tanggal overlap cuti vs filter rentang tanggal, filter shift kerja bukan OFF/Libur, dan deduplikasi `processedDays` per `pegawai_id` & `tanggal`.
- Eksekusi bypass dengan Transaction (`this.dataSource.transaction`):
  - Check existing `penilaian_harian`. Jika ada -> `UPDATE` skor 100/100/100, `status = 'approved'`. Jika belum -> `INSERT` `penilaian_harian`.
  - Insert default `kegiatan_harian` jika belum memiliki kegiatan.

---

### C. Service & Resolver
- **`src/sdm/deteksi-cuti.service.ts`**:
  - `getDeteksiCuti(user, filter: DeteksiCutiFilterInput)`
  - `processBypass(user, input: BypassCutiInput)`
- **`src/sdm/deteksi-cuti.resolver.ts`**:
  - Guard: `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`
  - Query: `@Query(() => DeteksiCutiResponseDto, { name: 'deteksiCuti' })`
  - Mutation: `@Mutation(() => BypassCutiResultDto, { name: 'bypassCuti' })`
- **`src/sdm/sdm.module.ts`**:
  - Tambahkan provider `DeteksiCutiResolver`, `DeteksiCutiService`, `DeteksiCutiRepository`.

---

## 3. Integrasi Frontend (`sdm`)

1. **`src/lib/deteksi-cuti-gql-client.js`**:
   - `fetchDeteksiCutiGql(filter)`: memanggil query `deteksiCuti`.
   - `executeBypassCutiGql(items)`: memanggil mutation `bypassCuti`.
2. **`src/app/dashboard/it/deteksi-cuti/page.js`**:
   - Menggunakan `fetchDeteksiCutiGql` dan `executeBypassCutiGql`.

---

## 4. Rencana Verifikasi
1. **NestJS Unit Tests**: Buat `deteksi-cuti.service.spec.ts` untuk menguji scan shift cuti, mapping urgensi, dan eksekusi bypass.
2. **NestJS Build**: Jalankan `npm run build` di `website/backend` (0 errors).
3. **SDM Build**: Jalankan `npm run build` di `sdm` (0 errors).
