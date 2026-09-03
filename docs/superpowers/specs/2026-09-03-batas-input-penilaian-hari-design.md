# Design Spec: Batas Input Penilaian Kinerja Dinamis Lewat Environment Variable

## 1. Overview
Sebelumnya, batas keterlambatan pengisian penilaian kinerja harian bersifat boolean (hanya 1x24 jam) melalui env `NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT`.
Perubahan ini memungkinkan fleksibilitas pengaturan batas waktu input penilaian dalam jumlah hari ($N$ hari) melalui environment variable `NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS`.

---

## 2. Configuration & Helpers (`src/lib/penilaian-config.js`)

### Environment Variables
- `NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS`: Integer jumlah hari batas input penilaian kinerja (misal `1`, `2`, `3`, `7`).
- `NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT`: Legacy boolean (`"true"` / `"1"`). Tetap didukung untuk backward compatibility sebagai fallback setara `1` hari.

### Helper Exports
```javascript
export function getPenilaianInputLimitDays() {
	const daysEnv = process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS;
	if (daysEnv !== undefined && daysEnv !== null && daysEnv.trim() !== "") {
		const parsed = parseInt(daysEnv, 10);
		if (!isNaN(parsed) && parsed > 0) {
			return parsed;
		}
		if (parsed === 0) {
			return 0; // Disabled
		}
	}

	// Backward compatibility fallback
	const legacyVal = process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;
	if (legacyVal === "true" || legacyVal === "1") {
		return 1;
	}

	return 0; // Disabled by default if unset
}

export function isPenilaianLimitEnabled() {
	return getPenilaianInputLimitDays() > 0;
}

export function is24hLimitEnabled() {
	return isPenilaianLimitEnabled();
}
```

---

## 3. Deadline Calculation Logic

### Batas Pegawai (Input & Submit)
Untuk tanggal evaluasi $T$:
- **Shift Normal / Siang**:
  $$\text{Deadline} = \text{moment}(T).\text{add}(\text{limitDays}, \text{'days'}).\text{endOf}('day')$$
- **Shift Malam** (*jam pulang < jam masuk*):
  $$\text{Deadline} = \text{moment}(T).\text{add}(\text{limitDays} + 1, \text{'days'}).\text{endOf}('day')$$

### Batas Supervisor (Approval)
- Supervisor memiliki batas persetujuan:
  $$\text{Deadline Approval} = \text{moment}(T).\text{add}(\text{limitDays} + 1, \text{'days'}).\text{endOf}('day')$$

---

## 4. Components & Endpoints to Update

### A. Frontend Input Page (`src/app/dashboard/penilaian-kinerja/input/page.js`)
- Gunakan `getPenilaianInputLimitDays()` dan `isPenilaianLimitEnabled()`.
- Update fungsi `checkIsDeadlinePassed()`.
- Update teks warning banner dan teks notice saat form terkunci menjadi:
  `Batas pengisian telah lewat (> ${limitDays} hari dari tanggal kerja). Laporan tanggal ... tidak dapat diubah atau dikirim.`

### B. Frontend Approval Page (`src/app/dashboard/penilaian-kinerja/approval/page.js`)
- Update `isApprovalDeadlinePassed()` menggunakan `getPenilaianInputLimitDays()`.
- Update teks warning banner dan badge keterangan:
  `Batas waktu persetujuan supervisor telah lewat (> ${limitDays} hari dari tanggal kerja)...`

### C. Backend API Routes
1. **`src/app/api/penilaian/harian/route.js` (POST)**:
   - Evaluasi batas menggunakan `getPenilaianInputLimitDays()`.
   - Error response saat lewat:
     `Batas pengisian telah lewat (> ${limitDays} hari). Penilaian tanggal ... tidak dapat dibuat.`
2. **`src/app/api/penilaian/harian/[id]/route.js` (PUT, POST submit, POST approve)**:
   - Helper `checkDeadlinePassed(pegawaiId, tanggal)` membaca `getPenilaianInputLimitDays()`.
   - Error message pada PUT, POST `submit`, dan POST `approve` disesuaikan dinamis.

---

## 5. Verification Plan
1. **Unit / Logic Verification**:
   - Uji saat `NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS=3`:
     - Tanggal H-2 shift normal: lolos (masih dalam batas).
     - Tanggal H-4 shift normal: diblokir.
     - Tanggal H-3 shift malam: lolos.
   - Uji saat `NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS=0` atau unset: tidak ada pemblokiran tanggal lampau.
   - Uji legacy env `NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT=true`: batas tetap 1 hari.
2. **Lint & Build**:
   - Jalankan build / validation check untuk memastikan tidak ada syntax / runtime error.
