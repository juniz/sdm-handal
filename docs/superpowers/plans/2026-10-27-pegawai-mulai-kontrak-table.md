# Tampilkan Mulai Kontrak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan tanggal `mulai_kontrak` pada tabel data pegawai (desktop & mobile) di `/dashboard/pegawai-manajemen`.

**Architecture:** Tambahkan helper `formatDateIndo` pada `PegawaiDataSection.jsx`, lalu tambahkan kolom tabel desktop dan grid card mobile untuk `mulai_kontrak`.

**Tech Stack:** React 18/19, Next.js App Router, Tailwind CSS, Radix Table UI.

## Global Constraints

- Helper menangani tanggal invalid, `null`, undefined, atau `0000-00-00`.
- Format keluaran: `d MMM yyyy` (locale `id-ID`).
- Posisi desktop: antara Status Kerja dan Status.

---

### Task 1: Update PegawaiDataSection.jsx

**Files:**
- Modify: `src/components/pegawai-manajemen/PegawaiDataSection.jsx`

- [ ] **Step 1: Tambahkan helper `formatDateIndo`**
- [ ] **Step 2: Tambahkan TableHead & TableCell Mulai Kontrak pada desktop table**
- [ ] **Step 3: Tambahkan item Mulai Kontrak pada mobile card**
- [ ] **Step 4: Verifikasi sintaks dan compile/test**
