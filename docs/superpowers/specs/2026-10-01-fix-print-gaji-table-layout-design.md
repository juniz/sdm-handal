# Design Spec: Fix Print Gaji Table Layout & Row Height Consistency

## 1. Problem Statement
Pada hasil print rekapitulasi gaji pegawai kontrak (`PrintGajiReport.js`):
1. **Angka Rupiah pada Footer Terpotong Garis**: Pada baris footer ("JUMLAH DIPINDAHKAN" / "TOTAL"), nilai rupiah seperti `Rp 13.000.000` dan `Rp 12.610.000` menabrak / melewati garis batas sel vertikal dan horizontal. Penyebab: `footStyles` tidak memiliki properti `fontSize` dan `valign`, sehingga jspdf-autotable menerapkan default ukuran font 10pt tebal yang melebihi lebar sel (22-24mm).
2. **Tinggi Kolom Tanda Tangan Tidak Konsisten**: Baris tabel dengan 1 baris teks jabatan memiliki tinggi ~6mm (sempit untuk tanda tangan), sedangkan jabatan dengan 2-3 baris teks melebar hingga ~13mm.

## 2. Scope & Target File
- `src/components/penggajian/PrintGajiReport.js`

## 3. Design Solution

### A. Konsistensi Tinggi Baris Tanda Tangan (`bodyStyles`)
- Tambahkan `minCellHeight: 10` pada `bodyStyles`.
- Semua baris memiliki tinggi minimal 10mm seragam, memberikan ruang tanda tangan yang konsisten dan proporsional untuk tanda tangan manual maupun digital.
- Pertahankan `valign: "middle"` pada semua sel tabel.

### B. Perbaikan Footer Rupiah (`footStyles` & `willDrawCell`)
- Pada `footStyles`, tentukan konfigurasi eksplisit:
  - `fontSize: 7.5`
  - `fontStyle: "bold"`
  - `valign: "middle"`
  - `cellPadding: { top: 2, bottom: 2, left: 1, right: 2 }`
- Pada `willDrawCell`:
  - Pastikan perataan sel nominal footer tetap `halign = "right"`.
  - Pastikan ukuran font sel di footer diatur `fontSize = 7.5`.

### C. Penyesuaian Lebar Kolom (`columnStyles`)
- Kolom `pangkat` dan `nip` untuk pegawai kontrak selalu bernilai `"-"`, dapat dipadatkan dari 15mm/16mm menjadi 12mm.
- Lebar sel dialokasikan ke kolom finansial:
  - `jumlah`: 26mm
  - `bpjs_kes`: 24mm
  - `bpjs_tk`: 24mm
  - `total`: 26mm
- Seluruh teks nominal nominal rupiah muat dengan leluasa tanpa menabrak garis sel.

## 4. Verifikasi
1. Render PDF data gaji dengan opsi kelompok kontrak.
2. Pastikan tinggi seluruh baris tanda tangan seragam minimal 10mm.
3. Pastikan teks footer nominal rupiah berada di dalam batas sel secara vertikal dan horizontal (tidak menabrak/memotong garis batas).
