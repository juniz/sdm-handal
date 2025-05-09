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
				hostname: "localhost",
			},
			{
				protocol: "https",
				hostname: "**.itbhayangkara.id",
			},
		],
	},
	experimental: {
		serverActions: true,
	},
};

module.exports = withPWA(nextConfig);
