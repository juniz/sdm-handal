"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import moment from "moment-timezone";

const usePengajuanTukarDinas = () => {
	// Data states
	const [pengajuanData, setPengajuanData] = useState([]);
	const [pegawaiData, setPegawaiData] = useState([]);
	const [shiftData, setShiftData] = useState([]);

	// Loading states
	const [loading, setLoading] = useState(true);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [pegawaiLoading, setPegawaiLoading] = useState(true);
	const [userLoading, setUserLoading] = useState(true);

	// User states
	const [userDepartment, setUserDepartment] = useState(null);
	const [userDepartmentId, setUserDepartmentId] = useState(null);
	const [currentUserNik, setCurrentUserNik] = useState(null);

	// Dialog states
	const [selectedPengajuan, setSelectedPengajuan] = useState(null);
	const [showFormDialog, setShowFormDialog] = useState(false);
	const [showUpdateDialog, setShowUpdateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [pengajuanToDelete, setPengajuanToDelete] = useState(null);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	// Update status state
	const [updateData, setUpdateData] = useState({
		status: "",
		alasan_ditolak: "",
	});

	// Filter states
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

	// Initialize data on mount
	useEffect(() => {
		fetchData();
		fetchPegawaiData();
		checkUserDepartment();
	}, []);

	// Fetch shift data when userDepartmentId changes
	useEffect(() => {
		if (userDepartmentId) {
			fetchShiftData();
		}
	}, [userDepartmentId]);

	// Check user department and permissions
	const checkUserDepartment = async () => {
		try {
			setUserLoading(true);
			const response = await fetch("/api/auth/profile");
			if (response.ok) {
				const data = await response.json();
				const dept = data.data.departemen_name || data.data.departemen;
				const deptId = data.data.departemen;
				const userNik = data.data.username;
				setCurrentUserNik(userNik);
				setUserDepartmentId(deptId);

				// Check if user is from IT or HRD
				const isITorHRD =
					deptId === "IT" ||
					deptId === "HRD" ||
					dept?.toLowerCase().includes("it") ||
					dept?.toLowerCase().includes("teknologi") ||
					dept?.toLowerCase().includes("hrd") ||
					dept?.toLowerCase().includes("human resource");

				setUserDepartment(isITorHRD ? "IT_HRD" : "USER");
			}
		} catch (error) {
			console.error("Error checking user department:", error);
		} finally {
			setUserLoading(false);
		}
	};

	// Fetch shift data based on user department
	const fetchShiftData = async () => {
		try {
			const response = await fetch(
				`/api/jam-jaga?departemen=${userDepartmentId}`
			);
			if (response.ok) {
				const result = await response.json();
				setShiftData(result.data || []);
			} else {
				console.error("Error fetching shift data:", response.statusText);
			}
		} catch (error) {
			console.error("Error fetching shift data:", error);
		}
	};

	// Fetch pengajuan data
	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/pengajuan-tukar-dinas");

			if (response.ok) {
				const result = await response.json();
				setPengajuanData(result.data || []);
				// Reset pagination to first page when data changes
				setCurrentPage(1);
			} else {
				const errorData = await response.json();
				toast.error(
					errorData.message || "Gagal mengambil data pengajuan tukar dinas"
				);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Terjadi kesalahan saat mengambil data");
		} finally {
			setLoading(false);
		}
	};

	// Fetch pegawai data
	const fetchPegawaiData = async () => {
		try {
			setPegawaiLoading(true);
			const response = await fetch("/api/pegawai");
			if (response.ok) {
				const result = await response.json();
				setPegawaiData(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching pegawai data:", error);
		} finally {
			setPegawaiLoading(false);
		}
	};

	// Submit new pengajuan
	const handleSubmit = async (formData) => {
		// Retry mechanism for data loading
		// let retryCount = 0;
		// const maxRetries = 5;

		// while (retryCount < maxRetries) {
		// 	// Check if data is ready
		// 	if (
		// 		currentUserNik &&
		// 		pegawaiData &&
		// 		pegawaiData.length > 0 &&
		// 		!userLoading &&
		// 		!pegawaiLoading
		// 	) {
		// 		break;
		// 	}

		// 	// Show loading message
		// 	if (retryCount === 0) {
		// 		toast.info("Memuat data, silakan tunggu...");
		// 	}

		// 	// Wait 1 second before retry
		// 	await new Promise((resolve) => setTimeout(resolve, 1000));
		// 	retryCount++;
		// }

		// alert(currentUserNik);
		// // Final validation after retries
		// if (!currentUserNik) {
		// 	toast.error(
		// 		"Data pengguna tidak ditemukan setelah beberapa kali percobaan. Silakan refresh halaman."
		// 	);
		// 	return false;
		// }

		// if (!pegawaiData || pegawaiData.length === 0) {
		// 	toast.error(
		// 		"Data pegawai tidak ditemukan setelah beberapa kali percobaan. Silakan refresh halaman."
		// 	);
		// 	return false;
		// }

		// // Validate NIK tidak boleh sama
		// if (currentUserNik === formData.nik_ganti) {
		// 	toast.error("NIK pemohon dan NIK pengganti tidak boleh sama");
		// 	return false;
		// }

		// // Validate NIK exists in database
		// const nikValid = pegawaiData.find((p) => p.nik === currentUserNik);
		// const nikGantiValid = pegawaiData.find((p) => p.nik === formData.nik_ganti);

		// if (!nikValid) {
		// 	toast.error("NIK pemohon tidak valid dalam database");
		// 	return false;
		// }

		// if (!nikGantiValid) {
		// 	toast.error("NIK pengganti tidak valid dalam database");
		// 	return false;
		// }

		// if (
		// 	formData.nik_pj &&
		// 	!pegawaiData.find((p) => p.nik === formData.nik_pj)
		// ) {
		// 	toast.error("NIK penanggung jawab tidak valid dalam database");
		// 	return false;
		// }

		try {
			setSubmitLoading(true);

			const response = await fetch("/api/pengajuan-tukar-dinas", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Pengajuan tukar dinas berhasil disubmit");
				setShowFormDialog(false);
				fetchData();
				return true;
			} else {
				toast.error(result.message || "Gagal submit pengajuan tukar dinas");
				return false;
			}
		} catch (error) {
			console.error("Error submitting:", error);
			toast.error("Terjadi kesalahan saat submit pengajuan");
			return false;
		} finally {
			setSubmitLoading(false);
		}
	};

	// Update status pengajuan
	const handleUpdateStatus = async () => {
		if (!updateData.status) {
			toast.error("Status harus dipilih");
			return;
		}

		if (updateData.status === "Ditolak" && !updateData.alasan_ditolak) {
			toast.error("Alasan penolakan harus diisi");
			return;
		}

		try {
			const response = await fetch("/api/pengajuan-tukar-dinas", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: selectedPengajuan.id,
					status: updateData.status,
					alasan_ditolak: updateData.alasan_ditolak,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Status pengajuan berhasil diupdate");
				setShowUpdateDialog(false);
				setSelectedPengajuan(null);
				setUpdateData({ status: "", alasan_ditolak: "" });
				fetchData();
			} else {
				toast.error(result.message || "Gagal update status");
			}
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error("Terjadi kesalahan saat update status");
		}
	};

	// Delete pengajuan
	const handleDeleteConfirm = async () => {
		if (!pengajuanToDelete) return;

		try {
			const response = await fetch("/api/pengajuan-tukar-dinas", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ no_pengajuan: pengajuanToDelete.no_pengajuan }),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Pengajuan berhasil dihapus");
				setShowDeleteDialog(false);
				setPengajuanToDelete(null);
				fetchData();
			} else {
				toast.error(result.message || "Gagal menghapus pengajuan");
			}
		} catch (error) {
			console.error("Error deleting pengajuan:", error);
			toast.error("Terjadi kesalahan saat menghapus pengajuan");
		}
	};

	// Handle view pengajuan
	const handleView = (pengajuan) => {
		setSelectedPengajuan(pengajuan);
		setShowDetailDialog(true);
	};

	// Handle edit pengajuan
	const handleEdit = (pengajuan) => {
		setSelectedPengajuan(pengajuan);
		setUpdateData({
			status: pengajuan.status,
			alasan_ditolak: pengajuan.alasan_ditolak || "",
		});
		setShowUpdateDialog(true);
	};

	// Handle delete pengajuan
	const handleDelete = (pengajuan) => {
		setPengajuanToDelete(pengajuan);
		setShowDeleteDialog(true);
	};

	// Filter data based on search term and status
	const filteredData = pengajuanData.filter((item) => {
		const matchesSearch =
			debouncedSearchTerm === "" ||
			(item.nama_pemohon &&
				item.nama_pemohon
					.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase())) ||
			(item.nik &&
				item.nik.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

		const matchesStatus =
			statusFilter === "all" || item.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Pagination logic with filtered data
	const totalPages = Math.ceil(filteredData.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentData = filteredData.slice(startIndex, endIndex);

	const handlePageChange = (page) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Reset pagination when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm, statusFilter]);

	// Get pegawai name by NIK
	const getPegawaiName = (nik) => {
		const pegawai = pegawaiData.find((p) => p.nik === nik);
		return pegawai ? pegawai.nama : nik;
	};

	return {
		// Data
		pengajuanData,
		pegawaiData,
		shiftData,
		currentData,

		// Loading states
		loading,
		submitLoading,
		pegawaiLoading,
		userLoading,

		// User states
		userDepartment,
		userDepartmentId,
		currentUserNik,

		// Dialog states
		selectedPengajuan,
		setSelectedPengajuan,
		showFormDialog,
		setShowFormDialog,
		showUpdateDialog,
		setShowUpdateDialog,
		showDetailDialog,
		setShowDetailDialog,
		showDeleteDialog,
		setShowDeleteDialog,
		pengajuanToDelete,
		setPengajuanToDelete,

		// Pagination
		currentPage,
		itemsPerPage,
		totalPages,
		handlePageChange,

		// Update data
		updateData,
		setUpdateData,

		// Filter states
		searchTerm,
		setSearchTerm,
		statusFilter,
		setStatusFilter,
		filteredData,

		// Functions
		handleSubmit,
		handleUpdateStatus,
		handleDeleteConfirm,
		handleView,
		handleEdit,
		handleDelete,
		getPegawaiName,
		fetchData,

		// Computed values
		startIndex,
		endIndex,
	};
};

export default usePengajuanTukarDinas;
