"use client";

import { useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({ error, reset }) {
	useEffect(() => {
		// Log error untuk debugging
		console.error("Pengajuan Tukar Dinas page error:", error);

		// Log ke server jika tersedia
		if (typeof fetch !== "undefined") {
			const errorData = {
				error_type: error.name || "PageError",
				error_message: error.message || String(error),
				error_stack: error.stack,
				page_url: "/dashboard/pengajuan-tukar-dinas",
				severity: "HIGH",
				component_name: "PengajuanTukarDinasPage",
				action_attempted: "Page load",
				additional_data: {
					userAgent:
						typeof navigator !== "undefined" ? navigator.userAgent : null,
					url: typeof window !== "undefined" ? window.location.href : null,
					timestamp: new Date().toISOString(),
				},
			};

			fetch("/api/error-logs", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(errorData),
			}).catch((err) => {
				console.warn("Failed to log error:", err);
			});
		}
	}, [error]);

	// Handle reset dengan error handling
	const handleReset = () => {
		try {
			reset();
		} catch (error) {
			console.error("Error resetting page:", error);
			// Force reload jika reset gagal
			if (typeof window !== "undefined") {
				window.location.reload();
			}
		}
	};

	// Handle navigation dengan error handling
	const handleGoToDashboard = () => {
		try {
			if (typeof window !== "undefined") {
				window.location.href = "/dashboard";
			}
		} catch (error) {
			console.error("Error navigating to dashboard:", error);
			// Fallback: gunakan router jika tersedia
			if (typeof window !== "undefined") {
				window.location.replace("/dashboard");
			}
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gray-50">
			<div className="text-center max-w-md w-full">
				<div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
							<AlertTriangle className="w-8 h-8 text-red-600" />
						</div>
					</div>
					<h2 className="text-2xl font-semibold text-gray-900 mb-2">
						Terjadi Kendala Teknis
					</h2>
					<p className="text-gray-600 mb-4 text-sm leading-relaxed">
						Maaf, terjadi kesalahan saat memuat modul pengajuan tukar dinas. Silakan coba
						lagi atau kembali ke dashboard utama.
					</p>
					{error && process.env.NODE_ENV === "development" && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
							<p className="text-xs font-medium text-red-900 mb-1">
								Detail Kesalahan:
							</p>
							<p className="text-xs text-red-800 break-words font-mono">
								{error.message || String(error)}
							</p>
						</div>
					)}
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button
							onClick={handleReset}
							className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
						>
							<RefreshCcw className="w-4 h-4" />
							Coba Lagi
						</button>
						<button
							onClick={handleGoToDashboard}
							className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg transition-colors font-medium text-sm"
						>
							Kembali ke Dashboard
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
