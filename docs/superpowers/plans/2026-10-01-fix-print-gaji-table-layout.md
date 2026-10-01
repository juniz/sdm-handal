# Fix Print Gaji Table Layout & Row Height Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki tampilan tabel print gaji agar angka rupiah pada footer tidak terpotong atau menabrak garis sel, serta memastikan tinggi baris pada kolom tanda tangan seragam minimal 10mm.

**Architecture:** Memperbarui konfigurasi autotable pada `src/components/penggajian/PrintGajiReport.js`: menambahkan `minCellHeight: 10` di `bodyStyles`, mengonfigurasi `footStyles` dan `willDrawCell` dengan `fontSize: 7.5` dan padding yang tepat, serta mengoptimalkan lebar kolom finansial di `columnStyles`.

**Tech Stack:** Next.js, jsPDF, jspdf-autotable.

## Global Constraints
- Target file: `src/components/penggajian/PrintGajiReport.js`.
- Semua baris data memiliki tinggi seragam minimal 10mm (`minCellHeight: 10`).
- Footer nominal rupiah tidak menabrak batas sel (`fontSize: 7.5`, `valign: "middle"`, `halign: "right"`, padding rapi).
- Total lebar kolom tetap 277mm (A4 Landscape 297mm - margin kiri/kanan 10mm).

---

### Task 1: Update Table Styles and Column Widths in `PrintGajiReport.js`

**Files:**
- Modify: `src/components/penggajian/PrintGajiReport.js`

- [ ] **Step 1: Update `columnStyles` widths**
Alokasikan lebar kolom agar `jumlah`, `bpjs_kes`, `bpjs_tk`, dan `total` memiliki ruang cukup dan tidak menabrak batas sel.

- [ ] **Step 2: Add `minCellHeight: 10` to `bodyStyles`**
Tambahkan `minCellHeight: 10` ke `bodyStyles` untuk konsistensi tinggi baris tanda tangan.

- [ ] **Step 3: Update `footStyles` and `willDrawCell` footer styling**
Tambahkan `fontSize: 7.5`, `fontStyle: "bold"`, `valign: "middle"`, dan perbaiki styling sel di `willDrawCell`.

- [ ] **Step 4: Verify syntax and test**
Periksa sintaks menggunakan Node dan pastikan tidak ada error.

- [ ] **Step 5: Commit changes**
```bash
git add src/components/penggajian/PrintGajiReport.js
git commit -m "fix(penggajian): ensure consistent signature row height and prevent footer rupiah line clipping"
```
