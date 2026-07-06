# Spec Desain: Bobot Penilaian Prioritas Kegiatan Kerja Pegawai

Dokumen ini mendefinisikan perubahan desain untuk menerapkan bobot/skala prioritas pada setiap kegiatan harian pegawai di Modul Penilaian Kinerja, menggunakan sistem konfigurasi parameter dinamis.

---

## 1. Latar Belakang & Tujuan
Saat ini, semua kegiatan harian memiliki kontribusi bobot yang sama (*flat*) terhadap perhitungan skor kegiatan. Untuk meningkatkan akurasi penilaian, setiap kegiatan akan memiliki skala prioritas (**Tinggi**, **Sedang**, **Rendah**). Skor total kegiatan dihitung secara proporsional berdasarkan bobot prioritas dari kegiatan-kegiatan yang diselesaikan.

---

## 2. Perubahan Database (Schema & Seeds)

### 2.1 Skema Tabel Baru
Kita menambahkan kolom `prioritas` bertipe `ENUM('tinggi', 'sedang', 'rendah')` ke tabel template master dan kegiatan harian:

```sql
-- Tambah kolom prioritas di tabel template master kegiatan
ALTER TABLE `master_kegiatan_kerja`
ADD COLUMN `prioritas` ENUM('tinggi', 'sedang', 'rendah') NOT NULL DEFAULT 'sedang' AFTER `deskripsi`;

-- Tambah kolom prioritas di tabel checklist kegiatan harian pegawai
ALTER TABLE `kegiatan_harian`
ADD COLUMN `prioritas` ENUM('tinggi', 'sedang', 'rendah') NOT NULL DEFAULT 'sedang' AFTER `penjabaran`;
```

### 2.2 Parameter Penilaian Baru (`parameter_penilaian`)
Menambahkan tiga parameter konfigurasi baru di database agar bobot nilai prioritas dapat disesuaikan secara dinamis oleh HRD:

```sql
INSERT INTO `parameter_penilaian` (`kode`, `nama_parameter`, `kategori`, `bobot_persen`, `nilai_kondisi`, `nilai_skor`, `deskripsi`, `is_aktif`) VALUES
('KGT_BOBOT_TINGGI', 'Bobot Kerja Prioritas Tinggi', 'kegiatan', 60, NULL, 3.00, 'Faktor pengali skor untuk kegiatan berprioritas tinggi', 1),
('KGT_BOBOT_SEDANG', 'Bobot Kerja Prioritas Sedang', 'kegiatan', 60, NULL, 2.00, 'Faktor pengali skor untuk kegiatan berprioritas sedang', 1),
('KGT_BOBOT_RENDAH', 'Bobot Kerja Prioritas Rendah', 'kegiatan', 60, NULL, 1.00, 'Faktor pengali skor untuk kegiatan berprioritas rendah', 1);
```

---

## 3. Logika Perhitungan & Rumus

### 3.1 Rumus Skor Kegiatan
Skor kegiatan dihitung secara proporsional berdasarkan rasio bobot kegiatan yang diselesaikan terhadap total bobot semua kegiatan pada hari tersebut:

$$\text{Skor Kegiatan} = \left( \frac{\sum \text{Bobot Kegiatan Selesai}}{\sum \text{Bobot Semua Kegiatan}} \right) \times 100$$

Nilai bobot diperoleh secara dinamis dari parameter:
- `tinggi` = `nilai_skor` dari `KGT_BOBOT_TINGGI` (default 3.00)
- `sedang` = `nilai_skor` dari `KGT_BOBOT_SEDANG` (default 2.00)
- `rendah` = `nilai_skor` dari `KGT_BOBOT_RENDAH` (default 1.00)

### 3.2 Contoh Kalkulasi
Pegawai menginput 3 kegiatan:
1. Kegiatan A (Prioritas: **Tinggi**, Bobot: **3**) $\rightarrow$ **Selesai**
2. Kegiatan B (Prioritas: **Sedang**, Bobot: **2**) $\rightarrow$ **Belum**
3. Kegiatan C (Prioritas: **Rendah**, Bobot: **1**) $\rightarrow$ **Selesai**

Perhitungan:
- Total Bobot ($W_{\text{total}}$) = $3 + 2 + 1 = 6$
- Bobot Selesai ($W_{\text{selesai}}$) = $3 + 1 = 4$
- Skor Kegiatan = $\frac{4}{6} \times 100 = \mathbf{66.67}$

---

## 4. Alur Integrasi UI & API

### 4.1 Frontend Input Harian (`input/page.js`)
- Mengambil data parameter dari `/api/penilaian/parameter` saat halaman dimuat.
- Menampilkan pilihan dropdown "Prioritas" (Tinggi, Sedang, Rendah) saat menambah atau mengubah kegiatan.
- Menghitung dan memperbarui "Estimasi Skor Kegiatan" dan "Estimasi Skor Total" secara real-time pada UI di panel kiri.

### 4.2 Admin CRUD Master Kegiatan (`master-kegiatan/page.js` & APIs)
- Menambahkan kolom input prioritas pada form tambah/edit template master kegiatan kerja.
- Mengirim dan menyimpan field `prioritas` ke backend melalui endpoint `/api/penilaian/master-kegiatan`.

### 4.3 Backend Submit & Update APIs (`harian/route.js` & `harian/[id]/route.js`)
- Mengambil parameter bobot dari database saat melakukan operasi submit (`POST` / `PUT`).
- Menghitung `skor_kegiatan` berdasarkan rumus bobot prioritas dan memperbarui total skor sebelum merubah status menjadi `submitted`.

---

## 5. Rencana Verifikasi

### 5.1 Tes Database
- Jalankan skrip migrasi SQL dan pastikan kolom `prioritas` terbentuk dengan tipe data `ENUM` yang benar.
- Pastikan parameter ter-seed dengan nilai default yang sesuai.

### 5.2 Tes Fungsional UI & Kalkulasi
- Verifikasi penambahan kegiatan kerja kustom/template dengan memilih berbagai prioritas berbeda di UI.
- Verifikasi perhitungan otomatis skor kegiatan di frontend berubah secara real-time saat status selesai atau prioritas diubah.
- Verifikasi skor kegiatan yang disimpan ke database setelah dikirim (*submit*) sama persis dengan perhitungan estimasi di UI.
