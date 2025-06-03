import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const StatusUpdateModal = ({
	showModal,
	ticket,
	onUpdateStatus,
	onClose,
	showToast,
}) => {
	const [selectedStatus, setSelectedStatus] = useState("");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Status yang bisa dipilih oleh IT
	const availableStatuses = [
		{ value: "In Progress", label: "In Progress", color: "yellow" },
		{ value: "On Hold", label: "On Hold", color: "orange" },
		{ value: "Resolved", label: "Resolved", color: "green" },
	];

	useEffect(() => {
		if (showModal && ticket) {
			setSelectedStatus("");
			setNotes("");
		}
	}, [showModal, ticket]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!selectedStatus) {
			showToast("Pilih status terlebih dahulu", "error");
			return;
		}

		setIsSubmitting(true);
		try {
			await onUpdateStatus(ticket.ticket_id, selectedStatus, notes);
			onClose();
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
							Update Status Ticket
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
										<span className="font-medium">{ticket.current_status}</span>
									</div>
								</div>

								{/* Form */}
								<form
									onSubmit={handleSubmit}
									className="space-y-4 sm:space-y-6"
								>
									{/* Status Selection */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-3">
											Status Baru <span className="text-red-500">*</span>
										</label>
										<div className="grid grid-cols-1 gap-2 sm:gap-3">
											{availableStatuses.map((status) => (
												<label
													key={status.value}
													className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
														selectedStatus === status.value
															? "border-blue-500 bg-blue-50"
															: "border-gray-200 hover:bg-gray-50"
													}`}
												>
													<input
														type="radio"
														value={status.value}
														checked={selectedStatus === status.value}
														onChange={(e) => setSelectedStatus(e.target.value)}
														className="sr-only"
													/>
													<div
														className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-3 ${
															status.color === "yellow"
																? "bg-yellow-400"
																: status.color === "orange"
																? "bg-orange-400"
																: status.color === "green"
																? "bg-green-400"
																: "bg-gray-400"
														}`}
													></div>
													<span className="font-medium text-sm sm:text-base">
														{status.label}
													</span>
													{selectedStatus === status.value && (
														<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 ml-auto" />
													)}
												</label>
											))}
										</div>
									</div>

									{/* Notes */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Catatan (Opsional)
										</label>
										<textarea
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
											rows={3}
											placeholder="Tambahkan catatan mengenai update status..."
										/>
									</div>

									{/* Info Alert */}
									<div className="flex items-start gap-2 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
										<AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
										<div className="text-sm text-blue-800">
											<p className="font-medium mb-1">Informasi:</p>
											<ul className="text-xs sm:text-sm space-y-1">
												<li>• In Progress: Ticket sedang dikerjakan</li>
												<li>• On Hold: Ticket ditunda sementara</li>
												<li>• Resolved: Masalah sudah diselesaikan</li>
											</ul>
										</div>
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
							disabled={!selectedStatus || isSubmitting}
							className="flex-1 px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm sm:text-base"
						>
							{isSubmitting ? "Menyimpan..." : "Update Status"}
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default StatusUpdateModal;
