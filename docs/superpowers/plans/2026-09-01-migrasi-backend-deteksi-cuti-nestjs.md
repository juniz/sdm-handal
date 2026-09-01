# Migrasi Backend Deteksi Cuti & Bypass Penilaian ke NestJS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrasi backend deteksi cuti dan bypass penilaian harian ke GraphQL endpoint di NestJS (`website/backend/src/sdm/`), lalu integrasikan dengan Next.js frontend (`sdm/src/app/dashboard/it/deteksi-cuti/page.js`).

**Architecture:** 
- NestJS SDM Module menyediakan GraphQL Query `deteksiCuti(filter)` dan Mutation `bypassCuti(input)`.
- Menggunakan `DeteksiCutiRepository` dengan `@InjectDataSource('sdm')` dan transaksi database untuk bypass atomik.
- Autentikasi dijaga oleh `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)` dengan role check IT/SDM/SPI.
- Frontend Next.js memanggil backend via `deteksi-cuti-gql-client.js`.

**Tech Stack:** NestJS 10, TypeORM, Apollo GraphQL (code-first), MySQL, Next.js 15, React 19.

## Global Constraints

- Workspace Backend: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Workspace Frontend: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Database connection name: `'sdm'`
- Skor bypass default: `skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, `status = 'approved'`
- Default kegiatan insert jika kosong: `Cuti Terjadwal (Bypass Sistem: <urgensi> / <no_pengajuan>)`

---

### Task 1: DTOs & GraphQL Types di NestJS

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/deteksi-cuti-types.ts`

**Interfaces:**
- Produces:
  - `DeteksiCutiFilterInput`
  - `DeteksiCutiItemDto`
  - `DeteksiCutiSummaryDto`
  - `DeteksiCutiResponseDto`
  - `BypassCutiItemInput`
  - `BypassCutiInput`
  - `BypassCutiResultDto`

- [ ] **Step 1: Buat DTO & Object/Input Types**

```typescript
import { Field, InputType, ObjectType, Int, Float } from '@nestjs/graphql';

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

- [ ] **Step 2: Verifikasi tipe dan build backend**

Run: `npx tsc --noEmit` di `website/backend`
Expected: PASS tanpa error tipe.

- [ ] **Step 3: Commit**

```bash
git add src/sdm/dto/deteksi-cuti-types.ts
git commit -m "feat(sdm): add DTOs and GraphQL types for deteksi cuti and bypass"
```

---

### Task 2: Repository Layer di NestJS

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/deteksi-cuti.repository.ts`
- Test: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/deteksi-cuti.repository.spec.ts`

**Interfaces:**
- Consumes: `DeteksiCutiFilterInput`, `BypassCutiItemInput`
- Produces: `DeteksiCutiRepository` dengan method `isAuthorized()`, `findDetectedLeaves()`, `executeBypassTransaction()`.

- [ ] **Step 1: Tulis unit test untuk repository**

Buat `src/sdm/repositories/deteksi-cuti.repository.spec.ts` menguji otorisasi dan parsing data shift jadwal cuti.

- [ ] **Step 2: Implementasikan DeteksiCutiRepository**

Implementasikan query pengajuan cuti, pencocokan jadwal shift kerja, pengecekan penilaian harian, dan mutasi transaksional `dataSource.transaction`.

- [ ] **Step 3: Jalankan unit test**

Run: `npm test -- src/sdm/repositories/deteksi-cuti.repository.spec.ts` di `website/backend`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/sdm/repositories/deteksi-cuti.repository.ts src/sdm/repositories/deteksi-cuti.repository.spec.ts
git commit -m "feat(sdm): implement deteksi cuti repository with transactional bypass"
```

---

### Task 3: Service, Resolver, dan Registrasi di SDM Module

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/deteksi-cuti.service.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/deteksi-cuti.resolver.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/deteksi-cuti.service.spec.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: `DeteksiCutiRepository`, `GqlJwtSdmGuard`, `GqlThrottlerGuard`
- Produces:
  - Query: `deteksiCuti(filter)`
  - Mutation: `bypassCuti(input)`

- [ ] **Step 1: Buat DeteksiCutiService dan Unit Test**

Implementasikan service yang memvalidasi otorisasi user dan memanggil repository.

- [ ] **Step 2: Buat DeteksiCutiResolver**

Pasang dekorator GraphQL `@Resolver()`, `@Query()`, `@Mutation()`, dan `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`.

- [ ] **Step 3: Daftarkan di SdmModule**

Tambahkan `DeteksiCutiResolver`, `DeteksiCutiService`, `DeteksiCutiRepository` ke `providers` di `sdm.module.ts`.

- [ ] **Step 4: Jalankan test dan build backend**

Run: `npm test -- src/sdm/deteksi-cuti.service.spec.ts && npm run build` di `website/backend`
Expected: PASS dan schema.gql ter-update.

- [ ] **Step 5: Commit backend**

```bash
git add src/sdm/deteksi-cuti.service.ts src/sdm/deteksi-cuti.resolver.ts src/sdm/deteksi-cuti.service.spec.ts src/sdm/sdm.module.ts src/schema.gql
git commit -m "feat(sdm): add deteksi cuti service, resolver, and register in module"
```

---

### Task 4: Frontend GraphQL Client & Integrasi UI di SDM

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/deteksi-cuti-gql-client.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/it/deteksi-cuti/page.js`

**Interfaces:**
- Consumes: GraphQL Endpoint `/graphql`
- Produces: `fetchDeteksiCutiGql(filter)` dan `executeBypassCutiGql(items)`

- [ ] **Step 1: Buat deteksi-cuti-gql-client.js**

Implementasikan helper GraphQL query & mutation dengan token header dari cookies.

- [ ] **Step 2: Update deteksi-cuti/page.js**

Ganti pemanggilan `fetch('/api/it/deteksi-cuti')` dengan `fetchDeteksiCutiGql` dan `executeBypassCutiGql` (dengan fallback yang aman).

- [ ] **Step 3: Verifikasi build frontend**

Run: `npm run build` di `sdm`
Expected: PASS.

- [ ] **Step 4: Commit frontend**

```bash
git add src/lib/deteksi-cuti-gql-client.js src/app/dashboard/it/deteksi-cuti/page.js
git commit -m "feat(ui): switch deteksi cuti to nestjs graphql backend client"
```
