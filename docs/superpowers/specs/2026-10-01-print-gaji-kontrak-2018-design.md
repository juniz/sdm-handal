# Design Spec: Print Gaji Berdasarkan Tahun Kontrak 2018 (Atas dan Bawah)

## 1. Overview
Pada modul penggajian menu `/penggajian/data-gaji`, laporan cetak gaji pegawai kontrak perlu dikelompokkan berdasarkan tahun mulai kontrak:
1. Kontrak di bawah tahun 2018 (`< 2018`)
2. Kontrak tahun 2018 ke atas (`>= 2018`)
3. Pegawai tanpa tanggal kontrak (`BELUM ADA TMT KONTRAK`) jika ada.

Semua kelompok dicetak dalam satu file PDF berurutan, masing-masing dengan header TMT kelompok, nomor urut baru (mulai 1), total akumulasi per kelompok, dan lembar tanda tangan (Mengetahui & Bendahara).

## 2. Scope & Target Files
- `src/components/penggajian/PrintGajiReport.js`: Ubah logika grouping saat `groupByContract = true`.
- `src/app/dashboard/penggajian/data-gaji/page.js`: Perjelas label tombol print per kelompok kontrak jika diperlukan.

## 3. Data Flow & Logic Specification

### A. Pengelompokan Data (`PrintGajiReport.js`)
Saat opsi `groupByContract = true`:
1. Iterasi data pegawai hasil query print.
2. Evaluasi kolom `mulai_kontrak`:
   - Jika tanggal valid: ekstrak tahun (`d.getFullYear()`).
     - Jika `year < 2018`: masukkan ke grup `BELOW_2018`.
     - Jika `year >= 2018`: masukkan ke grup `2018_AND_ABOVE`.
   - Jika `!mulai_kontrak || mulai_kontrak === "0000-00-00"` atau tanggal tidak valid:
     - Masukkan ke grup `NO_CONTRACT`.
3. Struktur Grup:
   - `BELOW_2018`: `label = "DI BAWAH TAHUN 2018"`
   - `2018_AND_ABOVE`: `label = "TAHUN 2018 KE ATAS"`
   - `NO_CONTRACT`: `label = "BELUM ADA TMT KONTRAK"`
4. Urutan Rendering Dokumen:
   - Tampilkan grup `BELOW_2018` terlebih dahulu jika memiliki item.
   - Dilanjutkan dengan halaman baru untuk grup `2018_AND_ABOVE` jika memiliki item.
   - Dilanjutkan dengan halaman baru untuk grup `NO_CONTRACT` jika memiliki item.

### B. Header dan Tabel PDF
1. Header:
   - Menampilkan kop instansi (POLRI DAERAH JAWA TIMUR / BIDANG KEDOKTERAN DAN KESEHATAN / RUMAH SAKIT BHAYANGKARA TK. III NGANJUK).
   - Menampilkan judul (GAJI TENAGA KONTRAK / JASA TENAGA KONTRAK), periode bulan & tahun.
   - Menampilkan sub-header: `TMT KONTRAK: [LABEL GRUP]`.
2. Kolom Tabel:
   - NO., NAMA, TGL KONTRAK, PANGKAT, NIP, JABATAN, JUMLAH, BPJS KESEHATAN, BPJS TENAGA KERJA, JUMLAH DITERIMA, TANDA TANGAN (1, 2).
   - Format `TGL KONTRAK`: `DD/MM/YYYY`.
3. Total dan Tanda Tangan:
   - Subtotal per kelompok dihitung mandiri (gaji, bpjs kes, bpjs tk, total diterima).
   - Blok tanda tangan Kepala RS dan Bendahara Pengeluaran dicetak di bawah tabel setiap kelompok.

## 4. Verifikasi & Pengujian
1. Buka menu `/penggajian/data-gaji`.
2. Pilih filter bulan, tahun, jenis gaji.
3. Klik tombol cetak per kelompok kontrak.
4. Verifikasi PDF:
   - Terdapat halaman untuk kontrak `< 2018` dan halaman untuk kontrak `>= 2018`.
   - Pegawai terkelompokkan dengan tepat sesuai tahun `mulai_kontrak`.
   - Nomor urut direset tiap grup.
   - Total angka dan tanda tangan tercetak di setiap kelompok.
