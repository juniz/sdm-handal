# BUGFIX: Table Whitelist - Pengajuan Cuti Error
## Perbaikan Error "Table not allowed: pengajuan_cuti"

**Tanggal:** $(date)  
**Status:** ✅ **FIXED**

---

## MASALAH

Error terjadi saat mengisi pengajuan cuti:
```
Error: Table not allowed: pengajuan_cuti
    at validateTableName (src/lib/db-helper.js:61:9)
    at insert (src/lib/db-helper.js:370:26)
    at POST (src/app/api/cuti/route.js:207:15)
```

**Penyebab:**
Setelah implementasi security fix CVE-002 (SQL Injection via Table/Column Names), semua nama tabel harus ada di whitelist `ALLOWED_TABLES`. Tabel `pengajuan_cuti` dan beberapa tabel lainnya tidak ada di whitelist.

---

## PERBAIKAN

### Tabel yang Ditambahkan ke Whitelist:

1. ✅ `pengajuan_cuti` - untuk pengajuan cuti
2. ✅ `pengajuan_izin` - untuk pengajuan izin  
3. ✅ `pengajuan_tudin` - untuk pengajuan tukar dinas
4. ✅ `pendidikan` - untuk data pendidikan
5. ✅ `jam_jaga` - untuk data shift/jam jaga
6. ✅ `status_history_ticket` - untuk history status ticket
7. ✅ `kelompok_jabatan` - untuk kelompok jabatan
8. ✅ `stts_kerja` - untuk status kerja

### File yang Diubah:

**`src/lib/db-helper.js`**
- Menambahkan 8 tabel baru ke `ALLOWED_TABLES`

---

## CARA MENGATASI DI MASA DEPAN

Jika terjadi error serupa dengan tabel lain:

1. **Cek error message** - Error akan menunjukkan nama tabel yang tidak diizinkan
2. **Verifikasi tabel** - Pastikan tabel memang ada di database dan digunakan dengan benar
3. **Tambahkan ke whitelist** - Tambahkan nama tabel ke `ALLOWED_TABLES` di `src/lib/db-helper.js`
4. **Test** - Test fungsi yang menggunakan tabel tersebut

**Contoh:**
```javascript
// Jika error: Table not allowed: nama_tabel_baru
// Tambahkan ke ALLOWED_TABLES:
const ALLOWED_TABLES = [
	// ... existing tables ...
	"nama_tabel_baru", // ← Tambahkan di sini
];
```

---

## VERIFIKASI

Setelah perbaikan, pastikan:
- ✅ Pengajuan cuti dapat disimpan
- ✅ Pengajuan izin dapat disimpan
- ✅ Pengajuan tukar dinas dapat disimpan
- ✅ Data pendidikan dapat diambil
- ✅ Data shift dapat diambil
- ✅ Tidak ada error "Table not allowed" lagi

---

## CATATAN PENTING

**Security Note:**
- Whitelist ini adalah bagian dari security fix untuk mencegah SQL injection
- Jangan menghapus validasi ini
- Selalu tambahkan tabel baru ke whitelist, jangan bypass validasi

**Best Practice:**
- Saat membuat tabel baru di database, langsung tambahkan ke whitelist
- Dokumentasikan semua tabel yang digunakan di aplikasi
- Review whitelist secara berkala untuk memastikan semua tabel terdaftar

---

**Status:** ✅ **FIXED**  
**Last Updated:** $(date)

