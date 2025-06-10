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
