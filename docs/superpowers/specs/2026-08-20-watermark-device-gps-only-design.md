# Desain: Penegasan Koordinat Murni GPS Perangkat pada Watermark Foto Presensi

**Tanggal:** 2026-08-20  
**Status:** Draft / Pending Review  
**Tujuan:** Memastikan informasi `Lat` dan `Long` (beserta alamat reverse geocoding dan mini map) pada watermark foto presensi 100% murni merefleksikan posisi GPS perangkat fisik pegawai, dan tidak pernah menggunakan/menampilkan koordinat kantor dari environment variable sebagai posisi pegawai.

---

## 1. Prinsip & Batasan

1. **Koordinat Pegawai (`latitude`, `longitude`)**:
   - Diperoleh eksklusif dari API Geolocation browser/perangkat (`navigator.geolocation` / `useLocationSecurity`).
   - Digunakan untuk:
     - Teks koordinat pada watermark (`🌐 Lat: -7.xxxxxx, Long: 110.xxxxxx`).
     - Titik pencarian alamat reverse geocoding (`📍 [Alamat]`).
     - Titik tengah *mini map thumbnail* pada watermark.
     - Payload pengiriman presensi ke server.
   - **Dilarang keras**: Mengganti atau melakukan fallback koordinat pegawai dengan nilai `NEXT_PUBLIC_OFFICE_LAT` / `NEXT_PUBLIC_OFFICE_LNG`.
2. **Koordinat Kantor (`NEXT_PUBLIC_OFFICE_LAT`, `NEXT_PUBLIC_OFFICE_LNG`)**:
   - Hanya digunakan secara internal sebagai titik tujuan (*destination reference*) untuk menghitung jarak:  
     `distance = calculateDistance(deviceLat, deviceLng, officeLat, officeLng)`
   - Hanya dicantumkan dalam konteks hasil jarak: `📏 Jarak Kantor: 45m (Radius: 500m - Valid)`.

---

## 2. Rencana Perubahan Berkas

| No | Berkas | Aksi | Deskripsi Perubahan |
|---|---|---|---|
| 1 | `src/app/dashboard/attendance/page.js` | **MODIFY** | Hapus fallback ke `NEXT_PUBLIC_OFFICE_LAT`/`LNG` pada fungsi `getRobustLocation` agar posisi selalu murni dari GPS perangkat. |
| 2 | `src/utils/imageOptimizer.js` | **MODIFY** | Pastikan format `Lat` dan `Long` selalu menampilkan nilai float koordinat perangkat yang valid. |

---

## 3. Rencana Verifikasi

1. **Uji Koordinat Perangkat**:
   - Lakukan presensi: verifikasi nilai `Lat` dan `Long` pada watermark foto sesuai dengan koordinat GPS aktual perangkat saat ini.
2. **Uji Nilai Jarak**:
   - Pastikan jarak dihitung antara koordinat perangkat dan koordinat kantor `NEXT_PUBLIC_OFFICE_LAT` & `LNG`.
3. **Uji Build**:
   - Jalankan `npm run build` untuk memverifikasi tidak ada error kompilasi.
