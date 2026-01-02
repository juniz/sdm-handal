# Fitur Validasi Gaji dengan Tanda Tangan

## Overview

Fitur validasi gaji memungkinkan pegawai untuk menandatangani slip gaji mereka sebagai bentuk konfirmasi dan validasi. Sistem ini dirancang dengan audit trail lengkap untuk memastikan transparansi dan keamanan.

## Struktur Database

### Tabel `gaji_validasi`

- Menyimpan data tanda tangan validasi gaji pegawai
- Status: Menunggu, Disetujui, Ditolak
- Menyimpan tanda tangan dalam format base64
- Menyimpan informasi siapa yang menandatangani dan kapan

### Tabel `gaji_validasi_history`

- Menyimpan history perubahan status validasi
- Audit trail lengkap untuk setiap perubahan
- Mencatat siapa yang melakukan perubahan dan kapan

### Trigger Database

- `trg_gaji_validasi_insert`: Otomatis membuat history saat insert
- `trg_gaji_validasi_update`: Otomatis membuat history saat update status

## Fitur

### 1. Tanda Tangan Pegawai

- Pegawai dapat menandatangani slip gaji mereka sendiri
- Menggunakan SignaturePad untuk tanda tangan digital
- Dapat menambahkan catatan opsional
- Status awal: "Menunggu"

### 2. Validasi oleh KEU

- Hanya departemen KEU yang dapat memvalidasi tanda tangan
- Dapat menyetujui atau menolak validasi
- Dapat menambahkan catatan saat menolak

### 3. Tabel Validasi Gaji

- Halaman khusus untuk melihat semua validasi gaji
- Filter berdasarkan periode dan status
- Menampilkan tanda tangan, status, dan informasi validasi
- Akses untuk semua user (dengan pembatasan aksi)

## Alur Kerja

1. **Pegawai melihat slip gaji**

   - Pegawai melihat daftar gaji mereka di halaman penggajian
   - Klik tombol "Tanda Tangan" pada gaji yang ingin divalidasi

2. **Pegawai membuat tanda tangan**

   - Modal terbuka dengan SignaturePad
   - Pegawai membuat tanda tangan digital
   - Dapat menambahkan catatan opsional
   - Klik "Simpan Tanda Tangan"

3. **Status: Menunggu**

   - Setelah tanda tangan disimpan, status menjadi "Menunggu"
   - Data tersimpan di tabel `gaji_validasi`
   - History tersimpan di `gaji_validasi_history`

4. **KEU memvalidasi**

   - KEU melihat daftar validasi di halaman Validasi Gaji
   - Dapat menyetujui atau menolak
   - Jika ditolak, harus memberikan alasan

5. **Status: Disetujui/Ditolak**
   - Setelah divalidasi, status berubah
   - History perubahan tersimpan
   - Pegawai dapat melihat status di halaman penggajian

## Komponen

### `TandaTanganModal.jsx`

- Modal untuk membuat tanda tangan
- Menggunakan SignaturePad dari react-signature-canvas
- Validasi tanda tangan tidak boleh kosong

### `GajiTable.jsx`

- Menampilkan tombol tanda tangan untuk setiap gaji
- Menampilkan status validasi dengan badge
- Tombol disabled jika sudah disetujui

### `ValidasiGajiPage` (`/dashboard/penggajian/validasi`)

- Halaman untuk melihat semua validasi gaji
- Filter berdasarkan periode dan status
- Aksi validasi untuk KEU

## API Endpoints

### `GET /api/gaji/validasi`

- Ambil daftar validasi gaji
- Query params: periode_tahun, periode_bulan, status, nik

### `POST /api/gaji/validasi`

- Buat validasi baru (tanda tangan pegawai)
- Body: gaji_id, tanda_tangan, catatan

### `GET /api/gaji/validasi/[id]`

- Ambil detail validasi gaji

### `PUT /api/gaji/validasi/[id]`

- Update status validasi (hanya KEU)
- Body: status, catatan

## Keamanan

- Pegawai hanya dapat menandatangani gaji sendiri
- Hanya KEU yang dapat memvalidasi tanda tangan
- Semua perubahan tercatat dalam audit trail
- Foreign key constraints untuk integritas data

## Audit Trail

Setiap perubahan status validasi dicatat dalam `gaji_validasi_history`:

- CREATE: Saat tanda tangan pertama kali dibuat
- UPDATE_STATUS: Saat status berubah
- UPDATE_CATATAN: Saat catatan diupdate

Setiap record history menyimpan:

- Status lama dan baru
- Siapa yang melakukan perubahan
- Kapan perubahan dilakukan
- Catatan terkait perubahan
