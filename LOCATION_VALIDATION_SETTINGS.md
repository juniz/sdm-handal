# Pengaturan Validasi Lokasi

## Overview

Sistem presensi dapat dikonfigurasi untuk mengaktifkan atau menonaktifkan validasi lokasi melalui environment variable. Meskipun validasi dinonaktifkan, sistem tetap akan menyimpan koordinat lokasi dan log keamanan untuk keperluan pencatatan.

## Environment Variable

### ENABLE_LOCATION_VALIDATION

Mengontrol apakah validasi lokasi diaktifkan atau tidak pada saat presensi.

**Default:** `true` (validasi diaktifkan)

**Nilai yang valid:**

- `true` - Validasi lokasi diaktifkan (default)
- `false` - Validasi lokasi dinonaktifkan

## Cara Penggunaan

### 1. Mengaktifkan Validasi Lokasi (Default)

```env
ENABLE_LOCATION_VALIDATION=true
```

atau kosongkan variable ini (default ke true)

### 2. Menonaktifkan Validasi Lokasi

```env
ENABLE_LOCATION_VALIDATION=false
```

## Perbedaan Perilaku

### Jika Validasi DIAKTIFKAN (true):

- ✅ Sistem melakukan validasi keamanan lokasi
- ✅ Presensi akan ditolak jika lokasi tidak aman (confidence rendah, GPS spoofing, dll)
- ✅ Menampilkan peringatan keamanan lokasi ke user
- ✅ Menyimpan koordinat dan log keamanan
- ✅ Status lokasi berwarna hijau/merah berdasarkan validasi

### Jika Validasi DINONAKTIFKAN (false):

- ✅ Sistem tetap mengambil koordinat lokasi
- ✅ Menyimpan koordinat dan log keamanan ke database
- ❌ TIDAK melakukan validasi keamanan lokasi
- ❌ Presensi TIDAK akan ditolak karena masalah lokasi
- ❌ TIDAK menampilkan section "Status Lokasi" untuk presensi masuk
- ❌ TIDAK menampilkan section "Status Lokasi Pulang" untuk presensi pulang
- ❌ TIDAK menampilkan peringatan keamanan lokasi
- ✅ UI menjadi lebih sederhana dan fokus pada proses presensi

## 🔧 **UI yang Disembunyikan Saat Validasi Nonaktif:**

Saat `ENABLE_LOCATION_VALIDATION=false`, section-section berikut akan disembunyikan:

### 1. **Status Lokasi untuk Presensi Masuk**

```jsx
// Section ini TIDAK akan muncul saat validasi dinonaktifkan
{
	locationValidationEnabled && (
		<div className="mb-6">
			<div className="flex items-center gap-2 text-gray-600 mb-2">
				<MapPin className="w-5 h-5" />
				<span>Status Lokasi</span>
				// ... Status card, security warnings, dll
			</div>
		</div>
	);
}
```

### 2. **Status Lokasi untuk Presensi Pulang**

```jsx
// Section ini TIDAK akan muncul saat validasi dinonaktifkan
{
	locationValidationEnabled && (
		<div className="mb-6">
			<div className="flex items-center gap-2 text-gray-600 mb-2">
				<MapPin className="w-5 h-5" />
				<span>Status Lokasi Pulang</span>
				// ... Status card checkout, security warnings, dll
			</div>
		</div>
	);
}
```

### 3. **Komponen yang Tetap Tersembunyi**

- Security warnings dan confidence level
- Indikator memantau lokasi
- Status card dengan informasi keamanan
- Peringatan GPS spoofing atau accuracy rendah

## Implementasi Teknis

### Backend API (`/api/attendance/route.js`)

```javascript
// Fungsi validasi akan return isValid: true jika validasi disabled
const isLocationValidationEnabled =
	process.env.ENABLE_LOCATION_VALIDATION !== "false";

return {
	isValid: isLocationValidationEnabled ? riskLevel !== "HIGH" : true,
	// ... other properties
};
```

### Frontend (`/api/attendance/location-settings`)

```javascript
// Endpoint untuk mendapatkan status validasi
const isLocationValidationEnabled =
	process.env.ENABLE_LOCATION_VALIDATION !== "false";
```

### UI Components

- Komponen akan menampilkan atau menyembunyikan section lokasi berdasarkan status validasi
- **Jika validasi aktif**: Warna status hijau (aman) atau merah (bermasalah), dengan informasi keamanan
- **Jika validasi nonaktif**: Section status lokasi disembunyikan sepenuhnya
- Pesan yang disesuaikan dengan mode validasi

## Data yang Tetap Tersimpan

Meskipun validasi dinonaktifkan, data berikut tetap disimpan:

### 1. Tabel `geolocation_presensi`

- `latitude` - Koordinat lintang
- `longitude` - Koordinat bujur
- `tanggal` - Tanggal presensi

### 2. Tabel `security_logs`

- `confidence_level` - Level kepercayaan GPS
- `risk_level` - Level risiko (LOW/MEDIUM/HIGH)
- `warnings` - Peringatan keamanan (JSON)
- `gps_accuracy` - Akurasi GPS
- `latitude` & `longitude` - Koordinat

### 3. Tabel `temporary_presensi` & `rekap_presensi`

- Data presensi normal tetap tersimpan
- Koordinat lokasi tetap dicatat

## Use Case

### Kapan Menggunakan Validasi DIAKTIFKAN:

- Lingkungan kerja dengan lokasi tetap/terbatas
- Perlu kontrol ketat terhadap lokasi presensi
- Mencegah presensi dari lokasi yang tidak sah
- Keamanan tinggi diperlukan

### Kapan Menggunakan Validasi DINONAKTIFKAN:

- Pekerjaan mobile/lapangan
- Lokasi kerja bervariasi/tidak tetap
- Masalah GPS/sinyal di area kerja
- Prioritas pada kemudahan akses vs keamanan lokasi
- Testing/development environment

## Monitoring & Logging

Sistem tetap mencatat semua informasi lokasi dan keamanan dalam database, sehingga admin dapat:

- Menganalisis pola lokasi presensi
- Memantau potensi masalah GPS/lokasi
- Melakukan audit keamanan lokasi
- Mengaktifkan validasi di masa depan dengan data historis

## Restart Requirement

⚠️ **Perubahan environment variable memerlukan restart aplikasi** untuk dapat diterapkan.
