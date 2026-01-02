"use client";

import { useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AlertTriangle } from "lucide-react";

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
						Terjadi Kesalahan
					</h2>
					<p className="text-gray-600 mb-4">
						Maaf, terjadi kesalahan saat memuat PengajuanFormModal. Silakan coba
						lagi atau kembali ke halaman utama.
					</p>
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
							<p className="text-xs font-medium text-red-900 mb-1">
								Detail Kesalahan:
							</p>
							<p className="text-xs text-red-800 break-words">
								{error.message || String(error)}
							</p>
						</div>
					)}
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button
							onClick={handleReset}
							className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Coba Lagi
						</button>
						<button
							onClick={handleGoToDashboard}
							className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors font-medium"
						>
							Kembali ke Dashboard
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
