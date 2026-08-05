# Task 2 Report: Create NestJS Backend Repository & Service for Rekap Pengawasan

## Status: DONE

## Overview
Implemented `RekapPengawasanRepository` and `RekapPengawasanService` for fetching employee performance oversight data without any financial or jasa fields.

## Created Files
1. **`website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts`**:
   - Injected `@InjectDataSource('sdm') private readonly dataSource: DataSource`.
   - Method `getRekapPengawasanList(bulan: number, tahun: number, departemen: string, sttsKerja: string, nama: string)`:
     - Queries `pegawai p` joining `departemen d`, `rekap_bulanan rb`, and `jadwal_pegawai jp`.
     - Includes subqueries for `count_reguler` (approved non-tambahan), `count_bonus` (approved tambahan), and `avg_skor` (AVG skor_total non-tambahan).
     - Filters by active status (`p.stts_aktif = 'AKTIF'`).
     - Supports optional filtering parameters: `departemen` (if not 'ALL'), `sttsKerja` (if not 'ALL'), and `nama` (if search string provided).
     - Orders by `p.nama ASC`.

2. **`website/backend/src/sdm/rekap-pengawasan.service.ts`**:
   - Class `@Injectable() export class RekapPengawasanService`.
   - Processes each employee's schedule and daily evaluation counts:
     - `total_hari_jadwal` (from `rb` if locked, else computed from schedule `jp`)
     - `hari_approved`
     - `hari_approved_bonus`
     - `gap_hari`
     - `rata_skor_total`
     - `status_rekap` ('LOCKED' if `rb.status_rekap === 'final'` or `'LOCKED'`, else `'DRAFT'`)
   - Computes overall summary metrics:
     - `totalEmployees`
     - `avgMonthlyScore` (rounded 2 decimals)
     - `totalLocked`
     - `totalDraft`
     - `compliancePercentage` (`totalEmployees > 0 ? Math.round((totalLocked / totalEmployees) * 10000) / 100 : 0`)
   - Applies pagination returning `data`, `meta`, and `summary`.
   - **Financial Isolation Verified**: Zero financial/jasa fields are exported or computed in this service.

## Verification & Build Summary
- `npm run build` executed in `website/backend`: Passed with exit code 0.
