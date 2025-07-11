import { useState, useEffect } from "react";
import {
	X,
	Save,
	Loader2,
	AlertTriangle,
	Upload,
	FileText,
	Calendar,
	Clock,
	Zap,
} from "lucide-react";

export default function RequestModal({
	isOpen,
	onClose,
	onSave,
	request = null,
	masterData,
	isLoading = false,
}) {
	const [formData, setFormData] = useState({
		module_type_id: "",
		priority_id: "",
		title: "",
		description: "",
		current_system_issues: "",
		proposed_solution: "",
		expected_completion_date: "",
	});

	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!request;

	// Reset form when modal opens/closes or request changes
	useEffect(() => {
		if (isOpen) {
			if (isEditing && request) {
				setFormData({
					module_type_id: request.module_type_id || "",
					priority_id: request.priority_id || "",
					title: request.title || "",
					description: request.description || "",
					current_system_issues: request.current_system_issues || "",
					proposed_solution: request.proposed_solution || "",
					expected_completion_date: request.expected_completion_date || "",
				});
			} else {
				setFormData({
					module_type_id: "",
					priority_id: "",
					title: "",
					description: "",
					current_system_issues: "",
					proposed_solution: "",
					expected_completion_date: "",
				});
			}
			setErrors({});
		}
	}, [isOpen, request, isEditing]);

	const validateForm = () => {
		const newErrors = {};

		// Required fields
		if (!formData.module_type_id) {
			newErrors.module_type_id = "Jenis modul wajib dipilih";
		}
		if (!formData.priority_id) {
			newErrors.priority_id = "Prioritas wajib dipilih";
		}
		if (!formData.title || formData.title.trim().length < 10) {
			newErrors.title = "Judul minimal 10 karakter";
		}
		if (formData.title && formData.title.length > 255) {
			newErrors.title = "Judul maksimal 255 karakter";
		}
		if (!formData.description || formData.description.trim().length < 50) {
			newErrors.description = "Deskripsi minimal 50 karakter";
		}
		if (formData.description && formData.description.length > 5000) {
			newErrors.description = "Deskripsi maksimal 5000 karakter";
		}

		// Optional field validations
		if (
			formData.current_system_issues &&
			formData.current_system_issues.length > 5000
		) {
			newErrors.current_system_issues = "Maksimal 5000 karakter";
		}
		if (
			formData.proposed_solution &&
			formData.proposed_solution.length > 5000
		) {
			newErrors.proposed_solution = "Maksimal 5000 karakter";
		}

		// Date validation
		if (formData.expected_completion_date) {
			const selectedDate = new Date(formData.expected_completion_date);
			const today = new Date();
			const maxDate = new Date();
			maxDate.setFullYear(today.getFullYear() + 2);

			if (selectedDate < today) {
				newErrors.expected_completion_date = "Tanggal tidak boleh di masa lalu";
			}
			if (selectedDate > maxDate) {
				newErrors.expected_completion_date =
					"Tanggal maksimal 2 tahun ke depan";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			await onSave(formData);
			onClose();
		} catch (error) {
			console.error("Error saving request:", error);
			// Handle specific API errors here if needed
		} finally {
			setIsSubmitting(false);
		}
	};

	const getPriorityColor = (priorityId) => {
		const priority = masterData?.priorities?.find(
			(p) => p.priority_id == priorityId
		);
		return priority?.priority_color || "#6c757d";
	};

	const getPriorityLevel = (priorityId) => {
		const priority = masterData?.priorities?.find(
			(p) => p.priority_id == priorityId
		);
		return priority?.priority_level || 5;
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">
						{isEditing
							? "Edit Pengajuan Pengembangan"
							: "Pengajuan Pengembangan Baru"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						disabled={isSubmitting}
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="overflow-y-auto max-h-[calc(90vh-180px)]"
				>
					<div className="p-6 space-y-6">
						{/* Basic Information */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Module Type */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Jenis Modul <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
									<select
										value={formData.module_type_id}
										onChange={(e) =>
											handleInputChange("module_type_id", e.target.value)
										}
										className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
											errors.module_type_id
												? "border-red-300"
												: "border-gray-300"
										}`}
									>
										<option value="">Pilih jenis modul</option>
										{masterData?.moduleTypes?.map((type) => (
											<option key={type.type_id} value={type.type_id}>
												{type.type_name}
											</option>
										))}
									</select>
								</div>
								{errors.module_type_id && (
									<p className="mt-1 text-sm text-red-600">
										{errors.module_type_id}
									</p>
								)}
							</div>

							{/* Priority */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Prioritas <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
									<select
										value={formData.priority_id}
										onChange={(e) =>
											handleInputChange("priority_id", e.target.value)
										}
										className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
											errors.priority_id ? "border-red-300" : "border-gray-300"
										}`}
									>
										<option value="">Pilih prioritas</option>
										{masterData?.priorities?.map((priority) => (
											<option
												key={priority.priority_id}
												value={priority.priority_id}
											>
												{priority.priority_name} -{" "}
												{priority.priority_description}
											</option>
										))}
									</select>
								</div>
								{formData.priority_id && (
									<div className="mt-2">
										<span
											className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
											style={{
												backgroundColor: getPriorityColor(formData.priority_id),
											}}
										>
											{getPriorityLevel(formData.priority_id) <= 2 && (
												<AlertTriangle className="w-3 h-3 mr-1" />
											)}
											{getPriorityLevel(formData.priority_id) === 3 && (
												<Clock className="w-3 h-3 mr-1" />
											)}
											{getPriorityLevel(formData.priority_id) > 3 && (
												<Zap className="w-3 h-3 mr-1" />
											)}
											{
												masterData?.priorities?.find(
													(p) => p.priority_id == formData.priority_id
												)?.priority_name
											}
										</span>
									</div>
								)}
								{errors.priority_id && (
									<p className="mt-1 text-sm text-red-600">
										{errors.priority_id}
									</p>
								)}
							</div>
						</div>

						{/* Title */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Judul Pengajuan <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) => handleInputChange("title", e.target.value)}
								placeholder="Contoh: Sistem Manajemen Inventori untuk Gudang"
								className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
									errors.title ? "border-red-300" : "border-gray-300"
								}`}
								maxLength={255}
							/>
							<div className="flex justify-between mt-1">
								{errors.title ? (
									<p className="text-sm text-red-600">{errors.title}</p>
								) : (
									<p className="text-sm text-gray-500">
										Minimal 10 karakter, maksimal 255 karakter
									</p>
								)}
								<span className="text-sm text-gray-400">
									{formData.title.length}/255
								</span>
							</div>
						</div>

						{/* Description */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Deskripsi Lengkap <span className="text-red-500">*</span>
							</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									handleInputChange("description", e.target.value)
								}
								placeholder="Jelaskan secara detail tentang aplikasi atau modul yang dibutuhkan, termasuk fitur-fitur utama yang diinginkan..."
								rows={6}
								className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
									errors.description ? "border-red-300" : "border-gray-300"
								}`}
								maxLength={5000}
							/>
							<div className="flex justify-between mt-1">
								{errors.description ? (
									<p className="text-sm text-red-600">{errors.description}</p>
								) : (
									<p className="text-sm text-gray-500">
										Minimal 50 karakter, maksimal 5000 karakter
									</p>
								)}
								<span className="text-sm text-gray-400">
									{formData.description.length}/5000
								</span>
							</div>
						</div>

						{/* Optional Fields */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Current System Issues */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Masalah Sistem Saat Ini
								</label>
								<textarea
									value={formData.current_system_issues}
									onChange={(e) =>
										handleInputChange("current_system_issues", e.target.value)
									}
									placeholder="Jelaskan masalah atau keterbatasan sistem yang ada saat ini..."
									rows={4}
									className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
										errors.current_system_issues
											? "border-red-300"
											: "border-gray-300"
									}`}
									maxLength={5000}
								/>
								<div className="flex justify-between mt-1">
									{errors.current_system_issues ? (
										<p className="text-sm text-red-600">
											{errors.current_system_issues}
										</p>
									) : (
										<p className="text-sm text-gray-500">
											Opsional, maksimal 5000 karakter
										</p>
									)}
									<span className="text-sm text-gray-400">
										{formData.current_system_issues.length}/5000
									</span>
								</div>
							</div>

							{/* Proposed Solution */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Solusi yang Diusulkan
								</label>
								<textarea
									value={formData.proposed_solution}
									onChange={(e) =>
										handleInputChange("proposed_solution", e.target.value)
									}
									placeholder="Jelaskan solusi atau pendekatan yang Anda usulkan..."
									rows={4}
									className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
										errors.proposed_solution
											? "border-red-300"
											: "border-gray-300"
									}`}
									maxLength={5000}
								/>
								<div className="flex justify-between mt-1">
									{errors.proposed_solution ? (
										<p className="text-sm text-red-600">
											{errors.proposed_solution}
										</p>
									) : (
										<p className="text-sm text-gray-500">
											Opsional, maksimal 5000 karakter
										</p>
									)}
									<span className="text-sm text-gray-400">
										{formData.proposed_solution.length}/5000
									</span>
								</div>
							</div>
						</div>

						{/* Expected Completion Date */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Target Penyelesaian
							</label>
							<div className="relative">
								<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<input
									type="date"
									value={formData.expected_completion_date}
									onChange={(e) =>
										handleInputChange(
											"expected_completion_date",
											e.target.value
										)
									}
									className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.expected_completion_date
											? "border-red-300"
											: "border-gray-300"
									}`}
									min={new Date().toISOString().split("T")[0]}
									max={
										new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)
											.toISOString()
											.split("T")[0]
									}
								/>
							</div>
							{errors.expected_completion_date ? (
								<p className="mt-1 text-sm text-red-600">
									{errors.expected_completion_date}
								</p>
							) : (
								<p className="mt-1 text-sm text-gray-500">
									Opsional, estimasi waktu penyelesaian yang diharapkan
								</p>
							)}
						</div>

						{/* Info Box */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
								<div className="text-sm text-blue-800">
									<h4 className="font-medium mb-1">Informasi Penting:</h4>
									<ul className="list-disc list-inside space-y-1">
										<li>Pengajuan akan direview oleh tim IT</li>
										<li>
											Anda akan mendapat notifikasi setiap perubahan status
										</li>
										<li>
											File pendukung dapat ditambahkan setelah pengajuan dibuat
										</li>
										<li>
											Estimasi waktu pengembangan akan diberikan setelah
											analisis
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</form>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						disabled={isSubmitting}
					>
						Batal
					</button>
					<button
						type="submit"
						onClick={handleSubmit}
						disabled={isSubmitting || isLoading}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Menyimpan...</span>
							</>
						) : (
							<>
								<Save className="w-4 h-4" />
								<span>{isEditing ? "Update" : "Buat Pengajuan"}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
