import { useEffect, useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DeleteTicketModal = ({
	showModal,
	ticket,
	onConfirmDelete,
	onClose,
}) => {
	const [isDeleting, setIsDeleting] = useState(false);

	// Escape key dismissal
	useEffect(() => {
		if (!showModal) return;
		const handleKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [showModal, onClose]);

	if (!showModal || !ticket) return null;

	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirmDelete(ticket.ticket_id);
			onClose();
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AnimatePresence>
			<div
				className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"
				onClick={onClose}
				role="dialog"
				aria-modal="true"
				aria-labelledby="delete-dialog-title"
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					onClick={(e) => e.stopPropagation()}
					className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
				>
					{/* Header */}
					<div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
						<div className="flex items-center gap-2.5">
							<div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
								<Trash2 className="w-4 h-4" />
							</div>
							<div>
								<h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
									Hapus Pelaporan
								</h3>
								<p className="text-xs text-slate-500">
									Konfirmasi pembatalan dan penghapusan data
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
							disabled={isDeleting}
							aria-label="Tutup dialog"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Body */}
					<div className="p-4 sm:p-5 space-y-3">
						<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
							<span className="font-semibold text-xs text-slate-800">
								{ticket.no_ticket || `#${ticket.ticket_id}`}
							</span>
							<h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2">
								{ticket.title}
							</h4>
							<p className="text-xs text-slate-500 mt-1">
								Unit/Departemen: {ticket.departemen_name || "SDM"}
							</p>
						</div>

						<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5">
							<AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
							<p className="text-xs text-rose-900 leading-relaxed">
								Data pelaporan akan dihapus dari antrean IT. Tindakan ini tidak dapat dibatalkan.
							</p>
						</div>
					</div>

					{/* Footer */}
					<div className="flex gap-2 p-4 sm:p-5 border-t border-slate-100 bg-slate-50">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
							disabled={isDeleting}
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							disabled={isDeleting}
							className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
						>
							{isDeleting ? "Menghapus..." : "Ya, Hapus"}
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default DeleteTicketModal;
