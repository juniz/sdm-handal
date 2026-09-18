# Monochrome Print & Official Kop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah tampilan cetak dan export PDF menu development menjadi hitam-putih formal resmi dan memasang Kop surat resmi RS Bhayangkara TK. III Nganjuk.

**Architecture:** Memodifikasi komponen layout print `DevelopmentListPrintView.jsx` dan `DevelopmentDetailPrintView.jsx` agar menggunakan kop resmi Polri/RSB Nganjuk dan styling Tailwind monokrom strict (`text-black`, `border-black`, `bg-white`).

**Tech Stack:** React, Tailwind CSS, Next.js.

## Global Constraints
- Menggunakan logo `/logo-kop.png`.
- Teks kop:
  - POLRI DAERAH JAWA TIMUR
  - BIDANG KEDOKTERAN DAN KESEHATAN
  - RUMAH SAKIT BHAYANGKARA TK. III NGANJUK
- Warna murni monokrom: hanya hitam, putih, dan border hitam solid.

---

### Task 1: Update DevelopmentListPrintView to Monochrome & Official Kop
**Files:**
- Modify: `src/components/development/DevelopmentListPrintView.jsx`

- [ ] **Step 1: Pasang kop resmi kedinasan dengan garis pemisah ganda hitam tebal**
- [ ] **Step 2: Ubah tabel data menjadi border hitam solid, teks hitam pekat, dan badge monokrom**
- [ ] **Step 3: Ubah kotak ringkasan statistik dan kolom tanda tangan menjadi monokrom**
- [ ] **Step 4: Commit Task 1**

---

### Task 2: Update DevelopmentDetailPrintView to Monochrome & Official Kop
**Files:**
- Modify: `src/components/development/DevelopmentDetailPrintView.jsx`

- [ ] **Step 1: Pasang kop resmi kedinasan dan format nomor formulir monokrom**
- [ ] **Step 2: Ubah Bagian I, II, III, dan IV menjadi tabel border hitam tegas tanpa warna latar**
- [ ] **Step 3: Ubah 3 kotak tanda tangan pengesahan menjadi monokrom pekat**
- [ ] **Step 4: Commit Task 2**

---

### Task 3: Verifikasi Sintaks & Hasil Cetak
- [ ] **Step 1: Jalankan validasi sintaks node**
- [ ] **Step 2: Pastikan tidak ada residual class warna (sky, amber, rose, emerald)**
