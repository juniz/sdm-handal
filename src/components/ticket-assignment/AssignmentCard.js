import { motion } from "framer-motion";
import {
	Ticket,
	User,
	Building2,
	Calendar,
	Tag,
	Flag,
	UserCheck,
	Clock,
	UserX,
	Settings,
	MessageSquare,
	CheckCircle,
	ArrowRight,
} from "lucide-react";
import { TicketDetailProvider } from "@/components/common";

const getPriorityStyle = (priority) => {
	switch (priority?.toLowerCase()) {
		case "low":
			return "bg-emerald-50 text-emerald-700 border-emerald-200";
		case "medium":
			return "bg-amber-50 text-amber-700 border-amber-200";
		case "high":
			return "bg-rose-50 text-rose-700 border-rose-200";
		case "critical":
			return "bg-rose-100 text-rose-800 border-rose-300 font-semibold";
		default:
			return "bg-slate-100 text-slate-700 border-slate-200";
	}
};

const getStatusStyle = (status) => {
	switch (status?.toLowerCase()) {
		case "open":
			return "bg-sky-50 text-sky-700 border-sky-200";
		case "assigned":
			return "bg-blue-50 text-blue-700 border-blue-200";
		case "in progress":
			return "bg-amber-50 text-amber-700 border-amber-200";
		case "on hold":
			return "bg-orange-50 text-orange-700 border-orange-200";
		case "resolved":
			return "bg-emerald-50 text-emerald-700 border-emerald-200";
		case "closed":
			return "bg-slate-100 text-slate-600 border-slate-200";
		default:
			return "bg-slate-100 text-slate-700 border-slate-200";
	}
};

const AssignmentCard = ({
	ticket,
	onAssign,
	onRelease,
	onUpdateStatus,
	currentUser,
	isCompleted = false,
}) => {
	const isAssigned = Boolean(ticket.assigned_to);
	const isMyAssignment = ticket.assigned_to === currentUser?.username;
	const hasNotes = ticket.notes_count > 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
				isCompleted ? "opacity-80" : ""
			}`}
		>
			<div>
				{/* Header Section: ID, Notes, Status, Priority */}
				<div className="flex items-start justify-between gap-2 mb-3">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="font-semibold text-xs tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
							{ticket.no_ticket || `#${ticket.ticket_id}`}
						</span>
						{hasNotes && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium rounded-md">
								<MessageSquare className="w-3 h-3" />
								{ticket.notes_count}
							</span>
						)}
					</div>

					<div className="flex items-center gap-1.5 flex-shrink-0">
						<span
							className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getPriorityStyle(
								ticket.priority_name
							)}`}
						>
							{ticket.priority_name || "Normal"}
						</span>
						<span
							className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusStyle(
								ticket.current_status
							)}`}
						>
							{ticket.current_status}
						</span>
					</div>
				</div>

				{/* Title & Description */}
				<h3 className="font-semibold text-slate-900 text-base mb-1 line-clamp-2 leading-snug">
					{ticket.title}
				</h3>
				{ticket.description && (
					<p className="text-slate-600 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
						{ticket.description}
					</p>
				)}

				{/* Chunked Metadata Grid (2 columns) */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 px-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 mb-4">
					<div className="space-y-1.5">
						<div className="flex items-center gap-1.5 truncate">
							<User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
							<span className="font-medium text-slate-700 truncate">{ticket.user_name}</span>
						</div>
						<div className="flex items-center gap-1.5 truncate">
							<Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
							<span className="truncate">{ticket.departemen_name}</span>
						</div>
						<div className="flex items-center gap-1.5 truncate">
							<Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
							<span className="truncate">{ticket.category_name}</span>
						</div>
					</div>

					<div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-1.5 sm:pt-0 sm:pl-2.5">
						<div className="flex items-center gap-1.5 truncate">
							<Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
							<span className="truncate">{ticket.submission_date}</span>
						</div>
						{isAssigned ? (
							<div className="flex items-center gap-1.5 truncate">
								<UserCheck className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
								<span className="font-medium text-sky-900 truncate">
									{ticket.assigned_to_name}
									{isMyAssignment && " (Saya)"}
								</span>
							</div>
						) : (
							<div className="flex items-center gap-1.5 text-amber-700">
								<Clock className="w-3.5 h-3.5 flex-shrink-0" />
								<span>Belum ditugaskan</span>
							</div>
						)}
						{isCompleted && ticket.resolved_date && (
							<div className="flex items-center gap-1.5 truncate text-emerald-700">
								<CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
								<span className="truncate">Selesai: {ticket.resolved_date}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Footer Action Buttons */}
			<div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
				{/* Detail Button */}
				<TicketDetailProvider ticket={ticket}>
					<button
						type="button"
						className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
					>
						<span>Detail</span>
					</button>
				</TicketDetailProvider>

				{/* Active Ticket Actions */}
				{!isCompleted && (
					<div className="flex items-center gap-2">
						{isAssigned ? (
							<>
								<button
									type="button"
									onClick={() => onRelease(ticket)}
									className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
									title="Lepas Penugasan"
								>
									<UserX className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Lepas</span>
								</button>
								<button
									type="button"
									onClick={() => onUpdateStatus(ticket)}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm"
								>
									<Settings className="w-3.5 h-3.5" />
									<span>Update Status</span>
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => onAssign(ticket)}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm"
							>
								<UserCheck className="w-3.5 h-3.5" />
								<span>Tugaskan</span>
							</button>
						)}
					</div>
				)}
			</div>
		</motion.div>
	);
};

export default AssignmentCard;
