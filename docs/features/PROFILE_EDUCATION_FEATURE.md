# Fitur Riwayat Pendidikan - Profile Page

## Overview

Fitur riwayat pendidikan memungkinkan user untuk melihat, menambah, mengedit, dan menghapus riwayat pendidikan mereka di halaman profile. Fitur ini terintegrasi dengan database `riwayat_pendidikan` dan menggunakan API endpoints yang aman.

## Fitur Utama

### 1. **Tampilan Riwayat Pendidikan**

- Menampilkan daftar riwayat pendidikan dengan urutan prioritas (S3 → S2 → S1 → D4 → D3 → D2 → D1 → SMK → SMA → SMP → SD)
- Setiap item menampilkan informasi lengkap:
  - Tingkat pendidikan (dengan badge berwarna)
  - Nama sekolah/institusi
  - Jurusan/program studi
  - Tahun lulus
  - Kepala sekolah/direktur
  - Status pendidikan
  - Sumber pendanaan
  - Keterangan tambahan
  - Link berkas/ijazah (jika tersedia)

### 2. **Manajemen Riwayat Pendidikan**

- **Tambah Baru**: Form lengkap untuk menambah riwayat pendidikan baru
- **Edit**: Edit data riwayat pendidikan yang sudah ada
- **Hapus**: Hapus riwayat pendidikan dengan konfirmasi

### 3. **Validasi dan Keamanan**

- Hanya user yang login yang dapat mengakses
- Validasi field required (tingkat pendidikan, nama sekolah, tahun lulus)
- Keamanan data berdasarkan NIP user

## Komponen yang Dibuat

### 1. **ProfileEducationHistory**

- Komponen untuk menampilkan daftar riwayat pendidikan
- Responsive design dengan animasi
- Empty state jika belum ada data

### 2. **AddEducationModal**

- Modal untuk menambah/edit riwayat pendidikan
- Form lengkap dengan validasi
- Support untuk semua field database

### 3. **API Endpoints**

- `GET /api/profile/education` - Ambil riwayat pendidikan
- `POST /api/profile/education` - Tambah riwayat pendidikan baru
- `PUT /api/profile/education/[id]` - Update riwayat pendidikan
- `DELETE /api/profile/education/[id]` - Hapus riwayat pendidikan

## Struktur Database

### Tabel `riwayat_pendidikan`

```sql
CREATE TABLE riwayat_pendidikan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nip VARCHAR(20) NOT NULL,
    pendidikan ENUM('SD', 'SMP', 'SMA', 'SMK', 'D I', 'D II', 'D III', 'D IV', 'S1', 'S1 Profesi', 'S2', 'S2 Profesi', 'S3', 'Post Doctor'),
    sekolah VARCHAR(50),
    jurusan VARCHAR(40),
    thn_lulus YEAR(4),
    kepala VARCHAR(50),
    pendanaan ENUM('Biaya Sendiri', 'Biaya Instansi Sendiri', 'Lembaga Swasta Kerjasama', 'Lembaga Swasta Kompetisi', 'Lembaga Pemerintah', 'Beasiswa'),
    keterangan VARCHAR(50),
    status VARCHAR(40),
    berkas VARCHAR(500),
    FOREIGN KEY (nip) REFERENCES pegawai(nip)
);
```

## Cara Penggunaan

### 1. **Melihat Riwayat Pendidikan**

- Buka halaman profile (`/dashboard/profile`)
- Scroll ke bagian "Riwayat Pendidikan"
- Data akan ditampilkan secara otomatis

### 2. **Menambah Riwayat Pendidikan Baru**

- Klik tombol "Edit Profile Lengkap"
- Scroll ke bagian "Riwayat Pendidikan"
- Klik tombol "Tambah Pendidikan"
- Isi form dengan data lengkap
- Klik "Simpan"

### 3. **Edit Riwayat Pendidikan**

- Di modal edit profile, cari item pendidikan yang ingin diedit
- Klik icon edit (biru)
- Ubah data yang diperlukan
- Klik "Update"

### 4. **Hapus Riwayat Pendidikan**

- Di modal edit profile, cari item pendidikan yang ingin dihapus
- Klik icon hapus (merah)
- Konfirmasi penghapusan

## Field Form

### Field Wajib (\*)

- **Tingkat Pendidikan**: Dropdown dengan opsi dari database
- **Nama Sekolah/Institusi**: Text input
- **Tahun Lulus**: Number input (1950 - tahun sekarang + 1)

### Field Opsional

- **Jurusan/Program Studi**: Text input
- **Kepala Sekolah/Direktur**: Text input
- **Status**: Dropdown (Lulus, Belum Lulus, Drop Out, Pindah)
- **Pendanaan**: Dropdown dengan opsi sumber pendanaan
- **Keterangan**: Textarea untuk catatan tambahan
- **Link Berkas**: URL input untuk berkas/ijazah

## Urutan Prioritas Pendidikan

Sistem otomatis mengurutkan riwayat pendidikan berdasarkan tingkat:

1. **S3** (Doktor)
2. **S2** (Magister)
3. **S1** (Sarjana)
4. **D IV** (Diploma 4)
5. **D III** (Diploma 3)
6. **D II** (Diploma 2)
7. **D I** (Diploma 1)
8. **SMK** (Sekolah Menengah Kejuruan)
9. **SMA** (Sekolah Menengah Atas)
10. **SMP** (Sekolah Menengah Pertama)
11. **SD** (Sekolah Dasar)

## Keamanan

### 1. **Authentication**

- Semua endpoint memerlukan user login
- Menggunakan JWT token dari cookie

### 2. **Authorization**

- User hanya dapat mengakses data milik sendiri
- Validasi NIP untuk setiap operasi CRUD

### 3. **Input Validation**

- Validasi field required
- Sanitasi input untuk mencegah SQL injection
- Validasi format data (tahun, URL, dll)

## Error Handling

### 1. **Client Side**

- Loading states untuk semua operasi
- Error messages yang informatif
- Success feedback untuk user

### 2. **Server Side**

- Try-catch untuk semua operasi database
- Logging error untuk debugging
- Response error yang konsisten

## Responsive Design

### 1. **Mobile**

- Single column layout
- Touch-friendly buttons
- Optimized spacing

### 2. **Desktop**

- Two column layout untuk form
- Hover effects
- Better information density

## Animasi

### 1. **Framer Motion**

- Fade in/out untuk modal
- Scale animation untuk modal
- Staggered animation untuk list items

### 2. **CSS Transitions**

- Hover effects untuk buttons
- Smooth color transitions
- Loading spinners

## Testing

### 1. **Manual Testing**

- Test semua CRUD operations
- Test validasi form
- Test responsive design

### 2. **API Testing**

- Test semua endpoints
- Test error scenarios
- Test authentication

## Troubleshooting

### 1. **Data tidak muncul**

- Cek API endpoint berfungsi
- Cek user authentication
- Cek database connection

### 2. **Form tidak bisa disubmit**

- Cek field required terisi
- Cek network connection
- Cek browser console untuk error

### 3. **Modal tidak terbuka**

- Cek state management
- Cek event handlers
- Cek z-index CSS

## Future Enhancements

### 1. **File Upload**

- Upload berkas/ijazah langsung
- Image preview
- File validation

### 2. **Bulk Operations**

- Import data dari Excel/CSV
- Export data ke PDF
- Batch delete

### 3. **Advanced Search**

- Filter berdasarkan tingkat pendidikan
- Search berdasarkan nama sekolah
- Date range filtering

### 4. **Notifications**

- Email notification untuk update
- Push notification
- Activity log
