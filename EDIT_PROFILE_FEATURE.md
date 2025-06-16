# Edit Profile Feature - Dokumentasi Lengkap

## Overview

Fitur Edit Profile memungkinkan pengguna untuk mengubah hampir semua data profil mereka melalui interface yang user-friendly. Fitur ini mencakup validasi keamanan, autentikasi JWT, dan pembatasan field yang dapat diedit.

## Fitur Utama

### 1. **Comprehensive Data Editing**

Pengguna dapat mengedit hampir semua data profil mereka, termasuk:

#### Informasi Pribadi:

- Jenis Kelamin (dropdown: Laki-laki/Perempuan)
- Tempat Lahir
- Tanggal Lahir (date picker)
- Pendidikan (dropdown dinamis dari tabel `pendidikan`)
- Alamat (textarea)
- Kota

#### Informasi Identitas:

- No. KTP
- NPWP
- No. Rekening

#### Informasi Kepegawaian:

- Bidang
- Mulai Kerja (date picker)

#### Informasi Kontrak:

- Mulai Kontrak (date picker)

### 2. **Security & Authentication**

- JWT token validation
- User dapat hanya mengedit data mereka sendiri
- Prepared statements untuk mencegah SQL injection
- Field validation di backend

### 3. **User Experience**

- Modal responsif dengan scroll untuk layar kecil
- Form terorganisir dalam section yang jelas
- Loading states dan error handling
- Success feedback dengan auto-close
- Pre-populated form dengan data existing

## Technical Implementation

### Backend API (`/api/profile`)

#### GET Method

- Mengambil data profil lengkap user
- Includes joins dengan tabel terkait (departemen, kelompok_jabatan, stts_kerja)
- JWT authentication required

#### PUT Method

- Update data profil user
- Allowed fields:

  ```javascript
  const allowedFields = [
  	// Informasi Pribadi
  	"alamat",
  	"kota",
  	"jk",
  	"tmp_lahir",
  	"tgl_lahir",
  	"pendidikan",

  	// Informasi Kontak & Identitas
  	"no_ktp",
  	"npwp",
  	"rekening",

  	// Informasi Kepegawaian
  	"bidang",
  	"mulai_kerja",

  	// Informasi Kontrak
  	"mulai_kontrak",
  ];
  ```

### Backend API (`/api/pendidikan`)

#### GET Method

- Mengambil semua data pendidikan dari tabel `pendidikan`
- Data diurutkan berdasarkan `indek ASC`
- Tidak memerlukan authentication (data referensi)
- Response format:
  ```json
  {
  	"status": 200,
  	"message": "Data pendidikan berhasil diambil",
  	"data": [
  		{
  			"tingkat": "SD",
  			"indek": 1
  		},
  		{
  			"tingkat": "SMP",
  			"indek": 2
  		}
  		// ... more education levels
  	]
  }
  ```

### Frontend Components

#### EditProfileModal

- Comprehensive form dengan 4 section utama
- State management untuk semua field
- Form validation dan error handling
- Responsive design (max-w-4xl, scrollable)
- Date formatting untuk input date fields
- **Dynamic dropdown untuk pendidikan** - Mengambil data dari API `/api/pendidikan`
- Loading state untuk fetch data pendidikan

#### Profile Page Integration

- Edit Profile button (hijau) di header
- Real-time update setelah successful edit
- Modal state management

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── profile/route.js          # Backend API Profile
│   │   └── pendidikan/route.js       # Backend API Pendidikan
│   └── dashboard/profile/page.js     # Frontend Profile Page
└── EDIT_PROFILE_FEATURE.md          # Documentation
```

## Usage Instructions

### For Users:

1. Buka halaman Profile
2. Klik tombol "Edit Profile" (hijau) di header
3. Modal akan terbuka dengan form yang sudah terisi data existing
4. Edit field yang diinginkan di section yang sesuai:
   - **Informasi Pribadi**: Data personal seperti alamat, jenis kelamin, tempat/tanggal lahir
   - **Informasi Identitas**: KTP, NPWP, Rekening
   - **Informasi Kepegawaian**: Bidang, tanggal mulai
   - **Informasi Kontrak**: Data kontrak
5. Klik "Simpan Perubahan"
6. Modal akan menampilkan pesan sukses dan otomatis tertutup
7. Data di halaman profile akan terupdate secara real-time

### For Developers:

1. API endpoint: `PUT /api/profile`
2. Requires JWT authentication via cookies
3. Send JSON body dengan field yang ingin diupdate
4. Response format:
   ```json
   {
   	"status": 200,
   	"message": "Data profil berhasil diupdate",
   	"data": {
   		/* updated fields */
   	}
   }
   ```

## Security Features

### 1. **Authentication & Authorization**

- JWT token validation di setiap request
- User hanya bisa edit data mereka sendiri
- Token expiry handling

### 2. **Data Validation**

- Whitelist allowed fields di backend
- Input validation untuk format data
- SQL injection prevention dengan prepared statements

### 3. **Error Handling**

- Comprehensive error messages
- Graceful handling untuk berbagai error scenarios
- User-friendly error display

## Testing Checklist

### Functional Testing:

- [ ] Modal terbuka dengan data pre-filled
- [ ] Semua field dapat diedit
- [ ] Date picker berfungsi untuk tanggal
- [ ] Dropdown selection berfungsi
- [ ] Form submission berhasil
- [ ] Data terupdate di UI setelah save
- [ ] Modal tertutup otomatis setelah sukses
- [ ] Error handling untuk input invalid

### Security Testing:

- [ ] Unauthorized access ditolak
- [ ] User tidak bisa edit data user lain
- [ ] SQL injection attempts blocked
- [ ] XSS prevention
- [ ] CSRF protection

### UI/UX Testing:

- [ ] Responsive di mobile dan desktop
- [ ] Modal scrollable untuk konten panjang
- [ ] Loading states terlihat jelas
- [ ] Error messages informatif
- [ ] Success feedback jelas

## Troubleshooting

### Common Issues:

1. **"Unauthorized" Error**

   - Pastikan user sudah login
   - Check JWT token validity
   - Refresh page jika token expired

2. **"Tidak ada data yang akan diupdate"**

   - Pastikan minimal satu field diubah
   - Check form data sebelum submit

3. **Date Format Issues**

   - Backend expects YYYY-MM-DD format
   - Frontend converts dari date input

4. **Modal tidak responsive**
   - Check max-height dan overflow settings
   - Verify responsive grid classes

### Debug Steps:

1. Check browser console untuk errors
2. Verify network requests di DevTools
3. Check JWT token di cookies
4. Validate form data structure
5. Check database field names match

## Future Enhancements

### Potential Improvements:

1. **File Upload**: Tambah kemampuan upload foto profil
2. **Bulk Edit**: Edit multiple users (untuk admin)
3. **Audit Trail**: Log perubahan data profil
4. **Field Permissions**: Role-based field editing
5. **Data Validation**: Advanced validation rules
6. **Auto-save**: Save draft changes automatically

### Performance Optimizations:

1. **Lazy Loading**: Load modal content on demand
2. **Caching**: Cache profile data
3. **Debounced Validation**: Real-time validation dengan debounce
4. **Optimistic Updates**: Update UI before server response

## Conclusion

Fitur Edit Profile yang diperluas ini memberikan kontrol penuh kepada pengguna untuk mengelola data profil mereka dengan interface yang intuitif dan aman. Implementasi mencakup best practices untuk security, UX, dan maintainability.
