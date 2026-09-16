# Rekap Jasa Dasar Nominal Overlap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filter jasa dasar nominal in monthly rekap using strict period overlap (`berlaku_mulai <= endDate AND (berlaku_sampai IS NULL OR berlaku_sampai >= startDate)`), preventing past/expired month nominals from leaking into subsequent months.

**Architecture:** Update NestJS backend SDM domain (`RekapBulananService` and `RekapBulananRepository`). Service calculates exact monthly date boundaries (`startDate`, `endDate`), and repository applies SQL overlap condition in subquery.

**Tech Stack:** NestJS, TypeORM, MySQL, TypeScript.

## Global Constraints
- Do not alter existing GraphQL schema types or query arguments.
- Only modify backend files `rekap-bulanan.service.ts` and `rekap-bulanan.repository.ts`.
- Maintain historical snapshot for locked (`status_rekap = 'final'`) records.

---

### Task 1: Update SQL Query in RekapBulananRepository

**Files:**
- Modify: `website/backend/src/sdm/repositories/rekap-bulanan.repository.ts:22-105`

**Interfaces:**
- Consumes: `startDate: string, endDate: string` from `RekapBulananService`
- Produces: `getRekapBulananList(bulan: number, tahun: number, departemen: string, nama: string, startDate: string, endDate: string): Promise<any[]>`

- [ ] **Step 1: Update method signature**
Update `getRekapBulananList` in `rekap-bulanan.repository.ts` to replace `dateStr: string` with `startDate: string, endDate: string`.

- [ ] **Step 2: Update SQL subquery for base incentive**
Replace existing subquery:
```sql
        -- base incentive
        (
          SELECT jdp.nominal_jasa_dasar 
          FROM jasa_dasar_pegawai jdp
          WHERE jdp.pegawai_id = p.id AND jdp.berlaku_mulai <= ?
          ORDER BY jdp.berlaku_mulai DESC
          LIMIT 1
        ) AS nominal_jasa_dasar
```
with:
```sql
        -- base incentive
        (
          SELECT jdp.nominal_jasa_dasar 
          FROM jasa_dasar_pegawai jdp
          WHERE jdp.pegawai_id = p.id 
            AND jdp.berlaku_mulai <= ?
            AND (jdp.berlaku_sampai IS NULL OR jdp.berlaku_sampai >= ?)
          ORDER BY jdp.berlaku_mulai DESC, jdp.id DESC
          LIMIT 1
        ) AS nominal_jasa_dasar
```

- [ ] **Step 3: Update `queryParams` array**
Replace `dateStr` binding with `endDate` and `startDate`:
```ts
    const queryParams: any[] = [
      bulan,
      tahun,
      bulan,
      tahun,
      bulan,
      tahun,
      endDate,
      startDate,
      bulan,
      tahun,
      bulan,
      tahun,
    ];
```

- [ ] **Step 4: Verify repository changes**
Verify that parameter indices match SQL query placeholders.

- [ ] **Step 5: Commit**
```bash
git add src/sdm/repositories/rekap-bulanan.repository.ts
git commit -m "fix(rekap): add berlaku_sampai overlap check in nominal_jasa_dasar subquery"
```

---

### Task 2: Calculate Month Boundaries in RekapBulananService

**Files:**
- Modify: `website/backend/src/sdm/rekap-bulanan.service.ts:37-56`

**Interfaces:**
- Consumes: `bulan: number, tahun: number`
- Produces: calls `this.repository.getRekapBulananList(bulan, tahun, departemen, nama, startDate, endDate)`

- [ ] **Step 1: Compute `startDate` and `endDate`**
In `getRekapBulanan` method of `website/backend/src/sdm/rekap-bulanan.service.ts`:
Replace:
```ts
    const formattedBulan = String(bulan).padStart(2, '0');
    const formattedTahun = String(tahun);
    const dateStr = `${formattedTahun}-${formattedBulan}-28`;
```
with:
```ts
    const formattedBulan = String(bulan).padStart(2, '0');
    const formattedTahun = String(tahun);
    const startDate = `${formattedTahun}-${formattedBulan}-01`;
    const lastDay = new Date(tahun, bulan, 0).getDate();
    const endDate = `${formattedTahun}-${formattedBulan}-${String(lastDay).padStart(2, '0')}`;
```

- [ ] **Step 2: Pass `startDate` and `endDate` to repository**
Update repository call:
```ts
    const rawEmployees = await this.repository.getRekapBulananList(
      bulan,
      tahun,
      departemen,
      nama,
      startDate,
      endDate,
    );
```

- [ ] **Step 3: Verify build compilation**
Run backend build check:
```bash
npm run build
```

- [ ] **Step 4: Commit**
```bash
git add src/sdm/rekap-bulanan.service.ts
git commit -m "fix(rekap): pass accurate month boundary dates to getRekapBulananList"
```

---

### Task 3: Verification

- [ ] **Step 1: Verify backend build**
Run: `npm run build` in `website/backend` and confirm 0 TypeScript errors.

- [ ] **Step 2: Test date overlap logic**
Verify edge cases:
- August 1 to August 31 record does NOT match September (start: 2026-09-01).
- Open-ended record (`berlaku_sampai: null`) continues to match September.
- Record starting in mid-month matches that month.
