# Design Spec: Pencegahan Lembar Tanda Tangan Terpisah Sendirian (Orphan Signature Prevention)

## 1. Problem Statement
Pada laporan gaji (`PrintGajiReport.js`):
- `autoTable` menggunakan `margin.bottom: 15mm`, sehingga tabel terus digambar hingga baris bawah halaman (`~195mm` dari `210mm`).
- Blok tanda tangan pimpinan (Mengetahui Kepala RS & Bendahara) membutuhkan tinggi `~45-50mm`.
- Ketika jumlah baris pegawai mengisi penuh halaman 1 (misal 13 pegawai), tabel selesai di batas `~195mm-202mm`.
- Blok tanda tangan tidak muat di sisa ruang, sehingga `pdf.addPage()` membuat halaman baru yang HANYA berisi tanda tangan tanpa ada baris data tabel di atasnya (orphan signature page).

## 2. Solution & Architecture
1. **Peningkatan Margin Bawah AutoTable (`margin.bottom: 52mm`)**:
   - Alokasikan ruang tanda tangan sebesar 52mm di margin bawah tabel `autoTable`.
   - Batas maksimal tabel berhenti di `210 - 52 = 158mm`.
   - Pada halaman terakhir tabel, selalu tersisa ruang `52mm` yang cukup untuk mencetak blok tanda tangan (`45mm`) tepat di bawah tabel.
2. **Distribusi Baris Multihalaman Otomatis**:
   - Jika data memiliki &le; 7 pegawai: Semua baris data dan blok tanda tangan muat di 1 halaman.
   - Jika data memiliki 8-15 pegawai: Halaman 1 memuat ~8-9 pegawai, dan halaman 2 memuat sisa ~4-5 pegawai bersama subtotal dan blok tanda tangan.
   - Halaman terakhir selalu memiliki baris data, subtotal, dan tanda tangan; tidak akan pernah ada halaman kosong yang hanya berisi tanda tangan.
3. **Safety Fallback**:
   - Jika ada kondisi tak terduga di mana `currentY + 45 > pageHeight`, lembar tanda tangan diposisikan dengan margin atas yang rapi.

## 3. Scope & Target File
- `src/components/penggajian/PrintGajiReport.js`
