# Design Spec: Static Shift Options in Pengajuan Tukar Dinas

Date: 2026-09-05
Status: Approved

## Background
Tabel database `pengajuan_tudin` mendefinisikan kolom `shift1` dan `shift2` sebagai:
```sql
`shift1` enum('Pagi','Siang','Malam') NOT NULL COMMENT 'Shift pemohon',
`shift2` enum('Pagi','Siang','Malam') NOT NULL COMMENT 'Shift pengganti',
```
Namun di `/dashboard/pengajuan-tukar-dinas`, frontend saat ini memanggil `/api/jam-jaga?departemen=...` secara dinamis. Bila departemen memiliki shift selain ketiga nilai tersebut, input gagal atau tidak konsisten dengan schema database.

## Requirements
1. Pilihan shift pada form pengajuan tukar dinas (`shift1` dan `shift2`) diubah menjadi statis: hanya `Pagi`, `Siang`, dan `Malam`.
2. Hapus pemanggilan API `/api/jam-jaga` yang tidak lagi diperlukan di hook `usePengajuanTukarDinas`.
3. Tambahkan validasi pada backend endpoint `POST /api/pengajuan-tukar-dinas` agar menolak nilai shift di luar `['Pagi', 'Siang', 'Malam']`.

## Architecture & Component Changes

### 1. `src/hooks/usePengajuanTukarDinas.js`
- Deklarasikan konstan `const STATIC_SHIFTS = ["Pagi", "Siang", "Malam"];`.
- Inisialisasi state `shiftData` dengan `STATIC_SHIFTS`.
- Hapus fungsi `fetchShiftData()` dan `useEffect` yang memanggilnya saat `userDepartmentId` berubah.
- Tetap return `shiftData` untuk menjaga backward compatibility interface hook.

### 2. `src/components/PengajuanFormModal.jsx`
- Sederhanakan `availableShifts` agar langsung menggunakan `DEFAULT_SHIFTS = ["Pagi", "Siang", "Malam"]`.
- Hapus fallback mapping dinamis yang kompleks.

### 3. `src/app/api/pengajuan-tukar-dinas/route.js`
- Definisikan `const VALID_SHIFTS = ["Pagi", "Siang", "Malam"];` pada handler `POST`.
- Tambahkan validasi:
  ```javascript
  if (!VALID_SHIFTS.includes(shift1) || !VALID_SHIFTS.includes(shift2)) {
      return NextResponse.json(
          { message: "Shift harus salah satu dari: Pagi, Siang, atau Malam" },
          { status: 400 }
      );
  }
  ```

## Verification Plan
1. Linter / build check pada workspace `sdm`.
2. Verifikasi form pengajuan tukar dinas menampilkan dropdown shift hanya berisi `Pagi`, `Siang`, `Malam`.
3. Verifikasi pemanggilan network ke `/api/jam-jaga` sudah tidak terjadi saat membuka halaman `/dashboard/pengajuan-tukar-dinas`.
4. Verifikasi validasi API menolak shift tidak valid.
