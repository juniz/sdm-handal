"use client";

import { useState } from "react";

export default function UploadExcelModal({ isOpen, onClose, onUpload }) {
	const [file, setFile] = useState(null);
	const [periodeTahun, setPeriodeTahun] = useState(
		new Date().getFullYear()
	);
	const [periodeBulan, setPeriodeBulan] = useState(
		new Date().getMonth() + 1
	);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	const [result, setResult] = useState(null);

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
	const months = [
		{ value: 1, label: "Januari" },
		{ value: 2, label: "Februari" },
		{ value: 3, label: "Maret" },
		{ value: 4, label: "April" },
		{ value: 5, label: "Mei" },
		{ value: 6, label: "Juni" },
		{ value: 7, label: "Juli" },
		{ value: 8, label: "Agustus" },
		{ value: 9, label: "September" },
		{ value: 10, label: "Oktober" },
		{ value: 11, label: "November" },
		{ value: 12, label: "Desember" },
	];

	const handleFileChange = (e) => {
		const selectedFile = e.target.files[0];
		if (selectedFile) {
			const ext = selectedFile.name
				.split(".")
				.pop()
				.toLowerCase();
			if (!["xlsx", "xls"].includes(ext)) {
				setError("File harus berformat Excel (.xlsx atau .xls)");
				setFile(null);
				return;
			}
			setFile(selectedFile);
			setError(null);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setResult(null);

		if (!file) {
			setError("Pilih file Excel terlebih dahulu");
			return;
		}

		setUploading(true);
		try {
			const result = await onUpload(file, periodeTahun, periodeBulan);
			setResult(result);
			setFile(null);
			// Auto close setelah 5 detik jika berhasil
			if (result && result.success_count > 0) {
				setTimeout(() => {
					handleClose();
				}, 5000);
			}
		} catch (err) {
			setError(err.message || "Gagal upload file");
		} finally {
			setUploading(false);
		}
	};

	const handleDownloadTemplate = async () => {
		try {
			const response = await fetch("/api/gaji/template");
			if (!response.ok) {
				throw new Error("Gagal download template");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "Template_Gaji_Pegawai.xlsx";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			setError(err.message || "Gagal download template Excel");
		}
	};

	const handleClose = () => {
		setFile(null);
		setError(null);
		setResult(null);
		setPeriodeTahun(new Date().getFullYear());
		setPeriodeBulan(new Date().getMonth() + 1);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<h2 className="text-xl font-bold mb-4">Upload Excel Gaji</h2>

					<form onSubmit={handleSubmit}>
						{/* Periode */}
						<div className="grid grid-cols-2 gap-4 mb-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tahun
								</label>
								<select
									value={periodeTahun}
									onChange={(e) =>
										setPeriodeTahun(parseInt(e.target.value))
									}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{years.map((year) => (
										<option key={year} value={year}>
											{year}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Bulan
								</label>
								<select
									value={periodeBulan}
									onChange={(e) =>
										setPeriodeBulan(parseInt(e.target.value))
									}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{months.map((month) => (
										<option key={month.value} value={month.value}>
											{month.label}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* File Upload */}
						<div className="mb-4">
							<div className="flex justify-between items-center mb-1">
								<label className="block text-sm font-medium text-gray-700">
									File Excel
								</label>
								<button
									type="button"
									onClick={handleDownloadTemplate}
									className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									Download Template
								</button>
							</div>
							<input
								type="file"
								accept=".xlsx,.xls"
								onChange={handleFileChange}
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<p className="mt-1 text-xs text-gray-500">
								Format: NIK, Nama, Jenis (Gaji/Jasa), Total Gaji
							</p>
						</div>

						{/* Error */}
						{error && (
							<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
								{error}
							</div>
						)}

						{/* Result */}
						{result && (
							<div className="mb-4 p-4 bg-green-50 border border-green-400 rounded">
								<h3 className="font-semibold text-green-800 mb-2">
									Upload Selesai
								</h3>
								<div className="text-sm text-green-700 space-y-1">
									<p>
										Total Records: {result.total_records || 0}
									</p>
									<p>
										Berhasil: {result.success_count || 0}
									</p>
									<p>
										Gagal: {result.error_count || 0}
									</p>
									{result.errors && result.errors.length > 0 && (
										<div className="mt-2">
											<p className="font-semibold">Error Details:</p>
											<ul className="list-disc list-inside mt-1">
												{result.errors.slice(0, 5).map((err, idx) => (
													<li key={idx}>
														Baris {err.row}: {err.message}
													</li>
												))}
											</ul>
											{result.errors.length > 5 && (
												<p className="text-xs mt-1">
													... dan {result.errors.length - 5} error lainnya
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={handleClose}
								disabled={uploading}
								className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={uploading || !file}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
							>
								{uploading ? "Mengupload..." : "Upload"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

