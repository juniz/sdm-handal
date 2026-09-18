# Fitur Print Out & Export PDF Menu /dashboard/development

## 1. Latar Belakang & Tujuan
Menu `/dashboard/development` mengelola pengajuan pengembangan sistem (software/module development requests). Fitur ini menambahkan:
1. Cetak Laporan Rekapitulasi Pengajuan pada halaman index `/dashboard/development` sesuai filter aktif.
2. Cetak Formulir Permintaan Pengembangan Sistem resmi per tiket pada halaman detail `/dashboard/development/[id]`.
3. Modal preview cetak interaktif dengan dukungan cetak langsung via browser (`window.print()`) dan unduh berkas PDF (`jsPDF`/canvas).

---

## 2. Arsitektur Komponen

```
src/components/development/
├── DevelopmentPrintModal.jsx         # Modal preview cetak universal (A4 preview, tombol print & download)
├── DevelopmentListPrintView.jsx      # Layout printable laporan rekapitulasi pengajuan
├── DevelopmentDetailPrintView.jsx    # Layout printable formulir permintaan pengajuan satuan
└── index.js                          # Export komponen baru
```

### 2.1. `DevelopmentPrintModal.jsx`
- **Tanggung Jawab**: Wrapper modal popup untuk melihat tampilan lembar A4 sebelum dicetak.
- **Props**:
  - `isOpen`: boolean
  - `onClose`: () => void
  - `title`: string
  - `fileName`: string (nama file default saat download PDF)
  - `children`: ReactNode (isi printable layout)
- **Aksi Kontrol**:
  - Tombol **"Cetak Dokumen"**: Menjalankan `window.print()`.
  - Tombol **"Unduh PDF"**: Menjalankan konversi target DOM `#development-print-content` ke berkas PDF.
  - Tombol **"Tutup"**: Menutup dialog preview.

### 2.2. `DevelopmentListPrintView.jsx`
- **Target Kertas**: A4 Portrait/Landscape.
- **Konten**:
  - **Kop Laporan**: Logo instansi (`/logo-kop.png`), nama instansi ("Sistem Informasi Manajemen SDM"), judul laporan ("Laporan Rekapitulasi Pengajuan Pengembangan Sistem"), tanggal cetak (`DD MMMM YYYY HH:mm WIB`).
  - **Blok Parameter Filter**: Menampilkan status aktif, prioritas, modul, departemen, kata kunci pencarian.
  - **Tabel Rekap Data**:
    - Kolom: No, No. Tiket, Tanggal Pengajuan, Judul Pengajuan, Pemohon & Departemen, Jenis Modul, Prioritas, Status, PIC Developer, Estimasi/Tgl Selesai.
    - Baris zebra stripe kontras rendah ramah printer monokrom.
  - **Ringkasan Total**: Statistik total pengajuan, menunggu review, dalam pengerjaan, selesai, ditolak.
  - **Kolom Pengesahan**: 2 kolom tanda tangan di bagian bawah (Penyusun Dokumen & Kepala Bagian IT/SIMRS).

### 2.3. `DevelopmentDetailPrintView.jsx`
- **Target Kertas**: A4 Portrait.
- **Konten**:
  - **Kop Formulir**: Logo instansi, teks *"Formulir Permintaan Pengembangan Sistem Informasi"*, Nomor Dokumen & No. Tiket.
  - **Bagian I - Data Pemohon**:
    - Tanggal Pengajuan
    - Nama Pemohon & NIP/NIK
    - Departemen / Unit Kerja
    - Jenis Modul / Aplikasi
    - Tingkat Prioritas
  - **Bagian II - Rincian Kebutuhan Pengembangan**:
    - Judul Pengajuan
    - Latar Belakang / Urgensi Kebutuhan
    - Deskripsi Rinci Modul / Fitur Baru
    - Dampak Terhadap Alur Kerja / Layanan
  - **Bagian III - Verifikasi & Persetujuan (Approval Flow)**:
    - Status Persetujuan (Disetujui / Ditolak / Menunggu Review)
    - Pejabat Penyetuju (Nama, Departemen, Jabatan)
    - Catatan / Arahan Penyetuju
    - Tanggal Verifikasi
  - **Bagian IV - Penugasan & Pelaksanaan IT**:
    - PIC Developer / Penanggung Jawab Teknis
    - Tanggal Mulai Pengerjaan & Target Selesai
    - Status Terkini & Tanggal Realisasi Selesai
  - **Bagian V - Lembar Pengesahan (3 Kolom Tanda Tangan)**:
    - Kolom 1: Pemohon (User yang mengajukan)
    - Kolom 2: Atasan Langsung / Ka. Departemen Pemohon
    - Kolom 3: Penanggung Jawab IT / SIMRS

---

## 3. Data Flow & Integrasi Halaman

### 3.1. Halaman Index: `/dashboard/development`
- Tambah tombol *"Cetak Rekap"* di header tindakan utama (bersebelahan dengan *"Buat Baru"*).
- State:
  - `showPrintModal`: boolean
- Saat modal cetak dibuka:
  - Mengoper `requests`, `statistics`, `filters`, `masterData` ke `DevelopmentListPrintView`.

### 3.2. Halaman Detail: `/dashboard/development/[id]`
- Tambah tombol *"Cetak Form"* di bar navigasi/header halaman detail.
- Mengoper objek `request`, `statusHistory`, `notes`, `user` ke `DevelopmentDetailPrintView`.

---

## 4. Mekanisme Cetak & Export PDF

### 4.1. Browser Print (`@media print`)
- Menambahkan stylesheet print terisolasi:
  Hanya elemen `#development-print-content` yang `visible`, semua elemen lain (`nav`, `header`, `aside`, modal backdrop, buttons) disembunyikan.

### 4.2. Unduh Berkas PDF
- Menggunakan pendekatan standar yang sudah ada di proyek (`jsPDF` + `html2canvas` atau `jspdf-autotable`).
- Saat tombol *"Unduh PDF"* diklik:
  - Konversi container preview `#development-print-content` ke PDF canvas dengan rasio A4.
  - File disimpan dengan penamaan otomatis: `Laporan_Pengembangan_SDM_[YYYYMMDD].pdf` atau `Form_Permintaan_[nomor_tiket].pdf`.

---

## 5. Rencana Pengujian & Verifikasi
1. **Verifikasi Tampilan List Print**:
   - Membuka menu `/dashboard/development`, klik tombol "Cetak Rekap".
   - Memastikan data pada modal preview sesuai dengan data dan filter yang sedang aktif.
   - Menguji tombol browser print (`window.print()`) dan tombol download PDF.
2. **Verifikasi Tampilan Detail Print**:
   - Membuka salah satu detail tiket di `/dashboard/development/[id]`, klik tombol "Cetak Form".
   - Memastikan seluruh informasi tiket, pengaju, approval, deskripsi kebutuhan, penugasan teknisi, dan 3 kolom tanda tangan tampil lengkap.
3. **Verifikasi Edge Cases**:
   - Data dengan deskripsi panjang (halaman otomatis page-break dengan rapi).
   - Tiket yang belum memiliki approval atau belum di-assign teknisi (menampilkan placeholder strip `-` tanpa error).
