# Design Document: Sinkronisasi Jasa Rekap Kinerja ke Tanda Tangan Gaji

**Tanggal**: 2026-11-03  
**Status**: Approved  
**Scope**: 
- Backend NestJS: `website/backend/src/sdm/repositories/rekap-bulanan.repository.ts` & `website/backend/src/sdm/rekap-bulanan.service.ts`
- Frontend Next.js: `sdm/src/app/dashboard/tanda-tangan-gaji/` & `sdm/src/app/dashboard/penilaian-kinerja/rekap/`

---

## 1. Overview & Latar Belakang
Menu `/dashboard/tanda-tangan-gaji` memiliki tab **Jasa Pelayanan** untuk pengesahan digital tanda tangan insentif bulanan pegawai (`gaji_pegawai` dengan `jenis = 'Jasa'`).
Perhitungan insentif kinerja (`nominal_jasa_final`) dilakukan dan dikunci di menu `/dashboard/penilaian-kinerja/rekap` (`rekap_bulanan`).

Desain ini menghubungkan kedua menu:
1. Saat admin mengunci (Lock / Bulk Lock) rekap bulanan, data `nominal_jasa_final` otomatis disinkronkan ke tabel `gaji_pegawai` (`jenis = 'Jasa'`), sehingga langsung tersedia di tab *Jasa Pelayanan* `/dashboard/tanda-tangan-gaji`.
2. Saat admin membuka kunci (Unlock / Bulk Unlock), sistem memverifikasi apakah pegawai sudah menandatangani slip jasa tersebut. Jika sudah ada tanda tangan di `gaji_validasi`, permintaan buka kunci ditolak demi integritas dokumen legal. Jika belum ditandatangani, data `gaji_pegawai` (`jenis = 'Jasa'`) dihapus dan status rekap dikembalikan ke draf.

---

## 2. Arsitektur & Sinkronisasi Database

### 2.1. Alur Kunci Rekap (`lockRekapBulanan` / `lockManyRekapBulanan`)
Lokasi: `website/backend/src/sdm/repositories/rekap-bulanan.repository.ts`

- Eksekusi dibungkus dalam transaksi database (`dataSource.transaction`).
- Update status rekap:
  ```sql
  UPDATE rekap_bulanan 
  SET status_rekap = 'final', locked_by = ?, locked_at = NOW() 
  WHERE id IN (?);
  ```
- Sinkronisasi otomatis ke `gaji_pegawai`:
  ```sql
  INSERT INTO gaji_pegawai (nik, periode_tahun, periode_bulan, jenis, gaji, uploaded_by)
  SELECT 
    p.nik, 
    rb.tahun, 
    rb.bulan, 
    'Jasa' AS jenis, 
    rb.nominal_jasa_final AS gaji, 
    COALESCE(admin.nik, 'SDM') AS uploaded_by
  FROM rekap_bulanan rb
  JOIN pegawai p ON rb.pegawai_id = p.id
  LEFT JOIN pegawai admin ON admin.id = ?
  WHERE rb.id IN (?)
  ON DUPLICATE KEY UPDATE 
    gaji = VALUES(gaji),
    uploaded_by = VALUES(uploaded_by),
    updated_at = NOW();
  ```

---

### 2.2. Alur Buka Kunci Rekap (`unlockRekapBulanan` / `unlockManyRekapBulanan`)
Lokasi: `website/backend/src/sdm/repositories/rekap-bulanan.repository.ts`

- Cek status tanda tangan di `gaji_validasi`:
  ```sql
  SELECT gv.id, p.nama, p.nik, gp.periode_bulan, gp.periode_tahun
  FROM gaji_validasi gv
  JOIN gaji_pegawai gp ON gv.gaji_id = gp.id
  JOIN pegawai p ON gp.nik = p.nik
  JOIN rekap_bulanan rb ON rb.pegawai_id = p.id 
    AND rb.bulan = gp.periode_bulan 
    AND rb.tahun = gp.periode_tahun
  WHERE rb.id IN (?) AND gp.jenis = 'Jasa'
  LIMIT 1;
  ```
- **Kondisi 1: Tanda tangan ditemukan**:
  - Batalkan transaksi.
  - Lempar `BadRequestException`:
    `"Tidak dapat membuka kunci: Jasa pelayanan periode ini untuk pegawai [nama] sudah ditandatangani digital."`
- **Kondisi 2: Belum ada tanda tangan**:
  - Hapus entri `gaji_pegawai` terkait:
    ```sql
    DELETE gp FROM gaji_pegawai gp
    JOIN pegawai p ON gp.nik = p.nik
    JOIN rekap_bulanan rb ON rb.pegawai_id = p.id 
      AND rb.bulan = gp.periode_bulan 
      AND rb.tahun = gp.periode_tahun
    WHERE rb.id IN (?) AND gp.jenis = 'Jasa';
    ```
  - Revert status rekap:
    ```sql
    UPDATE rekap_bulanan 
    SET status_rekap = 'draft', locked_by = NULL, locked_at = NULL 
    WHERE id IN (?);
    ```

---

### 2.3. Menu `/dashboard/tanda-tangan-gaji`
- Membaca data via query GraphQL `myGajiValidasiList`.
- Tab **Gaji Pokok**: menampilkan entri `jenis = 'Gaji'`.
- Tab **Jasa Pelayanan**: menampilkan entri `jenis = 'Jasa'` dari sinkronisasi rekap bulanan yang sudah final.
- Tanda tangan digital disimpan via mutation `signGaji(input: { gajiId, tandaTangan, catatan })`.

---

## 3. Data Flow Diagram

```
[Admin Kinerja: /dashboard/penilaian-kinerja/rekap]
                     │
                     │ Klik "Kunci" / "Bulk Lock"
                     ▼
             [RekapBulananService]
                     │
             [RekapBulananRepository]
                     │ (Transaction)
       ┌─────────────┴─────────────┐
       ▼                           ▼
[rekap_bulanan: final]     [INSERT INTO gaji_pegawai (jenis = 'Jasa')]
                                   │
                                   ▼
             [Pegawai: /dashboard/tanda-tangan-gaji]
                                   │
                                   │ Buka Tab "Jasa Pelayanan"
                                   │ Tanda Tangan Digital
                                   ▼
                           [gaji_validasi: signed]
```

---

## 4. Error Handling & Edge Cases
- **Idempotensi**: Jika admin mengunci ulang atau update nilai sebelum ditandatangani, `ON DUPLICATE KEY UPDATE` memastikan nilai nominal terbarui tanpa duplikasi record.
- **Integritas Legal Dokumen**: Buka kunci dicegah secara mutlak apabila dokumen sudah bertanda tangan digital.
- **Bulk Operation**: Jika salah satu dari banyak baris yang dipilih untuk dibuka kunci sudah ditandatangani, seluruh batch dibatalkan secara aman (`ROLLBACK`).
