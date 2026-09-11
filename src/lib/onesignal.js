/**
 * Utility to dispatch OneSignal Web Push notifications to specific NIKs.
 * Fault-tolerant: will catch and log errors without throwing.
 */
export async function sendPushNotification({
	targetNiks = [],
	title,
	message,
	url,
}) {
	try {
		const rawNiks = Array.isArray(targetNiks) ? targetNiks : [targetNiks];
		const niks = Array.from(
			new Set(rawNiks.map(String).map((s) => s.trim()).filter(Boolean))
		);

		if (niks.length === 0) {
			return { success: false, error: "No target NIK provided" };
		}

		if (!title || !message) {
			return { success: false, error: "Title and message are required" };
		}

		const appId =
			process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ||
			"2f714dce-3685-47a3-9a02-4350d1186f71";
		const rawApiKey = process.env.ONESIGNAL_REST_API_KEY;
		const apiKey =
			typeof rawApiKey === "string"
				? rawApiKey.trim().replace(/^["']|["']$/g, "")
				: "";

		if (!apiKey) {
			console.warn("OneSignal REST API key is not configured; skipping push");
			return { success: false, error: "API key not configured" };
		}

		const siteUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			"https://presensi.itbhayangkara.id";

		let targetUrl = url || "/dashboard/pengajuan-tukar-dinas";
		if (targetUrl.startsWith("/")) {
			targetUrl = `${siteUrl.replace(/\/+$/, "")}${targetUrl}`;
		}

		const payload = {
			app_id: appId,
			target_channel: "push",
			headings: { en: title, id: title },
			contents: { en: message, id: message },
			include_aliases: {
				external_id: niks,
			},
			url: targetUrl,
		};

		const response = await fetch("https://api.onesignal.com/notifications", {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				Authorization: `Key ${apiKey}`,
			},
			body: JSON.stringify(payload),
		});

		const result = await response.json();
		if (!response.ok || (result.errors && !result.id)) {
			console.warn("OneSignal push notification response error:", result.errors);
			return { success: false, error: result.errors };
		}

		return { success: true, data: result };
	} catch (err) {
		console.error("Failed to send push notification via OneSignal:", err);
		return { success: false, error: err.message || err };
	}
}
