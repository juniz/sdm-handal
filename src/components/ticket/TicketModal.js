import { useState } from "react";
import { motion } from "framer-motion";

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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
			>
				<h3 className="text-lg font-semibold mb-4">
					{modalMode === "add" ? "Buat Pelaporan Baru" : "Edit Pelaporan"}
				</h3>
				<form onSubmit={handleModalSubmit}>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Kategori
								</label>
								<select
									value={formData.category_id}
									onChange={(e) =>
										setFormData({ ...formData, category_id: e.target.value })
									}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.category_id ? "border-red-500" : ""
									}`}
									required
								>
									<option value="">Pilih Kategori</option>
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
									<p className="text-red-500 text-sm mt-1">
										{errors.category_id}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Prioritas
								</label>
								<select
									value={formData.priority_id}
									onChange={(e) =>
										setFormData({ ...formData, priority_id: e.target.value })
									}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.priority_id ? "border-red-500" : ""
									}`}
									required
								>
									<option value="">Pilih Prioritas</option>
									{masterData.priorities?.map((priority) => (
										<option
											key={priority.priority_id}
											value={priority.priority_id}
										>
											{priority.priority_name}
										</option>
									))}
								</select>
								{errors.priority_id && (
									<p className="text-red-500 text-sm mt-1">
										{errors.priority_id}
									</p>
								)}
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Judul
							</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
									errors.title ? "border-red-500" : ""
								}`}
								placeholder="Masukkan judul masalah"
								required
							/>
							{errors.title && (
								<p className="text-red-500 text-sm mt-1">{errors.title}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Deskripsi
							</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
									errors.description ? "border-red-500" : ""
								}`}
								placeholder="Jelaskan masalah secara detail"
								rows={4}
								required
							/>
							{errors.description && (
								<p className="text-red-500 text-sm mt-1">
									{errors.description}
								</p>
							)}
						</div>
					</div>

					<div className="flex justify-end space-x-2 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
							disabled={isSubmitting}
						>
							Batal
						</button>
						<button
							type="submit"
							className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
								isSubmitting
									? "opacity-75 cursor-not-allowed"
									: "hover:bg-blue-600"
							}`}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<div className="flex items-center space-x-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Menyimpan...</span>
								</div>
							) : modalMode === "add" ? (
								"Buat Pelaporan"
							) : (
								"Simpan"
							)}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

export default TicketModal;
