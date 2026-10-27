# Filter Jenis Pegawai pada Manajemen Pegawai — Design Spec

**Date:** 2026-10-27  
**Route:** `/dashboard/pegawai-manajemen`  
**Files Affected:**
- `src/app/api/pegawai-manajemen/route.js`
- `src/components/pegawai-manajemen/PegawaiDataSection.jsx`

---

## 1. Goal

Tambahkan filter berdasarkan kategori Jenis Pegawai sesuai pengelompokan pada KPI Card di halaman Manajemen Pegawai (`Pegawai Aktif / Semua Jenis`, `Pegawai POLRI`, `Pegawai PNS`, `Non-PNS & POLRI`), baik melalui **Dropdown Select** di bar filter maupun **klik langsung pada KPI Card** (sinkron dua arah).

---

## 2. Kategori Jenis Pegawai & Mapping Database

Mapping mengikuti logika agregasi `stats` yang sudah ada di `src/app/api/pegawai-manajemen/route.js`:

| Nilai Filter (`jenis_pegawai`) | Label UI | Kondisi SQL (`pegawai p`) |
| :--- | :--- | :--- |
| `all` (default) | Semua Jenis | Tidak ada filter tambahan |
| `POLRI` | Pegawai POLRI | `p.stts_kerja = 'POL'` |
| `PNS` | Pegawai PNS | `p.stts_kerja = 'PNS'` |
| `NON_PNS_POLRI` | Non-PNS & POLRI | `(p.stts_kerja NOT IN ('POL', 'PNS') OR p.stts_kerja IS NULL)` |

---

## 3. Perubahan Backend (`src/app/api/pegawai-manajemen/route.js`)

1. Ambil query parameter `jenis_pegawai` dari `searchParams`:
   ```js
   const jenis_pegawai = searchParams.get("jenis_pegawai") || "";
   ```
2. Tambahkan kondisi pada `whereClause` (berlaku untuk query `COUNT(*)` dan query data utama `SELECT p.*`):
   ```js
   if (jenis_pegawai === "POLRI") {
     whereClause += " AND p.stts_kerja = 'POL'";
   } else if (jenis_pegawai === "PNS") {
     whereClause += " AND p.stts_kerja = 'PNS'";
   } else if (jenis_pegawai === "NON_PNS_POLRI") {
     whereClause += " AND (p.stts_kerja NOT IN ('POL', 'PNS') OR p.stts_kerja IS NULL)";
   }
   ```
3. Query `stats` (`total_aktif`, `polri`, `pns`, `non_pns_polri`) **tidak** ikut difilter oleh `jenis_pegawai` agar angka pada keempat KPI card tetap menampilkan jumlah per kategori secara utuh saat filter dipilih.

---

## 4. Perubahan Frontend (`src/components/pegawai-manajemen/PegawaiDataSection.jsx`)

1. **State:**
   - Tambahkan `const [jenisPegawai, setJenisPegawai] = useState("all");`
   - Di `fetchPegawai`, jika `jenisPegawai && jenisPegawai !== "all"`, set `params.set("jenis_pegawai", jenisPegawai)`. Tambahkan `jenisPegawai` ke dependency array `useCallback`.
2. **Interaksi KPI Card:**
   - Seluruh 4 KPI card diberi `cursor-pointer` dan `onClick`:
     - **Card 1 (Pegawai Aktif):** set `jenisPegawai("all")`, `sttsAktif("AKTIF")`, `setPage(1)`. Aktif secara visual bila `jenisPegawai === "all" && sttsAktif === "AKTIF"`.
     - **Card 2 (Pegawai POLRI):** toggle `jenisPegawai` antara `"POLRI"` dan `"all"`, `setPage(1)`. Aktif secara visual bila `jenisPegawai === "POLRI"`.
     - **Card 3 (Pegawai PNS):** toggle `jenisPegawai` antara `"PNS"` dan `"all"`, `setPage(1)`. Aktif secara visual bila `jenisPegawai === "PNS"`.
     - **Card 4 (Non-PNS & POLRI):** toggle `jenisPegawai` antara `"NON_PNS_POLRI"` dan `"all"`, `setPage(1)`. Aktif secara visual bila `jenisPegawai === "NON_PNS_POLRI"`.
   - Indikator aktif menggunakan `ring-2` dan border berwarna sesuai aksen masing-masing kartu (emerald, blue, amber, purple).
3. **Dropdown Select di Bar Filter:**
   - Tambahkan komponen `<Select value={jenisPegawai} onValueChange={(v) => { setJenisPegawai(v); setPage(1); }}>` di bar filter sebelah filter Departemen & Status.
   - Opsi:
     - `all`: Semua Jenis
     - `POLRI`: Pegawai POLRI
     - `PNS`: Pegawai PNS
     - `NON_PNS_POLRI`: Non-PNS & POLRI

---

## 5. Verification Plan

1. Pilih masing-masing opsi pada Dropdown "Jenis Pegawai" → tabel me-refresh ke halaman 1, menampilkan baris sesuai kategori, dan KPI card terkait menyala (active ring).
2. Klik masing-masing KPI Card → nilai Dropdown "Jenis Pegawai" ikut berubah dan tabel terfilter sesuai kartu yang diklik. Klik ulang kartu yang sama me-reset filter ke `Semua Jenis`.
3. Kombinasikan dengan filter Departemen dan Search → data dan pagination (`total`, `totalPages`) terhitung akurat.
