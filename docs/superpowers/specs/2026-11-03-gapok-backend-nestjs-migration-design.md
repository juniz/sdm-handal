# Design Document: Migrasi Backend Gaji Pokok ke NestJS GraphQL

**Tanggal**: 2026-11-03  
**Status**: Approved  
**Scope**: 
- NestJS Backend: `website/backend/src/sdm/`
- Next.js Frontend: `sdm/src/lib/gapok-gql-client.js` & `sdm/src/app/dashboard/penggajian/gapok/page.js`

---

## 1. Overview & Latar Belakang
Halaman `/dashboard/penggajian/gapok` pada Next.js sebelumnya memanggil route handler internal (`/api/pegawai/gapok` & `/api/gaji/generate`) yang mengakses MySQL secara langsung.
Untuk standardisasi arsitektur SDM terpusat, backend gaji pokok dimigrasi ke **NestJS GraphQL** (`website/backend/src/sdm`) mengikuti pola modul `jasa-dasar` dan `gaji-validasi`.

---

## 2. Arsitektur & Komponen

### 2.1. NestJS Backend (`website/backend/src/sdm`)

1. **DTOs & GraphQL Types (`src/sdm/dto/gapok-types.ts`)**:
   - `GapokPegawaiItemDto`: Data pegawai (`id`, `nik`, `nama`, `departemen`, `nama_departemen`, `jbtn`, `gapok`).
   - `GapokPaginationMetaDto`: Metadata paginasi (`page`, `limit`, `total`, `totalPages`, `unset_total`).
   - `GapokPegawaiResponseDto`: Kombinasi `items` dan `meta`.
   - `UpdateGapokInput`: Input pembaruan tunggal `{ nik: String!, gapok: Float! }`.
   - `BulkImportGapokItemInput`: Item import `{ nik: String!, gapok: Float! }`.
   - `BulkImportGapokResponseDto`: Summary hasil import `{ success_count: Int!, error_count: Int!, errors: [String!] }`.
   - `GenerateGajiInput`: Input generate payroll `{ periode_bulan: Int!, periode_tahun: Int! }`.

2. **Repository Layer (`src/sdm/repositories/gapok.repository.ts`)**:
   - Injeksi DataSource `'sdm'`.
   - `findGapokList({ page, limit, search, depId, unsetOnly })`:
     - Query tabel `pegawai p` join `departemen d` dengan `stts_aktif = 'AKTIF'`.
     - Filter dinamis berdasarkan `departemen`, `search` (nama/nik), dan `unset_only` (`gapok IS NULL OR gapok = 0`).
     - Query audit global `unset_total` dari semua pegawai aktif.
   - `updateGapok(nik: string, gapok: number)`:
     - Update kolom `gapok` pada tabel `pegawai` by `nik`.
   - `bulkUpdateGapok(items: BulkImportGapokItemInput[])`:
     - Eksekusi atomic transaction (`dataSource.transaction`).
     - Update satu per satu, catat hitungan baris yang sukses/gagal/tidak ditemukan.
   - `generateGaji(periodeBulan: number, periodeTahun: number, uploadedBy: string)`:
     - `INSERT INTO gaji_pegawai (nik, periode_tahun, periode_bulan, jenis, gaji, uploaded_by) ... ON DUPLICATE KEY UPDATE`.

3. **Service Layer (`src/sdm/gapok.service.ts`)**:
   - Menghubungkan resolver ke repository, validasi nilai input (`gapok >= 0`, `periode_bulan` 1-12).

4. **Resolver Layer (`src/sdm/gapok.resolver.ts`)**:
   - Diproteksi oleh `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`.
   - `@Query(() => GapokPegawaiResponseDto, { name: 'gapokPegawaiList' })`
   - `@Mutation(() => Boolean, { name: 'updateGapokPegawai' })`
   - `@Mutation(() => BulkImportGapokResponseDto, { name: 'importGapokPegawai' })`
   - `@Mutation(() => Boolean, { name: 'generateGajiPeriode' })`

5. **Registrasi Modul (`src/sdm/sdm.module.ts`)**:
   - Daftarkan `GapokResolver`, `GapokService`, dan `GapokRepository` ke `providers`.

---

### 2.2. Next.js Frontend (`sdm`)

1. **GraphQL Client Helper (`src/lib/gapok-gql-client.js`)**:
   - Helper berbasis fetch ke `${NEXT_PUBLIC_BACKEND_URL}/graphql`.
   - Sertakan JWT `auth_token` dari cookie/storage di header `Authorization: Bearer <token>`.
   - Ekspor method:
     - `fetchGapokList({ page, limit, search, depId, unsetOnly })`
     - `mutationUpdateGapok({ nik, gapok })`
     - `mutationImportGapok(items)`
     - `mutationGenerateGaji({ periodeBulan, periodeTahun })`

2. **UI Integration (`src/app/dashboard/penggajian/gapok/page.js`)**:
   - Ganti REST call `fetch('/api/pegawai/gapok...')` dengan `fetchGapokList()`.
   - Ganti form submit edit dengan `mutationUpdateGapok()`.
   - Ganti proses generate gaji dengan `mutationGenerateGaji()`.
   - **Template Excel**: Dibuat langsung di sisi client memakai package `xlsx` yang sudah terinstall di Next.js (tidak membebani backend).
   - **Import Excel**: File dibaca di client via `xlsx`, baris diekstrak menjadi `[{ nik, gapok }]`, lalu dikirim ke `mutationImportGapok(items)`.

3. **Deprecation**:
   - Route handler lama (`/api/pegawai/gapok/route.js` dan `/api/gaji/generate/route.js`) ditandai deprecated atau dialihkan.

---

## 3. Data Flow Diagram

```
[Browser / UI Next.js]
        │
        │ 1. GraphQL Query: gapokPegawaiList
        │ 2. GraphQL Mutation: updateGapokPegawai
        │ 3. GraphQL Mutation: importGapokPegawai (parsed array)
        │ 4. GraphQL Mutation: generateGajiPeriode
        ▼
[NestJS /graphql] ── (GqlJwtSdmGuard)
        │
        ▼
[GapokResolver] ──▶ [GapokService] ──▶ [GapokRepository]
                                                │
                                                ▼
                                         [MySQL DB (sdm)]
```

---

## 4. Error Handling & Edge Cases
- **Token expired / Unauthorized**: `GqlJwtSdmGuard` otomatis melempar `UnauthorizedException (401)`.
- **Invalid Nominal**: Validasi DTO/Service menolak `gapok < 0`.
- **Import Error**: Baris kosong atau NIK tidak valid dilewati dan dicatat dalam array `errors`.
- **Generate Idempotency**: `ON DUPLICATE KEY UPDATE` memastikan eksekusi ulang pada periode yang sama aman dan menimpa nilai gaji tanpa duplikasi baris.
