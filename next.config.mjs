/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: [
			"simrs.rsbhayangkaranganjuk.com",
			"webapps.rsbhayangkaranganjuk.com",
		],
	},
	experimental: {
		serverActions: true,
	},
};

export default nextConfig;
