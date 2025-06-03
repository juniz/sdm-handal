import { useState } from "react";
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
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden"
				>
					{/* Header */}
					<div className="flex items-center justify-between p-4 sm:p-6 border-b">
						<h3 className="text-lg sm:text-xl font-semibold text-gray-900">
							Tutup Ticket
						</h3>
						<button
							onClick={onClose}
							className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
							disabled={isSubmitting}
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-4 sm:p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
						{ticket && (
							<>
								{/* Ticket Info */}
								<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
									<h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
										{ticket.no_ticket || `#${ticket.ticket_id}`}
									</h4>
									<p className="text-sm text-gray-600 line-clamp-2">
										{ticket.title}
									</p>
									<div className="mt-2 text-xs sm:text-sm text-gray-500">
										Status saat ini:{" "}
										<span className="font-medium text-green-600">
											{ticket.current_status}
										</span>
									</div>
								</div>

								{/* Confirmation Message */}
								<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
									<div className="flex items-start gap-3">
										<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
										<div>
											<h4 className="font-medium text-green-900 mb-1">
												Konfirmasi Penyelesaian
											</h4>
											<p className="text-sm text-green-800">
												Apakah masalah IT yang Anda laporkan sudah benar-benar
												selesai dan dapat ditutup?
											</p>
										</div>
									</div>
								</div>

								{/* Warning */}
								<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
									<div className="flex items-start gap-3">
										<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
										<div>
											<h4 className="font-medium text-yellow-900 mb-1">
												Perhatian
											</h4>
											<p className="text-sm text-yellow-800">
												Setelah ticket ditutup, Anda tidak dapat mengubah
												statusnya lagi. Pastikan masalah benar-benar sudah
												selesai.
											</p>
										</div>
									</div>
								</div>

								{/* Form */}
								<form
									onSubmit={handleSubmit}
									className="space-y-4 sm:space-y-6"
								>
									{/* Feedback */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Feedback (Opsional)
										</label>
										<textarea
											value={feedback}
											onChange={(e) => setFeedback(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
											rows={3}
											placeholder="Berikan feedback mengenai penyelesaian masalah IT Anda..."
										/>
									</div>
								</form>
							</>
						)}
					</div>

					{/* Footer */}
					<div className="flex gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-gray-50">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 sm:py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
							disabled={isSubmitting}
						>
							Batal
						</button>
						<button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className="flex-1 px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm sm:text-base"
						>
							{isSubmitting ? "Menutup..." : "Tutup Ticket"}
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default CloseTicketModal;
