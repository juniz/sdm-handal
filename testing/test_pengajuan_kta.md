# 🧪 Testing Guide - Fitur Pengajuan KTA

## 📋 Checklist Testing

### 1. **Database Setup**

- [ ] Jalankan migration script: `database/migrations/improve_pengajuan_kta_table.sql`
- [ ] Pastikan tabel `pengajuan_kta` sudah dibuat dengan struktur yang benar
- [ ] Pastikan foreign key constraint sudah aktif
- [ ] Test trigger auto-populate data pegawai

### 2. **Backend API Testing**

#### GET `/api/pengajuan-kta`

- [ ] **Test sebagai User Biasa**:

  - Login dengan user departemen selain IT/HRD
  - Hit API GET `/api/pengajuan-kta`
  - Harus return hanya pengajuan user sendiri

- [ ] **Test sebagai IT/HRD**:
  - Login dengan user departemen IT atau HRD
  - Hit API GET `/api/pengajuan-kta`
  - Harus return semua pengajuan dari semua user

#### POST `/api/pengajuan-kta`

- [ ] **Test Submit Pengajuan Valid**:

  ```json
  {
  	"jenis": "Baru",
  	"alasan": "Karyawan baru membutuhkan KTA"
  }
  ```

  - Harus berhasil create pengajuan dengan status "pending"

- [ ] **Test Validasi Input**:

  - Test dengan jenis kosong → harus error 400
  - Test dengan alasan kosong → harus error 400
  - Test dengan jenis invalid → harus error 400

- [ ] **Test Pengajuan Ganda**:
  - Submit pengajuan pertama
  - Submit pengajuan kedua sebelum yang pertama selesai
  - Harus error dengan pesan "masih memiliki pengajuan yang sedang diproses"

#### PUT `/api/pengajuan-kta`

- [ ] **Test Update Status (IT/HRD)**:

  ```json
  {
  	"id": 1,
  	"status": "disetujui"
  }
  ```

  - Harus berhasil update status

- [ ] **Test Update Status dengan Penolakan**:

  ```json
  {
  	"id": 1,
  	"status": "ditolak",
  	"alasan_ditolak": "Dokumen tidak lengkap"
  }
  ```

  - Harus berhasil update status dan alasan penolakan

- [ ] **Test Authorization**:
  - Login sebagai user biasa (bukan IT/HRD)
  - Coba update status
  - Harus error 403 Forbidden

### 3. **Frontend Testing**

#### Akses Menu

- [ ] **User Biasa**:

  - Login dengan user departemen selain IT/HRD
  - Menu "Pengajuan KTA" harus muncul di sidebar
  - Tombol "Ajukan KTA" harus muncul

- [ ] **IT/HRD User**:
  - Login dengan user departemen IT/HRD
  - Menu "Pengajuan KTA" harus muncul di sidebar
  - Tombol "Ajukan KTA" TIDAK boleh muncul
  - Kolom NIK, Nama, Jabatan harus muncul di tabel
  - Tombol Edit harus muncul untuk setiap pengajuan

#### Form Pengajuan

- [ ] **Test Form Submission**:

  - Klik "Ajukan KTA"
  - Isi jenis pengajuan: "Baru"
  - Isi alasan: "Test pengajuan KTA baru"
  - Submit form
  - Harus berhasil dan muncul toast success
  - Form harus hilang setelah submit
  - Data harus muncul di tabel

- [ ] **Test Form Validation**:
  - Submit form kosong → harus muncul error
  - Submit dengan salah satu field kosong → harus muncul error

#### Tabel Data

- [ ] **Test Display Data**:
  - Data pengajuan harus muncul di tabel
  - Status badge harus sesuai dengan status
  - Jenis badge harus sesuai dengan jenis pengajuan
  - Tanggal harus dalam format Indonesia

#### Dialog Update Status (IT/HRD)

- [ ] **Test Update Status**:

  - Klik tombol Edit pada pengajuan
  - Dialog update harus muncul
  - Pilih status "disetujui"
  - Klik "Update Status"
  - Status di tabel harus berubah

- [ ] **Test Penolakan**:
  - Klik tombol Edit pada pengajuan
  - Pilih status "ditolak"
  - Field alasan penolakan harus muncul
  - Isi alasan penolakan
  - Klik "Update Status"
  - Status dan alasan penolakan harus muncul di tabel

### 4. **Department Detection Testing**

#### Test Berbagai Skenario Department

- [ ] **User dengan departemen ID = 'IT'**:

  - Harus bisa akses semua pengajuan
  - Harus bisa update status

- [ ] **User dengan departemen ID = 'HRD'**:

  - Harus bisa akses semua pengajuan
  - Harus bisa update status

- [ ] **User dengan nama departemen mengandung 'IT'**:

  - Contoh: "Teknologi Informasi", "IT Support"
  - Harus bisa akses semua pengajuan

- [ ] **User dengan nama departemen mengandung 'HRD'**:

  - Contoh: "Human Resource Development"
  - Harus bisa akses semua pengajuan

- [ ] **User departemen lain**:
  - Contoh: "Keuangan", "Marketing", "Produksi"
  - Hanya bisa lihat pengajuan sendiri
  - Tidak bisa update status

### 5. **Integration Testing**

#### End-to-End Workflow

- [ ] **Scenario 1: Pengajuan KTA Baru**:

  1. User biasa login
  2. Submit pengajuan KTA baru
  3. IT/HRD login
  4. Lihat pengajuan masuk
  5. Update status ke "disetujui"
  6. Update status ke "proses"
  7. Update status ke "selesai"
  8. User biasa cek status terakhir

- [ ] **Scenario 2: Pengajuan Ditolak**:
  1. User biasa submit pengajuan
  2. IT/HRD tolak dengan alasan
  3. User biasa lihat alasan penolakan
  4. User biasa submit pengajuan baru (harus bisa karena yang lama sudah ditolak)

### 6. **Error Handling Testing**

- [ ] **Test Network Error**:

  - Matikan koneksi internet
  - Coba submit pengajuan
  - Harus muncul error message yang jelas

- [ ] **Test Server Error**:

  - Matikan database
  - Coba akses halaman pengajuan
  - Harus muncul error message yang jelas

- [ ] **Test Invalid Token**:
  - Hapus auth token
  - Akses halaman pengajuan
  - Harus redirect ke login

### 7. **Performance Testing**

- [ ] **Test Loading Speed**:

  - Halaman harus load dalam < 2 detik
  - API response harus < 1 detik

- [ ] **Test dengan Data Banyak**:
  - Insert 100+ data pengajuan
  - Test pagination (jika ada)
  - Test search/filter (jika ada)

### 8. **Security Testing**

- [ ] **Test SQL Injection**:

  - Coba input dengan karakter SQL di form
  - Tidak boleh ada error SQL

- [ ] **Test XSS**:

  - Input script tag di form alasan
  - Script tidak boleh dieksekusi

- [ ] **Test Authorization Bypass**:
  - Coba akses API dengan token user biasa untuk update status
  - Harus ditolak dengan 403

## 🐛 Common Issues & Solutions

### Issue 1: Department tidak terdeteksi

**Symptom**: User IT/HRD tidak bisa akses semua pengajuan
**Solution**:

- Cek data departemen di database
- Pastikan field `departemen` di tabel pegawai berisi ID yang benar
- Cek join query dengan tabel departemen

### Issue 2: Form tidak bisa submit

**Symptom**: Loading terus saat submit form
**Solution**:

- Cek network tab di browser developer tools
- Cek console untuk error JavaScript
- Cek log server untuk error API

### Issue 3: Data tidak muncul

**Symptom**: Tabel kosong padahal ada data
**Solution**:

- Cek API response di network tab
- Cek authentication token
- Cek query database di backend

## 📊 Test Data Samples

### Sample Pengajuan Data

```sql
INSERT INTO pengajuan_kta (nik, jenis, alasan, status) VALUES
('1234567890123456', 'Baru', 'Karyawan baru membutuhkan KTA', 'pending'),
('1234567890123457', 'Ganti', 'KTA lama rusak dan tidak bisa dibaca', 'disetujui'),
('1234567890123458', 'Hilang', 'KTA hilang saat perjalanan dinas ke Jakarta', 'dalam_proses'),
('1234567890123459', 'Ganti', 'Perubahan data pribadi', 'ditolak');
```

### Sample User Data untuk Testing

- **IT User**: NIK dengan departemen 'IT'
- **HRD User**: NIK dengan departemen 'HRD'
- **Regular User**: NIK dengan departemen lain (misal 'KEUANGAN')

## ✅ Testing Completion Checklist

- [ ] Semua API endpoints tested dan working
- [ ] Frontend UI tested di desktop dan mobile
- [ ] Department detection working correctly
- [ ] Authorization working properly
- [ ] Error handling working as expected
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation updated

---

**Testing Date**: ****\_\_\_****
**Tested By**: ****\_\_\_****
**Status**: [ ] PASS [ ] FAIL
**Notes**: ****\_\_\_****
