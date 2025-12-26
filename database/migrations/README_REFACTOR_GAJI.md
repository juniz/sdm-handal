# Refaktor Schema gaji_pegawai

## Perubahan
Menggabungkan kolom `gaji_pokok` dan `total_gaji` menjadi satu kolom `gaji`.

### Sebelum:
- `gaji_pokok` DECIMAL(15,2)
- `total_gaji` DECIMAL(15,2)

### Sesudah:
- `gaji` DECIMAL(15,2)

## Alasan Refaktor
Karena komponen gaji hanya gaji pokok (tidak ada tunjangan atau potongan), maka tidak perlu memisahkan `gaji_pokok` dan `total_gaji`. Kolom `gaji` sudah cukup untuk menyimpan nilai gaji.

## Migration

### Untuk Database Baru
Jika tabel `gaji_pegawai` belum ada, script `create_gaji_tables.sql` sudah menggunakan schema baru dengan kolom `gaji`.

### Untuk Database yang Sudah Ada
Jika tabel `gaji_pegawai` sudah ada dengan kolom lama, jalankan migration script:

```bash
mysql -u username -p database_name < database/migrations/refactor_gaji_pegawai_schema.sql
```

Migration script akan:
1. Menambahkan kolom `gaji` baru
2. Copy data dari `total_gaji` (atau `gaji_pokok` jika `total_gaji` null) ke kolom `gaji`
3. Menghapus kolom `gaji_pokok` dan `total_gaji`

## File yang Diupdate

### Database
- `database/create_gaji_tables.sql` - Schema baru dengan kolom `gaji`
- `database/migrations/refactor_gaji_pegawai_schema.sql` - Migration script

### Backend
- `src/app/api/gaji/upload/route.js` - Update insert data menggunakan kolom `gaji`

### Frontend
- `src/components/penggajian/GajiTable.jsx` - Update display menggunakan `gaji.gaji`
- `src/components/penggajian/utils/pdfSlipGenerator.js` - Update PDF template menggunakan `gajiData.gaji`

### Dokumentasi
- `src/components/penggajian/README.md` - Update dokumentasi schema

## Testing
Setelah migration, pastikan:
1. Data gaji masih bisa diakses dengan benar
2. Upload Excel masih berfungsi
3. Generate PDF slip gaji masih berfungsi
4. Display di tabel masih benar


