# Task 1 Implementation Report: Backend GraphQL & Repository Enhancement

## Status: DONE

### Summary of Changes
1. **`src/sdm/repositories/rekap-pengawasan.repository.ts`**:
   - Added subqueries for `count_pending` (`status = 'submitted'`) and `count_draft` (`status = 'draft' OR status = 'revisi'`).
   - Updated `queryParams` array to include the extra `[bulan, tahun]` placeholders in matching positional order.

2. **`src/sdm/rekap-pengawasan.service.ts`**:
   - Extracted `hari_pending` (`emp.count_pending`) and `hari_draft` (`emp.count_draft`).
   - Computed `hari_kosong` as `Math.max(0, gapHari - hariPending - hariDraft)`.
   - Included `hari_pending`, `hari_draft`, and `hari_kosong` in `allCalculatedRows`.

3. **`src/sdm/dto/rekap-pengawasan-types.ts`**:
   - Added `@Field(() => Int) hari_pending: number;`, `@Field(() => Int) hari_draft: number;`, and `@Field(() => Int) hari_kosong: number;` to `RekapPengawasanDto`.

4. **`src/schema.gql`**:
   - Updated `type RekapPengawasanDto` with `hari_pending: Int!`, `hari_draft: Int!`, and `hari_kosong: Int!`.

### Verification
- Executed `npm run build` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`.
- Build succeeded cleanly with exit code 0.
