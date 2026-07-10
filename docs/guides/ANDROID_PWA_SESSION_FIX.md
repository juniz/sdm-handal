# Solusi Session Persistence Android PWA

## Masalah yang Diselesaikan

Pengguna Android PWA mengalami logout otomatis ketika aplikasi diminimize atau ditutup, meskipun sebelumnya sudah login. Masalah ini terjadi karena:

1. **Cookie `sameSite: "strict"`** terlalu ketat untuk Android WebView/PWA
2. **PWA standalone mode** menyebabkan isolasi session
3. **Android app lifecycle** menghapus cookie saat minimize/restore
4. **Tidak ada mekanisme token refresh** atau grace period
5. **Masalah konektivitas jaringan** saat app resume

## Solusi Komprehensif

### 1. Enhanced Cookie Configuration

**File: `src/lib/client-auth.js` & `src/lib/auth.js`**

```javascript
// Ubah dari sameSite: "strict" ke "lax"
sameSite: "lax"; // Lebih kompatibel dengan Android WebView/PWA
```

### 2. Dual Storage System (Cookie + localStorage)

**File: `src/lib/client-auth.js`**

- **Primary Storage**: HTTP Cookies (untuk server-side validation)
- **Backup Storage**: localStorage (untuk client-side persistence)
- **PWA Storage**: Dedicated PWA localStorage keys

```javascript
// Simpan di multiple storage
setClientToken(token) {
    // Cookie utama
    Cookies.set("auth_token", token, { sameSite: "lax" });

    // Backup localStorage
    localStorage.setItem("auth_token_backup", token);
    localStorage.setItem("auth_token_timestamp", Date.now().toString());

    // PWA specific storage
    if (isPWAMode()) {
        localStorage.setItem("auth_token_pwa", token);
        localStorage.setItem("auth_pwa_timestamp", Date.now().toString());
    }
}
```

### 3. PWA Detection & Handler

**File: `src/components/PWAHandler.js`**

Komponen yang menangani:

- **Visibility changes** (app minimize/resume)
- **Page lifecycle events** (focus/blur, show/hide)
- **Service Worker communication**
- **Keep-alive mechanism**
- **Auto token restoration**

```javascript
// Deteksi PWA mode
export function isPWAMode() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		window.navigator.standalone ||
		document.referrer.includes("android-app://")
	);
}
```

### 4. Enhanced Service Worker

**File: `public/sw.js`**

Fitur tambahan:

- **Message handling** untuk sync auth state
- **Background sync** untuk session keepalive
- **Enhanced caching** dengan NetworkFirst strategy
- **Auth state synchronization** across tabs

### 5. Middleware Improvements

**File: `src/middleware.js`**

- **Grace period** untuk expired tokens di Android
- **Network error handling** yang lebih baik
- **Prevent immediate logout** pada temporary errors

### 6. Login Page Enhancement

**File: `src/app/page.js`**

- **Auto-restore mechanism** saat page load
- **Force restore from backup** jika cookie hilang
- **Improved error handling**

## Fitur Utama

### 1. Multi-Layer Token Persistence

```
Layer 1: HTTP Cookies (Primary)
Layer 2: localStorage backup (Fallback)
Layer 3: PWA localStorage (PWA-specific)
Layer 4: Service Worker sync (Cross-tab)
```

### 2. PWA Lifecycle Management

```javascript
// App Events yang ditangani:
- visibilitychange (minimize/resume)
- focus/blur (window focus)
- pageshow/pagehide (navigation)
- beforeunload (app closing)
- storage events (cross-tab sync)
```

### 3. Intelligent Token Selection

```javascript
// Pilih token terbaru dari multiple sources
if (pwaToken && pwaTimestamp > backupTimestamp) {
	selectedToken = pwaToken; // Use PWA token
} else {
	selectedToken = backupToken; // Use backup token
}
```

### 4. Keep-Alive Mechanism

```javascript
// Ping setiap 30 detik untuk keep session alive
setInterval(() => {
	// Ping service worker
	// Backup current auth
	// Update last active time
}, 30000);
```

## Konfigurasi PWA

### 1. Next.js PWA Config

**File: `next.config.js`**

```javascript
const withPWA = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: false,
	runtimeCaching: [
		{
			urlPattern: /^https?.*/,
			handler: "NetworkFirst", // Prioritas network untuk fresh data
			options: {
				cacheName: "offlineCache",
				expiration: { maxAgeSeconds: 24 * 60 * 60 },
			},
		},
	],
});
```

### 2. PWA Manifest

**File: `public/manifest.json`**

```json
{
	"name": "SDM Handal",
	"display": "standalone",
	"start_url": "/",
	"theme_color": "#2563eb",
	"background_color": "#ffffff"
}
```

### 3. Meta Tags untuk Android

**File: `src/app/layout.js`**

```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="application-name" content="SDM Handal" />
<meta name="msapplication-tap-highlight" content="no" />
```

## Offline Support

### Enhanced Offline Page

**File: `public/offline.html`**

Fitur:

- **Connection status monitoring**
- **Session restoration button**
- **Auto-reconnect mechanism**
- **Visual feedback** untuk user

## Testing & Debugging

### 1. Console Logs

```javascript
// Debug logs untuk tracking:
console.log("PWA Handler initialized, isPWA:", isPWA);
console.log("Token restored from backup, age:", tokenAge);
console.log("App resumed, checking auth state");
```

### 2. localStorage Inspection

```javascript
// Check di browser console:
localStorage.getItem("auth_token_backup");
localStorage.getItem("auth_token_pwa");
localStorage.getItem("auth_token_timestamp");
```

### 3. Service Worker Status

```javascript
// Check service worker:
navigator.serviceWorker.ready.then((registration) => {
	console.log("SW ready:", registration);
});
```

## Deployment

### 1. Build & Deploy

```bash
npm run build
npm run pm2:restart
```

### 2. Verify PWA

1. Buka Chrome DevTools
2. Go to Application tab
3. Check Service Workers
4. Check Storage (localStorage)
5. Test offline mode

## Monitoring

### 1. Error Tracking

Semua error PWA akan tercatat di:

- Browser console
- Server error logs
- Service worker logs

### 2. Session Analytics

Track:

- Token restoration success rate
- PWA usage patterns
- Offline/online transitions

## Troubleshooting

### 1. Session Masih Hilang

```javascript
// Force clear dan reset
localStorage.clear();
// Unregister service worker
navigator.serviceWorker.getRegistrations().then((registrations) => {
	registrations.forEach((registration) => registration.unregister());
});
// Hard refresh
location.reload(true);
```

### 2. PWA Tidak Terdeteksi

```javascript
// Manual check PWA mode
console.log(
	"Standalone:",
	window.matchMedia("(display-mode: standalone)").matches
);
console.log("Navigator standalone:", window.navigator.standalone);
console.log("Referrer:", document.referrer);
```

### 3. Service Worker Issues

```javascript
// Check SW registration
navigator.serviceWorker.getRegistration().then((registration) => {
	if (registration) {
		console.log("SW registered:", registration);
	} else {
		console.log("No SW registration found");
	}
});
```

## Hasil

Dengan implementasi ini, pengguna Android PWA akan:

1. ✅ **Tetap login** setelah minimize/restore app
2. ✅ **Auto-restore session** dari backup storage
3. ✅ **Seamless experience** tanpa perlu login ulang
4. ✅ **Offline support** dengan session restoration
5. ✅ **Cross-tab synchronization** untuk consistency
6. ✅ **Robust error handling** untuk network issues

## Catatan Penting

- **Token expiry**: 7 hari (configurable)
- **Keep-alive interval**: 30 detik
- **Grace period**: Untuk expired tokens di Android
- **Fallback mechanism**: Multiple storage layers
- **Performance**: Minimal impact dengan lazy loading

Solusi ini memberikan pengalaman PWA yang native-like di Android dengan session persistence yang robust dan user-friendly.
