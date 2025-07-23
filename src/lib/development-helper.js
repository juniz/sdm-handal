// Helper functions untuk Development Request System

/**
 * Check if user is from IT department
 * @param {Object} user - User object with departemen_name
 * @returns {boolean} - True if user is from IT department
 */
export const isITUser = (user) => {
	if (!user?.departemen_name) return false;

	const deptName = user.departemen_name.toLowerCase();
	return (
		deptName.includes("it") ||
		deptName.includes("information technology") ||
		deptName.includes("teknologi informasi") ||
		deptName.includes("sim") ||
		deptName.includes("sistem informasi") ||
		deptName.includes("unit sim") ||
		deptName.includes("information system")
	);
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
		"#28a745": "bg-green-100 text-green-800 border-green-200",
		"#dc3545": "bg-red-100 text-red-800 border-red-200",
		"#ffc107": "bg-yellow-100 text-yellow-800 border-yellow-200",
		"#17a2b8": "bg-blue-100 text-blue-800 border-blue-200",
		"#fd7e14": "bg-orange-100 text-orange-800 border-orange-200",
		"#6c757d": "bg-gray-100 text-gray-800 border-gray-200",
		"#007bff": "bg-blue-100 text-blue-800 border-blue-200",
		"#6f42c1": "bg-purple-100 text-purple-800 border-purple-200",
	};

	return colors[statusColor] || colors["#6c757d"];
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
