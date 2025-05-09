import { Inter } from "next/font/google";
import { Viewport } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "SDM Handal",
	description: "Aplikasi Manajemen SDM RS Bhayangkara Nganjuk",
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
	viewportFit: "cover",
};

export default function RootLayout({ children }) {
	return (
		<html lang="id">
			<head>
				<link rel="manifest" href="/manifest.json" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
				<meta name="theme-color" content="#2563eb" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
			</head>
			<body className={inter.className}>{children}</body>
		</html>
	);
}
