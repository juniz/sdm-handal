"use client";

import { useState, useEffect } from "react";
import { BellRing, X } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPermissionBanner() {
	const [isVisible, setIsVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !("Notification" in window)) {
			return;
		}

		if (Notification.permission !== "default") {
			return;
		}

		const dismissedUntil = localStorage.getItem(
			"sdm_push_prompt_dismissed_until"
		);
		if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
			return;
		}

		setIsVisible(true);
	}, []);

	const handleEnable = async () => {
		setIsLoading(true);
		const safetyTimeout = setTimeout(() => {
			setIsLoading(false);
		}, 5000);

		try {
			if (typeof window !== "undefined") {
				window.OneSignalDeferred = window.OneSignalDeferred || [];
				window.OneSignalDeferred.push(async function (OneSignal) {
					try {
						await OneSignal.Notifications.requestPermission();
						if (
							typeof Notification !== "undefined" &&
							Notification.permission === "granted"
						) {
							setIsVisible(false);
							toast.success("Notifikasi SDM Handal berhasil diaktifkan!");
						} else {
							setIsVisible(false);
						}
					} catch (error) {
						console.error("OneSignal permission request error:", error);
						setIsVisible(false);
					} finally {
						clearTimeout(safetyTimeout);
						setIsLoading(false);
					}
				});
			} else {
				clearTimeout(safetyTimeout);
				setIsLoading(false);
			}
		} catch (error) {
			clearTimeout(safetyTimeout);
			console.error("Error activating notification:", error);
			setIsLoading(false);
		}
	};

	const handleDismiss = () => {
		if (typeof window !== "undefined") {
			const snoozeUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
			localStorage.setItem(
				"sdm_push_prompt_dismissed_until",
				String(snoozeUntil)
			);
		}
		setIsVisible(false);
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div className="px-4 md:px-0 mb-4 print:hidden">
			<div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-4 shadow-xs">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-start gap-3 min-w-0">
						<div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center text-[#0284C7] shrink-0 mt-0.5 sm:mt-0">
							<BellRing className="w-5 h-5" />
						</div>
						<div className="min-w-0">
							<h3 className="text-sm font-bold text-sky-950 tracking-tight font-figtree">
								Aktifkan Notifikasi SDM Handal
							</h3>
							<p className="text-xs text-sky-800 mt-0.5 leading-relaxed">
								Dapatkan update real-time terkait jadwal dinas, pengumuman, dan tiket penugasan Anda.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 self-end sm:self-center shrink-0">
						<button
							type="button"
							onClick={handleDismiss}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 hover:text-sky-950 hover:bg-sky-100 transition-colors"
						>
							Nanti Saja
						</button>
						<button
							type="button"
							onClick={handleEnable}
							disabled={isLoading}
							className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors disabled:opacity-50 shadow-xs"
						>
							{isLoading ? "Memproses..." : "Aktifkan Sekarang"}
						</button>
						<button
							type="button"
							onClick={handleDismiss}
							className="p-1.5 text-sky-600 hover:text-sky-900 hover:bg-sky-100 rounded-lg transition-colors ml-1"
							aria-label="Tutup"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
