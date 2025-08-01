import { Inter } from "next/font/google";
import { Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import PWAHandler from "@/components/PWAHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "SDM Handal",
	description: "Sistem Manajemen SDM",
	manifest: "/manifest.json",
	icons: [
		{
			rel: "apple-touch-icon",
			url: "/icons/icon-192x192.png",
		},
		{
			rel: "icon",
			url: "/icons/icon-192x192.png",
		},
	],
};

export const viewport = {
	themeColor: "#2563eb",
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
				<link rel="manifest" href="/manifest.json" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
				<meta name="theme-color" content="#2563eb" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
				{/* PWA Android specific meta tags */}
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="application-name" content="SDM Handal" />
				<meta name="msapplication-TileColor" content="#2563eb" />
				<meta name="msapplication-tap-highlight" content="no" />
				<style>{`
					:root {
						--sat: env(safe-area-inset-top);
						--sab: env(safe-area-inset-bottom);
						--sal: env(safe-area-inset-left);
						--sar: env(safe-area-inset-right);
					}
					
					body {
						padding-top: var(--sat);
						padding-bottom: var(--sab);
						padding-left: var(--sal);
						padding-right: var(--sar);
						-webkit-touch-callout: none;
						-webkit-user-select: none;
						user-select: none;
						overscroll-behavior-y: none;
					}

					@supports(padding: max(0px)) {
						body {
							padding-top: max(var(--sat), 16px);
							padding-bottom: max(var(--sab), 16px);
							padding-left: max(var(--sal), 16px);
							padding-right: max(var(--sar), 16px);
						}
					}
				`}</style>
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
