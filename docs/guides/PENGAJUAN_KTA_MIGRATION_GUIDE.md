# Migration Guide: Penambahan Nomor Pengajuan KTA

## Overview

Dokumentasi ini menjelaskan perubahan yang dilakukan untuk menambahkan fitur nomor pengajuan otomatis pada sistem Pengajuan KTA.

## Database Changes

### 1. Struktur Tabel Baru

```sql
-- Kolom baru yang ditambahkan
ALTER TABLE pengajuan_kta
ADD COLUMN no_pengajuan VARCHAR(20) NOT NULL UNIQUE AFTER id;
```

### 2. Format Nomor Pengajuan

- **Format**: `KTA-YYYY-MM-NNNN`
- **Contoh**:
  - `KTA-2024-01-0001` (Pengajuan pertama di Januari 2024)
  - `KTA-2024-01-0002` (Pengajuan kedua di Januari 2024)
  - `KTA-2024-02-0001` (Pengajuan pertama di Februari 2024)

### 3. Auto-Generation System

- **Function**: `generate_no_pengajuan()`
- **Trigger**: `trigger_generate_no_pengajuan`
- **Logic**:
  - Reset nomor urut setiap bulan
  - Format 4 digit dengan leading zeros
  - Thread-safe dengan DETERMINISTIC function

## Backend Changes

### 1. API Response Updates

```javascript
// GET /api/pengajuan-kta
// Response sekarang include no_pengajuan
{
  "data": [
    {
      "id": 1,
      "no_pengajuan": "KTA-2024-01-0001",
      "nik": "1234567890",
      "jenis": "Baru",
      // ... other fields
    }
  ]
}

// POST /api/pengajuan-kta
// Response sekarang include no_pengajuan yang auto-generated
{
  "status": 201,
  "message": "Pengajuan KTA berhasil disubmit",
  "data": {
    "id": 1,
    "no_pengajuan": "KTA-2024-01-0001",
    "nik": "1234567890",
    // ... other fields
  }
}
```

### 2. Query Modifications

- Semua SELECT query tetap menggunakan `pk.*` (sudah include no_pengajuan)
- POST method ditambahkan query untuk fetch no_pengajuan setelah insert
- Fallback handling jika auto-generation gagal

## Frontend Changes

### 1. Desktop Table View

```jsx
// Header baru
<TableHead>No Pengajuan</TableHead>

// Data cell dengan styling khusus
<TableCell className="font-mono text-blue-600">
  {item.no_pengajuan || '-'}
</TableCell>
```

### 2. Mobile Card View

```jsx
// Badge nomor pengajuan di header card
{
	item.no_pengajuan && (
		<div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
			{item.no_pengajuan}
		</div>
	);
}
```

### 3. Detail Dialog

```jsx
// Mengganti ID Pengajuan dengan No Pengajuan
<Label>No Pengajuan</Label>
<div className="mt-1 p-2 bg-blue-50 rounded text-sm font-mono text-blue-600">
  {selectedPengajuan.no_pengajuan || `#${selectedPengajuan.id}`}
</div>
```

## Migration Steps

### 1. Database Migration

```bash
# Jalankan file SQL migration
mysql -u username -p database_name < database_migration_pengajuan_kta.sql
```

### 2. Backend Deployment

- Deploy perubahan API route
- Test endpoint dengan data baru
- Verify auto-generation working

### 3. Frontend Deployment

- Deploy perubahan UI components
- Test responsive layout
- Verify nomor pengajuan tampil di semua view

## Testing Checklist

### Database Testing

- [ ] Kolom no_pengajuan berhasil ditambahkan
- [ ] Function generate_no_pengajuan bekerja
- [ ] Trigger auto-generate berfungsi
- [ ] Index performance optimal
- [ ] Data existing ter-update dengan nomor pengajuan

### Backend Testing

- [ ] GET API mengembalikan no_pengajuan
- [ ] POST API generate nomor otomatis
- [ ] Nomor urut reset setiap bulan
- [ ] Format nomor sesuai KTA-YYYY-MM-NNNN
- [ ] Error handling untuk duplicate

### Frontend Testing

- [ ] Desktop table menampilkan kolom No Pengajuan
- [ ] Mobile card menampilkan badge nomor pengajuan
- [ ] Detail dialog menampilkan nomor pengajuan
- [ ] Responsive layout tetap baik
- [ ] Loading state dan error handling

## Rollback Plan

Jika diperlukan rollback:

```sql
-- 1. Drop trigger dan function
DROP TRIGGER IF EXISTS trigger_generate_no_pengajuan;
DROP FUNCTION IF EXISTS generate_no_pengajuan;

-- 2. Drop index
DROP INDEX idx_no_pengajuan ON pengajuan_kta;
DROP INDEX idx_pengajuan_year_month ON pengajuan_kta;

-- 3. Drop column
ALTER TABLE pengajuan_kta DROP COLUMN no_pengajuan;
```

## Performance Considerations

### Database

- Index pada no_pengajuan untuk pencarian cepat
- Index pada year/month untuk generate function
- DETERMINISTIC function untuk consistency

### Frontend

- Conditional rendering untuk backward compatibility
- Fallback display jika no_pengajuan null
- Minimal re-render dengan proper key props

## Security Notes

- No_pengajuan bersifat public (tidak sensitive)
- Unique constraint mencegah duplicate
- Auto-generation menghindari manual manipulation
- Audit trail tetap tersimpan di created_at

## 🚀 Format Nomor Pengajuan

```
KTA-2024-01-0001  ← Pengajuan pertama Januari 2024
KTA-2024-01-0002  ← Pengajuan kedua Januari 2024
KTA-2024-02-0001  ← Pengajuan pertama Februari 2024
```

**Keunggulan Format:**

- 📅 **Yearly/Monthly Reset**: Mudah tracking per periode
- 🔢 **4 Digit**: Support sampai 9999 pengajuan per bulan
- 🏷️ **Prefix KTA**: Jelas identitas dokumen
- 📊 **Sortable**: Mudah untuk sorting dan filtering

## Future Enhancements

Possible improvements:

1. Search by nomor pengajuan
2. Filter by year/month
3. Export dengan nomor pengajuan
4. Print format dengan nomor pengajuan
5. QR Code dengan nomor pengajuan

---

**Migration Date**: 2024
**Version**: 1.0.0
**Status**: Ready for Production
