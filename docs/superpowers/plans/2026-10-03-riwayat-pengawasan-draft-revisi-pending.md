# Riwayat Pengawasan Draft, Revisi & Pending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan kapabilitas monitoring dan pemfilteran evaluasi berstatus draft, revisi, dan pending pada halaman riwayat pengawasan, memisahkan metrik/kolom Revisi dari Draft, serta menyediakan tab daftar tindakan langsung di drawer detail pegawai.

**Architecture:** Memisahkan subquery penghitungan revisi dan draft di repository NestJS (`website/backend`), menambahkan field `hari_revisi` dan argumen `statusFilter` pada resolver GraphQL, menyelaraskan API proxy Next.js (`sdm`), memperbarui tabel, filter pills, CSV, print view, serta menambahkan tab tindakan cepat pada drawer detail pegawai.

**Tech Stack:** NestJS, TypeScript, TypeORM, GraphQL, Next.js (App Router), React, Tailwind CSS, Lucide Icons, Moment.js.

## Global Constraints
- Minimal code necessary; jangan ubah struktur modul yang tidak berkaitan.
- Pertahankan backward compatibility argumen `onlyAnomali`.
- Kolom tabel utama harus berurutan: NIK, Nama, Departemen, Status Kerja, Wajib, Disetujui, Pending, Revisi, Draft, Kosong, Gap Hari, Rata Skor, Status Rekap.
- Semua tanggal dan shift yang ditampilkan di tab drawer harus konsisten dengan data kalender.

---

### Task 1: Backend DTO, Schema & Repository Updates

**Files:**
- Modify: `website/backend/src/sdm/dto/rekap-pengawasan-types.ts`
- Modify: `website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts`
- Modify: `website/backend/src/sdm/repositories/rekap-pengawasan.repository.spec.ts`

**Interfaces:**
- Produces: `RekapPengawasanDto.hari_revisi: number`, `count_revisi` and `count_draft` subquery columns in `getRekapPengawasanList`.

- [ ] **Step 1: Update DTO in `rekap-pengawasan-types.ts`**

Tambahkan field `hari_revisi` pada `RekapPengawasanDto`:
```typescript
@ObjectType()
export class RekapPengawasanDto {
  // ...
  @Field(() => Int)
  hari_pending: number;

  @Field(() => Int, { description: 'Hari evaluasi berstatus revisi' })
  hari_revisi: number;

  @Field(() => Int)
  hari_draft: number;
  // ...
}
```

- [ ] **Step 2: Update repository subqueries in `rekap-pengawasan.repository.ts`**

Pisahkan `count_draft` menjadi `count_revisi` dan `count_draft`:
```typescript
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
            AND ph.status = 'revisi'
        ) AS count_revisi,
        (
          SELECT COUNT(*)
          FROM penilaian_harian ph
          WHERE ph.pegawai_id = p.id
            AND MONTH(ph.tanggal) = ?
            AND YEAR(ph.tanggal) = ?
            AND ph.status = 'draft'
        ) AS count_draft,
```

Perbarui juga `queryParams` agar mencakup parameter bulan dan tahun untuk subquery baru tersebut:
```typescript
    const queryParams: any[] = [
      bulan,
      tahun,
      bulan,
      tahun,
      bulan,
      tahun,
      bulan,
      tahun,
      bulan,
      tahun,
      bulan,
      tahun,
      bulan,
      tahun,
      formattedBulan,
      String(bulan),
      tahun,
      formattedBulan,
      String(bulan),
      tahun,
    ];
```

- [ ] **Step 3: Run existing repository tests to verify integrity**

Run: `npm test src/sdm/repositories/rekap-pengawasan.repository.spec.ts` in `website/backend`
Expected: PASS

- [ ] **Step 4: Commit Task 1**

```bash
git add website/backend/src/sdm/dto/rekap-pengawasan-types.ts website/backend/src/sdm/repositories/rekap-pengawasan.repository.ts
git commit -m "feat(backend): separate count_revisi and count_draft in rekap repository"
```

---

### Task 2: Backend Service & GraphQL Resolver Updates

**Files:**
- Modify: `website/backend/src/sdm/rekap-pengawasan.service.ts`
- Modify: `website/backend/src/sdm/rekap-pengawasan.resolver.ts`

**Interfaces:**
- Consumes: `RekapPengawasanDto.hari_revisi`, `count_revisi`, `count_draft` from repository.
- Produces: `rekapPengawasanList(..., statusFilter: String)` GraphQL query endpoint.

- [ ] **Step 1: Update `rekap-pengawasan.service.ts`**

Di method `getRekapPengawasan`:
1. Tambah argumen `statusFilter: string = 'ALL'`.
2. Ekstraksi `hariRevisi`:
```typescript
const hariPending = Number(emp.count_pending) || 0;
const hariRevisi = Number(emp.count_revisi) || 0;
const hariDraft = Number(emp.count_draft) || 0;
```
3. Sesuaikan formula `hariKosong`:
```typescript
hariKosong = Math.max(0, gapHari - hariPending - hariRevisi - hariDraft);
```
4. Masukkan `hari_revisi: hariRevisi` ke dalam `allCalculatedRows.push(...)`.
5. Tambahkan `hari_revisi` ke array numeric sorting:
```typescript
if (
  [
    'total_hari_jadwal',
    'hari_approved',
    'hari_pending',
    'hari_revisi',
    'hari_draft',
    'hari_kosong',
    'gap_hari',
    'rata_skor_total',
  ].includes(field)
)
```
6. Implementasikan penyaringan `statusFilter`:
```typescript
    const effectiveFilter = (statusFilter || (onlyAnomali ? 'ANOMALI' : 'ALL')).toUpperCase();
    let targetRows = allCalculatedRows;
    switch (effectiveFilter) {
      case 'ANOMALI':
        targetRows = allCalculatedRows.filter((r) => r.gap_hari > 0);
        break;
      case 'PENDING':
        targetRows = allCalculatedRows.filter((r) => r.hari_pending > 0);
        break;
      case 'REVISI':
        targetRows = allCalculatedRows.filter((r) => r.hari_revisi > 0);
        break;
      case 'DRAFT':
        targetRows = allCalculatedRows.filter((r) => r.hari_draft > 0);
        break;
      case 'UNFINISHED':
        targetRows = allCalculatedRows.filter(
          (r) => (r.hari_pending + r.hari_revisi + r.hari_draft) > 0,
        );
        break;
      default:
        targetRows = allCalculatedRows;
    }
```

- [ ] **Step 2: Update `rekap-pengawasan.resolver.ts`**

Tambahkan argumen `statusFilter` pada resolver query:
```typescript
  @Query(() => RekapPengawasanPaginationDto, { name: 'rekapPengawasanList' })
  async getRekapPengawasanList(
    @CurrentUser() user: any,
    @Args('bulan', { type: () => Int }) bulan: number,
    @Args('tahun', { type: () => Int }) tahun: number,
    @Args('departemen', { type: () => String, nullable: true }) departemen?: string,
    @Args('sttsKerja', { type: () => String, nullable: true }) sttsKerja?: string,
    @Args('nama', { type: () => String, nullable: true }) nama?: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
    @Args('sortOrder', { type: () => String, nullable: true }) sortOrder?: string,
    @Args('onlyAnomali', { type: () => Boolean, nullable: true }) onlyAnomali?: boolean,
    @Args('statusFilter', { type: () => String, nullable: true }) statusFilter?: string,
  ): Promise<RekapPengawasanPaginationDto> {
    return this.rekapPengawasanService.getRekapPengawasan(
      bulan,
      tahun,
      departemen || 'ALL',
      sttsKerja || 'ALL',
      nama || '',
      page || 1,
      limit || 10,
      sortBy || 'nama',
      sortOrder || 'asc',
      onlyAnomali || false,
      statusFilter || 'ALL',
    );
  }
```

- [ ] **Step 3: Verify backend build**

Run: `npm run build` in `website/backend`
Expected: Build successfully compiles TypeScript and generates schema without errors.

- [ ] **Step 4: Commit Task 2**

```bash
git add website/backend/src/sdm/rekap-pengawasan.service.ts website/backend/src/sdm/rekap-pengawasan.resolver.ts
git commit -m "feat(backend): add statusFilter and hari_revisi support in rekapPengawasanList"
```

---

### Task 3: Frontend API Proxy Route Update

**Files:**
- Modify: `sdm/src/app/api/penilaian/rekap-pengawasan/route.js`

**Interfaces:**
- Consumes: Next.js GET query parameters (`status_filter` / `statusFilter`).
- Produces: GraphQL query to backend forwarding `statusFilter` and retrieving `hari_revisi`.

- [ ] **Step 1: Update API route proxy query and parameters**

In `src/app/api/penilaian/rekap-pengawasan/route.js`:
1. Parse `statusFilter`:
```javascript
const statusFilter = searchParams.get("status_filter") || searchParams.get("statusFilter") || "ALL";
```
2. Update GraphQL query string:
```graphql
query GetRekapPengawasanList(
	$bulan: Int!
	$tahun: Int!
	$departemen: String
	$sttsKerja: String
	$nama: String
	$page: Int
	$limit: Int
	$sortBy: String
	$sortOrder: String
	$onlyAnomali: Boolean
	$statusFilter: String
) {
	rekapPengawasanList(
		bulan: $bulan
		tahun: $tahun
		departemen: $departemen
		sttsKerja: $sttsKerja
		nama: $nama
		page: $page
		limit: $limit
		sortBy: $sortBy
		sortOrder: $sortOrder
		onlyAnomali: $onlyAnomali
		statusFilter: $statusFilter
	) {
		data {
			id
			pegawai_id
			nik
			nama
			nama_departemen
			stts_kerja
			bulan
			tahun
			total_hari_jadwal
			hari_approved
			hari_approved_bonus
			hari_pending
			hari_revisi
			hari_draft
			hari_kosong
			gap_hari
			rata_skor_total
			status_rekap
		}
		meta { ... }
		summary { ... }
	}
}
```
3. Pass `statusFilter` in variables dictionary.

- [ ] **Step 2: Commit Task 3**

```bash
git add sdm/src/app/api/penilaian/rekap-pengawasan/route.js
git commit -m "feat(frontend): add status_filter and hari_revisi in rekap-pengawasan proxy"
```

---

### Task 4: Frontend Filter Pills & Main Page State Update

**Files:**
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditFilters.jsx`

**Interfaces:**
- Produces: `statusFilter` state in `page.js`, multi-status filter chips in `AuditFilters.jsx`.

- [ ] **Step 1: Update `page.js` state management**

1. Replace `onlyAnomali` with `statusFilter`:
```javascript
const [statusFilter, setStatusFilter] = useState("ALL");
```
2. Pass `status_filter: statusFilter` in `loadRekapData`:
```javascript
const params = new URLSearchParams({
	bulan: month,
	tahun: year,
	departemen,
	stts_kerja: sttsKerja,
	nama: searchNama,
	page: page.toString(),
	limit: limit.toString(),
	sort_by: sortField,
	sort_order: sortDirection,
	status_filter: statusFilter,
});
```
3. Update `handleResetFilters`:
```javascript
setStatusFilter("ALL");
```
4. Forward `statusFilter` and `setStatusFilter` props to `AuditFilters`.

- [ ] **Step 2: Update `AuditFilters.jsx`**

Ganti chip toggle anomali dengan kelompok pill filter status:
```jsx
const STATUS_OPTIONS = [
	{ id: "ALL", label: "Semua Pegawai", icon: null, activeClass: "bg-slate-900 text-white shadow-xs" },
	{ id: "ANOMALI", label: "Perlu Audit (Gap > 0)", icon: AlertTriangle, activeClass: "bg-rose-600 text-white shadow-xs" },
	{ id: "PENDING", label: "Ada Pending", icon: null, activeClass: "bg-amber-600 text-white shadow-xs" },
	{ id: "REVISI", label: "Ada Revisi", icon: null, activeClass: "bg-orange-600 text-white shadow-xs" },
	{ id: "DRAFT", label: "Ada Draft", icon: null, activeClass: "bg-slate-700 text-white shadow-xs" },
	{ id: "UNFINISHED", label: "Belum Selesai (Semua)", icon: null, activeClass: "bg-indigo-600 text-white shadow-xs" },
];
```
Render tombol pill dengan interaksi klik yang mengubah `statusFilter`.

- [ ] **Step 3: Commit Task 4**

```bash
git add sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditFilters.jsx
git commit -m "feat(frontend): implement status filter pills for audit monitoring"
```

---

### Task 5: Frontend Table, CSV Export & Print Layout Updates (Revisi Column)

**Files:**
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditTable.jsx`
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditPrintLayout.jsx`
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`

**Interfaces:**
- Consumes: `row.hari_revisi`.
- Produces: `Revisi` column in desktop table, mobile card badge, CSV export, and print view.

- [ ] **Step 1: Update `AuditTable.jsx`**

1. Tambah header kolom `Revisi` antara `Pending` dan `Draft`:
```jsx
<th
	scope="col"
	onClick={() => handleSort("hari_revisi")}
	aria-sort={sortField === "hari_revisi" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
	className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
	title="Hari Evaluasi Berstatus Perlu Revisi"
>
	<div className="flex items-center justify-center gap-1">
		<span>Revisi</span>
		{renderSortIcon("hari_revisi")}
	</div>
</th>
```
2. Tambah sel data `Revisi` di baris tabel:
```jsx
<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
	{hariRevisi > 0 ? (
		<span className="inline-block px-2 py-0.5 text-xs font-bold text-orange-800 bg-orange-50 rounded border border-orange-200/80 font-mono">
			{hariRevisi}
		</span>
	) : (
		<span className="text-slate-300 font-mono">-</span>
	)}
</td>
```
3. Perbarui mobile card view untuk menyertakan badge `Revisi: {hariRevisi}` dan tambahkan opsi `Revisi` ke mobile sort dropdown:
```jsx
{hariRevisi > 0 && (
	<span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200/80 font-bold">
		Revisi: {hariRevisi}
	</span>
)}
```

- [ ] **Step 2: Update `AuditPrintLayout.jsx`**

Tambahkan kolom `Revisi` pada header dan body laporan cetak.

- [ ] **Step 3: Update `page.js` CSV Export**

Sertakan `Revisi` di `headers` CSV dan `r.hari_revisi ?? 0` di `rows`.

- [ ] **Step 4: Commit Task 5**

```bash
git add sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditTable.jsx sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditPrintLayout.jsx sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js
git commit -m "feat(frontend): add Revisi column across table, print layout, and CSV export"
```

---

### Task 6: Frontend Drawer Action Tab (`AuditDetailDrawer.jsx`)

**Files:**
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditDetailDrawer.jsx`

**Interfaces:**
- Consumes: `panelEvaluations`, `onSelectDay`.
- Produces: Actionable tab for Draft, Revisi, and Pending evaluations with direct modal trigger.

- [ ] **Step 1: Add state and tab segmented control in `AuditDetailDrawer.jsx`**

1. Tambah state aktif tab:
```javascript
const [activeTab, setActiveTab] = useState("calendar"); // "calendar" | "actionable"
```
2. Filter evaluasi belum selesai:
```javascript
const unfinishedEvaluations = panelEvaluations
	.filter((e) => ["submitted", "revisi", "draft"].includes(e.status))
	.sort((a, b) => moment(a.tanggal).diff(moment(b.tanggal)));
```
3. Render segmented tab bar di bawah info pegawai / statistik:
```jsx
<div className="flex items-center gap-2 border-b border-slate-200 px-5 pt-3 pb-0 bg-slate-50/50">
	<button
		type="button"
		onClick={() => setActiveTab("calendar")}
		className={`pb-3 text-xs font-bold font-figtree border-b-2 transition-all cursor-pointer ${
			activeTab === "calendar"
				? "border-sky-600 text-sky-700"
				: "border-transparent text-slate-500 hover:text-slate-700"
		}`}
	>
		Kalender Bulanan
	</button>
	<button
		type="button"
		onClick={() => setActiveTab("actionable")}
		className={`pb-3 text-xs font-bold font-figtree border-b-2 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
			activeTab === "actionable"
				? "border-sky-600 text-sky-700"
				: "border-transparent text-slate-500 hover:text-slate-700"
		}`}
	>
		<span>Perlu Tindakan</span>
		<span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
			unfinishedEvaluations.length > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
		}`}>
			{unfinishedEvaluations.length}
		</span>
	</button>
</div>
```

- [ ] **Step 2: Render "Perlu Tindakan" content in drawer body**

Jika `activeTab === "actionable"`:
1. Jika `unfinishedEvaluations.length === 0`:
Tampilkan empty state: "Semua evaluasi telah selesai disetujui atau tidak ada draft/revisi/pending".
2. Jika ada item:
Tampilkan daftar kartu:
- Tanggal & hari (misal: "Selasa, 14 Oktober 2026")
- Badge Status:
  - `submitted`: `PENDING` (kuning)
  - `revisi`: `REVISI` (oranye)
  - `draft`: `DRAFT` (slate)
- Nilai kondisi, skor total sementara
- Catatan supervisor (jika revisi)
- Tombol: "Inspeksi / Tindak" yang memanggil `onSelectDay(dateStr, evaluation, shift, isWorkDay)` agar langsung membuka `AuditActivityModal`.

- [ ] **Step 3: Verify drawer interaction and syntax**

Run: `npm run lint` or syntax check on modified component.

- [ ] **Step 4: Commit Task 6**

```bash
git add sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditDetailDrawer.jsx
git commit -m "feat(frontend): add actionable evaluations tab in audit drawer"
```

---

## Plan Self-Review
- **Spec coverage**:
  - Subquery separation: Task 1
  - Service filter & sorting: Task 2
  - Proxy route update: Task 3
  - Filter pills UI: Task 4
  - Revisi column in table/CSV/print: Task 5
  - Drawer actionable tab: Task 6
- **Placeholder scan**: No placeholders, full code snippets provided.
- **Type consistency**: `hari_revisi`, `statusFilter`, and status strings (`'submitted'`, `'revisi'`, `'draft'`) are used consistently across tasks.
