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

### 4. `NEXT_PUBLIC_DISABLE_NOTIFICATIONS` (Client-side)

Environment variable untuk mendisable semua komponen notifikasi di aplikasi.

**Nilai yang tersedia:**

- `true` - Menonaktifkan semua notifikasi
- `false` - Mengaktifkan notifikasi (default)

**Komponen yang terpengaruh:**

- `NotificationAlert` - Alert banner di dashboard
- `NotificationBell` - Bell icon di desktop header
- `FloatingNotification` - Floating button di mobile

**Contoh penggunaan:**

```bash
# Development - notifikasi aktif
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false

# Production - notifikasi nonaktif
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true

# Staging - notifikasi aktif untuk testing
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false
```

**Implementasi di komponen:**

```jsx
const NotificationComponent = () => {
	// Disable notifications jika environment variable diset ke true
	if (process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === "true") {
		return null;
	}

	// ... rest of component logic
};
```

**Catatan:**

- Menggunakan prefix `NEXT_PUBLIC_` untuk client-side access
- Perubahan memerlukan restart aplikasi
- Semua komponen notification akan otomatis hidden jika diset ke `true`

## Konfigurasi

### Development Environment

```

```
