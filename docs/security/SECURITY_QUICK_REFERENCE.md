# SECURITY QUICK REFERENCE GUIDE

## Panduan Cepat Keamanan Aplikasi SDM Handal

---

## 📋 STATUS PERBAIKAN

### ✅ Telah Diperbaiki (Selesai)

- [x] **CVE-001:** SQL Injection via ORDER BY
- [x] **CVE-002:** SQL Injection via Table/Column Names
- [x] **CVE-003:** Path Traversal dalam File Upload
- [x] **CVE-004:** File Upload tanpa Validasi Konten
- [x] **CVE-005:** Error Logging Information Disclosure
- [x] **CVE-007:** Hardcoded Encryption Keys

**Status:** ✅ **SEMUA CELAH KRITIS TELAH DIPERBAIKI**

---

## 🚀 TINDAKAN SEGERA YANG PERLU DILAKUKAN

### 1. ⚠️ UPDATE NEXT.JS & REACT (PRIORITAS TERTINGGI!)

**Celah RCE Kritis:** CVE-2025-55182 & CVE-2025-66478 - RCE pada React Server Components

**Action:**

```bash
# Update dependencies
npm install

# Verifikasi versi
npm list next react react-dom react-server-dom-webpack
# Harus menampilkan:
# next@15.3.6+
# react@19.0.1+
# react-dom@19.0.1+
# react-server-dom-webpack@19.0.1+
```

**Detail:**

- `SECURITY_UPDATE_NEXTJS_REACT.md` - Update guide
- `SECURITY_RCE_REACT_SERVER_COMPONENTS.md` - Detail celah dan perbaikan

### 2. ⚠️ VALIDASI PROPS SERVER COMPONENTS (WAJIB!)

**Setelah update, WAJIB validasi semua props di Server Components dan API routes dengan dynamic params.**

**Action:**

```javascript
// Di API routes dengan dynamic params, tambahkan:
import {
	validateIdParam,
	validateSearchParams,
} from "@/lib/server-component-security";

export async function GET(request, { params }) {
	// Validasi params
	const id = validateIdParam(params.id);

	// Validasi search params
	const { searchParams } = new URL(request.url);
	const schema = {
		page: { type: "string", pattern: /^\d+$/, default: "1" },
		status: { type: "string", whitelist: ["open", "closed"] },
	};
	const validated = validateSearchParams(searchParams, schema);

	// Gunakan validated values
}
```

**Detail:** Lihat `SECURITY_RCE_REACT_SERVER_COMPONENTS.md` untuk contoh lengkap

### 3. Setup Environment Variables

Tambahkan ke file `.env`:

```env
# Encryption Keys (GANTI DENGAN KEYS YANG LEBIH KUAT DI PRODUCTION!)
AES_USER_KEY=nur
AES_PASSWORD_KEY=windi

# JWT Secret (jika belum ada)
JWT_SECRET=your-very-secure-secret-key-here

# Debug Mode (set false di production)
DEBUG=false
```

**⚠️ PENTING:**

- Ganti `AES_USER_KEY` dan `AES_PASSWORD_KEY` dengan keys yang lebih kuat di production
- Jangan commit file `.env` ke repository
- Gunakan key management system di production

### 4. Update Whitelist Tables (Jika Ada Tabel Baru)

Jika menambahkan tabel baru ke database, tambahkan ke `src/lib/db-helper.js`:

```javascript
const ALLOWED_TABLES = [
	// ... existing tables ...
	"nama_tabel_baru", // ← Tambahkan di sini
];
```

**⚠️ PENTING:** Jika terjadi error `Table not allowed: [nama_tabel]`, berarti tabel tersebut belum ditambahkan ke whitelist. Tambahkan nama tabel ke `ALLOWED_TABLES` di `src/lib/db-helper.js`.

**Tabel yang sudah ditambahkan:**

- `pengajuan_cuti` - untuk pengajuan cuti
- `pengajuan_izin` - untuk pengajuan izin
- `pengajuan_tudin` - untuk pengajuan tukar dinas
- `pendidikan` - untuk data pendidikan
- `jam_jaga` - untuk data shift/jam jaga
- `status_history_ticket` - untuk history status ticket
- `kelompok_jabatan` - untuk kelompok jabatan
- `stts_kerja` - untuk status kerja

### 3. Testing

Lakukan testing untuk memastikan semua perbaikan bekerja:

- Test login dengan environment variables
- Test file upload dengan berbagai jenis file
- Test API endpoints dengan parameter yang tidak valid

---

## 📚 DOKUMENTASI LENGKAP

1. **SECURITY_AUDIT_REPORT.md** - Laporan audit keamanan lengkap
2. **SECURITY_FIXES_DOCUMENTATION.md** - Dokumentasi detail semua perbaikan
3. **SECURITY_QUICK_REFERENCE.md** - File ini (quick reference)

---

## 🔄 REKOMENDASI PERBAIKAN KEDEPANNYA

### Prioritas Tinggi (1-2 Minggu)

1. **Rate Limiting** - Mencegah brute force dan DoS
2. **Input Validation Middleware** - Validasi otomatis untuk semua input
3. **Content Security Policy (CSP)** - Mencegah XSS attacks
4. **HTTPS Enforcement** - Enforce HTTPS di production
5. **Audit Logging** - Log semua aksi kritis

### Prioritas Sedang (1 Bulan)

6. **Session Management** - Token revocation, refresh tokens
7. **Password Policy** - Enforce password strength
8. **Two-Factor Authentication (2FA)** - Tambahan layer security
9. **SQL Query Monitoring** - Monitor query yang mencurigakan
10. **Virus Scanning** - Scan file upload untuk malware

### Prioritas Rendah (2-3 Bulan)

11. **Dependency Security Scanning** - Scan vulnerabilities di npm packages
12. **Penetration Testing** - Professional security testing
13. **Security Headers Lengkap** - X-Frame-Options, dll
14. **Database Encryption** - Encrypt data at rest
15. **API Versioning** - Versioning untuk backward compatibility

**Detail lengkap:** Lihat `SECURITY_FIXES_DOCUMENTATION.md` bagian "Rekomendasi Perbaikan Kedepannya"

---

## 🛡️ BEST PRACTICES UNTUK DEVELOPER

### 1. Input Validation

```javascript
// ✅ BENAR: Gunakan whitelist
const ALLOWED_VALUES = ["value1", "value2"];
const validated = ALLOWED_VALUES.includes(userInput) ? userInput : "default";

// ❌ SALAH: Langsung gunakan user input
const query = `SELECT * FROM table WHERE column = '${userInput}'`;
```

### 2. Database Queries

```javascript
// ✅ BENAR: Gunakan parameterized queries
await query("SELECT * FROM table WHERE id = ?", [userId]);

// ✅ BENAR: Validasi table/column names
const validatedTable = validateTableName(tableName);
await query(`SELECT * FROM ${validatedTable} WHERE id = ?`, [userId]);

// ❌ SALAH: Concatenate user input
await query(`SELECT * FROM ${tableName} WHERE id = ${userId}`);
```

### 3. File Upload

```javascript
// ✅ BENAR: Validasi magic bytes dan ukuran
if (!validateImageMagicBytes(buffer)) {
	throw new Error("Invalid file type");
}
if (buffer.length > MAX_SIZE) {
	throw new Error("File too large");
}

// ❌ SALAH: Hanya cek ekstensi
if (!filename.endsWith(".jpg")) {
	throw new Error("Invalid file");
}
```

### 4. Error Handling

```javascript
// ✅ BENAR: Sanitasi error messages
const sanitized = errorMessage.substring(0, MAX_LENGTH).replace(/[<>]/g, "");

// ❌ SALAH: Langsung return error message
return { error: error.message }; // Bisa expose sensitive info
```

---

## 🔍 CHECKLIST SEBELUM DEPLOY KE PRODUCTION

- [ ] Semua environment variables sudah di-set dengan values yang aman
- [ ] Encryption keys sudah diganti dengan keys yang kuat
- [ ] DEBUG mode sudah di-set ke `false`
- [ ] HTTPS sudah di-enable
- [ ] Rate limiting sudah diimplementasikan
- [ ] Input validation middleware sudah diterapkan
- [ ] CSP headers sudah dikonfigurasi
- [ ] Audit logging sudah aktif
- [ ] Monitoring dan alerting sudah setup
- [ ] Backup dan disaster recovery plan sudah ada
- [ ] Security testing sudah dilakukan
- [ ] Dokumentasi sudah diupdate

---

## 📞 KONTAK & SUPPORT

Jika menemukan celah keamanan baru:

1. Jangan expose di public
2. Laporkan ke security team
3. Tunggu konfirmasi sebelum melakukan disclosure

---

**Last Updated:** \$(date)  
**Version:** 1.0
