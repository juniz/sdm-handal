# Task 5 Report: Banner & Lock Read-Only di Halaman Input Pegawai

**Status:** DONE  
**Completed At:** 2026-09-01  
**Target Path:** `src/app/dashboard/penilaian-kinerja/input/page.js`

---

## 1. Summary of Changes

Updated employee daily performance input page (`/dashboard/penilaian-kinerja/input`) to detect leave (cuti / sakit), lock form into read-only state with 100% scores, auto-submit/approve if needed, and display emerald verified leave banner.

### Key Modifications:
1. **Leave Detection (`isCutiPegawai`)**:
   - Checks `attendanceInfo?.sumber === "cuti" || harianRecord?.sumber_absensi === "cuti" || attendanceInfo?.nilai_kondisi.startsWith("cuti_") || attendanceInfo?.nilai_kondisi === "sakit"`.
2. **Unified Bypass Logic (`isBypassedLeaveOrDuty`)**:
   - Combined `isDinasLuarKota` and `isCutiPegawai`.
   - Forces `estSkorKegiatan = 100`, `estSkorAbsensi = 100`, `estSkorTotal = 100`.
   - Locks `isReadOnly = true` when active.
3. **Auto-Submit & Auto-Create on Load (`loadDailyData`)**:
   - When attendance status is leave / cuti and evaluation is `draft`, triggers auto-submit/approval via `POST /api/penilaian/harian/${id}`.
   - When no record exists yet and attendance is leave / cuti, triggers auto-create via `POST /api/penilaian/harian`.
4. **Emerald Leave Banner**:
   - Displays "Cuti Pegawai Terverifikasi" with `Auto-Approved 100%` badge and descriptive notice.
5. **Context-Aware CTA & Read-Only Notice**:
   - Informs employee that daily score is auto-approved by system via leave bypass, eliminating presensi & activity submission requirement.

---

## 2. Verification & Tests

- Executed unit verification test script simulating leave conditions (cuti tahunan, sakit), duty bypass, and normal work days.
- Verified estimated score calculation (100% vs weighted), `isReadOnly` lock, and banner conditions.
- Validated JS syntax with `node -c`.
- Ran regression test suite `scripts/test-deteksi-cuti.js` (all passed).

---

## 3. Files Modified
- `src/app/dashboard/penilaian-kinerja/input/page.js`
