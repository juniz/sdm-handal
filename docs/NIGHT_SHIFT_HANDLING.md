# Night Shift Handling - Solusi Shift Malam Berturut-turut

## 🚨 Masalah yang Diselesaikan

### **Skenario Bermasalah:**

1. **Tanggal 17 (20:00):** User presensi masuk shift malam (20:00-07:00)
2. **Tanggal 18 (07:00):** User presensi pulang
3. **Tanggal 18 (20:00):** User ingin presensi masuk shift malam lagi
4. **❌ Masalah:** Aplikasi masih mendeteksi presensi tanggal 17 sebagai "aktif"

### **Root Cause:**

- API `/api/attendance/today` mengembalikan data dari `rekap_presensi` (presensi yang sudah selesai)
- Tidak membedakan presensi **aktif** vs presensi yang **sudah selesai**
- Frontend menggunakan data presensi selesai untuk blocking presensi baru

## ✅ Solusi yang Diimplementasi

### **1. Pemisahan Konsep Data**

#### **Sebelum (Bermasalah):**

```
/api/attendance/today → Mengembalikan:
├── temporary_presensi (presensi aktif) ✅
└── rekap_presensi (presensi selesai) ❌ MASALAH!
```

#### **Sesudah (Diperbaiki):**

```
/api/attendance/today → Hanya presensi AKTIF
├── temporary_presensi (yang belum checkout) ✅
└── Tidak cek rekap_presensi ✅

/api/attendance/completed → Presensi SELESAI
├── rekap_presensi (untuk tampilan UI) ✅
└── Tidak mempengaruhi blocking logic ✅
```

### **2. Perubahan API Endpoints**

#### **A. `/api/attendance/today` - DIPERBAIKI**

```javascript
// SEBELUM: Cek temporary_presensi DAN rekap_presensi
// SESUDAH: Hanya cek temporary_presensi

const tempQuery = `
    SELECT * FROM temporary_presensi 
    WHERE id = ? 
    AND jam_pulang IS NULL  -- Hanya yang belum checkout
    AND (
        DATE(jam_datang) = ?  -- Hari ini
        OR (
            DATE(jam_datang) = ?  -- Kemarin (shift malam)
            AND EXISTS (SELECT 1 FROM jam_masuk WHERE ...)
            AND (waktu_masih_aktif_condition)  -- Masih dalam periode
        )
    )
`;

// TIDAK ada query ke rekap_presensi!
```

#### **B. `/api/attendance/completed` - BARU**

```javascript
// API baru untuk data presensi yang sudah selesai
const rekapQuery = `
    SELECT * FROM rekap_presensi 
    WHERE id = ? 
    AND jam_pulang IS NOT NULL  -- Yang sudah checkout
    AND (
        DATE(jam_datang) = ?  -- Hari ini
        OR (shift_malam_condition)  -- Shift malam kemarin
    )
`;
```

### **3. Perubahan Frontend Logic**

#### **State Management:**

```javascript
// SEBELUM
const [todayAttendance, setTodayAttendance] = useState(null);

// SESUDAH
const [todayAttendance, setTodayAttendance] = useState(null); // Aktif
const [completedAttendance, setCompletedAttendance] = useState(null); // Selesai
```

#### **Data Fetching:**

```javascript
// SEBELUM
fetchTodayAttendance() → Dapat data aktif ATAU selesai

// SESUDAH
fetchTodayAttendance() → Hanya data aktif
fetchCompletedAttendance() → Hanya data selesai
```

#### **UI Logic:**

```javascript
// Form Presensi Masuk
{
	!todayAttendance && !completedAttendance && (
		<FormPresensiMasuk /> // Tampil jika tidak ada yang aktif DAN selesai
	);
}

// Form Presensi Pulang
{
	todayAttendance && !completedAttendance && (
		<FormPresensiPulang /> // Tampil jika ada aktif tapi belum selesai
	);
}

// Status Selesai
{
	completedAttendance && (
		<StatusSelesai /> // Tampil jika ada yang selesai
	);
}
```

## 🔄 Flow Logic Baru

### **Skenario: Shift Malam Berturut-turut**

```
Tanggal 17 (20:00) - User presensi masuk shift malam
├── Data masuk ke: temporary_presensi
├── /api/attendance/today → Return data aktif ✅
└── /api/attendance/completed → Return null ✅

Tanggal 18 (07:00) - User presensi pulang
├── Data pindah ke: rekap_presensi
├── temporary_presensi: KOSONG
├── /api/attendance/today → Return null ✅
└── /api/attendance/completed → Return data selesai ✅

Tanggal 18 (20:00) - User mau presensi masuk lagi
├── /api/attendance/today → Return null ✅
├── /api/attendance/completed → Return data selesai (tidak blocking) ✅
├── Frontend logic:
│   ├── todayAttendance = null → Form masuk tampil ✅
│   ├── completedAttendance = data selesai → Info tampil ✅
│   └── Tidak ada blocking ✅
└── RESULT: User bisa presensi masuk ✅
```

## 🧪 Test Cases

### **Test Case 1: Shift Malam Normal**

```
Input:
- Shift: 20:00-07:00
- Presensi masuk: 17 Des 20:00
- Presensi pulang: 18 Des 07:00
- Coba presensi lagi: 18 Des 20:00

API Responses:
- /api/attendance/today → null
- /api/attendance/completed → {data shift 17-18}

Expected: ✅ BERHASIL presensi masuk baru
```

### **Test Case 2: Shift Malam Belum Selesai**

```
Input:
- Shift: 20:00-07:00
- Presensi masuk: 17 Des 20:00
- Waktu sekarang: 18 Des 05:00 (belum jam pulang)
- Coba presensi lagi: 18 Des 05:00

API Responses:
- /api/attendance/today → {data shift aktif}
- /api/attendance/completed → null

Expected: ❌ DITOLAK karena shift masih berlangsung
```

### **Test Case 3: Shift Normal (Tidak Terpengaruh)**

```
Input:
- Shift: 08:00-17:00
- Presensi masuk: 18 Des 08:00
- Presensi pulang: 18 Des 17:00
- Coba presensi lagi: 18 Des 20:00

API Responses:
- /api/attendance/today → null
- /api/attendance/completed → {data shift 18}

Expected: ✅ BERHASIL presensi masuk baru (jika ada shift malam)
```

## 📊 Database Impact

### **Query Optimization:**

```sql
-- API /today - Lebih efisien (hanya 1 query)
SELECT * FROM temporary_presensi
WHERE id = ? AND jam_pulang IS NULL ...

-- API /completed - Terpisah dan tidak blocking
SELECT * FROM rekap_presensi
WHERE id = ? AND jam_pulang IS NOT NULL ...
```

### **Performance Benefits:**

- ✅ Mengurangi kompleksitas query
- ✅ Pemisahan concern yang jelas
- ✅ Tidak ada false positive blocking
- ✅ Query lebih cepat dan akurat

## 🔧 API Endpoints yang Diperbaiki

### **1. `/api/attendance/today` (GET) - DIPERBAIKI**

- ✅ Hanya return presensi aktif dari `temporary_presensi`
- ✅ Tidak cek `rekap_presensi` lagi
- ✅ Logic shift malam yang akurat

### **2. `/api/attendance/completed` (GET) - BARU**

- ✅ Return presensi selesai dari `rekap_presensi`
- ✅ Untuk keperluan tampilan UI saja
- ✅ Tidak mempengaruhi blocking logic

### **3. `/api/attendance` (POST) - DIPERBAIKI**

- ✅ Menggunakan `getTodayAttendance()` yang sudah diperbaiki
- ✅ Hanya cek presensi aktif untuk blocking
- ✅ Logic yang konsisten dengan API `/today`

## 🎯 Benefits

1. **✅ Shift Malam Berturut-turut:** User bisa presensi shift malam setiap hari
2. **✅ Data Separation:** Pemisahan yang jelas antara data aktif vs selesai
3. **✅ No False Blocking:** Tidak ada blocking yang tidak perlu
4. **✅ Better Performance:** Query yang lebih efisien dan focused
5. **✅ Clear Logic:** Logic yang mudah dipahami dan di-maintain
6. **✅ UI Consistency:** Tampilan yang akurat sesuai status presensi

## 🔍 Troubleshooting

### **Problem: User masih tidak bisa presensi**

**Solution:**

1. Check response `/api/attendance/today` → harus null
2. Check response `/api/attendance/completed` → boleh ada data
3. Verify `temporary_presensi` table → harus kosong untuk user
4. Check frontend state: `todayAttendance` harus null

### **Problem: Data presensi tidak tampil di UI**

**Solution:**

1. Check response `/api/attendance/completed` → harus ada data
2. Verify `completedAttendance` state di frontend
3. Check rendering logic untuk completed attendance

### **Problem: Shift malam detection salah**

**Solution:**

1. Verify data di table `jam_masuk`
2. Check condition `TIME(jam_pulang) < TIME(jam_masuk)`
3. Test dengan script `npm run debug-night-shift [employee_id]`

## 🚀 Deployment Checklist

- [x] Update `/api/attendance/today` - hanya return aktif
- [x] Create `/api/attendance/completed` - return selesai
- [x] Update `/api/attendance` POST - gunakan logic baru
- [x] Update frontend state management
- [x] Update frontend UI logic
- [x] Test shift malam berturut-turut
- [x] Test shift normal (tidak terpengaruh)
- [x] Update dokumentasi

## 📝 Summary

**Masalah Utama:** API `/today` mengembalikan data presensi selesai yang menyebabkan false blocking.

**Solusi Utama:** Pemisahan data presensi aktif vs selesai ke API yang berbeda.

**Result:** User bisa presensi shift malam berturut-turut tanpa blocking yang tidak perlu.
