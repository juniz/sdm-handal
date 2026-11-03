# Sinkronisasi Jasa Rekap Kinerja ke Tanda Tangan Gaji Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghubungkan jasa pelayanan dari `/dashboard/penilaian-kinerja/rekap` ke `/dashboard/tanda-tangan-gaji` dengan sinkronisasi transaksional saat rekap dikunci dan proteksi integritas tanda tangan digital saat dibuka kunci.

**Architecture:** Backend NestJS (`website/backend/src/sdm`) memperbarui `RekapBulananRepository`:
1. Saat `lockRekapBulanan` atau `lockManyRekapBulanan`, eksekusi transaksi database untuk update `status_rekap = 'final'` dan `INSERT INTO gaji_pegawai ... ON DUPLICATE KEY UPDATE` (`jenis = 'Jasa'`).
2. Saat `unlockRekapBulanan` atau `unlockManyRekapBulanan`, verifikasi apakah pegawai sudah menandatangani jasa di `gaji_validasi`. Jika sudah ditandatangani, tolak dengan `BadRequestException`. Jika belum, hapus draf dari `gaji_pegawai` dan kembalikan rekap ke status `'draft'`.

**Tech Stack:** NestJS, TypeORM / MySQL raw query, Next.js, GraphQL, React.

## Global Constraints
- Target backend: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Target frontend: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Database: MySQL via `@InjectDataSource('sdm')`
- Atomic transaction: `dataSource.transaction(async (trx) => ...)`
- Error throwing: `BadRequestException` dari `@nestjs/common`

---

### Task 1: Update RekapBulananRepository Sinkronisasi Lock & Unlock

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/rekap-bulanan.repository.ts`

**Interfaces:**
- `lockRekapBulanan(id: number, userId: number): Promise<boolean>`
- `lockManyRekapBulanan(ids: number[], userId: number): Promise<boolean>`
- `unlockRekapBulanan(id: number): Promise<boolean>`
- `unlockManyRekapBulanan(ids: number[]): Promise<boolean>`

- [ ] **Step 1: Modifikasi `lockRekapBulanan` & `lockManyRekapBulanan`**
Bungkus operasi dalam `this.dataSource.transaction`.
1. Update `rekap_bulanan` menjadi `status_rekap = 'final'`, `locked_by = ?`, `locked_at = NOW()`.
2. Ambil NIK admin pengeksekusi dari tabel `pegawai` (jika `userId` diberikan) atau default `'SDM'`.
3. `INSERT INTO gaji_pegawai ... ON DUPLICATE KEY UPDATE` dengan `jenis = 'Jasa'`, `gaji = rb.nominal_jasa_final`.

- [ ] **Step 2: Modifikasi `unlockRekapBulanan` & `unlockManyRekapBulanan`**
Bungkus operasi dalam `this.dataSource.transaction`.
1. Periksa tanda tangan di `gaji_validasi`:
```sql
SELECT gv.id, p.nama, p.nik
FROM gaji_validasi gv
JOIN gaji_pegawai gp ON gv.gaji_id = gp.id
JOIN pegawai p ON gp.nik = p.nik
JOIN rekap_bulanan rb ON rb.pegawai_id = p.id 
  AND rb.bulan = gp.periode_bulan 
  AND rb.tahun = gp.periode_tahun
WHERE rb.id IN (?) AND gp.jenis = 'Jasa'
LIMIT 1;
```
2. Jika ada record: Lempar `new BadRequestException('Tidak dapat membuka kunci: Jasa pelayanan periode ini untuk pegawai ' + row.nama + ' sudah ditandatangani digital')`.
3. Jika tidak ada record yang ditandatangani:
   - Hapus draf:
     ```sql
     DELETE gp FROM gaji_pegawai gp
     JOIN pegawai p ON gp.nik = p.nik
     JOIN rekap_bulanan rb ON rb.pegawai_id = p.id 
       AND rb.bulan = gp.periode_bulan 
       AND rb.tahun = gp.periode_tahun
     WHERE rb.id IN (?) AND gp.jenis = 'Jasa';
     ```
   - Revert status rekap:
     ```sql
     UPDATE rekap_bulanan 
     SET status_rekap = 'draft', locked_by = NULL, locked_at = NULL 
     WHERE id IN (?);
     ```

- [ ] **Step 3: Verifikasi Build TypeScript Backend**
Run:
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npx tsc --noEmit
```
Expected: PASS tanpa error kompilasi.

---

### Task 2: Verifikasi & Test Build NestJS

**Files:**
- Inspect: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/rekap-bulanan.service.ts`

- [ ] **Step 1: Build NestJS backend**
Run:
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npm run build
```
Expected: Build sukses (exit code 0).

---

### Task 3: Verifikasi Frontend Tanda Tangan Gaji & Rekap

**Files:**
- Inspect: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/tanda-tangan-gaji/page.js`
- Inspect: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/rekap/page.js`

- [ ] **Step 1: Verifikasi syntax kedua halaman frontend**
Run:
```bash
node --check src/app/dashboard/tanda-tangan-gaji/page.js
node --check src/app/dashboard/penilaian-kinerja/rekap/page.js
```
Expected: PASS tanpa error.

- [ ] **Step 2: Update knowledge graph**
Run:
```bash
graphify update .
```
Expected: Graph updated.
