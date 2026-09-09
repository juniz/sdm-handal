# OneSignal Permission Prompt & Profile Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a contextual notification permission banner in the dashboard layout and a device push notification settings card in the employee profile page.

**Architecture:** Create `NotificationPermissionBanner` in `src/components/notifications/` mounted in `src/app/dashboard/layout.js`, and `NotificationSettingsCard` in `src/components/profile/` mounted in `src/app/dashboard/profile/page.js`. Both interact with `window.OneSignalDeferred` and browser `Notification.permission`.

**Tech Stack:** Next.js 14 App Router, OneSignal Web SDK v16, Tailwind CSS, Lucide React, Sonner toasts.

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Design Tokens: Follow `DESIGN.md` (Brand Cyan `#0284C7`, Primary Sky `#E0F2FE`, rounded-xl, quiet borders)
- No gray-on-color contrast violations
- No breaking changes to existing profile or layout workflows

---

### Task 1: Create `NotificationPermissionBanner` and Mount in Dashboard Layout

**Files:**
- Create: `src/components/notifications/NotificationPermissionBanner.jsx`
- Modify: `src/app/dashboard/layout.js`

**Interfaces:**
- Consumes: `window.OneSignalDeferred`, `window.Notification.permission`, `localStorage` (`sdm_push_prompt_dismissed_until`)
- Produces: `NotificationPermissionBanner` React component

- [ ] **Step 1: Create `src/components/notifications/NotificationPermissionBanner.jsx`**

```jsx
"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function NotificationPermissionBanner() {
	const [permission, setPermission] = useState("granted");
	const [isDismissed, setIsDismissed] = useState(true);
	const [isRequesting, setIsRequesting] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !("Notification" in window)) {
			return;
		}

		const currentPerm = Notification.permission;
		setPermission(currentPerm);

		if (currentPerm === "default") {
			try {
				const dismissedUntil = localStorage.getItem("sdm_push_prompt_dismissed_until");
				if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
					setIsDismissed(false);
				}
			} catch (e) {
				setIsDismissed(false);
			}
		}
	}, []);

	if (permission !== "default" || isDismissed) {
		return null;
	}

	const handleRequestPermission = () => {
		setIsRequesting(true);
		if (typeof window !== "undefined" && window.OneSignalDeferred) {
			window.OneSignalDeferred.push(async function (OneSignal) {
				try {
					await OneSignal.Notifications.requestPermission();
					const updatedPerm = Notification.permission;
					setPermission(updatedPerm);
					if (updatedPerm === "granted") {
						setIsDismissed(true);
						toast.success("Notifikasi SDM Handal berhasil diaktifkan!");
					}
				} catch (err) {
					console.warn("OneSignal permission error:", err);
				} finally {
					setIsRequesting(false);
				}
			});
		} else {
			setIsRequesting(false);
		}
	};

	const handleDismiss = () => {
		setIsDismissed(true);
		try {
			// Snooze for 7 days
			const snoozeUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
			localStorage.setItem("sdm_push_prompt_dismissed_until", String(snoozeUntil));
		} catch (e) {
			console.warn("Failed to save snooze timestamp:", e);
		}
	};

	return (
		<div className="mb-4 bg-sky-50 border border-sky-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs animate-in fade-in duration-200">
			<div className="flex items-start sm:items-center justify-between gap-3">
				<div className="flex items-start sm:items-center gap-3">
					<div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
						<Bell className="w-4 h-4" />
					</div>
					<div>
						<h4 className="text-xs sm:text-sm font-bold text-slate-900 font-figtree">
							Aktifkan Notifikasi SDM Handal
						</h4>
						<p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
							Dapatkan pengumuman langsung untuk jadwal shift, verifikasi cuti, dan info kepegawaian rumah sakit di perangkat Anda.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={handleRequestPermission}
						disabled={isRequesting}
						className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50"
					>
						{isRequesting ? "Memproses..." : "Aktifkan Sekarang"}
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						title="Tutup (Ingatkan nanti)"
						className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Mount `NotificationPermissionBanner` in `src/app/dashboard/layout.js`**

Add import:
```javascript
import { NotificationPermissionBanner } from "@/components/notifications/NotificationPermissionBanner";
```
Render directly above main content children inside dashboard layout.

- [ ] **Step 3: Run AST check and test build**

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/components/notifications/NotificationPermissionBanner.jsx
npm run build
```

- [ ] **Step 4: Commit changes**

```bash
git add src/components/notifications/NotificationPermissionBanner.jsx src/app/dashboard/layout.js
git commit -m "feat(notifications): add permission prompt banner in dashboard layout"
```

---

### Task 2: Create `NotificationSettingsCard` and Mount in Profile Page

**Files:**
- Create: `src/components/profile/NotificationSettingsCard.jsx`
- Modify: `src/app/dashboard/profile/page.js`

**Interfaces:**
- Consumes: `window.OneSignalDeferred`, `Notification.permission`, `OneSignal.User.PushSubscription`
- Produces: `NotificationSettingsCard` React component

- [ ] **Step 1: Create `src/components/profile/NotificationSettingsCard.jsx`**

```jsx
"use client";

import { useState, useEffect } from "react";
import { Bell, ShieldCheck, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettingsCard() {
	const [permission, setPermission] = useState("default");
	const [isOptedIn, setIsOptedIn] = useState(false);
	const [subscriptionId, setSubscriptionId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isToggling, setIsToggling] = useState(false);

	const updateStatus = () => {
		if (typeof window === "undefined" || !("Notification" in window)) {
			setIsLoading(false);
			return;
		}

		setPermission(Notification.permission);

		if (window.OneSignalDeferred) {
			window.OneSignalDeferred.push(async function (OneSignal) {
				try {
					const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
					const subId = OneSignal.User?.PushSubscription?.id ?? null;
					setIsOptedIn(optedIn);
					setSubscriptionId(subId);
				} catch (err) {
					console.warn("OneSignal status check error:", err);
				} finally {
					setIsLoading(false);
				}
			});
		} else {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		updateStatus();
	}, []);

	const handleRequestPermission = () => {
		setIsToggling(true);
		if (typeof window !== "undefined" && window.OneSignalDeferred) {
			window.OneSignalDeferred.push(async function (OneSignal) {
				try {
					await OneSignal.Notifications.requestPermission();
					updateStatus();
					if (Notification.permission === "granted") {
						toast.success("Izin notifikasi berhasil diberikan!");
					}
				} catch (err) {
					console.warn("Permission request error:", err);
					toast.error("Gagal meminta izin notifikasi.");
				} finally {
					setIsToggling(false);
				}
			});
		} else {
			setIsToggling(false);
		}
	};

	const handleToggleOpt = () => {
		setIsToggling(true);
		if (typeof window !== "undefined" && window.OneSignalDeferred) {
			window.OneSignalDeferred.push(async function (OneSignal) {
				try {
					if (isOptedIn) {
						await OneSignal.User.PushSubscription.optOut();
						setIsOptedIn(false);
						toast.info("Notifikasi perangkat dinonaktifkan sementara.");
					} else {
						await OneSignal.User.PushSubscription.optIn();
						setIsOptedIn(true);
						toast.success("Notifikasi perangkat kembali aktif!");
					}
				} catch (err) {
					console.warn("Opt toggle error:", err);
					toast.error("Gagal mengubah status langganan notifikasi.");
				} finally {
					setIsToggling(false);
				}
			});
		} else {
			setIsToggling(false);
		}
	};

	return (
		<div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-3.5">
			<div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
						<Bell className="w-3.5 h-3.5" />
					</div>
					<div>
						<h3 className="text-xs font-bold text-slate-800 font-figtree uppercase tracking-wider">
							Notifikasi Web Push
						</h3>
						<p className="text-[11px] text-slate-500">
							Status penerimaan notifikasi dinas di peramban ini
						</p>
					</div>
				</div>

				<div>
					{permission === "granted" && isOptedIn ? (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
							<ShieldCheck className="w-3 h-3" />
							Aktif
						</span>
					) : permission === "denied" ? (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
							<AlertCircle className="w-3 h-3" />
							Diblokir
						</span>
					) : (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
							<AlertCircle className="w-3 h-3" />
							Belum Diizinkan
						</span>
					)}
				</div>
			</div>

			{/* Status Body & Actions */}
			<div className="text-xs text-slate-600 space-y-2.5">
				{permission === "granted" ? (
					<div className="space-y-3">
						<div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
							<div className="space-y-0.5">
								<p className="font-bold text-slate-800 text-xs">
									Langganan Push Perangkat
								</p>
								<p className="text-[11px] text-slate-500 font-mono truncate max-w-[240px] sm:max-w-xs">
									ID: {subscriptionId || "Terhubung ke OneSignal"}
								</p>
							</div>
							<button
								type="button"
								onClick={handleToggleOpt}
								disabled={isToggling}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
									isOptedIn
										? "bg-slate-200 hover:bg-slate-300 text-slate-700"
										: "bg-sky-600 hover:bg-sky-700 text-white"
								}`}
							>
								{isToggling ? "Menyimpan..." : isOptedIn ? "Nonaktifkan" : "Aktifkan"}
							</button>
						</div>
					</div>
				) : permission === "denied" ? (
					<div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-lg space-y-1.5 text-rose-900">
						<p className="font-bold text-xs flex items-center gap-1.5 text-rose-950">
							<AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
							Izin Notifikasi Diblokir oleh Peramban
						</p>
						<p className="text-[11px] text-rose-800 leading-relaxed">
							Untuk menerima kembali notifikasi dinas, klik ikon gembok / pengaturan situs pada bilah alamat (URL bar) browser Anda, ubah status <strong>Notifications</strong> menjadi <strong>Allow / Izinkan</strong>, lalu muat ulang halaman.
						</p>
					</div>
				) : (
					<div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-2 text-amber-900">
						<p className="text-[11px] text-amber-800 leading-relaxed">
							Peramban belum mengizinkan pengiriman notifikasi. Klik tombol di bawah untuk mengizinkan notifikasi agar jadwal dinas dan informasi darurat dapat diterima secara langsung.
						</p>
						<button
							type="button"
							onClick={handleRequestPermission}
							disabled={isToggling}
							className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all disabled:opacity-50"
						>
							<Smartphone className="w-3.5 h-3.5" />
							{isToggling ? "Meminta Izin..." : "Izinkan Notifikasi Sekarang"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Mount `NotificationSettingsCard` in `src/app/dashboard/profile/page.js`**

Add import:
```javascript
import { NotificationSettingsCard } from "@/components/profile/NotificationSettingsCard";
```
Render above or below the education/seminar history Bento cards in `src/app/dashboard/profile/page.js`.

- [ ] **Step 3: Run AST check and test build**

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/components/profile/NotificationSettingsCard.jsx
npm run build
```

- [ ] **Step 4: Commit changes**

```bash
git add src/components/profile/NotificationSettingsCard.jsx src/app/dashboard/profile/page.js
git commit -m "feat(profile): add notification settings card in profile page"
```
