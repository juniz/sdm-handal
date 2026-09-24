"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";

function MobilePDFViewer({
	fileUrl,
	initialPage = 0,
	onDocumentLoad,
	onDocumentLoadError,
	onPageChange,
}) {
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [totalPages, setTotalPages] = useState(0);
	const [controlsVisible, setControlsVisible] = useState(true);
	const hideTimer = useRef(null);

	// Plugins
	const pageNav = pageNavigationPlugin();
	const zoom = zoomPlugin();
	const { jumpToPage } = pageNav;

	// Auto-hide controls after 3s of inactivity
	const resetHideTimer = useCallback(() => {
		setControlsVisible(true);
		clearTimeout(hideTimer.current);
		hideTimer.current = setTimeout(() => {
			setControlsVisible(false);
		}, 3000);
	}, []);

	useEffect(() => {
		resetHideTimer();
		return () => clearTimeout(hideTimer.current);
	}, [resetHideTimer]);

	const handleDocLoad = useCallback(
		(e) => {
			if (e?.doc) {
				const n = e.doc.numPages || 0;
				setTotalPages(n);
				onDocumentLoad?.(e);
			}
		},
		[onDocumentLoad]
	);

	const handlePageChange = useCallback(
		(e) => {
			if (typeof e.currentPage === "number") {
				setCurrentPage(e.currentPage);
				onPageChange?.(e);
			}
		},
		[onPageChange]
	);

	const goPrev = () => {
		if (currentPage > 0) {
			jumpToPage(currentPage - 1);
			resetHideTimer();
		}
	};

	const goNext = () => {
		if (currentPage < totalPages - 1) {
			jumpToPage(currentPage + 1);
			resetHideTimer();
		}
	};

	const progressPercent =
		totalPages > 0
			? Math.min(100, Math.round(((currentPage + 1) / totalPages) * 100))
			: 0;

	return (
		<div
			className="relative w-full bg-[#1a1a1a] overflow-hidden"
			style={{ height: "calc(100dvh - 96px)", minHeight: 460 }}
			onClick={resetHideTimer}
		>
			{/* ── PDF Viewer ── */}
			<div className="absolute inset-0 overflow-auto pb-28">
				<Worker workerUrl="/pdf.worker.min.js">
					<Viewer
						fileUrl={fileUrl}
						plugins={[pageNav, zoom]}
						defaultScale={SpecialZoomLevel.PageWidth}
						initialPage={initialPage}
						theme="auto"
						onDocumentLoad={handleDocLoad}
						onDocumentLoadError={onDocumentLoadError}
						onPageChange={handlePageChange}
					/>
				</Worker>
			</div>

			{/* ── Reading progress strip ── */}
			<div
				className="absolute top-0 left-0 right-0 h-0.5 z-20 bg-white/10"
				role="progressbar"
				aria-valuenow={progressPercent}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="Progres membaca"
			>
				<div
					className="h-full bg-[#0284C7] transition-all duration-300 ease-out"
					style={{ width: `${progressPercent}%` }}
				/>
			</div>

			{/* ── Top fade overlay (tap to toggle) ── */}
			<AnimatePresence>
				{controlsVisible && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.18, ease: "easeOut" }}
						className="absolute top-1 left-0 right-0 z-30 px-3 pt-2 pb-3"
						style={{
							background:
								"linear-gradient(to bottom, rgba(15,23,42,0.72) 0%, transparent 100%)",
						}}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
								<span className="text-white text-xs font-semibold tracking-wide font-[Figtree,sans-serif] truncate max-w-[180px]">
									Buku Standar Akreditasi
								</span>
							</div>
							<span className="text-white/60 text-[11px] font-medium tabular-nums">
								{currentPage + 1} / {totalPages || "—"}
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ── Left / Right swipe arrows (shown only when controls visible) ── */}
			<AnimatePresence>
				{controlsVisible && totalPages > 0 && (
					<>
						<motion.button
							key="prev"
							initial={{ opacity: 0, x: -12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
							transition={{ duration: 0.18 }}
							onClick={goPrev}
							disabled={currentPage === 0}
							aria-label="Halaman sebelumnya"
							className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white disabled:opacity-20 active:scale-95 transition-transform"
						>
							<ChevronLeft className="w-5 h-5" />
						</motion.button>
						<motion.button
							key="next"
							initial={{ opacity: 0, x: 12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 12 }}
							transition={{ duration: 0.18 }}
							onClick={goNext}
							disabled={currentPage >= totalPages - 1}
							aria-label="Halaman berikutnya"
							className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white disabled:opacity-20 active:scale-95 transition-transform"
						>
							<ChevronRight className="w-5 h-5" />
						</motion.button>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

export default memo(MobilePDFViewer);
