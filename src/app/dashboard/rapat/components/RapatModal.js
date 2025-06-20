"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import SignaturePad from "react-signature-canvas";

const RapatModal = ({
	showModal,
	setShowModal,
	modalMode,
	formData,
	setFormData,
	errors,
	onSubmit,
	onReset,
	signPadRef,
}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleModalSubmit = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (isSubmitting) {
			return;
		}

		setIsSubmitting(true);

		try {
			const tanda_tangan = signPadRef?.current
				? signPadRef.current.toDataURL()
				: null;

			await onSubmit(tanda_tangan);
		} catch (error) {
			console.error("Error submitting form:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		onReset();
		setShowModal(false);
	};

	if (!showModal) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className="bg-white rounded-lg p-6 w-full max-w-lg"
			>
				<h3 className="text-lg font-semibold mb-4">
					{modalMode === "add" ? "Tambah Rapat" : "Edit Rapat"}
				</h3>
				<form onSubmit={handleModalSubmit}>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Tanggal
							</label>
							<input
								type="date"
								value={formData.tanggal}
								onChange={(e) =>
									setFormData({ ...formData, tanggal: e.target.value })
								}
								className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
									errors.tanggal ? "border-red-500" : ""
								}`}
								required
							/>
							{errors.tanggal && (
								<p className="text-red-500 text-sm mt-1">{errors.tanggal}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Nama Rapat
							</label>
							<input
								type="text"
								value={formData.rapat}
								onChange={(e) =>
									setFormData({ ...formData, rapat: e.target.value })
								}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan nama rapat"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Nama Peserta
							</label>
							<input
								type="text"
								value={formData.nama}
								onChange={(e) =>
									setFormData({ ...formData, nama: e.target.value })
								}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan nama peserta"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Instansi
							</label>
							<input
								type="text"
								value={formData.instansi}
								onChange={(e) =>
									setFormData({ ...formData, instansi: e.target.value })
								}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan nama instansi"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Tanda Tangan
							</label>
							<div className="border rounded-lg p-2 bg-white">
								<SignaturePad
									ref={signPadRef}
									canvasProps={{
										className: "w-full h-40",
									}}
								/>
								<button
									type="button"
									onClick={() => signPadRef.current?.clear()}
									className="text-sm text-gray-500 hover:text-gray-700 mt-2"
								>
									Hapus Tanda Tangan
								</button>
							</div>
						</div>
					</div>
					<div className="flex justify-end space-x-2 mt-6">
						<button
							type="button"
							onClick={handleClose}
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
								"Tambah"
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

export default RapatModal;
