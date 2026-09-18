"use client";

import { Printer, X, FileText } from "lucide-react";
import { triggerBrowserPrint } from "@/lib/development-print-utils";

export default function DevelopmentPrintModal({
	isOpen,
	onClose,
	title = "Preview Cetak Dokumen",
	fileName = "dokumen-pengembangan.pdf",
	orientation = "portrait", // "portrait" | "landscape"
	children,
}) {
	if (!isOpen) return null;

	const handleBrowserPrint = () => {
		triggerBrowserPrint("development-print-content", orientation);
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden print-modal-backdrop">
			{/* Print stylesheet */}
			<style dangerouslySetInnerHTML={{ __html: `
				@page {
					size: ${orientation === "landscape" ? "A4 landscape" : "A4 portrait"};
					margin: 8mm 8mm;
				}
				@media print {
					.no-print, header, aside, nav, .bottom-navigation, [role="navigation"] {
						display: none !important;
						visibility: hidden !important;
					}
					.print-avoid-break, tr {
						page-break-inside: avoid !important;
						break-inside: avoid !important;
					}
					thead {
						display: table-header-group !important;
					}
					tfoot {
						display: table-footer-group !important;
					}
				}
			`}} />

			<div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[92vh] max-h-[900px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print-modal-container">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 no-print flex-shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
							<FileText className="w-5 h-5" />
						</div>
						<div>
							<h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight">
								{title}
							</h3>
							<p className="text-xs text-slate-500">
								Format A4 ({orientation === "landscape" ? "Landscape" : "Portrait"}) • Siap dicetak
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleBrowserPrint}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
							title="Cetak lewat dialog browser"
						>
							<Printer className="w-4 h-4 text-slate-600" />
							<span className="hidden sm:inline">Cetak Dokumen</span>
							<span className="sm:hidden">Cetak</span>
						</button>

						<button
							type="button"
							onClick={onClose}
							className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
							title="Tutup dialog"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Modal Body: A4 Paper Preview */}
				<div className="flex-1 overflow-y-auto bg-slate-200/80 p-3 sm:p-6 flex justify-center items-start print-modal-scroll-area">
					<div
						id="development-print-content"
						className={`bg-white shadow-md border border-slate-300 transition-all ${
							orientation === "landscape"
								? "w-full max-w-[297mm] min-h-[210mm] p-6 sm:p-8"
								: "w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-8"
						}`}
						style={{ boxSizing: "border-box" }}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
