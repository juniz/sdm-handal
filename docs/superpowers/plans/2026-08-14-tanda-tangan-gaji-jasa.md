# Menu Tanda Tangan Gaji & Jasa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun menu mandiri bagi pegawai untuk melihat dan menandatangani validasi penerimaan Gaji Pokok (Gapok) dan Jasa Pelayanan (Jasa Dasar) per periode melalui GraphQL backend NestJS dan antarmuka Next.js SDM.

**Architecture:** 
- Backend NestJS: Mendefinisikan GraphQL DTO, Repository yang menghubungkan `gaji_pegawai`, `pegawai` (gapok), `jasa_dasar_pegawai`, dan `gaji_validasi` dengan audit trail di `gaji_validasi_history`, Service, dan Resolver terlindungi JWT & Throttle.
- Frontend Next.js: GraphQL client helper untuk query dan mutasi tanda tangan, serta halaman `/dashboard/tanda-tangan-gaji` dengan tab Gaji Pokok dan Jasa Pelayanan terintegrasi canvas tanda tangan.

**Tech Stack:** NestJS, TypeScript, TypeORM, GraphQL, Next.js 14 (App Router), React, Tailwind CSS, Lucide React, react-signature-canvas.

## Global Constraints
- **NO MIGRATION / SEED DB EXECUTION**: Jangan menjalankan command migrasi database atau query ALTER/CREATE/SEED langsung ke database live. Gunakan struktur tabel yang sudah ada.
- Gunakan decorator `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)` pada resolver NestJS.
- Transaksi database atomik pada saat menyimpan tanda tangan ke `gaji_validasi` dan `gaji_validasi_history`.

---

### Task 1: Backend GraphQL DTOs & Types

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/gaji-validasi-types.ts`

**Interfaces:**
- Produces: `GajiValidasiItemDto`, `SignGajiInput`, `GajiValidasiFilterInput`

- [ ] **Step 1: Create `gaji-validasi-types.ts`**

```typescript
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class GajiValidasiItemDto {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  nik: string;

  @Field(() => String)
  namaPegawai: string;

  @Field(() => Int)
  periodeTahun: number;

  @Field(() => Int)
  periodeBulan: number;

  @Field(() => String)
  jenis: string;

  @Field(() => Number)
  nominal: number;

  @Field(() => Number, { nullable: true })
  gapok?: number;

  @Field(() => Number, { nullable: true })
  jasaDasar?: number;

  @Field(() => Boolean)
  isValidated: boolean;

  @Field(() => Int, { nullable: true })
  validasiId?: number;

  @Field(() => String, { nullable: true })
  tandaTangan?: string;

  @Field(() => String, { nullable: true })
  catatan?: string;

  @Field(() => String, { nullable: true })
  signedAt?: string;
}

@InputType()
export class SignGajiInput {
  @Field(() => Int)
  @IsNumber()
  @IsNotEmpty()
  gajiId: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  tandaTangan: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  catatan?: string;
}
```

- [ ] **Step 2: Commit Task 1**

---

### Task 2: Backend Gaji Validasi Repository

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/gaji-validasi.repository.ts`

**Interfaces:**
- Consumes: `SignGajiInput`, `GajiValidasiItemDto`
- Produces: `GajiValidasiRepository.findMyGajiValidasi`, `GajiValidasiRepository.createSignGaji`

- [ ] **Step 1: Implement `GajiValidasiRepository`**
- [ ] **Step 2: Commit Task 2**

---

### Task 3: Backend Gaji Validasi Service, Resolver, & Module Registration

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/gaji-validasi.service.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/gaji-validasi.resolver.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Produces: Query `myGajiValidasiList`, Mutation `signGaji`

- [ ] **Step 1: Implement `GajiValidasiService`**
- [ ] **Step 2: Implement `GajiValidasiResolver` with `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`**
- [ ] **Step 3: Register `GajiValidasiRepository`, `GajiValidasiService`, `GajiValidasiResolver` in `SdmModule`**
- [ ] **Step 4: Verify NestJS build / type check**
- [ ] **Step 5: Commit Task 3**

---

### Task 4: Frontend GraphQL Client Helper

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/gaji-validasi-gql-client.js`

**Interfaces:**
- Produces: `fetchMyGajiValidasiList`, `mutationSignGaji`

- [ ] **Step 1: Implement `gaji-validasi-gql-client.js` using authenticated GraphQL helper**
- [ ] **Step 2: Commit Task 4**

---

### Task 5: Frontend Halaman Menu Tanda Tangan Gaji & Jasa

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/tanda-tangan-gaji/page.js`

**Features:**
- Filter periode bulan dan tahun berjalan.
- Tab Gaji Pokok & Tab Jasa Pelayanan.
- Tampilan detail penerimaan, gapok/jasa dasar acuan, status validasi, dan preview tanda tangan.
- Modal canvas penandatanganan interaktif (`SignaturePad`) dan integrasi mutasi `mutationSignGaji`.

- [ ] **Step 1: Implement `/dashboard/tanda-tangan-gaji/page.js`**
- [ ] **Step 2: Commit Task 5**

---

### Task 6: Verification & End-to-End Testing

- [ ] **Step 1: Test NestJS build (`npm run build` in `website/backend`)**
- [ ] **Step 2: Test Next.js build / lint (`npm run lint` or syntax verification in `sdm`)**
- [ ] **Step 3: Final walkthrough document creation**
