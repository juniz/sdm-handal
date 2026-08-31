---
target: pelaporan perilaku
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-26T01-58-45Z
slug: src-app-dashboard-pelaporan-perilaku-page-js
---
# Impeccable Critique: Pelaporan Perilaku yang Tidak Diinginkan
**Target File**: `src/app/dashboard/pelaporan-perilaku/page.js`  
**Date**: 2026-08-26  
**Method**: dual-agent (A: b605db1c-fabf-4555-8978-8e7b2c2970bb · B: f870ec6c-7ebc-4d3b-8385-8124891dc25d)

---

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|:---:|---|
| 1 | Visibility of System Status | 2/4 | Status badge ada, namun belum memiliki lifecycle stepper bertahap (Diterima -> Verifikasi -> Investigasi -> Sidang Etik -> Selesai). |
| 2 | Match Between System and Real World | 2/4 | Sudah terhubung master data pegawai & departemen, namun belum merefleksikan realitas investigasi RS (bukti digital/dokumen, saksi klinis). |
| 3 | User Control and Freedom | 2/4 | Belum ada autosave draft (localStorage) sehingga input kronologi panjang rentan hilang jika tidak sengaja refresh. |
| 4 | Consistency and Standards | 2/4 | Inkonsistensi warna dengan `DESIGN.md` (menggunakan dark neon & indigo-*, bukan palet cyan-blue RS Bhayangkara). |
| 5 | Error Prevention | 2/4 | Konfirmasi modal sudah baik, namun DatePicker belum membatasi tanggal masa depan (maxDate) dan belum ada inline error warning. |
| 6 | Recognition Rather Than Recall | 2/4 | Kategori perilaku sangat jelas, namun transparansi keterikatan identitas pelapor tersembunyi di bagian paling bawah form. |
| 7 | Flexibility and Efficiency of Use | 2/4 | Admin table belum mendukung batch action, export PDF dossier kasus untuk komite etik, maupun filter prioritas/urgensi. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Banner hero terlalu dominan dan bernuansa dark-cyberpunk/SaaS AI alih-alih calm clinical care. |
| 9 | Error Recovery | 2/4 | Validasi form hanya mengandalkan notifikasi toast tanpa highlight border merah inline pada field yang bermasalah. |
| 10 | Help and Documentation | 2/4 | Belum ada FAQ perlindungan pelapor (Whistleblower Protection) atau hotline darurat untuk insiden kekerasan aktif. |
| **Total** | | **20/40** | **Acceptable (60%)** |

---

### Design Specificity Verdict

- **LLM Assessment**: Sistem pelaporan ini berhasil memetakan 8 taksonomi perilaku yang sesuai standar rumah sakit (KARS) dan mengintegrasikan combobox master data RS Bhayangkara Nganjuk. Namun, antarmuka visual mengalami disonansi tema yang cukup kentara: penggunaan hero banner gelap bernuansa neon indigo (`bg-slate-900 via-indigo-950`) menyerupai produk cybersecurity/SaaS AI generik, bukan portal layanan internal rumah sakit yang ramah, tenang, dan tepercaya (*Clinical Cyan*).
- **Deterministic Scan (`detect.mjs`)**: 0 pelanggaran statis regex. Layout dan ritme spasi rapi, tanpa duplikasi font atau animasi berlebihan.

---

### Overall Impression
Fungsionalitas dasar CRUD dan alur pelaporan insiden sudah lengkap dan bekerja dengan baik. Namun, dari kacamata *Whistleblowing & Healthcare UX*, antarmuka masih terasa seperti formulir administratif umum dan perlu ditingkatkan dalam aspek **jaminan kerahasiaan & proteksi non-retaliasi**, **dukungan upload bukti lampiran**, serta **penyelarasan warna merek RS Bhayangkara Nganjuk**.

---

### What's Working
1. **Taksonomi Perilaku Sangat Relevan**: 8 kategori perilaku (Pelecehan Seksual, Verbal, Bullying, Fisik, Diskriminasi, Penyalahgunaan Wewenang, Pelanggaran Etika, Lainnya) sangat tepat sasaran untuk kebutuhan tata kelola rumah sakit.
2. **Fleksibilitas Pelaku & Korban Hibrida**: Kemampuan memilih pegawai terdaftar maupun menginput pihak eksternal (pengunjung/vendor/pasien) mencakup semua skenario kejadian nyata.
3. **Modal Konfirmasi Sebelum Kirim**: Dialog konfirmasi mencegah pengiriman yang tidak disengaja dan memberikan ruang jeda sebelum laporan dikunci.

---

### Priority Issues

#### [P1] 1. Ketidakselarasan Identitas Visual & Palette (`DESIGN.md`)
- **Masalah**: Halaman dipenuhi warna indigo (`indigo-600`, `indigo-950`) dan banner gelap AI-style yang kontras dengan panduan desain rumah sakit (*Cyan/Sky Blue*).
- **Dampak**: Menimbulkan kesan kaku dan intimidatif bagi pelapor yang sedang mengalami tekanan psikologis atau trauma.
- **Solusi**: Refactor tema ke palet tenang *Clinical Cyan* (`#0284C7`, `#0EA5E9`, `#F0F9FF`) dengan kartu hero yang bersih dan profesional.
- **Saran Perintah**: `$impeccable colorize` / `$impeccable quiet`

#### [P1] 2. Ketiadaan Fitur Unggah Bukti & Lampiran Dokumen
- **Masalah**: Laporan hanya berbasis teks kronologi, tanpa fasilitas upload foto, screenshot chat, atau dokumen pendukung.
- **Dampak**: Investigasi etik oleh SPI / Komite Etik sulit dilanjutkan tanpa bukti otentik.
- **Solusi**: Tambahkan modul upload lampiran aman (PNG, JPG, PDF hingga 10MB) dengan enkripsi / badge kerahasiaan.
- **Saran Perintah**: `$impeccable harden`

#### [P1] 3. Kekhawatiran Retaliasi & Transparansi Identitas Pelapor
- **Masalah**: Keterangan bahwa pelapor otomatis dicatat sesuai akun login baru terlihat di footer paling bawah.
- **Dampak**: Pegawai junior/honorer berpotensi membatalkan pelaporan karena takut diketahui atasannya.
- **Solusi**: Tampilkan banner *Komitmen Kerahasiaan & Perlindungan Pelapor (Whistleblower Protection)* di bagian awal form dengan opsi tingkat privasi (Kerahasiaan Tertutup: hanya SPI & Direktur).
- **Saran Perintah**: `$impeccable clarify`

#### [P2] 4. Validasi Form & Aksesibilitas ARIA
- **Masalah**: Validasi error hanya muncul di toast, kartu kategori belum memiliki atribut ARIA radio/radiogroup, dan DatePicker mengizinkan tanggal masa depan.
- **Dampak**: Gagal standar aksesibilitas WCAG 2.1 AA dan potensi input tanggal yang keliru.
- **Solusi**: Tambahkan inline error border merah, set `maxDate={new Date()}`, dan tambahkan peran ARIA radiogroup.
- **Saran Perintah**: `$impeccable polish`

---

### Persona Testing Red Flags

- **Alex (Investigator SPI / Admin)**: Tabel admin masih berupa daftar datar tanpa pembagian tingkat urgensi (Tinggi/Sedang), penugasan personel pemeriksa, atau tombol cetak berkas kasus (PDF Dossier) untuk sidang etik.
- **Jordan (Pegawai Junior / Korban)**: Merasa cemas melihat banner gelap dan khawatir identitasnya bocor ke kepala ruangan/pejabat yang dilaporkan tanpa adanya jaminan tertulis perlindungan non-retaliasi.
- **Sam (Pengguna Keyboard / Aksesibilitas)**: Seleksi kartu kategori tidak terbaca sebagai radio group oleh screen reader dan fokus kursor tidak berpindah ke input yang salah saat validasi gagal.
- **Casey (Pengguna Mobile Shift Kerja)**: 8 kartu kategori tersusun panjang secara vertikal di layar smartphone kecil, membutuhkan scroll panjang sebelum mencapai textarea kronologi.

---

### Minor Observations & Questions to Consider
- Tambahkan autosave draft (localStorage) agar kronologi panjang tidak hilang jika browser tertutup mendadak.
- Tambahkan indikator batas minimal karakter (contoh: *Minimal 20 karakter — saat ini: X*).
