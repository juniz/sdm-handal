"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }) {
	useEffect(() => {
		console.error("Rapat page error:", error);
	}, [error]);

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="text-center">
				<AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
				<h2 className="text-2xl font-semibold text-gray-900 mb-2">
					Terjadi Kesalahan
				</h2>
				<p className="text-gray-600 mb-6">
					Maaf, terjadi kesalahan saat memuat halaman. Silakan coba lagi.
				</p>
				<button
					onClick={reset}
					className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
				>
					Coba Lagi
				</button>
			</div>
		</div>
	);
}
