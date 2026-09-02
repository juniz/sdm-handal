# Deteksi & Bypass Izin Dinas Luar Kota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan deteksi dan bypass penilaian harian 100% otomatis untuk `pengajuan_izin` Dinas Luar Kota yang overlap dengan jadwal kerja di tab Deteksi Cuti & Dinas Luar.

**Architecture:**
- NestJS SDM Module menambah deteksi `pengajuan_izin` (urgensi `'Dinas Luar Kota'`) digabung dengan `pengajuan_cuti`.
- Transaksi database bypass menangani `sumber_absensi = 'izin'`, `ref_izin_no`, `nilai_kondisi = 'izin_dinas_luar'`, skor 100/100/100, dan default `kegiatan_harian` dinas luar kota.
- UI `/dashboard/it/deteksi-cuti` menambah filter tipe dispensasi dan badge pembeda (`Cuti` vs `Dinas Luar`).

**Tech Stack:** NestJS 10, Apollo GraphQL, TypeORM, MySQL, Next.js 15, React 19, Tailwind CSS.

## Global Constraints
- Backend: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Frontend: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Database: connection `'sdm'`
- Skor Bypass: `skor_absensi = 100`, `skor_kegiatan = 100`, `skor_total = 100`, `status = 'approved'`
- Dinas Luar Kota: `sumber_absensi = 'izin'`, `ref_izin_no = no_pengajuan`, `nilai_kondisi = 'izin_dinas_luar'`

---

### Task 1: Backend DTOs & Repository Layer

**Files:**
- Modify: `src/sdm/dto/deteksi-cuti-types.ts`
- Modify: `src/sdm/repositories/deteksi-cuti.repository.ts`
- Modify: `src/sdm/repositories/deteksi-cuti.repository.spec.ts`
- Modify: `src/schema.gql`

- [ ] **Step 1: Update DTOs**
Tambah `tipeDispensasi` di `DeteksiCutiFilterInput`, `jenis_dispensasi` dan `ref_izin_no` di `DeteksiCutiItemDto`, serta `jenis_dispensasi` di `BypassCutiItemInput`.

- [ ] **Step 2: Update DeteksiCutiRepository**
- Update `findDetectedLeaves`: query `pengajuan_cuti` dan `pengajuan_izin` (`urgensi = 'Dinas Luar Kota'`). Gabungkan keduanya, mapping `nilai_kondisi`, dan filter `tipeDispensasi`.
- Update `executeBypassTransaction`: jika `item.jenis_dispensasi === 'izin_dinas'`, isi `sumber_absensi = 'izin'`, `ref_izin_no`, dan kegiatan dinas luar kota.

- [ ] **Step 3: Update Unit Tests & Run**
Run: `npm test -- src/sdm/repositories/deteksi-cuti.repository.spec.ts`

- [ ] **Step 4: Commit**
```bash
git add src/sdm/dto/deteksi-cuti-types.ts src/sdm/repositories/deteksi-cuti.repository.ts src/sdm/repositories/deteksi-cuti.repository.spec.ts
git commit -m "feat(sdm): add dinas luar kota detection and bypass in repository"
```

---

### Task 2: Backend Service, Resolver & Verification

**Files:**
- Modify: `src/sdm/deteksi-cuti.service.ts`
- Modify: `src/sdm/deteksi-cuti.resolver.ts`
- Modify: `src/sdm/deteksi-cuti.service.spec.ts`
- Modify: `src/schema.gql`

- [ ] **Step 1: Update Resolver / Service if needed**
Pastikan resolver meneruskan filter `tipeDispensasi` dan input mutation baru.

- [ ] **Step 2: Run Unit Tests & Build**
Run: `npm test -- src/sdm/ && npm run build` di `website/backend`.
Verify: `src/schema.gql` ter-update dengan type/field baru.

- [ ] **Step 3: Commit**
```bash
git add src/sdm/deteksi-cuti.service.ts src/sdm/deteksi-cuti.resolver.ts src/sdm/deteksi-cuti.service.spec.ts src/schema.gql
git commit -m "feat(sdm): update deteksi cuti service & schema for dinas luar kota"
```

---

### Task 3: Frontend Client & UI Tab Deteksi Cuti & Dinas Luar

**Files:**
- Modify: `src/lib/deteksi-cuti-gql-client.js`
- Modify: `src/app/dashboard/it/deteksi-cuti/page.js`

- [ ] **Step 1: Update deteksi-cuti-gql-client.js**
Sertakan `jenis_dispensasi`, `ref_izin_no` pada query `GetDeteksiCuti` dan payload `BypassCuti`.

- [ ] **Step 2: Update deteksi-cuti/page.js**
- Ubah judul Tab 1 menjadi "Deteksi Cuti & Dinas Luar".
- Tambah filter dropdown Tipe Dispensasi: "Semua", "Cuti Saja", "Dinas Luar Saja".
- Tampilkan badge pembeda di tabel & card mobile (`Cuti` vs `Dinas Luar Kota`).
- Update batch selection & modal konfirmasi untuk membedakan jumlah cuti dan dinas luar.

- [ ] **Step 3: Verifikasi Build Frontend**
Run: `npm run build` di `sdm`.

- [ ] **Step 4: Commit**
```bash
git add src/lib/deteksi-cuti-gql-client.js src/app/dashboard/it/deteksi-cuti/page.js
git commit -m "feat(ui): add official travel detection filter and badge in deteksi-cuti page"
```
