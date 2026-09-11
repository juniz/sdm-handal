"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Eraser, Calendar, User, Building, FileText } from "lucide-react";
import SignaturePad from "react-signature-canvas";

const RapatModal = ({
	showModal,
	setShowModal,
	modalMode,
	formData,
	setFormData,
	existingMeetingTitles = [],
	errors,
	onSubmit,
	onReset,
	signPadRef,
}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const modalRef = useRef(null);

	// Keyboard accessibility: escape to close
	useEffect(() => {
		if (showModal) {
			const handleKeyDown = (e) => {
				if (e.key === "Escape" && !isSubmitting) {
					handleClose();
				}
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [showModal, isSubmitting]);

	const handleModalSubmit = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (isSubmitting) return;

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

	const filteredSuggestions = existingMeetingTitles.filter(
		(title) =>
			title.toLowerCase().includes((formData.rapat || "").toLowerCase()) &&
			title.toLowerCase() !== (formData.rapat || "").toLowerCase()
	);

	return (
		<div
			className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="rapat-modal-title"
			onClick={(e) => {
				if (e.target === e.currentTarget && !isSubmitting) handleClose();
			}}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0, y: 10 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.95, opacity: 0, y: 10 }}
				transition={{ duration: 0.15 }}
				ref={modalRef}
				className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
			>
				{/* Modal Header */}
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
							<FileText className="w-4 h-4" />
						</div>
						<div>
							<h3
								id="rapat-modal-title"
								className="text-base font-bold text-slate-900"
							>
								{modalMode === "add"
									? "Catat Presensi Kehadiran"
									: "Edit Presensi Kehadiran"}
							</h3>
							<p className="text-xs text-slate-500">
								RS Bhayangkara Nganjuk • SDM Handal
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={handleClose}
						disabled={isSubmitting}
						className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
						aria-label="Tutup dialog"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Modal Body */}
				<form onSubmit={handleModalSubmit} className="flex-1 flex flex-col min-h-0">
					<div className="flex-1 overflow-y-auto p-6 space-y-4">
						{/* Tanggal */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
								Tanggal Pelaksanaan
							</label>
							<div className="relative">
								<Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
								<input
									type="date"
									value={formData.tanggal}
									onChange={(e) =>
										setFormData({ ...formData, tanggal: e.target.value })
									}
									className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
										errors.tanggal ? "border-red-500" : "border-slate-300"
									}`}
									required
								/>
							</div>
							{errors.tanggal && (
								<p className="text-red-600 text-xs mt-1 font-medium">
									{errors.tanggal}
								</p>
							)}
						</div>

						{/* Nama Rapat with Combobox Suggestions */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
									Nama Rapat / Agenda
								</label>
								{existingMeetingTitles.length > 0 && (
									<span className="text-[11px] text-sky-700 font-medium flex items-center gap-1">
										<Sparkles className="w-3 h-3" />
										Saran rapat aktif
									</span>
								)}
							</div>
							<div className="relative">
								<input
									type="text"
									value={formData.rapat}
									onFocus={() => setShowSuggestions(true)}
									onChange={(e) => {
										setFormData({ ...formData, rapat: e.target.value });
										setShowSuggestions(true);
									}}
									placeholder="Contoh: Rapat Komite Medik / Rapat Koordinasi..."
									className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
										errors.rapat ? "border-red-500" : "border-slate-300"
									}`}
									required
								/>
							</div>
							{errors.rapat && (
								<p className="text-red-600 text-xs mt-1 font-medium">
									{errors.rapat}
								</p>
							)}

							{/* Quick Chip Suggestions */}
							{existingMeetingTitles.length > 0 && (
								<div className="mt-2">
									<div className="text-[11px] text-slate-500 mb-1 font-medium">
										Pilih dari rapat hari ini:
									</div>
									<div className="flex flex-wrap gap-1.5">
										{existingMeetingTitles.map((title) => (
											<button
												type="button"
												key={title}
												onClick={() => {
													setFormData({ ...formData, rapat: title });
													setShowSuggestions(false);
												}}
												className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
													formData.rapat === title
														? "bg-sky-100 text-sky-800 border-sky-300 font-semibold"
														: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
												}`}
											>
												{title}
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Nama Peserta */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
								Nama Lengkap Peserta
							</label>
							<div className="relative">
								<User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
								<input
									type="text"
									value={formData.nama}
									onChange={(e) =>
										setFormData({ ...formData, nama: e.target.value })
									}
									className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
										errors.nama ? "border-red-500" : "border-slate-300"
									}`}
									placeholder="Nama peserta hadir"
									required
								/>
							</div>
							{errors.nama && (
								<p className="text-red-600 text-xs mt-1 font-medium">
									{errors.nama}
								</p>
							)}
						</div>

						{/* Instansi / Unit */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
								Unit Kerja / Jabatan / Instansi
							</label>
							<div className="relative">
								<Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
								<input
									type="text"
									value={formData.instansi}
									onChange={(e) =>
										setFormData({ ...formData, instansi: e.target.value })
									}
									className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
										errors.instansi ? "border-red-500" : "border-slate-300"
									}`}
									placeholder="Contoh: Poli Dalam / Subbag Kepegawaian"
									required
								/>
							</div>
							{errors.instansi && (
								<p className="text-red-600 text-xs mt-1 font-medium">
									{errors.instansi}
								</p>
							)}
						</div>

						{/* Tanda Tangan Canvas */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
									Tanda Tangan Digital
								</label>
								<button
									type="button"
									onClick={() => signPadRef.current?.clear()}
									className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 hover:underline"
								>
									<Eraser className="w-3.5 h-3.5" />
									<span>Bersihkan Pad</span>
								</button>
							</div>
							<div className="border border-slate-300 rounded-xl p-2 bg-slate-50/50">
								<div className="bg-white border border-slate-200 rounded-lg relative overflow-hidden">
									<SignaturePad
										ref={signPadRef}
										canvasProps={{
											className: "w-full h-36 touch-none cursor-crosshair",
										}}
									/>
									<div className="pointer-events-none absolute inset-x-4 bottom-5 border-b border-dashed border-slate-300 text-[10px] text-slate-400 text-right pr-1 select-none">
										Goreskan tanda tangan di atas garis ini
									</div>
								</div>
							</div>
							{errors.tanda_tangan && (
								<p className="text-red-600 text-xs mt-1 font-medium">
									{errors.tanda_tangan}
								</p>
							)}
						</div>
					</div>

					{/* Modal Footer */}
					<div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
						<button
							type="button"
							onClick={handleClose}
							className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
							disabled={isSubmitting}
						>
							Batal
						</button>
						<button
							type="submit"
							className={`px-5 py-2 text-sm font-semibold bg-sky-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-xs ${
								isSubmitting
									? "opacity-75 cursor-not-allowed"
									: "hover:bg-sky-700"
							}`}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<div className="flex items-center space-x-2">
									<div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									<span>Menyimpan...</span>
								</div>
							) : modalMode === "add" ? (
								"Simpan Presensi"
							) : (
								"Perbarui Presensi"
							)}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

export default RapatModal;
