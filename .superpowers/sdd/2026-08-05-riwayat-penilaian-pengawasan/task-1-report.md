# Task 1 Report: Create NestJS Backend GraphQL DTO Types

## Status: DONE

## Overview
Created GraphQL DTO object types for `RekapPengawasan` without financial/jasa fields.

## Created Files
1. **`website/backend/src/sdm/dto/rekap-pengawasan-types.ts`**:
   - `RekapPengawasanDto`:
     - `id?: number` (`@Field(() => Int, { nullable: true })`)
     - `pegawai_id: number` (`@Field(() => Int)`)
     - `nik?: string` (`@Field(() => String, { nullable: true })`)
     - `nama?: string` (`@Field(() => String, { nullable: true })`)
     - `nama_departemen?: string` (`@Field(() => String, { nullable: true })`)
     - `stts_kerja?: string` (`@Field(() => String, { nullable: true })`)
     - `bulan: number` (`@Field(() => Int)`)
     - `tahun: number` (`@Field(() => Int)`)
     - `total_hari_jadwal: number` (`@Field(() => Int)`)
     - `hari_approved: number` (`@Field(() => Int)`)
     - `hari_approved_bonus: number` (`@Field(() => Int)`)
     - `gap_hari: number` (`@Field(() => Int)`)
     - `rata_skor_total: number` (`@Field(() => Float)`)
     - `status_rekap: string` (`@Field(() => String)`)
     - *Excluded*: `nominal_jasa_dasar`, `pengurang_jasa`, `nominal_jasa_tambahan`, `nominal_jasa_final` (financial fields).

   - `RekapPengawasanSummaryDto`:
     - `totalEmployees: number` (`@Field(() => Int)`)
     - `avgMonthlyScore: number` (`@Field(() => Float)`)
     - `totalLocked: number` (`@Field(() => Int)`)
     - `totalDraft: number` (`@Field(() => Int)`)
     - `compliancePercentage: number` (`@Field(() => Float)`)

   - `RekapPengawasanPaginationDto`:
     - `data: RekapPengawasanDto[]` (`@Field(() => [RekapPengawasanDto])`)
     - `meta: PaginationMetaDto` (`@Field(() => PaginationMetaDto)`)
     - `summary: RekapPengawasanSummaryDto` (`@Field(() => RekapPengawasanSummaryDto)`)

2. **`website/backend/src/common/dto/pagination.dto.ts`**:
   - `PaginationMetaDto`: Common pagination metadata DTO for GraphQL endpoints.

## Verification
- Ran `npm run build` in `website/backend`: Passed with exit code 0.
