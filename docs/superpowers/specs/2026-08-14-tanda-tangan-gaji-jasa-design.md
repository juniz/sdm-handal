# Design Specification: Menu Tanda Tangan Gaji dan Jasa (GraphQL Backend & Frontend SDM)

**Tanggal:** 2026-08-14  
**Status:** Approved  
**Target Pengguna:** Pegawai Mandiri (Self-Service)  

---

## 1. Ringkasan & Tujuan
Menyediakan menu mandiri bagi pegawai untuk melihat dan menandatangani validasi penerimaan Gaji Pokok (Gapok) dan Jasa Pelayanan (Jasa Dasar) per periode bulan/tahun. Tanda tangan digital disimpan ke tabel `gaji_validasi` dengan audit trail ke tabel `gaji_validasi_history` melalui GraphQL backend NestJS.

---

## 2. Batasan Khusus
- **Tanpa Menjalankan Script Migrasi / Seed**: Tidak mengeksekusi migration/seed table otomatis ke database live. Kode langsung memanfaatkan skema tabel `gaji_validasi`, `gaji_validasi_history`, `gaji_pegawai`, `pegawai`, `jasa_dasar_pegawai`, dan `sdm_menu` yang sudah ada.

---

## 3. Arsitektur Backend NestJS (`website/backend`)

### 3.1 DTO & GraphQL Schema Types (`src/sdm/dto/gaji-validasi-types.ts`)
- **`GajiValidasiItemDto`**:
  - `id: number` (ID dari `gaji_pegawai`)
  - `nik: string` (NIK pegawai)
  - `namaPegawai: string` (Nama pegawai)
  - `periodeTahun: number`
  - `periodeBulan: number`
  - `jenis: string` ('Gaji' | 'Jasa')
  - `nominal: number` (Nominal gaji/jasa di `gaji_pegawai.gaji`)
  - `gapok?: number` (Nominal gaji pokok acuan dari tabel `pegawai.gapok`)
  - `jasaDasar?: number` (Nominal jasa dasar acuan dari `jasa_dasar_pegawai`)
  - `isValidated: boolean` (`true` jika ada di `gaji_validasi`)
  - `validasiId?: number` (ID `gaji_validasi` jika sudah tervalidasi)
  - `tandaTangan?: string` (Base64 signature image)
  - `catatan?: string` (Catatan pegawai)
  - `signedAt?: string` (ISO format string waktu tanda tangan)

- **`SignGajiInput`**:
  - `gajiId: number`
  - `tandaTangan: string` (Base64 string)
  - `catatan?: string`

### 3.2 Repository (`src/sdm/repositories/gaji-validasi.repository.ts`)
- Menggunakan `DataSource` koneksi `'sdm'`.
- Method `findMyGajiValidasi(nik: string, periodeTahun?: number, periodeBulan?: number, jenis?: string)`:
  - Query ke `gaji_pegawai gp` JOIN `pegawai p` ON `gp.nik = p.nik`.
  - LEFT JOIN `jasa_dasar_pegawai jdp` ON `jdp.pegawai_id = p.id AND (jdp.berlaku_mulai <= CURDATE() AND (jdp.berlaku_sampai IS NULL OR jdp.berlaku_sampai >= CURDATE()))`.
  - LEFT JOIN `gaji_validasi gv` ON `gp.id = gv.gaji_id`.
  - Filter: `gp.nik = ?` dan optional filter periode & jenis.
- Method `createSignGaji(userNik: string, input: SignGajiInput)`:
  - Memeriksa apakah `gp.nik === userNik`.
  - Memeriksa apakah `gaji_validasi` sudah ada untuk `gajiId`.
  - Eksekusi transaksi atomik TypeORM:
    - INSERT ke `gaji_validasi`
    - INSERT ke `gaji_validasi_history` (`change_type = 'CREATE'`, `changed_by = userNik`).

### 3.3 Service (`src/sdm/gaji-validasi.service.ts`)
- Menyediakan logika bisnis untuk `getMyGajiValidasiList` dan `signGaji`.

### 3.4 Resolver (`src/sdm/gaji-validasi.resolver.ts`)
- Dilindungi oleh `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`.
- Query: `myGajiValidasiList(periodeTahun?: Int, periodeBulan?: Int, jenis?: String): [GajiValidasiItemDto!]!`
- Mutation: `signGaji(input: SignGajiInput!): Boolean!`

### 3.5 Registrasi Modul
- Mendaftarkan `GajiValidasiResolver`, `GajiValidasiService`, dan `GajiValidasiRepository` ke dalam `SdmModule` (`src/sdm/sdm.module.ts`).

---

## 4. Arsitektur Frontend Next.js (`sdm`)

### 4.1 GraphQL Client Helper (`src/lib/gaji-validasi-gql-client.js`)
- Mengirimkan query GraphQL ke endpoint `/graphql`:
  - `fetchMyGajiValidasiList({ periodeTahun, periodeBulan, jenis })`
  - `mutationSignGaji({ gajiId, tandaTangan, catatan })`

### 4.2 Halaman Menu Tanda Tangan (`src/app/dashboard/tanda-tangan-gaji/page.js`)
- **Fitur Utama**:
  - Filter Periode: Dropdown Bulan (1-12) & Tahun (Tahun ini dan sebelumnya).
  - Tampilan Tab Interaktif:
    - **Tab 1: Gaji Pokok** (Menampilkan data rincian gaji, nominal gapok, status validasi, preview tanda tangan jika sudah ada, atau tombol tanda tangan).
    - **Tab 2: Jasa Pelayanan** (Menampilkan data rincian jasa, nominal jasa dasar, status validasi, preview tanda tangan jika sudah ada, atau tombol tanda tangan).
  - Integrasi Modal `TandaTanganModal`:
    - Membuka canvas `react-signature-canvas` saat tombol tanda tangan ditekan.
    - Submit tanda tangan via mutasi `signGaji`, auto-refresh data setelah berhasil disimpan.
    - Menampilkan notifikasi sukses / error.

---

## 5. Rencana Verifikasi
1. Validasi kompilasi TypeScript di backend `website/backend` (`npm run build` / lint check).
2. Verifikasi schema GraphQL ter-generate dengan benar.
3. Verifikasi frontend `sdm` dapat memuat data gaji dan jasa per periode dengan filter.
4. Verifikasi proses tanda tangan digital pada tab Gaji dan Jasa tersimpan ke `gaji_validasi` dan audit trail `gaji_validasi_history`.
