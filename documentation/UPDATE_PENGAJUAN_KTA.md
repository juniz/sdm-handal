# 🔄 Update Dokumentasi - Pengajuan KTA

## 📅 Update Log

**Tanggal**: [CURRENT_DATE]  
**Versi**: 1.1  
**Perubahan**: Menggunakan `getUser()` dari `auth.js` untuk konsistensi

## 🔧 Perubahan yang Dilakukan

### 1. **Refactoring Backend API**

#### Sebelum:

```javascript
// Manual JWT verification
const cookieStore = cookies();
const token = await cookieStore.get("auth_token")?.value;
const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
const userNik = verified.payload.nik;
```

#### Sesudah:

```javascript
// Menggunakan helper function dari auth.js
const user = await getUser();
if (!user) {
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = user.id;
```

### 2. **Perbaikan Struktur Data**

#### Mapping User ID ke NIK:

- API sekarang menggunakan `user.id` dari JWT token
- Query database mengambil NIK berdasarkan ID user
- Tabel `pengajuan_kta` tetap menggunakan field `nik` sesuai struktur

#### Query Improvement:

```sql
-- Ambil data lengkap user
SELECT p.departemen, d.nama as departemen_name, p.nik
FROM pegawai p
LEFT JOIN departemen d ON p.departemen = d.dep_id
WHERE p.id = ?
```

### 3. **Department Detection Logic**

#### Improved Logic:

```javascript
const isITorHRD =
	userDepartment === "IT" ||
	userDepartment === "HRD" ||
	userDepartmentName?.toLowerCase().includes("it") ||
	userDepartmentName?.toLowerCase().includes("teknologi") ||
	userDepartmentName?.toLowerCase().includes("hrd") ||
	userDepartmentName?.toLowerCase().includes("human resource");
```

### 4. **Database Function Enhancement**

#### New Function: `fn_check_department_access()`

```sql
CREATE FUNCTION fn_check_department_access(p_user_id INT)
RETURNS BOOLEAN
-- Fungsi untuk mengecek akses departemen user
```

## 🎯 Benefits dari Update

### 1. **Konsistensi Kode**

- ✅ Menggunakan standard auth helper
- ✅ Menghindari duplikasi JWT verification
- ✅ Centralized authentication logic

### 2. **Maintainability**

- ✅ Easier to maintain auth logic
- ✅ Consistent error handling
- ✅ Better code organization

### 3. **Security**

- ✅ Centralized token validation
- ✅ Consistent security checks
- ✅ Better error messages

### 4. **Performance**

- ✅ Optimized database queries
- ✅ Better indexing strategy
- ✅ Database function for access check

## 📋 Migration Checklist

### Database Updates:

- [ ] Jalankan migration script terbaru
- [ ] Test trigger auto-populate data
- [ ] Verify foreign key constraints
- [ ] Test new database function

### API Testing:

- [ ] Test GET endpoint dengan user IT/HRD
- [ ] Test GET endpoint dengan user biasa
- [ ] Test POST endpoint untuk submit pengajuan
- [ ] Test PUT endpoint untuk update status
- [ ] Test authorization untuk berbagai departemen

### Frontend Testing:

- [ ] Test department detection
- [ ] Test UI rendering berdasarkan akses
- [ ] Test form submission
- [ ] Test status update dialog

## 🔍 Key Changes Summary

| Aspect                  | Before              | After                        |
| ----------------------- | ------------------- | ---------------------------- |
| **Auth Method**         | Manual JWT verify   | `getUser()` helper           |
| **User Identification** | `payload.nik`       | `user.id` → query NIK        |
| **Department Check**    | Simple string match | Flexible logic with fallback |
| **Database Query**      | Direct NIK usage    | ID to NIK mapping            |
| **Error Handling**      | Basic               | Centralized & consistent     |

## 🧪 Testing Scenarios

### 1. **User Authentication**

```javascript
// Test dengan berbagai kondisi token
- Valid token → Success
- Invalid token → 401 Unauthorized
- Expired token → 401 Unauthorized
- No token → 401 Unauthorized
```

### 2. **Department Detection**

```javascript
// Test berbagai format departemen
- departemen = 'IT' → Admin access
- departemen = 'HRD' → Admin access
- departemen_name = 'Teknologi Informasi' → Admin access
- departemen_name = 'Human Resource Development' → Admin access
- departemen = 'KEUANGAN' → User access
```

### 3. **Data Flow**

```javascript
// Flow pengajuan KTA
1. User login → getUser() → user.id
2. Query pegawai → get NIK from user.id
3. Check department → determine access level
4. Submit/View pengajuan → based on access
```

## 🚨 Breaking Changes

### ⚠️ **Tidak Ada Breaking Changes**

- API endpoints tetap sama
- Response format tetap sama
- Frontend tidak perlu perubahan
- Database schema tetap kompatibel

### ✅ **Backward Compatibility**

- Semua existing data tetap valid
- Migration script aman dijalankan
- No downtime required

## 📈 Performance Improvements

### Database Optimization:

- ✅ Added indexes for frequently queried fields
- ✅ Optimized JOIN queries
- ✅ Database function for access check
- ✅ Better query planning

### Code Optimization:

- ✅ Reduced code duplication
- ✅ Centralized auth logic
- ✅ Better error handling
- ✅ Improved maintainability

## 🔮 Future Enhancements

### Planned Improvements:

1. **Caching Layer**: Cache department data untuk performa
2. **Audit Logging**: Log semua perubahan status
3. **Notification System**: Email/SMS notification
4. **Bulk Operations**: Proses multiple pengajuan
5. **Advanced Reporting**: Dashboard analytics

### Technical Debt Reduction:

1. **Unit Tests**: Comprehensive test coverage
2. **API Documentation**: OpenAPI/Swagger docs
3. **Error Monitoring**: Centralized error tracking
4. **Performance Monitoring**: APM integration

## 📞 Support & Troubleshooting

### Common Issues:

#### 1. **User tidak bisa akses**

- **Check**: Data departemen di database
- **Solution**: Verify departemen field di tabel pegawai

#### 2. **Department tidak terdeteksi**

- **Check**: Join query dengan tabel departemen
- **Solution**: Pastikan foreign key relationship

#### 3. **Token issues**

- **Check**: JWT token validity
- **Solution**: Re-login atau refresh token

### Debug Commands:

```sql
-- Check user department
SELECT p.id, p.nik, p.nama, p.departemen, d.nama as dept_name
FROM pegawai p
LEFT JOIN departemen d ON p.departemen = d.dep_id
WHERE p.id = ?;

-- Test access function
SELECT fn_check_department_access(USER_ID);

-- Check pengajuan data
SELECT * FROM v_pengajuan_kta_report WHERE nik = 'USER_NIK';
```

---

**Update By**: Developer Team  
**Reviewed By**: Tech Lead  
**Approved By**: Project Manager  
**Status**: ✅ **COMPLETED**
