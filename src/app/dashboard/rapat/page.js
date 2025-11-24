"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, FileText } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import "moment/locale/id";

// Import komponen-komponen terpisah
import Toast from "./components/Toast";
import LoadingSkeleton from "./components/LoadingSkeleton";
import FilterAccordion from "./components/FilterAccordion";
import RapatCard from "./components/RapatCard";
import RapatModal from "./components/RapatModal";
import DuplicateRapatModal from "./components/DuplicateRapatModal";
import { useRapat } from "./components/hooks/useRapat";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const RapatPage = () => {
	// Custom hook untuk logika rapat
	const {
		rapatList,
		loading,
		filterDate,
		setFilterDate,
		searchDate,
		setSearchDate,
		filterNamaRapat,
		setFilterNamaRapat,
		searchNamaRapat,
		setSearchNamaRapat,
		filterNamaPeserta,
		setFilterNamaPeserta,
		searchNamaPeserta,
		setSearchNamaPeserta,
		isToday,
		errors,
		validateForm,
		submitRapat,
		deleteRapat,
		handleSearch,
		resetSearch,
		updateUrutan,
		fetchRapat,
	} = useRapat();

	// State untuk user data
	const [userData, setUserData] = useState(null);
	const [userNik, setUserNik] = useState(null);
	const [userLoading, setUserLoading] = useState(true);
	const [isITUser, setIsITUser] = useState(false);

	// State untuk modal dan form
	const [showModal, setShowModal] = useState(false);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
	const [modalMode, setModalMode] = useState("add");
	const [selectedRapat, setSelectedRapat] = useState(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [formData, setFormData] = useState({
		tanggal: moment().format("YYYY-MM-DD"),
		rapat: "",
		nama: "",
		instansi: "",
	});
	const signPadRef = useRef(null);

	// State untuk toast notification
	const [toast, setToast] = useState({
		show: false,
		message: "",
		type: "success",
	});

	// Fetch user data untuk default values
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					console.log("User data fetched:", data.user);
					setUserData(data.user);

					// Cek apakah user adalah IT
					const isIT =
						data.user.departemen === "IT" ||
						data.user.departemen?.toLowerCase().includes("it") ||
						data.user.jbtn?.toLowerCase().includes("it") ||
						data.user.jabatan?.toLowerCase().includes("it");
					setIsITUser(isIT);

					// Update formData dengan default values
					setFormData((prev) => ({
						...prev,
						nama: data.user.nama || "",
						instansi: data.user.jabatan,
					}));
					console.log("Default values set:", {
						nama: data.user.nama,
						instansi: data.user.jabatan,
					});
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			} finally {
				setUserLoading(false);
			}
		};

		fetchUserData();
	}, []);

	// Utility functions
	const showToast = (message, type = "success") => {
		setToast({ show: true, message, type });
		setTimeout(
			() => setToast({ show: false, message: "", type: "success" }),
			3000
		);
	};

	const resetForm = () => {
		setFormData({
			tanggal: moment().format("YYYY-MM-DD"),
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

	// Event handlers
	const handleAddClick = () => {
		console.log("handleAddClick called, userData:", userData);
		// Reset form dengan default values dari userData
		const defaultFormData = {
			tanggal: moment().format("YYYY-MM-DD"),
			rapat: "",
			nama: userData?.nama || "",
			instansi: userData?.jabatan || "",
		};
		console.log("Setting form data to:", defaultFormData);
		setFormData(defaultFormData);
		if (signPadRef?.current) {
			signPadRef.current.clear();
		}
		setSelectedRapat(null);
		setModalMode("add");
		setShowModal(true);
		setIsFilterOpen(false);
	};

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

		// Clear signature pad saat edit untuk mencegah konflik
		setTimeout(() => {
			if (signPadRef?.current) {
				signPadRef.current.clear();
			}
		}, 100);
	};

	const handleDelete = async (id) => {
		if (!confirm("Apakah Anda yakin ingin menghapus data rapat ini?")) return;

		try {
			const result = await deleteRapat(id);
			if (result.success) {
				showToast(result.message);
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat menghapus data", "error");
		}
	};

	const handleDuplicateClick = () => {
		setShowDuplicateModal(true);
		setIsFilterOpen(false);
	};

	const handleDuplicateSuccess = (message) => {
		showToast(message || "Data rapat berhasil diduplikasi");
		// Refresh data rapat
		fetchRapat();
	};

	const handleDuplicateError = (errorMessage) => {
		showToast(errorMessage || "Terjadi kesalahan saat menduplikasi data rapat", "error");
	};

	const handleDuplicateRefresh = () => {
		// Refresh data rapat setelah duplikasi berhasil
		fetchRapat();
	};

	const handleMoveUp = async (index) => {
		if (index === 0) return;

		const newList = [...rapatList];
		const temp = newList[index];
		newList[index] = newList[index - 1];
		newList[index - 1] = temp;

		// Update urutan
		const updates = newList.map((rapat, idx) => ({
			id: rapat.id,
			urutan: idx + 1,
		}));

		try {
			const result = await updateUrutan(updates);
			if (result.success) {
				showToast("Urutan rapat berhasil diperbarui");
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

		// Update urutan
		const updates = newList.map((rapat, idx) => ({
			id: rapat.id,
			urutan: idx + 1,
		}));

		try {
			const result = await updateUrutan(updates);
			if (result.success) {
				showToast("Urutan rapat berhasil diperbarui");
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat memperbarui urutan", "error");
		}
	};

	// Handler untuk update urutan langsung dengan input angka
	const handleUrutanChange = async (rapatId, newUrutan) => {
		if (!isITUser) return;

		// Validasi urutan
		const urutanNum = parseInt(newUrutan);
		if (isNaN(urutanNum) || urutanNum < 1 || urutanNum > rapatList.length) {
			showToast(
				`Urutan harus antara 1 dan ${rapatList.length}`,
				"error"
			);
			return;
		}

		// Buat array baru dengan urutan yang diupdate
		const newList = [...rapatList];
		const currentIndex = newList.findIndex((r) => r.id === rapatId);
		
		if (currentIndex === -1) return;

		// Hapus item dari posisi lama
		const [movedItem] = newList.splice(currentIndex, 1);
		
		// Insert item ke posisi baru
		const newIndex = urutanNum - 1;
		newList.splice(newIndex, 0, movedItem);

		// Update urutan semua item
		const updates = newList.map((rapat, idx) => ({
			id: rapat.id,
			urutan: idx + 1,
		}));

		try {
			const result = await updateUrutan(updates);
			if (result.success) {
				showToast("Urutan rapat berhasil diperbarui");
			}
		} catch (error) {
			showToast("Terjadi kesalahan saat memperbarui urutan", "error");
		}
	};

	const handleSubmit = async (tanda_tangan) => {
		try {
			if (!validateForm(formData, signPadRef)) {
				showToast("Mohon lengkapi semua field dengan benar", "error");
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

	// Loading state untuk initial load
	if (loading && rapatList.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-6 space-y-4">
				{/* Header */}
				<div className="flex items-center gap-2">
					<Calendar className="w-5 h-5 text-blue-500" />
					<h2 className="text-lg md:text-xl font-semibold">Daftar Rapat</h2>
				</div>

				{/* Filter Accordion */}
				<FilterAccordion
					filterDate={filterDate}
					setFilterDate={setFilterDate}
					searchDate={searchDate}
					setSearchDate={setSearchDate}
					filterNamaRapat={filterNamaRapat}
					setFilterNamaRapat={setFilterNamaRapat}
					searchNamaRapat={searchNamaRapat}
					setSearchNamaRapat={setSearchNamaRapat}
					filterNamaPeserta={filterNamaPeserta}
					setFilterNamaPeserta={setFilterNamaPeserta}
					searchNamaPeserta={searchNamaPeserta}
					setSearchNamaPeserta={setSearchNamaPeserta}
					onSearch={handleSearch}
					onResetSearch={resetSearch}
					isOpen={isFilterOpen}
					setIsOpen={setIsFilterOpen}
					onAddClick={handleAddClick}
					onDuplicateClick={isITUser ? handleDuplicateClick : null}
					loading={loading}
					isToday={isToday}
					rapatList={rapatList}
					isITUser={isITUser}
				/>

				{/* Content */}
				{loading ? (
					<LoadingSkeleton />
				) : rapatList.length === 0 ? (
					<div className="text-center py-12">
						<FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-xl font-medium text-gray-600">
							{filterNamaRapat
								? `Tidak ada rapat dengan nama "${filterNamaRapat}" pada tanggal ini`
								: "Tidak ada rapat pada tanggal ini"}
						</h3>
						<p className="text-gray-500 mt-2">
							{filterNamaRapat
								? "Coba ubah filter pencarian atau tambah rapat baru"
								: "Pilih tanggal lain atau tambah rapat baru"}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
						{rapatList.map((rapat, index) => (
							<RapatCard
								key={rapat.id}
								rapat={rapat}
								index={index}
								totalItems={rapatList.length}
								onEdit={handleEdit}
								onDelete={handleDelete}
								onMoveUp={isITUser ? handleMoveUp : null}
								onMoveDown={isITUser ? handleMoveDown : null}
								onUrutanChange={isITUser ? handleUrutanChange : null}
								searchTerm={filterNamaRapat}
								isITUser={isITUser}
							/>
						))}
					</div>
				)}
			</div>

			{/* Modal */}
			<RapatModal
				showModal={showModal}
				setShowModal={setShowModal}
				modalMode={modalMode}
				formData={formData}
				setFormData={setFormData}
				errors={errors}
				onSubmit={handleSubmit}
				onReset={resetForm}
				signPadRef={signPadRef}
			/>

			{/* Duplicate Modal */}
			{isITUser && (
				<DuplicateRapatModal
					showModal={showDuplicateModal}
					setShowModal={setShowDuplicateModal}
					onDuplicate={handleDuplicateRefresh}
					onSuccess={handleDuplicateSuccess}
					onError={handleDuplicateError}
					loading={loading}
				/>
			)}

			{/* Toast Notification */}
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
