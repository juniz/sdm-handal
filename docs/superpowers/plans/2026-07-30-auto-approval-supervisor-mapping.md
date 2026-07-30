# Auto Approval Supervisor Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur Auto Approval pada menu Mapping Supervisor dengan toleransi waktu hari yang dapat diatur, serta cron job otomatis di NestJS backend yang mengeksekusi persetujuan penilaian harian pegawai yang tertunda.

**Architecture:** Database `supervisor_mapping` diperbarui dengan kolom `is_auto_approve` dan `auto_approve_days`. Backend NestJS menangani entity, repository, resolver, dan Cron Scheduler service (`@nestjs/schedule`). Frontend Next.js menangani UI form dan tabel di menu Mapping Supervisor.

**Tech Stack:** NestJS (TypeScript, TypeORM, `@nestjs/schedule`), Next.js (JavaScript, React), MySQL / MariaDB.

## Global Constraints

- Backend logic menggunakan NestJS di repository `website/backend` (`src/sdm/`).
- Database schema menggunakan kolom `is_auto_approve` (tinyint 0/1) dan `auto_approve_days` (int).
- Audit persetujuan: `approved_by` diisi ID supervisor mapped, `catatan_supervisor` terformat `[Auto Approved oleh Sistem - Toleransi X hari terlewati]`.

---

### Task 1: Database Schema Migration

**Files:**
- Create: `database/migrations/alter_supervisor_mapping_add_auto_approval.sql` (di repo `sdm`)

**Interfaces:**
- Consumes: Table `supervisor_mapping`
- Produces: Table `supervisor_mapping` with columns `is_auto_approve` and `auto_approve_days`

- [ ] **Step 1: Write migration script**

```sql
-- Migration: Add Auto Approval columns to supervisor_mapping
ALTER TABLE `supervisor_mapping`
  ADD COLUMN `is_auto_approve` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_aktif`,
  ADD COLUMN `auto_approve_days` INT NULL DEFAULT 3 AFTER `is_auto_approve`;
```

- [ ] **Step 2: Execute migration on database**

Run: `mysql -u root sdm < database/migrations/alter_supervisor_mapping_add_auto_approval.sql` (atau via database client helper)

- [ ] **Step 3: Verify table structure**

Run: `DESCRIBE supervisor_mapping;`
Expected: Columns `is_auto_approve` (tinyint(1)) and `auto_approve_days` (int) exist.

- [ ] **Step 4: Commit migration file**

```bash
git add database/migrations/alter_supervisor_mapping_add_auto_approval.sql
git commit -m "db: add alter script for supervisor mapping auto approval"
```

---

### Task 2: NestJS Entity, DTO, Repository, & Service

**Files:**
- Create: `website/backend/src/sdm/entities/supervisor-mapping.sdm-entity.ts`
- Create: `website/backend/src/sdm/dto/supervisor-mapping.dto.ts`
- Create: `website/backend/src/sdm/repositories/supervisor-mapping.repository.ts`
- Create: `website/backend/src/sdm/supervisor-mapping.service.ts`
- Modify: `website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: TypeORM connection 'sdm', `supervisor_mapping` table
- Produces: `SupervisorMappingService.findAll()`, `SupervisorMappingService.create()`, `SupervisorMappingService.update()`, `SupervisorMappingService.delete()`

- [ ] **Step 1: Create SupervisorMapping Entity**

```typescript
// website/backend/src/sdm/entities/supervisor-mapping.sdm-entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('supervisor_mapping')
export class SupervisorMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tipe_relasi', type: 'enum', enum: ['unit', 'personal'], default: 'unit' })
  tipeRelasi: string;

  @Column({ name: 'pegawai_id', nullable: true })
  pegawaiId: number;

  @Column({ name: 'supervisor_id' })
  supervisorId: number;

  @Column({ name: 'tipe_unit', nullable: true })
  tipeUnit: string;

  @Column({ name: 'kode_unit', nullable: true })
  kodeUnit: string;

  @Column({ name: 'is_aktif', default: 1 })
  isAktif: number;

  @Column({ name: 'is_auto_approve', default: 0 })
  isAutoApprove: number;

  @Column({ name: 'auto_approve_days', default: 3 })
  autoApproveDays: number;

  @Column({ name: 'berlaku_mulai', type: 'date' })
  berlakuMulai: string;

  @Column({ name: 'berlaku_sampai', type: 'date', nullable: true })
  berlakuSampai: string;

  @Column({ name: 'dibuat_oleh', nullable: true })
  dibuatOleh: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 2: Create DTOs**

```typescript
// website/backend/src/sdm/dto/supervisor-mapping.dto.ts
import { IsNotEmpty, IsOptional, IsInt, IsBoolean, IsString } from 'class-validator';

export class CreateSupervisorMappingDto {
  @IsNotEmpty()
  tipe_relasi: 'unit' | 'personal';

  @IsOptional()
  @IsInt()
  pegawai_id?: number;

  @IsNotEmpty()
  @IsInt()
  supervisor_id: number;

  @IsOptional()
  @IsString()
  tipe_unit?: string;

  @IsOptional()
  @IsString()
  kode_unit?: string;

  @IsOptional()
  @IsBoolean()
  is_auto_approve?: boolean;

  @IsOptional()
  @IsInt()
  auto_approve_days?: number;

  @IsNotEmpty()
  @IsString()
  berlaku_mulai: string;

  @IsOptional()
  @IsString()
  berlaku_sampai?: string;
}
```

- [ ] **Step 3: Create Repository & Service for Supervisor Mapping**

Implementasi `SupervisorMappingRepository` dan `SupervisorMappingService` untuk CRUD data mapping dengan query `SELECT sm.*, p1.nama AS nama_pegawai, p2.nama AS nama_supervisor FROM supervisor_mapping sm...`.

- [ ] **Step 4: Register in SdmModule**

Tambahkan `SupervisorMapping` entity dan provider di `sdm.module.ts`.

- [ ] **Step 5: Verify build & tests**

Run: `npm run build` inside `website/backend`
Expected: Build passes with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/sdm/entities/src/sdm/dto/ src/sdm/repositories/ src/sdm/supervisor-mapping.service.ts src/sdm/sdm.module.ts
git commit -m "feat(sdm): add supervisor mapping entity, dto, repository and service with auto approval support"
```

---

### Task 3: NestJS Auto Approval Cron Scheduler Service

**Files:**
- Create: `website/backend/src/sdm/auto-approval-cron.service.ts`
- Modify: `website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: Table `penilaian_harian`, `supervisor_mapping`, `pegawai`
- Produces: `processAutoApproval(): Promise<{ approvedCount: number }>`

- [ ] **Step 1: Create AutoApprovalCronService**

```typescript
// website/backend/src/sdm/auto-approval-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class AutoApprovalCronService {
  private readonly logger = new Logger(AutoApprovalCronService.name);

  constructor(@InjectDataSource('sdm') private readonly dataSource: DataSource) {}

  @Cron('0 5 0 * * *') // Daily at 00:05 WIB
  async handleCron() {
    this.logger.log('Starting Auto Approval Cron Job for Penilaian Harian...');
    const result = await this.processAutoApproval();
    this.logger.log(`Auto Approval Cron Job completed. ${result.approvedCount} records approved.`);
  }

  async processAutoApproval(): Promise<{ approvedCount: number }> {
    // Perform raw update query or batch processing
    const query = `
      UPDATE penilaian_harian ph
      JOIN pegawai p ON ph.pegawai_id = p.id
      JOIN supervisor_mapping sm ON (
        (sm.tipe_relasi = 'personal' AND sm.pegawai_id = ph.pegawai_id)
        OR
        (sm.tipe_relasi = 'unit' AND sm.tipe_unit = p.departemen AND sm.kode_unit = p.departemen)
      )
      SET 
        ph.status = 'approved',
        ph.approved_by = sm.supervisor_id,
        ph.approved_at = NOW(),
        ph.catatan_supervisor = CONCAT(
          IFNULL(CONCAT(ph.catatan_supervisor, ' | '), ''),
          '[Auto Approved oleh Sistem - Toleransi ', sm.auto_approve_days, ' hari terlewati]'
        )
      WHERE 
        ph.status = 'submitted'
        AND sm.is_aktif = 1
        AND sm.is_auto_approve = 1
        AND DATEDIFF(CURRENT_DATE(), ph.tanggal) >= sm.auto_approve_days
    `;

    const result = await this.dataSource.query(query);
    const approvedCount = result.affectedRows || result.changedRows || 0;
    return { approvedCount };
  }
}
```

- [ ] **Step 2: Register ScheduleModule & Service in SdmModule**

Import `ScheduleModule.forRoot()` if not present and add `AutoApprovalCronService` to `providers`.

- [ ] **Step 3: Test Cron execution logic manually**

Call `processAutoApproval()` via test or CLI endpoint and check database update logs.

- [ ] **Step 4: Commit**

```bash
git add src/sdm/auto-approval-cron.service.ts src/sdm/sdm.module.ts
git commit -m "feat(sdm): add auto approval cron service for penilaian harian"
```

---

### Task 4: Next.js Frontend & API Update (`sdm`)

**Files:**
- Modify: `sdm/src/app/api/penilaian/mapping/route.js`
- Modify: `sdm/src/app/dashboard/penilaian-kinerja/mapping/page.js`

**Interfaces:**
- Consumes: Next.js frontend state & API routes
- Produces: UI with Auto Approval toggle and toleransi hari input field

- [ ] **Step 1: Update Next.js API Route `/api/penilaian/mapping/route.js`**

Update GET, POST, PUT handler to select and save `is_auto_approve` and `auto_approve_days`.

```javascript
// In POST/PUT route.js
const { is_auto_approve, auto_approve_days } = body;
dataToInsert.is_auto_approve = is_auto_approve ? 1 : 0;
dataToInsert.auto_approve_days = auto_approve_days ? parseInt(auto_approve_days) : 3;
```

- [ ] **Step 2: Update UI Form & Table in `src/app/dashboard/penilaian-kinerja/mapping/page.js`**

1. Tambahkan state `formData.is_auto_approve` & `formData.auto_approve_days`.
2. Di modal form, tambahkan elemen UI:
   ```jsx
   <div className="flex items-center gap-2 mt-3">
     <input 
       type="checkbox" 
       id="is_auto_approve" 
       checked={formData.is_auto_approve} 
       onChange={(e) => setFormData({...formData, is_auto_approve: e.target.checked})} 
     />
     <label htmlFor="is_auto_approve" className="text-sm font-medium">Aktifkan Auto Approval</label>
   </div>

   {formData.is_auto_approve && (
     <div className="mt-2">
       <label className="text-xs text-gray-600">Toleransi (Hari)</label>
       <input 
         type="number" 
         min="1" 
         value={formData.auto_approve_days} 
         onChange={(e) => setFormData({...formData, auto_approve_days: e.target.value})} 
         className="w-full border rounded p-2 text-sm"
       />
     </div>
   )}
   ```
3. Di tabel daftar mapping, tambahkan kolom Badge status **Auto Approval**:
   ```jsx
   <td className="p-3">
     {m.is_auto_approve ? (
       <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">
         Aktif ({m.auto_approve_days} Hari)
       </span>
     ) : (
       <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
         Nonaktif
       </span>
     )}
   </td>
   ```

- [ ] **Step 3: Run Next.js build / dev server to verify UI**

Run: `npm run build` in `sdm` directory.
Expected: Build succeeds without syntax or JSX errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/penilaian/mapping/route.js src/app/dashboard/penilaian-kinerja/mapping/page.js
git commit -m "feat(frontend): add auto approval toggle and days input in supervisor mapping page"
```

---

### Task 5: End-to-End Verification & Testing

- [ ] **Step 1: Test Create & Edit Mapping with Auto Approval**
  - Buka menu Mapping Supervisor.
  - Tambahkan mapping supervisor baru dengan `Auto Approval = Aktif` dan `Toleransi = 2 Hari`.
  - Simpan dan pastikan badge `Aktif (2 Hari)` muncul di tabel.

- [ ] **Step 2: Test Cron Execution Simulation**
  - Buat data `penilaian_harian` dummy dengan `status = 'submitted'` tanggal 3 hari lalu.
  - Jalankan function `processAutoApproval()`.
  - Pastikan record `penilaian_harian` berubah menjadi `status = 'approved'`, `approved_by` terisi ID supervisor mapping, dan `catatan_supervisor` mencatat informasi auto approval.
