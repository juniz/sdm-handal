# PWA Configuration - Dynamic Manifest System

## Overview

Sistem PWA (Progressive Web App) yang dinamis dengan manifest yang dapat dikonfigurasi melalui environment variables. Manifest akan di-generate secara real-time berdasarkan konfigurasi environment.

## API Endpoints

- **Manifest**: `/api/manifest` - Dynamic PWA manifest
- **Favicon**: `/api/favicon` - Dynamic favicon
- **Apple Touch Icon**: `/api/apple-touch-icon` - Dynamic apple touch icon

## Environment Variables

### Basic PWA Configuration

#### 1. `NEXT_PUBLIC_APP_NAME`

- **Tipe**: String
- **Default**: "SDM Handal"
- **Deskripsi**: Nama lengkap aplikasi yang ditampilkan di app store dan splash screen

#### 2. `NEXT_PUBLIC_APP_SHORT_NAME`

- **Tipe**: String
- **Default**: "SDM Handal"
- **Deskripsi**: Nama singkat aplikasi untuk home screen

#### 3. `NEXT_PUBLIC_APP_DESCRIPTION`

- **Tipe**: String
- **Default**: "Aplikasi Manajemen SDM RS Bhayangkara Nganjuk"
- **Deskripsi**: Deskripsi aplikasi untuk SEO dan app store

#### 4. `NEXT_PUBLIC_APP_START_URL`

- **Tipe**: String
- **Default**: "/"
- **Deskripsi**: URL yang dibuka saat aplikasi dijalankan

#### 5. `NEXT_PUBLIC_APP_DISPLAY`

- **Tipe**: String
- **Default**: "standalone"
- **Opsi**: "standalone", "fullscreen", "minimal-ui", "browser"
- **Deskripsi**: Mode tampilan aplikasi

#### 6. `NEXT_PUBLIC_APP_BACKGROUND_COLOR`

- **Tipe**: String (Hex Color)
- **Default**: "#ffffff"
- **Deskripsi**: Warna background splash screen

#### 7. `NEXT_PUBLIC_APP_THEME_COLOR`

- **Tipe**: String (Hex Color)
- **Default**: "#2563eb"
- **Deskripsi**: Warna tema aplikasi untuk status bar

#### 8. `NEXT_PUBLIC_APP_ORIENTATION`

- **Tipe**: String
- **Default**: "portrait"
- **Opsi**: "portrait", "landscape", "any"
- **Deskripsi**: Orientasi layar yang diizinkan

### Favicon Configuration

#### 9. `NEXT_PUBLIC_FAVICON_PATH`

- **Tipe**: String
- **Default**: "/favicon.ico"
- **Deskripsi**: Path ke file favicon custom
- **Format**: Mendukung .ico, .png, .jpg, .jpeg, .svg, .webp
- **API**: `/api/favicon` - Dynamic favicon endpoint

### PWA Icons Configuration

#### Icon Variables (Optional)

Jika tidak diset, akan menggunakan default icons dari `/icons/`:

- `NEXT_PUBLIC_APP_ICON_72` - Icon 72x72px
- `NEXT_PUBLIC_APP_ICON_96` - Icon 96x96px
- `NEXT_PUBLIC_APP_ICON_128` - Icon 128x128px
- `NEXT_PUBLIC_APP_ICON_144` - Icon 144x144px
- `NEXT_PUBLIC_APP_ICON_152` - Icon 152x152px
- `NEXT_PUBLIC_APP_ICON_192` - Icon 192x192px (juga untuk apple-touch-icon)
- `NEXT_PUBLIC_APP_ICON_384` - Icon 384x384px
- `NEXT_PUBLIC_APP_ICON_512` - Icon 512x512px

### Advanced PWA Features

#### 10. `NEXT_PUBLIC_APP_SCOPE`

- **Tipe**: String
- **Default**: "/"
- **Deskripsi**: Scope aplikasi untuk service worker

#### 11. `NEXT_PUBLIC_APP_LANG`

- **Tipe**: String
- **Default**: "id"
- **Deskripsi**: Bahasa utama aplikasi

#### 12. `NEXT_PUBLIC_APP_DIR`

- **Tipe**: String
- **Default**: "ltr"
- **Opsi**: "ltr", "rtl"
- **Deskripsi**: Arah teks aplikasi

#### 13. `NEXT_PUBLIC_APP_CATEGORIES`

- **Tipe**: String (Comma-separated)
- **Default**: "business,productivity"
- **Deskripsi**: Kategori aplikasi untuk app store

#### 14. `NEXT_PUBLIC_APP_PREFER_RELATED_APPLICATIONS`

- **Tipe**: Boolean
- **Default**: false
- **Deskripsi**: Apakah prefer native app daripada PWA

### Related Applications

#### 15. `NEXT_PUBLIC_APP_ANDROID_PACKAGE`

- **Tipe**: String
- **Deskripsi**: Package name aplikasi Android

#### 16. `NEXT_PUBLIC_APP_ANDROID_URL`

- **Tipe**: String
- **Deskripsi**: URL Play Store (auto-generated jika tidak diset)

#### 17. `NEXT_PUBLIC_APP_IOS_APP_STORE_ID`

- **Tipe**: String
- **Deskripsi**: App Store ID aplikasi iOS

#### 18. `NEXT_PUBLIC_APP_IOS_URL`

- **Tipe**: String
- **Deskripsi**: URL App Store (auto-generated jika tidak diset)

## Konfigurasi Environment

### Development Environment

```bash
# .env.local
NEXT_PUBLIC_APP_NAME=SDM Handal Dev
NEXT_PUBLIC_APP_SHORT_NAME=SDM Dev
NEXT_PUBLIC_APP_DESCRIPTION=Aplikasi Manajemen SDM - Development
NEXT_PUBLIC_APP_THEME_COLOR=#dc2626
NEXT_PUBLIC_APP_BACKGROUND_COLOR=#fef2f2
NEXT_PUBLIC_FAVICON_PATH=/favicon-dev.ico
```

### Production Environment

```bash
# .env.production
NEXT_PUBLIC_APP_NAME=SDM Handal
NEXT_PUBLIC_APP_SHORT_NAME=SDM Handal
NEXT_PUBLIC_APP_DESCRIPTION=Aplikasi Manajemen SDM RS Bhayangkara Nganjuk
NEXT_PUBLIC_APP_THEME_COLOR=#2563eb
NEXT_PUBLIC_APP_BACKGROUND_COLOR=#ffffff
NEXT_PUBLIC_FAVICON_PATH=/favicon.ico
NEXT_PUBLIC_APP_ANDROID_PACKAGE=com.rsbhayangkaranganjuk.sdmhandal
NEXT_PUBLIC_APP_IOS_APP_STORE_ID=1234567890
```

### Staging Environment

```bash
# .env.staging
NEXT_PUBLIC_APP_NAME=SDM Handal Staging
NEXT_PUBLIC_APP_SHORT_NAME=SDM Staging
NEXT_PUBLIC_APP_DESCRIPTION=Aplikasi Manajemen SDM - Staging
NEXT_PUBLIC_APP_THEME_COLOR=#f59e0b
NEXT_PUBLIC_APP_BACKGROUND_COLOR=#fffbeb
NEXT_PUBLIC_FAVICON_PATH=/favicon-staging.ico
```

## Contoh Manifest Output

### Basic Manifest

```json
{
	"name": "SDM Handal",
	"short_name": "SDM Handal",
	"description": "Aplikasi Manajemen SDM RS Bhayangkara Nganjuk",
	"start_url": "/",
	"display": "standalone",
	"background_color": "#ffffff",
	"theme_color": "#2563eb",
	"orientation": "portrait",
	"icons": [
		{
			"src": "/icons/icon-72x72.png",
			"sizes": "72x72",
			"type": "image/png",
			"purpose": "any maskable"
		}
		// ... more icons
	]
}
```

### Advanced Manifest dengan Related Apps

```json
{
  "name": "SDM Handal",
  "short_name": "SDM Handal",
  "description": "Aplikasi Manajemen SDM RS Bhayangkara Nganjuk",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "scope": "/",
  "lang": "id",
  "dir": "ltr",
  "categories": ["business", "productivity"],
  "icons": [...],
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.example.sdmhandal",
      "id": "com.example.sdmhandal"
    },
    {
      "platform": "itunes",
      "url": "https://apps.apple.com/app/id1234567890",
      "id": "1234567890"
    }
  ]
}
```

## Cara Kerja

### 1. Dynamic Manifest Generation

- API endpoint `/api/manifest` membaca environment variables
- Generate manifest JSON secara real-time
- Mengembalikan response dengan header `application/manifest+json`

### 2. Dynamic Favicon System

- API endpoint `/api/favicon` membaca `NEXT_PUBLIC_FAVICON_PATH`
- Support berbagai format: .ico, .png, .jpg, .jpeg, .svg, .webp
- Fallback ke default favicon jika custom tidak ditemukan
- Cache 24 jam untuk performa optimal

### 3. Dynamic Apple Touch Icon

- API endpoint `/api/apple-touch-icon` membaca `NEXT_PUBLIC_APP_ICON_192`
- Support format: .png, .jpg, .jpeg, .svg, .webp
- Fallback ke default apple touch icon jika custom tidak ditemukan
- Cache 24 jam untuk performa optimal

### 4. Layout Integration

- `layout.js` menggunakan `/api/manifest` sebagai manifest URL
- `layout.js` menggunakan `/api/favicon` sebagai favicon URL
- `layout.js` menggunakan `/api/apple-touch-icon` sebagai apple touch icon URL
- Metadata dan viewport menggunakan environment variables
- Meta tags di head menggunakan environment variables

### 5. Caching Strategy

- Manifest di-cache selama 1 jam untuk performa
- Favicon dan Apple Touch Icon di-cache selama 24 jam
- Cache-Control header: `public, max-age=3600` (manifest) / `max-age=86400` (icons)
- Browser akan refresh sesuai cache policy

## Best Practices

### 1. Icon Management

- Gunakan format PNG untuk kompatibilitas maksimal
- Pastikan semua ukuran icon tersedia
- Gunakan `purpose: "any maskable"` untuk adaptive icons
- Favicon sebaiknya 16x16, 32x32, atau 48x48 pixels

### 2. Color Configuration

- Gunakan hex colors (#RRGGBB)
- Pastikan contrast ratio yang baik
- Test di berbagai device dan browser

### 3. Environment Management

- Gunakan prefix `NEXT_PUBLIC_` untuk client-side variables
- Set default values untuk semua required fields
- Dokumentasikan semua environment variables

### 4. Testing

- Test manifest di Chrome DevTools
- Validasi dengan Lighthouse PWA audit
- Test installability di berbagai device
- Test favicon di berbagai browser

## Troubleshooting

### Manifest tidak ter-load

1. Cek API endpoint `/api/manifest` berfungsi
2. Pastikan environment variables sudah benar
3. Cek browser console untuk error

### Favicon tidak muncul

1. Cek API endpoint `/api/favicon` berfungsi
2. Pastikan file favicon ada di public folder
3. Validasi format dan ukuran favicon
4. Cek browser cache

### PWA tidak bisa di-install

1. Validasi manifest dengan Lighthouse
2. Pastikan semua required fields ada
3. Cek service worker berfungsi

### Icon tidak muncul

1. Pastikan path icon benar
2. Cek file icon ada di public folder
3. Validasi format dan ukuran icon

## Monitoring

### Performance Monitoring

- Monitor response time `/api/manifest`
- Monitor response time `/api/favicon`
- Monitor response time `/api/apple-touch-icon`
- Track cache hit rate
- Monitor PWA install success rate

### Error Monitoring

- Log manifest generation errors
- Log favicon serving errors
- Track invalid environment variables
- Monitor PWA installation failures
