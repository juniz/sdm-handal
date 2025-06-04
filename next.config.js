const withPWA = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: false,
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
};

module.exports = withPWA(nextConfig);
