# Pengajuan Tukar Dinas Push Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send automated OneSignal push notifications to the Person-in-Charge on shift exchange submission, and back to the applicant on approval/rejection.

**Architecture:** Create reusable `src/lib/onesignal.js` helper to send notifications by NIKs via OneSignal REST API. Integrate into `src/app/api/pengajuan-tukar-dinas/route.js` in `POST` (submission) and `PUT` (status update).

**Tech Stack:** Next.js (App Router), OneSignal REST API v11/v16, MySQL rawQuery.

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Target URL default: `https://presensi.itbhayangkara.id/dashboard/pengajuan-tukar-dinas`
- Notification failures MUST NOT block database transaction or HTTP response (fault-tolerant try/catch)
- URL field must be single absolute `url` (no `web_url` conflict)

---

### Task 1: Create Centralized OneSignal Helper (`src/lib/onesignal.js`)

**Files:**
- Create: `src/lib/onesignal.js`

**Interfaces:**
- Produces: `sendPushNotification({ targetNiks: string[], title: string, message: string, url?: string }): Promise<{ success: boolean, data?: any, error?: any }>`

- [ ] **Step 1: Write `src/lib/onesignal.js`**

Implement `sendPushNotification`:
```javascript
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
```

- [ ] **Step 2: Check syntax**

Run:
```bash
node --check src/lib/onesignal.js
```
Expected: Exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/onesignal.js
git commit -m "feat(notifications): add reusable sendPushNotification helper"
```

---

### Task 2: Integrate Push Notifications into Shift Exchange Route (`src/app/api/pengajuan-tukar-dinas/route.js`)

**Files:**
- Modify: `src/app/api/pengajuan-tukar-dinas/route.js`

**Interfaces:**
- Consumes: `sendPushNotification` from `@/lib/onesignal`

- [ ] **Step 1: Import helper in `src/app/api/pengajuan-tukar-dinas/route.js`**

Add import:
```javascript
import { sendPushNotification } from "@/lib/onesignal";
```

- [ ] **Step 2: Add notification trigger in `POST` (Submission)**

After `await insert({ table: "pengajuan_tudin", ... })` succeeds:
```javascript
		// Kirim push notification ke penanggung jawab jika ada
		if (nik_pj) {
			const namaPemohon = pegawaiPemohon[0]?.nama || "Pegawai";
			sendPushNotification({
				targetNiks: [nik_pj],
				title: "Pengajuan Tukar Dinas Baru",
				message: `${namaPemohon} mengajukan tukar dinas (${shift1} tgl ${tgl_dinas} ⇄ ${shift2} tgl ${tgl_ganti}). Perlu persetujuan Anda.`,
				url: "/dashboard/pengajuan-tukar-dinas",
			}).catch((err) => console.warn("Background push error (POST tudin):", err));
		}
```

- [ ] **Step 3: Update `PUT` (Decision)**

In `PUT`:
1. Modify `SELECT nik_pj FROM pengajuan_tudin WHERE no_pengajuan = ?` to `SELECT nik, nik_pj FROM pengajuan_tudin WHERE no_pengajuan = ?`.
2. After `await update({ table: "pengajuan_tudin", ... })` succeeds:
```javascript
		// Kirim push notification ke pemohon terkait status pengajuan
		if (pengajuan.nik && (status === "Disetujui" || status === "Ditolak")) {
			try {
				const pjData = await rawQuery(
					`SELECT nama FROM pegawai WHERE nik = ?`,
					[userNik]
				);
				const namaPJ = pjData[0]?.nama || "Penanggung Jawab";

				let notifTitle = "";
				let notifMessage = "";

				if (status === "Disetujui") {
					notifTitle = "Pengajuan Tukar Dinas Disetujui";
					notifMessage = `Pengajuan tukar dinas Anda (${no_pengajuan}) telah disetujui oleh ${namaPJ}.`;
				} else {
					notifTitle = "Pengajuan Tukar Dinas Ditolak";
					notifMessage = `Pengajuan tukar dinas Anda (${no_pengajuan}) ditolak oleh ${namaPJ}. Alasan: ${alasan_ditolak}.`;
				}

				sendPushNotification({
					targetNiks: [pengajuan.nik],
					title: notifTitle,
					message: notifMessage,
					url: "/dashboard/pengajuan-tukar-dinas",
				}).catch((err) => console.warn("Background push error (PUT tudin):", err));
			} catch (notifErr) {
				console.warn("Could not dispatch decision push notification:", notifErr);
			}
		}
```

- [ ] **Step 4: Verify syntax**

Run:
```bash
node --check src/app/api/pengajuan-tukar-dinas/route.js
```
Expected: Exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/pengajuan-tukar-dinas/route.js docs/superpowers/plans/2026-09-11-pengajuan-tukar-dinas-push-notification.md
git commit -m "feat(pengajuan-tukar-dinas): dispatch push notifications on submit and decision"
```
