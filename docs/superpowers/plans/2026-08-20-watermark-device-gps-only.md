# Strictly Use Device GPS Coordinates on Attendance Watermark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memastikan koordinat `Lat` dan `Long` pada watermark foto presensi selalu murni dari GPS perangkat pegawai dan tidak pernah menggunakan koordinat kantor dari environment variable.

**Architecture:**
- `src/app/dashboard/attendance/page.js`: Memastikan `getRobustLocation` hanya mengembalikan koordinat aktual dari sensor GPS perangkat dan menghapus fallback ke `NEXT_PUBLIC_OFFICE_LAT`/`LNG`.

---

### Task 1: Enforce Strict Device GPS Coordinates in `src/app/dashboard/attendance/page.js`

**Files:**
- Modify: `src/app/dashboard/attendance/page.js`

- [ ] **Step 1: Update `getRobustLocation` in `src/app/dashboard/attendance/page.js`**

Hapus fallback ke `NEXT_PUBLIC_OFFICE_LAT`/`LNG`:
```javascript
		// Attempt 1: High accuracy GPS with 8s timeout
		try {
			const pos = await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 8000,
					maximumAge: 10000,
				});
			});
			return {
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
				accuracy: pos.coords.accuracy,
			};
		} catch (err1) {
			console.warn("High accuracy GPS failed, falling back to standard accuracy:", err1);
			// Attempt 2: Standard accuracy GPS / WiFi triangulation with 10s timeout
			try {
				const pos = await new Promise((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: false,
						timeout: 10000,
						maximumAge: 60000,
					});
				});
				return {
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					accuracy: pos.coords.accuracy,
				};
			} catch (err2) {
				console.error("Standard accuracy GPS also failed:", err2);
				throw new Error(
					err2?.code === 1
						? "Izin akses lokasi ditolak. Silakan aktifkan izin lokasi di browser."
						: err2?.code === 3
						? "Waktu pencarian sinyal GPS habis. Pastikan GPS aktif atau coba di tempat terbuka."
						: "Gagal mendapatkan koordinat GPS perangkat. Pastikan GPS aktif."
				);
			}
		}
```

- [ ] **Step 2: Commit Task 1**
```bash
git add src/app/dashboard/attendance/page.js
git commit -m "fix(attendance): strictly use physical device GPS coordinates on watermark and remove office env fallback"
```

---

### Task 2: Build Verification & End-to-End Test

- [ ] **Step 1: Run `npm run build`**
```bash
npm run build
```
Verify 0 errors.
