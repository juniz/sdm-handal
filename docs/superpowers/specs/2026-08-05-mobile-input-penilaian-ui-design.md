# Desain: Penyesuaian UI Mobile Input Penilaian Harian

**Tanggal:** 2026-08-05  
**Status:** Approved  
**Tujuan:** Meningkatkan UX pengisian penilaian harian pada perangkat mobile dengan (1) menampilkan catatan revisi supervisor di tab Laporan Kegiatan (tab depan) dan (2) merapikan susunan form input kegiatan agar tombol "Tambah" berada di bawah textarea penjabaran pada tampilan mobile.

---

## Konteks

Pada layar mobile:
1. Saat laporan dikembalikan oleh supervisor (status `revisi`), pegawai yang membuka halaman `/dashboard/penilaian-kinerja/input` berada pada tab default "Laporan Kegiatan". Catatan revisi yang selama ini hanya ditampilkan di tab "Status & Nilai" membuat pegawai kebingungan karena catatan revisi tidak terlihat langsung di halaman depan.
2. Form penambahan kegiatan memiliki 3 kolom input di baris pertama (Nama Kegiatan, Prioritas, Tombol Tambah) dan textarea di baris kedua. Pada layar smartphone kecil, tombol Tambah yang berada di baris pertama membuat bidang input Nama Kegiatan dan Prioritas terhimpit.

---

## Spesifikasi Perubahan UI

### 1. Banner Catatan Revisi Multi-Tab

- **Logika Condition:** `harianRecord?.status === "revisi"`
- **Penempatan:**
  - **Tab Laporan Kegiatan (`lg:col-span-2`):** Tampilkan banner catatan revisi di paling atas, persis di atas card `Daftar Kegiatan Kerja`.
  - **Tab Status & Nilai (`lg:col-span-1`):** Tetap pertahankan banner catatan revisi di kolom status.
- **Tampilan Visual:**
  - Container `bg-red-50 border border-red-200/80 p-4 rounded-2xl`
  - Icon `AlertTriangle text-red-500` + Judul `"Catatan Revisi Supervisor"` (font bold)
  - Teks catatan supervisor: `bg-white/80 p-3 rounded-xl border border-red-100 text-xs font-medium text-red-800 leading-relaxed`

---

### 2. Layout Responsif Form Tambah Kegiatan

Perubahan layout pada form tambah kegiatan di file `src/app/dashboard/penilaian-kinerja/input/page.js`:

#### Tampilan Mobile (`< md`)
1. **Input Nama Kegiatan** (width 100%) + Autocomplete dropdown.
2. **Select Prioritas** (width 100%).
3. **Textarea Penjabaran / Catatan Pekerjaan** (width 100%).
4. **Tombol "+ Tambah Kegiatan"** (width 100%, background `bg-primary-600`, text putih, font bold).

#### Tampilan Desktop (`≥ md`)
1. **Baris 1:** `[Nama Kegiatan (2 col)]` `[Prioritas (1 col)]` `[Tombol Tambah (1 col)]`
2. **Baris 2:** `[Textarea Penjabaran (full width)]`

---

## File yang Diubah

| File | Aksi | Keterangan |
|---|---|---|
| `src/app/dashboard/penilaian-kinerja/input/page.js` | **MODIFY** | Tambah banner catatan revisi pada tab kegiatan & sesuaikan layout responsif form tambah kegiatan |

---

## Checklist Implementasi

- [ ] Render banner `Catatan Revisi Supervisor` di bagian atas tab Laporan Kegiatan jika status = `revisi`.
- [ ] Restrukturisasi elemen `<form>` penambahan kegiatan dengan Tailwind responsive utilities (`md:grid-cols-4`, tombol `w-full md:w-auto`).
- [ ] Verifikasi `npm run build` bebas dari error prerender / compilation.
- [ ] Commit perubahan.
