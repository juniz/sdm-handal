# Menu Riwayat Penilaian Kinerja (Pengawasan / HRD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun menu dan API baru "Riwayat Penilaian (Pengawasan / HRD)" untuk menampilkan rekapitulasi penilaian kinerja seluruh pegawai tanpa data nominal keuangan/jasa, dilengkapi indikator kepatuhan unit (*compliance rate*) dan filter status kerja.

**Architecture:** NestJS GraphQL backend (`website/backend`) mengolah query `rekapPengawasanList` (non-jasa), diposisikan di Next.js API proxy (`/api/penilaian/rekap-pengawasan`), dan ditayangkan pada Next.js client page (`/dashboard/penilaian-kinerja/riwayat-pengawasan`).

**Tech Stack:** Next.js (App Router, Tailwind CSS, Lucide React), NestJS, GraphQL, MySQL, TypeScript.

## Global Constraints
- Isolasi Penuh Data Keuangan: Tidak boleh ada field `nominal_jasa_dasar`, `pengurang_jasa`, `nominal_jasa_tambahan`, atau `nominal_jasa_final` yang dirender atau dikalkulasi di endpoint ini.
- Hak Akses Menu Dinamis: Mengandalkan sistem izin menu dinamis dari GraphQL/Database (`fetchMyMenus`).
- Status Kerja Filter: Mendukung filter `stts_kerja` dari API `/api/stts-kerja`.

---

### Task 1: NestJS Backend GraphQL DTO Types

**Files:**
- Create: `website/backend/src/sdm/dto/rekap-pengawasan-types.ts`

**Interfaces:**
- Consumes: `PaginationMetaDto` dari `website/backend/src/common/dto/pagination.dto`
- Produces: `RekapPengawasanDto`, `RekapPengawasanSummaryDto`, `RekapPengawasanPaginationDto`

- [ ] **Step 1: Write DTO Types File**

Create `website/backend/src/sdm/dto/rekap-pengawasan-types.ts`:
```typescript
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { PaginationMetaDto } from '../../common/dto/pagination.dto';

@ObjectType()
export class RekapPengawasanDto {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field(() => Int)
  pegawai_id: number;

  @Field(() => String, { nullable: true })
  nik?: string;

  @Field(() => String, { nullable: true })
  nama?: string;

  @Field(() => String, { nullable: true })
  nama_departemen?: string;

  @Field(() => String, { nullable: true })
  stts_kerja?: string;

  @Field(() => Int)
  bulan: number;

  @Field(() => Int)
  tahun: number;

  @Field(() => Int)
  total_hari_jadwal: number;

  @Field(() => Int)
  hari_approved: number;

  @Field(() => Int)
  hari_approved_bonus: number;

  @Field(() => Int)
  gap_hari: number;

  @Field(() => Float)
  rata_skor_total: number;

  @Field(() => String)
  status_rekap: string;
}

@ObjectType()
export class RekapPengawasanSummaryDto {
  @Field(() => Int)
  totalEmployees: number;

  @Field(() => Float)
  avgMonthlyScore: number;

  @Field(() => Int)
  totalLocked: number;

  @Field(() => Int)
  totalDraft: number;

  @Field(() => Float)
  compliancePercentage: number;
}

@ObjectType()
export class RekapPengawasanPaginationDto {
  @Field(() => [RekapPengawasanDto])
  data: RekapPengawasanDto[];

  @Field(() => PaginationMetaDto)
  meta: PaginationMetaDto;

  @Field(() => RekapPengawasanSummaryDto)
  summary: RekapPengawasanSummaryDto;
}
```

- [ ] **Step 2: Verify DTO Compilation**
Run build check in `website/backend`: `npm run build`

- [ ] **Step 3: Commit**
`git add website/backend/src/sdm/dto/rekap-pengawasan-types.ts && git commit -m "feat(backend): add RekapPengawasan DTO types"`

---

### Task 2: NestJS Backend Repository & Service

**Files:**
- Create: `website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts`
- Create: `website/backend/src/sdm/rekap-pengawasan.service.ts`

**Interfaces:**
- Consumes: `DatabaseService` (or Knex/raw DB helper in backend), `RekapPengawasanPaginationDto`
- Produces: `RekapPengawasanService.getRekapPengawasan(...)`

- [ ] **Step 1: Create Repository**

Create `website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts` to query employees joining with `pegawai`, `stts_kerja`, `departemen`, `jadwal_pegawai`, and `penilaian_kinerja_rekap_bulanan`.

- [ ] **Step 2: Create Service**

Create `website/backend/src/sdm/rekap-pengawasan.service.ts` to execute query, apply `sttsKerja` and `departemen` filtering, and calculate `compliancePercentage`:
`compliancePercentage = totalEmployees > 0 ? Math.round((totalLocked / totalEmployees) * 10000) / 100 : 0`

- [ ] **Step 3: Verify Service Logic with Build**
Run build check in `website/backend`: `npm run build`

- [ ] **Step 4: Commit**
`git add website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts website/backend/src/sdm/rekap-pengawasan.service.ts && git commit -m "feat(backend): implement RekapPengawasan service & repository"`

---

### Task 3: NestJS Backend Resolver & Module Registration

**Files:**
- Create: `website/backend/src/sdm/rekap-pengawasan.resolver.ts`
- Modify: `website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: `RekapPengawasanService`
- Produces: GraphQL Query `rekapPengawasanList`

- [ ] **Step 1: Create GraphQL Resolver**

Create `website/backend/src/sdm/rekap-pengawasan.resolver.ts`:
```typescript
import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Int } from '@nestjs/graphql';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { GqlJwtSdmGuard } from './guards/gql-jwt-sdm.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RekapPengawasanService } from './rekap-pengawasan.service';
import { RekapPengawasanPaginationDto } from './dto/rekap-pengawasan-types';

@Resolver()
@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)
export class RekapPengawasanResolver {
  constructor(private readonly rekapPengawasanService: RekapPengawasanService) {}

  @Query(() => RekapPengawasanPaginationDto, { name: 'rekapPengawasanList' })
  async getRekapPengawasanList(
    @CurrentUser() user: any,
    @Args('bulan', { type: () => Int }) bulan: number,
    @Args('tahun', { type: () => Int }) tahun: number,
    @Args('departemen', { type: () => String, nullable: true }) departemen?: string,
    @Args('sttsKerja', { type: () => String, nullable: true }) sttsKerja?: string,
    @Args('nama', { type: () => String, nullable: true }) nama?: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RekapPengawasanPaginationDto> {
    return this.rekapPengawasanService.getRekapPengawasan(
      bulan,
      tahun,
      departemen || 'ALL',
      sttsKerja || 'ALL',
      nama || '',
      page || 1,
      limit || 10,
    );
  }
}
```

- [ ] **Step 2: Register in `sdm.module.ts`**
Add `RekapPengawasanResolver`, `RekapPengawasanService`, and `RekapPengawasanRepository` to providers in `sdm.module.ts`.

- [ ] **Step 3: Build & Test Resolver**
Run build in `website/backend`: `npm run build`

- [ ] **Step 4: Commit**
`git add website/backend/src/sdm/rekap-pengawasan.resolver.ts website/backend/src/sdm/sdm.module.ts && git commit -m "feat(backend): register rekapPengawasanList resolver"`

---

### Task 4: Next.js API Proxy Route

**Files:**
- Create: `sdm/src/app/api/penilaian/rekap-pengawasan/route.js`

**Interfaces:**
- Consumes: Next.js request (`bulan`, `tahun`, `departemen`, `stts_kerja`, `nama`, `page`, `limit`), Auth Token cookie
- Produces: JSON `{ success: true, data: [...], meta: {...}, summary: {...} }`

- [ ] **Step 1: Create Next.js API Proxy Route**

Create `sdm/src/app/api/penilaian/rekap-pengawasan/route.js` which verifies auth cookie token and dispatches POST GraphQL query `rekapPengawasanList` to backend URL.

- [ ] **Step 2: Verify API Proxy Route**
Ensure no syntax or build errors in Next.js.

- [ ] **Step 3: Commit**
`git add sdm/src/app/api/penilaian/rekap-pengawasan/route.js && git commit -m "feat(frontend): create API proxy for rekap-pengawasan"`

---

### Task 5: Next.js Client Page (`/riwayat-pengawasan`)

**Files:**
- Create: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`

**Interfaces:**
- Consumes: `/api/penilaian/rekap-pengawasan`, `/api/departemen`, `/api/stts-kerja`
- Produces: Full interactive UI dashboard for oversight & compliance review.

- [ ] **Step 1: Create Client Page Component**

Build `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`:
- Incorporates 4 Summary/KPI cards (Total Pegawai, Average Score, Total Locked/Draft, Compliance Rate Progress Bar).
- Includes filters: Periode Bulan, Periode Tahun, Departemen Dropdown, Status Kerja (`stts_kerja`) Dropdown, Search Input.
- Table with non-jasa performance metrics: NIK, Nama, Departemen, Status Kerja, Hari Jadwal, Hari Approved, Gap Hari, Rata-rata Skor Total, Status Rekap (Badge).
- Slide-over detail drawer for individual daily evaluations without financial fields.

- [ ] **Step 2: Verify Page Rendering & Build**
Run Next.js build check: `npm run build` in `sdm` directory.

- [ ] **Step 3: Commit**
`git add sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js && git commit -m "feat(frontend): add Riwayat Penilaian Pengawasan client page"`
