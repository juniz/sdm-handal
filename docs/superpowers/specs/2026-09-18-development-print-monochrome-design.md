# Desain Cetak Monokrom & Kop Resmi /dashboard/development

## 1. Tujuan
Mengubah hasil print dan export PDF menu pengajuan development menjadi format monokrom (hitam-putih) resmi kedinasan dan menambahkan Kop resmi instansi sesuai standar `/dashboard/penggajian/data-gaji`.

---

## 2. Format Kop Kedinasan
- Logo: `/logo-kop.png` (sisi kiri, height 50px).
- Teks Header:
  - Baris 1: `POLRI DAERAH JAWA TIMUR`
  - Baris 2: `BIDANG KEDOKTERAN DAN KESEHATAN`
  - Baris 3: `RUMAH SAKIT BHAYANGKARA TK. III NGANJUK`
- Garis Pembatas: Garis ganda hitam solid (`border-b-2 border-black` dan `border-b border-black`).

---

## 3. Spesifikasi Monokrom
- Latar Belakang: Putih murni (`bg-white`).
- Warna Teks: Hitam pekat (`text-black`). Tidak ada warna abu-abu/warna highlight.
- Garis & Border: Hitam pekat (`border-black`).
- Badge Status & Prioritas: Teks kapital berbingkai garis hitam tipis (`border border-black px-1.5 py-0.5 text-[9px] font-bold`).
- Header Tabel: Teks kapital hitam tebal bergaris hitam solid.
- Kotak Pengesahan & Statistik: Berbingkai garis hitam tegas.

---

## 4. File Terdampak
1. `src/components/development/DevelopmentListPrintView.jsx`: Terapkan kop resmi dan tabel rekap monokrom.
2. `src/components/development/DevelopmentDetailPrintView.jsx`: Terapkan kop resmi dan formulir detail monokrom.

---

## 5. Rencana Pengujian
1. Buka modal Cetak Rekap di `/dashboard/development`, pastikan kop resmi tampil dan seluruh tabel berformat hitam-putih pekat.
2. Buka modal Cetak Form di `/dashboard/development/[id]`, pastikan form memiliki kop resmi dan kotak tanda tangan monokrom.
3. Uji cetak browser (`window.print()`) dan unduh PDF.
