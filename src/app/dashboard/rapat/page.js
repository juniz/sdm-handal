"use client";

import { useState, useRef, useEffect } from "react";
import {
	Calendar,
	FileText,
	Plus,
	Download,
	Copy,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import "moment/locale/id";

// Subkomponen
import Toast from "./components/Toast";
import LoadingSkeleton from "./components/LoadingSkeleton";
import FilterBar from "./components/FilterBar";
import RapatTable from "./components/RapatTable";
import RapatModal from "./components/RapatModal";
import DuplicateRapatModal from "./components/DuplicateRapatModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { useRapat } from "./components/hooks/useRapat";
import { exportToPDF } from "./components/utils/pdfGenerator";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const RapatPage = () => {
	const {
		rapatList,
		existingMeetingTitles,
		loading,
		filterDate,
		setFilterDate,
		searchNamaRapat,
		setSearchNamaRapat,
		searchNamaPeserta,
		setSearchNamaPeserta,
		isToday,
		errors,
		validateForm,
		submitRapat,
		deleteRapat,
		resetSearch,
		updateUrutan,
		fetchRapat,
	} = useRapat();

	// State user data
	const [userData, setUserData] = useState(null);
	const [isITUser, setIsITUser] = useState(false);

	// State modal & form
	const [showModal, setShowModal] = useState(false);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
	const [modalMode, setModalMode] = useState("add");
	const [selectedRapat, setSelectedRapat] = useState(null);

	// Delete confirmation modal state
	const [deleteModal, setDeleteModal] = useState({
		isOpen: false,
		id: null,
		itemName: "",
		isDeleting: false,
	});

	const [formData, setFormData] = useState({
		tanggal: moment().format("YYYY-MM-DD"),
		rapat: "",
		nama: "",
		instansi: "",
	});
	const signPadRef = useRef(null);

	// Toast state
	const [toast, setToast] = useState({
		show: false,
		message: "",
		type: "success",
	});

	// Fetch user data
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					setUserData(data.user);
					const isIT = data.user.departemen?.toUpperCase() === "IT";
					setIsITUser(isIT);

					setFormData((prev) => ({
						...prev,
						nama: data.user.nama || "",
						instansi: data.user.jabatan || "",
					}));
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		fetchUserData();
	}, []);

	const showToast = (message, type = "success") => {
		setToast({ show: true, message, type });
		setTimeout(
			() => setToast({ show: false, message: "", type: "success" }),
			3000
		);
	};

	const resetForm = () => {
		setFormData({
			tanggal: filterDate || moment().format("YYYY-MM-DD"),
			rapat: "",
			nama: userData?.nama || "",
			instansi: userData?.jabatan || "",
		});
		if (signPadRef?.current) {
			signPadRef.current.clear();
		}
		setSelectedRapat(null);
		setModalMode("add");
	};

	// Tambah presensi baru
	const handleAddClick = (prefilledMeetingName = "") => {
		setFormData({
			tanggal: filterDate || moment().format("YYYY-MM-DD"),
			rapat: typeof prefilledMeetingName === "string" ? prefilledMeetingName : "",
			nama: userData?.nama || "",
			instansi: userData?.jabatan || "",
		});
		if (signPadRef?.current) {
			signPadRef.current.clear();
		}
		setSelectedRapat(null);
		setModalMode("add");
		setShowModal(true);
	};

	// Edit presensi
	const handleEdit = (rapat) => {
		setSelectedRapat(rapat);
		setFormData({
			tanggal: moment(rapat.tanggal, "DD MMMM YYYY").format("YYYY-MM-DD"),
			rapat: rapat.rapat,
			nama: rapat.nama,
			instansi: rapat.instansi,
		});
		setModalMode("edit");
		setShowModal(true);

		setTimeout(() => {
			if (signPadRef?.current) {
				signPadRef.current.clear();
			}
		}, 100);
	};

	// Delete confirmation handlers
	const promptDelete = (id, nama) => {
		setDeleteModal({
			isOpen: true,
			id,
			itemName: `Presensi: ${nama}`,
			isDeleting: false,
		});
	};

	const handleConfirmDelete = async () => {
		if (!deleteModal.id) return;
		setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

		try {
			const result = await deleteRapat(deleteModal.id);
			if (result.success) {
				showToast(result.message);
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat menghapus data", "error");
		} finally {
			setDeleteModal({
				isOpen: false,
				id: null,
				itemName: "",
				isDeleting: false,
			});
		}
	};

	// Export PDF handlers
	const handleExportAllPDF = async () => {
		if (rapatList.length === 0) {
			showToast("Tidak ada data rapat untuk diexport", "error");
			return;
		}
		try {
			showToast("Menyiapkan dokumen PDF...", "success");
			await exportToPDF(filterDate, rapatList);
		} catch (err) {
			console.error("PDF Export Error:", err);
			showToast("Gagal mengexport PDF", "error");
		}
	};

	// Reorder handlers
	const handleMoveUp = async (index) => {
		if (index === 0) return;
		const newList = [...rapatList];
		const temp = newList[index];
		newList[index] = newList[index - 1];
		newList[index - 1] = temp;

		const updates = newList.map((rapat, idx) => ({
			id: rapat.id,
			urutan: idx + 1,
		}));

		try {
			const result = await updateUrutan(updates);
			if (result.success) {
				showToast("Urutan presensi berhasil diperbarui");
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat memperbarui urutan", "error");
		}
	};

	const handleMoveDown = async (index) => {
		if (index === rapatList.length - 1) return;
		const newList = [...rapatList];
		const temp = newList[index];
		newList[index] = newList[index + 1];
		newList[index + 1] = temp;

		const updates = newList.map((rapat, idx) => ({
			id: rapat.id,
			urutan: idx + 1,
		}));

		try {
			const result = await updateUrutan(updates);
			if (result.success) {
				showToast("Urutan presensi berhasil diperbarui");
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat memperbarui urutan", "error");
		}
	};

	const handleUrutanChange = async (rapatId, newUrutan) => {
		if (!isITUser) return;
		const urutanNum = parseInt(newUrutan);
		if (isNaN(urutanNum) || urutanNum < 1 || urutanNum > rapatList.length) {
			showToast(`Urutan harus antara 1 dan ${rapatList.length}`, "error");
			return;
		}

		const newList = [...rapatList];
		const currentIndex = newList.findIndex((r) => r.id === rapatId);
		if (currentIndex === -1) return;

		const [movedItem] = newList.splice(currentIndex, 1);
		const newIndex = urutanNum - 1;
		newList.splice(newIndex, 0, movedItem);

		const updates = newList.map((rapat, idx) => ({
			id: rapat.id,
			urutan: idx + 1,
		}));

		try {
			const result = await updateUrutan(updates);
			if (result.success) {
				showToast("Urutan presensi berhasil diperbarui");
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat memperbarui urutan", "error");
		}
	};

	// Form submit
	const handleSubmit = async (tanda_tangan) => {
		try {
			if (!validateForm(formData, signPadRef)) {
				showToast("Mohon lengkapi semua data dan tanda tangan", "error");
				return;
			}

			const result = await submitRapat(
				formData,
				tanda_tangan,
				modalMode,
				selectedRapat
			);

			if (result.success) {
				setShowModal(false);
				resetForm();
				showToast(result.message);
			}
		} catch (error) {
			console.error("Error in handleSubmit:", error);
			showToast("Terjadi kesalahan saat menyimpan data", "error");
		}
	};

	// Initial skeleton loading
	if (loading && rapatList.length === 0) {
		return (
			<div className="p-4 md:p-6 space-y-4">
				<LoadingSkeleton />
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
				{/* Top Action Header */}
				<div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-sky-50 text-sky-800 border border-sky-200 rounded-md">
								RS Bhayangkara Nganjuk
							</span>
							<span className="text-xs text-slate-400">•</span>
							<span className="text-xs font-medium text-slate-500">
								SDM Handal
							</span>
						</div>
						<h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
							<Calendar className="w-6 h-6 text-sky-600" />
							<span>Daftar Presensi Rapat</span>
						</h1>
						<p className="text-xs sm:text-sm text-slate-500 mt-0.5">
							{rapatList.length} total kehadiran tercatat
						</p>
					</div>

					{/* Primary CTAs */}
					<div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
						{isITUser && (
							<button
								type="button"
								onClick={() => setShowDuplicateModal(true)}
								className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
								title="Duplikasi presensi rapat terdahulu (Khusus IT)"
							>
								<Copy className="w-4 h-4 text-slate-500" />
								<span>Duplikasi</span>
							</button>
						)}

						<button
							type="button"
							onClick={handleExportAllPDF}
							disabled={rapatList.length === 0}
							className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
							title="Export seluruh presensi hari ini ke PDF"
						>
							<Download className="w-4 h-4 text-slate-600" />
							<span>Export Semua PDF</span>
						</button>

						<button
							type="button"
							onClick={() => handleAddClick()}
							className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
							title="Catat kehadiran rapat baru"
						>
							<Plus className="w-4 h-4" />
							<span>Catat Presensi</span>
						</button>
					</div>
				</div>

				{/* Reactive Filter Toolbar */}
				<FilterBar
					filterDate={filterDate}
					setFilterDate={setFilterDate}
					searchNamaRapat={searchNamaRapat}
					setSearchNamaRapat={setSearchNamaRapat}
					searchNamaPeserta={searchNamaPeserta}
					setSearchNamaPeserta={setSearchNamaPeserta}
					onResetSearch={resetSearch}
					isToday={isToday}
					totalResults={rapatList.length}
				/>

				{/* Content: Unified Dense Attendance Table */}
				{loading ? (
					<LoadingSkeleton />
				) : rapatList.length === 0 ? (
					<div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
						<div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
							<FileText className="w-7 h-7" />
						</div>
						<h3 className="text-base font-bold text-slate-800">
							{searchNamaRapat || searchNamaPeserta
								? "Tidak ada presensi yang sesuai penyaringan"
								: "Belum ada presensi rapat pada tanggal ini"}
						</h3>
						<p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
							{searchNamaRapat || searchNamaPeserta
								? "Coba sesuaikan kata kunci pencarian rapat atau nama peserta."
								: "Pilih tanggal lain atau catat kehadiran peserta pertama untuk memulai agenda rapat."}
						</p>
						<div className="mt-5">
							<button
								type="button"
								onClick={() => handleAddClick()}
								className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
							>
								<Plus className="w-4 h-4" />
								<span>Catat Presensi Pertama</span>
							</button>
						</div>
					</div>
				) : (
					<RapatTable
						rapatList={rapatList}
						onEdit={handleEdit}
						onDelete={promptDelete}
						onMoveUp={isITUser ? handleMoveUp : null}
						onMoveDown={isITUser ? handleMoveDown : null}
						onUrutanChange={isITUser ? handleUrutanChange : null}
						searchNamaRapat={searchNamaRapat}
						searchNamaPeserta={searchNamaPeserta}
						isITUser={isITUser}
					/>
				)}
			</div>

			{/* Modal Catat/Edit Presensi */}
			<RapatModal
				showModal={showModal}
				setShowModal={setShowModal}
				modalMode={modalMode}
				formData={formData}
				setFormData={setFormData}
				existingMeetingTitles={existingMeetingTitles}
				errors={errors}
				onSubmit={handleSubmit}
				onReset={resetForm}
				signPadRef={signPadRef}
			/>

			{/* Modal Duplikasi Rapat (Khusus IT) */}
			{isITUser && (
				<DuplicateRapatModal
					showModal={showDuplicateModal}
					setShowModal={setShowDuplicateModal}
					onDuplicate={fetchRapat}
					onSuccess={(msg) => showToast(msg)}
					onError={(err) => showToast(err, "error")}
					loading={loading}
				/>
			)}

			{/* Accessible Confirm Delete Modal */}
			<ConfirmDeleteModal
				isOpen={deleteModal.isOpen}
				onClose={() =>
					setDeleteModal((prev) => ({ ...prev, isOpen: false }))
				}
				onConfirm={handleConfirmDelete}
				itemName={deleteModal.itemName}
				isDeleting={deleteModal.isDeleting}
			/>

			{/* Toast Notifications */}
			<AnimatePresence>
				{toast.show && (
					<Toast
						message={toast.message}
						type={toast.type}
						onClose={() =>
							setToast({ show: false, message: "", type: "success" })
						}
					/>
				)}
			</AnimatePresence>
		</>
	);
};

export default RapatPage;
