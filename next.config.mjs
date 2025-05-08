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
		],
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
};

export default nextConfig;
