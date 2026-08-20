# Watermark Geolocation GPS Camera pada Foto Presensi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan watermark geolocation ala GPS Camera pada foto presensi masuk pegawai secara permanen ke dalam canvas gambar sebelum diunggah ke server.

**Architecture:**
- Utility `geoHelper.js` melakukan *reverse geocoding* koordinat (latitude, longitude) ke alamat teks dengan timeout 2 detik.
- Utility `imageOptimizer.js` menyediakan fungsi `stampGpsWatermark` berbasis HTML5 Canvas untuk menggambar banner semi-transparan berisi nama pegawai, NIK, alamat, koordinat GPS, akurasi, dan waktu presensi.
- Komponen `AttendanceCamera.jsx` mengintegrasikan proses stamping pada saat `capturePhoto(metadata)` dipanggil.
- Halaman `src/app/dashboard/attendance/page.js` mengumpulkan data user dan koordinat lokasi lalu menyalurkannya ke camera capture.

**Tech Stack:** React, Next.js, HTML5 Canvas API, Moment.js, JavaScript.

## Global Constraints

- Sesuai dengan spesifikasi `docs/superpowers/specs/2026-08-20-watermark-gps-camera-absensi-design.md`.
- Tanpa nama rumah sakit pada watermark.
- Proses reverse geocoding tidak boleh memblokir atau menggagalkan presensi jika terjadi timeout / offline.
- Watermark harus tercetak permanen pada gambar JPEG hasil capture.

---

### Task 1: Create Reverse Geocoding Utility (`src/utils/geoHelper.js`)

**Files:**
- Create: `src/utils/geoHelper.js`

**Interfaces:**
- Produces: `async function getReverseGeocode(latitude, longitude): Promise<string>`

- [ ] **Step 1: Write `src/utils/geoHelper.js`**

Implementasikan fungsi `getReverseGeocode(latitude, longitude)`:
```javascript
export async function getReverseGeocode(latitude, longitude) {
	if (!latitude || !longitude) return "";
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2000);

		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
		const response = await fetch(url, {
			signal: controller.signal,
			headers: { "Accept": "application/json" }
		});
		clearTimeout(timeoutId);

		if (!response.ok) return "";
		const data = await response.json();
		
		if (data && data.address) {
			const addr = data.address;
			const parts = [
				addr.road || addr.street || addr.pedestrian || addr.building,
				addr.village || addr.suburb || addr.neighbourhood,
				addr.city_district || addr.district || addr.subdistrict,
				addr.city || addr.town || addr.county || addr.state
			].filter(Boolean);

			return parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "";
		}

		return "";
	} catch (error) {
		console.warn("Reverse geocode error / timeout:", error);
		return "";
	}
}
```

- [ ] **Step 2: Commit Task 1**
```bash
git add src/utils/geoHelper.js
git commit -m "feat(attendance): add reverse geocoding utility"
```

---

### Task 2: Add GPS Watermark Stamping in `src/utils/imageOptimizer.js`

**Files:**
- Modify: `src/utils/imageOptimizer.js`

**Interfaces:**
- Produces: `async function stampGpsWatermark(dataUrl, metadata): Promise<string>`

- [ ] **Step 1: Implement `stampGpsWatermark` in `src/utils/imageOptimizer.js`**

Fungsi menerima `dataUrl` dan `metadata: { userName, nik, latitude, longitude, accuracy, timestamp, address }`:
- Buat Canvas dengan dimensi citra asli.
- Gambar foto kamera ke Canvas.
- Hitung tinggi banner bawah (~22-26% tinggi foto, min 90px).
- Gambar banner hitam bergradasi transparan (`rgba(0,0,0,0.78)`).
- Render baris teks dengan drop shadow:
  - Baris 1: `👤 ${userName || 'Pegawai'} ${nik ? `(NIK: ${nik})` : ''}` (Font bold, warna putih)
  - Baris 2: `📍 ${address || `Koordinat: ${latitude}, ${longitude}`}` (Font regular, warna putih)
  - Baris 3: `🌐 Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}${accuracy ? ` (±${Math.round(accuracy)}m)` : ''}` (Font semibold, warna cyan `#38BDF8`)
  - Baris 4: `🕒 ${formattedTimestamp || moment().format('dddd, DD MMMM YYYY, HH:mm:ss')} WIB` (Font regular, warna kuning muda `#FEF08A`)
- Kembalikan JPEG data URL.

- [ ] **Step 2: Commit Task 2**
```bash
git add src/utils/imageOptimizer.js
git commit -m "feat(attendance): add canvas watermark stamping for gps camera"
```

---

### Task 3: Update `src/components/AttendanceCamera.jsx` to Support Watermark

**Files:**
- Modify: `src/components/AttendanceCamera.jsx`

**Interfaces:**
- Consumes: `stampGpsWatermark` from `@/utils/imageOptimizer`
- Produces: `capturePhoto(metadata)` which stamps watermark onto photo before optimizing.

- [ ] **Step 1: Update `capturePhoto` in `AttendanceCamera.jsx`**

- Terima parameter `metadata` di `capturePhoto(metadata)`.
- Sebelum `optimizePhoto(imageSrc)`, panggil `stampGpsWatermark(imageSrc, metadata)` jika metadata lokasi/user tersedia.
- Teruskan hasil gambar ber-watermark ke `optimizePhoto`.

- [ ] **Step 2: Commit Task 3**
```bash
git add src/components/AttendanceCamera.jsx
git commit -m "feat(attendance): integrate gps watermark in AttendanceCamera"
```

---

### Task 4: Update `src/app/dashboard/attendance/page.js` to Supply Watermark Data

**Files:**
- Modify: `src/app/dashboard/attendance/page.js`

**Interfaces:**
- Consumes: `getReverseGeocode` from `@/utils/geoHelper`
- Produces: Call `cameraRef.current.capturePhoto(watermarkMetadata)` during check-in.

- [ ] **Step 1: Update `AttendancePage`**

- Ambil data user (`currentUser`: `nama`, `nik`) saat inisialisasi `/api/auth/user`.
- Saat `handleCheckIn`:
  - Dapatkan koordinat `lat`, `lng`, `acc`.
  - Panggil `getReverseGeocode(lat, lng)`.
  - Susun objek metadata:
    ```javascript
    const watermarkMetadata = {
        userName: currentUser?.nama || "",
        nik: currentUser?.nik || "",
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        timestamp: momentInstance.format("dddd, DD MMMM YYYY, HH:mm:ss"),
        address: reverseAddress
    };
    ```
  - Panggil `cameraRef.current?.capturePhoto(watermarkMetadata)`.

- [ ] **Step 2: Commit Task 4**
```bash
git add src/app/dashboard/attendance/page.js
git commit -m "feat(attendance): pass location & user metadata for photo watermark"
```

---

### Task 5: Build Verification & End-to-End Test

**Files:**
- Test across frontend

- [ ] **Step 1: Run `npm run build` in sdm repository**
```bash
npm run build
```
Verify build compiles with 0 errors.

- [ ] **Step 2: Commit final changes if any**
