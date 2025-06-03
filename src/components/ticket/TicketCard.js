import { motion } from "framer-motion";
import {
	Ticket,
	Edit,
	Trash2,
	User,
	Building2,
	Calendar,
	Tag,
	Flag,
	CheckCircle,
	MessageSquare,
} from "lucide-react";
import { TicketDetailProvider } from "@/components/common";

const getPriorityColor = (priority) => {
	switch (priority?.toLowerCase()) {
		case "low":
			return "bg-green-100 text-green-800";
		case "medium":
			return "bg-yellow-100 text-yellow-800";
		case "high":
			return "bg-red-100 text-red-800";
		case "critical":
			return "bg-purple-100 text-purple-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

const getStatusColor = (status) => {
	switch (status?.toLowerCase()) {
		case "open":
			return "bg-blue-100 text-blue-800";
		case "in progress":
			return "bg-yellow-100 text-yellow-800";
		case "resolved":
			return "bg-green-100 text-green-800";
		case "closed":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

const TicketCard = ({ ticket, onEdit, onDelete, onClose }) => {
	const isResolved = ticket.current_status?.toLowerCase() === "resolved";
	const isClosed = ticket.current_status?.toLowerCase() === "closed";
	const hasNotes = ticket.notes_count > 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<Ticket className="w-5 h-5 text-blue-500" />
					<span className="font-medium text-sm text-gray-500">
						{ticket.no_ticket || `#${ticket.ticket_id}`}
					</span>
					{hasNotes && (
						<div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
							<MessageSquare className="w-3 h-3" />
							<span>{ticket.notes_count}</span>
						</div>
					)}
				</div>

				{/* Responsive Action Buttons */}
				<div className="flex gap-1 sm:gap-2">
					{/* Detail Button */}
					<TicketDetailProvider ticket={ticket}>
						<button
							className="flex items-center justify-center p-1 sm:px-3 sm:py-1.5 text-gray-500 hover:text-blue-500 sm:bg-blue-50 sm:text-blue-600 sm:hover:bg-blue-100 rounded-md text-sm font-medium transition-colors min-w-[32px] sm:min-w-auto"
							title="Lihat Detail"
						>
							<svg
								className="w-4 h-4 sm:mr-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
							<span className="hidden sm:inline">Detail</span>
						</button>
					</TicketDetailProvider>

					{/* Close Ticket Button - Only show if status is "Resolved" */}
					{isResolved && (
						<button
							onClick={() => onClose(ticket)}
							className="flex items-center justify-center p-1 sm:px-3 sm:py-1.5 text-white bg-green-500 hover:bg-green-600 sm:bg-green-600 sm:hover:bg-green-700 rounded-md text-sm font-medium transition-colors min-w-[32px] sm:min-w-auto"
							title="Tutup Ticket"
						>
							<CheckCircle className="w-4 h-4 sm:mr-1" />
							<span className="hidden sm:inline">Tutup</span>
						</button>
					)}

					{/* Edit Button - Only show if not closed */}
					{!isClosed && (
						<button
							onClick={() => onEdit(ticket)}
							className="flex items-center justify-center p-1 sm:px-3 sm:py-1.5 text-gray-500 hover:text-blue-500 sm:bg-yellow-50 sm:text-yellow-600 sm:hover:bg-yellow-100 rounded-md text-sm font-medium transition-colors min-w-[32px] sm:min-w-auto"
							title="Edit Ticket"
						>
							<Edit className="w-4 h-4 sm:mr-1" />
							<span className="hidden sm:inline">Edit</span>
						</button>
					)}

					{/* Delete Button - Only show if not closed */}
					{!isClosed && (
						<button
							onClick={() => onDelete(ticket.ticket_id)}
							className="flex items-center justify-center p-1 sm:px-3 sm:py-1.5 text-gray-500 hover:text-red-500 sm:bg-red-50 sm:text-red-600 sm:hover:bg-red-100 rounded-md text-sm font-medium transition-colors min-w-[32px] sm:min-w-auto"
							title="Hapus Ticket"
						>
							<Trash2 className="w-4 h-4 sm:mr-1" />
							<span className="hidden sm:inline">Hapus</span>
						</button>
					)}
				</div>
			</div>

			<h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
				{ticket.title}
			</h3>

			<p className="text-gray-600 text-sm mb-3 line-clamp-2">
				{ticket.description}
			</p>

			<div className="space-y-2 mb-3">
				<div className="flex items-center gap-2 text-sm">
					<User className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<span className="truncate">{ticket.user_name}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<span className="truncate">{ticket.departemen_name}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<span className="truncate">{ticket.category_name}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<span className="truncate text-xs sm:text-sm">
						{ticket.submission_date}
					</span>
				</div>
				{/* Show resolved date if ticket is resolved */}
				{ticket.resolved_date && (
					<div className="flex items-center gap-2 text-sm">
						<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
						<span className="truncate text-xs sm:text-sm text-green-700">
							Diselesaikan: {ticket.resolved_date}
						</span>
					</div>
				)}
				{/* Show closed date if ticket is closed */}
				{ticket.closed_date && (
					<div className="flex items-center gap-2 text-sm">
						<CheckCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
						<span className="truncate text-xs sm:text-sm text-gray-700">
							Ditutup: {ticket.closed_date}
						</span>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 flex-shrink-0">
					<span
						className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(
							ticket.priority_name
						)}`}
					>
						<Flag className="w-3 h-3" />
						<span className="hidden sm:inline">{ticket.priority_name}</span>
						<span className="sm:hidden">{ticket.priority_name.charAt(0)}</span>
					</span>
				</div>
				<div className="flex flex-col items-end gap-1">
					<span
						className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(
							ticket.current_status
						)}`}
					>
						<span className="hidden sm:inline">{ticket.current_status}</span>
						<span className="sm:hidden">
							{ticket.current_status === "In Progress"
								? "Progress"
								: ticket.current_status === "On Hold"
								? "Hold"
								: ticket.current_status}
						</span>
					</span>
					{/* Show resolved indicator */}
					{isResolved && (
						<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
							<span className="hidden sm:inline">Siap Ditutup</span>
							<span className="sm:hidden">✓</span>
						</span>
					)}
				</div>
			</div>
		</motion.div>
	);
};

export default TicketCard;
