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

	return (
		<ErrorBoundary
			componentName="PengajuanTukarDinasPage"
			actionAttempted="Page error boundary"
			onReset={reset}
		>
			<div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gray-50">
				<div className="text-center max-w-md">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
							<AlertTriangle className="w-8 h-8 text-red-600" />
						</div>
					</div>
					<h2 className="text-2xl font-semibold text-gray-900 mb-2">
						Terjadi Kesalahan
					</h2>
					<p className="text-gray-600 mb-6">
						Maaf, terjadi kesalahan saat memuat halaman Pengajuan Tukar Dinas.
						Silakan coba lagi atau kembali ke dashboard.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button
							onClick={reset}
							className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
						>
							Coba Lagi
						</button>
						<button
							onClick={() => {
								if (typeof window !== "undefined") {
									window.location.href = "/dashboard";
								}
							}}
							className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors font-medium"
						>
							Kembali ke Dashboard
						</button>
					</div>
				</div>
			</div>
		</ErrorBoundary>
	);
}
