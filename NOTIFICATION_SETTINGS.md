# Notification Settings Documentation

## Overview

Dokumentasi untuk mengatur notifikasi di aplikasi SDM Handal menggunakan environment variables.

## Environment Variables

### `NEXT_PUBLIC_DISABLE_NOTIFICATIONS`

Environment variable untuk mendisable semua komponen notifikasi di aplikasi.

**Nilai yang tersedia:**

- `true` - Menonaktifkan semua notifikasi
- `false` - Mengaktifkan notifikasi (default)

**Komponen yang terpengaruh:**

- `NotificationAlert` - Alert banner di dashboard
- `NotificationBell` - Bell icon di desktop header
- `FloatingNotification` - Floating button di mobile

## Konfigurasi Environment

### Development Environment

```bash
# .env.local
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false
```

### Production Environment

```bash
# .env.production
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true
```

### Staging Environment

```bash
# .env.staging
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false
```

## Implementasi di Komponen

### NotificationAlert.js

```jsx
const NotificationAlert = () => {
	// Disable notifications jika environment variable diset ke true
	if (process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === "true") {
		return null;
	}

	// ... rest of component logic
};
```

### NotificationBell.js

```jsx
const NotificationBell = () => {
	// Disable notifications jika environment variable diset ke true
	if (process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === "true") {
		return null;
	}

	// ... rest of component logic
};
```

### FloatingNotification.js

```jsx
const FloatingNotification = () => {
	// Disable notifications jika environment variable diset ke true
	if (process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === "true") {
		return null;
	}

	// ... rest of component logic
};
```

## Cara Kerja

1. **Environment Check**: Setiap komponen notification mengecek `NEXT_PUBLIC_DISABLE_NOTIFICATIONS`
2. **Conditional Rendering**: Jika diset ke `"true"`, komponen return `null` (tidak render)
3. **Default Behavior**: Jika `false` atau tidak diset, notifikasi berfungsi normal

## Best Practices

1. **Development**: Set `NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false` untuk testing
2. **Production**: Set `NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true` untuk disable notifikasi
3. **Staging**: Set `NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false` untuk testing
4. **Boolean Check**: Selalu gunakan `=== "true"` untuk pengecekan yang tepat

## Troubleshooting

### Notifikasi masih muncul meski NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true

**Penyebab**: Environment variable tidak dikenali atau cache browser
**Solusi**:

1. Restart development server
2. Clear browser cache
3. Pastikan environment variable sudah benar

### Notifikasi tidak muncul meski NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false

**Penyebab**: Environment variable tidak ter-set dengan benar
**Solusi**:

1. Cek file `.env` atau environment configuration
2. Pastikan menggunakan `NEXT_PUBLIC_` prefix
3. Restart aplikasi

## Contoh Penggunaan

### Disable Notifikasi untuk Maintenance

```bash
# Saat maintenance, disable semua notifikasi
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true
```

### Enable Notifikasi untuk Development

```bash
# Saat development, enable notifikasi untuk testing
NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false
```

### Conditional Notifikasi

```jsx
// Contoh implementasi conditional notification
const ConditionalNotification = () => {
	const isNotificationEnabled =
		process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS !== "true";
	const isITUser = user?.departemen === "IT";

	if (!isNotificationEnabled || !isITUser) {
		return null;
	}

	return <NotificationComponent />;
};
```
