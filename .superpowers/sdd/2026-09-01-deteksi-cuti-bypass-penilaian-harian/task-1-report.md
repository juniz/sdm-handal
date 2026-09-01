# Task 1 Implementation Report: Backend Endpoint API Deteksi Cuti

## Summary
- **Endpoint**: `src/app/api/it/deteksi-cuti/route.js`
- **Methods**: `GET`, `POST`
- **Access Control**: JWT cookie verification + Department whitelist (`IT`, `SDM`, `HRD`, `SPI`)
- **Status**: Completed & Verified

---

## 1. Implementation Details

### 1.1 Authentication & Authorization
- Validates JWT cookie `auth_token` using `jose.jwtVerify`.
- Queries employee record in `pegawai` and `departemen`.
- Enforces strict department access: user department must match or contain `IT`, `SDM`, `HRD`, or `SPI`.

### 1.2 `mapCutiToKondisi` Mapping
Maps leave urgency (`urgensi`) to parameter scoring condition (`nilai_kondisi`):
- `Sakit` -> `sakit`
- `Tahunan` -> `cuti_tahunan`
- `Melahirkan` -> `cuti_melahirkan`
- `Ibadah Keagamaan` -> `cuti_ibadah`
- `Istimewa` -> `cuti_istimewa`
- `Karena Alasan Penting` -> `cuti_penting`
- `Di luar tanggungan negara` -> `cuti_luar_tanggungan`
- `Tahunan ke luar negeri` -> `cuti_luar_negeri`
- Default / Other -> `cuti_lainnya`

### 1.3 GET Handler (`/api/it/deteksi-cuti`)
- **Query Parameters**:
  - `tanggal_awal` (default: start of current month)
  - `tanggal_akhir` (default: end of current month)
  - `departemen` (optional filter, default: `ALL`)
  - `search` (optional filter for employee name, NIK, or leave request number)
  - `status_filter` (optional: `ALL`, `belum_dibuat`, `perlu_bypass`, `approved_100`)
- **Batch Processing & Query Optimization**:
  - Fetches approved `pengajuan_cuti` overlapping `[tanggal_awal, tanggal_akhir]`.
  - Batch queries `jadwal_pegawai` and `jadwal_tambahan` for all relevant employees.
  - Batch queries `penilaian_harian` for the date window to avoid N+1 queries.
- **Date & Shift Expansion**:
  - Iterates every date in leave range overlap `[MAX(pc.tanggal_awal, start), MIN(pc.tanggal_akhir, end)]`.
  - Inspects `h{d}` shift on regular schedule, falling back to additional schedule.
  - Correctly skips non-working days (`shift` empty, `OFF`, or `Libur`).
  - Evaluates daily evaluation state:
    - No record -> `belum_dibuat`
    - Record exists with `status === 'approved'`, `skor_total === 100`, `sumber_absensi === 'cuti'` -> `approved_100`
    - Record exists with draft/revisi/submitted or non-cuti status -> `perlu_bypass`
- **Output Schema**:
  ```json
  {
    "success": true,
    "summary": {
      "total_cuti_shift": 3,
      "approved_100": 1,
      "perlu_bypass": 2
    },
    "data": [
      {
        "pegawai_id": 101,
        "pegawai_nama": "Dr. Budi",
        "nik": "NIK101",
        "departemen": "DEP01",
        "departemen_nama": "Rawat Inap",
        "no_pengajuan": "CUTI/2026/001",
        "urgensi": "Tahunan",
        "nilai_kondisi": "cuti_tahunan",
        "tanggal": "2026-09-01",
        "shift": "Pagi",
        "status_bypass": "belum_dibuat",
        "penilaian_id": null,
        "penilaian_status": null,
        "skor_total": null,
        "sumber_absensi": null,
        "ref_cuti_no": null
      }
    ]
  }
  ```

### 1.4 POST Handler (`/api/it/deteksi-cuti`)
- **Payload**: `{ items: [ { pegawai_id, tanggal, no_pengajuan, urgensi, shift } ] }`
- **Execution**:
  - Validates `items` array.
  - If `penilaian_harian` does not exist: inserts approved record with 100% score (`skor_kegiatan = 100`, `skor_absensi = 100`, `skor_total = 100`, `status = 'approved'`, `sumber_absensi = 'cuti'`, `approved_by = loggedInUser.id`) and creates default `kegiatan_harian` item.
  - If `penilaian_harian` exists: updates record to 100% approved status with leave condition metadata and ensures at least 1 `kegiatan_harian` entry exists.
- **Output Schema**:
  ```json
  {
    "success": true,
    "message": "Berhasil memproses 5 data cuti menjadi Disetujui (100%)",
    "processed_count": 5
  }
  ```

---

## 2. Verification & Testing

- **Unit / Logic Tests**: Ran `scripts/test-deteksi-cuti.js`.
  - Tested all 9 `mapCutiToKondisi` cases -> 100% pass.
  - Tested schedule shift check with `Pagi`, `Siang`, `OFF`, `Malam`, `LIBUR` -> correctly identified 3 working shifts and skipped 2 non-working days.
  - Tested status determination (`belum_dibuat`, `perlu_bypass`, `approved_100`) -> verified exact match.
  - Syntax check `node --check src/app/api/it/deteksi-cuti/route.js` -> 0 errors.

---

## 3. Git Commit
- **Commit Message**: `feat(api): add endpoint for leave detection and daily evaluation bypass`
