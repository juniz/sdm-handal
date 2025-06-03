# Sistem Ticket IT Support

## Deskripsi

Sistem ticket IT Support adalah fitur untuk mengelola pengajuan perbaikan dan bantuan teknis IT di rumah sakit. Sistem ini memungkinkan staff untuk melaporkan masalah IT dan tim IT untuk mengelola serta menyelesaikan masalah tersebut.

## Fitur Utama

### 1. Manajemen Ticket

- **Buat Ticket Baru**: Staff dapat membuat ticket untuk melaporkan masalah IT
- **Edit Ticket**: Mengubah informasi ticket yang sudah ada
- **Hapus Ticket**: Menghapus ticket yang tidak diperlukan
- **Filter & Pencarian**: Filter berdasarkan status, prioritas, kategori, dan pencarian teks

### 2. Kategori Masalah

- Hardware (masalah perangkat keras)
- Software (masalah aplikasi/program)
- Network (masalah jaringan/internet)
- Printer (masalah printer)
- Email (masalah email)
- Database (masalah database)
- Security (masalah keamanan)
- Backup (masalah backup data)
- Other (masalah lainnya)

### 3. Level Prioritas

- **Low (1)**: Masalah tidak mendesak
- **Medium (2)**: Masalah perlu perhatian
- **High (3)**: Masalah mendesak
- **Critical (4)**: Masalah sangat mendesak/kritis

### 4. Status Ticket

- **Open**: Ticket baru dibuat, belum ditangani
- **In Progress**: Ticket sedang dalam proses penanganan
- **Resolved**: Ticket sudah diselesaikan
- **Closed**: Ticket ditutup/selesai

## Struktur Database

### Tabel `categories_ticket`

```sql
category_id INT PRIMARY KEY AUTO_INCREMENT
category_name VARCHAR(50) NOT NULL UNIQUE
```

### Tabel `priorities_ticket`

```sql
priority_id INT PRIMARY KEY AUTO_INCREMENT
priority_name VARCHAR(20) NOT NULL UNIQUE
priority_level INT NOT NULL UNIQUE
```

### Tabel `statuses_ticket`

```sql
status_id INT PRIMARY KEY AUTO_INCREMENT
status_name VARCHAR(20) NOT NULL UNIQUE
```

### Tabel `tickets`

```sql
ticket_id INT PRIMARY KEY AUTO_INCREMENT
user_id VARCHAR(20) NOT NULL (FK ke pegawai.nik)
departemen_id CHAR(1) NOT NULL (FK ke departemen.dep_id)
category_id INT NOT NULL (FK ke categories_ticket.category_id)
priority_id INT NOT NULL (FK ke priorities_ticket.priority_id)
title VARCHAR(100) NOT NULL
description TEXT NOT NULL
submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
resolved_date TIMESTAMP NULL
closed_date TIMESTAMP NULL
current_status_id INT NOT NULL (FK ke statuses_ticket.status_id)
```

## API Endpoints

### 1. Ticket Management

- `GET /api/ticket` - Mengambil daftar ticket dengan filter dan pagination
- `POST /api/ticket` - Membuat ticket baru
- `PUT /api/ticket` - Mengupdate ticket
- `DELETE /api/ticket` - Menghapus ticket

### 2. Master Data

- `GET /api/ticket/master` - Mengambil semua data master (categories, priorities, statuses, departments)
- `GET /api/ticket/master?type=categories` - Mengambil data kategori saja
- `GET /api/ticket/master?type=priorities` - Mengambil data prioritas saja
- `GET /api/ticket/master?type=statuses` - Mengambil data status saja
- `GET /api/ticket/master?type=departments` - Mengambil data departemen saja

## Cara Instalasi

### 1. Buat Tabel Database

Jalankan script SQL berikut untuk membuat tabel:

```bash
mysql -u username -p database_name < database/create_ticket_tables.sql
```

### 2. Inisialisasi Data Master

Jalankan script untuk mengisi data master:

```bash
mysql -u username -p database_name < database/init_ticket_data.sql
```

### 3. Akses Menu

Menu ticket dapat diakses melalui:

```
/dashboard/ticket
```

## Cara Penggunaan

### 1. Membuat Ticket Baru

1. Klik tombol "Filter & Aksi" untuk membuka panel
2. Klik "Buat Ticket Baru"
3. Isi form dengan informasi:
   - User ID (NIK): NIK pegawai yang melaporkan
   - Departemen: Pilih departemen
   - Kategori: Pilih kategori masalah
   - Prioritas: Pilih level prioritas
   - Judul: Judul singkat masalah
   - Deskripsi: Penjelasan detail masalah
4. Klik "Buat Ticket"

### 2. Filter Ticket

1. Buka panel "Filter & Aksi"
2. Pilih filter yang diinginkan:
   - Status: Filter berdasarkan status ticket
   - Prioritas: Filter berdasarkan prioritas
   - Kategori: Filter berdasarkan kategori
   - Cari: Pencarian teks pada judul/deskripsi

### 3. Edit Ticket

1. Klik icon edit (pensil) pada card ticket
2. Ubah informasi yang diperlukan
3. Klik "Simpan"

### 4. Hapus Ticket

1. Klik icon hapus (tempat sampah) pada card ticket
2. Konfirmasi penghapusan

## Fitur Responsive

- Tampilan responsif untuk desktop, tablet, dan mobile
- Grid layout yang menyesuaikan ukuran layar
- Form modal yang responsive
- Filter accordion yang mobile-friendly

## Validasi Form

- User ID: Wajib diisi
- Departemen: Wajib dipilih
- Kategori: Wajib dipilih
- Prioritas: Wajib dipilih
- Judul: Minimal 5 karakter
- Deskripsi: Minimal 10 karakter

## Notifikasi

Sistem menggunakan toast notification untuk memberikan feedback:

- Sukses: Notifikasi hijau untuk operasi berhasil
- Error: Notifikasi merah untuk operasi gagal
- Auto-hide: Notifikasi hilang otomatis setelah 3 detik

## Pagination

- Default: 12 ticket per halaman
- Navigasi halaman dengan tombol "Sebelumnya" dan "Selanjutnya"
- Informasi halaman saat ini dan total halaman

## Security

- Validasi input di frontend dan backend
- Prepared statements untuk mencegah SQL injection
- Error handling yang proper
- Sanitasi data input

## Troubleshooting

### 1. Error "Status default tidak ditemukan"

Pastikan data status sudah diinisialisasi dengan menjalankan:

```sql
INSERT INTO statuses_ticket (status_name) VALUES ('Open');
```

### 2. Error Foreign Key

Pastikan tabel `pegawai` dan `departemen` sudah ada dan memiliki data yang sesuai.

### 3. Error "Gagal mengambil data master"

Periksa koneksi database dan pastikan tabel master sudah dibuat dan diisi data.

## Pengembangan Lanjutan

### Fitur yang bisa ditambahkan:

1. **Attachment File**: Upload file/gambar untuk ticket
2. **Comment System**: Sistem komentar untuk komunikasi
3. **Assignment**: Assign ticket ke teknisi tertentu
4. **SLA Tracking**: Tracking waktu penyelesaian
5. **Email Notification**: Notifikasi email untuk update ticket
6. **Dashboard Analytics**: Dashboard untuk analisis ticket
7. **Mobile App**: Aplikasi mobile untuk akses ticket
8. **Integration**: Integrasi dengan sistem lain (LDAP, Active Directory)

### Optimisasi:

1. **Caching**: Implementasi caching untuk data master
2. **Search Engine**: Implementasi full-text search
3. **Real-time Updates**: WebSocket untuk update real-time
4. **Export**: Export data ticket ke Excel/PDF
5. **Bulk Operations**: Operasi bulk untuk multiple ticket
