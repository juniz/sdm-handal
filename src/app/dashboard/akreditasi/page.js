"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Download, FileText, ShieldCheck, RefreshCw, AlertCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const PDFViewerComponent = dynamic(
	() => import("./PDFViewerComponent"),
	{
		ssr: false,
		loading: () => (
			<div
				role="status"
				aria-live="polite"
				className="flex items-center justify-center min-h-[80vh] bg-slate-50"
			>
				<div className="text-center space-y-3">
					<div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-sky-600 mx-auto" />
					<p className="text-sm font-medium text-slate-600">Menyiapkan pembaca dokumen...</p>
					<span className="sr-only">Menyiapkan pembaca dokumen PDF</span>
				</div>
			</div>
		),
	}
);

const fadeIn = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.3 },
};

const PDF_DOCUMENT_PATH = "/documents/akreditasi.pdf";
const PDF_DOWNLOAD_NAME = "buku-standar-akreditasi-rs.pdf";
const STORAGE_KEY = "sdm_akreditasi_last_page";

export default function AkreditasiPage() {
	const [currentPage, setCurrentPage] = useState(0);
	const [initialPage, setInitialPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [viewerKey, setViewerKey] = useState(0);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved !== null) {
				const pageNum = parseInt(saved, 10);
				if (!isNaN(pageNum) && pageNum >= 0) {
					setInitialPage(pageNum);
					setCurrentPage(pageNum);
				}
			}
		} catch (e) {
			console.warn("Could not read saved page from localStorage", e);
		}
	}, []);

	const handleDownload = () => {
		const link = document.createElement("a");
		link.href = PDF_DOCUMENT_PATH;
		link.download = PDF_DOWNLOAD_NAME;
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

	const handleDocumentError = useCallback((err) => {
		setIsLoading(false);
		setError("Gagal memuat dokumen standar akreditasi PDF. Pastikan file tersedia di server.");
		console.error("PDF Error:", err);
	}, []);

	const handlePageChange = useCallback((e) => {
		if (typeof e.currentPage === "number") {
			setCurrentPage(e.currentPage);
			try {
				localStorage.setItem(STORAGE_KEY, String(e.currentPage));
			} catch (err) {
				// Ignore storage errors
			}
		}
	}, []);

	const handleRetry = () => {
		setError(null);
		setIsLoading(true);
		setViewerKey((prev) => prev + 1);
	};

	const progressPercent = totalPages > 0 ? Math.min(100, Math.round(((currentPage + 1) / totalPages) * 100)) : 0;

	return (
		<div className="min-h-[85vh] bg-slate-50 p-1 sm:p-4 md:p-6">
			<motion.div
				initial="initial"
				animate="animate"
				variants={fadeIn}
				className="max-w-6xl mx-auto space-y-2 sm:space-y-4"
			>
				<Card className="bg-white shadow-sm border border-slate-200 overflow-hidden rounded-lg sm:rounded-2xl">
					{/* Reading Progress Bar with Accessible Semantics */}
					<div
						role="progressbar"
						aria-label="Progres membaca buku akreditasi"
						aria-valuenow={progressPercent}
						aria-valuemin={0}
						aria-valuemax={100}
						className="w-full bg-slate-100 h-1 sm:h-1.5 overflow-hidden"
					>
						<div
							className="bg-sky-600 h-full transition-all duration-300 ease-out"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>

					<CardHeader className="bg-white border-b border-slate-200 p-2.5 sm:p-5 md:p-6">
						<div className="flex items-center justify-between gap-2 sm:gap-4">
							<div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
								<div className="p-1.5 sm:p-2.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg sm:rounded-xl shadow-xs shrink-0">
									<BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
								</div>
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
										<CardTitle className="text-sm sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate sm:whitespace-normal">
											Buku Standar Akreditasi
										</CardTitle>
										<span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
											<ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
											STARKES
										</span>
									</div>
									<div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5 sm:mt-1">
										<span className="hidden sm:inline">RS Bhayangkara Nganjuk</span>
										{totalPages > 0 && (
											<>
												<span className="hidden sm:inline">•</span>
												<span className="flex items-center gap-1 text-slate-700 font-medium">
													<FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 shrink-0" />
													Hal. {currentPage + 1}/{totalPages} ({progressPercent}%)
												</span>
											</>
										)}
									</div>
								</div>
							</div>
							<div className="shrink-0">
								<Button
									onClick={handleDownload}
									size="sm"
									className="h-7 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs transition-colors"
								>
									<Download className="w-3.5 h-3.5 sm:mr-2" />
									<span className="hidden sm:inline">Unduh PDF</span>
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent className="!p-0 relative">
						<div className="min-h-[80vh] bg-slate-100 relative overflow-hidden">
							{isLoading && (
								<div
									role="status"
									aria-live="polite"
									className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-xs z-20"
								>
									<div className="text-center space-y-3">
										<div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-sky-600 mx-auto" />
										<p className="text-sm font-medium text-slate-700">Memuat Buku Akreditasi...</p>
										<span className="sr-only">Sedang memuat dokumen PDF standar akreditasi</span>
									</div>
								</div>
							)}

							{error && (
								<div
									role="alert"
									className="absolute inset-0 flex items-center justify-center bg-white/98 z-20 p-6"
								>
									<div className="text-center space-y-4 max-w-md">
										<div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
											<AlertCircle className="w-6 h-6" />
										</div>
										<div>
											<h3 className="text-base font-semibold text-slate-900">Gagal Memuat Dokumen</h3>
											<p className="text-sm text-slate-600 mt-1">{error}</p>
										</div>
										<div className="flex items-center justify-center gap-3 pt-2">
											<Button
												onClick={handleRetry}
												variant="outline"
												size="sm"
												className="border-slate-200 text-slate-700 hover:bg-slate-50"
											>
												<RefreshCw className="w-4 h-4 mr-2" />
												Coba Lagi
											</Button>
											<Button
												onClick={handleDownload}
												size="sm"
												className="bg-sky-600 hover:bg-sky-700 text-white"
											>
												<Download className="w-4 h-4 mr-2" />
												Unduh File
											</Button>
										</div>
									</div>
								</div>
							)}

							<PDFViewerComponent
								key={`${viewerKey}-${initialPage}`}
								fileUrl={PDF_DOCUMENT_PATH}
								initialPage={initialPage}
								onDocumentLoad={handleDocumentLoad}
								onDocumentLoadError={handleDocumentError}
								onPageChange={handlePageChange}
							/>

							{/* Floating Page Badge */}
							{totalPages > 0 && !isLoading && (
								<div className="fixed sm:absolute bottom-20 sm:bottom-4 right-4 z-30 pointer-events-none">
									<div className="bg-slate-900/90 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-md border border-slate-700/50 flex items-center gap-1.5 backdrop-blur-xs">
										<FileText className="w-3.5 h-3.5 text-sky-400" />
										<span>
											Halaman <span className="font-bold text-white">{currentPage + 1}</span> dari <span className="text-slate-300">{totalPages}</span>
										</span>
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

