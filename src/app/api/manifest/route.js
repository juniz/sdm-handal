import { NextResponse } from "next/server";

export async function GET() {
	const version = process.env.NEXT_PUBLIC_PWA_VERSION;
	const withVersion = (src) =>
		version ? `${src}?v=${encodeURIComponent(version)}` : src;

	const manifest = {
		name: process.env.NEXT_PUBLIC_APP_NAME || "SDM Handal",
		short_name: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "SDM Handal",
		description:
			process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
			"Aplikasi Manajemen SDM RS Bhayangkara Nganjuk",
		start_url: process.env.NEXT_PUBLIC_APP_START_URL || "/",
		display: process.env.NEXT_PUBLIC_APP_DISPLAY || "standalone",
		background_color: process.env.NEXT_PUBLIC_APP_BACKGROUND_COLOR || "#ffffff",
		theme_color: process.env.NEXT_PUBLIC_APP_THEME_COLOR || "#2563eb",
		orientation: process.env.NEXT_PUBLIC_APP_ORIENTATION || "portrait",
		icons: [
			// Android biasanya mengutamakan 192 dan 512 – pastikan ada di awal array
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_192 || "/icons/icon-192x192.png"
				),
				sizes: "192x192",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_512 || "/icons/icon-512x512.png"
				),
				sizes: "512x512",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_72 || "/icons/icon-72x72.png"
				),
				sizes: "72x72",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_96 || "/icons/icon-96x96.png"
				),
				sizes: "96x96",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_128 || "/icons/icon-128x128.png"
				),
				sizes: "128x128",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_144 || "/icons/icon-144x144.png"
				),
				sizes: "144x144",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_152 || "/icons/icon-152x152.png"
				),
				sizes: "152x152",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: withVersion(
					process.env.NEXT_PUBLIC_APP_ICON_384 || "/icons/icon-384x384.png"
				),
				sizes: "384x384",
				type: "image/png",
				purpose: "any maskable",
			},
		],
	};

	// Add optional PWA features if configured
	if (process.env.NEXT_PUBLIC_APP_SCOPE) {
		manifest.scope = process.env.NEXT_PUBLIC_APP_SCOPE;
	}

	if (process.env.NEXT_PUBLIC_APP_LANG) {
		manifest.lang = process.env.NEXT_PUBLIC_APP_LANG;
	}

	if (process.env.NEXT_PUBLIC_APP_DIR) {
		manifest.dir = process.env.NEXT_PUBLIC_APP_DIR;
	}

	if (process.env.NEXT_PUBLIC_APP_CATEGORIES) {
		manifest.categories = process.env.NEXT_PUBLIC_APP_CATEGORIES.split(",");
	}

	if (process.env.NEXT_PUBLIC_APP_PREFER_RELATED_APPLICATIONS === "true") {
		manifest.prefer_related_applications = true;
	}

	// Add related applications if configured
	const relatedApps = [];
	if (process.env.NEXT_PUBLIC_APP_ANDROID_PACKAGE) {
		relatedApps.push({
			platform: "play",
			url:
				process.env.NEXT_PUBLIC_APP_ANDROID_URL ||
				`https://play.google.com/store/apps/details?id=${process.env.NEXT_PUBLIC_APP_ANDROID_PACKAGE}`,
			id: process.env.NEXT_PUBLIC_APP_ANDROID_PACKAGE,
		});
	}

	if (process.env.NEXT_PUBLIC_APP_IOS_APP_STORE_ID) {
		relatedApps.push({
			platform: "itunes",
			url:
				process.env.NEXT_PUBLIC_APP_IOS_URL ||
				`https://apps.apple.com/app/id${process.env.NEXT_PUBLIC_APP_IOS_APP_STORE_ID}`,
			id: process.env.NEXT_PUBLIC_APP_IOS_APP_STORE_ID,
		});
	}

	if (relatedApps.length > 0) {
		manifest.related_applications = relatedApps;
	}

	return NextResponse.json(manifest, {
		headers: {
			"Content-Type": "application/manifest+json",
			"Cache-Control": "public, max-age=3600", // Cache for 1 hour
		},
	});
}
