# Notifikasi Revisi Penilaian Kinerja — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan alert banner di halaman dashboard dan halaman input penilaian harian saat ada penilaian dengan status `revisi`, memungkinkan pegawai langsung navigasi ke tanggal evaluasi yang perlu diperbaiki.

**Architecture:** Kolom `revisi_is_read` ditambahkan ke `penilaian_harian` untuk tracking read state. NestJS menyediakan GraphQL query (`penilaianRevisiList`) dan mutation (`markPenilaianRevisiRead`). Next.js API proxy meneruskan request ke GraphQL, dan React hook `usePenilaianRevisiNotif` fetch 1x on mount untuk mengisi banner komponen.

**Tech Stack:** NestJS GraphQL, Next.js 14 App Router, MySQL (`penilaian_harian`), TypeORM DataSource, `jose` (JWT verify), Lucide React icons.

## Global Constraints

- Tidak ada polling/SSE — fetch hanya 1x saat halaman pertama dibuka (on mount).
- Banner hanya muncul jika `revisiList.length > 0`.
- Klik [Buka] navigasi ke `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`.
- Dismiss manual: `revisi_is_read = TRUE` via mutation. Auto-dismiss: status ≠ `revisi` (sudah disubmit ulang).
- NestJS: guard `GqlJwtSdmGuard` + `GqlThrottlerGuard` wajib di resolver.
- Tidak menyentuh kode yang tidak berkaitan.

---

### Task 1: Database — Tambah Kolom `revisi_is_read`

**Files:**
- Run: SQL migration langsung di database SDM

**Interfaces:**
- Produces: kolom `revisi_is_read BOOLEAN NOT NULL DEFAULT FALSE` tersedia di tabel `penilaian_harian`

- [ ] **Step 1: Jalankan ALTER TABLE**

```sql
ALTER TABLE penilaian_harian
ADD COLUMN IF NOT EXISTS revisi_is_read BOOLEAN NOT NULL DEFAULT FALSE;
```

- [ ] **Step 2: Verifikasi kolom ada**

```sql
DESCRIBE penilaian_harian;
-- Pastikan baris "revisi_is_read | tinyint(1) | NO | | 0 |" muncul
```

- [ ] **Step 3: Commit catatan migration**

```bash
# Tidak ada file migration di project ini, cukup catat di git message
git commit --allow-empty -m "db: add revisi_is_read column to penilaian_harian"
```

---

### Task 2: Patch Route Handler — Reset `revisi_is_read` saat Supervisor Revisi

**Files:**
- Modify: `sdm/src/app/api/penilaian/harian/[id]/route.js` — sekitar baris 512–519

**Interfaces:**
- Consumes: kolom `revisi_is_read` dari Task 1
- Produces: setiap kali supervisor set `action='revisi'`, kolom `revisi_is_read` otomatis direset ke `FALSE`

- [ ] **Step 1: Temukan blok UPDATE action revisi**

Buka [`sdm/src/app/api/penilaian/harian/[id]/route.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/penilaian/harian/%5Bid%5D/route.js) dan cari baris sekitar 512:

```js
if (action === "revisi") {
  // ...
  await update({
    table: "penilaian_harian",
    data: {
      status: "revisi",
      catatan_supervisor: catatan_supervisor
    },
    where: { id: id }
  });
```

- [ ] **Step 2: Tambah `revisi_is_read: false` ke data UPDATE**

Ubah:
```js
data: {
  status: "revisi",
  catatan_supervisor: catatan_supervisor
},
```
Menjadi:
```js
data: {
  status: "revisi",
  catatan_supervisor: catatan_supervisor,
  revisi_is_read: false
},
```

- [ ] **Step 3: Verifikasi build masih OK**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
npm run build 2>&1 | tail -20
# Expected: "✓ Compiled successfully"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/penilaian/harian/\[id\]/route.js
git commit -m "fix: reset revisi_is_read when supervisor sets status to revisi"
```

---

### Task 3: NestJS — DTO, Repository, Service

**Files:**
- Create: `website/backend/src/sdm/dto/penilaian-notif-types.ts`
- Create: `website/backend/src/sdm/repositories/penilaian-notif.repository.ts`
- Create: `website/backend/src/sdm/penilaian-notif.service.ts`

**Interfaces:**
- Consumes: kolom `revisi_is_read` dari Task 1; `InjectDataSource('sdm')` pattern dari `rekap-pengawasan.repository.ts`
- Produces:
  - `PenilaianRevisiNotifDto` — type GraphQL untuk satu item revisi
  - `PenilaianNotifRepository.getRevisiPending(pegawaiId: number): Promise<PenilaianRevisiNotifDto[]>`
  - `PenilaianNotifRepository.markAsRead(id: number, pegawaiId: number): Promise<void>`
  - `PenilaianNotifService.getRevisiList(user: any): Promise<PenilaianRevisiNotifDto[]>`
  - `PenilaianNotifService.markRevisiRead(id: number, user: any): Promise<boolean>`

- [ ] **Step 1: Buat DTO file**

Buat `website/backend/src/sdm/dto/penilaian-notif-types.ts`:

```ts
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PenilaianRevisiNotifDto {
  @Field(() => Int)
  id: number;

  @Field()
  tanggal: string;

  @Field({ nullable: true })
  catatan_supervisor?: string;

  @Field()
  revisi_is_read: boolean;
}
```

- [ ] **Step 2: Buat Repository**

Buat `website/backend/src/sdm/repositories/penilaian-notif.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PenilaianRevisiNotifDto } from '../dto/penilaian-notif-types';

@Injectable()
export class PenilaianNotifRepository {
  constructor(
    @InjectDataSource('sdm') private readonly dataSource: DataSource,
  ) {}

  async getRevisiPending(pegawaiId: number): Promise<PenilaianRevisiNotifDto[]> {
    const rows = await this.dataSource.manager.query(
      `SELECT id, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
              catatan_supervisor, revisi_is_read
       FROM penilaian_harian
       WHERE pegawai_id = ? AND status = 'revisi' AND revisi_is_read = 0
       ORDER BY tanggal DESC`,
      [pegawaiId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      tanggal: r.tanggal,
      catatan_supervisor: r.catatan_supervisor ?? undefined,
      revisi_is_read: Boolean(r.revisi_is_read),
    }));
  }

  async markAsRead(id: number, pegawaiId: number): Promise<void> {
    await this.dataSource.manager.query(
      `UPDATE penilaian_harian SET revisi_is_read = TRUE
       WHERE id = ? AND pegawai_id = ?`,
      [id, pegawaiId],
    );
  }
}
```

- [ ] **Step 3: Buat Service**

Buat `website/backend/src/sdm/penilaian-notif.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PenilaianNotifRepository } from './repositories/penilaian-notif.repository';
import { PenilaianRevisiNotifDto } from './dto/penilaian-notif-types';

@Injectable()
export class PenilaianNotifService {
  constructor(private readonly repo: PenilaianNotifRepository) {}

  async getRevisiList(user: any): Promise<PenilaianRevisiNotifDto[]> {
    return this.repo.getRevisiPending(Number(user.id));
  }

  async markRevisiRead(id: number, user: any): Promise<boolean> {
    await this.repo.markAsRead(id, Number(user.id));
    return true;
  }
}
```

- [ ] **Step 4: Verifikasi TypeScript compile**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
npm run build 2>&1 | tail -20
# Expected: build sukses tanpa error
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
git add src/sdm/dto/penilaian-notif-types.ts \
        src/sdm/repositories/penilaian-notif.repository.ts \
        src/sdm/penilaian-notif.service.ts
git commit -m "feat(sdm): add penilaian notif DTO, repository, and service"
```

---

### Task 4: NestJS — Resolver & Register di SdmModule

**Files:**
- Create: `website/backend/src/sdm/penilaian-notif.resolver.ts`
- Modify: `website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: `PenilaianNotifService` dari Task 3; `GqlJwtSdmGuard`, `GqlThrottlerGuard`, `CurrentUser` dari pattern resolver yang sudah ada
- Produces:
  - GraphQL Query `penilaianRevisiList` → `[PenilaianRevisiNotifDto]`
  - GraphQL Mutation `markPenilaianRevisiRead(id: Int!)` → `Boolean`

- [ ] **Step 1: Buat Resolver**

Buat `website/backend/src/sdm/penilaian-notif.resolver.ts`:

```ts
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { GqlJwtSdmGuard } from './guards/gql-jwt-sdm.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PenilaianNotifService } from './penilaian-notif.service';
import { PenilaianRevisiNotifDto } from './dto/penilaian-notif-types';

@Resolver()
@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)
export class PenilaianNotifResolver {
  constructor(private readonly penilaianNotifService: PenilaianNotifService) {}

  @Query(() => [PenilaianRevisiNotifDto], { name: 'penilaianRevisiList' })
  async getPenilaianRevisiList(
    @CurrentUser() user: any,
  ): Promise<PenilaianRevisiNotifDto[]> {
    return this.penilaianNotifService.getRevisiList(user);
  }

  @Mutation(() => Boolean, { name: 'markPenilaianRevisiRead' })
  async markPenilaianRevisiRead(
    @CurrentUser() user: any,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.penilaianNotifService.markRevisiRead(id, user);
  }
}
```

- [ ] **Step 2: Daftarkan di SdmModule**

Buka [`website/backend/src/sdm/sdm.module.ts`](file:///Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts). Tambahkan 3 import di bagian atas:

```ts
import { PenilaianNotifResolver } from './penilaian-notif.resolver';
import { PenilaianNotifService } from './penilaian-notif.service';
import { PenilaianNotifRepository } from './repositories/penilaian-notif.repository';
```

Tambahkan ke array `providers` (setelah `AutoApprovalCronService`):

```ts
PenilaianNotifResolver,
PenilaianNotifService,
PenilaianNotifRepository,
```

- [ ] **Step 3: Verifikasi build**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
npm run build 2>&1 | tail -20
# Expected: build sukses tanpa error
```

- [ ] **Step 4: Commit**

```bash
git add src/sdm/penilaian-notif.resolver.ts src/sdm/sdm.module.ts
git commit -m "feat(sdm): add penilaian notif resolver and register in SdmModule"
```

---

### Task 5: Next.js — API Proxy Route

**Files:**
- Create: `sdm/src/app/api/notifications/penilaian-revisi/route.js`

**Interfaces:**
- Consumes: GraphQL `penilaianRevisiList` query dan `markPenilaianRevisiRead` mutation dari Task 4; pattern proxy dari `src/app/api/penilaian/rekap-pengawasan/route.js`
- Produces:
  - `GET /api/notifications/penilaian-revisi` → `{ success: true, data: PenilaianRevisiNotifDto[] }`
  - `PUT /api/notifications/penilaian-revisi` body `{ id: number }` → `{ success: true }`

- [ ] **Step 1: Buat file route proxy**

Buat `sdm/src/app/api/notifications/penilaian-revisi/route.js`:

```js
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
      Authorization: `Bearer ${token}`,
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

async function getVerifiedToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return token;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const token = await getVerifiedToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = `
      query {
        penilaianRevisiList {
          id
          tanggal
          catatan_supervisor
          revisi_is_read
        }
      }
    `;

    const data = await fetchGraphQL(query, {}, token);
    return NextResponse.json({ success: true, data: data.penilaianRevisiList });
  } catch (error) {
    console.error("Error GET /api/notifications/penilaian-revisi:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const token = await getVerifiedToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
    }

    const mutation = `
      mutation MarkPenilaianRevisiRead($id: Int!) {
        markPenilaianRevisiRead(id: $id)
      }
    `;

    await fetchGraphQL(mutation, { id: Number(id) }, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error PUT /api/notifications/penilaian-revisi:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verifikasi build**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
npm run build 2>&1 | tail -20
# Expected: "✓ Compiled successfully"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/notifications/penilaian-revisi/route.js
git commit -m "feat: add API proxy route for penilaian revisi notifications"
```

---

### Task 6: Next.js — Hook & Banner Component

**Files:**
- Create: `sdm/src/hooks/usePenilaianRevisiNotif.js`
- Create: `sdm/src/components/notifications/PenilaianRevisiAlert.js`

**Interfaces:**
- Consumes: `GET /api/notifications/penilaian-revisi` dan `PUT /api/notifications/penilaian-revisi` dari Task 5
- Produces:
  - Hook: `usePenilaianRevisiNotif()` → `{ revisiList, loading, markAsRead }`
  - Component: `<PenilaianRevisiAlert />` — self-contained, tidak butuh props

- [ ] **Step 1: Buat hook**

Buat `sdm/src/hooks/usePenilaianRevisiNotif.js`:

```js
"use client";

import { useState, useEffect, useCallback } from "react";

const usePenilaianRevisiNotif = () => {
  const [revisiList, setRevisiList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRevisi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/penilaian-revisi");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setRevisiList(data.data || []);
    } catch (err) {
      console.error("usePenilaianRevisiNotif fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setRevisiList((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch("/api/notifications/penilaian-revisi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("usePenilaianRevisiNotif markAsRead error:", err);
    }
  }, []);

  useEffect(() => {
    fetchRevisi();
  }, [fetchRevisi]);

  return { revisiList, loading, markAsRead };
};

export default usePenilaianRevisiNotif;
```

- [ ] **Step 2: Buat banner component**

Buat `sdm/src/components/notifications/PenilaianRevisiAlert.js`:

```js
"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, ExternalLink, X } from "lucide-react";
import usePenilaianRevisiNotif from "@/hooks/usePenilaianRevisiNotif";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

export default function PenilaianRevisiAlert() {
  const router = useRouter();
  const { revisiList, loading, markAsRead } = usePenilaianRevisiNotif();

  if (loading || revisiList.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm font-bold text-amber-800">
          {revisiList.length === 1
            ? "Ada 1 penilaian harian yang perlu direvisi"
            : `Ada ${revisiList.length} penilaian harian yang perlu direvisi`}
        </p>
      </div>

      {/* List */}
      <ul className="divide-y divide-amber-100 space-y-0">
        {revisiList.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <div className="flex items-start gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {moment(item.tanggal).format("DD MMM YYYY")}
                </p>
                {item.catatan_supervisor && (
                  <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">
                    &ldquo;{item.catatan_supervisor}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/penilaian-kinerja/input?tanggal=${item.tanggal}`
                  )
                }
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Buka
              </button>
              <button
                onClick={() => markAsRead(item.id)}
                className="p-1 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi build**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
npm run build 2>&1 | tail -20
# Expected: "✓ Compiled successfully"
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePenilaianRevisiNotif.js \
        src/components/notifications/PenilaianRevisiAlert.js
git commit -m "feat: add usePenilaianRevisiNotif hook and PenilaianRevisiAlert component"
```

---

### Task 7: Integrasi Banner ke Dashboard & Input Page

**Files:**
- Modify: `sdm/src/app/dashboard/page.js` — tambah banner setelah `<EmployeeCard />`
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/input/page.js` — tambah banner di atas form + support `?tanggal=` query param

**Interfaces:**
- Consumes: `<PenilaianRevisiAlert />` dari Task 6
- Produces: banner tampil di dashboard (baris 258, setelah `<EmployeeCard />`) dan di input page; `?tanggal=YYYY-MM-DD` URL param pre-select tanggal

- [ ] **Step 1: Pasang banner di dashboard**

Buka [`sdm/src/app/dashboard/page.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/page.js).

Tambah import di bagian atas (setelah import `NotificationBellMobile`):
```js
import PenilaianRevisiAlert from "@/components/notifications/PenilaianRevisiAlert";
```

Tambah component tepat setelah `<EmployeeCard />` (baris 258):
```jsx
{/* Notifikasi Revisi Penilaian */}
<PenilaianRevisiAlert />
```

- [ ] **Step 2: Pasang banner di input page**

Buka [`sdm/src/app/dashboard/penilaian-kinerja/input/page.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/input/page.js).

Tambah import di bagian atas:
```js
import { useSearchParams } from "next/navigation";
import PenilaianRevisiAlert from "@/components/notifications/PenilaianRevisiAlert";
```

Tambah `useSearchParams` di dalam komponen (setelah `const [selectedDate, ...]`):
```js
const searchParams = useSearchParams();
```

Modifikasi `resolveWorkDate` useEffect (baris 62–106): tambah pengecekan query param **sebelum** logika night shift. Di baris awal fungsi `resolveWorkDate`, tambah:
```js
// Jika ada query param ?tanggal=YYYY-MM-DD, gunakan itu langsung
const paramTanggal = searchParams.get("tanggal");
if (paramTanggal && /^\d{4}-\d{2}-\d{2}$/.test(paramTanggal)) {
  setSelectedDate(paramTanggal);
  return;
}
```

Tambah `<PenilaianRevisiAlert />` tepat setelah blok feedback banner `errorMsg` / `successMsg` (sekitar baris 586, sebelum bagian form kegiatan). Cari baris yang berisi `{/* ── Feedback banners */}` dan tambah setelahnya:
```jsx
{/* Notifikasi Revisi */}
<PenilaianRevisiAlert />
```

- [ ] **Step 3: Verifikasi build**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
npm run build 2>&1 | tail -20
# Expected: "✓ Compiled successfully"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.js \
        src/app/dashboard/penilaian-kinerja/input/page.js
git commit -m "feat: integrate PenilaianRevisiAlert banner into dashboard and input pages"
```

---

## Verification Plan

### Automated
```bash
# Backend build
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npm run build

# Frontend build
cd /Users/hardiko/Documents/Developer/NEXT/sdm && npm run build
```

### Manual End-to-End
1. Login sebagai supervisor → approve dengan `action='revisi'` pada salah satu penilaian harian pegawai → pastikan `revisi_is_read = 0` di DB.
2. Login sebagai pegawai tersebut → buka dashboard → banner muncul menampilkan tanggal evaluasi + catatan supervisor.
3. Klik **[Buka]** → halaman input terbuka dengan tanggal evaluation ter-preselect di date picker.
4. Klik **[✕]** → item hilang dari banner (optimistic dismiss) + `revisi_is_read = 1` di DB.
5. Refresh halaman → item sudah tidak muncul lagi (karena `revisi_is_read = 1`).
6. Submit ulang evaluasi → refresh halaman → banner tidak muncul (status ≠ `revisi`).
7. Supervisor revisi ulang → buka halaman baru → banner muncul kembali (karena `revisi_is_read` direset ke `FALSE`).
