# Modul Penggajian Pegawai

## Deskripsi
Modul untuk mengelola data gaji pegawai dengan fitur upload Excel dan generate PDF slip gaji.

## Fitur Utama

### 1. Upload Excel Gaji (Hanya untuk Departemen KEU)
- Upload file Excel dengan format: NIK, Nama, Jenis (Gaji/Jasa), Total Gaji
- Validasi data sebelum insert
- Menampilkan hasil upload (success count, error count, error details)
- Audit trail melalui tabel `gaji_upload_log`

### 2. View Gaji
- User biasa: hanya bisa melihat gaji sendiri
- User KEU: bisa melihat semua gaji
- Filter berdasarkan periode (tahun/bulan)
- Pencarian berdasarkan NIK atau nama

### 3. Generate Slip Gaji PDF
- Download slip gaji dalam format PDF
- Format mengikuti template RSB Nganjuk
- User biasa: hanya bisa download slip gaji sendiri
- User KEU: bisa download semua slip gaji

## Format Excel

### Template Excel
Kolom yang diperlukan:
- **Kolom A**: NIK (VARCHAR 20)
- **Kolom B**: Nama (VARCHAR 255)
- **Kolom C**: Jenis (ENUM: "Gaji" atau "Jasa")
- **Kolom D**: Total Gaji (DECIMAL)

### Validasi Excel
- Baris pertama bisa header (akan di-skip jika berisi "NIK", "Nama", dll)
- NIK harus ada di tabel pegawai
- Jenis harus "Gaji" atau "Jasa" (case insensitive)
- Total Gaji harus angka positif
- Tidak boleh ada duplikasi NIK dalam satu file untuk periode yang sama
- Tidak boleh ada duplikasi untuk periode yang sama (NIK + periode + jenis)

## Struktur Database

### Tabel `gaji_pegawai`
- `id`: Primary key
- `nik`: NIK pegawai (FK ke pegawai.nik)
- `periode_tahun`: Tahun periode gaji
- `periode_bulan`: Bulan periode gaji (1-12)
- `jenis`: ENUM('Gaji', 'Jasa')
- `gaji`: Total gaji (DECIMAL)
- `uploaded_by`: NIK user yang upload (FK ke pegawai.nik)
- `uploaded_at`: Timestamp upload
- Unique constraint: (nik, periode_tahun, periode_bulan, jenis)

### Tabel `gaji_upload_log`
- `id`: Primary key
- `file_name`: Nama file Excel
- `file_path`: Path file yang diupload
- `periode_tahun`: Tahun periode
- `periode_bulan`: Bulan periode
- `total_records`: Total baris dalam file
- `success_count`: Jumlah data berhasil diinsert
- `error_count`: Jumlah data gagal
- `uploaded_by`: NIK user yang upload
- `uploaded_at`: Timestamp upload
- `error_details`: JSON detail error (jika ada)

## Authorization

### Departemen KEU
- Upload Excel gaji
- View semua gaji
- Download semua slip gaji

### User Lain
- View gaji sendiri
- Download slip gaji sendiri

## Instalasi

### 1. Database
Jalankan script SQL untuk membuat tabel:
```bash
mysql -u username -p database_name < database/create_gaji_tables.sql
```

### 2. Install Dependencies
```bash
npm install xlsx
```

### 3. Setup
Tidak ada konfigurasi tambahan yang diperlukan. Modul siap digunakan setelah:
- Database tables dibuat
- Library xlsx terinstall
- User login dengan departemen KEU untuk akses upload

## Penggunaan

### Upload Excel Gaji
1. Login sebagai user departemen KEU
2. Buka halaman Penggajian
3. Klik tombol "Upload Excel"
4. Pilih periode (tahun dan bulan)
5. Pilih file Excel
6. Klik "Upload"
7. Lihat hasil upload (success/error count)

### View Gaji
1. Buka halaman Penggajian
2. Gunakan filter untuk memilih periode
3. Gunakan search untuk mencari NIK/nama
4. Data gaji akan ditampilkan dalam tabel

### Download Slip Gaji
1. Buka halaman Penggajian
2. Cari gaji yang ingin didownload
3. Klik "Download Slip"
4. PDF akan terbuka di window baru untuk print

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── gaji/
│   │       ├── route.js              # API CRUD gaji
│   │       ├── upload/
│   │       │   └── route.js         # API upload Excel
│   │       └── slip/
│   │           └── [id]/
│   │               └── route.js     # API generate PDF slip
│   └── dashboard/
│       └── penggajian/
│           └── page.js              # Halaman utama
├── components/
│   └── penggajian/
│       ├── GajiTable.jsx            # Tabel daftar gaji
│       ├── GajiFilter.jsx           # Filter periode dan search
│       ├── UploadExcelModal.jsx     # Modal upload Excel
│       └── utils/
│           └── pdfSlipGenerator.js  # Utility generate PDF
└── hooks/
    └── useGaji.js                   # Custom hook untuk gaji
```

## Troubleshooting

### Error: Library xlsx belum terinstall
**Solusi**: Jalankan `npm install xlsx`

### Error: NIK tidak ditemukan di database
**Solusi**: Pastikan NIK di Excel sudah ada di tabel pegawai

### Error: Duplikasi gaji untuk periode yang sama
**Solusi**: Hapus data gaji lama untuk periode yang sama atau gunakan jenis yang berbeda

### Error: Hanya user departemen KEU yang dapat mengupload
**Solusi**: Pastikan user login dengan departemen KEU atau nama departemen mengandung "keu" atau "keuangan"

