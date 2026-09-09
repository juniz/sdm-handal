"use client";

import { useState, useEffect } from "react";
import {
	Bell,
	BellRing,
	BellOff,
	Lock,
	Check,
	Copy,
	Loader2,
	RefreshCw,
	Smartphone,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettingsCard() {
	const [permission, setPermission] = useState("default");
	const [isOptedIn, setIsOptedIn] = useState(false);
	const [subscriptionId, setSubscriptionId] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const [isSupported, setIsSupported] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		let isMounted = true;
		let removeSubListener = null;
		let removePermListener = null;

		// Fallback timeout in case ad-blocker blocks OneSignalSDK and deferred callback never executes
		const fallbackTimer = setTimeout(() => {
			if (isMounted) {
				setIsChecking(false);
			}
		}, 3500);

		if (typeof window === "undefined") {
			return () => {
				isMounted = false;
				clearTimeout(fallbackTimer);
			};
		}

		if (!("Notification" in window)) {
			setIsSupported(false);
			setIsChecking(false);
			clearTimeout(fallbackTimer);
			return () => {
				isMounted = false;
				clearTimeout(fallbackTimer);
			};
		}

		setPermission(Notification.permission);

		window.OneSignalDeferred = window.OneSignalDeferred || [];
		window.OneSignalDeferred.push(async (OneSignal) => {
			try {
				if (!isMounted) return;
				const pushSub = OneSignal.User?.PushSubscription;
				if (pushSub) {
					setIsOptedIn(Boolean(pushSub.optedIn));
					setSubscriptionId(pushSub.id || null);

					if (typeof pushSub.addEventListener === "function") {
						const onSubChange = () => {
							if (!isMounted) return;
							const current = OneSignal.User?.PushSubscription;
							if (current) {
								setIsOptedIn(Boolean(current.optedIn));
								setSubscriptionId(current.id || null);
							}
						};
						pushSub.addEventListener("change", onSubChange);
						removeSubListener = () => {
							if (typeof pushSub.removeEventListener === "function") {
								pushSub.removeEventListener("change", onSubChange);
							}
						};
					}
				}

				if (typeof OneSignal.Notifications?.addEventListener === "function") {
					const onPermChange = () => {
						if (!isMounted) return;
						if (typeof Notification !== "undefined") {
							setPermission(Notification.permission);
						}
					};
					OneSignal.Notifications.addEventListener("permissionChange", onPermChange);
					removePermListener = () => {
						if (typeof OneSignal.Notifications?.removeEventListener === "function") {
							OneSignal.Notifications.removeEventListener("permissionChange", onPermChange);
						}
					};
				}
			} catch (err) {
				console.error("Error reading OneSignal PushSubscription:", err);
			} finally {
				if (isMounted) {
					setIsChecking(false);
					clearTimeout(fallbackTimer);
				}
			}
		});

		const handleFocus = () => {
			if (typeof window !== "undefined" && "Notification" in window) {
				if (isMounted) {
					setPermission(Notification.permission);
				}
				window.OneSignalDeferred = window.OneSignalDeferred || [];
				window.OneSignalDeferred.push(async (OneSignal) => {
					if (!isMounted) return;
					const pushSub = OneSignal.User?.PushSubscription;
					if (pushSub) {
						setIsOptedIn(Boolean(pushSub.optedIn));
						setSubscriptionId(pushSub.id || null);
					}
				});
			}
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			isMounted = false;
			clearTimeout(fallbackTimer);
			window.removeEventListener("focus", handleFocus);
			if (removeSubListener) removeSubListener();
			if (removePermListener) removePermListener();
		};
	}, []);

	const handleRequestPermission = async () => {
		setIsLoading(true);
		const safetyTimeout = setTimeout(() => {
			setIsLoading(false);
		}, 5000);

		try {
			window.OneSignalDeferred = window.OneSignalDeferred || [];
			window.OneSignalDeferred.push(async (OneSignal) => {
				try {
					await OneSignal.Notifications.requestPermission();
					if (typeof Notification !== "undefined") {
						const currentPerm = Notification.permission;
						setPermission(currentPerm);
						if (currentPerm === "granted") {
							toast.success("Izin notifikasi berhasil diberikan!");
						} else if (currentPerm === "denied") {
							toast.error("Izin notifikasi ditolak oleh browser");
						}
					}
					const pushSub = OneSignal.User?.PushSubscription;
					if (pushSub) {
						setIsOptedIn(Boolean(pushSub.optedIn));
						setSubscriptionId(pushSub.id || null);
					}
				} catch (err) {
					console.error("OneSignal requestPermission error:", err);
					toast.error("Gagal meminta izin notifikasi");
				} finally {
					clearTimeout(safetyTimeout);
					setIsLoading(false);
				}
			});
		} catch (err) {
			clearTimeout(safetyTimeout);
			console.error("Permission request exception:", err);
			setIsLoading(false);
		}
	};

	const handleToggleSubscription = async () => {
		setIsLoading(true);
		const safetyTimeout = setTimeout(() => {
			setIsLoading(false);
		}, 5000);

		try {
			window.OneSignalDeferred = window.OneSignalDeferred || [];
			window.OneSignalDeferred.push(async (OneSignal) => {
				try {
					const pushSub = OneSignal.User?.PushSubscription;
					if (!pushSub) {
						toast.error("Layanan push notification belum siap");
						return;
					}

					if (isOptedIn) {
						await pushSub.optOut();
						setIsOptedIn(false);
						toast.info("Notifikasi dinonaktifkan pada perangkat ini");
					} else {
						await pushSub.optIn();
						setIsOptedIn(true);
						if (pushSub.id) {
							setSubscriptionId(pushSub.id);
						}
						toast.success("Notifikasi berhasil diaktifkan kembali!");
					}
				} catch (err) {
					console.error("Error toggling push subscription:", err);
					toast.error("Gagal mengubah status langganan notifikasi");
				} finally {
					clearTimeout(safetyTimeout);
					setIsLoading(false);
				}
			});
		} catch (err) {
			clearTimeout(safetyTimeout);
			console.error("Subscription toggle exception:", err);
			setIsLoading(false);
		}
	};

	const handleCopyId = async () => {
		if (!subscriptionId) return;
		if (typeof navigator === "undefined" || !navigator?.clipboard?.writeText) {
			toast.error("Fitur salin tidak didukung oleh browser Anda");
			return;
		}
		try {
			await navigator.clipboard.writeText(subscriptionId);
			setCopied(true);
			toast.success("ID langganan berhasil disalin");
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy ID:", err);
			toast.error("Gagal menyalin ID langganan");
		}
	};

	const getStatusBadge = () => {
		if (!isSupported) {
			return {
				label: "Tidak Didukung",
				className: "bg-slate-100 text-slate-700 border-slate-200",
			};
		}
		if (permission === "granted" && isOptedIn) {
			return {
				label: "Aktif",
				className: "bg-emerald-50 text-emerald-700 border-emerald-200",
			};
		}
		if (permission === "denied") {
			return {
				label: "Diblokir",
				className: "bg-rose-50 text-rose-700 border-rose-200",
			};
		}
		return {
			label: "Belum Diizinkan",
			className: "bg-amber-50 text-amber-700 border-amber-200",
		};
	};

	const statusBadge = getStatusBadge();

	return (
		<div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col hover:shadow transition-all duration-300">
			{/* Header */}
			<div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
						<BellRing className="w-3.5 h-3.5" />
					</div>
					<div>
						<h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-figtree">
							Pengaturan Notifikasi Web Push
						</h2>
					</div>
				</div>
				<span
					className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold font-figtree uppercase tracking-wider border ${statusBadge.className}`}
				>
					{statusBadge.label}
				</span>
			</div>

			{/* Content Body */}
			{isChecking ? (
				<div className="flex items-center justify-center py-6">
					<Loader2 className="w-5 h-5 animate-spin text-[#0284C7]" />
				</div>
			) : !isSupported ? (
				<div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
					<AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
					<p className="text-xs text-slate-600">
						Peramban web ini tidak mendukung fitur Web Push Notifications.
					</p>
				</div>
			) : permission === "denied" ? (
				/* Case Denied: Callout guide */
				<div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
					<div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
						<Lock className="w-3.5 h-3.5" />
					</div>
					<div className="flex-1 min-w-0 space-y-1.5">
						<h3 className="text-xs font-bold text-rose-900 font-figtree">
							Izin Notifikasi Diblokir oleh Browser
						</h3>
						<p className="text-xs text-rose-800 leading-relaxed font-sans">
							Klik ikon gembok di sebelah kiri bilah alamat browser, ubah Notifikasi ke &apos;Izinkan&apos;, lalu muat ulang halaman ini untuk mengaktifkan kembali pembaruan.
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-200 rounded-md hover:bg-rose-50 transition-colors mt-1 font-figtree"
						>
							<RefreshCw className="w-3 h-3 text-rose-700" />
							<span>Muat Ulang Halaman</span>
						</button>
					</div>
				</div>
			) : permission === "granted" ? (
				/* Case Granted: Subscription card + Opt-In / Opt-Out toggle */
				<div className="space-y-3">
					<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="w-7 h-7 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
								<Smartphone className="w-3.5 h-3.5" />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-figtree">
									ID Langganan Perangkat
								</p>
								<p
									className="text-xs font-mono font-medium text-slate-700 truncate select-all mt-0.5 max-w-[260px] sm:max-w-xs md:max-w-sm"
									title={subscriptionId || "-"}
								>
									{subscriptionId || "Menunggu sinkronisasi ID OneSignal..."}
								</p>
							</div>
						</div>

						{subscriptionId && (
							<button
								type="button"
								onClick={handleCopyId}
								className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors self-start sm:self-center shrink-0 font-figtree"
								title="Salin ID Langganan"
							>
								{copied ? (
									<>
										<Check className="w-3.5 h-3.5 text-emerald-600" />
										<span className="text-emerald-700">Tersalin</span>
									</>
								) : (
									<>
										<Copy className="w-3.5 h-3.5 text-slate-500" />
										<span>Salin ID</span>
									</>
								)}
							</button>
						)}
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
						<p className="text-xs text-slate-600 font-sans leading-relaxed">
							{isOptedIn
								? "Perangkat ini aktif menerima pemberitahuan langsung sistem SDM Handal."
								: "Langganan perangkat ini sedang dinonaktifkan sementara."}
						</p>

						{isOptedIn ? (
							<button
								type="button"
								onClick={handleToggleSubscription}
								disabled={isLoading}
								className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 shrink-0 font-figtree"
							>
								{isLoading ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
								) : (
									<BellOff className="w-3.5 h-3.5 text-slate-500" />
								)}
								<span>Nonaktifkan di Perangkat Ini</span>
							</button>
						) : (
							<button
								type="button"
								onClick={handleToggleSubscription}
								disabled={isLoading}
								className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors disabled:opacity-50 shrink-0 shadow-xs font-figtree"
							>
								{isLoading ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
								) : (
									<Bell className="w-3.5 h-3.5 text-white" />
								)}
								<span>Aktifkan Kembali Notifikasi</span>
							</button>
						)}
					</div>
				</div>
			) : (
				/* Case Default: Request permission */
				<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-start gap-2.5">
						<div className="w-7 h-7 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
							<Bell className="w-3.5 h-3.5" />
						</div>
						<div>
							<h3 className="text-xs font-bold text-slate-800 font-figtree">
								Izin Notifikasi Belum Diberikan
							</h3>
							<p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-sans">
								Dapatkan update real-time terkait jadwal dinas, pengumuman, dan tiket penugasan langsung di browser Anda.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={handleRequestPermission}
						disabled={isLoading}
						className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors disabled:opacity-50 shrink-0 shadow-xs font-figtree"
					>
						{isLoading ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
						) : (
							<BellRing className="w-3.5 h-3.5 text-white" />
						)}
						<span>Izinkan Notifikasi Sekarang</span>
					</button>
				</div>
			)}
		</div>
	);
}
