# Perbesar Lebar Modal Mapping Jenis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perlebar modal Mapping Jenis Pegawai ke `sm:max-w-6xl w-[95vw]` dan optimalkan tinggi scroll tabel ke `max-h-[60vh]`.

**Architecture:** Ubah props `className` pada `DialogContent` dan kontainer `Table` di `MappingJenisModal.jsx`.

**Tech Stack:** React 18/19, Tailwind CSS, Radix UI Dialog.

---

### Task 1: Update MappingJenisModal.jsx

**Files:**
- Modify: `src/components/penggajian/MappingJenisModal.jsx`

- [ ] **Step 1: Ganti `max-w-4xl` dengan `sm:max-w-6xl w-[95vw]` di `DialogContent`**
- [ ] **Step 2: Ganti `max-h-[460px]` dengan `max-h-[60vh]` pada area scroll tabel**
- [ ] **Step 3: Update knowledge graph dengan `graphify update .`**
