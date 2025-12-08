"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// SECURITY FIX: Dynamic import untuk mencegah SSR error dengan DOMMatrix
// PDF viewer memerlukan browser APIs yang tidak tersedia di server-side
// Error terjadi karena @react-pdf-viewer menggunakan DOMMatrix yang hanya ada di browser
const PDFViewerComponent = dynamic(
	() => import("./PDFViewerComponent"),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center min-h-[80vh]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Memuat PDF viewer...</p>
				</div>
			</div>
		),
	}
);

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

export default function AkreditasiPage() {
	const [currentPage, setCurrentPage] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const handleDownload = () => {
		const link = document.createElement("a");
		link.href = "/documents/akreditasi.pdf";
		link.download = "buku-akreditasi.pdf";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleDocumentLoad = () => {
		setIsLoading(false);
		setError(null);
	};

	const handleDocumentError = (error) => {
		setIsLoading(false);
		setError("Gagal memuat dokumen PDF");
		console.error("PDF Error:", error);
	};

	return (
		<div className="min-h-[80vh] bg-gradient-to-br from-rose-50 to-pink-50">
			<motion.div
				initial="initial"
				animate="animate"
				variants={fadeIn}
				className="max-w-6xl mx-auto"
			>
				<Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0">
					<CardHeader className="space-y-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white p-2 md:p-6">
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div className="flex items-center gap-2">
								<BookOpen className="w-6 h-6" />
								<CardTitle className="text-xl md:text-2xl font-bold">
									Buku Akreditasi
								</CardTitle>
							</div>
							<Button
								onClick={handleDownload}
								variant="ghost"
								className="bg-white/20 hover:bg-white/30 text-white"
							>
								<Download className="w-4 h-4 mr-2" />
								Unduh PDF
							</Button>
						</div>
					</CardHeader>
					<CardContent className="!p-0">
						<div className="min-h-[80vh] bg-gray-100 rounded-lg overflow-hidden relative">
							{isLoading && (
								<div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
									<div className="text-center">
										<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
										<p className="text-gray-600">Memuat dokumen PDF...</p>
									</div>
								</div>
							)}
							{error && (
								<div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
									<div className="text-center">
										<p className="text-red-600 mb-4">{error}</p>
										<Button
											onClick={() => window.location.reload()}
											variant="outline"
										>
											Muat Ulang
										</Button>
									</div>
								</div>
							)}
							<PDFViewerComponent
								onDocumentLoad={handleDocumentLoad}
								onDocumentLoadError={handleDocumentError}
								onPageChange={(e) => setCurrentPage(e.currentPage)}
							/>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
