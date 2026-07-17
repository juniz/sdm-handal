"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Edit, Trash2, Plus, X, Calendar, MapPin, CheckCircle2, Bookmark, AlertTriangle } from "lucide-react";
import {
	mutationCreateEducation,
	mutationUpdateEducation,
	mutationDeleteEducation,
} from "@/lib/profile-gql-client";

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

			if (isEdit) {
				const payload = {
					...formData,
					old_pendidikan: selectedEducation.pendidikan,
					old_sekolah: selectedEducation.sekolah,
				};
				await mutationUpdateEducation(payload);
				setEducationHistory((prev) =>
					prev.map((edu) =>
						edu.pendidikan === selectedEducation.pendidikan && edu.sekolah === selectedEducation.sekolah
							? { ...edu, ...formData }
							: edu
					)
				);
			} else {
				const newEdu = await mutationCreateEducation(formData);
				setEducationHistory((prev) => [newEdu, ...prev]);
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
			await mutationDeleteEducation(itemToDelete.pendidikan, itemToDelete.sekolah);
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
		<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
			{/* Header area */}
			<div className="flex flex-row items-center justify-between mb-4 pb-2 border-b border-slate-100">
				<div className="flex items-center gap-2.5">
					<div className="bg-[#E6F1FB] p-2 rounded-lg border border-[#185FA5]/10">
						<GraduationCap className="w-4.5 h-4.5 text-[#185FA5]" strokeWidth={2.5} />
					</div>
					<div>
						<h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-figtree">Riwayat Pendidikan</h3>
					</div>
				</div>
				<button
					onClick={() => handleOpenModal()}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-[#185FA5] text-white rounded-lg hover:bg-[#0c447c] transition-all shadow-sm text-xs font-semibold active:scale-95"
				>
					<Plus className="w-3.5 h-3.5" />
					<span>Tambah Data</span>
				</button>
			</div>

			{/* List Content */}
			{educationHistory.length === 0 ? (
				<div className="py-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
					<div className="bg-slate-100 w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">
						<Bookmark className="w-4 h-4 text-slate-400" />
					</div>
					<p className="text-slate-400 text-xs font-medium">Belum ada riwayat pendidikan.</p>
				</div>
			) : (
				<div className="space-y-2.5">
					{educationHistory.map((edu, idx) => (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.05 }}
							key={`${edu.pendidikan}-${edu.sekolah}`}
							className="group flex flex-col sm:flex-row bg-white border border-slate-100 rounded-lg overflow-hidden hover:shadow hover:border-[#185FA5]/30 transition-all duration-300"
						>
							{/* Indicator left */}
							<div className="sm:w-1 bg-[#185FA5] w-full h-0.5 sm:h-auto" />
							
							<div className="p-3.5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="space-y-1.5 flex-1">
									<div className="flex flex-wrap items-center gap-1.5">
										<span className="px-2 py-0.5 bg-[#E6F1FB] text-[#185FA5] text-[10px] font-bold rounded uppercase tracking-wider font-figtree">
											{edu.pendidikan}
										</span>
										{edu.status && (
											<span className="px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full flex items-center gap-0.5">
												<CheckCircle2 className="w-3 h-3" /> {edu.status}
											</span>
										)}
									</div>
									<h4 className="text-sm font-bold text-slate-800 leading-snug">{edu.sekolah}</h4>
									{edu.jurusan && (
										<p className="text-slate-500 font-medium text-xs flex items-center gap-1">
											<Bookmark className="w-3 h-3 text-slate-400" />
											{edu.jurusan}
										</p>
									)}
									<div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400 font-semibold pt-0.5">
										<p className="flex items-center gap-1">
											<Calendar className="w-3 h-3" /> Lulus: {edu.thn_lulus}
										</p>
										{edu.pendanaan && (
											<p className="flex items-center gap-1">
												<MapPin className="w-3 h-3" /> {edu.pendanaan}
											</p>
										)}
									</div>
								</div>
								
								{/* Actions */}
								<div className="flex items-center gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-50 sm:bg-transparent p-1.5 sm:p-0 rounded-lg sm:rounded-none justify-end shrink-0">
									<button
										onClick={() => handleOpenModal(edu)}
										className="p-1.5 text-slate-400 hover:text-[#185FA5] hover:bg-[#E6F1FB] rounded-lg transition-colors"
										title="Edit"
									>
										<Edit className="w-3.5 h-3.5" />
									</button>
									<button
										onClick={() => confirmDelete(edu)}
										className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
										title="Hapus"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			)}
			
			{/* Form Modal */}
			<AnimatePresence>
				{isModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={handleCloseModal}
							className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
						>
							<div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
								<div>
									<h2 className="text-sm font-bold tracking-tight text-slate-800 font-figtree">
										{selectedEducation ? "Perbarui Riwayat Pendidikan" : "Tambah Riwayat Baru"}
									</h2>
								</div>
								<button
									onClick={handleCloseModal}
									className="p-1.5 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
								{error && (
									<div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium">
										{error}
									</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Tingkat Pendidikan *</label>
										<select
											name="pendidikan"
											value={formData.pendidikan}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
										>
											<option value="">Pilih Tingkat</option>
											{PENDIDIKAN_ENUM.map((val) => (
												<option key={val} value={val}>{val}</option>
											))}
										</select>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Nama Instansi/Sekolah *</label>
										<input
											type="text"
											name="sekolah"
											value={formData.sekolah}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
											placeholder="Contoh: Universitas Gadjah Mada"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Jurusan / Program Studi</label>
										<input
											type="text"
											name="jurusan"
											value={formData.jurusan}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
											placeholder="Masukkan program studi"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Tahun Lulus *</label>
										<input
											type="number"
											name="thn_lulus"
											value={formData.thn_lulus}
											onChange={handleChange}
											required
											min="1950"
											max={new Date().getFullYear() + 1}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
											placeholder="2020"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Status Kelulusan</label>
										<select
											name="status"
											value={formData.status}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
										>
											<option value="">Pilih Status</option>
											<option value="Lulus">Lulus</option>
											<option value="Belum Lulus">Belum Lulus</option>
											<option value="Drop Out">Drop Out</option>
											<option value="Pindah">Pindah</option>
										</select>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Sumber Pendanaan</label>
										<select
											name="pendanaan"
											value={formData.pendanaan}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
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
										<label className="text-[10px] font-semibold text-slate-500">Kepala Sekolah / Dekan / Rektor</label>
										<input
											type="text"
											name="kepala"
											value={formData.kepala}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
											placeholder="Nama rektor/pimpinan (Opsional)"
										/>
									</div>
                                    
									<div className="md:col-span-2 space-y-1">
										<label className="text-[10px] font-semibold text-slate-500">Keterangan Tambahan</label>
										<textarea
											name="keterangan"
											value={formData.keterangan}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all resize-none font-medium"
											placeholder="Catatan tambahan..."
											rows="2"
										/>
									</div>
								</div>
							</form>

							<div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2.5">
								<button
									type="button"
									onClick={handleCloseModal}
									className="px-4 py-2 text-xs text-slate-600 font-semibold hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
									disabled={loading}
								>
									Batal
								</button>
								<button
									onClick={handleSubmit}
									disabled={loading}
									className="px-4.5 py-2 text-xs bg-[#185FA5] text-white font-semibold rounded-lg hover:bg-[#0c447c] transition-colors disabled:bg-blue-300"
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
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-24 sm:pb-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => !loading && setDeleteModalOpen(false)}
							className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden p-5"
						>
							<div className="flex flex-col items-center text-center">
								<div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3 border border-red-100">
									<AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
								</div>
								<h3 className="text-base font-bold text-slate-800 font-figtree mb-1.5">Hapus Riwayat Pendidikan?</h3>
								<p className="text-xs text-slate-500 mb-5 leading-relaxed">
									Data untuk jenjang <span className="text-slate-800 font-bold">{itemToDelete.pendidikan}</span> di <span className="text-slate-800 font-bold">{itemToDelete.sekolah}</span> akan dihapus permanen.
								</p>
								
								<div className="flex w-full gap-2.5">
									<button
										type="button"
										onClick={() => setDeleteModalOpen(false)}
										disabled={loading}
										className="flex-1 py-2 text-xs text-slate-600 font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
									>
										Batal
									</button>
									<button
										onClick={executeDelete}
										disabled={loading}
										className="flex-1 py-2 text-xs bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
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
