# Design Specification: Pelaporan Perilaku yang Tidak Diinginkan

**Date**: 2026-08-21  
**Status**: Approved by User  
**Scope**: Fullstack (Database Migration + NestJS GraphQL Backend + Next.js App Router Frontend)  
**Target Systems**: `juniz/backend-rs` (NestJS) & `juniz/sdm-handal` (Next.js)

---

## 1. Overview & Business Intent
Menu **"Pelaporan Perilaku yang Tidak Diinginkan"** is an internal hospital incident reporting and whistleblower module for RS Bhayangkara Nganjuk within SDM Handal. It enables employees to safely and confidentiality report workplace misconduct, harassment, bullying, discrimination, or ethics violations, while providing authorized personnel (HRD / SDM / SPI / IT Admin) with the tools to review, investigate, track, and resolve reports.

---

## 2. Database Schema & Migration

### MySQL Table: `pelaporan_perilaku_tidak_diinginkan`
Location: `database/migrations/create_pelaporan_perilaku_table.sql` in SDM and executed on the hospital SDM database connection.

```sql
CREATE TABLE IF NOT EXISTS pelaporan_perilaku_tidak_diinginkan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    nama_pelaku VARCHAR(255) NOT NULL,
    nik_pelaku VARCHAR(30) NULL,
    unit_kerja VARCHAR(150) NOT NULL,
    jenis_perilaku ENUM(
        'Pelecehan Seksual',
        'Pelecehan Verbal',
        'Perundungan / Bullying',
        'Kekerasan Fisik',
        'Diskriminasi',
        'Penyalahgunaan Wewenang',
        'Pelanggaran Disiplin & Etika',
        'Lainnya'
    ) NOT NULL,
    korban VARCHAR(255) NOT NULL,
    nik_korban VARCHAR(30) NULL,
    kronologi TEXT NOT NULL,
    pelapor VARCHAR(255) NOT NULL,
    nik_pelapor VARCHAR(30) NOT NULL,
    status ENUM(
        'Menunggu Review',
        'Sedang Diinvestigasi',
        'Selesai',
        'Ditolak'
    ) NOT NULL DEFAULT 'Menunggu Review',
    catatan_tindak_lanjut TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tanggal (tanggal),
    INDEX idx_nik_pelapor (nik_pelapor),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. NestJS Backend Architecture (`website/backend/src/sdm`)

### 3.1 TypeORM Entity
- File: `website/backend/src/sdm/entities/pelaporan-perilaku.sdm-entity.ts`
- Registered in `SdmModule` TypeOrmModule feature array (`connection: 'sdm'`).
- Columns matching the database schema with proper types and nullable constraints.

### 3.2 DTOs & Validation
- File: `website/backend/src/sdm/dto/pelaporan-perilaku.dto.ts`
- `CreatePelaporanPerilakuInput` (`class-validator` decorated: `@IsNotEmpty`, `@IsDateString`, `@IsEnum`, etc.)
- `UpdateStatusPelaporanPerilakuInput` (ID, status ENUM, catatan tindak lanjut)
- `PelaporanPerilakuFilterInput` (Optional start date, end date, status, search keyword)
- `PelaporanPerilakuDto` and `PelaporanPerilakuStatsDto` (`@ObjectType()` for GraphQL output)

### 3.3 Repository (Data Access Layer)
- File: `website/backend/src/sdm/repositories/pelaporan-perilaku.repository.ts`
- Encapsulates database queries (create, findById, findByPelaporNik, findFilteredWithCount, updateStatus, getStatistics).

### 3.4 Service (Business Logic)
- File: `website/backend/src/sdm/pelaporan-perilaku.service.ts`
- Handles user identity extraction from JWT session, authorization checks (verifying if user has HRD/SPI/IT admin privileges for admin queries/mutations), data transformations, and validation.

### 3.5 GraphQL Resolver
- File: `website/backend/src/sdm/pelaporan-perilaku.resolver.ts`
- Protected by `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`.
- **Queries**:
  - `myPelaporanPerilaku(limit, offset)`: Returns reports submitted by current logged-in employee.
  - `adminPelaporanPerilaku(filter, limit, offset)`: Returns paginated reports with stats for authorized admins.
  - `pelaporanPerilakuDetail(id)`: Returns detail of a report if caller is the reporter or authorized admin.
- **Mutations**:
  - `createPelaporanPerilaku(input)`: Submits new incident report.
  - `updateStatusPelaporanPerilaku(input)`: Updates status & notes (admin only).

---

## 4. Next.js Frontend Architecture & UI/UX (`sdm`)

### 4.1 GraphQL Client Helper
- File: `src/lib/pelaporan-perilaku-gql-client.js`
- Functions: `fetchMyPelaporanPerilaku`, `fetchAdminPelaporanPerilaku`, `fetchPelaporanPerilakuDetail`, `createPelaporanPerilakuMutation`, `updateStatusPelaporanPerilakuMutation`.

### 4.2 Page & Component Structure
- Route: `/dashboard/pelaporan-perilaku/page.js`
- Design Mode: **Operate** (Impeccable standards, clean typography, responsive layout, clear error feedback, accessible color contrasts).
- **Tab Layout**:
  1. **Tab "Buat Laporan Baru"**:
     - Privacy and safety reassurance banner.
     - Tanggal kejadian picker.
     - Hybrid Pelaku selector (PegawaiCombobox toggle / External text input).
     - Unit Kerja selector (Hospital departments / Units).
     - Interactive badge selector for `jenis_perilaku`.
     - Hybrid Korban selector ("Diri Sendiri", PegawaiCombobox, or External text input).
     - Kronologi text area with character counter and structural guidance.
     - Submission confirmation modal.
  2. **Tab "Riwayat Laporan Saya"**:
     - List & table view with real-time status badges.
     - Detail modal showing full report chronology and resolution notes.
  3. **Tab "Kelola Laporan (Admin / HRD / SPI)"**:
     - Visible only to authorized roles (IT, HRD/SDM, SPI).
     - Quick KPI summary cards (Total Laporan, Menunggu Review, Investigasi, Selesai).
     - Advanced search and filter controls.
     - Interactive table with action drawer to update status and add disposition notes.

### 4.3 Menu ACL Registration
- Register `/dashboard/pelaporan-perilaku` into `sdm_menu` with icon `AlertTriangle` under `Layanan Pegawai` group.

---

## 5. Success Criteria & Verification
1. Database migration runs cleanly without errors.
2. NestJS GraphQL schema compiles and registers queries/mutations.
3. Employee can submit a report successfully and view it in "Riwayat Laporan Saya".
4. Admin can view incoming reports, filter by criteria, and update status with follow-up notes.
5. Unauthorized employees cannot access admin queries or see reports filed by other employees.
