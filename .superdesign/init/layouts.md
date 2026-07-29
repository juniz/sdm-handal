# Shared Layouts

## Root Layout

- Path: `src/app/layout.js`
- Purpose: Indonesian-language document shell, Inter font, PWA metadata and safe-area viewport, global error logging, PWA handler, and Sonner toaster.
- Render structure:

```jsx
<html lang="id" translate="no">
	<head>
		<meta name="google" content="notranslate" />
		<link rel="manifest" href="/api/manifest" />
		<link rel="icon" href="/api/favicon" />
		<link rel="apple-touch-icon" href="/api/apple-touch-icon" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="mobile-web-app-capable" content="yes" />
	</head>
	<body className={`${inter.className} min-h-screen bg-gray-50`}>
		<PWAHandler />
		{children}
		<Toaster position="top-right" expand={true} richColors closeButton />
	</body>
</html>
```

The viewport uses `viewportFit: "cover"` and disables user scaling. Read the full implementation from `src/app/layout.js`.

## Dashboard Layout

- Path: `src/app/dashboard/layout.js`
- Purpose: authenticated application shell with off-canvas mobile sidebar, persistent desktop sidebar, dynamic navigation, user profile, notifications, and bottom navigation.
- Mobile behavior: sidebar is hidden off-canvas and `BottomNavigation` supplies primary navigation.
- Desktop behavior: persistent `w-64` sidebar and content offset.
- Route content is rendered inside the dashboard main region as `{children}`.
- Full source: use `src/app/dashboard/layout.js`; its visual render begins at the component return around line 188.

## Bottom Navigation

- Path: `src/components/BottomNavigation.js`
- Purpose: fixed mobile navigation shared by dashboard routes.
- Full source: use `src/components/BottomNavigation.js`.
