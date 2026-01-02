import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

/**
 * Generate status badge component
 * @param {string} status - Status value
 * @returns {JSX.Element} Badge component
 */
export const getStatusBadge = (status) => {
	const statusConfig = {
		"Proses Pengajuan": {
			variant: "secondary",
			icon: Clock,
			text: "Proses Pengajuan",
		},
		Disetujui: { variant: "default", icon: CheckCircle, text: "Disetujui" },
		Ditolak: { variant: "destructive", icon: XCircle, text: "Ditolak" },
	};

	const config = statusConfig[status] || statusConfig["Proses Pengajuan"];
	const Icon = config.icon;

	return (
		<Badge variant={config.variant} className="flex items-center gap-1">
			<Icon className="w-3 h-3" />
			{config.text}
		</Badge>
	);
};

/**
 * Generate shift badge component
 * @param {string} shift - Shift value
 * @returns {JSX.Element} Shift badge component
 */
export const getShiftBadge = (shift) => {
	const shiftConfig = {
		Pagi: {
			variant: "default",
			text: "Pagi",
			color: "bg-yellow-100 text-yellow-800",
		},
		Siang: {
			variant: "secondary",
			text: "Siang",
			color: "bg-orange-100 text-orange-800",
		},
		Malam: {
			variant: "outline",
			text: "Malam",
			color: "bg-blue-100 text-blue-800",
		},
	};

	const config = shiftConfig[shift] || shiftConfig["Pagi"];

	return (
		<span
			className={`px-2 py-1 rounded-md text-xs font-medium ${config.color}`}
		>
			{config.text}
		</span>
	);
};

/**
 * Validate form data for pengajuan tukar dinas
 * @param {Object} formData - Form data object
 * @param {Object} dateState - Date state object
 * @param {string} currentUserNik - Current user NIK
 * @param {Array} pegawaiData - Pegawai data array
 * @returns {Object} Validation result
 */
export const validatePengajuanForm = (
	formData,
	dateState,
	currentUserNik,
	pegawaiData
) => {
	const errors = {};

	// Required fields validation
	const requiredFields = ["shift1", "shift2", "kepentingan"];
	for (let field of requiredFields) {
		if (!formData[field]) {
			errors[field] = `Field ${field.replace("_", " ")} harus diisi`;
		}
	}

	// Date validation
	if (!dateState.tgl_dinas) {
		errors.tgl_dinas = "Tanggal dinas harus diisi";
	}

	if (!dateState.tgl_ganti) {
		errors.tgl_ganti = "Tanggal dinas pengganti harus diisi";
	}

	// NIK validation
	if (!formData.nik_ganti) {
		errors.nik_ganti = "NIK pengganti harus diisi";
	}

	if (!currentUserNik) {
		errors.currentUser = "NIK pemohon tidak ditemukan";
	}

	// NIK tidak boleh sama
	if (currentUserNik === formData.nik_ganti) {
		errors.nik_ganti = "NIK pemohon dan NIK pengganti tidak boleh sama";
	}

	// Validate NIK exists in database
	if (currentUserNik && !pegawaiData.find((p) => p.nik === currentUserNik)) {
		errors.currentUser = "NIK pemohon tidak valid";
	}

	if (
		formData.nik_ganti &&
		!pegawaiData.find((p) => p.nik === formData.nik_ganti)
	) {
		errors.nik_ganti = "NIK pengganti tidak valid";
	}

	if (formData.nik_pj && !pegawaiData.find((p) => p.nik === formData.nik_pj)) {
		errors.nik_pj = "NIK penanggung jawab tidak valid";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};

/**
 * Format pengajuan data for display
 * @param {Object} pengajuan - Pengajuan data
 * @param {Array} pegawaiData - Pegawai data array
 * @returns {Object} Formatted pengajuan data
 */
export const formatPengajuanData = (pengajuan, pegawaiData = []) => {
	const getPegawaiName = (nik) => {
		const pegawai = pegawaiData.find((p) => p.nik === nik);
		return pegawai ? pegawai.nama : nik;
	};

	return {
		...pengajuan,
		nama_pemohon: getPegawaiName(pengajuan.nik),
		nama_pengganti: getPegawaiName(pengajuan.nik_ganti),
		nama_pj: pengajuan.nik_pj ? getPegawaiName(pengajuan.nik_pj) : null,
	};
};

/**
 * Get status color for UI elements
 * @param {string} status - Status value
 * @returns {string} CSS color class
 */
export const getStatusColor = (status) => {
	const statusColors = {
		"Proses Pengajuan": "text-yellow-600 bg-yellow-50",
		Disetujui: "text-green-600 bg-green-50",
		Ditolak: "text-red-600 bg-red-50",
	};

	return statusColors[status] || statusColors["Proses Pengajuan"];
};

/**
 * Check if pengajuan can be deleted
 * @param {Object} pengajuan - Pengajuan data
 * @returns {boolean} Can delete status
 */
export const canDeletePengajuan = (pengajuan) => {
	return pengajuan.status === "Proses Pengajuan";
};

/**
 * Check if user can edit pengajuan
 * @param {string} userDepartment - User department
 * @param {Object} pengajuan - Pengajuan data
 * @returns {boolean} Can edit status
 */
export const canEditPengajuan = (userDepartment, pengajuan) => {
	return userDepartment === "IT_HRD";
};

/**
 * Generate pagination info text
 * @param {number} currentPage - Current page number
 * @param {number} itemsPerPage - Items per page
 * @param {number} totalItems - Total items count
 * @returns {string} Pagination info text
 */
export const getPaginationInfo = (currentPage, itemsPerPage, totalItems) => {
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

	return `Menampilkan ${startIndex + 1} - ${endIndex} dari ${totalItems} data`;
};

/**
 * Generate page numbers for pagination
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total pages count
 * @param {number} maxVisiblePages - Maximum visible page numbers
 * @returns {Array} Array of page numbers
 */
export const getPageNumbers = (
	currentPage,
	totalPages,
	maxVisiblePages = 5
) => {
	const pages = [];

	if (totalPages <= maxVisiblePages) {
		for (let i = 1; i <= totalPages; i++) {
			pages.push(i);
		}
	} else {
		const startPage = Math.max(
			1,
			currentPage - Math.floor(maxVisiblePages / 2)
		);
		const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}
	}

	return pages;
};

/**
 * Constants for pengajuan system
 */
export const PENGAJUAN_CONSTANTS = {
	STATUS: {
		PROSES: "Proses Pengajuan",
		DISETUJUI: "Disetujui",
		DITOLAK: "Ditolak",
	},
	SHIFTS: {
		PAGI: "Pagi",
		SIANG: "Siang",
		MALAM: "Malam",
	},
	DEPARTMENTS: {
		IT_HRD: "IT_HRD",
		USER: "USER",
	},
	PAGINATION: {
		DEFAULT_ITEMS_PER_PAGE: 10,
		MAX_VISIBLE_PAGES: 5,
	},
};
