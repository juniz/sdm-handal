# 🚀 Optimisasi Query Attendance API

## 📊 Analisa Masalah Sebelum Optimisasi

### ❌ **Masalah Query N+1 dan Inefficiency:**

1. **Sequential Queries** - Tidak ada N+1 langsung, tapi ada inefficiency:

   ```javascript
   // Query 1: Get schedule
   const schedule = await selectFirst("jadwal_pegawai", {...});

   // Query 2: Get shift (dependent on Query 1)
   const shift = await selectFirst("jam_masuk", {
     shift: schedule[`h${moment().format("D")}`]
   });
   ```

2. **LIKE Operator Inefficiency**:

   ```javascript
   // ❌ Inefficient wildcard LIKE
   jam_datang: { operator: "LIKE", value: `${today}%` }
   ```

3. **Redundant Queries**:

   - Multiple queries dengan where condition yang sama
   - Tidak ada caching untuk schedule data
   - Separate transaction untuk operasi yang berkaitan

4. **No Duplicate Check**:
   - Tidak ada pengecekan attendance yang sudah ada di check-in

## ✅ **Optimisasi yang Diterapkan**

### 🔧 **1. JOIN Query - Eliminasi N+1**

```javascript
// BEFORE: 2 Sequential Queries
const schedule = await selectFirst("jadwal_pegawai", {...});
const shift = await selectFirst("jam_masuk", {...});

// AFTER: 1 Optimized JOIN Query
async function getScheduleWithShift(idPegawai, targetDate = null) {
  const query = `
    SELECT
      jp.id, jp.tahun, jp.bulan,
      jp.h${dayOfMonth} as shift_today,
      jm.jam_masuk, jm.jam_pulang, jm.toleransi
    FROM jadwal_pegawai jp
    LEFT JOIN jam_masuk jm ON jp.h${dayOfMonth} = jm.shift
    WHERE jp.id = ? AND jp.tahun = ? AND jp.bulan = ?
    LIMIT 1
  `;
  return rawQuery(query, [idPegawai, year, month]);
}
```

**Benefit**: Mengurangi 2 query menjadi 1 query dengan JOIN.

### 🔧 **2. DATE Range Optimization**

```javascript
// BEFORE: Inefficient LIKE wildcard
WHERE jam_datang LIKE '2024-01-01%'

// AFTER: Efficient DATE function
WHERE DATE(jam_datang) = '2024-01-01'
```

**Benefit**: Lebih efisien untuk indexing, tidak ada full table scan.

### 🔧 **3. Duplicate Prevention**

```javascript
// NEW: Check existing attendance before insert
const existingAttendance = await getTodayAttendance(idPegawai);
if (existingAttendance) {
	return NextResponse.json(
		{ message: "Anda sudah melakukan presensi masuk hari ini" },
		{ status: 400 }
	);
}
```

**Benefit**: Mencegah duplicate entries, better UX.

### 🔧 **4. Exact Match WHERE Clauses**

```javascript
// BEFORE: LIKE operator on datetime
WHERE jam_datang LIKE '${today}%'

// AFTER: Exact match on primary key + date
WHERE id = ? AND jam_datang = ?
```

**Benefit**: Menggunakan primary key untuk performa optimal.

### 🔧 **5. Enhanced GET Query**

```javascript
// Optimized schedule query dengan shift details
const query = `
  SELECT jp.*, 
    GROUP_CONCAT(
      CONCAT('h', DAY_OF_MONTH, ':', jm.jam_masuk, '-', jm.jam_pulang) 
      SEPARATOR '|'
    ) as shift_details
  FROM jadwal_pegawai jp
  LEFT JOIN jam_masuk jm ON (jp.h1 = jm.shift OR ... OR jp.h31 = jm.shift)
  WHERE jp.id = ? AND jp.tahun = ? AND jp.bulan = ?
  GROUP BY jp.id, jp.tahun, jp.bulan
`;
```

**Benefit**: Include shift information dalam satu query.

## 🗃️ **Database Index Recommendations**

Untuk performance optimal, buat index berikut:

```sql
-- 1. Primary attendance lookup
CREATE INDEX idx_temp_presensi_lookup
ON temporary_presensi (id, jam_datang);

-- 2. Date-based attendance queries
CREATE INDEX idx_temp_presensi_date
ON temporary_presensi (id, DATE(jam_datang));

-- 3. Schedule lookup optimization
CREATE INDEX idx_jadwal_pegawai_lookup
ON jadwal_pegawai (id, tahun, bulan);

-- 4. Shift lookup optimization
CREATE INDEX idx_jam_masuk_shift
ON jam_masuk (shift);

-- 5. Geolocation lookup
CREATE INDEX idx_geolocation_lookup
ON geolocation_presensi (id, tanggal);

-- 6. Rekap presensi lookup
CREATE INDEX idx_rekap_presensi_lookup
ON rekap_presensi (id, DATE(jam_datang));
```

## 📈 **Performance Improvements**

| Operasi                 | Before        | After                | Improvement         |
| ----------------------- | ------------- | -------------------- | ------------------- |
| Check-in Query Count    | 4 queries     | 2 queries            | 50% reduction       |
| Check-out Query Count   | 3 queries     | 1 query + operations | Better organization |
| Schedule + Shift Lookup | 2 sequential  | 1 JOIN               | 50% reduction       |
| Date Range Query        | LIKE wildcard | DATE function        | Index-friendly      |
| Duplicate Prevention    | None          | Built-in check       | Data integrity      |

## 🛡️ **Data Consistency Improvements**

1. **Transaction-like Operations**: Operasi check-out dibungkus dalam try-catch
2. **Atomic Operations**: Batch operations untuk data yang berkaitan
3. **Error Handling**: Better error handling untuk rollback scenarios
4. **Data Validation**: Check attendance existence sebelum operasi

## 🚦 **Monitoring & Future Optimizations**

### **Metrics to Monitor:**

- Query execution time
- Database connection pool usage
- Memory usage untuk foto upload
- API response time

### **Future Optimizations:**

1. **Database Connection Pooling** - Untuk concurrent requests
2. **Redis Caching** - Cache schedule data yang jarang berubah
3. **Image Optimization** - Compress foto sebelum save
4. **Background Jobs** - Async processing untuk geolocation data
5. **Prepared Statements** - Cache query plans

## 🎯 **Best Practices Applied**

1. ✅ **Single Responsibility**: Setiap function punya purpose yang jelas
2. ✅ **DRY Principle**: Reusable functions untuk common operations
3. ✅ **Error Handling**: Comprehensive error handling
4. ✅ **Performance**: Minimal query count, efficient WHERE clauses
5. ✅ **Security**: Prepared statements untuk SQL injection prevention
6. ✅ **Maintainability**: Clear function names dan documentation

## 📝 **Migration Guide**

Untuk implementasi optimisasi ini:

1. **Backup Database** sebelum menjalankan
2. **Run Index Creation** pada database
3. **Deploy New Code** dengan monitoring ketat
4. **Monitor Performance** metrics setelah deployment
5. **Rollback Plan** siap jika ada masalah

---

**Result**: Query attendance API sekarang lebih efisien, tidak ada N+1 problem, dan siap untuk scale! 🚀
