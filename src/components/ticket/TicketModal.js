import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const TicketModal = ({
	showModal,
	modalMode,
	formData,
	setFormData,
	errors,
	masterData,
	onSubmit,
	onClose,
	showToast,
}) => {
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

	const validateForm = () => {
		const newErrors = {};

		if (!formData.category_id) {
			newErrors.category_id = "Kategori harus dipilih";
		}

		if (!formData.priority_id) {
			newErrors.priority_id = "Prioritas harus dipilih";
		}

		if (!formData.title || formData.title.trim().length < 5) {
			newErrors.title = "Judul minimal 5 karakter";
		}

		if (!formData.description || formData.description.trim().length < 10) {
			newErrors.description = "Deskripsi minimal 10 karakter";
		}

		return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
	};

	const handleModalSubmit = async (e) => {
		e.preventDefault();

		const { isValid, errors: validationErrors } = validateForm();
		if (!isValid) {
			showToast("Mohon lengkapi semua field dengan benar", "error");
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(formData);
		} catch (error) {
			console.error("Error submitting:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!showModal) return null;

	return (
		<div
			className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				onClick={(e) => e.stopPropagation()}
				className="bg-white rounded-xl border border-slate-200 shadow-xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
			>
				<div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
					<div>
						<h3 className="text-base sm:text-lg font-bold text-slate-900">
							{modalMode === "add" ? "Buat Pelaporan Baru" : "Edit Pelaporan"}
						</h3>
						<p className="text-xs text-slate-500 mt-0.5">
							Sampaikan rincian kendala teknis atau sarana rumah sakit
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
				<form onSubmit={handleModalSubmit}>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									Kategori Masalah
								</label>
								<select
									value={formData.category_id}
									onChange={(e) =>
										setFormData({ ...formData, category_id: e.target.value })
									}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white ${
										errors.category_id ? "border-rose-500" : "border-slate-300"
									}`}
									required
								>
									<option value="">-- Pilih Kategori --</option>
									{masterData.categories?.map((category) => (
										<option
											key={category.category_id}
											value={category.category_id}
										>
											{category.category_name}
										</option>
									))}
								</select>
								{errors.category_id && (
									<p className="text-rose-600 text-xs mt-1">
										{errors.category_id}
									</p>
								)}
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									Tingkat Prioritas
								</label>
								<select
									value={formData.priority_id}
									onChange={(e) =>
										setFormData({ ...formData, priority_id: e.target.value })
									}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white ${
										errors.priority_id ? "border-rose-500" : "border-slate-300"
									}`}
									required
								>
									<option value="">-- Pilih Prioritas --</option>
									{masterData.priorities?.map((priority) => (
										<option
											key={priority.priority_id}
											value={priority.priority_id}
										>
											{priority.priority_name}
										</option>
									))}
								</select>
								{errors.priority_id ? (
									<p className="text-rose-600 text-xs mt-1">
										{errors.priority_id}
									</p>
								) : (
									<p className="text-[11px] text-slate-500 mt-1">
										Pilih <strong>Kritis</strong> jika kendala langsung menghentikan pelayanan medis IGD/Rawat Inap.
									</p>
								)}
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-1">
								<label className="block text-xs font-semibold text-slate-700">
									Judul Kendala
								</label>
								<span className="text-[11px] text-slate-400">Min. 5 karakter</span>
							</div>
							<input
								type="text"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white ${
									errors.title ? "border-rose-500" : "border-slate-300"
								}`}
								placeholder="Contoh: Printer resep SIMRS IGD macet"
								required
							/>
							{errors.title && (
								<p className="text-rose-600 text-xs mt-1">{errors.title}</p>
							)}
						</div>

						<div>
							<div className="flex items-center justify-between mb-1">
								<label className="block text-xs font-semibold text-slate-700">
									Deskripsi Lengkap Kendala
								</label>
								<span className="text-[11px] text-slate-400">Min. 10 karakter</span>
							</div>
							<textarea
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white ${
									errors.description ? "border-rose-500" : "border-slate-300"
								}`}
								placeholder="Jelaskan detail lokasi ruangan, nomor perangkat/SIMRS, dan kronologi kendala..."
								rows={4}
								required
							/>
							{errors.description && (
								<p className="text-rose-600 text-xs mt-1">
									{errors.description}
								</p>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
							disabled={isSubmitting}
						>
							Batal
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<div className="flex items-center gap-2">
									<div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Menyimpan...</span>
								</div>
							) : modalMode === "add" ? (
								"Kirim Pelaporan"
							) : (
								"Simpan Perubahan"
							)}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

export default TicketModal;
