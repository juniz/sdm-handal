# Prevent Orphan Signatures in Print Gaji Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mencegah blok tanda tangan pimpinan tercetak sendirian di halaman baru tanpa baris data tabel di atasnya.

**Architecture:** Mengubah konfigurasi `margin.bottom` pada `autoTable` dari `15mm` menjadi `52mm` di `src/components/penggajian/PrintGajiReport.js`. Hal ini mencadangkan ruang yang cukup di bagian bawah halaman terakhir untuk blok tanda tangan, sehingga pemecahan halaman (page break) tabel terjadi lebih awal dan halaman terakhir selalu memiliki baris data.

**Tech Stack:** Next.js, jsPDF, jspdf-autotable.

## Global Constraints
- Target file: `src/components/penggajian/PrintGajiReport.js`.
- Tidak boleh ada halaman yang hanya berisi tanda tangan tanpa baris data tabel.
- Margin bottom tabel dialokasikan 52mm untuk tanda tangan.

---

### Task 1: Update Table Bottom Margin and Signature Positioning in `PrintGajiReport.js`

**Files:**
- Modify: `src/components/penggajian/PrintGajiReport.js:560-600`

- [ ] **Step 1: Set `margin.bottom: 52` in autoTable options**
Ubah `margin: { top: 40, bottom: 15, left: 10, right: 10 }` menjadi:
```javascript
margin: { top: 40, bottom: 52, left: 10, right: 10 },
```

- [ ] **Step 2: Adjust signature block offset and safety threshold**
Pastikan tanda tangan ditempatkan dengan `finalY + 6` (bukan +10), dan periksa threshold `currentY + 45 > pageHeight`.

- [ ] **Step 3: Verify syntax**
Jalankan `node -c` untuk memeriksa validitas file.

- [ ] **Step 4: Commit changes**
```bash
git add src/components/penggajian/PrintGajiReport.js
git commit -m "fix(penggajian): reserve bottom margin to prevent orphan signature page"
```
