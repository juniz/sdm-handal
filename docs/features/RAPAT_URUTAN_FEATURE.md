# Feature: Penambahan Kolom Urutan pada Sistem Rapat

## 📋 Ringkasan Perubahan

Telah ditambahkan fitur pengurutan (ordering) pada sistem rapat berdasarkan kolom `urutan` dengan urutan ascending (ASC) untuk hasil export rapat.

## 🔧 Perubahan yang Dilakukan

### 1. Database Migration

**File:** `database/add_urutan_column_to_rapat.sql`

- Menambahkan kolom `urutan` (INT) dengan default value 0
- Menambahkan index untuk optimasi query:
  - `idx_rapat_urutan` pada kolom `urutan`
  - `idx_rapat_tanggal_urutan` pada kombinasi `tanggal` dan `urutan`
- Update data existing dengan urutan berdasarkan ID

### 2. API Route Modifications

**File:** `src/app/api/rapat/route.js`

#### GET Request:

- Menambahkan `orderBy: "urutan"` dan `order: "ASC"` pada query
- Data rapat sekarang akan diurutkan berdasarkan kolom urutan secara ascending

#### POST Request:

- Menambahkan field `urutan` pada request body
- Menambahkan `urutan: urutan || 0` pada data insert

#### PUT Request:

- Menambahkan field `urutan` pada request body
- Menambahkan `urutan: urutan || 0` pada data update

### 3. PDF Generator Modifications

**File:** `src/app/dashboard/rapat/components/utils/pdfGenerator.js`

#### sortRapatList Function:

- Mengubah logika sorting dari berdasarkan nama dengan prioritas tertentu menjadi berdasarkan kolom `urutan`
- Jika urutan sama, maka akan diurutkan berdasarkan nama secara alfabetis
- Memastikan konsistensi urutan antara API response dan export PDF/print

## 📊 Struktur Database Setelah Perubahan

```sql
-- Tabel rapat sekarang memiliki struktur:
CREATE TABLE rapat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    urutan INT DEFAULT 0,
    tanggal DATE,
    rapat VARCHAR(255),
    nama VARCHAR(255),
    instansi VARCHAR(255),
    tanda_tangan TEXT,
    -- indexes
    INDEX idx_rapat_urutan (urutan),
    INDEX idx_rapat_tanggal_urutan (tanggal, urutan)
);
```

## 🔄 Cara Penggunaan

### 1. Menjalankan Migration

Jalankan script SQL migration:

```bash
mysql -u username -p database_name < database/add_urutan_column_to_rapat.sql
```

### 2. Menggunakan Field Urutan

#### Saat Menambah Rapat Baru (POST):

```javascript
const rapatData = {
	tanggal: "2025-09-19",
	rapat: "Rapat Koordinasi",
	nama: "John Doe",
	instansi: "IT Department",
	tanda_tangan: "base64_signature",
	urutan: 1, // Field baru untuk pengurutan
};
```

#### Saat Update Rapat (PUT):

```javascript
const updateData = {
	id: 1,
	tanggal: "2025-09-19",
	rapat: "Rapat Koordinasi Updated",
	nama: "John Doe",
	instansi: "IT Department",
	tanda_tangan: "base64_signature",
	urutan: 2, // Update urutan
};
```

## 📈 Impact pada Export

- **PDF Generator**: Data rapat pada export PDF sekarang akan diurutkan berdasarkan kolom `urutan` ASC
- **Print View**: Hasil print juga akan mengikuti urutan yang sama
- **Konsistensi**: Urutan akan konsisten di semua format export

## ⚠️ Catatan Penting

1. **Backward Compatibility**: Data existing akan memiliki urutan berdasarkan ID mereka
2. **Default Value**: Jika urutan tidak diisi, akan menggunakan value 0
3. **Manual Ordering**: Admin dapat mengatur urutan secara manual sesuai kebutuhan
4. **Performance**: Index telah ditambahkan untuk optimasi query

## 🧪 Testing

Untuk menguji fitur ini:

1. Jalankan migration database
2. Tambah beberapa data rapat dengan urutan yang berbeda
3. Lakukan export PDF/print
4. Verifikasi bahwa data diurutkan sesuai kolom urutan ASC

## 🚀 Deployment

1. Backup database sebelum menjalankan migration
2. Jalankan script migration pada database production
3. Deploy kode aplikasi yang sudah diupdate
4. Test functionality pada environment production

---

**Tanggal:** 19 September 2025  
**Status:** Completed ✅
