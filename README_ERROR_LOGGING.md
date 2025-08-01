# 📊 Sistem Error Logging - SDM App

Sistem pencatatan dan monitoring error untuk membantu admin mengetahui masalah yang dialami user.

## 🎯 **Features**

- 🔍 **Real-time Error Monitoring** - Monitoring error real-time
- 📊 **Error Statistics** - Statistik error berdasarkan severity
- 🔍 **Advanced Filtering** - Filter berdasarkan severity, status, tanggal
- 📋 **Detailed Error Logs** - Informasi lengkap error dengan context
- ✅ **Status Management** - Kelola status resolusi error
- 📥 **Export Data** - Export error logs ke CSV

## 🏗️ **Komponen Sistem**

### **1. Database**

- `error_logs` - Tabel utama untuk menyimpan error logs
- `error_resolutions` - Tabel untuk tracking resolusi error

### **2. API Endpoints**

- `POST /api/error-logs` - Log error baru
- `GET /api/error-logs` - Ambil daftar error (Admin only)
- `PUT /api/error-logs` - Update status error

### **3. Frontend**

- `useErrorLogger` hook untuk logging error
- Admin dashboard di `/dashboard/admin/error-logs`
- Global error handlers

## 🚀 **Cara Penggunaan**

### **1. Install Database Tables**

Jalankan script SQL di `error_logs_table.sql`

### **2. Menggunakan Hook**

```javascript
import { useErrorLogger } from "@/hooks/useErrorLogger";

const { logError } = useErrorLogger();

await logError({
	error: new Error("Something went wrong"),
	errorType: "ComponentError",
	componentName: "MyComponent",
	actionAttempted: "User action",
	severity: "HIGH",
});
```

### **3. Access Admin Dashboard**

- Hanya user dengan role Admin yang bisa akses
- Menu "Error Logs" akan muncul di sidebar
- URL: `/dashboard/admin/error-logs`

## 📊 **Severity Levels**

| Level      | Description                        |
| ---------- | ---------------------------------- |
| `LOW`      | Error minor, tidak mengganggu flow |
| `MEDIUM`   | Error sedang, mempengaruhi fitur   |
| `HIGH`     | Error penting, mengganggu UX       |
| `CRITICAL` | Error kritis, mengganggu sistem    |

## ✅ **Status Resolusi**

| Status     | Description                |
| ---------- | -------------------------- |
| `NEW`      | Error baru, belum direview |
| `REVIEWED` | Sudah dilihat admin        |
| `RESOLVED` | Sudah diperbaiki           |
| `IGNORED`  | Diabaikan (false positive) |

## 🔧 **Implementation Status**

✅ **Database schema**
✅ **API endpoints**  
✅ **Error logging hook**
✅ **Admin dashboard**
✅ **Global error handlers**
✅ **Integration in components**

**Sistem sudah siap digunakan!** 🚀

Admin sekarang bisa monitoring error yang dialami user secara real-time melalui dashboard khusus.

# Error Logging System - Environment Configuration

## Overview

Sistem error logging dapat dikontrol melalui environment variable untuk mengoptimalkan performa dan mengurangi beban database di production.

## Environment Variables

### 1. `DEBUG` (Server-side)

- **Tipe**: Boolean
- **Default**: `false`
- **Deskripsi**: Mengontrol apakah error akan disimpan ke database di server-side
- **Lokasi**: API endpoint `/api/error-logs`

### 2. `NEXT_PUBLIC_DEBUG` (Client-side)

- **Tipe**: Boolean
- **Default**: `false`
- **Deskripsi**: Mengontrol apakah error akan dikirim ke server dari client-side
- **Lokasi**: Global error handler di `layout.js`

### 3. `NEXT_PUBLIC_MENU_ADMIN` (Client-side)

- **Tipe**: Boolean
- **Default**: `false`
- **Deskripsi**: Mengontrol apakah menu admin (QuickActions) ditampilkan di dashboard
- **Lokasi**: Dashboard page (`src/app/dashboard/page.js`)
- **Catatan**: Harus menggunakan `=== 'true'` untuk pengecekan yang benar

## Konfigurasi

### Development Environment

```bash
# .env.local
DEBUG=true
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_MENU_ADMIN=true
```

### Production Environment

```bash
# .env.production
DEBUG=false
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_MENU_ADMIN=false
```

### Staging Environment

```bash
# .env.staging
DEBUG=true
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_MENU_ADMIN=true
```

## Cara Kerja

### Client-Side (Browser)

1. Global error handler mengecek `NEXT_PUBLIC_DEBUG`
2. Jika `false`: Error tidak dikirim ke server, hanya console warning
3. Jika `true`: Error dikirim ke `/api/error-logs`

### Server-Side (API)

1. API endpoint mengecek `DEBUG`
2. Jika `false`: Return success tanpa menyimpan ke database
3. Jika `true`: Error disimpan ke database seperti biasa

### Menu Admin Control

1. Dashboard mengecek `NEXT_PUBLIC_MENU_ADMIN === 'true'`
2. Jika `false`: QuickActions menu tidak ditampilkan
3. Jika `true`: QuickActions menu ditampilkan

## Contoh Response

### Debug Disabled (Client)

```javascript
// Console warning
console.warn(
	"Error logging disabled. Set NEXT_PUBLIC_DEBUG=true to enable error logging."
);
```

### Debug Disabled (Server)

```json
{
	"success": true,
	"message": "Error logging disabled. Set DEBUG=true to enable error logging."
}
```

## Troubleshooting

### Menu Admin masih muncul meski NEXT_PUBLIC_MENU_ADMIN=false

**Penyebab**: Environment variable tidak dikenali sebagai boolean
**Solusi**:

```javascript
// ❌ Salah - akan selalu truthy jika variable ada
{
	process.env.NEXT_PUBLIC_MENU_ADMIN ? <Component /> : null;
}

// ✅ Benar - mengecek nilai boolean yang tepat
{
	process.env.NEXT_PUBLIC_MENU_ADMIN === "true" ? <Component /> : null;
}
```

### Error tidak muncul di admin panel

1. Pastikan `DEBUG=true` di environment
2. Restart server setelah ubah environment variable
3. Cek browser console untuk client-side errors

### Error masih tersimpan meski DEBUG=false

1. Pastikan environment variable sudah benar
2. Cek apakah ada cache di browser
3. Restart development server

## Best Practices

1. **Development**: Selalu set `DEBUG=true` dan `NEXT_PUBLIC_MENU_ADMIN=true`
2. **Production**: Selalu set `DEBUG=false` dan `NEXT_PUBLIC_MENU_ADMIN=false`
3. **Staging**: Set `DEBUG=true` dan `NEXT_PUBLIC_MENU_ADMIN=true` untuk testing
4. **Environment Variable Check**: Selalu gunakan `=== 'true'` untuk boolean check
5. **Monitoring**: Gunakan tools external untuk production monitoring
