"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const ConfirmDeleteModal = ({
	isOpen,
	onClose,
	onConfirm,
	title = "Hapus Data Presensi",
	message = "Apakah Anda yakin ingin menghapus data presensi ini? Tindakan ini tidak dapat dibatalkan.",
	itemName = "",
	isDeleting = false,
}) => {
	const cancelBtnRef = useRef(null);

	// Focus cancel button on open & listen to Escape key
	useEffect(() => {
		if (isOpen) {
			cancelBtnRef.current?.focus();
			const handleKeyDown = (e) => {
				if (e.key === "Escape" && !isDeleting) {
					onClose();
				}
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, isDeleting, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-dialog-title"
			aria-describedby="delete-dialog-desc"
			onClick={(e) => {
				if (e.target === e.currentTarget && !isDeleting) onClose();
			}}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0, y: 8 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.95, opacity: 0, y: 8 }}
				transition={{ duration: 0.15 }}
				className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 overflow-hidden"
			>
				<div className="flex items-start gap-4">
					<div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600">
						<AlertTriangle className="w-5 h-5" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<h3
								id="delete-dialog-title"
								className="text-base font-semibold text-slate-900"
							>
								{title}
							</h3>
							<button
								type="button"
								onClick={onClose}
								disabled={isDeleting}
								aria-label="Tutup dialog"
								className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
						<p
							id="delete-dialog-desc"
							className="text-sm text-slate-600 mt-2 leading-relaxed"
						>
							{message}
						</p>
						{itemName && (
							<div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 truncate">
								{itemName}
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-2.5">
					<button
						type="button"
						ref={cancelBtnRef}
						onClick={onClose}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{isDeleting ? (
							<>
								<div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
								<span>Menghapus...</span>
							</>
						) : (
							<span>Hapus</span>
						)}
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default ConfirmDeleteModal;
