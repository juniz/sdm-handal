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
		return moment(dateString).format("DD MMM YYYY");
	};

	const getTimeAgo = (dateString) => {
		if (!dateString) return null;
		return moment(dateString).fromNow();
	};

	const isOverdue = () => {
		if (!request.expected_completion_date) return false;
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
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
			{/* Header */}
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
				{/* Main Content */}
				<div className="flex-1">
					{/* Title and Status */}
					<div className="flex items-start gap-3 mb-3">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-2 flex-wrap">
								<h3 className="font-semibold text-gray-900 text-lg">
									{request.title}
								</h3>
								{getStatusBadge(request.current_status, request.status_color)}
								{isOverdue() && (
									<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
										<AlertTriangle className="w-3 h-3 mr-1" />
										Overdue
									</span>
								)}
							</div>

							{/* Request Info */}
							<div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-gray-600">
								<span className="font-mono font-medium">
									{request.no_request}
								</span>
								<span>•</span>
								<span className="flex items-center gap-1">
									<User className="w-4 h-4" />
									{request.user_name}
								</span>
								<span>•</span>
								<span className="flex items-center gap-1">
									<Building2 className="w-4 h-4" />
									{request.departemen_name}
								</span>
							</div>

							{/* Description */}
							<p className="text-gray-700 text-sm line-clamp-2 mb-3">
								{request.description}
							</p>

							{/* Metadata */}
							<div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
								{/* Submission Date */}
								<span className="flex items-center gap-1">
									<Calendar className="w-4 h-4" />
									<span>Diajukan: {formatDate(request.submission_date)}</span>
								</span>

								{/* Module Type */}
								<span className="bg-gray-100 px-2 py-1 rounded text-xs">
									{request.module_type}
								</span>

								{/* Expected Completion */}
								{request.expected_completion_date && (
									<span className="flex items-center gap-1">
										<Clock className="w-4 h-4" />
										<span>
											Target: {formatDate(request.expected_completion_date)}
										</span>
									</span>
								)}

								{/* Time ago */}
								<span className="text-gray-500">
									{getTimeAgo(request.submission_date)}
								</span>
							</div>
						</div>
					</div>

					{/* Engagement Metrics */}
					<div className="flex items-center gap-4 text-sm text-gray-500">
						{request.notes_count > 0 && (
							<span className="flex items-center gap-1">
								<MessageSquare className="w-4 h-4" />
								{request.notes_count} komentar
							</span>
						)}
						{request.attachments_count > 0 && (
							<span className="flex items-center gap-1">
								<Paperclip className="w-4 h-4" />
								{request.attachments_count} lampiran
							</span>
						)}
					</div>
				</div>

				{/* Right Side Actions */}
				<div className="flex flex-col items-start lg:items-end gap-3">
					{/* Priority Badge */}
					{getPriorityBadge(
						request.priority_name,
						request.priority_color,
						request.priority_level
					)}

					{/* Action Buttons */}
					<div className="flex items-center gap-2 w-full lg:w-auto">
						<button
							onClick={() => onView(request)}
							className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 lg:flex-initial justify-center lg:justify-start"
							title="Lihat Detail"
						>
							<Eye className="w-4 h-4" />
							<span className="text-sm">Detail</span>
						</button>

						{onEdit && (
							<button
								onClick={() => onEdit(request)}
								className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
								title="Edit Pengajuan"
							>
								<Edit className="w-4 h-4" />
								<span className="text-sm hidden sm:inline">Edit</span>
							</button>
						)}

						{onDelete && (
							<button
								onClick={() => onDelete(request)}
								className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
				<div className="mt-4 pt-3 border-t border-gray-100">
					<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
						<span>Progress Pengembangan</span>
						<span>{request.progress_percentage || 0}%</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all"
							style={{ width: `${request.progress_percentage || 0}%` }}
						/>
					</div>
				</div>
			)}

			{/* Assigned Developer Info */}
			{request.assigned_developer_name && (
				<div className="mt-3 pt-3 border-t border-gray-100">
					<div className="flex items-center gap-2 text-sm text-gray-600">
						<User className="w-4 h-4" />
						<span>
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
