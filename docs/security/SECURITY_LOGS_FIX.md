# Security Logs Fix - ReferenceError: securityResult is not defined

## Problem

Error di production log menunjukkan:

```
ReferenceError: securityResult is not defined
at <unknown> (.next/server/app/api/attendance/route.js:118:6000)
```

## Root Cause

Variabel `securityResult` didefinisikan di dalam blok `if (process.env.ENABLE_SECURITY_LOGS === "true")` tapi kemudian digunakan di luar blok tersebut pada baris 942.

### Code yang Bermasalah:

```javascript
// Simpan security log (hanya jika diaktifkan)
if (process.env.ENABLE_SECURITY_LOGS === "true") {
	const securityResult = await transactionHelpers.insert(transaction, {
		table: "security_logs",
		data: {
			/* ... */
		},
	});
}

// ... kode lain ...

return {
	presensi: presensiResult,
	geolocation: geoResult,
	security: securityResult, // ❌ Error: securityResult tidak terdefinisi jika ENABLE_SECURITY_LOGS = false
	status,
	keterlambatan,
	// ...
};
```

## Solution

Inisialisasi variabel `securityResult` dengan nilai `null` di luar blok `if` dan gunakan `let` alih-alih `const`.

### Code yang Diperbaiki:

```javascript
let securityResult = null;

// Simpan security log (hanya jika diaktifkan)
if (process.env.ENABLE_SECURITY_LOGS === "true") {
	securityResult = await transactionHelpers.insert(transaction, {
		table: "security_logs",
		data: {
			/* ... */
		},
	});
}

// ... kode lain ...

return {
	presensi: presensiResult,
	geolocation: geoResult,
	security: securityResult, // ✅ Aman: akan null jika ENABLE_SECURITY_LOGS = false
	status,
	keterlambatan,
	// ...
};
```

## Changes Made

### File: `src/app/api/attendance/route.js`

- **Line 895**: Inisialisasi `let securityResult = null;` sebelum blok `if`
- **Line 897**: Ubah `const securityResult` menjadi `securityResult =` (assignment)

## Testing

### Test Case 1: ENABLE_SECURITY_LOGS = true

```bash
# Set environment variable
export ENABLE_SECURITY_LOGS=true

# Test checkin
curl -X POST "https://yourdomain.com/api/attendance" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "photo": "data:image/jpeg;base64,/9j/4AAQ...",
    "timestamp": "2025-01-XX...",
    "latitude": -6.123456,
    "longitude": 106.123456,
    "isCheckingOut": false,
    "securityData": {
      "confidence": 85,
      "accuracy": 10,
      "warnings": []
    }
  }'

# Expected: Success with security log created
```

### Test Case 2: ENABLE_SECURITY_LOGS = false

```bash
# Set environment variable
export ENABLE_SECURITY_LOGS=false

# Test checkin
curl -X POST "https://yourdomain.com/api/attendance" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "photo": "data:image/jpeg;base64,/9j/4AAQ...",
    "timestamp": "2025-01-XX...",
    "latitude": -6.123456,
    "longitude": 106.123456,
    "isCheckingOut": false,
    "securityData": {
      "confidence": 85,
      "accuracy": 10,
      "warnings": []
    }
  }'

# Expected: Success without security log (security: null in response)
```

## Verification

### Check Logs

```bash
# Monitor logs untuk memastikan tidak ada error
pm2 logs sdm-app | grep -i "security\|error"

# Expected: No ReferenceError messages
```

### Check Database

```sql
-- Check if security logs are created when enabled
SELECT COUNT(*) as total_logs FROM security_logs WHERE DATE(created_at) = CURDATE();

-- Check if no logs when disabled
-- (Should be 0 when ENABLE_SECURITY_LOGS = false)
```

## Environment Variables

### Required

```env
# Enable/disable security logs
ENABLE_SECURITY_LOGS=true  # or false

# Other required variables
JWT_SECRET=your-secret-key
NEXT_PUBLIC_URL=https://yourdomain.com
```

## Impact

### Before Fix

- ❌ Error 500 saat `ENABLE_SECURITY_LOGS = false`
- ❌ Transaction rollback
- ❌ Presensi gagal disimpan

### After Fix

- ✅ Presensi berhasil disimpan dengan atau tanpa security logs
- ✅ No error di production
- ✅ Graceful handling ketika security logs dinonaktifkan

## Related Files

- `src/app/api/attendance/route.js` - Main fix
- `src/app/api/admin/security-logs/route.js` - Security logs API
- `src/app/api/admin/security-stats/route.js` - Security stats API

## Notes

- Fix ini tidak mempengaruhi fungsionalitas security logs ketika diaktifkan
- Response akan tetap konsisten dengan `security: null` ketika dinonaktifkan
- Tidak ada breaking changes untuk frontend
