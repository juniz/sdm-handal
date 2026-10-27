# Perbesar Lebar Modal Mapping Jenis Pegawai — Design Spec

**Date:** 2026-10-27  
**File:** `src/components/penggajian/MappingJenisModal.jsx`

---

## 1. Goal

Perbesar lebar modal Mapping Jenis Pegawai agar muat tabel 6 kolom dengan leluasa, mengatasi override `sm:max-w-lg` dari Radix Dialog default.

---

## 2. Changes

Di `src/components/penggajian/MappingJenisModal.jsx`:
1. `DialogContent`:
   - Ganti `max-w-4xl` jadi `sm:max-w-6xl w-[95vw]`.
2. Area scroll tabel:
   - Ganti `max-h-[460px]` jadi `max-h-[60vh]`.

---

## 3. Verification

Buka modal Mapping Jenis Pegawai di browser, verifikasi lebar modal mencapai ~1152px di layar desktop.
