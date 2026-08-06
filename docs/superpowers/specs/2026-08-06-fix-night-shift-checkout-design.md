# Desain Perbaikan Checkout Shift Malam

Tanggal: 2026-08-06

## Tujuan

Mencegah pegawai melakukan absensi pulang sebelum jam pulang shift. Aturan bisnisnya adalah checkout diperbolehkan mulai tepat pada jam pulang (`>=`), termasuk shift Malam yang selesai pada tanggal berikutnya.

## Masalah saat ini

- Frontend membandingkan jam saat ini dan jam pulang sebagai string. Untuk shift `20:00–06:59`, pukul `20:05` dianggap lebih besar dari `06:59`, sehingga tombol checkout langsung aktif.
- Backend GraphQL mengambil presensi aktif lalu langsung menyimpan checkout tanpa memvalidasi jam pulang. Request langsung dapat melewati pembatasan frontend.

## Pendekatan

Perbaikan dilakukan pada frontend dan backend secara bersamaan. Frontend memberikan umpan balik yang benar, sedangkan backend menjadi sumber kebenaran dan menghitung ulang waktu checkout menggunakan waktu server.

## Desain alur

1. Frontend membaca `jam_datang`, `jam_masuk`, dan `jam_pulang` dari data shift/presensi.
2. Frontend membentuk `expectedCheckout`:
   - shift normal: tanggal `jam_datang` + `jam_pulang`;
   - shift Malam, ditandai `jam_pulang < jam_masuk`: tanggal `jam_datang` + satu hari + `jam_pulang`.
3. Tombol checkout aktif hanya ketika waktu sekarang sudah `>= expectedCheckout`.
4. Backend mengambil presensi aktif dan konfigurasi shift dari database.
5. Backend membentuk `expectedCheckout` dengan aturan tanggal yang sama dan membandingkannya dengan waktu server.
6. Jika checkout belum waktunya, backend mengembalikan `BadRequest` dengan pesan yang memuat waktu checkout yang diizinkan dan tidak mengubah data presensi.
7. Jika waktunya valid, proses transaksi checkout yang ada tetap digunakan.

## Penanganan error

Pesan penolakan:

`Belum waktunya presensi pulang. Checkout dapat dilakukan mulai pukul HH:mm.`

Validasi menggunakan waktu server. Timestamp dari client tidak digunakan untuk menentukan apakah checkout sudah boleh dilakukan. Validasi lokasi, transaksi checkout, dan auto-checkout tidak diubah.

## Cakupan perubahan

- `src/app/dashboard/attendance/page.js`: perhitungan status tombol checkout berbasis datetime.
- `website/backend/src/sdm/attendance.service.ts`: validasi waktu checkout server-side sebelum transaksi.
- Test ditambahkan pada layer yang sudah memiliki test harness; jika komponen frontend tidak memiliki harness, logika datetime harus diekstrak ke helper kecil yang dapat diuji tanpa browser.

Tidak termasuk refactor umum, perubahan aturan toleransi, perubahan auto-checkout, atau perubahan skema database.

## Kriteria penerimaan

- Shift normal `08:00–17:00` ditolak pada `16:59:59` dan diterima mulai `17:00:00`.
- Shift Malam `20:00–06:59` ditolak pada hari masuk dan sampai `06:58:59` hari berikutnya.
- Shift Malam diterima mulai `06:59:00` dan setelahnya.
- Request GraphQL langsung sebelum waktu checkout tetap ditolak.
- Checkout valid tetap memindahkan data dari `temporary_presensi` ke `rekap_presensi`.
- Tidak ada regresi pada validasi lokasi dan alur auto-checkout.

## Verifikasi

Jalankan test yang mencakup kasus shift normal, shift Malam sebelum/tepat/setelah waktu checkout, bypass melalui request langsung, serta jalur checkout valid. Lakukan lint/typecheck atau build sesuai script repository yang tersedia.
