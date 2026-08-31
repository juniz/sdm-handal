---
target: pelaporan perilaku
total_score: 39.6
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-26T02-17-47Z
slug: src-app-dashboard-pelaporan-perilaku-page-js
---
# Impeccable Critique: Pelaporan Perilaku yang Tidak Diinginkan
**Target File**: `src/app/dashboard/pelaporan-perilaku/page.js`  
**Date**: 2026-08-26  
**Method**: dual-agent (A: d36f6816-5441-4626-b87c-1f9e14a855e7 · B: 7ea6dfa8-c1ea-47f0-b36d-27f83302ed74)

---

### Design Health Score

| # | Heuristic | Score | Key Finding & Evidence |
|---|-----------|:-----:|------------------------|
| 1 | **Visibility of System Status** | **4/4** | Progress upload real-time, counter karakter dinamis (`20/min 20`), stepper 4 tahap investigasi, dan alert auto-restore draft. |
| 2 | **Match System / Real World** | **4/4** | Terminologi tata kelola rumah sakit (SPI, Komite Etik, NIK, Disposisi, 5W+1H), format tanggal lokal, dan unggah dokumen bukti. |
| 3 | **User Control and Freedom** | **4/4** | Autosave draft di localStorage dengan tombol bersihkan draft, hapus lampiran, dan dialog tinjau ulang sebelum kirim. |
| 4 | **Consistency and Standards** | **4/4** | Sepenuhnya selaras dengan `DESIGN.md` RS Bhayangkara (Palet *Clinical Cyan* `#0284C7`, Sky, Slate, Emerald, Rose). |
| 5 | **Error Prevention** | **4/4** | DatePicker membatasi `maxDate={new Date()}` (mencegah tanggal masa depan), batas minimal karakter, dan validasi berkas 10MB. |
| 6 | **Recognition Rather Than Recall** | **4/4** | 8 kartu kategori perilaku dengan penjelasan gamblang, segmentasi peran pelaku/korban, dan panduan narasi 5W+1H. |
| 7 | **Flexibility and Efficiency** | **3.8/4** | Preset pelaporan mandiri, multi-filter antrean admin (Status, Kategori, Urgensi), dan tombol cetak berkas dossier kasus. |
| 8 | **Aesthetic and Minimalist Design** | **4/4** | Tampilan hero medis tenang, tata letak bernomor 6 bagian, dan ritme spasi yang seimbang tanpa ornamen berlebih. |
| 9 | **Error Recovery** | **4/4** | Pesan kesalahan inline berwarna merah di bawah input terkait dengan pergeseran fokus kursor otomatis (*auto-scroll*). |
| 10 | **Help and Documentation** | **3.8/4** | Panduan kronologi 5W+1H di placeholder textarea, petunjuk format berkas bukti, dan klausul jaminan perlindungan pelapor. |
| **Total** | | **39.6/40** | **Exemplary (99%)** |

---

### Design Specificity Verdict
- **LLM Assessment**: Halaman telah bertransformasi secara matang menjadi **Kanal Layanan Etika & Whistleblowing Terpadu RS Bhayangkara Nganjuk**. Antarmuka menyeimbangkan kebutuhan rasa aman psikologis (*psychological safety*) bagi pelapor yang rentan dengan ketelitian administratif bagi tim Satuan Pemeriksa Internal (SPI) & Komite Etik.
- **Deterministic Scan (`detect.mjs`)**: **0 Temuan Pelanggaran (Clean Pass / Exit Code 0)**. Kontras warna memenuhi standar WCAG 2.1 AA di seluruh komponen dan badge.

---

### Overall Impression
Antarmuka berada dalam kondisi prima (*production-grade*), empatik, dan kokoh. Pengalaman pengaduan berjalan mulus dari awal pengisian form hingga tahapan disposisi dan pencetakan berkas sidang etik.

---

### What's Working
1. **Arsitektur Empatik & Trauma-Informed**: Penegasan jaminan non-retaliasi di awal, opsi tingkat kerahasiaan (*Sangat Rahasia: SPI & Direktur*), dan panduan 5W+1H mengurangi kecemasan pelapor secara signifikan.
2. **Ketahanan Formulir (*Form Resilience*)**: Autosave draft lokal mencegah hilangnya data kronologi panjang, didukung validasi inline dengan auto-scroll ke input yang bermasalah.
3. **Siklus Tata Kelola Terintegrasi**: Menghubungkan pelacakan status pelapor dengan antrean triage admin SPI, catatan tindak lanjut investigasi, dan tombol cetak berkas (*Print Dossier*).

---

### Priority Issues & Polish Recommendations

#### [P2] 1. Opsi Pelaporan Anonim / Terenkripsi Tambahan
- **Masalah**: Korban dengan ketakutan luar biasa mungkin enggan melapor jika NIK otomatis tertaut ke dokumen.
- **Solusi**: Tambahkan opsi *"Samarkan Identitas Pelapor (Hanya Terbuka untuk Ketua Tim Pemeriksa SPI)"*.
- **Saran Perintah**: `$impeccable clarify`

#### [P3] 2. Thumbnail Preview Gambar Bukti Lampiran
- **Masalah**: Berkas gambar saat ini hanya menampilkan nama dan ukuran file.
- **Solusi**: Tambahkan thumbnail preview gambar berukuran kecil saat foto/screenshot berhasil diunggah.
- **Saran Perintah**: `$impeccable polish`

---

### Persona Stress-Testing Summary
- **Alex (Ketua SPI / Admin)**: Sangat efisien dengan indikator KPI triage, filter multi-kriteria, dan modal disposisi cepat.
- **Jordan (Pegawai Junior / Korban)**: Merasa tenang dan terlindungi berkat banner jaminan perlindungan hukum dan penyimpanan draft otomatis.
- **Sam (Pengguna Keyboard & Aksesibilitas)**: Navigasi keyboard dan pembaca layar membaca 8 kartu kategori sebagai ARIA radio group dengan lancar.
- **Casey (Pengguna Mobile)**: Form 6 bagian tersusun rapi secara responsif dan mudah digunakan dengan satu tangan di ponsel.
