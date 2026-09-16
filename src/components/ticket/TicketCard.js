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
	Eye,
} from "lucide-react";
import { TicketDetailProvider } from "@/components/common";

const getPriorityBadge = (priority) => {
	switch (priority?.toLowerCase()) {
		case "low":
			return {
				style: "bg-slate-100 text-slate-700 border-slate-200",
				label: "Rendah",
			};
		case "medium":
			return {
				style: "bg-sky-50 text-sky-700 border-sky-200",
				label: "Sedang",
			};
		case "high":
			return {
				style: "bg-amber-50 text-amber-800 border-amber-200",
				label: "Tinggi",
			};
		case "critical":
			return {
				style: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
				label: "Kritis",
			};
		default:
			return {
				style: "bg-slate-100 text-slate-700 border-slate-200",
				label: priority || "Normal",
			};
	}
};

const getStatusBadge = (status) => {
	switch (status?.toLowerCase()) {
		case "open":
			return {
				style: "bg-sky-50 text-sky-700 border-sky-200",
				label: "Baru",
			};
		case "in progress":
			return {
				style: "bg-amber-50 text-amber-800 border-amber-200",
				label: "Diproses",
			};
		case "on hold":
			return {
				style: "bg-slate-100 text-slate-700 border-slate-200",
				label: "Ditunda",
			};
		case "resolved":
			return {
				style: "bg-emerald-50 text-emerald-700 border-emerald-200",
				label: "Selesai",
			};
		case "closed":
			return {
				style: "bg-slate-100 text-slate-500 border-slate-200",
				label: "Ditutup",
			};
		default:
			return {
				style: "bg-slate-100 text-slate-700 border-slate-200",
				label: status || "Status",
			};
	}
};

const TicketCard = ({ ticket, onEdit, onDelete, onClose }) => {
	const isResolved = ticket.current_status?.toLowerCase() === "resolved";
	const isClosed = ticket.current_status?.toLowerCase() === "closed";
	const hasNotes = ticket.notes_count > 0;

	const priorityBadge = getPriorityBadge(ticket.priority_name);
	const statusBadge = getStatusBadge(ticket.current_status);

	return (
		<motion.div
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
		>
			<div>
				{/* Top Card Header: Ticket No & Actions */}
				<div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
					<div className="flex items-center gap-2">
						<Ticket className="w-4 h-4 text-sky-600 shrink-0" />
						<span className="font-semibold text-xs sm:text-sm text-slate-800">
							{ticket.no_ticket || `#${ticket.ticket_id}`}
						</span>
						{hasNotes && (
							<div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-[11px] rounded-md font-medium">
								<MessageSquare className="w-3 h-3" />
								<span>{ticket.notes_count}</span>
							</div>
						)}
					</div>

					{/* Responsive Action Buttons */}
					<div className="flex items-center gap-1 sm:gap-1.5">
						{/* Detail Button */}
						<TicketDetailProvider ticket={ticket}>
							<button
								type="button"
								className="min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
								title="Lihat Detail"
								aria-label={`Lihat detail pelaporan ${ticket.no_ticket || ticket.ticket_id}`}
							>
								<Eye className="w-3.5 h-3.5 sm:mr-1" />
								<span className="hidden sm:inline">Detail</span>
							</button>
						</TicketDetailProvider>

						{/* Close Ticket Button */}
						{isResolved && (
							<button
								type="button"
								onClick={() => onClose(ticket)}
								className="min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
								title="Tutup Pelaporan"
								aria-label={`Tutup pelaporan ${ticket.no_ticket || ticket.ticket_id}`}
							>
								<CheckCircle className="w-3.5 h-3.5 sm:mr-1" />
								<span className="hidden sm:inline">Tutup</span>
							</button>
						)}

						{/* Edit Button */}
						{!isClosed && (
							<button
								type="button"
								onClick={() => onEdit(ticket)}
								className="min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
								title="Edit Pelaporan"
								aria-label={`Edit pelaporan ${ticket.no_ticket || ticket.ticket_id}`}
							>
								<Edit className="w-3.5 h-3.5 sm:mr-1" />
								<span className="hidden sm:inline">Edit</span>
							</button>
						)}

						{/* Delete Button */}
						{!isClosed && (
							<button
								type="button"
								onClick={() => onDelete(ticket)}
								className="min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
								title="Hapus Pelaporan"
								aria-label={`Hapus pelaporan ${ticket.no_ticket || ticket.ticket_id}`}
							>
								<Trash2 className="w-3.5 h-3.5 sm:mr-1" />
								<span className="hidden sm:inline">Hapus</span>
							</button>
						)}
					</div>
				</div>

				{/* Title & Description */}
				<h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 line-clamp-2">
					{ticket.title}
				</h3>

				<p className="text-slate-600 text-xs sm:text-sm mb-3.5 line-clamp-2 leading-relaxed">
					{ticket.description}
				</p>

				{/* Grouped Hospital Metadata */}
				<div className="space-y-1.5 mb-4 text-xs text-slate-600">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5 truncate">
							<User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<span className="truncate font-medium text-slate-700">{ticket.user_name}</span>
						</div>
						<div className="flex items-center gap-1.5 shrink-0">
							<Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<span className="truncate text-slate-500">{ticket.departemen_name}</span>
						</div>
					</div>

					<div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
						<div className="flex items-center gap-1.5 truncate">
							<Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<span className="truncate text-slate-600">{ticket.category_name}</span>
						</div>
						<div className="flex items-center gap-1.5 shrink-0 text-slate-500">
							<Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<span>{ticket.submission_date}</span>
						</div>
					</div>

					{ticket.resolved_date && (
						<div className="flex items-center gap-1.5 text-emerald-700 font-medium pt-1">
							<CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
							<span>Diselesaikan: {ticket.resolved_date}</span>
						</div>
					)}
					{ticket.closed_date && (
						<div className="flex items-center gap-1.5 text-slate-500 pt-1">
							<CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<span>Ditutup: {ticket.closed_date}</span>
						</div>
					)}
				</div>
			</div>

			{/* Card Footer: Priority & Status Badges */}
			<div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
				<div className="flex items-center gap-1.5">
					<span
						className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 ${priorityBadge.style}`}
					>
						<Flag className="w-3 h-3" />
						<span>{priorityBadge.label}</span>
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					<span
						className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusBadge.style}`}
					>
						{statusBadge.label}
					</span>
					{isResolved && (
						<span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
							Siap Ditutup
						</span>
					)}
				</div>
			</div>
		</motion.div>
	);
};

export default TicketCard;
