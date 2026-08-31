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
	const [validationError, setValidationError] = useState("");

	const availableStatuses = [
		{
			value: "In Progress",
			label: "In Progress",
			description: "Sedang dikerjakan oleh teknisi",
			style: "text-amber-700 bg-amber-50 border-amber-200",
		},
		{
			value: "On Hold",
			label: "On Hold",
			description: "Tertunda menunggu suku cadang/pihak luar",
			style: "text-orange-700 bg-orange-50 border-orange-200",
		},
		{
			value: "Resolved",
			label: "Resolved",
			description: "Perbaikan selesai, wajib isi catatan tindakan",
			style: "text-emerald-700 bg-emerald-50 border-emerald-200",
		},
	];

	useEffect(() => {
		if (showModal && ticket) {
			setSelectedStatus("");
			setNotes("");
			setValidationError("");
		}
	}, [showModal, ticket]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setValidationError("");

		if (!selectedStatus) {
			setValidationError("Pilih status baru terlebih dahulu");
			return;
		}

		if (selectedStatus === "Resolved" && !notes.trim()) {
			setValidationError("Catatan tindakan wajib diisi saat status Resolved untuk audit mutu SIMRS");
			return;
		}

		setIsSubmitting(true);
		try {
			await onUpdateStatus(ticket.ticket_id, selectedStatus, notes.trim());
			onClose();
		} catch (error) {
			// Handled by parent toast
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!showModal) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.96 }}
					className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col"
				>
					{/* Header */}
					<div className="flex items-center justify-between p-5 border-b border-slate-100">
						<div>
							<h3 className="text-base sm:text-lg font-semibold text-slate-900">
								Update Status Ticket
							</h3>
							<p className="text-xs text-slate-500 mt-0.5">
								Pembaruan siklus perbaikan operasional IT
							</p>
						</div>
						<button
							onClick={onClose}
							className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
							disabled={isSubmitting}
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-5 max-h-[calc(90vh-140px)] overflow-y-auto space-y-4">
						{ticket && (
							<>
								{/* Ticket Info Card */}
								<div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
									<div className="flex items-center justify-between gap-2 mb-1">
										<span className="font-semibold text-xs text-slate-800">
											{ticket.no_ticket || `#${ticket.ticket_id}`}
										</span>
										<span className="text-xs font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
											Status: {ticket.current_status}
										</span>
									</div>
									<p className="text-xs text-slate-600 line-clamp-2">
										{ticket.title}
									</p>
								</div>

								{/* Form */}
								<form onSubmit={handleSubmit} className="space-y-4">
									{/* Status Selection */}
									<div>
										<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
											Status Baru <span className="text-rose-500">*</span>
										</label>
										<div className="space-y-2">
											{availableStatuses.map((status) => {
												const isSelected = selectedStatus === status.value;
												return (
													<label
														key={status.value}
														className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
															isSelected
																? "border-sky-500 bg-sky-50/60 ring-1 ring-sky-500"
																: "border-slate-200 hover:bg-slate-50/80"
														}`}
													>
														<input
															type="radio"
															value={status.value}
															checked={isSelected}
															onChange={(e) => {
																setSelectedStatus(e.target.value);
																setValidationError("");
															}}
															className="sr-only"
														/>
														<div className="flex-1">
															<div className="flex items-center justify-between">
																<span className="font-medium text-sm text-slate-900">
																	{status.label}
																</span>
																{isSelected && (
																	<CheckCircle className="w-4 h-4 text-sky-600" />
																)}
															</div>
															<p className="text-xs text-slate-500 mt-0.5">
																{status.description}
															</p>
														</div>
													</label>
												);
											})}
										</div>
									</div>

									{/* Notes */}
									<div>
										<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
											Catatan Perbaikan / Tindakan
											{selectedStatus === "Resolved" ? (
												<span className="text-rose-500 ml-1 font-bold">(Wajib Diisi)</span>
											) : (
												<span className="text-slate-400 font-normal ml-1">(Opsional)</span>
											)}
										</label>
										<textarea
											value={notes}
											onChange={(e) => {
												setNotes(e.target.value);
												setValidationError("");
											}}
											className={`w-full px-3 py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 transition-colors ${
												validationError && selectedStatus === "Resolved" && !notes.trim()
													? "border-rose-300 focus:ring-rose-500 bg-rose-50/30"
													: "border-slate-300 focus:ring-sky-500 focus:border-sky-500"
											}`}
											rows={3}
											placeholder={
												selectedStatus === "Resolved"
													? "Jelaskan langkah penyelesaian / tindakan perbaikan yang telah dilakukan..."
													: "Tambahkan catatan penanganan atau kendala jika ada..."
											}
										/>
									</div>

									{/* Validation Error Message */}
									{validationError && (
										<div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
											<AlertCircle className="w-4 h-4 flex-shrink-0" />
											<span>{validationError}</span>
										</div>
									)}
								</form>
							</>
						)}
					</div>

					{/* Footer */}
					<div className="flex gap-2.5 p-4 sm:p-5 border-t border-slate-100 bg-slate-50 mt-auto">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
							disabled={isSubmitting}
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!selectedStatus || isSubmitting}
							className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg transition-colors shadow-sm"
						>
							{isSubmitting ? "Menyimpan..." : "Simpan Status"}
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default StatusUpdateModal;
