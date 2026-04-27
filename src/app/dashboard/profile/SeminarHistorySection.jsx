"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, Plus, X, Calendar, MapPin, CheckCircle2, Bookmark, FolderOpen, Award } from "lucide-react";

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
			// Format date if needed (YYYY-MM-DD for input type="date")
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
			const method = isEdit ? "PUT" : "POST";
			
			const payload = { ...formData };
			
			// If editing, include old keys for composite primary key tracking
			if (isEdit) {
				payload.old_nama_seminar = selectedSeminar.nama_seminar;
				payload.old_mulai = selectedSeminar.mulai;
			}

			const res = await fetch("/api/profile/seminar", {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Gagal menyimpan data");
			}

			if (isEdit) {
				setSeminarHistory((prev) =>
					prev.map((item) =>
						(item.nama_seminar === selectedSeminar.nama_seminar && item.mulai === selectedSeminar.mulai)
							? data.data
							: item
					)
				);
			} else {
				setSeminarHistory((prev) => [data.data, ...prev]);
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
			const res = await fetch("/api/profile/seminar", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					nama_seminar: itemToDelete.nama_seminar,
					mulai: itemToDelete.mulai,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Gagal menghapus data");
			}

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
		<div className="space-y-6">
			<div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
				<div className="flex items-center gap-3">
					<div className="bg-orange-50 p-2.5 rounded-lg">
						<Award className="w-5 h-5 text-orange-600" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-900">
							Riwayat Pelatihan & Seminar
						</h2>
						<p className="text-sm text-gray-500">
							{seminarHistory.length} Sertifikat/Pelatihan tercatat
						</p>
					</div>
				</div>
				<button
					onClick={() => handleOpenModal()}
					className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
				>
					<Plus className="w-4 h-4" />
					<span className="hidden sm:inline">Tambah Data</span>
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
							className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-orange-300 transition-colors group relative"
						>
							<div className="absolute top-4 right-4 flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-2">
								<button
									onClick={() => handleOpenModal(item)}
									className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
									title="Ubah Data"
								>
									<Edit className="w-4 h-4" />
								</button>
								<button
									onClick={() => confirmDelete(item)}
									className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
									title="Hapus Data"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>

							<div className="p-5">
								<div className="flex items-start gap-4">
									<div className="hidden sm:flex h-12 w-12 rounded-full bg-orange-50 items-center justify-center flex-shrink-0">
										<Bookmark className="w-6 h-6 text-orange-500" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="pr-16">
											<span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 mb-2">
												{item.jenis} - {item.tingkat}
											</span>
											<h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
												{item.nama_seminar}
											</h3>
											<p className="text-sm font-medium text-gray-700 mb-3">
												Sebagai: {item.peranan || "Peserta"}
											</p>
										</div>

										<div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
											<div className="flex items-center gap-2">
												<Calendar className="w-4 h-4 text-gray-400 shrink-0" />
												<span className="line-clamp-1">
													{formatDateIndo(item.mulai)} s/d {formatDateIndo(item.selesai)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
												<span className="line-clamp-1" title={item.penyelengara}>
													Penyelenggara: {item.penyelengara || "-"}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<MapPin className="w-4 h-4 text-gray-400 shrink-0" />
												<span className="line-clamp-1" title={item.tempat}>
													Lokasi: {item.tempat || "-"}
												</span>
											</div>
											{item.berkas && item.berkas !== "-" && (
												<div className="flex items-center gap-2">
													<FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
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
					<div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
						<div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<Award className="h-8 w-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-1">
							Belum Ada Data Pelatihan
						</h3>
						<p className="text-gray-500 text-sm mb-4">
							Tambahkan riwayat pelatihan, seminar atau workshop.
						</p>
						<button
							onClick={() => handleOpenModal()}
							className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
						>
							<Plus className="w-4 h-4" />
							<span>Tambah Data Pertama</span>
						</button>
					</div>
				)}
			</div>

			{/* Modal Form */}
			<AnimatePresence>
				{isModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col"
						>
							<div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
								<h3 className="text-xl font-bold text-gray-900">
									{selectedSeminar ? "Ubah" : "Tambah"} Riwayat Pelatihan
								</h3>
								<button
									onClick={handleCloseModal}
									className="text-gray-400 hover:text-gray-500 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
								<form id="seminarForm" onSubmit={handleSave} className="space-y-5">
									{error && (
										<div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100 flex items-start gap-2">
											<div className="shrink-0 mt-0.5">•</div>
											<div className="font-medium">{error}</div>
										</div>
									)}

									<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
										<div className="space-y-2 relative">
											<label className="text-sm font-medium text-gray-700">
												Tingkat <span className="text-red-500">*</span>
											</label>
											<select
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
												value={formData.tingkat}
												onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
											>
												<option value="" disabled>Pilih Tingkat</option>
												{TINGKAT_ENUM.map((t) => (
													<option key={t} value={t}>{t}</option>
												))}
											</select>
										</div>

										<div className="space-y-2 relative">
											<label className="text-sm font-medium text-gray-700">
												Jenis Kegiatan <span className="text-red-500">*</span>
											</label>
											<select
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
												value={formData.jenis}
												onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
											>
												<option value="" disabled>Pilih Jenis</option>
												{JENIS_ENUM.map((j) => (
													<option key={j} value={j}>{j}</option>
												))}
											</select>
										</div>

										<div className="space-y-2 md:col-span-2">
											<label className="text-sm font-medium text-gray-700">
												Nama Kegiatan / Seminar <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
												value={formData.nama_seminar}
												onChange={(e) => setFormData({ ...formData, nama_seminar: e.target.value })}
												placeholder="Contoh: Pelatihan Basic Trauma Cardiac Life Support"
												maxLength={50}
											/>
										</div>

										<div className="space-y-2 md:col-span-2">
											<label className="text-sm font-medium text-gray-700">
												Peranan (Sebagai) <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
												value={formData.peranan}
												onChange={(e) => setFormData({ ...formData, peranan: e.target.value })}
												placeholder="Contoh: Peserta, Panitia, Narasumber"
												maxLength={40}
											/>
										</div>

										<div className="space-y-2">
											<label className="text-sm font-medium text-gray-700">
												Tanggal Mulai <span className="text-red-500">*</span>
											</label>
											<input
												type="date"
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
												value={formData.mulai}
												onChange={(e) => setFormData({ ...formData, mulai: e.target.value })}
											/>
										</div>

										<div className="space-y-2">
											<label className="text-sm font-medium text-gray-700">
												Tanggal Selesai <span className="text-red-500">*</span>
											</label>
											<input
												type="date"
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
												value={formData.selesai}
												onChange={(e) => setFormData({ ...formData, selesai: e.target.value })}
											/>
										</div>

										<div className="space-y-2 md:col-span-2">
											<label className="text-sm font-medium text-gray-700">
												Penyelenggara <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
												value={formData.penyelengara}
												onChange={(e) => setFormData({ ...formData, penyelengara: e.target.value })}
												placeholder="Contoh: Kementerian Kesehatan, RS Bhayangkara"
												maxLength={50}
											/>
										</div>

										<div className="space-y-2 md:col-span-2">
											<label className="text-sm font-medium text-gray-700">
												Tempat Pelaksanaan <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												required
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
												value={formData.tempat}
												onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
												placeholder="Contoh: Jakarta, Hotel Dafam Nganjuk"
												maxLength={50}
											/>
										</div>
									</div>
								</form>
							</div>

							<div className="flex bg-gray-50 border-t border-gray-200 p-4 gap-3 justify-end sticky bottom-0">
								<button
									type="button"
									onClick={handleCloseModal}
									className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
								>
									Batal
								</button>
								<button
									type="submit"
									form="seminarForm"
									disabled={loading}
									className={`px-5 py-2.5 bg-orange-600 font-medium text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm ${
										loading ? "opacity-70 cursor-not-allowed" : ""
									}`}
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
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
						>
							<div className="p-6 text-center">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Trash2 className="w-8 h-8 text-red-500" />
								</div>
								<h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Data</h3>
								<p className="text-gray-500 text-sm">
									Apakah Anda yakin ingin menghapus <b>{itemToDelete.nama_seminar}</b>? 
									Tindakan ini tidak dapat dibatalkan.
								</p>
							</div>

							{error && (
								<div className="px-6 pb-2 text-center text-sm text-red-500 font-medium">
									{error}
								</div>
							)}

							<div className="flex bg-gray-50 p-4 gap-3 justify-end border-t border-gray-200 mt-2">
								<button
									type="button"
									onClick={handleCloseDeleteModal}
									className="px-4 py-2 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors w-full sm:w-auto"
								>
									Batal
								</button>
								<button
									onClick={handleDelete}
									disabled={loading}
									className={`px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm transition-colors w-full sm:w-auto flex justify-center items-center ${
										loading ? "opacity-70 cursor-not-allowed" : ""
									}`}
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
