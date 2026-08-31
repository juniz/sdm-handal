# Pelaporan Perilaku yang Tidak Diinginkan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete fullstack Incident and Whistleblower Reporting system ("Pelaporan Perilaku yang Tidak Diinginkan") with database migration, NestJS GraphQL backend, and Next.js Impeccable dashboard page.

**Architecture:** 
- **Database**: MySQL table `pelaporan_perilaku_tidak_diinginkan` with comprehensive indexing and menu seeding.
- **Backend**: NestJS feature set in `website/backend/src/sdm` (TypeORM Entity, Repository, DTOs with class-validator, Service, and GraphQL Resolver with JWT Guard and rate limiting).
- **Frontend**: Next.js App Router page in `sdm/src/app/dashboard/pelaporan-perilaku/page.js` with role-aware tab navigation (Create Report, My History, Admin Management), hybrid PegawaiCombobox/custom text selectors, datepickers, filterable tables, and status update dialogs.

**Tech Stack:** Next.js 14/15, Tailwind CSS, Lucide React, Radix UI / Shadcn, Framer Motion, NestJS 10, TypeORM, GraphQL, MySQL 8.

## Global Constraints
- Target table: `pelaporan_perilaku_tidak_diinginkan`
- Fields: `id`, `tanggal`, `nama_pelaku`, `nik_pelaku`, `unit_kerja`, `jenis_perilaku`, `korban`, `nik_korban`, `kronologi`, `pelapor`, `nik_pelapor`, `status`, `catatan_tindak_lanjut`, `created_at`, `updated_at`
- Backend framework: NestJS with GraphQL and TypeORM
- Frontend framework: Next.js App Router with Impeccable UI/UX standards

---

### Task 1: Database Migration & Schema Setup

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/database/migrations/create_pelaporan_perilaku_table.sql`

- [ ] **Step 1: Write SQL migration file**
- [ ] **Step 2: Execute migration against database**
- [ ] **Step 3: Seed menu item in `sdm_menu` and verify table structure**

---

### Task 2: NestJS TypeORM Entity, DTOs & Module Registration

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/entities/pelaporan-perilaku.sdm-entity.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/pelaporan-perilaku.dto.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

- [ ] **Step 1: Create TypeORM entity with connection 'sdm'**
- [ ] **Step 2: Create DTOs with class-validator & GraphQL types**
- [ ] **Step 3: Register entity in `SdmModule` TypeOrmModule feature list**

---

### Task 3: NestJS Repository & Service Implementation

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/pelaporan-perilaku.repository.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/pelaporan-perilaku.service.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

- [ ] **Step 1: Create repository for database operations**
- [ ] **Step 2: Create service for business logic and authorization**
- [ ] **Step 3: Register repository and service in `SdmModule` providers**

---

### Task 4: NestJS GraphQL Resolver & Guard Integration

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/pelaporan-perilaku.resolver.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

- [ ] **Step 1: Create resolver with queries and mutations**
- [ ] **Step 2: Register resolver in `SdmModule` providers**
- [ ] **Step 3: Verify NestJS build and compilation**

---

### Task 5: Frontend GraphQL Client Helper

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/pelaporan-perilaku-gql-client.js`

- [ ] **Step 1: Write GraphQL client functions for queries & mutations**
- [ ] **Step 2: Test query strings and error handling**

---

### Task 6: Frontend UI Components & Page Implementation (`/impeccable`)

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/pelaporan-perilaku/page.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/layout.js`

- [ ] **Step 1: Update icon map in dashboard layout**
- [ ] **Step 2: Build Form Tab with hybrid selectors, datepicker, category badges, and confirmation dialog**
- [ ] **Step 3: Build History Tab with timeline and detail modal**
- [ ] **Step 4: Build Admin Management Tab with filters, summary cards, and status update dialog**

---

### Task 7: End-to-End Verification & Quality Polish

- [ ] **Step 1: Test report submission workflow**
- [ ] **Step 2: Test history listing and detail modal**
- [ ] **Step 3: Test admin management queue, filtering, and status updates**
- [ ] **Step 4: Verify mobile & desktop responsiveness and error handling**
