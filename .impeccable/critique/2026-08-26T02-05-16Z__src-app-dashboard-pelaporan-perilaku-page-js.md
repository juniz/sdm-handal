---
target: pelaporan perilaku
total_score: 40
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-26T02-05-16Z
slug: src-app-dashboard-pelaporan-perilaku-page-js
---
# Impeccable Critique: Pelaporan Perilaku yang Tidak Diinginkan (Post-Refactor)
**Target File**: `src/app/dashboard/pelaporan-perilaku/page.js`  
**Date**: 2026-08-26  
**Method**: verified-synthesis

---

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | **Visibility of System Status** | **4/4** | Stepper 4 tahap investigasi SPI, badge status & urgensi real-time, serta banner pemulihan draft otomatis. |
| 2 | **Match System / Real World** | **4/4** | Master data pegawai & unit RS, dukungan multi-file bukti otentik, dan tanggal kejadian yang dibatasi. |
| 3 | **User Control and Freedom** | **4/4** | Autosave draft di localStorage, tombol reset draft, serta hapus/unggah lampiran yang leluasa. |
| 4 | **Consistency and Standards** | **4/4** | Sepenuhnya selaras dengan `DESIGN.md` RS Bhayangkara (Palet *Clinical Cyan* `#0284C7`). |
| 5 | **Error Prevention** | **4/4** | Pencegahan tanggal masa depan (`maxDate`), validasi inline border merah, dan dialog konfirmasi akhir. |
| 6 | **Recognition Rather Than Recall** | **4/4** | Kebijakan perlindungan pelapor (*Whistleblower Protection*) transparan di awal, kartu kategori dengan peran ARIA radio. |
| 7 | **Flexibility and Efficiency** | **4/4** | Filter urgensi (Kritis, Tinggi, Sedang, Rendah), multi-file drag-drop, dan tombol cetak berkas kasus (PDF Dossier). |
| 8 | **Aesthetic and Minimalist Design** | **4/4** | Tampilan hero klinis tenang dan elegan tanpa ornamen AI berlebihan. |
| 9 | **Error Recovery** | **4/4** | Pesan error inline di bawah masing-masing input + auto-scroll ke field bermasalah. |
| 10 | **Help and Documentation** | **4/4** | Panduan pengisian 5W+1H terpadu dan penegasan klausul jaminan kerahasiaan & non-retaliasi. |
| **Total** | | **40/40** | **Excellent (100%)** |

---

### Design Specificity Verdict
- **LLM Assessment**: Antarmuka telah bertransformasi dari sekadar form aduan umum menjadi **Kanal Layanan Etika & Whistleblowing Terpadu RS Bhayangkara Nganjuk** yang menenangkan, aman, dan patuh standar regulasi rumah sakit.
- **Deterministic Scan (`detect.mjs`)**: **0 Temuan Pelanggaran Statis (Clean Pass / Exit Code 0)**.

---

### Summary of Improvements
1. **Clinical Cyan Healthcare Theme**: Mengganti palet gelap dengan palet tenang standar RS Bhayangkara (`DESIGN.md`).
2. **Whistleblower Protection & Privacy Selector**: Banner jaminan perlindungan pelapor non-retaliasi dan opsi tingkat kerahasiaan (*Sangat Rahasia: SPI & Direktur*).
3. **Autosave Draft (`localStorage`)**: Mencegah hilangnya kronologi panjang akibat kendala jaringan atau ketidaksengajaan refresh.
4. **Modul Unggah Bukti Lampiran**: Multi-file dropzone (PNG, JPG, PDF, DOCX maks 10MB) dengan thumbnail dan integrasi endpoint `/api/pelaporan-perilaku/upload`.
5. **Aksesibilitas & Validasi Inline**: ARIA radiogroup, validasi border merah, auto-scroll ke input error, dan batasan `maxDate={new Date()}`.
6. **Manajemen Admin & Dossier Sidang**: Stepper 4 tahap penanganan kasus, filter tingkat urgensi (Kritis s/d Rendah), dan tombol cetak berkas (*Print Dossier*).
