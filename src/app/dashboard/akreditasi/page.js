"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const PDFViewerComponent = dynamic(
	() => import("./PDFViewerComponent"),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center min-h-[80vh]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
					<p className="text-gray-600 font-medium">Memuat PDF viewer...</p>
				</div>
			</div>
		),
	}
);

const fadeIn = {
	initial: { opacity: 0, y: 15 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.4 },
};

export default function AkreditasiPage() {
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
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

	const handleDocumentLoad = useCallback((e) => {
		setIsLoading(false);
		setError(null);
		if (e && e.doc) {
			setTotalPages(e.doc.numPages || 0);
		}
	}, []);

	const handleDocumentError = useCallback((error) => {
		setIsLoading(false);
		setError("Gagal memuat dokumen PDF");
		console.error("PDF Error:", error);
	}, []);

	const handlePageChange = useCallback((e) => {
		if (typeof e.currentPage === "number") {
			setCurrentPage(e.currentPage);
		}
	}, []);

	// Progress percentage
	const progressPercent = totalPages > 0 ? Math.min(100, Math.round(((currentPage + 1) / totalPages) * 100)) : 0;

	return (
		<div className="min-h-[85vh] bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/40 p-2 sm:p-4 md:p-6">
			<motion.div
				initial="initial"
				animate="animate"
				variants={fadeIn}
				className="max-w-6xl mx-auto space-y-3"
			>
				{/* Top Reading Progress Bar */}
				<div className="w-full bg-gray-200/80 h-1.5 rounded-full overflow-hidden shadow-inner">
					<div
						className="bg-gradient-to-r from-rose-500 to-pink-600 h-full transition-all duration-300 ease-out"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>

				<Card className="backdrop-blur-md bg-white/95 shadow-2xl border-0 overflow-hidden rounded-xl md:rounded-2xl">
					<CardHeader className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white p-3 sm:p-4 md:p-6">
						<div className="flex items-center justify-between flex-wrap gap-3">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
									<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div>
									<CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
										Buku Akreditasi
									</CardTitle>
									{totalPages > 0 && (
										<p className="text-xs text-rose-100/90 font-medium flex items-center gap-1.5 mt-0.5">
											<FileText className="w-3.5 h-3.5" />
											Total {totalPages} Halaman • {progressPercent}% Dibaca
										</p>
									)}
								</div>
							</div>
							<Button
								onClick={handleDownload}
								variant="ghost"
								size="sm"
								className="bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-sm"
							>
								<Download className="w-4 h-4 mr-2" />
								Unduh PDF
							</Button>
						</div>
					</CardHeader>

					<CardContent className="!p-0 relative">
						<div className="min-h-[75vh] sm:min-h-[80vh] bg-slate-100 relative overflow-hidden">
							{isLoading && (
								<div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-20">
									<div className="text-center space-y-3">
										<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
										<p className="text-sm font-medium text-gray-600">Memuat dokumen PDF...</p>
									</div>
								</div>
							)}
							{error && (
								<div className="absolute inset-0 flex items-center justify-center bg-white/95 z-20 p-4">
									<div className="text-center space-y-3">
										<p className="text-red-600 font-medium">{error}</p>
										<Button
											onClick={() => window.location.reload()}
											variant="outline"
											size="sm"
										>
											Muat Ulang
										</Button>
									</div>
								</div>
							)}

							<PDFViewerComponent
								onDocumentLoad={handleDocumentLoad}
								onDocumentLoadError={handleDocumentError}
								onPageChange={handlePageChange}
							/>

							{/* Floating Page Badge (Mobile Native App feel) */}
							{totalPages > 0 && !isLoading && (
								<div className="fixed sm:absolute bottom-4 right-4 z-30 pointer-events-none">
									<div className="bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-1.5">
										<span className="text-rose-400">{currentPage + 1}</span>
										<span className="text-gray-400">/</span>
										<span>{totalPages}</span>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}

