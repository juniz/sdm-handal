import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, Users } from "lucide-react";

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
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
					onClick={handleClose}
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						className="bg-white rounded-lg p-6 w-full max-w-md"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<UserCheck className="w-5 h-5 text-blue-500" />
								<h3 className="text-lg font-semibold">Tugaskan Ticket</h3>
							</div>
							<button
								onClick={handleClose}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{ticket && (
							<div className="mb-4 p-3 bg-gray-50 rounded-lg">
								<h4 className="font-medium text-sm text-gray-900 mb-1">
									{ticket.no_ticket || `#${ticket.ticket_id}`}
								</h4>
								<p className="text-sm text-gray-600 line-clamp-2">
									{ticket.title}
								</p>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									<Users className="w-4 h-4 inline mr-1" />
									Pilih Pegawai IT
								</label>
								<select
									value={selectedEmployee}
									onChange={(e) => setSelectedEmployee(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								>
									<option value="">Pilih pegawai...</option>
									{itEmployees.map((employee) => (
										<option key={employee.nik} value={employee.nik}>
											{employee.nama} ({employee.active_tickets} ticket aktif)
										</option>
									))}
								</select>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									type="button"
									onClick={handleClose}
									className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
									disabled={loading}
								>
									Batal
								</button>
								<button
									type="submit"
									className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
									disabled={loading}
								>
									{loading ? "Menugaskan..." : "Tugaskan"}
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
