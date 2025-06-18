const withPWA = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: false,
	disable: process.env.NODE_ENV === "development",
	runtimeCaching: [
		{
			urlPattern: /^https?.*/,
			handler: "NetworkFirst",
			options: {
				cacheName: "offlineCache",
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 24 * 60 * 60, // 24 hours
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},
	],
	buildExcludes: [/middleware-manifest\.json$/],
	publicExcludes: ["!robots.txt", "!sitemap.xml"],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				hostname: "simrs.rsbhayangkaranganjuk.com",
			},
			{
				hostname: "webapps.rsbhayangkaranganjuk.com",
			},
			{
				hostname: "presensi.itbhayangkara.id",
			},
			{
				hostname: "webapps.rsbhayangkaranganjuk.com",
			},
			{
				hostname: "localhost",
			},
			{
				protocol: "https",
				hostname: "**.itbhayangkara.id",
			},
		],
		unoptimized: true, // Nonaktifkan optimisasi untuk menghindari cache
		minimumCacheTTL: 0, // Cache TTL minimum 0
	},
	webpack: (config) => {
		config.resolve.alias.canvas = false;
		config.resolve.alias.encoding = false;
		return config;
	},
	experimental: {
		serverActions: true,
	},
	// Headers untuk PWA Android compatibility dan foto presensi
	async headers() {
		return [
			{
				source: "/manifest.json",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
			{
				source: "/sw.js",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=0, must-revalidate",
					},
					{
						key: "Service-Worker-Allowed",
						value: "/",
					},
				],
			},
			{
				// Headers khusus untuk foto presensi
				source: "/photos/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, no-cache, must-revalidate, proxy-revalidate",
					},
					{
						key: "Pragma",
						value: "no-cache",
					},
					{
						key: "Expires",
						value: "0",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
				],
			},
		];
	},
	// Rewrites untuk menangani foto presensi
	async rewrites() {
		return [
			{
				source: "/api/photos/:path*",
				destination: "/photos/:path*", // Redirect ke static files
			},
		];
	},
};

module.exports = withPWA(nextConfig);
