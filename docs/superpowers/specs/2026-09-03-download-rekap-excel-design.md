# Design Doc: Download Rekap Kinerja Format Excel

## Ringkasan
Menambahkan tombol dan fungsionalitas download rekapitulasi kinerja pegawai bulanan dalam format file Excel (.xlsx) pada halaman `/dashboard/penilaian-kinerja/rekap`. File didesain dengan format print-out resmi, mencakup kop laporan, metadata filter, daftar pegawai yang diurutkan berdasarkan nama departemen lalu nama pegawai, serta baris total akumulasi (summary).

## Kebutuhan & Spesifikasi
1. **Cakupan Data**:
   - Mengambil seluruh data pegawai sesuai filter aktif (bulan, tahun, departemen, status, pencarian nama), melintasi batasan pagination tabel layar (menggunakan `limit=10000`).
2. **Pengurutan Data**:
   - Primary sort: `nama_departemen` ascending (A-Z).
   - Secondary sort: `nama` ascending (A-Z).
3. **Kolom Laporan Excel**:
   - No (urutan 1..N)
   - NIK
   - Nama Pegawai
   - Departemen
   - Jasa Dasar (Rp)
   - Pengurang Jasa (Rp)
   - Insentif Tambahan (Rp)
   - Jasa Final (Rp)
   *(Kolom hari jadwal, approved reguler, shift tambahan, gap hari, rerata skor, dan status ditiadakan sesuai permintaan).*
4. **Layout Sheet (Print-out Style)**:
   - Row 1: Judul: `REKAPITULASI JASA PELAYANAN PEGAWAI`
   - Row 2: `Periode: [Nama Bulan] [Tahun]`
   - Row 3: `Unit / Departemen: [Nama Departemen Terpilih / Semua Departemen]`
   - Row 4: `Waktu Cetak: [DD/MM/YYYY HH:mm]`
   - Row 5: Baris kosong pemisah
   - Row 6: Header Kolom tabel
   - Row 7..N: Data per pegawai (nilai nominal numerik berformat IDR)
   - Row N+1: Baris TOTAL akumulasi (Jasa Dasar, Pengurang, Insentif Tambahan, Jasa Final)
   - Konfigurasi `!cols` untuk padding lebar kolom agar teks tidak terpotong saat dicetak/dibuka.

## Komponen & Arsitektur
- **File Dimodifikasi**: `src/app/dashboard/penilaian-kinerja/rekap/page.js`
- **Library**: `xlsx` (SheetJS) — sudah terpasang di dependencies proyek.
- **Icon**: `FileSpreadsheet` dari `lucide-react`.
- **UI Element**: Tombol "Download Excel" dengan status loading (`exportingExcel`) dan spinner icon saat proses fetch data penuh dan compile workbook.

## Rencana Pengujian
1. Verifikasi klik tombol memicu query API dengan limit besar untuk filter aktif.
2. Verifikasi urutan baris di file Excel: departemen terurut A-Z, nama terurut A-Z.
3. Verifikasi kolom sesuai: hanya No, NIK, Nama, Departemen, Jasa Dasar, Pengurang, Insentif Tambahan, Jasa Final.
4. Verifikasi baris Total di bagian akhir menjumlahkan semua baris dengan akurat.
