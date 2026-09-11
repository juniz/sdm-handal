"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, X, Copy, Loader2 } from "lucide-react";
import moment from "moment-timezone";
import SignatureImage from "./SignatureImage";

const DuplicateRapatModal = ({
	showModal,
	setShowModal,
	onDuplicate,
	onSuccess,
	onError,
	loading = false,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedRapat, setSelectedRapat] = useState(null);
	const [targetDate, setTargetDate] = useState(moment().format("YYYY-MM-DD"));
	const [targetNamaRapat, setTargetNamaRapat] = useState("");
	const [isDuplicating, setIsDuplicating] = useState(false);

	// Fetch semua rapat untuk pencarian berdasarkan nama peserta (tanpa filter tanggal)
	const fetchAllRapat = async (namaPeserta = "") => {
		setIsSearching(true);
		try {
			const params = new URLSearchParams();
			// Parameter khusus untuk pencarian duplikasi: hanya berdasarkan nama peserta, tanpa tanggal
			params.append("search_by_nama", "true");
			if (namaPeserta.trim()) {
				params.append("nama_peserta", namaPeserta.trim());
			}

			const response = await fetch(`/api/rapat?${params.toString()}`);
			const data = await response.json();

			if (data.status === "success") {
				setSearchResults(data.data);
			} else {
				setSearchResults([]);
			}
		} catch (error) {
			console.error("Error fetching rapat:", error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// Handle search - hanya berdasarkan nama peserta, tanpa tanggal
	const handleSearch = () => {
		if (!searchTerm.trim()) {
			// Jika tidak ada nama yang diinput, reset hasil
			setSearchResults([]);
			setSelectedRapat(null);
			return;
		}
		fetchAllRapat(searchTerm);
	};

	// Reset search
	const handleResetSearch = () => {
		setSearchTerm("");
		setSearchResults([]);
		setSelectedRapat(null);
		setTargetNamaRapat("");
	};

	// Handle duplicate - langsung simpan ke database
	const handleDuplicate = async () => {
		if (!selectedRapat) return;

		setIsDuplicating(true);
		try {
			// Ambil data rapat pada tanggal target untuk menghitung urutan
			const params = new URLSearchParams({
				tanggal: targetDate,
			});
			const existingResponse = await fetch(`/api/rapat?${params.toString()}`);
			const existingData = await existingResponse.json();

			// Hitung urutan untuk rapat baru
			let urutan = 1;
			if (existingData.status === "success" && existingData.data.length > 0) {
				const maxUrutan = Math.max(...existingData.data.map(r => r.urutan || 0));
				urutan = maxUrutan + 1;
			}

			// Prepare data untuk duplikasi
			const duplicateData = {
				tanggal: targetDate,
				rapat: targetNamaRapat.trim() || selectedRapat.rapat,
				nama: selectedRapat.nama,
				instansi: selectedRapat.instansi,
				tanda_tangan: selectedRapat.tanda_tangan, // Copy tanda tangan dari rapat yang dipilih
				urutan: urutan,
			};

			// Simpan langsung ke database
			const response = await fetch("/api/rapat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(duplicateData),
			});

			const data = await response.json();

			if (data.status === "success") {
				// Panggil callback success jika ada
				if (onSuccess) {
					onSuccess(data.message || "Data rapat berhasil diduplikasi");
				}
				// Panggil callback onDuplicate untuk refresh data jika ada
				if (onDuplicate) {
					onDuplicate();
				}
				handleClose();
			} else {
				throw new Error(data.error || "Gagal menduplikasi data rapat");
			}
		} catch (error) {
			console.error("Error duplicating rapat:", error);
			if (onError) {
				onError(error.message || "Terjadi kesalahan saat menduplikasi data rapat");
			}
		} finally {
			setIsDuplicating(false);
		}
	};

	const handleClose = () => {
		handleResetSearch();
		setTargetDate(moment().format("YYYY-MM-DD"));
		setTargetNamaRapat("");
		setShowModal(false);
	};

	// Reset saat modal dibuka
	useEffect(() => {
		if (showModal) {
			handleResetSearch();
		}
	}, [showModal]);

	// Set default nama rapat saat rapat dipilih
	useEffect(() => {
		if (selectedRapat) {
			setTargetNamaRapat(selectedRapat.rapat);
		}
	}, [selectedRapat]);

	// Keyboard accessibility: escape to close
	useEffect(() => {
		if (showModal) {
			const handleKeyDown = (e) => {
				if (e.key === "Escape" && !loading && !isDuplicating) {
					handleClose();
				}
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [showModal, loading, isDuplicating]);

	if (!showModal) return null;

	return (
		<div
			className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="duplicate-modal-title"
			onClick={(e) => {
				if (e.target === e.currentTarget && !loading && !isDuplicating) {
					handleClose();
				}
			}}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0, y: 10 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.95, opacity: 0, y: 10 }}
				transition={{ duration: 0.15 }}
				className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-2xl max-h-[90vh] flex flex-col"
			>
				<div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
					<h3
						id="duplicate-modal-title"
						className="text-base font-bold text-slate-900 flex items-center gap-2"
					>
						<Copy className="w-5 h-5 text-sky-600" />
						Duplikasi Presensi Rapat (IT)
					</h3>
					<button
						type="button"
						onClick={handleClose}
						disabled={loading || isDuplicating}
						className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
						aria-label="Tutup dialog"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto space-y-4">
					{/* Search Section */}
					<div className="space-y-3">
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-1">
								Cari Nama Peserta
							</label>
							<p className="text-xs text-slate-500 mb-2">
								Pencarian berdasarkan nama peserta (maksimal 5 hasil terbaru)
							</p>
							<div className="relative">
								<input
									type="text"
									placeholder="Masukkan nama peserta..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											handleSearch();
										}
									}}
									className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
								/>
								{searchTerm && (
									<button
										type="button"
										onClick={() => setSearchTerm("")}
										className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
									>
										<X className="w-4 h-4" />
									</button>
								)}
								{!searchTerm && (
									<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
								)}
							</div>
						</div>

						<div className="flex gap-2">
							<button
								type="button"
								onClick={handleSearch}
								disabled={isSearching || !searchTerm.trim()}
								className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-semibold shadow-xs"
							>
								{isSearching ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Search className="w-4 h-4" />
								)}
								<span>Cari</span>
							</button>
							{searchTerm && (
								<button
									type="button"
									onClick={handleResetSearch}
									className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold"
								>
									<X className="w-4 h-4" />
									<span>Reset</span>
								</button>
							)}
						</div>
					</div>

					{/* Search Results */}
					<div>
						<h4 className="text-sm font-semibold text-slate-700 mb-2">
							Hasil Pencarian ({searchResults.length}
							{searchResults.length >= 5 && " (maksimal 5 hasil terbaru)"})
						</h4>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{isSearching ? (
								<div className="flex justify-center items-center py-8">
									<Loader2 className="w-6 h-6 animate-spin text-sky-600" />
								</div>
							) : searchResults.length === 0 ? (
								<div className="text-center py-8 text-slate-500 text-sm">
									{searchTerm
										? "Tidak ada rapat yang ditemukan"
										: "Masukkan nama peserta untuk mencari"}
								</div>
							) : (
								searchResults.map((rapat) => (
									<div
										key={rapat.id}
										onClick={() => setSelectedRapat(rapat)}
										className={`p-3 border rounded-lg cursor-pointer transition-all ${
											selectedRapat?.id === rapat.id
												? "border-sky-500 bg-sky-50/70"
												: "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
										}`}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1 min-w-0">
												<h5 className="font-semibold text-slate-900">
													{rapat.rapat}
												</h5>
												<div className="mt-1 space-y-1 text-sm text-slate-600">
													<p>
														<span className="font-medium">Peserta:</span>{" "}
														{rapat.nama}
													</p>
													<p>
														<span className="font-medium">Instansi:</span>{" "}
														{rapat.instansi}
													</p>
													<p className="flex items-center gap-1 text-xs text-slate-500">
														<Calendar className="w-3.5 h-3.5" />
														{rapat.tanggal}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2 flex-shrink-0">
												{/* Preview Tanda Tangan */}
												{rapat.tanda_tangan ? (
													<div className="hidden sm:block">
														<SignatureImage base64Data={rapat.tanda_tangan} />
													</div>
												) : (
													<div className="hidden sm:flex items-center justify-center w-16 h-16 border border-slate-200 rounded-lg bg-slate-50">
														<span className="text-xs text-slate-400 text-center px-1">
															Tidak ada tanda tangan
														</span>
													</div>
												)}
												{/* Checkmark untuk selected */}
												{selectedRapat?.id === rapat.id && (
													<div className="ml-1">
														<div className="w-5 h-5 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
															<svg
																className="w-3 h-3 text-white"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M5 13l4 4L19 7"
																/>
															</svg>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Target Date and Nama Rapat Section */}
					{selectedRapat && (
						<div className="border-t border-slate-200 pt-4 space-y-4">
							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-1">
									Tanggal untuk Rapat Baru
								</label>
								<input
									type="date"
									value={targetDate}
									onChange={(e) => setTargetDate(e.target.value)}
									className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
								/>
								<p className="text-xs text-slate-500 mt-1">
									Rapat akan diduplikasi ke tanggal:{" "}
									<span className="font-semibold text-slate-700">
										{moment(targetDate).format("DD MMMM YYYY")}
									</span>
								</p>
							</div>

							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-1">
									Nama Rapat Baru <span className="text-slate-400 font-normal">(Opsional)</span>
								</label>
								<input
									type="text"
									placeholder={`Kosongkan untuk menggunakan: "${selectedRapat.rapat}"`}
									value={targetNamaRapat}
									onChange={(e) => setTargetNamaRapat(e.target.value)}
									className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
								/>
								<p className="text-xs text-slate-500 mt-1">
									{targetNamaRapat.trim()
										? `Nama rapat baru: "${targetNamaRapat}"`
										: `Menggunakan nama rapat: "${selectedRapat.rapat}"`}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-slate-100">
					<button
						type="button"
						onClick={handleClose}
						className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
						disabled={loading}
					>
						Batal
					</button>
					<button
						type="button"
						onClick={handleDuplicate}
						disabled={!selectedRapat || loading || isDuplicating}
						className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
							!selectedRapat || loading || isDuplicating
								? "bg-slate-200 cursor-not-allowed text-slate-400"
								: "bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
						}`}
						title={
							selectedRapat
								? `Duplikasi ke tanggal ${moment(targetDate).format("DD MMMM YYYY")}${
										targetNamaRapat.trim()
											? ` dengan nama "${targetNamaRapat}"`
											: ""
									}`
								: ""
						}
					>
						{loading || isDuplicating ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Menduplikasi...</span>
							</>
						) : (
							<>
								<Copy className="w-4 h-4" />
								<span>Duplikasi Presensi</span>
							</>
						)}
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default DuplicateRapatModal;

