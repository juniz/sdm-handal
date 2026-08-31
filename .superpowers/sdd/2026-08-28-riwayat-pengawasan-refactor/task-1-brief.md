# Task 1: Backend GraphQL & Repository Enhancement (`website/backend`)

## Context & Objective
Enhance `website/backend` so that the `rekapPengawasanList` query returns count of pending evaluations (`hari_pending`), draft/revisi evaluations (`hari_draft`), and empty workdays (`hari_kosong`) per employee in the specified month and year.

## Target Files
1. `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts`
2. `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/rekap-pengawasan.service.ts`
3. `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/rekap-pengawasan-types.ts`
4. `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/schema.gql`

## Implementation Steps
1. In `src/sdm/repositories/rekap-pengawasan.repository.ts`:
   In `employeeQuery`, add two subqueries:
   ```sql
   (
     SELECT COUNT(*)
     FROM penilaian_harian ph
     WHERE ph.pegawai_id = p.id
       AND MONTH(ph.tanggal) = ?
       AND YEAR(ph.tanggal) = ?
       AND ph.status = 'submitted'
   ) AS count_pending,
   (
     SELECT COUNT(*)
     FROM penilaian_harian ph
     WHERE ph.pegawai_id = p.id
       AND MONTH(ph.tanggal) = ?
       AND YEAR(ph.tanggal) = ?
       AND (ph.status = 'draft' OR ph.status = 'revisi')
   ) AS count_draft,
   ```
   Ensure the `queryParams` array has the corresponding `[bulan, tahun]` parameters pushed in matching order (note where they are placed in `queryParams`).

2. In `src/sdm/rekap-pengawasan.service.ts`:
   Extract `const hariPending = Number(emp.count_pending) || 0;` and `const hariDraft = Number(emp.count_draft) || 0;`.
   Compute `hari_kosong`:
   - If `isLocked`: `const hariKosong = Math.max(0, gapHari - hariPending - hariDraft);`
   - Else: `const hariKosong = Math.max(0, gapHari - hariPending - hariDraft);`
   Add `hari_pending: hariPending`, `hari_draft: hariDraft`, `hari_kosong: hariKosong` to `allCalculatedRows.push({...})`.

3. In `src/sdm/dto/rekap-pengawasan-types.ts`:
   Add to `RekapPengawasanDto`:
   ```ts
   @Field(() => Int)
   hari_pending: number;

   @Field(() => Int)
   hari_draft: number;

   @Field(() => Int)
   hari_kosong: number;
   ```

4. In `src/schema.gql`:
   Add `hari_pending: Int!`, `hari_draft: Int!`, `hari_kosong: Int!` to `type RekapPengawasanDto`.

5. Build Backend:
   Run `npm run build` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`.

## Report File
Write the report to `/Users/hardiko/Documents/Developer/NEXT/sdm/.superpowers/sdd/2026-08-28-riwayat-pengawasan-refactor/task-1-report.md`.
