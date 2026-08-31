---
target: pelaporan perilaku
total_score: 39.6
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-26T02-29-57Z
slug: src-app-dashboard-pelaporan-perilaku-page-js
---
# Impeccable Critique: Pelaporan Perilaku yang Tidak Diinginkan
**Target File**: `src/app/dashboard/pelaporan-perilaku/page.js`  
**Date**: 2026-08-26  
**Method**: dual-agent (A: 4ccc3684-0795-4547-be85-5b5b393f60ea · B: 8d156811-77ee-4ef1-9aa2-0857e2911c99)

---

### Design Health Score

| # | Usability Heuristic | Score | Key Finding & Evidence |
|---|---------------------|:-----:|------------------------|
| 1 | **Visibility of System Status** | **4/4** | Drag & drop visual feedback, progress upload, counter karakter dinamis (`20/min 20`), stepper 4 tahap investigasi SPI, dan banner restore draft. |
| 2 | **Match System / Real World** | **4/4** | Terminologi otentik tata kelola RS (SPI, Komite Etik, NIK, Disposisi, 5W+1H), format tanggal lokal, dan unggah bukti otentik. |
| 3 | **User Control and Freedom** | **4/4** | Autosave draft di localStorage dengan tombol bersihkan draft, hapus lampiran, dialog konfirmasi tinjau ulang, dan lightbox modal dismiss. |
| 4 | **Consistency and Standards** | **4/4** | Sepenuhnya selaras dengan `DESIGN.md` RS Bhayangkara (Palet *Clinical Cyan* `#0284C7`, Sky, Slate, Emerald, Rose). |
| 5 | **Error Prevention** | **4/4** | DatePicker membatasi `maxDate={new Date()}` (mencegah tanggal masa depan), batas minimal karakter, dan validasi berkas 10MB. |
| 6 | **Recognition Rather Than Recall** | **4/4** | 8 kartu kategori perilaku dengan penjelasan gamblang, segmentasi peran pelaku/korban, dan panduan narasi 5W+1H. |
| 7 | **Flexibility and Efficiency** | **3.8/4** | Drag & Drop / file selector, preset pelaporan mandiri, multi-filter antrean admin, dan tombol cetak berkas dossier kasus. |
| 8 | **Aesthetic and Minimalist Design** | **4/4** | Tampilan hero medis tenang, tata letak bernomor 6 bagian, dan ritme spasi yang seimbang tanpa ornamen berlebih. |
| 9 | **Error Recovery** | **4/4** | Pesan kesalahan inline berwarna merah di bawah input terkait dengan pergeseran fokus kursor otomatis (*auto-scroll*). |
| 10 | **Help and Documentation** | **3.8/4** | Panduan kronologi 5W+1H di placeholder textarea, petunjuk format berkas bukti, dan klausul jaminan perlindungan pelapor. |
| **Total** | | **39.6/40** | **Exemplary (99% — Grade A+)** |

---

### Design Specificity Verdict
- **LLM Assessment**: Halaman telah bertransformasi menjadi **Kanal Layanan Etika & Whistleblowing Terpadu RS Bhayangkara Nganjuk** standar rumah sakit kepolisian (Polda Jatim). Menggabungkan rasa aman psikologis (*psychological safety*) bagi pelapor yang rentan dengan ketelitian administratif bagi tim SPI & Komite Etik.
- **Deterministic Scan (`detect.mjs`)**: **0 Temuan Pelanggaran (Clean Pass / Exit Code 0)**.

---

### Overall Impression
Antarmuka berada dalam kondisi prima (*production-grade*), empatik, dan kokoh. Alur pengaduan berjalan mulus dari pengisian form interaktif dengan drag-and-drop lampiran, lightbox pratinjau foto, hingga tahapan disposisi dan pencetakan berkas sidang etik.

---

### What's Working
1. **Arsitektur Empatik & Trauma-Informed**: Jaminan perlindungan non-retaliasi, opsi tingkat kerahasiaan (*Sangat Rahasia: SPI & Direktur*), dan panduan 5W+1H mengurangi kecemasan pelapor secara optimal.
2. **Drag & Drop Bukti & Image Lightbox**: Area dropzone interaktif dengan highlight visual responsif dan modal Lightbox resolusi tinggi untuk memeriksa bukti foto/screenshot secara langsung.
3. **Ketahanan Formulir (*Form Resilience*)**: Autosave draft lokal mencegah hilangnya data kronologi panjang, didukung validasi inline dengan auto-scroll ke input yang bermasalah.
4. **Siklus Tata Kelola Terintegrasi**: Menghubungkan pelacakan status pelapor dengan antrean triage admin SPI, catatan tindak lanjut investigasi, dan tombol cetak berkas (*Print Dossier*).
