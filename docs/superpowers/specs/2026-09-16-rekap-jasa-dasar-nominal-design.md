# Design Spec: Koreksi Periode Overlap Nominal Jasa Dasar di Rekap Kinerja Bulanan

**Tanggal:** 16 September 2026  
**Status:** Draft / In Review  
**Target:** NestJS Backend (`website/backend`) + Rekap Kinerja SDM  

---

## 1. Masalah & Latar Belakang
Saat petugas keuangan membuka menu Rekap Penilaian Kinerja Bulanan (`/dashboard/penilaian-kinerja/rekap`) pada bulan tertentu (misal: September), data nominal jasa dasar yang diinput hanya untuk bulan sebelumnya (misal: Agustus) tetap muncul. Hal ini membingungkan petugas karena nominal Agustus terbawa ke bulan September.

### Penyebab Utama
Pada `website/backend/src/sdm/repositories/rekap-bulanan.repository.ts`, subquery nominal jasa dasar hanya mengevaluasi tanggal mulai dengan patokan tanggal 28 (`dateStr = YYYY-MM-28`):
```sql
SELECT jdp.nominal_jasa_dasar 
FROM jasa_dasar_pegawai jdp
WHERE jdp.pegawai_id = p.id AND jdp.berlaku_mulai <= ?
ORDER BY jdp.berlaku_mulai DESC
LIMIT 1
```
Query ini sama sekali tidak memeriksa kolom `berlaku_sampai`. Akibatnya, record yang memiliki `berlaku_sampai` di akhir Agustus (atau sebelum September) tetap lolos karena `berlaku_mulai <= '2026-09-28'`.

---

## 2. Solusi & Desain Teknis

### 2.1 Logika Overlap Rentang Periode
Record `jasa_dasar_pegawai` dianggap valid dan aktif untuk suatu bulan/tahun rekap jika dan hanya jika:
1. `berlaku_mulai <= tanggal_akhir_bulan`
2. `(berlaku_sampai IS NULL OR berlaku_sampai >= tanggal_awal_bulan)`

Dengan aturan ini:
- Jasa dasar yang berlaku 1 Agustus s.d. 31 Agustus:
  - Rekap Agustus (1–31 Agustus): `2026-08-01 <= 2026-08-31` AND `2026-08-31 >= 2026-08-01` $\rightarrow$ **Muncul**.
  - Rekap September (1–30 September): `2026-08-01 <= 2026-09-30` AND `2026-08-31 >= 2026-09-01` $\rightarrow$ **FALSE (Tidak muncul / Rp 0)**.
- Jasa dasar yang `berlaku_sampai` bernilai `NULL`: Tetap berlanjut ke bulan-bulan berikutnya sesuai konsep open-ended validity.

### 2.2 Perubahan Kode Backend

#### File: `website/backend/src/sdm/rekap-bulanan.service.ts`
Menghitung batas awal (`startDate`) dan batas akhir (`endDate`) bulan secara akurat:
```ts
const formattedBulan = String(bulan).padStart(2, '0');
const formattedTahun = String(tahun);
const startDate = `${formattedTahun}-${formattedBulan}-01`;
const lastDay = new Date(tahun, bulan, 0).getDate();
const endDate = `${formattedTahun}-${formattedBulan}-${String(lastDay).padStart(2, '0')}`;
```
Memperbarui pemanggilan repository dengan parameter `startDate` dan `endDate`.

#### File: `website/backend/src/sdm/repositories/rekap-bulanan.repository.ts`
Memperbarui method `getRekapBulananList`:
- Parameter menerima `startDate: string` dan `endDate: string` (menggantikan `dateStr`).
- Subquery SQL diperbarui:
```sql
-- base incentive
(
  SELECT jdp.nominal_jasa_dasar 
  FROM jasa_dasar_pegawai jdp
  WHERE jdp.pegawai_id = p.id 
    AND jdp.berlaku_mulai <= ?
    AND (jdp.berlaku_sampai IS NULL OR jdp.berlaku_sampai >= ?)
  ORDER BY jdp.berlaku_mulai DESC, jdp.id DESC
  LIMIT 1
) AS nominal_jasa_dasar
```
- Parameter binding:
  - Param 7 (`berlaku_mulai <= ?`): `endDate`
  - Param 8 (`berlaku_sampai >= ?`): `startDate`
  - Sisanya tetap sesuai urutan query sebelumnya.

---

## 3. Dampak terhadap Rekap & Perhitungan
- **Draft Rekap**: Saat rekap bulanan ditampilkan dalam status draft, nominal jasa dasar otomatis terhitung dengan nominal yang memenuhi aturan overlap. Jika tidak ada yang memenuhi syarat, nominal menjadi Rp 0.
- **Pengurang Jasa**: Terhitung otomatis mengikuti nominal jasa dasar periode tersebut: `(gapHari / totalHariJadwal) * nominalJasaDasar`.
- **Rekap Final (Locked)**: Data yang telah berstatus `final` tetap menyimpan nilai snapshot historis yang terkunci di tabel `rekap_bulanan`. Jika di-unlock, maka akan kembali mengevaluasi aturan overlap terkini.

---

## 4. Rencana Pengujian
1. Verifikasi query dengan script/unit test.
2. Verifikasi kasus data:
   - Record dengan `berlaku_mulai = '2026-08-01'` dan `berlaku_sampai = '2026-08-31'`:
     - Buka rekap Agustus 2026: nominal muncul.
     - Buka rekap September 2026: nominal Rp 0.
   - Record dengan `berlaku_sampai = NULL`:
     - Muncul di Agustus dan September.
