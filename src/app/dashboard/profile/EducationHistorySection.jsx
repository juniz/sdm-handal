"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Edit, Trash2, Plus, X, Calendar, MapPin, CheckCircle2, Bookmark, AlertTriangle } from "lucide-react";

export default function EducationHistorySection({ initialData = [] }) {
	const [educationHistory, setEducationHistory] = useState(initialData);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedEducation, setSelectedEducation] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		pendidikan: "",
		sekolah: "",
		jurusan: "",
		thn_lulus: "",
		kepala: "",
		pendanaan: "",
		keterangan: "",
		status: "",
		berkas: "-",
	});

	const PENDIDIKAN_ENUM = [
		'SD', 'SMP', 'SMA', 'SMK', 'D I', 'D II', 'D III', 'D IV', 
		'S1', 'S1 Profesi', 'S2', 'S2 Profesi', 'S3', 'Post Doctor'
	];


	// Keep syncing with initialData if profile page refreshes it
	useEffect(() => {
		setEducationHistory(initialData);
	}, [initialData]);

	const handleOpenModal = (education = null) => {
		setError("");
		if (education) {
			setSelectedEducation(education);
			setFormData({
				pendidikan: education.pendidikan || "",
				sekolah: education.sekolah || "",
				jurusan: education.jurusan || "",
				thn_lulus: education.thn_lulus || "",
				kepala: education.kepala || "",
				pendanaan: education.pendanaan || "",
				keterangan: education.keterangan || "",
				status: education.status || "",
				berkas: education.berkas || "-",
			});
		} else {
			setSelectedEducation(null);
			setFormData({
				pendidikan: "",
				sekolah: "",
				jurusan: "",
				thn_lulus: "",
				kepala: "",
				pendanaan: "",
				keterangan: "",
				status: "",
				berkas: "-",
			});
		}
		setIsModalOpen(true);
	};

	const handleCloseModal = () => setIsModalOpen(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const isEdit = !!selectedEducation;
			let response;

			if (isEdit) {
				const payload = {
					...formData,
					old_pendidikan: selectedEducation.pendidikan,
					old_sekolah: selectedEducation.sekolah,
				};
				response = await fetch("/api/profile/education", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			} else {
				response = await fetch("/api/profile/education", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData),
				});
			}

			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Gagal menyimpan riwayat pendidikan");

			if (isEdit) {
				// Update in place
				setEducationHistory((prev) =>
					prev.map((edu) =>
						edu.pendidikan === selectedEducation.pendidikan && edu.sekolah === selectedEducation.sekolah
							? data.data
							: edu
					)
				);
			} else {
				// Prevent duplicate append issues, fetching the list again conceptually is cleaner, but doing state is fine
				setEducationHistory((prev) => [data.data, ...prev]);
			}
			handleCloseModal();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const confirmDelete = (education) => {
		setItemToDelete(education);
		setDeleteModalOpen(true);
	};

	const executeDelete = async () => {
		if (!itemToDelete) return;
		setLoading(true);
		
		try {
			const response = await fetch(
				`/api/profile/education?pendidikan=${encodeURIComponent(itemToDelete.pendidikan)}&sekolah=${encodeURIComponent(itemToDelete.sekolah)}`, 
				{ method: "DELETE" }
			);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Gagal menghapus data");

			setEducationHistory((prev) =>
				prev.filter((edu) => !(edu.pendidikan === itemToDelete.pendidikan && edu.sekolah === itemToDelete.sekolah))
			);
			
			setDeleteModalOpen(false);
			setItemToDelete(null);
		} catch (err) {
			console.error(err);
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 mt-6">
			{/* Header area */}
			<div className="flex flex-row items-center justify-between mb-6 pb-4 border-b border-gray-100">
				<div className="flex items-center gap-3">
					<div className="bg-[#0093dd]/10 p-2.5 rounded-lg border border-[#0093dd]/20">
						<GraduationCap className="w-5 h-5 text-[#0093dd]" strokeWidth={2.5} />
					</div>
					<div>
						<h3 className="text-xl font-bold text-gray-800 tracking-tight">Riwayat Pendidikan</h3>
						<p className="text-sm text-gray-500">Informasi akademis dan jenjang studi</p>
					</div>
				</div>
				<button
					onClick={() => handleOpenModal()}
					className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 bg-[#0093dd] text-white rounded-lg hover:bg-[#007dba] transition-all shadow-sm hover:shadow-md text-sm font-medium"
				>
					<Plus className="w-5 h-5 sm:w-4 sm:h-4" />
					<span className="hidden sm:inline">Tambah Data</span>
				</button>
			</div>

			{/* List Content */}
			{educationHistory.length === 0 ? (
				<div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
					<div className="bg-gray-100/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
						<Bookmark className="w-6 h-6 text-gray-400" />
					</div>
					<p className="text-gray-500 font-medium">Belum ada riwayat pendidikan yang ditambahkan.</p>

				</div>
			) : (
				<div className="space-y-4">
					{educationHistory.map((edu, idx) => (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.05 }}
							key={`${edu.pendidikan}-${edu.sekolah}`}
							className="group flex flex-col sm:flex-row bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:border-[#0093dd]/30"
						>
							{/* Indicator left */}
							<div className="sm:w-2 bg-[#0093dd] w-full h-1 sm:h-auto" />
							
							<div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="space-y-2 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="px-2.5 py-0.5 bg-[#0093dd]/10 text-[#0093dd] text-xs font-bold rounded uppercase tracking-wider">
											{edu.pendidikan}
										</span>
										{edu.status && (
											<span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
												<CheckCircle2 className="w-3 h-3" /> {edu.status}
											</span>
										)}
									</div>
									<h4 className="text-lg font-bold text-gray-800 leading-snug">{edu.sekolah}</h4>
									{edu.jurusan && (
										<p className="text-gray-600 font-medium text-sm flex items-center gap-1.5">
											<Bookmark className="w-3.5 h-3.5 text-gray-400" />
											{edu.jurusan}
										</p>
									)}
									<div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-gray-500 font-medium pt-1">
										<p className="flex items-center gap-1.5">
											<Calendar className="w-3.5 h-3.5" /> Lulus: {edu.thn_lulus}
										</p>
										{edu.pendanaan && (
											<p className="flex items-center gap-1.5">
												<MapPin className="w-3.5 h-3.5" /> {edu.pendanaan}
											</p>
										)}
									</div>
								</div>
								
								{/* Actions */}
								<div className="flex items-center gap-2 sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none justify-end">
									<button
										onClick={() => handleOpenModal(edu)}
										className="p-2 text-gray-400 hover:text-[#0093dd] hover:bg-[#0093dd]/10 rounded-lg transition-colors"
										title="Edit"
									>
										<Edit className="w-4 h-4" />
									</button>
									<button
										onClick={() => confirmDelete(edu)}
										className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
										title="Hapus"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			)}
			
			<div className="sm:hidden mt-4">
				<button
					onClick={() => handleOpenModal()}
					className="w-full justify-center flex items-center gap-2 px-4 py-3 bg-[#0093dd] text-white rounded-lg hover:bg-[#007dba] transition-all shadow-sm font-semibold"
				>
					<Plus className="w-4 h-4" strokeWidth={3} />
					<span>Tambah Baru</span>
				</button>
			</div>

			{/* Form Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={handleCloseModal}
							className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
						>
							<div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
								<div>
									<h2 className="text-xl font-bold tracking-tight text-gray-800">
										{selectedEducation ? "Perbarui Riwayat" : "Tambah Riwayat Baru"}
									</h2>
									<p className="text-xs text-gray-500 font-medium mt-0.5">Isi rincian pendidikan dengan akurat</p>
								</div>
								<button
									onClick={handleCloseModal}
									className="p-2 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
								{error && (
									<div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-red-500" /> {error}
									</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div className="space-y-1">
										<label className="text-sm font-bold text-gray-700">Tingkat Pendidikan *</label>
										<select
											name="pendidikan"
											value={formData.pendidikan}
											onChange={handleChange}
											required
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
										>
											<option value="">Pilih Tingkat</option>
											{PENDIDIKAN_ENUM.map((val) => (
												<option key={val} value={val}>{val}</option>
											))}
										</select>

									</div>

									<div className="space-y-1">
										<label className="text-sm font-bold text-gray-700">Nama Instansi/Sekolah *</label>
										<input
											type="text"
											name="sekolah"
											value={formData.sekolah}
											onChange={handleChange}
											required
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
											placeholder="Contoh: Universitas Gadjah Mada"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-sm font-bold text-gray-700">Jurusan/Program Studi</label>
										<input
											type="text"
											name="jurusan"
											value={formData.jurusan}
											onChange={handleChange}
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
											placeholder="Masukkan program studi"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-sm font-bold text-gray-700">Tahun Lulus *</label>
										<input
											type="number"
											name="thn_lulus"
											value={formData.thn_lulus}
											onChange={handleChange}
											required
											min="1950"
											max={new Date().getFullYear() + 1}
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
											placeholder="2020"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-sm font-bold text-gray-700">Status</label>
										<select
											name="status"
											value={formData.status}
											onChange={handleChange}
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
										>
											<option value="">Pilih Status</option>
											<option value="Lulus">Lulus</option>
											<option value="Belum Lulus">Belum Lulus</option>
											<option value="Drop Out">Drop Out</option>
											<option value="Pindah">Pindah</option>
										</select>
									</div>

									<div className="space-y-1">
										<label className="text-sm font-bold text-gray-700">Pendanaan</label>
										<select
											name="pendanaan"
											value={formData.pendanaan}
											onChange={handleChange}
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
										>
											<option value="">Pilihan Pendanaan</option>
											<option value="Biaya Sendiri">Biaya Sendiri</option>
											<option value="Biaya Instansi Sendiri">Biaya Instansi Sendiri</option>
											<option value="Lembaga Swasta Kerjasama">Lembaga Swasta Kerjasama</option>
											<option value="Lembaga Swasta Kompetisi">Lembaga Swasta Kompetisi</option>
											<option value="Lembaga Pemerintah Kerjasama">Lembaga Pemerintah Kerjasama</option>
											<option value="Lembaga Pemerintah Kompetisi">Lembaga Pemerintah Kompetisi</option>
											<option value="Lembaga Internasional">Lembaga Internasional</option>
										</select>
									</div>

									<div className="md:col-span-2 space-y-1">
										<label className="text-sm font-bold text-gray-700">Kepala Sekolah / Rektor</label>
										<input
											type="text"
											name="kepala"
											value={formData.kepala}
											onChange={handleChange}
											className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium"
											placeholder="Nama rektor/pimpinan (Opsional)"
										/>
									</div>
                                    
									<div className="md:col-span-2 space-y-1">
										<label className="text-sm font-bold text-gray-700">Keterangan</label>
										<textarea
											name="keterangan"
											value={formData.keterangan}
											onChange={handleChange}
											className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/30 focus:border-[#0093dd] transition-all font-medium resize-y"
											placeholder="Tambahkan detail relevan jika diperlukan"
											rows="2"
										/>
									</div>
								</div>
							</form>

							<div className="p-5 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
								<button
									type="button"
									onClick={handleCloseModal}
									className="px-6 py-2.5 text-gray-600 font-semibold hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
									disabled={loading}
								>
									Batal
								</button>
								<button
									onClick={handleSubmit}
									disabled={loading}
									className="px-6 py-2.5 bg-[#0093dd] text-white font-semibold rounded-xl hover:bg-[#007dba] transition-colors disabled:bg-blue-300 shadow-sm shadow-[#0093dd]/20"
								>
									{loading ? "Menyimpan..." : selectedEducation ? "Simpan Perubahan" : "Simpan Data"}
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Delete Confirmation Modal */}
			<AnimatePresence>
				{deleteModalOpen && itemToDelete && (
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => !loading && setDeleteModalOpen(false)}
							className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6"
						>
							<div className="flex flex-col items-center text-center">
								<div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
									<AlertTriangle className="w-7 h-7" strokeWidth={2.5} />
								</div>
								<h3 className="text-xl font-bold text-gray-800 tracking-tight mb-2">Hapus Riwayat Pendidikan?</h3>
								<p className="text-sm text-gray-500 font-medium mb-1">
									Data untuk jenjang <span className="text-gray-800 font-bold">{itemToDelete.pendidikan}</span> di <span className="text-gray-800 font-bold">{itemToDelete.sekolah}</span> akan dihapus permanen.
								</p>
								<p className="text-xs text-red-500 font-semibold mb-6">Tindakan ini tidak dapat dibatalkan.</p>
								
								<div className="flex w-full gap-3">
									<button
										type="button"
										onClick={() => setDeleteModalOpen(false)}
										disabled={loading}
										className="flex-1 py-2.5 text-gray-600 font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
									>
										Batal
									</button>
									<button
										onClick={executeDelete}
										disabled={loading}
										className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-500/20 disabled:opacity-50"
									>
										{loading ? "Menghapus..." : "Ya, Hapus"}
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
