# Bypass Penilaian Izin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan bypass otomatis penilaian kinerja harian (100% approved) untuk pegawai dengan `pengajuan_izin` yang disetujui selain `Dinas Dalam Kota` (yakni `Dinas Luar Kota`, `Perjalanan Dinas`, dan `Lain-lain`).

**Architecture:** Memperluas query dan transaksi deteksi cuti/izin di backend NestJS (`deteksi-cuti.repository.ts`), endpoint Next.js API (`deteksi-cuti`, `penilaian/harian`, `penilaian/harian/[id]`), serta antarmuka UI (`deteksi-cuti` dan `penilaian-kinerja/input`) untuk menangani izin dengan status approved dan urgensi non-Dinas Dalam Kota secara terpadu.

**Tech Stack:** NestJS, TypeORM / DataSource, GraphQL, Next.js (App Router), Tailwind CSS, Jest.

## Global Constraints
- Urgensi izin yang dibypass: `Dinas Luar Kota`, `Perjalanan Dinas`, `Lain-lain`.
- Urgensi izin yang **TIDAK** dibypass: `Dinas Dalam Kota`.
- Skor bypass: `skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, `status = 'approved'`.
- `sumber_absensi = 'izin'`, `ref_izin_no = no_pengajuan`, `ref_cuti_no = NULL`.
- Judul kegiatan harian dan catatan supervisor dinamis berdasarkan urgensi izin.

---

### Task 1: Backend NestJS Deteksi Cuti Repository & DTO

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/deteksi-cuti.repository.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/deteksi-cuti.service.spec.ts`

**Interfaces:**
- Consumes: `pengajuan_izin` query with `urgensi != 'Dinas Dalam Kota'`.
- Produces: `findDetectedLeaves` returning `jenis_dispensasi = 'izin_dinas'` (or `'izin'`) with proper `nilai_kondisi` (`izin_dinas_luar`, `izin_dinas`, `izin_lainnya`), and `executeBypassTransaction` inserting auto activities & supervisor notes based on urgency.

- [ ] **Step 1: Write test case for diverse izin urgency bypass in service spec**

In `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/deteksi-cuti.service.spec.ts`, add test for `Perjalanan Dinas` and `Lain-lain` bypass items:

```typescript
it('should execute bypass transaction for non-dinas-luar izin items', async () => {
  const input: BypassCutiInput = {
    items: [
      {
        pegawai_id: 1,
        nik: '12345',
        tanggal: '2026-09-22',
        no_pengajuan: 'IZN2026090002',
        urgensi: 'Perjalanan Dinas',
        jenis_dispensasi: 'izin_dinas',
      },
      {
        pegawai_id: 2,
        nik: '12346',
        tanggal: '2026-09-22',
        no_pengajuan: 'IZN2026090003',
        urgensi: 'Lain-lain',
        jenis_dispensasi: 'izin_dinas',
      },
    ],
  };

  (repository.executeBypassTransaction as jest.Mock).mockResolvedValue({
    success: true,
    message: 'Bypass penilaian berhasil untuk 2 jadwal izin',
    processedCount: 2,
  });

  const result = await service.processBypass(1, 'SDM', input);
  expect(result.success).toBe(true);
  expect(repository.executeBypassTransaction).toHaveBeenCalledWith(input.items);
});
```

- [ ] **Step 2: Run test to verify it passes or fails**

Run:
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/deteksi-cuti.service.spec.ts
```

- [ ] **Step 3: Update `deteksi-cuti.repository.ts`**

Update `findDetectedLeaves`:
1. Modify WHERE clause for `pengajuan_izin`:
```sql
WHERE pi.tanggal_awal <= ? AND pi.tanggal_akhir >= ?
  AND (LOWER(pi.status) LIKE '%setuju%' OR LOWER(pi.status) LIKE '%approved%' OR LOWER(pi.status) LIKE '%acc%')
  AND TRIM(pi.urgensi) != 'Dinas Dalam Kota'
```
2. Update `nilai_kondisi` assignment:
```typescript
let nilaiKondisi = 'Cuti';
if (cuti.jenis_dispensasi === 'izin_dinas') {
  if (cuti.urgensi === 'Dinas Luar Kota') nilaiKondisi = 'izin_dinas_luar';
  else if (cuti.urgensi === 'Perjalanan Dinas') nilaiKondisi = 'izin_dinas';
  else nilaiKondisi = 'izin_lainnya';
} else {
  nilaiKondisi = cuti.urgensi || 'Cuti';
}
```
3. In `executeBypassTransaction`:
```typescript
const isIzin =
  item.jenis_dispensasi === 'izin_dinas' ||
  ['Dinas Luar Kota', 'Perjalanan Dinas', 'Lain-lain'].includes(item.urgensi);

const sumberAbsensi = isIzin ? 'izin' : 'cuti';
const refIzinNo = isIzin ? item.no_pengajuan || null : null;
const refCutiNo = isIzin ? null : item.no_pengajuan || null;

let nilaiKondisi = item.urgensi || 'Cuti';
if (isIzin) {
  if (item.urgensi === 'Dinas Luar Kota') nilaiKondisi = 'izin_dinas_luar';
  else if (item.urgensi === 'Perjalanan Dinas') nilaiKondisi = 'izin_dinas';
  else nilaiKondisi = 'izin_lainnya';
}

const catatanSpv = isIzin
  ? `[Auto-Approved Sistem: Izin ${item.urgensi || 'Resmi'} - Ref: ${item.no_pengajuan || '-'}]`
  : null;
const judulKgtn = isIzin
  ? (item.urgensi === 'Dinas Luar Kota'
      ? 'Melaksanakan Tugas / Perjalanan Dinas Luar Kota'
      : `Melaksanakan Izin: ${item.urgensi || 'Resmi'}`)
  : `Cuti Terjadwal (Bypass Sistem: ${item.urgensi || 'Cuti'} / ${item.no_pengajuan || '-'})`;
const pjbKgtn = isIzin
  ? `Izin resmi (${item.urgensi || ''}) sesuai pengajuan nomor ${item.no_pengajuan || ''}`
  : judulKgtn;
```

- [ ] **Step 4: Run tests and verify**

Run:
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/deteksi-cuti.service.spec.ts
```

- [ ] **Step 5: Commit backend changes**

```bash
git add src/sdm/repositories/deteksi-cuti.repository.ts src/sdm/deteksi-cuti.service.spec.ts
git commit -m "feat(sdm): expand deteksi cuti to bypass all approved izin except dinas dalam kota"
```

---

### Task 2: Next.js SDM API Routes

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/it/deteksi-cuti/route.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/penilaian/harian/route.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/penilaian/harian/[id]/route.js`

**Interfaces:**
- Consumes: `pengajuan_izin` records with status approved and urgensi != `'Dinas Dalam Kota'`.
- Produces: API `/api/it/deteksi-cuti` returning all eligible izin, API `/api/penilaian/harian` auto-approving on creation and submit.

- [ ] **Step 1: Update `/src/app/api/it/deteksi-cuti/route.js`**

1. Modify SQL query for `pengajuan_izin`:
```sql
WHERE pi.tanggal_awal <= ? AND pi.tanggal_akhir >= ?
  AND (LOWER(pi.status) LIKE '%setuju%' OR LOWER(pi.status) LIKE '%approved%' OR LOWER(pi.status) LIKE '%acc%')
  AND TRIM(pi.urgensi) != 'Dinas Dalam Kota'
```
2. Update REST fallback bypass transaction with dynamic `catatan_supervisor`, `judul_kegiatan`, and `penjabaran` matching Task 1.

- [ ] **Step 2: Update `/src/app/api/penilaian/harian/route.js`**

1. Expand `isIzinBypassed`:
```javascript
const isCuti = resAbsen.sumber === "cuti";
const isIzinBypassed = resAbsen.sumber === "izin" && resAbsen.nilai_kondisi !== "izin_dinas_dalam";
const isBypassed = isCuti || isIzinBypassed;
```
2. In `insertData`:
```javascript
catatan_supervisor: isBypassed
  ? (isCuti
    ? `[Auto-Approved Sistem: Cuti ${(resAbsen.nilai_kondisi || "").replace(/_/g, " ")} - Ref: ${resAbsen.ref_no || "-"}]`
    : `[Auto-Approved Sistem: Izin ${(resAbsen.nilai_kondisi || "").replace(/_/g, " ")} - Ref: ${resAbsen.ref_no || "-"}]`)
  : null,
```
3. In activity insertion:
```javascript
} else if (isIzinBypassed) {
  const isDinasLuar = resAbsen.nilai_kondisi === "izin_dinas_luar";
  await insert({
    table: "kegiatan_harian",
    data: {
      penilaian_id: result.insertId,
      judul_kegiatan: isDinasLuar
        ? "Melaksanakan Tugas / Perjalanan Dinas Luar Kota"
        : `Melaksanakan Izin: ${(resAbsen.nilai_kondisi || "").replace(/_/g, " ")}`.trim(),
      penjabaran: `Izin resmi sesuai pengajuan nomor ${resAbsen.ref_no || ""}`.trim(),
      prioritas: "tinggi",
      status_selesai: "selesai",
      urutan: 1,
      selesai_at: new Date()
    }
  });
}
```

- [ ] **Step 3: Update `/src/app/api/penilaian/harian/[id]/route.js`**

Update approval logic on submit:
```javascript
const isCuti = harian.sumber_absensi === "cuti";
const isIzinBypassed = harian.sumber_absensi === "izin" && harian.nilai_kondisi !== "izin_dinas_dalam";
const isBypassed = isCuti || isIzinBypassed;
...
const autoApprovalCatatan = isCuti
  ? `[Auto-Approved Sistem: Cuti ${(harian.nilai_kondisi || "").replace(/_/g, " ")} - Ref: ${harian.ref_cuti_no || "-"}]`
  : `[Auto-Approved Sistem: Izin ${(harian.nilai_kondisi || "").replace(/_/g, " ")} - Ref: ${harian.ref_izin_no || "-"}]`;
```

- [ ] **Step 4: Verify API changes syntax**

Check syntax / linter in Next.js project.

- [ ] **Step 5: Commit API changes**

```bash
git add src/app/api/it/deteksi-cuti/route.js src/app/api/penilaian/harian/route.js src/app/api/penilaian/harian/[id]/route.js
git commit -m "feat(api): support auto-approval bypass for all approved non-dinas-dalam izin"
```

---

### Task 3: SDM Next.js UI Updates

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/it/deteksi-cuti/page.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/input/page.js`

**Interfaces:**
- UI components displaying accurate status, badges, filters, and read-only alerts.

- [ ] **Step 1: Update `deteksi-cuti/page.js`**

1. Filter options: change label from `"Hanya Dinas Luar Kota"` to `"Hanya Izin (Dinas & Lainnya)"` (keep value `DINAS_LUAR` for backward compatibility).
2. Badge display:
```javascript
{item.jenis_dispensasi === "cuti" ? (
  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
    Cuti: {item.urgensi}
  </Badge>
) : (
  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
    Izin: {item.urgensi}
  </Badge>
)}
```
3. Update modal text & summary breakdown to count cuti vs izin.

- [ ] **Step 2: Update `penilaian-kinerja/input/page.js`**

1. Update `isBypassedLeaveOrDuty`:
```javascript
const isCutiPegawai = attendanceInfo?.sumber === "cuti" || harianRecord?.sumber_absensi === "cuti" || (attendanceInfo?.nilai_kondisi && attendanceInfo.nilai_kondisi.startsWith("cuti_")) || attendanceInfo?.nilai_kondisi === "sakit";
const isIzinBypassed = (attendanceInfo?.sumber === "izin" || harianRecord?.sumber_absensi === "izin") && (attendanceInfo?.nilai_kondisi !== "izin_dinas_dalam" && harianRecord?.nilai_kondisi !== "izin_dinas_dalam");
const isBypassedLeaveOrDuty = isIzinBypassed || isCutiPegawai;
```
2. Update alert banner copy to state:
`Penilaian kinerja harian untuk tanggal ini telah otomatis diproses dan disetujui penuh oleh sistem (Bypass Izin: ${urgensi}).`

- [ ] **Step 3: Commit UI changes**

```bash
git add src/app/dashboard/it/deteksi-cuti/page.js src/app/dashboard/penilaian-kinerja/input/page.js
git commit -m "feat(ui): display unified izin bypass badges and input notice"
```

---

### Task 4: Verification & Build Check

**Files:**
- None (Build & run checks)

- [ ] **Step 1: Run NestJS tests**
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test
```
Expected: All tests pass.

- [ ] **Step 2: Build NestJS backend**
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend run build
```
Expected: Build succeeds without TypeScript errors.

- [ ] **Step 3: Build Next.js SDM frontend**
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/sdm run build
```
Expected: Next.js build passes.
