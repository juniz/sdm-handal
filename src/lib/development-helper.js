// Helper functions untuk Development Request System

/**
 * Check if user is from IT department
 * @param {Object} user - User object with departemen_name
 * @returns {boolean} - True if user is from IT department
 */
export const isITUser = (user) => {
	if (!user) return false;
	return user.departemen?.toUpperCase() === "IT";
};

/**
 * Check if request can be approved/rejected
 * @param {Object} request - Request object with current_status
 * @returns {boolean} - True if request can be approved/rejected
 */
export const canApproveRequest = (request) => {
	if (!request?.current_status) return false;

	const allowedStatuses = ["Draft", "Submitted", "Under Review", "Need Info"];
	return allowedStatuses.includes(request.current_status);
};

/**
 * Check if user can edit request
 * @param {Object} request - Request object
 * @param {Object} user - User object
 * @returns {boolean} - True if user can edit request
 */
export const canEditRequest = (request, user) => {
	if (!request || !user) return false;

	// Only owner can edit and only in specific statuses
	const isOwner = request.user_id === user.nik;
	const allowedStatuses = ["Draft", "Submitted", "Need Info"];

	return isOwner && allowedStatuses.includes(request.current_status);
};

/**
 * Check if user can delete request
 * @param {Object} request - Request object
 * @param {Object} user - User object
 * @returns {boolean} - True if user can delete request
 */
export const canDeleteRequest = (request, user) => {
	if (!request || !user) return false;

	// Only owner can delete and only in Draft status
	const isOwner = request.user_id === user.nik;
	const isDraft = request.current_status === "Draft";

	return isOwner && isDraft;
};

/**
 * Get status badge color mapping
 * @param {string} statusColor - Status color from database
 * @returns {string} - Tailwind CSS classes for status badge
 */
export const getStatusBadgeClass = (statusColor) => {
	const colors = {
		"#28a745": "bg-emerald-50 text-emerald-700 border-emerald-200",
		"#dc3545": "bg-red-50 text-red-700 border-red-200",
		"#ffc107": "bg-amber-50 text-amber-700 border-amber-200",
		"#17a2b8": "bg-sky-50 text-sky-700 border-sky-200",
		"#fd7e14": "bg-orange-50 text-orange-700 border-orange-200",
		"#6c757d": "bg-slate-50 text-slate-700 border-slate-200",
		"#007bff": "bg-sky-50 text-sky-700 border-sky-200",
		"#6f42c1": "bg-indigo-50 text-indigo-700 border-indigo-200",
	};

	return colors[statusColor] || "bg-slate-50 text-slate-700 border-slate-200";
};

/**
 * Format raw status key to localized Indonesian label
 * @param {string} status - Raw status string
 * @returns {string} - Localized Indonesian status label
 */
export const formatStatusIndonesian = (status) => {
	if (!status) return "-";
	const mapping = {
		Draft: "Draf",
		Submitted: "Diajukan",
		"Under Review": "Sedang Ditinjau",
		"Need Info": "Butuh Informasi",
		Approved: "Disetujui",
		Rejected: "Ditolak",
		Assigned: "Ditugaskan",
		"In Development": "Sedang Dikerjakan",
		"Development Complete": "Selesai Dikerjakan",
		"In Testing": "Sedang Diuji",
		"Testing Complete": "Selesai Diuji",
		"In Deployment": "Dalam Deployment",
		UAT: "Uji Pengguna (UAT)",
		Completed: "Selesai",
		Overdue: "Terlambat",
	};

	return mapping[status] || status;
};

/**
 * Get priority icon based on priority level
 * @param {number} priorityLevel - Priority level from database
 * @returns {string} - Icon name for priority
 */
export const getPriorityIcon = (priorityLevel) => {
	if (priorityLevel <= 2) return "AlertTriangle";
	if (priorityLevel === 3) return "Clock";
	return "Zap";
};

/**
 * Format date safely with fallback
 * @param {string} dateString - Date string to format
 * @returns {string} - Formatted date or fallback
 */
export const formatDateSafe = (dateString) => {
	if (!dateString) return "-";

	// If date is already formatted from API (contains Indonesian month names)
	if (
		typeof dateString === "string" &&
		(dateString.includes("Januari") ||
			dateString.includes("Februari") ||
			dateString.includes("Maret") ||
			dateString.includes("April") ||
			dateString.includes("Mei") ||
			dateString.includes("Juni") ||
			dateString.includes("Juli") ||
			dateString.includes("Agustus") ||
			dateString.includes("September") ||
			dateString.includes("Oktober") ||
			dateString.includes("November") ||
			dateString.includes("Desember"))
	) {
		return dateString;
	}

	// Try to format with moment
	try {
		const moment = require("moment");
		return moment(dateString).format("DD MMM YYYY, HH:mm");
	} catch (error) {
		console.error("Error formatting date:", error);
		return dateString;
	}
};

/**
 * Validate approval action
 * @param {string} action - Action to validate ('approve' or 'reject')
 * @param {string} reason - Reason for action
 * @returns {Object} - Validation result
 */
export const validateApprovalAction = (action, reason) => {
	const errors = {};

	if (!action || !["approve", "reject"].includes(action)) {
		errors.action = "Action harus berupa 'approve' atau 'reject'";
	}

	if (action === "reject" && !reason?.trim()) {
		errors.reason = "Alasan penolakan harus diisi";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};

/**
 * Get status workflow next steps
 * @param {string} currentStatus - Current status
 * @returns {Array} - Array of possible next statuses
 */
export const getStatusWorkflow = (currentStatus) => {
	const workflow = {
		Draft: ["Submitted", "Approved", "Rejected"], // IT can approve/reject directly from Draft
		Submitted: ["Under Review", "Approved", "Rejected", "Cancelled"],
		"Under Review": ["Need Info", "Approved", "Rejected"],
		"Need Info": ["Under Review", "Approved", "Rejected"],
		Approved: ["Assigned"],
		Assigned: ["In Development"],
		"In Development": ["Development Complete", "Bug Found"],
		"Development Complete": ["In Testing"],
		"In Testing": ["Testing Complete", "Bug Found"],
		"Bug Found": ["In Development"],
		"Testing Complete": ["In Deployment"],
		"In Deployment": ["UAT"],
		UAT: ["Completed", "UAT Failed"],
		"UAT Failed": ["In Development"],
		Completed: ["Closed"],
		Rejected: [],
		Cancelled: [],
		Closed: [],
	};

	return workflow[currentStatus] || [];
};
