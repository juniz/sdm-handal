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
	},
	webpack: (config) => {
		config.resolve.alias.canvas = false;
		config.resolve.alias.encoding = false;
		return config;
	},
	experimental: {
		serverActions: true,
	},
	// Headers untuk PWA Android compatibility
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
		];
	},
};

module.exports = withPWA(nextConfig);
