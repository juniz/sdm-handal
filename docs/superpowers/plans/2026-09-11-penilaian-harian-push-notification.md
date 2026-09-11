# Penilaian Harian Push Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send automated OneSignal push notifications when employee submits daily assessment, and when supervisor approves or requests revision.

**Architecture:** Integrate `sendPushNotification` helper from `@/lib/onesignal` into `src/app/api/penilaian/harian/[id]/route.js` on actions `submit`, `approve`, and `revisi`.

**Tech Stack:** Next.js (App Router), OneSignal Web Push, MySQL helper (`selectFirst`).

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Target file: `src/app/api/penilaian/harian/[id]/route.js`
- Notification failures MUST NOT block database update or HTTP 200 response
- Single absolute `url` generated via `sendPushNotification` helper

---

### Task 1: Integrate Push Notifications into Assessment Handler (`src/app/api/penilaian/harian/[id]/route.js`)

**Files:**
- Modify: `src/app/api/penilaian/harian/[id]/route.js`

**Interfaces:**
- Consumes: `sendPushNotification` from `@/lib/onesignal`, `getSupervisorIdForEmployee`
- Produces: Push notifications for submit (to supervisor), approve (to employee), revisi (to employee)

- [ ] **Step 1: Import helper**

Add import to top of `src/app/api/penilaian/harian/[id]/route.js`:
```javascript
import { sendPushNotification } from "@/lib/onesignal";
```

- [ ] **Step 2: Add submit notification trigger**

Inside `if (action === "submit")`, immediately after `await update({ table: "penilaian_harian", ... })`:
```javascript
			// Push notification ke supervisor jika status submitted
			if (newStatus === "submitted") {
				try {
					const supervisorId = await getSupervisorIdForEmployee(harian.pegawai_id);
					if (supervisorId) {
						const [pegawaiRow, supervisorRow] = await Promise.all([
							selectFirst({
								table: "pegawai",
								where: { id: harian.pegawai_id },
								select: ["nama"]
							}),
							selectFirst({
								table: "pegawai",
								where: { id: supervisorId },
								select: ["nik"]
							})
						]);

						if (supervisorRow?.nik) {
							const namaPegawai = pegawaiRow?.nama || "Pegawai";
							const tglFormatted = moment(harian.tanggal).format("DD/MM/YYYY");
							sendPushNotification({
								targetNiks: [supervisorRow.nik],
								title: "Penilaian Harian Menunggu Persetujuan",
								message: `${namaPegawai} telah mengirim penilaian harian tanggal ${tglFormatted}. Menunggu persetujuan Anda.`,
								url: "/dashboard/penilaian-kinerja/approval"
							}).catch((err) =>
								console.warn("Background push error (submit penilaian):", err)
							);
						}
					}
				} catch (err) {
					console.warn("Could not dispatch submit push notification:", err);
				}
			}
```

- [ ] **Step 3: Add approve notification trigger**

Inside `if (action === "approve")`, immediately after `await update({ table: "penilaian_harian", ... })`:
```javascript
			// Push notification ke pegawai saat penilaian disetujui
			try {
				const [pegawaiRow, supervisorRow] = await Promise.all([
					selectFirst({
						table: "pegawai",
						where: { id: harian.pegawai_id },
						select: ["nik"]
					}),
					selectFirst({
						table: "pegawai",
						where: { id: loggedInUser.id },
						select: ["nama"]
					})
				]);

				if (pegawaiRow?.nik) {
					const namaSupervisor = supervisorRow?.nama || loggedInUser.nama || "Supervisor";
					const tglFormatted = moment(harian.tanggal).format("DD/MM/YYYY");
					sendPushNotification({
						targetNiks: [pegawaiRow.nik],
						title: "Penilaian Harian Disetujui",
						message: `Penilaian harian Anda tanggal ${tglFormatted} telah disetujui oleh ${namaSupervisor}.`,
						url: "/dashboard/penilaian-kinerja/riwayat"
					}).catch((err) =>
						console.warn("Background push error (approve penilaian):", err)
					);
				}
			} catch (err) {
				console.warn("Could not dispatch approve push notification:", err);
			}
```

- [ ] **Step 4: Add revisi notification trigger**

Inside `if (action === "revisi" || action === "admin_revisi")`, immediately after `await update({ table: "penilaian_harian", ... })`:
```javascript
			// Push notification ke pegawai saat penilaian diminta revisi
			try {
				const [pegawaiRow, supervisorRow] = await Promise.all([
					selectFirst({
						table: "pegawai",
						where: { id: harian.pegawai_id },
						select: ["nik"]
					}),
					selectFirst({
						table: "pegawai",
						where: { id: loggedInUser.id },
						select: ["nama"]
					})
				]);

				if (pegawaiRow?.nik) {
					const namaSupervisor = supervisorRow?.nama || loggedInUser.nama || "Supervisor";
					const tglFormatted = moment(harian.tanggal).format("DD/MM/YYYY");
					const dateParam = moment(harian.tanggal).format("YYYY-MM-DD");
					sendPushNotification({
						targetNiks: [pegawaiRow.nik],
						title: "Penilaian Harian Perlu Revisi",
						message: `Penilaian harian Anda tanggal ${tglFormatted} dikembalikan untuk direvisi oleh ${namaSupervisor}. Catatan: ${catatan_supervisor.trim()}.`,
						url: `/dashboard/penilaian-kinerja/input?date=${dateParam}`
					}).catch((err) =>
						console.warn("Background push error (revisi penilaian):", err)
					);
				}
			} catch (err) {
				console.warn("Could not dispatch revisi push notification:", err);
			}
```

- [ ] **Step 5: Verify syntax**

Run:
```bash
node --check src/app/api/penilaian/harian/[id]/route.js
```
Expected: Exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/penilaian/harian/[id]/route.js docs/superpowers/plans/2026-09-11-penilaian-harian-push-notification.md
git commit -m "feat(penilaian): dispatch push notifications on submit, approve, and revisi"
```
