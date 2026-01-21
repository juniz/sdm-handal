import { Inter } from "next/font/google";
import { Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import PWAHandler from "@/components/PWAHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: process.env.NEXT_PUBLIC_APP_NAME || "SDM Handal",
	description:
		process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Sistem Manajemen SDM",
	manifest: "/api/manifest",
	icons: {
		icon: "/api/favicon",
		apple: "/api/apple-touch-icon",
	},
};

export const viewport = {
	themeColor: process.env.NEXT_PUBLIC_APP_THEME_COLOR || "#2563eb",
	width: "device-width",
	initialScale: 1,
	minimumScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<head>
				<link rel="manifest" href="/api/manifest" />
				<link rel="icon" href="/api/favicon" />
				<link rel="apple-touch-icon" href="/api/apple-touch-icon" />
				<meta
					name="theme-color"
					content={process.env.NEXT_PUBLIC_APP_THEME_COLOR || "#2563eb"}
				/>
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
				{/* PWA Android specific meta tags */}
				<meta name="mobile-web-app-capable" content="yes" />
				<meta
					name="application-name"
					content={process.env.NEXT_PUBLIC_APP_NAME || "SDM Handal"}
				/>
				<meta
					name="msapplication-TileColor"
					content={process.env.NEXT_PUBLIC_APP_THEME_COLOR || "#2563eb"}
				/>
				<meta name="msapplication-tap-highlight" content="no" />
			</head>
			<body className={`${inter.className} min-h-screen bg-gray-50`}>
				<PWAHandler />
				{children}
				<Toaster position="top-right" expand={true} richColors closeButton />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							// Setup global error handler
							if (typeof window !== 'undefined') {
								// Check if debug mode is enabled
								const isDebugEnabled = '${process.env.NEXT_PUBLIC_DEBUG}' === 'true';
								
								// Handle unhandled JavaScript errors
								window.addEventListener('error', (event) => {
									// Only log errors if debug mode is enabled
									if (!isDebugEnabled) {
										console.warn('Error logging disabled. Set NEXT_PUBLIC_DEBUG=true to enable error logging.');
										return;
									}
									
									const errorData = {
										error_type: 'UnhandledError',
										error_message: event.message,
										error_stack: event.error?.stack,
										page_url: window.location.pathname,
										severity: 'HIGH',
										component_name: 'Global',
										action_attempted: 'Unknown',
										additional_data: {
											filename: event.filename,
											lineno: event.lineno,
											colno: event.colno,
											userAgent: navigator.userAgent,
											url: window.location.href
										}
									};

									fetch('/api/error-logs', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
										},
										body: JSON.stringify(errorData),
									}).catch(err => {
										console.warn('Failed to log global error:', err);
									});
								});

								// Handle unhandled promise rejections
								window.addEventListener('unhandledrejection', (event) => {
									// Only log errors if debug mode is enabled
									if (!isDebugEnabled) {
										console.warn('Error logging disabled. Set NEXT_PUBLIC_DEBUG=true to enable error logging.');
										return;
									}
									
									const errorData = {
										error_type: 'UnhandledPromiseRejection',
										error_message: event.reason?.message || String(event.reason),
										error_stack: event.reason?.stack,
										page_url: window.location.pathname,
										severity: 'HIGH',
										component_name: 'Global',
										action_attempted: 'Promise execution',
										additional_data: {
											reason: String(event.reason),
											userAgent: navigator.userAgent,
											url: window.location.href
										}
									};

									fetch('/api/error-logs', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
										},
										body: JSON.stringify(errorData),
									}).catch(err => {
										console.warn('Failed to log promise rejection:', err);
									});
								});
							}
						`,
					}}
				/>
			</body>
		</html>
	);
}
