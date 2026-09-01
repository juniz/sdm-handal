# Bypass Manual Penilaian Khusus Pegawai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan kemampuan bypass penilaian harian 100% manual untuk pegawai tertentu dalam rentang tanggal tanpa bergantung cuti/izin melalui tab baru di `/dashboard/it/deteksi-cuti`.

**Architecture:**
- NestJS SDM Module menambah Mutation GraphQL `bypassManualPegawai(input: BypassManualPegawaiInput)`.
- `DeteksiCutiRepository` mengeksekusi transaksi database untuk membuat/mengupdate `penilaian_harian` (skor 100, status `approved`, sumber `manual_bypass`, catatan supervisor) dan menyisipkan `kegiatan_harian` default.
- UI `/dashboard/it/deteksi-cuti` menambah Tab Switcher (Deteksi Cuti vs Bypass Khusus Pegawai) dengan form pemilihan pegawai, rentang tanggal, shift, dan alasan dispensasi.

**Tech Stack:** NestJS 10, TypeORM, Apollo GraphQL, MySQL, Next.js 15, React 19, Tailwind CSS.

## Global Constraints

- Workspace Backend: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Workspace Frontend: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Target Database: Connection `'sdm'`
- Skor Bypass: `skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, `status = 'approved'`, `sumber_absensi = 'manual_bypass'`
- Kegiatan Harian Default: `Bypass Nilai Khusus (<alasan>)`
- Brand Tokens: Brand Cyan `sky-*` per `DESIGN.md`

---

### Task 1: Backend DTOs & Repository Layer

**Files:**
- Modify: `src/sdm/dto/deteksi-cuti-types.ts`
- Modify: `src/sdm/repositories/deteksi-cuti.repository.ts`
- Modify: `src/sdm/repositories/deteksi-cuti.repository.spec.ts`

**Interfaces:**
- Produces: `BypassManualPegawaiInput`, `BypassManualResultDto`, method `executeManualBypassTransaction`

- [ ] **Step 1: Update DTOs**
Tambah `BypassManualPegawaiInput` dan `BypassManualResultDto` ke `src/sdm/dto/deteksi-cuti-types.ts`.

- [ ] **Step 2: Update DeteksiCutiRepository**
Tambahkan method `executeManualBypassTransaction(input: BypassManualPegawaiInput)`:
- Validasi rentang tanggal.
- Loop setiap tanggal dari `tanggal_awal` s.d. `tanggal_akhir`.
- Lookup shift dari `jadwal_pegawai` / `jadwal_tambahan` jika `input.shift` tidak diberikan.
- Upsert `penilaian_harian` dan insert `kegiatan_harian` dalam `dataSource.transaction`.

- [ ] **Step 3: Update Unit Tests & Run**
Run: `npm test -- src/sdm/repositories/deteksi-cuti.repository.spec.ts` di `website/backend`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/sdm/dto/deteksi-cuti-types.ts src/sdm/repositories/deteksi-cuti.repository.ts src/sdm/repositories/deteksi-cuti.repository.spec.ts
git commit -m "feat(sdm): add manual bypass DTOs and repository transaction method"
```

---

### Task 2: Backend Service & GraphQL Resolver

**Files:**
- Modify: `src/sdm/deteksi-cuti.service.ts`
- Modify: `src/sdm/deteksi-cuti.resolver.ts`
- Modify: `src/sdm/deteksi-cuti.service.spec.ts`
- Modify: `src/schema.gql`

**Interfaces:**
- Produces: Mutation `bypassManualPegawai`

- [ ] **Step 1: Update DeteksiCutiService**
Tambahkan `processManualBypass(userId: number, dept: string, input: BypassManualPegawaiInput)` dengan auth check IT/SDM/SPI.

- [ ] **Step 2: Update DeteksiCutiResolver**
Tambahkan mutation `@Mutation(() => BypassManualResultDto, { name: 'bypassManualPegawai' })`.

- [ ] **Step 3: Update Unit Tests & Build**
Run: `npm test -- src/sdm/deteksi-cuti.service.spec.ts && npm run build` di `website/backend`
Expected: PASS dan schema.gql ter-update.

- [ ] **Step 4: Commit**
```bash
git add src/sdm/deteksi-cuti.service.ts src/sdm/deteksi-cuti.resolver.ts src/sdm/deteksi-cuti.service.spec.ts src/schema.gql
git commit -m "feat(sdm): add bypassManualPegawai GraphQL mutation and service method"
```

---

### Task 3: Frontend Client & Tab UI di Halaman Deteksi Cuti

**Files:**
- Modify: `src/lib/deteksi-cuti-gql-client.js`
- Modify: `src/app/dashboard/it/deteksi-cuti/page.js`

**Interfaces:**
- Produces: `executeBypassManualGql(input)` dan UI Tab Switcher + Form Bypass Manual.

- [ ] **Step 1: Update deteksi-cuti-gql-client.js**
Tambah helper `executeBypassManualGql(input)` dan `searchPegawaiGql(keyword)` atau query pegawai.

- [ ] **Step 2: Update deteksi-cuti/page.js**
- Tambahkan state active tab: `'deteksi-cuti'` | `'bypass-manual'`.
- Tambahkan header tab navigation.
- Tambahkan panel form "Bypass Khusus Pegawai":
  - Selector/Search Pegawai.
  - Tanggal Awal & Tanggal Akhir.
  - Pilihan Shift ("Auto dari Jadwal Pegawai", "Pagi", "Siang", "Malam", "Non-Shift").
  - Textarea Catatan/Alasan.
  - Modal konfirmasi & loading state.

- [ ] **Step 3: Verifikasi Build Frontend**
Run: `npm run build` di `sdm`
Expected: Build exit code 0.

- [ ] **Step 4: Commit**
```bash
git add src/lib/deteksi-cuti-gql-client.js src/app/dashboard/it/deteksi-cuti/page.js
git commit -m "feat(ui): add manual employee bypass tab and execution form"
```
