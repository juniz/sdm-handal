# Design Spec: Auto Approval Supervisor Mapping Penilaian Kinerja

## Overview & Goal
Pada sistem Penilaian Kinerja, beberapa pegawai mengalami kendala di mana penilaian harian mereka berstatus `submitted` namun tidak pernah diapprove oleh supervisor karena supervisor berhalangan, cuti, atau terlambat melakukan persetujuan. Hal ini mengakibatkan nilai kinerja harian pegawai menjadi tidak lengkap/kosong saat rekap bulanan.

Fitur **Auto Approval** ini menambahkan opsi pengaturan auto-approval secara spesifik per entri **Mapping Supervisor** dengan durasi toleransi hari (*grace period*) yang dapat disesuaikan. Cron job berkala di backend akan mendeteksi pengajuan penilaian yang melebihi batas toleransi hari dan secara otomatis menyetujuinya (*auto approve*).

---

## Architecture & Data Flow

```
[Cron Job / Scheduled Task (Daily @ 00:05)]
                     │
                     ▼
  [NestJS AutoApprovalCronService]
                     │
 1. Query active supervisor_mapping with is_auto_approve = 1
 2. Find penilaian_harian where status = 'submitted' AND DATEDIFF(CURRENT_DATE, tanggal) >= auto_approve_days
 3. Batch UPDATE status = 'approved', approved_by = supervisor_id, approved_at = NOW(), catatan_supervisor = '[Auto Approved oleh Sistem - Toleransi X hari terlewati]'
                     │
                     ▼
     [Database Table: penilaian_harian]
```

---

## Detailed Specifications

### 1. Database Schema Migration

File migration: `database/migrations/alter_supervisor_mapping_add_auto_approval.sql`

```sql
ALTER TABLE `supervisor_mapping`
  ADD COLUMN `is_auto_approve` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_aktif`,
  ADD COLUMN `auto_approve_days` INT NULL DEFAULT 3 AFTER `is_auto_approve`;
```

### 2. NestJS Backend Implementation (`website/backend`)

* **Entity Update**:
  * Update `SupervisorMapping` SDM entity di `src/sdm/entities/supervisor-mapping.sdm-entity.ts` dengan property:
    * `is_auto_approve`: `number` (0 atau 1)
    * `auto_approve_days`: `number`
* **DTOs & GraphQL Inputs**:
  * `CreateSupervisorMappingInput` & `UpdateSupervisorMappingInput` menambahkan `is_auto_approve` (Boolean) & `auto_approve_days` (Int).
* **Service & Repository**:
  * `SupervisorMappingService`:
    * Implementasi CRUD Mapping Supervisor (Query all mapping dengan join nama pegawai & supervisor, Create, Update, Delete).
  * `AutoApprovalCronService` (menggunakan `@nestjs/schedule`):
    * `@Cron('0 5 0 * * *')` (Setiap hari jam 00:05 WIB).
    * Menjalankan query batch update `penilaian_harian` berdasarkan kriteria auto approval supervisor mapping.
    * Menyediakan endpoint REST `POST /sdm/cron/auto-approval` yang diproteksi token `CRON_SECRET` untuk pemanggilan manual/crontab.

### 3. Frontend Next.js Implementation (`sdm`)

* **Page**: `src/app/dashboard/penilaian-kinerja/mapping/page.js`
* **UI Controls**:
  * Checkbox/Toggle: **Auto Approval** (`is_auto_approve`).
  * Input Number: **Toleransi Hari Auto Approval** (`auto_approve_days`), default `3` (aktif saat Auto Approval enabled).
* **Table View**:
  * Menampilkan kolom badge **Auto Approval**:
    * Green badge: `Aktif (X Hari)`
    * Gray badge: `Nonaktif`
* **Integration**:
  * Form modal create/edit mapping mengirim data `is_auto_approve` & `auto_approve_days` ke backend.

---

## Verification & Test Plan

1. **Database Migration**: Jalankan skrip migration SQL dan verifikasi struktur tabel `supervisor_mapping`.
2. **Backend Unit/Service Test**:
   * Uji simpan & update supervisor mapping dengan flag `is_auto_approve` dan `auto_approve_days`.
   * Simulasi data `penilaian_harian` status `submitted` dengan tanggal > `auto_approve_days` hari lalu.
   * Jalankan trigger `processAutoApproval()` dan verifikasi `status` berubah menjadi `approved`, `approved_by` terisi ID supervisor, dan `catatan_supervisor` terformat dengan benar.
3. **Frontend E2E**:
   * Buka menu Mapping Supervisor, buat mapping baru dengan auto approval aktif (misal 2 hari).
   * Edit mapping existing untuk mengubah toleransi hari / mematikan auto approval.
   * Verifikasi tampilan tabel data mapping.
