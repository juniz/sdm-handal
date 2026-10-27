# Tampilkan Mulai Kontrak pada Tabel Data Pegawai — Design Spec

**Date:** 2026-10-27  
**Route:** `/dashboard/pegawai-manajemen`  
**File:** `src/components/pegawai-manajemen/PegawaiDataSection.jsx`

---

## 1. Goal

Tampilkan kolom `mulai_kontrak` dari tabel database `pegawai` pada tabel daftar pegawai di `/dashboard/pegawai-manajemen`, baik pada tampilan desktop table maupun mobile card.

---

## 2. Data Source

Field `mulai_kontrak` sudah terbawa di endpoint `GET /api/pegawai-manajemen` lewat klausa `SELECT p.*`. Tidak ada perubahan backend API.

---

## 3. UI Changes (`PegawaiDataSection.jsx`)

1. **Date Formatter Helper:**
   ```js
   const formatDateIndo = (dateStr) => {
     if (!dateStr || dateStr.startsWith("0000-00-00")) return "-";
     const d = new Date(dateStr);
     if (isNaN(d.getTime())) return "-";
     return d.toLocaleDateString("id-ID", {
       day: "numeric",
       month: "short",
       year: "numeric",
     });
   };
   ```

2. **Desktop View (Table):**
   - Sisipkan `<TableHead>Mulai Kontrak</TableHead>` di antara `<TableHead>Status Kerja</TableHead>` dan `<TableHead>Status</TableHead>`.
   - Sisipkan `<TableCell className="whitespace-nowrap text-slate-600 text-sm">{formatDateIndo(p.mulai_kontrak)}</TableCell>` di posisi bersesuaian pada setiap baris data.

3. **Mobile View (Cards):**
   - Tambahkan item grid pada section info pegawai mobile:
     ```jsx
     <div className="col-span-2 sm:col-span-1">
       <div className="text-xs text-gray-500 mb-0.5">Mulai Kontrak</div>
       <div className="font-medium">{formatDateIndo(p.mulai_kontrak)}</div>
     </div>
     ```

---

## 4. Verification

1. Muat halaman `/dashboard/pegawai-manajemen`.
2. Verifikasi kolom `Mulai Kontrak` muncul di desktop table sebelum kolom `Status`.
3. Cek pegawai dengan nilai kontrak terisi (mis. `12 Jan 2024`) dan nilai kosong/null/`0000-00-00` (tampil `-`).
4. Verifikasi tampilan mobile kartu menampilkan field `Mulai Kontrak`.
