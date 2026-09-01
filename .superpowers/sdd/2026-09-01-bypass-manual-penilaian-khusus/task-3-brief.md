# Task 3 Brief: Frontend Client & Tab UI di Halaman Deteksi Cuti

## Objective
Tambahkan helper `executeBypassManualGql` di `src/lib/deteksi-cuti-gql-client.js` dan implementasikan tab navigation beserta form Bypass Khusus Pegawai di `src/app/dashboard/it/deteksi-cuti/page.js`.

## Target Workspace
`/Users/hardiko/Documents/Developer/NEXT/sdm`

## Target Files
- Modify: `src/lib/deteksi-cuti-gql-client.js`
- Modify: `src/app/dashboard/it/deteksi-cuti/page.js`

## Detailed Specifications

### 1. `src/lib/deteksi-cuti-gql-client.js`
Tambahkan:
```javascript
export async function executeBypassManualGql(input = {}) {
  const mutation = `
    mutation BypassManualPegawai($input: BypassManualPegawaiInput!) {
      bypassManualPegawai(input: $input) {
        success
        message
        processedCount
        processedDates
      }
    }
  `;

  const data = await gql(mutation, { input });
  return data.bypassManualPegawai;
}
```

### 2. `src/app/dashboard/it/deteksi-cuti/page.js`
- Tambahkan active tab state:
  ```javascript
  const [activeTab, setActiveTab] = useState("deteksi"); // "deteksi" | "manual"
  ```
- Tambahkan tab switcher di bagian atas (Header):
  - Tab 1: **Deteksi Cuti Terjadwal** (Icon `Calendar` / `ShieldCheck`)
  - Tab 2: **Bypass Khusus Pegawai** (Icon `UserCheck` / `Zap`)
  - Style dengan Brand Cyan `sky-600` / `sky-50` / `dark:bg-sky-950/60` per `DESIGN.md`.
- Di dalam Tab 2 ("Bypass Khusus Pegawai"):
  - Muat list pegawai dari `GET /api/pegawai` saat tab dibuka atau saat komponen mount.
  - State form manual:
    - `manualPegawaiId`: integer/string
    - `manualTanggalAwal`: string `YYYY-MM-DD` (default hari ini)
    - `manualTanggalAkhir`: string `YYYY-MM-DD` (default hari ini)
    - `manualShift`: string (`AUTO`, `Pagi`, `Siang`, `Malam`, `Non-Shift`)
    - `manualAlasan`: string (text)
  - Fitur Search Pegawai: text input filter atau select dropdown berisi `[NIK] Nama Pegawai - Departemen`.
  - Info Card: Penjelasan bahwa bypass manual akan langsung menetapkan nilai absensi (100) dan kegiatan (100) status Disetujui (Approved) untuk rentang tanggal yang dipilih tanpa memerlukan data cuti/izin.
  - Tombol Submit: "Proses Bypass Manual (100%)", touch target min 44px, disabled saat form belum lengkap atau `isProcessing`.
  - Konfirmasi Modal 2-step sebelum eksekusi mutation `executeBypassManualGql`.
  - Toasts: `toast.loading`, `toast.success`, `toast.error` via sonner.
- Tab 1 ("Deteksi Cuti Terjadwal") tetap berfungsi penuh seperti sebelumnya.

## Verification
- Run: `npm run build` di `/Users/hardiko/Documents/Developer/NEXT/sdm`.
- Verify: Exit code 0.

## Git Commit
`feat(ui): add manual employee bypass tab and execution form`
