# Desain: Peningkatan Kualitas & Ketajaman Foto Presensi (HD 960p / File Efisien)

**Tanggal:** 2026-08-20  
**Status:** Draft / Pending Review  
**Tujuan:** Meningkatkan ketajaman dan kejelasan visual foto presensi masuk pegawai (wajah dan watermark teks/peta) ke resolusi HD tanpa membebani storage dan bandwidth server dengan menerapkan *single-pass high-fidelity compression* target ukuran ~120–200 KB.

---

## 1. Analisis Masalah & Solusi

| Aspek | Kondisi Lama | Solusi Baru (HD 960p Efisien) |
|---|---|---|
| **Resolusi Sensor Kamera** | 480x480 (Mobile) / 640x480 (Desktop) | **960x960 px** (Mobile) / **1024x768 px** (Desktop) |
| **Pipa Kompresi** | *Double Compression* (Webcam $\to$ Watermark Canvas $\to$ Optimizer Canvas) | **Single-Pass Pipeline** (Webcam raw frame $\to$ Stamped Canvas export $\to$ Hasil final) |
| **Kualitas Canvas** | Default browser interpolation | `imageSmoothingEnabled = true`, `imageSmoothingQuality = "high"` |
| **Kualitas JPEG Final** | Kualitas terdegradasi ganda | **JPEG Quality: 0.85** (Presisi tinggi, artefak kompresi minimal) |
| **Estimasi Ukuran File** | ~60–90 KB (buram/pecah) | **~120–200 KB** (Sangat tajam, sangat ringan untuk server) |

---

## 2. Spesifikasi Teknis Komponen

### 2.1 Video Constraints Kamera ([`src/components/AttendanceCamera.jsx`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/components/AttendanceCamera.jsx))
- **Mobile (`isMobile = true`)**:
  ```javascript
  {
      facingMode: "user",
      width: { ideal: 960, min: 640, max: 1280 },
      height: { ideal: 960, min: 640, max: 1280 },
      aspectRatio: { ideal: 1, min: 0.8, max: 1.2 }
  }
  ```
- **Desktop (`isMobile = false`)**:
  ```javascript
  {
      facingMode: "user",
      width: { ideal: 1024, min: 768, max: 1920 },
      height: { ideal: 768, min: 576, max: 1080 },
      aspectRatio: { ideal: 4 / 3, min: 4 / 3, max: 16 / 9 }
  }
  ```
- **Screenshot Capture Dimensions**:
  - Mobile: `width: 960, height: 960, screenshotQuality: 0.95`
  - Desktop: `width: 1024, height: 768, screenshotQuality: 0.95`

### 2.2 Pipa Stamping & Kompresi Tunggal ([`src/utils/imageOptimizer.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/utils/imageOptimizer.js))
- Pada `stampGpsWatermark(dataUrl, metadata)`:
  - Mengaktifkan `ctx.imageSmoothingEnabled = true` dan `ctx.imageSmoothingQuality = "high"`.
  - Menggambar foto asli pada resolusi HD penuh.
  - Merender banner, mini map, dan font typography dengan *crisp anti-aliasing*.
  - Langsung mengekspor hasil akhir sebagai `canvas.toDataURL("image/jpeg", 0.85)`.
- Mengeliminasi kompresi sekunder berlebih di `AttendanceCamera.jsx` sehingga gambar tidak mengalami degradasi ganda.

---

## 3. Rencana Perubahan Berkas

| No | Berkas | Aksi | Deskripsi Perubahan |
|---|---|---|---|
| 1 | `src/components/AttendanceCamera.jsx` | **MODIFY** | Tingkatkan `getVideoConstraints` dan `getScreenshot` ke 960p/1024p, dan gunakan alur single-pass stamping. |
| 2 | `src/utils/imageOptimizer.js` | **MODIFY** | Aktifkan `imageSmoothingQuality = "high"`, optimasi rendering teks dan ekspor JPEG quality 0.85. |

---

## 4. Rencana Verifikasi

1. **Uji Resolusi & Ukuran File**:
   - Ambil foto presensi: periksa resolusi output (960x960 atau 1024x768).
   - Periksa ukuran file base64 yang dihasilkan: pastikan berada di rentang optimal **120 KB – 200 KB**.
2. **Uji Ketajaman Visual**:
   - Pastikan teks watermark, garis peta mini, dan detail wajah tajam serta bebas dari artefak blur.
3. **Uji Build**:
   - Jalankan `npm run build` untuk memverifikasi tidak ada error kompilasi.
