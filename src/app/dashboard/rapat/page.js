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
		filterNamaRapat,
		setFilterNamaRapat,
		isToday,
		errors,
		validateForm,
		submitRapat,
		deleteRapat,
	} = useRapat();

	// State untuk user data
	const [userData, setUserData] = useState(null);
	const [userNik, setUserNik] = useState(null);
	const [userLoading, setUserLoading] = useState(true);

	// State untuk modal dan form
	const [showModal, setShowModal] = useState(false);
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
					filterNamaRapat={filterNamaRapat}
					setFilterNamaRapat={setFilterNamaRapat}
					isOpen={isFilterOpen}
					setIsOpen={setIsFilterOpen}
					onAddClick={handleAddClick}
					loading={loading}
					isToday={isToday}
					rapatList={rapatList}
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
						{rapatList.map((rapat) => (
							<RapatCard
								key={rapat.id}
								rapat={rapat}
								onEdit={handleEdit}
								onDelete={handleDelete}
								searchTerm={filterNamaRapat}
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
