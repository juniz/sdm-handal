# Design Spec: Otomasi Bypass Penilaian Harian Cuti & Izin via Cron Job

## 1. Objective
Mengotomatiskan proses bypass penilaian kinerja harian (100% skor, status approved) untuk pegawai yang memiliki `pengajuan_cuti` dan `pengajuan_izin` yang disetujui (selain `Dinas Dalam Kota`) secara terjadwal di server backend NestJS, tanpa mengharuskan pegawai membuka `/dashboard/penilaian-kinerja/input` maupun admin membuka `/dashboard/it/deteksi-cuti`.

---

## 2. Architecture & Service Design

### A. New Service: `AutoBypassCutiIzinCronService`
- **Location**: `website/backend/src/sdm/auto-bypass-cron.service.ts`
- **Module**: Terdaftar di `SdmModule` (`website/backend/src/sdm/sdm.module.ts`) sebagai provider.
- **Dependencies**:
  - `DeteksiCutiRepository`: untuk mendeteksi cuti/izin (`findDetectedLeaves`) dan mengeksekusi bypass (`executeBypassTransaction`).
  - `CronMonitorService`: untuk pendaftaran metadata cron dan tracking monitoring job.

### B. Schedule & Timing
- **Cron Expression**: `0 15 0 * * *` (00:15 WIB setiap hari).
- **Timezone**: `Asia/Jakarta`.
- **Scan Window**:
  - `startDate`: `moment().subtract(3, 'days').format('YYYY-MM-DD')` (H-3 untuk menangani izin/cuti yang disetujui mundur).
  - `endDate`: `moment().add(1, 'days').format('YYYY-MM-DD')` (H+1 untuk pre-populate jadwal hari esok).

### C. Execution Logic
1. Hitung `startDate` dan `endDate`.
2. Panggil `deteksiCutiRepository.findDetectedLeaves({ startDate, endDate, statusFilter: 'perlu_bypass' })`.
3. Filter item yang memiliki `status_bypass === 'perlu_bypass'`.
4. Jika ditemukan:
   - Format item ke `BypassCutiItemInput[]`:
     - `pegawai_id`, `nik`, `tanggal`, `shift`, `urgensi`, `jenis_dispensasi`, `no_pengajuan`.
   - Eksekusi `deteksiCutiRepository.executeBypassTransaction(itemsToBypass)`.
   - Log hasil ke NestJS `Logger` dan `CronMonitorService`.
5. Jika tidak ditemukan: log informasi tidak ada cuti/izin yang perlu dibypass.

---

## 3. Verification Plan

### Automated Tests
- Unit test di `website/backend`:
  ```bash
  npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/auto-bypass-cron.service.spec.ts
  ```
- Build check backend:
  ```bash
  npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend run build
  ```

### Manual Verification
- Panggil method `processAutoBypass()` untuk memverifikasi eksekusi bypass otomatis berjalan dan mencatat log dengan benar.
