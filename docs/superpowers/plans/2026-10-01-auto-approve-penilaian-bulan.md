# Auto-Approve Penilaian Kinerja Pegawai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement monthly auto-approval for daily performance evaluations (`penilaian_harian`) in `draft` and `submitted` (pending) status from the Riwayat Pengawasan dashboard.

**Architecture:** A NestJS GraphQL mutation `autoApprovePenilaianBulan` executes a TypeORM transaction updating candidate evaluations for active employees. A Next.js API proxy route forwards authenticated admin/SDM requests. The Riwayat Pengawasan frontend provides an `Auto-Approve Bulan Ini` button with confirmation modal and feedback toast.

**Tech Stack:** NestJS, GraphQL (code-first), TypeORM, MySQL, Next.js (App Router), Tailwind CSS, Lucide Icons.

## Global Constraints
- Target evaluation statuses: `submitted` (pending supervisor approval) and `draft` (unsubmitted by employee).
- Selection filters: target month (`bulan`), target year (`tahun`), and optional department (`departemen`).
- Activity score for draft: calculate from existing `kegiatan_harian` based on priority weight; if 0 activities, `skor_kegiatan = 0`.
- Total score formula: `round((skor_kegiatan * 60 + skor_absensi * 40) / 100)` (or 100 for bypassed cuti/dinas luar).
- Security: Protected by `GqlJwtSdmGuard` with permission restricted to `IT`, `SDM`, `SPI`, or pengawasan ACL users.

---

### Task 1: Backend DTO and Repository Method for Auto-Approve

**Files:**
- Modify: `website/backend/src/sdm/dto/rekap-pengawasan-types.ts`
- Modify: `website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts`
- Create: `website/backend/src/sdm/repositories/rekap-pengawasan.repository.spec.ts`

**Interfaces:**
- Produces:
  ```typescript
  @ObjectType()
  export class AutoApproveResultDto {
    @Field(() => Boolean)
    success: boolean;

    @Field(() => String)
    message: string;

    @Field(() => Int)
    totalProcessed: number;

    @Field(() => Int)
    totalSubmitted: number;

    @Field(() => Int)
    totalDraft: number;
  }
  ```
  And `RekapPengawasanRepository.autoApprovePenilaianBulan(bulan: number, tahun: number, departemen: string, userId: number): Promise<AutoApproveResultDto>`

- [ ] **Step 1: Write unit test for autoApprovePenilaianBulan**

Create `website/backend/src/sdm/repositories/rekap-pengawasan.repository.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { RekapPengawasanRepository } from './rekap-pengawasan.repository';
import { DataSource } from 'typeorm';

describe('RekapPengawasanRepository - autoApprovePenilaianBulan', () => {
  let repository: RekapPengawasanRepository;
  let dataSource: any;

  beforeEach(async () => {
    dataSource = {
      manager: {
        query: jest.fn(),
      },
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RekapPengawasanRepository,
        {
          provide: getDataSourceToken('sdm'),
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<RekapPengawasanRepository>(RekapPengawasanRepository);
  });

  it('should return 0 processed if no draft or submitted evaluations found', async () => {
    dataSource.transaction.mockImplementation(async (cb: any) => {
      const mockManager = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('FROM penilaian_harian')) return [];
          if (sql.includes('parameter_penilaian')) return [];
          return [];
        }),
      };
      return cb(mockManager);
    });

    const result = await repository.autoApprovePenilaianBulan(10, 2026, 'ALL', 99);
    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(0);
    expect(result.totalSubmitted).toBe(0);
    expect(result.totalDraft).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/sdm/repositories/rekap-pengawasan.repository.spec.ts` in `website/backend`
Expected: FAIL with `repository.autoApprovePenilaianBulan is not a function`.

- [ ] **Step 3: Implement AutoApproveResultDto and autoApprovePenilaianBulan repository method**

In `website/backend/src/sdm/dto/rekap-pengawasan-types.ts`, export `AutoApproveResultDto`.
In `website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts`, implement `autoApprovePenilaianBulan`:
```typescript
async autoApprovePenilaianBulan(
  bulan: number,
  tahun: number,
  departemen: string,
  userId: number,
): Promise<AutoApproveResultDto> {
  return await this.dataSource.transaction(async (manager) => {
    const paramsList = await manager.query(
      `SELECT kode, nilai_skor FROM parameter_penilaian WHERE kode IN ('KGT_BOBOT_TINGGI', 'KGT_BOBOT_SEDANG', 'KGT_BOBOT_RENDAH')`,
    );
    const wTinggi = Number(paramsList.find((p: any) => p.kode === 'KGT_BOBOT_TINGGI')?.nilai_skor || 3);
    const wSedang = Number(paramsList.find((p: any) => p.kode === 'KGT_BOBOT_SEDANG')?.nilai_skor || 2);
    const wRendah = Number(paramsList.find((p: any) => p.kode === 'KGT_BOBOT_RENDAH')?.nilai_skor || 1);

    let sql = `
      SELECT ph.id, ph.pegawai_id, ph.tanggal, ph.status, ph.skor_kegiatan, ph.skor_absensi, ph.skor_total, ph.sumber_absensi, ph.nilai_kondisi, ph.catatan_supervisor
      FROM penilaian_harian ph
      JOIN pegawai p ON p.id = ph.pegawai_id
      WHERE MONTH(ph.tanggal) = ?
        AND YEAR(ph.tanggal) = ?
        AND ph.status IN ('draft', 'submitted')
        AND p.stts_aktif = 'AKTIF'
    `;
    const queryParams: any[] = [bulan, tahun];
    if (departemen && departemen !== 'ALL') {
      sql += ` AND (p.departemen = ? OR EXISTS (SELECT 1 FROM departemen d WHERE d.dep_id = p.departemen AND d.nama = ?))`;
      queryParams.push(departemen, departemen);
    }

    const records = await manager.query(sql, queryParams);
    if (!records || records.length === 0) {
      return {
        success: true,
        message: 'Tidak ada penilaian draft atau pending pada bulan ini.',
        totalProcessed: 0,
        totalSubmitted: 0,
        totalDraft: 0,
      };
    }

    let totalSubmitted = 0;
    let totalDraft = 0;

    for (const item of records) {
      if (item.status === 'submitted') {
        const isBypassed = item.sumber_absensi === 'cuti' || (item.sumber_absensi === 'izin' && item.nilai_kondisi !== 'izin_dinas_dalam');
        const kSkor = Number(item.skor_kegiatan) || 0;
        const aSkor = Number(item.skor_absensi) || 0;
        const total = isBypassed ? 100 : Math.round(((kSkor * 60) + (aSkor * 40)) / 100);

        await manager.query(
          `UPDATE penilaian_harian 
           SET status = 'approved',
               skor_total = ?,
               approved_by = ?,
               approved_at = NOW(),
               catatan_supervisor = COALESCE(catatan_supervisor, '[Auto-Approved Pengawasan SDM]'),
               updated_at = NOW()
           WHERE id = ?`,
          [total, userId, item.id],
        );
        totalSubmitted++;
      } else if (item.status === 'draft') {
        const kegiatan = await manager.query(
          `SELECT prioritas, status_selesai FROM kegiatan_harian WHERE penilaian_id = ?`,
          [item.id],
        );

        let kSkor = 0;
        if (kegiatan && kegiatan.length > 0) {
          let totalBobot = 0;
          let bobotSelesai = 0;
          for (const k of kegiatan) {
            const w = k.prioritas === 'tinggi' ? wTinggi : k.prioritas === 'rendah' ? wRendah : wSedang;
            totalBobot += w;
            if (k.status_selesai === 'selesai' || k.status_selesai === 1 || k.status_selesai === '1') {
              bobotSelesai += w;
            }
          }
          kSkor = totalBobot > 0 ? Math.round((bobotSelesai / totalBobot) * 100) : 0;
        }

        const aSkor = item.skor_absensi !== null && item.skor_absensi !== undefined ? Number(item.skor_absensi) : 0;
        const isBypassed = item.sumber_absensi === 'cuti' || (item.sumber_absensi === 'izin' && item.nilai_kondisi !== 'izin_dinas_dalam');
        const total = isBypassed ? 100 : Math.round(((kSkor * 60) + (aSkor * 40)) / 100);

        await manager.query(
          `UPDATE penilaian_harian
           SET status = 'approved',
               skor_kegiatan = ?,
               skor_absensi = ?,
               skor_total = ?,
               approved_by = ?,
               approved_at = NOW(),
               catatan_supervisor = COALESCE(catatan_supervisor, '[Auto-Approved Pengawasan SDM - Draft]'),
               updated_at = NOW()
           WHERE id = ?`,
          [kSkor, aSkor, total, userId, item.id],
        );
        totalDraft++;
      }
    }

    const totalProcessed = totalSubmitted + totalDraft;
    return {
      success: true,
      message: `Berhasil menyetujui otomatis ${totalProcessed} penilaian (${totalSubmitted} pending supervisor, ${totalDraft} draft pegawai)`,
      totalProcessed,
      totalSubmitted,
      totalDraft,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/sdm/repositories/rekap-pengawasan.repository.spec.ts` in `website/backend`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/sdm/dto/rekap-pengawasan-types.ts src/sdm/repositories/rekap-pengawasan.repository.ts src/sdm/repositories/rekap-pengawasan.repository.spec.ts
git commit -m "feat(sdm): add autoApprovePenilaianBulan repository method and DTO"
```

---

### Task 2: Backend Service and Resolver Mutation

**Files:**
- Modify: `website/backend/src/sdm/rekap-pengawasan.service.ts`
- Modify: `website/backend/src/sdm/rekap-pengawasan.resolver.ts`

**Interfaces:**
- Consumes: `RekapPengawasanRepository.autoApprovePenilaianBulan`
- Produces: GraphQL Mutation `autoApprovePenilaianBulan(bulan: Int!, tahun: Int!, departemen: String): AutoApproveResultDto`

- [ ] **Step 1: Update RekapPengawasanService**

In `website/backend/src/sdm/rekap-pengawasan.service.ts`:
Add authorization check (verifying user department or ACL via existing logic or allowing `user.id`), then call `this.repository.autoApprovePenilaianBulan(bulan, tahun, departemen || 'ALL', Number(user.id))`.

- [ ] **Step 2: Update RekapPengawasanResolver**

In `website/backend/src/sdm/rekap-pengawasan.resolver.ts`:
Add mutation:
```typescript
@Mutation(() => AutoApproveResultDto, { name: 'autoApprovePenilaianBulan' })
async autoApprovePenilaianBulan(
  @CurrentUser() user: any,
  @Args('bulan', { type: () => Int }) bulan: number,
  @Args('tahun', { type: () => Int }) tahun: number,
  @Args('departemen', { type: () => String, nullable: true }) departemen?: string,
): Promise<AutoApproveResultDto> {
  return this.rekapPengawasanService.autoApprovePenilaianBulan(user, bulan, tahun, departemen);
}
```

- [ ] **Step 3: Run backend build to verify GraphQL schema generation & TypeScript compilation**

Run: `npm run build` in `website/backend`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add src/sdm/rekap-pengawasan.service.ts src/sdm/rekap-pengawasan.resolver.ts
git commit -m "feat(sdm): expose autoApprovePenilaianBulan GraphQL mutation"
```

---

### Task 3: Next.js API Route Proxy in Frontend (`sdm`)

**Files:**
- Create: `sdm/src/app/api/penilaian/auto-approve/route.js`

**Interfaces:**
- Consumes: POST HTTP request with JSON `{ bulan, tahun, departemen }`, auth cookie `auth_token`
- Produces: JSON response with `{ success, message, totalProcessed, totalSubmitted, totalDraft }`

- [ ] **Step 1: Implement route handler `sdm/src/app/api/penilaian/auto-approve/route.js`**

```javascript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function fetchGraphQL(query, variables, token) {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "GraphQL Error");
  }
  return json.data;
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    } catch {
      return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
    }

    const body = await request.json();
    const { bulan, tahun, departemen = "ALL" } = body;

    if (!bulan || !tahun) {
      return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
    }

    const query = `
      mutation AutoApprovePenilaianBulan($bulan: Int!, $tahun: Int!, $departemen: String) {
        autoApprovePenilaianBulan(bulan: $bulan, tahun: $tahun, departemen: $departemen) {
          success
          message
          totalProcessed
          totalSubmitted
          totalDraft
        }
      }
    `;

    const variables = {
      bulan: Number(bulan),
      tahun: Number(tahun),
      departemen: departemen || "ALL",
    };

    const data = await fetchGraphQL(query, variables, token);
    const result = data.autoApprovePenilaianBulan;

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Error in POST /api/penilaian/auto-approve:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit API route**

```bash
git add src/app/api/penilaian/auto-approve/route.js
git commit -m "feat(api): add auto-approve route proxy in sdm"
```

---

### Task 4: Frontend UI Button & Confirmation Dialog in Riwayat Pengawasan

**Files:**
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditFilters.jsx`
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`

**Interfaces:**
- Consumes: `onAutoApprove`, `isAutoApproving` props in `AuditFilters.jsx`
- Produces: `ConfirmationDialog` trigger, execution of `/api/penilaian/auto-approve`, toast feedback, and table/summary refresh.

- [ ] **Step 1: Add Auto-Approve button and modal triggers in AuditFilters.jsx**

Add `onAutoApproveClick` prop to `AuditFilters.jsx`.
Add button beside Print/Export:
```jsx
{onAutoApproveClick && (
  <button
    type="button"
    onClick={onAutoApproveClick}
    disabled={isAutoApproving}
    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all min-h-[36px] sm:min-h-0"
    title="Auto Approve seluruh status draft & pending supervisor di bulan terpilih"
  >
    {isAutoApproving ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : (
      <CheckCheck className="w-3.5 h-3.5 text-white" />
    )}
    <span>Auto-Approve Bulan Ini</span>
  </button>
)}
```

- [ ] **Step 2: Add confirmation state and handler in RiwayatPenilaianPengawasanPage**

In `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`:
- Import `ConfirmationDialog` from `@/components/ui/confirmation-dialog`.
- Add `isAutoApproving` state and `confirmDialog` state.
- Define `handleAutoApprove` calling `POST /api/penilaian/auto-approve`.
- On success, display alert / toast notification and call `fetchRekapPengawasan()`.
- Render `<ConfirmationDialog />` at the bottom of the page.

- [ ] **Step 3: Test syntax and build in sdm**

Run: `npm run lint` or syntax build check in `sdm`
Expected: 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/
git commit -m "feat(pengawasan): add auto-approve button and confirmation dialog"
```

---

### Task 5: Final End-to-End Verification

- [ ] **Step 1: Verify NestJS build**
  Run: `npm run build` in `website/backend`
  Expected: Success.

- [ ] **Step 2: Verify SDM Next.js routes**
  Run: `git status` in `sdm` and ensure all modified and new files are properly tracked.

- [ ] **Step 3: Verification commit**
  Commit any remaining docs or verification artifacts.
