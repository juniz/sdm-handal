import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, Users, Briefcase } from "lucide-react";

const AssignmentModal = ({
	showModal,
	ticket,
	itEmployees,
	onAssign,
	onClose,
	showToast,
}) => {
	const [selectedEmployee, setSelectedEmployee] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!selectedEmployee) {
			showToast("Pilih pegawai IT yang akan ditugaskan", "error");
			return;
		}

		setLoading(true);
		try {
			await onAssign(ticket.ticket_id, selectedEmployee);
			setSelectedEmployee("");
			onClose();
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setSelectedEmployee("");
		onClose();
	};

	return (
		<AnimatePresence>
			{showModal && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
					onClick={handleClose}
				>
					<motion.div
						initial={{ scale: 0.96, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.96, opacity: 0 }}
						className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-md border border-slate-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
							<div className="flex items-center gap-2">
								<UserCheck className="w-5 h-5 text-sky-600" />
								<h3 className="text-base sm:text-lg font-semibold text-slate-900">
									Tugaskan Ticket
								</h3>
							</div>
							<button
								onClick={handleClose}
								className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
								disabled={loading}
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{ticket && (
							<div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
								<div className="flex items-center justify-between gap-2 mb-1">
									<span className="font-semibold text-xs text-slate-800">
										{ticket.no_ticket || `#${ticket.ticket_id}`}
									</span>
									<span className="text-xs px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
										{ticket.category_name}
									</span>
								</div>
								<p className="text-xs text-slate-600 line-clamp-2">
									{ticket.title}
								</p>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
									<Users className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
									Pilih Teknisi IT
								</label>
								<select
									value={selectedEmployee}
									onChange={(e) => setSelectedEmployee(e.target.value)}
									className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
									required
								>
									<option value="">Pilih teknisi pelaksana...</option>
									{itEmployees.map((employee) => (
										<option key={employee.nik} value={employee.nik}>
											{employee.nama} — ({employee.active_tickets} ticket aktif)
										</option>
									))}
								</select>
							</div>

							<div className="flex gap-2.5 pt-2">
								<button
									type="button"
									onClick={handleClose}
									className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
									disabled={loading}
								>
									Batal
								</button>
								<button
									type="submit"
									className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50"
									disabled={loading || !selectedEmployee}
								>
									{loading ? "Menugaskan..." : "Tugaskan Sekarang"}
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AssignmentModal;
