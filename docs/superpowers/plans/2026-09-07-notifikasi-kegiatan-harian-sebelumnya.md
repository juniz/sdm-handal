# Notifikasi Pengisian Kegiatan Harian Hari Sebelumnya Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan notifikasi popup interaktif di dashboard pegawai untuk mengingatkan pengisian/pengiriman kegiatan harian dalam 7 hari terakhir yang masih kosong atau berstatus draft.

**Architecture:** NestJS GraphQL endpoint `penilaianPendingList` di backend mengagregasi jadwal aktif (`jadwal_pegawai` / `jadwal_tambahan`) dan status `penilaian_harian` 7 hari terakhir. Next.js API proxy meneruskan request ke GraphQL, dan React hook `usePenilaianPendingNotif` memicu popup card `KegiatanPendingPopup` yang berjejer rapi dengan `RevisiNotifPopup` di dashboard.

**Tech Stack:** NestJS GraphQL, TypeORM DataSource, MySQL, Next.js 14 App Router, Framer Motion, Lucide React icons, Jose (JWT).

## Global Constraints
- Target rentang waktu: 7 hari terakhir (`CURDATE() - INTERVAL 7 DAY` s.d. `CURDATE() - INTERVAL 1 DAY`).
- Target status: Belum diisi (`belum_isi`, bila record tidak ada tapi ada jadwal aktif) dan `draft`.
- Eksklusi: status `submitted`, `approved`, `revisi` (revisi sudah dihandle popup revisi), serta jadwal `OFF` / `Libur`.

---

### Task 1: Backend DTO & GraphQL Schema Update

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/penilaian-notif-types.ts`

**Interfaces:**
- Produces: `PenilaianPendingNotifDto` GraphQL ObjectType

- [ ] **Step 1: Tambahkan `PenilaianPendingNotifDto`**

Di file `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/penilaian-notif-types.ts`, tambahkan class DTO:

```ts
@ObjectType()
export class PenilaianPendingNotifDto {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field()
  tanggal: string;

  @Field({ nullable: true })
  shift?: string;

  @Field()
  status: string;

  @Field(() => Int)
  kegiatan_count: number;
}
```

- [ ] **Step 2: Commit DTO change**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
git add src/sdm/dto/penilaian-notif-types.ts
git commit -m "feat(sdm): add PenilaianPendingNotifDto"
```

---

### Task 2: Backend Repository Query `getPendingPenilaian`

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/penilaian-notif.repository.ts`

**Interfaces:**
- Consumes: `PenilaianPendingNotifDto`
- Produces: `PenilaianNotifRepository.getPendingPenilaian(pegawaiId: number): Promise<PenilaianPendingNotifDto[]>`

- [ ] **Step 1: Implementasikan method `getPendingPenilaian`**

Di `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/penilaian-notif.repository.ts`:
1. Query 7 tanggal kalender terakhir (`CURDATE() - INTERVAL 7 DAY` s.d. `CURDATE() - INTERVAL 1 DAY`) dari database MySQL untuk konsistensi timezone.
2. Ambil distinct bulan dan tahun dari rentang tersebut, lalu ambil record `jadwal_pegawai` dan `jadwal_tambahan` untuk pegawai terkait.
3. Query `penilaian_harian` dan `COUNT(kegiatan_harian.id)` untuk pegawai terkait pada rentang 7 hari tersebut.
4. Cocokkan jadwal vs record penilaian:
   - Jika shift aktif (tidak kosong, bukan `'OFF'`, bukan `'Libur'`):
     - Jika tidak ada record di `penilaian_harian`: masukkan `{ tanggal, shift, status: 'belum_isi', kegiatan_count: 0 }`.
     - Jika record ada dan status `'draft'`: masukkan `{ id: row.id, tanggal, shift, status: 'draft', kegiatan_count }`.
5. Kembalikan array hasil berurutan tanggal descending.

- [ ] **Step 2: Commit Repository change**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
git add src/sdm/repositories/penilaian-notif.repository.ts
git commit -m "feat(sdm): implement getPendingPenilaian in PenilaianNotifRepository"
```

---

### Task 3: Backend Service & Resolver GraphQL Query

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/penilaian-notif.service.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/penilaian-notif.resolver.ts`

**Interfaces:**
- Produces: GraphQL Query `penilaianPendingList: [PenilaianPendingNotifDto!]!`

- [ ] **Step 1: Tambahkan method di `PenilaianNotifService`**

Di `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/penilaian-notif.service.ts`:
```ts
async getPendingList(user: any): Promise<PenilaianPendingNotifDto[]> {
  return this.repo.getPendingPenilaian(Number(user.id));
}
```

- [ ] **Step 2: Tambahkan Query di `PenilaianNotifResolver`**

Di `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/penilaian-notif.resolver.ts`:
```ts
@Query(() => [PenilaianPendingNotifDto], { name: 'penilaianPendingList' })
async getPenilaianPendingList(
  @CurrentUser() user: any,
): Promise<PenilaianPendingNotifDto[]> {
  return this.penilaianNotifService.getPendingList(user);
}
```

- [ ] **Step 3: Build & verify backend**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
npm run build
```
Pastikan kompilasi sukses dan schema.gql ter-update.

- [ ] **Step 4: Commit Backend changes**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
git add src/sdm/penilaian-notif.service.ts src/sdm/penilaian-notif.resolver.ts src/schema.gql
git commit -m "feat(sdm): add penilaianPendingList query to PenilaianNotifResolver"
```

---

### Task 4: Next.js API Proxy Route

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/notifications/penilaian-pending/route.js`

**Interfaces:**
- Produces: `GET /api/notifications/penilaian-pending` -> `{ success: true, data: PenilaianPendingNotifDto[] }`

- [ ] **Step 1: Buat API Route `penilaian-pending`**

Di `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/notifications/penilaian-pending/route.js`:
- Verifikasi `auth_token` cookie dengan `jose.jwtVerify`.
- Jalankan query GraphQL `penilaianPendingList`.
- Return `{ success: true, data: data.penilaianPendingList }`.

- [ ] **Step 2: Commit API Proxy Route**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
git add src/app/api/notifications/penilaian-pending/route.js
git commit -m "feat(api): add /api/notifications/penilaian-pending route"
```

---

### Task 5: Frontend Hook `usePenilaianPendingNotif`

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/hooks/usePenilaianPendingNotif.js`

**Interfaces:**
- Produces: `usePenilaianPendingNotif(): { pendingList, loading, isDismissed, dismissItem, dismissAll }`

- [ ] **Step 1: Buat hook `usePenilaianPendingNotif`**

Di `/Users/hardiko/Documents/Developer/NEXT/sdm/src/hooks/usePenilaianPendingNotif.js`:
- Fetch 1x on mount dari `/api/notifications/penilaian-pending`.
- Baca flag sessionStorage `"kegiatan_pending_dismissed"`.
- Provide `dismissAll()` (update sessionStorage) dan `dismissItem(tanggal)`.

- [ ] **Step 2: Commit hook**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
git add src/hooks/usePenilaianPendingNotif.js
git commit -m "feat(hooks): add usePenilaianPendingNotif hook"
```

---

### Task 6: UI Component `KegiatanPendingPopup` & Stacking Layout di Dashboard

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/components/notifications/KegiatanPendingPopup.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/components/notifications/RevisiNotifPopup.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/page.js`

**Interfaces:**
- Consumes: `usePenilaianPendingNotif`
- Produces: UI component `<KegiatanPendingPopup />`

- [ ] **Step 1: Buat komponen `KegiatanPendingPopup.js`**

Di `/Users/hardiko/Documents/Developer/NEXT/sdm/src/components/notifications/KegiatanPendingPopup.js`:
- Card dengan warna Sky/Blue (`bg-white border-sky-200/80`).
- Header icon `Clock` atau `FileEdit`, title `"Kegiatan Belum Dikirim"`, counter badge biru.
- Expandable list:
  - Tanggal format Indonesia (`moment(item.tanggal).format("dddd, DD MMMM YYYY")`).
  - Shift tag.
  - Status badge: `"Belum Diisi"` (merah/abu) atau `"Draft (X kegiatan)"` (kuning/amber).
  - Tombol aksi `[Isi / Kirim]` navigasi ke `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`.
  - Tombol dismiss item [X].

- [ ] **Step 2: Update `RevisiNotifPopup.js` dan `dashboard/page.js` untuk Stacking Layout**

- Di `RevisiNotifPopup.js`: ubah container terluar agar menjadi `pointer-events-auto w-full` (jika dibungkus container stack) atau kelola fixed class secara kooperatif.
- Di `dashboard/page.js`: bungkus `<RevisiNotifPopup />` dan `<KegiatanPendingPopup />` di dalam container floating stack:
```jsx
<div className="fixed top-16 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 space-y-3 pointer-events-none">
  <RevisiNotifPopup />
  <KegiatanPendingPopup />
</div>
```

- [ ] **Step 3: Verifikasi Build Frontend**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
npm run build
```
Pastikan kompilasi sukses tanpa error.

- [ ] **Step 4: Commit UI components & Dashboard changes**

```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
git add src/components/notifications/KegiatanPendingPopup.js src/components/notifications/RevisiNotifPopup.js src/app/dashboard/page.js
git commit -m "feat(ui): add KegiatanPendingPopup and stack notifications on dashboard"
```

---

### Task 7: End-to-End Verification & Walkthrough

- [ ] **Step 1: Build kedua repo**
- [ ] **Step 2: Verifikasi query GraphQL & API response**
- [ ] **Step 3: Buat dokumentasi walkthrough**
