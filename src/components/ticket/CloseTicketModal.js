import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CloseTicketModal = ({
	showModal,
	ticket,
	onCloseTicket,
	onClose,
	showToast,
}) => {
	const [feedback, setFeedback] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Escape key dismissal
	useEffect(() => {
		if (!showModal) return;
		const handleKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [showModal, onClose]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		setIsSubmitting(true);
		try {
			await onCloseTicket(ticket.ticket_id, feedback);
			onClose();
			setFeedback("");
		} catch (error) {
			// Error handling sudah dilakukan di parent component
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!showModal) return null;

	return (
		<AnimatePresence>
			<div
				className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"
				onClick={onClose}
				role="dialog"
				aria-modal="true"
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					onClick={(e) => e.stopPropagation()}
					className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
				>
					{/* Header */}
					<div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
						<div>
							<h3 className="text-base sm:text-lg font-bold text-slate-900">
								Tutup Pelaporan
							</h3>
							<p className="text-xs text-slate-500 mt-0.5">
								Konfirmasi penyelesaian kendala operasional
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
							disabled={isSubmitting}
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-4 sm:p-5 max-h-[calc(90vh-140px)] overflow-y-auto space-y-3">
						{ticket && (
							<>
								{/* Ticket Info */}
								<div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg">
									<h4 className="font-semibold text-slate-900 mb-1 text-xs sm:text-sm">
										{ticket.no_ticket || `#${ticket.ticket_id}`}
									</h4>
									<p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
										{ticket.title}
									</p>
									<div className="mt-2 text-xs text-slate-500">
										Status saat ini:{" "}
										<span className="font-semibold text-emerald-700">
											Selesai (Resolved)
										</span>
									</div>
								</div>

								{/* Confirmation Message */}
								<div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
									<div className="flex items-start gap-2.5">
										<CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
										<div>
											<h4 className="font-semibold text-emerald-950 text-xs sm:text-sm mb-0.5">
												Konfirmasi Penyelesaian
											</h4>
											<p className="text-xs text-emerald-800 leading-relaxed">
												Apakah kendala yang Anda laporkan telah tertangani dengan baik oleh teknisi?
											</p>
										</div>
									</div>
								</div>

								{/* Warning */}
								<div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
									<div className="flex items-start gap-2.5">
										<AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
										<div>
											<h4 className="font-semibold text-amber-950 text-xs sm:text-sm mb-0.5">
												Perhatian
											</h4>
											<p className="text-xs text-amber-800 leading-relaxed">
												Setelah ditutup, pelaporan diarsipkan dan status tidak dapat diubah kembali.
											</p>
										</div>
									</div>
								</div>

								{/* Form */}
								<form onSubmit={handleSubmit} className="pt-1">
									<div>
										<label className="block text-xs font-semibold text-slate-700 mb-1.5">
											Catatan Tambahan (Opsional)
										</label>
										<textarea
											value={feedback}
											onChange={(e) => setFeedback(e.target.value)}
											className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm bg-white"
											rows={3}
											placeholder="Berikan catatan singkat mengenai hasil penanganan kendala..."
										/>
									</div>
								</form>
							</>
						)}
					</div>

					{/* Footer */}
					<div className="flex gap-2 p-4 sm:p-5 border-t border-slate-100 bg-slate-50">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
							disabled={isSubmitting}
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={isSubmitting}
							className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
						>
							{isSubmitting ? "Menutup..." : "Konfirmasi Tutup"}
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default CloseTicketModal;
