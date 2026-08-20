# Desain: Reliable Reverse Geocoding & Mini Map Server-Side Proxy

**Tanggal:** 2026-08-20  
**Status:** Draft / Pending Review  
**Tujuan:** Menyediakan endpoint API server-side proxy di Next.js untuk pencarian nama jalan (*reverse geocoding*) dan rendering *mini map thumbnail* pada watermark foto presensi agar bebas dari CORS blocking, kegagalan request browser, serta menghasilkan nama jalan manusiawi yang rapi.

---

## 1. Latar Belakang & Masalah

1. Pemanggilan langsung ke `https://nominatim.openstreetmap.org/reverse` dari browser client sering gagal karena pembatasan CORS dan ketiadaan User-Agent resmi.
2. Ketika reverse geocoding gagal, watermark menampilkan teks fallback berupa angka float 16 desimal (`📍 Koordinat: -7.596561296803636, 111.91135948533108`) yang tampak seperti konfigurasi mentah.
3. Pemuatan gambar tile peta CartoDB secara langsung di browser client sering terblokir oleh kebijakan CORS / `Image.crossOrigin`.

---

## 2. Solusi Teknis

### 2.1 Endpoint API Reverse Geocode Server-Side ([`src/app/api/geo/reverse-geocode/route.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/geo/reverse-geocode/route.js))
- Menerima parameter `GET ?lat=...&lng=...`.
- Server Next.js memanggil OpenStreetMap Nominatim / BigDataCloud dengan header `User-Agent: SDM-Handal/1.0 (Hospital Attendance System)`.
- Mengurai alamat secara hierarkis (Jalan, Kelurahan/Desa, Kecamatan, Kota/Kabupaten).
- Mengembalikan response JSON: `{ address: "Jl. Basuki Rahmat, Ganung Kidul, Nganjuk" }`.

### 2.2 Endpoint API Map Tile Proxy ([`src/app/api/geo/map-tile/route.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/geo/map-tile/route.js))
- Menerima parameter `GET ?z=...&x=...&y=...`.
- Server Next.js mem-proxy raster tile dari CartoDB Voyager / OpenStreetMap dengan cache header (`Cache-Control: public, max-age=86400`).
- Mengembalikan citra gambar `image/png` dengan header `Access-Control-Allow-Origin: *` sehingga Canvas browser dapat menggambarnya secara aman tanpa *tainted canvas*.

### 2.3 Perbaikan Fallback Alamat pada Watermark ([`src/utils/imageOptimizer.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/utils/imageOptimizer.js))
- Jika alamat belum selesai dimuat atau offline, fallback teks alamat adalah:  
  `📍 Area GPS Terverifikasi (±${accuracy}m)` atau format koordinat rapi 6 desimal (`📍 Titik Lokasi: ${latStr}, ${longStr}`).
- **Dilarang**: Menampilkan deretan angka mentah 16 digit desimal.

---

## 3. Rencana Perubahan Berkas

| No | Berkas | Aksi | Deskripsi Perubahan |
|---|---|---|---|
| 1 | `src/app/api/geo/reverse-geocode/route.js` | **NEW** | API server-side reverse geocoding via OpenStreetMap/Nominatim. |
| 2 | `src/app/api/geo/map-tile/route.js` | **NEW** | API server-side proxy tile peta mini dengan CORS header. |
| 3 | `src/utils/geoHelper.js` | **MODIFY** | Arahkan `getReverseGeocode` dan `fetchMiniMapTile` ke endpoint internal `/api/geo/...`. |
| 4 | `src/utils/imageOptimizer.js` | **MODIFY** | Perbaiki format fallback alamat pada watermark agar rapi dan manusiawi. |

---

## 4. Rencana Verifikasi

1. **Uji Endpoint Server-Side**:
   - Panggil `/api/geo/reverse-geocode?lat=-7.596561&lng=111.911359` dan pastikan nama alamat jalan Nganjuk kembali secara rapi.
   - Panggil `/api/geo/map-tile?z=16&x=53140&y=33470` dan pastikan gambar tile PNG terkirim.
2. **Uji Watermark Foto**:
   - Ambil foto presensi: pastikan kotak peta mini muncul dengan pin merah di kiri, nama jalan tertera rapi di baris kedua, dan koordinat perangkat 6 desimal tercantum di baris ketiga.
3. **Uji Build**:
   - Jalankan `npm run build` untuk memverifikasi tidak ada error kompilasi.
