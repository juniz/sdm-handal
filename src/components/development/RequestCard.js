import {
	Calendar,
	Clock,
	AlertTriangle,
	Zap,
	Eye,
	Edit,
	Trash2,
	MessageSquare,
	Paperclip,
	User,
	Building2,
} from "lucide-react";
import moment from "moment";

export default function RequestCard({ request, onView, onEdit, onDelete }) {
	const getStatusBadge = (status, statusColor) => {
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

		return (
			<span
				className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
					colors[statusColor] || colors["#6c757d"]
				}`}
			>
				{status}
			</span>
		);
	};

	const getPriorityBadge = (priority, priorityColor, priorityLevel) => {
		const getIcon = () => {
			if (priorityLevel <= 2) return <AlertTriangle className="w-3 h-3 mr-1" />;
			if (priorityLevel === 3) return <Clock className="w-3 h-3 mr-1" />;
			return <Zap className="w-3 h-3 mr-1" />;
		};

		const textColor = getTextColor(priorityColor);

		return (
			<span
				className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${textColor}`}
				style={{ backgroundColor: priorityColor }}
			>
				{getIcon()}
				{priority}
			</span>
		);
	};

	const getTextColor = (backgroundColor) => {
		// Convert hex to RGB
		const hex = backgroundColor.replace("#", "");
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		// Calculate brightness
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;

		// Return appropriate text color
		return brightness > 128 ? "text-gray-900" : "text-white";
	};

	const formatDate = (dateString) => {
		if (!dateString) return null;
		// Jika tanggal sudah berupa string yang di-format dari API (mengandung nama bulan Indonesia)
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
			// Konversi format Indonesia ke format yang lebih singkat
			return dateString.replace(/(\d+)\s+(\w+)\s+(\d+).*/, "$1 $2 $3");
		}
		try {
			return moment(dateString).format("DD MMM YYYY");
		} catch (error) {
			console.error("Error formatting date:", error);
			return dateString;
		}
	};

	const getTimeAgo = (dateString) => {
		if (!dateString) return null;
		// Jika tanggal sudah berupa string yang di-format dari API (mengandung nama bulan Indonesia)
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
			return ""; // Tidak bisa calculate time ago dari string yang sudah di-format
		}
		try {
			return moment(dateString).fromNow();
		} catch (error) {
			console.error("Error calculating time ago:", error);
			return "";
		}
	};

	const isOverdue = () => {
		if (!request.expected_completion_date) return false;
		// Jika tanggal sudah berupa string yang di-format dari API, tidak bisa di-compare
		if (
			typeof request.expected_completion_date === "string" &&
			(request.expected_completion_date.includes("Januari") ||
				request.expected_completion_date.includes("Februari") ||
				request.expected_completion_date.includes("Maret") ||
				request.expected_completion_date.includes("April") ||
				request.expected_completion_date.includes("Mei") ||
				request.expected_completion_date.includes("Juni") ||
				request.expected_completion_date.includes("Juli") ||
				request.expected_completion_date.includes("Agustus") ||
				request.expected_completion_date.includes("September") ||
				request.expected_completion_date.includes("Oktober") ||
				request.expected_completion_date.includes("November") ||
				request.expected_completion_date.includes("Desember"))
		) {
			return false; // Tidak bisa calculate overdue dari string yang sudah di-format
		}

		try {
			const now = moment();
			const expected = moment(request.expected_completion_date);
			const isInProgress = [
				"Assigned",
				"In Development",
				"Development Complete",
				"In Testing",
				"Testing Complete",
				"In Deployment",
				"UAT",
			].includes(request.current_status);

			return isInProgress && now.isAfter(expected);
		} catch (error) {
			console.error("Error checking overdue:", error);
			return false;
		}
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow overflow-hidden">
			{/* Header */}
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
				{/* Main Content */}
				<div className="flex-1 min-w-0 overflow-hidden">
					{/* Title and Status */}
					<div className="flex items-start gap-2 sm:gap-3 mb-3">
						<div className="flex-1 min-w-0 overflow-hidden">
							<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
								<h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight break-words overflow-hidden min-w-0">
									{request.title}
								</h3>
								<div className="flex items-center gap-2 flex-wrap">
									{getStatusBadge(request.current_status, request.status_color)}
									{isOverdue() && (
										<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
											<AlertTriangle className="w-3 h-3 mr-1" />
											Overdue
										</span>
									)}
								</div>
							</div>

							{/* Request Info */}
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 mb-2 text-xs sm:text-sm text-gray-600">
								<span className="font-mono font-medium text-blue-600 break-all">
									{request.no_request}
								</span>
								<span className="hidden sm:inline">•</span>
								<span className="flex items-center gap-1 min-w-0">
									<User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="truncate break-words">
										{request.user_name}
									</span>
								</span>
								<span className="hidden sm:inline">•</span>
								<span className="flex items-center gap-1 min-w-0">
									<Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="truncate break-words">
										{request.departemen_name}
									</span>
								</span>
							</div>

							{/* Description */}
							<p
								className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-3 overflow-hidden"
								style={{
									wordBreak: "break-word",
									overflowWrap: "anywhere",
									hyphens: "auto",
									maxWidth: "100%",
								}}
							>
								{request.description}
							</p>

							{/* Metadata */}
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 overflow-hidden">
								{/* Submission Date */}
								<span className="flex items-center gap-1 min-w-0">
									<Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="truncate">
										Diajukan: {formatDate(request.submission_date)}
									</span>
								</span>

								{/* Module Type */}
								<span className="bg-gray-100 px-2 py-1 rounded text-xs self-start truncate max-w-full">
									{request.module_type}
								</span>

								{/* Expected Completion */}
								{request.expected_completion_date && (
									<span className="flex items-center gap-1 min-w-0">
										<Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
										<span className="truncate">
											Target: {formatDate(request.expected_completion_date)}
										</span>
									</span>
								)}

								{/* Time ago */}
								<span className="text-gray-500 hidden sm:inline truncate">
									{getTimeAgo(request.submission_date)}
								</span>
							</div>
						</div>
					</div>

					{/* Engagement Metrics */}
					<div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
						{request.notes_count > 0 && (
							<span className="flex items-center gap-1">
								<MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">
									{request.notes_count} komentar
								</span>
								<span className="sm:hidden">{request.notes_count}</span>
							</span>
						)}
						{request.attachments_count > 0 && (
							<span className="flex items-center gap-1">
								<Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">
									{request.attachments_count} lampiran
								</span>
								<span className="sm:hidden">{request.attachments_count}</span>
							</span>
						)}
					</div>
				</div>

				{/* Right Side Actions */}
				<div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-2 sm:gap-3 w-full lg:w-auto">
					{/* Priority Badge */}
					<div className="order-2 sm:order-1 lg:order-1">
						{getPriorityBadge(
							request.priority_name,
							request.priority_color,
							request.priority_level
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2 w-full sm:w-auto lg:w-auto order-1 sm:order-2 lg:order-2">
						<button
							onClick={() => onView(request)}
							className="flex items-center justify-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 sm:flex-initial"
							title="Lihat Detail"
						>
							<Eye className="w-4 h-4" />
							<span className="text-sm">Detail</span>
						</button>

						{onEdit && (
							<button
								onClick={() => onEdit(request)}
								className="flex items-center justify-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
								title="Edit Pengajuan"
							>
								<Edit className="w-4 h-4" />
								<span className="text-sm hidden sm:inline">Edit</span>
							</button>
						)}

						{onDelete && (
							<button
								onClick={() => onDelete(request)}
								className="flex items-center justify-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								title="Hapus Pengajuan"
							>
								<Trash2 className="w-4 h-4" />
								<span className="text-sm hidden sm:inline">Hapus</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Progress Indicator for Development Status */}
			{[
				"Assigned",
				"In Development",
				"Development Complete",
				"In Testing",
				"Testing Complete",
				"In Deployment",
				"UAT",
			].includes(request.current_status) && (
				<div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100">
					<div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
						<span>Progress Pengembangan</span>
						<span className="font-medium">
							{request.progress_percentage || 0}%
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
						<div
							className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all"
							style={{ width: `${request.progress_percentage || 0}%` }}
						/>
					</div>
				</div>
			)}

			{/* Assigned Developer Info */}
			{request.assigned_developer_name && (
				<div className="mt-3 pt-3 border-t border-gray-100">
					<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
						<User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
						<span className="truncate break-words">
							Assigned to:{" "}
							<span className="font-medium text-gray-900">
								{request.assigned_developer_name}
							</span>
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
