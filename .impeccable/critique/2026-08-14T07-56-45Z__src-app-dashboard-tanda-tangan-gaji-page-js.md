---
target: page tanda tangan gaji
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-14T07-56-45Z
slug: src-app-dashboard-tanda-tangan-gaji-page-js
---
# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Timestamp status tersimpan baik, tetapi penanganan error modal masih memakai `window.alert()` tanpa feedback kriptografis/audit trail visual. |
| 2 | Match System / Real World | 3 | Menggunakan ikon `<DollarSign />` untuk sistem penggajian RS di Indonesia dan istilah campuran *"Total Take Home"*. |
| 3 | User Control and Freedom | 2 | Canvas memiliki tombol hapus, namun setelah submit belum tersedia alur pelaporan selisih atau sanggah data ke HRD/Keuangan. |
| 4 | Consistency and Standards | 3 | Dropdown filter menggunakan native `<select>` unstyled; modal menggunakan `alert()` sementara page menggunakan `sonner` toast. |
| 5 | Error Prevention | 3 | Satu sentuhan titik acak di canvas dianggap tanda tangan valid tanpa preview konfirmasi final sebelum kirim. |
| 6 | Recognition Rather Than Recall | 3 | Modal tanda tangan hanya menampilkan nominal global tanpa rincian tunjangan/potongan dasar. |
| 7 | Flexibility and Efficiency | 2 | Belum ada filter cepat *"Hanya yang Belum Ditandatangani"* untuk dokter/pegawai dengan banyak komponen jasa. |
| 8 | Aesthetic and Minimalist Design | 2 | Fragmentasi palet warna (Blue, Purple, Emerald, Amber) yang tidak seragam dengan panduan Brand Cyan & Slate di `DESIGN.md`. |
| 9 | Error Recovery | 3 | Pesan error modal bersifat generik tanpa petunjuk pemulihan yang jelas bagi pegawai. |
| 10 | Help and Documentation | 2 | Belum ada panduan alur validasi digital atau kontak bantuan HRD jika terdapat ketidaksesuaian nominal. |
| **Total** | | **25/40** | **Acceptable (Perlu Peningkatan)** |

---

## Design Specificity Verdict

- **LLM Assessment**: Antarmuka sudah fungsional dalam memisahkan Gaji Pokok dan Jasa Pelayanan, namun masih terasa seperti kartu verifikasi tanda tangan generik. Kurang menonjolkan identitas RS Bhayangkara Nganjuk (identitas unit kerja/instalasi pegawai, ikon mata uang lokal, dan stempel keabsahan slip).
- **Deterministic Scan**: 0 violation pada aturan klise (`detect.mjs`). Struktur kode bersih, bebas dari gradien ungu/pink berlebihan atau bento box berlebihan.

---

## Overall Impression
Dasar fungsionalitas penandatanganan dan pemisahan tab Gaji vs Jasa sudah sangat baik dan responsif. Namun, pengalaman pegawai saat menandatangani dokumen finansial penting memerlukan rasa kepercayaan (*trust & transparency*) yang lebih tinggi, konsistensi token desain klinis (*Brand Cyan/Slate*), serta penghapusan dialog `window.alert()` bawaan browser.

---

## What's Working
1. **Pemisahan Tab Gaji Pokok & Jasa Pelayanan**: Sangat tepat untuk struktur remunerasi rumah sakit yang memiliki siklus distribusi jasa medis dan gaji pokok berbeda.
2. **State Loading & Empty yang Rapi**: Menggunakan skeleton loader dan ilustrasi kartu kosong yang informatif per tab.
3. **Penyajian Arsip Tanda Tangan**: Menampilkan preview citra tanda tangan digital beserta waktu penandatanganan pada slip yang sudah divalidasi.

---

## Priority Issues

### [P0] Penghapusan `window.alert()` pada Modal Tanda Tangan
- **Why it matters**: Memutus pengalaman pengguna, terlihat tidak profesional, dan mengunci interaksi browser secara kasar.
- **Fix**: Ganti dengan pesan validasi form inline di dalam modal atau `toast.error()` dari Sonner.
- **Suggested command**: `$impeccable harden`

### [P1] Transparansi Finansial pada Modal Penandatanganan
- **Why it matters**: Pegawai ragu membubuhkan tanda tangan resmi jika modal hanya menampilkan angka nominal tunggal tanpa rincian/ringkasan komponen pendapatan atau potongan.
- **Fix**: Sediakan ringkasan komponen gaji/jasa dasar atau tombol "Lihat Rincian Slip" sebelum tanda tangan.
- **Suggested command**: `$impeccable clarify`

### [P2] Penyelarasan Palet Desain Klinis (`DESIGN.md`) & Ikon Rupiah
- **Why it matters**: Penggunaan ikon `<DollarSign />` dan warna sembarang (Blue `#2563EB`, Purple `#7C3AED`) memecah konsistensi visual SDM Handal yang berbasis Brand Cyan (`#0284C7`) dan Slate neutral.
- **Fix**: Ganti dengan ikon `Banknote`/`ReceiptText` dan sesuaikan token warna badge serta tab dengan tema sistem.
- **Suggested command**: `$impeccable polish`

### [P3] Standarisasi Komponen Dropdown Filter Toolbar
- **Why it matters**: Elemen native `<select>` tidak memiliki focus ring yang rapi dan kurang aksesibel bagi pembaca layar.
- **Fix**: Gunakan komponen `@/components/ui/select` standar Shadcn UI.
- **Suggested command**: `$impeccable layout`

---

## Persona Red Flags

- **Alex (Dokter Spesialis / Power User)**: Menerima beberapa komponen jasa pelayanan per bulan; frustrasi karena harus menandatangani satu per satu tanpa filter cepat item yang berstatus *"Belum Ditandatangani"*.
- **Jordan (Perawat Baru / First-Timer)**: Ragu menandatangani karena di modal tidak terlihat apakah potongan BPJS / koperasi sudah diperhitungkan dengan benar.
- **Casey (Petugas Mobile di Ruangan Pasien)**: Mengakses via smartphone saat dinas; canvas tanda tangan terasa sempit dan popup `alert()` mengganggu navigasi layar sentuh.

---

## Minor Observations
1. Fungsi format Rupiah diulang (duplikasi kode di `page.js` dan `TandaTanganModal.jsx`).
2. Label status dapat diperkaya dengan badge verifikasi audit (misal: ID Validasi unik).

---

## Questions to Consider
1. *Apakah pegawai memerlukan tombol "Laporkan Selisih / Hubungi HRD" langsung dari kartu slip jika nominal tidak sesuai sebelum ditandatangani?*
2. *Apakah perlu tombol cetak / unduh tanda terima bukti tanda tangan sah ber-QR Code untuk arsip pribadi pegawai?*
