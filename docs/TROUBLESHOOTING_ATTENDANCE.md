# Troubleshooting Attendance Issues

## Masalah: Data Presensi Lama Masih Muncul

### Gejala

- Setelah menyelesaikan shift malam dan checkout, data presensi masih muncul di UI
- Alert "attendence complete" muncul meskipun seharusnya tidak ada data
- Section "Data Presensi Hari Ini" tetap tampil meskipun database bersih

### Root Cause Analysis

Masalah ini bisa disebabkan oleh beberapa faktor:

1. **Browser Cache**: Data lama ter-cache di browser
2. **Database Residual**: Masih ada data di tabel `rekap_presensi` atau `temporary_presensi`
3. **Frontend State**: State React tidak ter-reset dengan benar
4. **API Response Cache**: Response API ter-cache

### Langkah Debugging

#### 1. Cek Console Browser

Buka Developer Tools dan lihat console log:

- `Today attendance API response:` - untuk melihat response dari `/api/attendance/today`
- `Completed attendance API response:` - untuk melihat response dari `/api/attendance/completed`
- `STATE CHANGE -` - untuk melihat perubahan state React

#### 2. Gunakan Debug Panel

Di halaman attendance, gunakan tombol debug yang tersedia:

- **Clear All State**: Reset semua state React
- **Log Current State**: Lihat state saat ini di console
- **Refresh Data**: Fetch ulang semua data dari API

#### 3. Cek Database Manual

```sql
-- Cek data aktif
SELECT * FROM temporary_presensi WHERE id = [USER_ID];

-- Cek data selesai
SELECT * FROM rekap_presensi WHERE id = [USER_ID]
AND DATE(jam_datang) = CURDATE()
ORDER BY jam_datang DESC;
```

### Solusi

#### Solusi 1: Clear Browser Cache

1. Buka Developer Tools (F12)
2. Klik kanan pada tombol refresh
3. Pilih "Empty Cache and Hard Reload"
4. Atau gunakan mode incognito

#### Solusi 2: Clear Application State

1. Gunakan tombol "Clear All State" di debug panel
2. Refresh halaman
3. Cek apakah masalah teratasi

#### Solusi 3: Clear Database (Hati-hati!)

```javascript
// Jalankan script cleaning (HANYA UNTUK DEVELOPMENT)
node scripts/clean-all-attendance.js
```

#### Solusi 4: Restart Development Server

```bash
# Stop server (Ctrl+C)
rm -rf .next
npm run dev
```

### Pencegahan

#### 1. Proper Cache Control

Semua API call sudah menggunakan:

```javascript
{
  cache: 'no-cache',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
}
```

#### 2. Timestamp Cache Busting

API calls menggunakan timestamp parameter:

```javascript
fetch(`/api/attendance/today?t=${new Date().getTime()}`);
```

#### 3. State Management

Proper state reset pada error conditions:

```javascript
catch (error) {
  console.error("Error:", error);
  setTodayAttendance(null);
  setCompletedAttendance(null);
}
```

### Monitoring

#### Console Logs yang Perlu Diperhatikan

- `Setting today attendance data:` - Seharusnya null jika tidak ada data aktif
- `Setting completed attendance data:` - Seharusnya null jika tidak ada data selesai
- `STATE CHANGE -` - Perubahan state harus konsisten dengan API response

#### Red Flags

- API mengembalikan data tapi database kosong
- State tidak berubah meskipun API response null
- "Data Presensi Hari Ini" muncul tanpa data aktif

### FAQ

**Q: Mengapa data masih muncul meskipun database bersih?**
A: Kemungkinan browser cache atau state React tidak ter-reset. Gunakan hard refresh dan clear state.

**Q: Apakah aman menjalankan script cleaning?**
A: Script cleaning hanya untuk development. JANGAN jalankan di production tanpa backup.

**Q: Bagaimana memastikan shift malam tidak bermasalah?**
A: Cek console log untuk melihat apakah API `/api/attendance/today` mengembalikan data untuk shift malam yang sudah selesai.

### Debug Commands

```bash
# Cek proses Next.js
ps aux | grep -E "(next|node.*dev)"

# Clear Next.js cache
rm -rf .next

# Hard restart
pkill -f "next dev"
npm run dev
```

### Contact Developer

Jika masalah persisten, sertakan:

1. Screenshot console log
2. Screenshot debug panel state
3. Database query result
4. Browser dan versi yang digunakan
