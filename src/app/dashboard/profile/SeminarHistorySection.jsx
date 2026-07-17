"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, Plus, X, Calendar, MapPin, CheckCircle2, Bookmark, FolderOpen, Award } from "lucide-react";
import {
	mutationCreateSeminar,
	mutationUpdateSeminar,
	mutationDeleteSeminar,
} from "@/lib/profile-gql-client";

export default function SeminarHistorySection({ initialData = [] }) {
	const [seminarHistory, setSeminarHistory] = useState(initialData);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedSeminar, setSelectedSeminar] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		tingkat: "",
		jenis: "",
		nama_seminar: "",
		peranan: "",
		mulai: "",
		selesai: "",
		penyelengara: "",
		tempat: "",
		berkas: "-",
	});

	const TINGKAT_ENUM = ['Local', 'Regional', 'Nasional', 'Internasional'];
	const JENIS_ENUM = ['WORKSHOP', 'SIMPOSIUM', 'SEMINAR', 'FGD', 'PELATIHAN', 'LAINNYA'];

	useEffect(() => {
		setSeminarHistory(initialData);
	}, [initialData]);

	const handleOpenModal = (seminar = null) => {
		setError("");
		if (seminar) {
			setSelectedSeminar(seminar);
			const fmtMulai = seminar.mulai ? seminar.mulai.split("T")[0] : "";
			const fmtSelesai = seminar.selesai ? seminar.selesai.split("T")[0] : "";
			
			setFormData({
				tingkat: seminar.tingkat || "",
				jenis: seminar.jenis || "",
				nama_seminar: seminar.nama_seminar || "",
				peranan: seminar.peranan || "",
				mulai: fmtMulai,
				selesai: fmtSelesai,
				penyelengara: seminar.penyelengara || "",
				tempat: seminar.tempat || "",
				berkas: seminar.berkas || "-",
			});
		} else {
			setSelectedSeminar(null);
			setFormData({
				tingkat: "",
				jenis: "",
				nama_seminar: "",
				peranan: "",
				mulai: "",
				selesai: "",
				penyelengara: "",
				tempat: "",
				berkas: "-",
			});
		}
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedSeminar(null);
		setError("");
	};

	const handleCloseDeleteModal = () => {
		setDeleteModalOpen(false);
		setItemToDelete(null);
		setError("");
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const isEdit = !!selectedSeminar;
			const payload = { ...formData };
			
			if (isEdit) {
				payload.old_nama_seminar = selectedSeminar.nama_seminar;
				payload.old_mulai = selectedSeminar.mulai;
				await mutationUpdateSeminar(payload);
				setSeminarHistory((prev) =>
					prev.map((item) =>
						(item.nama_seminar === selectedSeminar.nama_seminar && item.mulai === selectedSeminar.mulai)
							? { ...item, ...formData }
							: item
					)
				);
			} else {
				const newSem = await mutationCreateSeminar(payload);
				setSeminarHistory((prev) => [newSem, ...prev]);
			}

			handleCloseModal();
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const confirmDelete = (seminar) => {
		setItemToDelete(seminar);
		setDeleteModalOpen(true);
	};

	const handleDelete = async () => {
		setLoading(true);
		setError("");

		try {
			await mutationDeleteSeminar(itemToDelete.nama_seminar, itemToDelete.mulai);
			setSeminarHistory((prev) =>
				prev.filter(
					(item) =>
						!(item.nama_seminar === itemToDelete.nama_seminar && item.mulai === itemToDelete.mulai)
				)
			);
			handleCloseDeleteModal();
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const formatDateIndo = (dateStr) => {
		if (!dateStr) return "-";
		const dateObj = new Date(dateStr);
		if (isNaN(dateObj.getTime())) return dateStr;
		return dateObj.toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric"
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
				<div className="flex items-center gap-2.5">
					<div className="bg-[#E6F1FB] p-2 rounded-lg border border-[#185FA5]/10">
						<Award className="w-4.5 h-4.5 text-[#185FA5]" />
					</div>
					<div>
						<h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-figtree">
							Riwayat Pelatihan & Seminar
						</h2>
					</div>
				</div>
				<button
					onClick={() => handleOpenModal()}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-[#185FA5] text-white rounded-lg hover:bg-[#0c447c] transition-all text-xs font-semibold shadow-sm active:scale-95"
				>
					<Plus className="w-3.5 h-3.5" />
					<span>Tambah Data</span>
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{seminarHistory.length > 0 ? (
					seminarHistory.map((item, index) => (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							key={`${item.nama_seminar}-${item.mulai}`}
							className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:border-[#185FA5]/30 hover:shadow transition-all duration-300 group relative"
						>
							<div className="absolute top-3 right-3 flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-1.5">
								<button
									onClick={() => handleOpenModal(item)}
									className="p-1 bg-[#E6F1FB] text-[#185FA5] rounded-md hover:bg-[#185FA5]/10 transition-colors"
									title="Ubah Data"
								>
									<Edit className="w-3.5 h-3.5" />
								</button>
								<button
									onClick={() => confirmDelete(item)}
									className="p-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
									title="Hapus Data"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>

							<div className="p-4.5">
								<div className="flex items-start gap-3">
									<div className="hidden sm:flex h-9 w-9 rounded-lg bg-[#E6F1FB] items-center justify-center flex-shrink-0 text-[#185FA5]">
										<Bookmark className="w-4.5 h-4.5" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="pr-14">
											<span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#E6F1FB] text-[#185FA5] mb-1.5 uppercase tracking-wider font-figtree">
												{item.jenis} - {item.tingkat}
											</span>
											<h3 className="text-sm font-bold text-slate-800 leading-tight mb-0.5 font-figtree">
												{item.nama_seminar}
											</h3>
											<p className="text-xs font-semibold text-slate-400">
												Sebagai: {item.peranan || "Peserta"}
											</p>
										</div>

										<div className="space-y-1.5 mt-2.5 p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-semibold">
											<div className="flex items-center gap-1.5">
												<Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
												<span className="line-clamp-1">
													{formatDateIndo(item.mulai)} s/d {formatDateIndo(item.selesai)}
												</span>
											</div>
											<div className="flex items-center gap-1.5">
												<CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
												<span className="line-clamp-1" title={item.penyelengara}>
													Penyelenggara: {item.penyelengara || "-"}
												</span>
											</div>
											<div className="flex items-center gap-1.5">
												<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
												<span className="line-clamp-1" title={item.tempat}>
													Lokasi: {item.tempat || "-"}
												</span>
											</div>
											{item.berkas && item.berkas !== "-" && (
												<div className="flex items-center gap-1.5">
													<FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													<span className="line-clamp-1">Berkas Tersedia</span>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					))
				) : (
					<div className="col-span-full py-8 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-lg">
						<div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-[#185FA5]">
							<Award className="h-5 w-5" />
						</div>
						<p className="text-slate-400 text-xs font-medium">Belum ada riwayat pelatihan.</p>
					</div>
				)}
			</div>

			{/* Modal Form */}
			<AnimatePresence>
				{isModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="bg-white rounded-xl shadow-xl w-full max-w-xl my-4 overflow-hidden flex flex-col"
						>
							<div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
								<div>
									<h3 className="text-sm font-bold text-slate-800 font-figtree">
										{selectedSeminar ? "Ubah" : "Tambah"} Riwayat Pelatihan
									</h3>
								</div>
								<button
									onClick={handleCloseModal}
									className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 border border-slate-100 rounded-lg p-1.5"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-4 max-h-[70vh]">
								<form id="seminarForm" onSubmit={handleSave} className="space-y-3.5">
									{error && (
										<div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100">
											{error}
										</div>
									)}

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="space-y-1">
											<label className="text-[10px] font-semibold text-slate-500">
												Tingkat Kegiatan *
											</label>
											<select
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.tingkat}
												onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
											>
												<option value="" disabled>Pilih Tingkat</option>
												{TINGKAT_ENUM.map((t) => (
													<option key={t} value={t}>{t}</option>
												))}
											</select>
										</div>

										<div className="space-y-1">
											<label className="text-[10px] font-semibold text-slate-500">
												Jenis Kegiatan *
											</label>
											<select
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.jenis}
												onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
											>
												<option value="" disabled>Pilih Jenis</option>
												{JENIS_ENUM.map((j) => (
													<option key={j} value={j}>{j}</option>
												))}
											</select>
										</div>

										<div className="space-y-1 md:col-span-2">
											<label className="text-[10px] font-semibold text-slate-500">
												Nama Kegiatan / Seminar *
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.nama_seminar}
												onChange={(e) => setFormData({ ...formData, nama_seminar: e.target.value })}
												placeholder="Contoh: Pelatihan Basic Trauma Cardiac Life Support"
												maxLength={50}
											/>
										</div>

										<div className="space-y-1 md:col-span-2">
											<label className="text-[10px] font-semibold text-slate-500">
												Peranan (Sebagai) *
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.peranan}
												onChange={(e) => setFormData({ ...formData, peranan: e.target.value })}
												placeholder="Contoh: Peserta, Panitia, Narasumber"
												maxLength={40}
											/>
										</div>

										<div className="space-y-1">
											<label className="text-[10px] font-semibold text-slate-500">
												Tanggal Mulai *
											</label>
											<input
												type="date"
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.mulai}
												onChange={(e) => setFormData({ ...formData, mulai: e.target.value })}
											/>
										</div>

										<div className="space-y-1">
											<label className="text-[10px] font-semibold text-slate-500">
												Tanggal Selesai *
											</label>
											<input
												type="date"
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.selesai}
												onChange={(e) => setFormData({ ...formData, selesai: e.target.value })}
											/>
										</div>

										<div className="space-y-1 md:col-span-2">
											<label className="text-[10px] font-semibold text-slate-500">
												Penyelenggara *
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.penyelengara}
												onChange={(e) => setFormData({ ...formData, penyelengara: e.target.value })}
												placeholder="Contoh: Kementerian Kesehatan, RS Bhayangkara"
												maxLength={50}
											/>
										</div>

										<div className="space-y-1 md:col-span-2">
											<label className="text-[10px] font-semibold text-slate-500">
												Tempat Pelaksanaan *
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all font-medium"
												value={formData.tempat}
												onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
												placeholder="Contoh: Jakarta, Hotel Dafam Nganjuk"
												maxLength={50}
											/>
										</div>
									</div>
								</form>
							</div>

							<div className="flex bg-slate-50 border-t border-slate-100 p-4 gap-2.5 justify-end">
								<button
									type="button"
									onClick={handleCloseModal}
									className="px-4 py-2 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
								>
									Batal
								</button>
								<button
									type="submit"
									form="seminarForm"
									disabled={loading}
									className="px-4.5 py-2 text-xs bg-[#185FA5] text-white font-semibold rounded-lg hover:bg-[#0c447c] transition-colors"
								>
									{loading ? "Menyimpan..." : "Simpan Data"}
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Modal Konfirmasi Hapus */}
			<AnimatePresence>
				{deleteModalOpen && itemToDelete && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-900/60 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-5 border border-slate-100"
						>
							<div className="text-center">
								<div className="w-12 h-12 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
									<Trash2 className="w-6 h-6" />
								</div>
								<h3 className="text-base font-bold text-slate-800 font-figtree mb-1.5">Hapus Data Pelatihan?</h3>
								<p className="text-xs text-slate-500 leading-relaxed mb-5">
									Apakah Anda yakin ingin menghapus <b>{itemToDelete.nama_seminar}</b>?
								</p>
							</div>

							<div className="flex w-full gap-2.5">
								<button
									type="button"
									onClick={handleCloseDeleteModal}
									className="flex-1 py-2 text-xs text-slate-600 font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
								>
									Batal
								</button>
								<button
									onClick={handleDelete}
									disabled={loading}
									className="flex-1 py-2 text-xs bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm"
								>
									{loading ? "Menghapus..." : "Ya, Hapus"}
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
