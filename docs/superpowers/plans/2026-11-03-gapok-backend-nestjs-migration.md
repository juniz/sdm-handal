# Migrasi Backend Gaji Pokok ke NestJS GraphQL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrasi backend `/dashboard/penggajian/gapok` dari Next.js API routes langsung ke NestJS GraphQL backend (`website/backend/src/sdm`).

**Architecture:** NestJS GraphQL (`@Resolver`, `@InjectDataSource('sdm')`, `GqlJwtSdmGuard`) menyediakan query list data pegawai aktif ber-gapok, mutasi update gapok, mutasi import bulk gapok dalam transaksi database, dan mutasi generate payroll. Next.js frontend menggunakan GraphQL client helper (`gapok-gql-client.js`) dan membaca template / file Excel di sisi client menggunakan library `xlsx`.

**Tech Stack:** NestJS, TypeORM / Raw SQL DataManager, GraphQL, `@nestjs/graphql`, Next.js 15, React, `xlsx`, `lucide-react`.

## Global Constraints
- Target backend directory: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Target frontend directory: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Auth guard: `GqlJwtSdmGuard` & `GqlThrottlerGuard`
- Database pool: `@InjectDataSource('sdm') private readonly dataSource: DataSource`
- Tabular numeric alignment & `font-figtree` standard per `DESIGN.md`

---

### Task 1: NestJS DTOs & GraphQL Types

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/gapok-types.ts`

**Interfaces:**
- Produces: `GapokPegawaiItemDto`, `GapokPaginationMetaDto`, `GapokPegawaiResponseDto`, `UpdateGapokInput`, `BulkImportGapokItemInput`, `BulkImportGapokResponseDto`, `GenerateGajiInput`

- [ ] **Step 1: Tulis file DTO dan GraphQL Object/Input Types**

Buat file `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/gapok-types.ts`:
```typescript
import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GapokPegawaiItemDto {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field(() => String)
  nik: string;

  @Field(() => String)
  nama: string;

  @Field(() => String, { nullable: true })
  departemen?: string;

  @Field(() => String, { nullable: true })
  nama_departemen?: string;

  @Field(() => String, { nullable: true })
  jbtn?: string;

  @Field(() => Float, { nullable: true })
  gapok?: number;
}

@ObjectType()
export class GapokPaginationMetaDto {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  unset_total: number;
}

@ObjectType()
export class GapokPegawaiResponseDto {
  @Field(() => [GapokPegawaiItemDto])
  items: GapokPegawaiItemDto[];

  @Field(() => GapokPaginationMetaDto)
  meta: GapokPaginationMetaDto;
}

@InputType()
export class UpdateGapokInput {
  @Field(() => String)
  nik: string;

  @Field(() => Float)
  gapok: number;
}

@InputType()
export class BulkImportGapokItemInput {
  @Field(() => String)
  nik: string;

  @Field(() => Float)
  gapok: number;
}

@ObjectType()
export class BulkImportGapokResponseDto {
  @Field(() => Int)
  success_count: number;

  @Field(() => Int)
  error_count: number;

  @Field(() => [String])
  errors: string[];
}

@InputType()
export class GenerateGajiInput {
  @Field(() => Int)
  periode_bulan: number;

  @Field(() => Int)
  periode_tahun: number;
}
```

- [ ] **Step 2: Verifikasi tipe Typescript**

Run:
```bash
npx tsc --noEmit /Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/gapok-types.ts
```
Expected: Tidak ada error kompilasi.

---

### Task 2: NestJS Gapok Repository

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/gapok.repository.ts`

**Interfaces:**
- Consumes: `BulkImportGapokItemInput`, `GapokPegawaiItemDto`, `GapokPaginationMetaDto` dari `dto/gapok-types.ts`
- Produces: `GapokRepository` dengan method `findGapokList`, `updateGapok`, `bulkUpdateGapok`, `generateGaji`

- [ ] **Step 1: Tulis GapokRepository**

Buat `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/gapok.repository.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BulkImportGapokItemInput,
  BulkImportGapokResponseDto,
  GapokPegawaiItemDto,
  GapokPegawaiResponseDto,
} from '../dto/gapok-types';

@Injectable()
export class GapokRepository {
  constructor(
    @InjectDataSource('sdm') private readonly dataSource: DataSource,
  ) {}

  private get manager() {
    return this.dataSource.manager;
  }

  async findGapokList(params: {
    page?: number;
    limit?: number;
    search?: string;
    depId?: string;
    unsetOnly?: boolean;
  }): Promise<GapokPegawaiResponseDto> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 50);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE p.stts_aktif = 'AKTIF'";
    const queryParams: any[] = [];

    if (params.depId && params.depId !== 'all') {
      whereClause += ' AND p.departemen = ?';
      queryParams.push(params.depId);
    }

    if (params.search && params.search.trim()) {
      whereClause += ' AND (p.nama LIKE ? OR p.nik LIKE ?)';
      queryParams.push(`%${params.search.trim()}%`, `%${params.search.trim()}%`);
    }

    if (params.unsetOnly) {
      whereClause += ' AND (p.gapok IS NULL OR p.gapok = 0)';
    }

    // Hitung total pegawai sesuai filter
    const countSql = `SELECT COUNT(*) as total FROM pegawai p ${whereClause}`;
    const countResult = await this.manager.query(countSql, queryParams);
    const total = Number(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    // Hitung global audit unset_total (seluruh pegawai aktif tanpa filter pencarian/departemen)
    const auditSql = `
      SELECT COUNT(*) as unset_count 
      FROM pegawai 
      WHERE stts_aktif = 'AKTIF' AND (gapok IS NULL OR gapok = 0)
    `;
    const auditResult = await this.manager.query(auditSql);
    const unsetTotal = Number(auditResult[0]?.unset_count || 0);

    // Ambil data paginasi
    const dataSql = `
      SELECT 
        p.id, 
        p.nik, 
        p.nama, 
        p.jbtn, 
        p.departemen, 
        d.nama as nama_departemen,
        p.gapok
      FROM pegawai p
      LEFT JOIN departemen d ON p.departemen = d.dep_id
      ${whereClause}
      ORDER BY p.gapok DESC, p.nama ASC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.manager.query(dataSql, [...queryParams, limit, offset]);

    const items: GapokPegawaiItemDto[] = (rows || []).map((row: any) => ({
      id: row.id ? Number(row.id) : undefined,
      nik: String(row.nik),
      nama: String(row.nama),
      departemen: row.departemen ? String(row.departemen) : undefined,
      nama_departemen: row.nama_departemen ? String(row.nama_departemen) : undefined,
      jbtn: row.jbtn ? String(row.jbtn) : undefined,
      gapok: row.gapok != null ? Number(row.gapok) : undefined,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        unset_total: unsetTotal,
      },
    };
  }

  async updateGapok(nik: string, gapok: number): Promise<boolean> {
    const sql = 'UPDATE pegawai SET gapok = ? WHERE nik = ?';
    const result = await this.manager.query(sql, [gapok, nik]);
    return result && result.affectedRows > 0;
  }

  async bulkUpdateGapok(
    items: BulkImportGapokItemInput[],
  ): Promise<BulkImportGapokResponseDto> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    await this.dataSource.transaction(async (txManager) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const nik = (item.nik || '').trim();
        const gapok = Number(item.gapok);

        if (!nik) {
          errorCount++;
          errors.push(`Baris ${i + 1}: NIK tidak boleh kosong`);
          continue;
        }

        if (isNaN(gapok) || gapok < 0) {
          errorCount++;
          errors.push(`Baris ${i + 1} (${nik}): Nominal gapok tidak valid`);
          continue;
        }

        const sql = 'UPDATE pegawai SET gapok = ? WHERE nik = ?';
        const res = await txManager.query(sql, [gapok, nik]);
        if (res && (res.affectedRows > 0 || res.changedRows >= 0)) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`Baris ${i + 1} (${nik}): NIK tidak ditemukan di database`);
        }
      }
    });

    return {
      success_count: successCount,
      error_count: errorCount,
      errors: errors.slice(0, 30),
    };
  }

  async generateGaji(
    periodeBulan: number,
    periodeTahun: number,
    uploadedBy: string,
  ): Promise<boolean> {
    const sql = `
      INSERT INTO gaji_pegawai (nik, periode_tahun, periode_bulan, jenis, gaji, uploaded_by)
      SELECT 
        nik, 
        ? as periode_tahun, 
        ? as periode_bulan, 
        'Gaji' as jenis, 
        gapok, 
        ? as uploaded_by
      FROM pegawai 
      WHERE stts_aktif = 'AKTIF'
      ON DUPLICATE KEY UPDATE 
        gaji = VALUES(gaji),
        uploaded_by = VALUES(uploaded_by),
        updated_at = NOW();
    `;
    await this.manager.query(sql, [periodeTahun, periodeBulan, uploadedBy]);
    return true;
  }
}
```

- [ ] **Step 2: Run build check**
Run:
```bash
npx tsc --noEmit
```
Expected: PASS tanpa error.

---

### Task 3: NestJS Gapok Service, Resolver & Module Registration

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/gapok.service.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/gapok.resolver.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

- [ ] **Step 1: Tulis GapokService**

Buat `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/gapok.service.ts`:
```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import { GapokRepository } from './repositories/gapok.repository';
import {
  BulkImportGapokItemInput,
  BulkImportGapokResponseDto,
  GapokPegawaiResponseDto,
  GenerateGajiInput,
  UpdateGapokInput,
} from './dto/gapok-types';

@Injectable()
export class GapokService {
  constructor(private readonly gapokRepository: GapokRepository) {}

  async findGapokList(params: {
    page?: number;
    limit?: number;
    search?: string;
    depId?: string;
    unsetOnly?: boolean;
  }): Promise<GapokPegawaiResponseDto> {
    return this.gapokRepository.findGapokList(params);
  }

  async updateGapok(input: UpdateGapokInput): Promise<boolean> {
    if (!input.nik) {
      throw new BadRequestException('NIK wajib diisi');
    }
    if (isNaN(input.gapok) || input.gapok < 0) {
      throw new BadRequestException('Nominal gaji pokok tidak valid');
    }
    return this.gapokRepository.updateGapok(input.nik, input.gapok);
  }

  async bulkImportGapok(
    items: BulkImportGapokItemInput[],
  ): Promise<BulkImportGapokResponseDto> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Daftar pegawai untuk import tidak boleh kosong');
    }
    return this.gapokRepository.bulkUpdateGapok(items);
  }

  async generateGaji(
    input: GenerateGajiInput,
    uploadedBy: string,
  ): Promise<boolean> {
    if (!input.periode_bulan || input.periode_bulan < 1 || input.periode_bulan > 12) {
      throw new BadRequestException('Periode bulan tidak valid');
    }
    if (!input.periode_tahun || input.periode_tahun < 2000) {
      throw new BadRequestException('Periode tahun tidak valid');
    }
    return this.gapokRepository.generateGaji(
      input.periode_bulan,
      input.periode_tahun,
      uploadedBy || 'SYSTEM',
    );
  }
}
```

- [ ] **Step 2: Tulis GapokResolver**

Buat `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/gapok.resolver.ts`:
```typescript
import { UseGuards } from '@nestjs/common';
import { Args, Boolean, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { GqlJwtSdmGuard } from './guards/gql-jwt-sdm.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GapokService } from './gapok.service';
import {
  BulkImportGapokItemInput,
  BulkImportGapokResponseDto,
  GapokPegawaiResponseDto,
  GenerateGajiInput,
  UpdateGapokInput,
} from './dto/gapok-types';

@Resolver()
@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)
export class GapokResolver {
  constructor(private readonly gapokService: GapokService) {}

  @Query(() => GapokPegawaiResponseDto, { name: 'gapokPegawaiList' })
  async getGapokPegawaiList(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('depId', { type: () => String, nullable: true }) depId?: string,
    @Args('unsetOnly', { type: () => Boolean, nullable: true }) unsetOnly?: boolean,
  ): Promise<GapokPegawaiResponseDto> {
    return this.gapokService.findGapokList({
      page,
      limit,
      search,
      depId,
      unsetOnly,
    });
  }

  @Mutation(() => Boolean, { name: 'updateGapokPegawai' })
  async updateGapokPegawai(
    @Args('input') input: UpdateGapokInput,
  ): Promise<boolean> {
    return this.gapokService.updateGapok(input);
  }

  @Mutation(() => BulkImportGapokResponseDto, { name: 'importGapokPegawai' })
  async importGapokPegawai(
    @Args('input', { type: () => [BulkImportGapokItemInput] })
    input: BulkImportGapokItemInput[],
  ): Promise<BulkImportGapokResponseDto> {
    return this.gapokService.bulkImportGapok(input);
  }

  @Mutation(() => Boolean, { name: 'generateGajiPeriode' })
  async generateGajiPeriode(
    @CurrentUser() user: any,
    @Args('input') input: GenerateGajiInput,
  ): Promise<boolean> {
    const uploadedBy = user?.username || user?.nik || 'SDM';
    return this.gapokService.generateGaji(input, uploadedBy);
  }
}
```

- [ ] **Step 3: Daftarkan di `sdm.module.ts`**

Tambahkan `GapokResolver`, `GapokService`, dan `GapokRepository` pada `website/backend/src/sdm/sdm.module.ts`.

- [ ] **Step 4: Test build backend**
Run:
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npm run build
```
Expected: Build sukses, schema.gql ter-update.

---

### Task 4: Next.js GraphQL Client Helper

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/gapok-gql-client.js`

- [ ] **Step 1: Tulis GraphQL Client Helper**

Buat `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/gapok-gql-client.js`:
```javascript
import Cookies from "js-cookie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    let token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

    if (!token) {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.token) {
            token = sessionData.token;
            Cookies.set("auth_token", token, {
              expires: 7,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
            localStorage.setItem("auth_token_backup", token);
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors[0]?.message ?? "GraphQL error";
    throw new Error(msg);
  }
  return json.data;
}

export async function fetchGapokList({
  page = 1,
  limit = 10,
  search = "",
  depId = "all",
  unsetOnly = false,
} = {}) {
  const query = `
    query GetGapokPegawaiList(
      $page: Int
      $limit: Int
      $search: String
      $depId: String
      $unsetOnly: Boolean
    ) {
      gapokPegawaiList(
        page: $page
        limit: $limit
        search: $search
        depId: $depId
        unsetOnly: $unsetOnly
      ) {
        items {
          id
          nik
          nama
          departemen
          nama_departemen
          jbtn
          gapok
        }
        meta {
          page
          limit
          total
          totalPages
          unset_total
        }
      }
    }
  `;

  const data = await gql(query, {
    page,
    limit,
    search: search || undefined,
    depId: depId === "all" ? undefined : depId,
    unsetOnly,
  });

  return data.gapokPegawaiList;
}

export async function mutationUpdateGapok({ nik, gapok }) {
  const query = `
    mutation UpdateGapokPegawai($input: UpdateGapokInput!) {
      updateGapokPegawai(input: $input)
    }
  `;
  const data = await gql(query, {
    input: { nik, gapok: parseFloat(gapok) },
  });
  return data.updateGapokPegawai;
}

export async function mutationImportGapok(items) {
  const query = `
    mutation ImportGapokPegawai($input: [BulkImportGapokItemInput!]!) {
      importGapokPegawai(input: $input) {
        success_count
        error_count
        errors
      }
    }
  `;
  const data = await gql(query, { input: items });
  return data.importGapokPegawai;
}

export async function mutationGenerateGaji({ periodeBulan, periodeTahun }) {
  const query = `
    mutation GenerateGajiPeriode($input: GenerateGajiInput!) {
      generateGajiPeriode(input: $input)
    }
  `;
  const data = await gql(query, {
    input: {
      periode_bulan: parseInt(periodeBulan, 10),
      periode_tahun: parseInt(periodeTahun, 10),
    },
  });
  return data.generateGajiPeriode;
}
```

- [ ] **Step 2: Check node syntax**
Run:
```bash
node --check /Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/gapok-gql-client.js
```
Expected: PASS

---

### Task 5: Integrasi UI Halaman Gapok

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penggajian/gapok/page.js`

- [ ] **Step 1: Update import dan handler di `page.js`**
Ganti pemanggilan REST API dengan method dari `gapok-gql-client.js`.
- `fetchData()`: panggil `fetchGapokList({ page, limit: pageSize, search: debouncedSearch, depId: selectedDepartment, unsetOnly: showUnsetOnly })`.
- `onSubmit()`: panggil `mutationUpdateGapok({ nik: values.nik, gapok: values.gapok })`.
- `handleGenerate()`: panggil `mutationGenerateGaji({ periodeBulan: generateMonth, periodeTahun: generateYear })`.
- `handleDownloadTemplate()`: generate file Excel langsung di client via `import("xlsx")` berisi list pegawai aktif yang diambil atau dari state per departemen.
- `handleImportSubmit()`: baca file `.xlsx` dengan `XLSX.read`, parse menjadi array objek `[{ nik, gapok }]`, panggil `mutationImportGapok(items)`.

- [ ] **Step 2: Verifikasi sintaks dan deteksi anti-pattern**
Run:
```bash
node --check src/app/dashboard/penggajian/gapok/page.js
node .agents/skills/impeccable/scripts/detect.mjs src/app/dashboard/penggajian/gapok/page.js
```
Expected: PASS tanpa error.

---

### Task 6: Deprecate Legacy Next.js API Routes

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/pegawai/gapok/route.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/gaji/generate/route.js`

- [ ] **Step 1: Tambahkan deprecation header / notice pada route lama**
Tambahkan komentar deprecation atau forward response agar jelas bahwa logika utama telah berpindah ke NestJS GraphQL backend.

---

### Task 7: Verifikasi Menyeluruh & Knowledge Graph Update

- [ ] **Step 1: Verifikasi build Next.js frontend**
Run: `npm run lint` atau `npm run build` jika diperlukan.
- [ ] **Step 2: Update knowledge graph**
Run: `graphify update .` di Next.js repo.
