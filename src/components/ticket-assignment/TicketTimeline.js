import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Clock,
	User,
	ArrowRight,
	CheckCircle,
	AlertCircle,
	XCircle,
	Circle,
	Loader,
} from "lucide-react";

const getStatusIcon = (statusName) => {
	switch (statusName?.toLowerCase()) {
		case "open":
			return <Circle className="w-4 h-4 text-sky-600" />;
		case "assigned":
			return <ArrowRight className="w-4 h-4 text-blue-600" />;
		case "in progress":
			return <Loader className="w-4 h-4 text-amber-600" />;
		case "on hold":
			return <AlertCircle className="w-4 h-4 text-orange-600" />;
		case "resolved":
			return <CheckCircle className="w-4 h-4 text-emerald-600" />;
		case "closed":
			return <XCircle className="w-4 h-4 text-slate-500" />;
		default:
			return <AlertCircle className="w-4 h-4 text-slate-500" />;
	}
};

const getStatusColor = (statusName) => {
	switch (statusName?.toLowerCase()) {
		case "open":
			return "bg-sky-50 text-sky-700 border border-sky-200";
		case "assigned":
			return "bg-blue-50 text-blue-700 border border-blue-200";
		case "in progress":
			return "bg-amber-50 text-amber-700 border border-amber-200";
		case "on hold":
			return "bg-orange-50 text-orange-700 border border-orange-200";
		case "resolved":
			return "bg-emerald-50 text-emerald-700 border border-emerald-200";
		case "closed":
			return "bg-slate-100 text-slate-600 border border-slate-200";
		default:
			return "bg-slate-100 text-slate-700 border border-slate-200";
	}
};

const TicketTimeline = ({ ticketId }) => {
	const [history, setHistory] = useState([]);
	const [ticketInfo, setTicketInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchHistory = async () => {
			if (!ticketId) return;

			try {
				setLoading(true);
				const response = await fetch(`/api/ticket/${ticketId}/status-history`);
				const data = await response.json();

				if (data.status === "success") {
					setHistory(data.data.history);
					setTicketInfo(data.data.ticket_info);
				} else {
					setError(data.error || "Gagal mengambil riwayat status");
				}
			} catch (err) {
				setError("Terjadi kesalahan saat mengambil data");
			} finally {
				setLoading(false);
			}
		};

		fetchHistory();
	}, [ticketId]);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-600 border-t-transparent"></div>
				<span className="ml-2.5 text-xs text-slate-500 font-medium">Memuat riwayat status...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
				<p className="text-rose-600 text-xs sm:text-sm font-medium text-center">{error}</p>
			</div>
		);
	}

	if (history.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<Clock className="w-10 h-10 text-slate-400 mb-2" />
				<p className="text-slate-500 text-xs sm:text-sm">Tidak ada riwayat perubahan status</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Ticket Info Header */}
			{ticketInfo && (
				<div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
					<div className="flex items-center justify-between">
						<h4 className="font-bold text-slate-900 text-sm">
							{ticketInfo.no_ticket}
						</h4>
						<span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs rounded-md font-medium">
							{ticketInfo.current_status}
						</span>
					</div>
					<p className="text-slate-600 text-xs mt-1">{ticketInfo.title}</p>
				</div>
			)}

			{/* Timeline */}
			<div className="relative">
				{/* Timeline Line */}
				<div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>

				{/* Timeline Items */}
				<div className="space-y-5">
					{history.map((item, index) => (
						<motion.div
							key={item.status_history_id}
							initial={{ opacity: 0, x: -16 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.08 }}
							className="relative flex items-start"
						>
							{/* Timeline Dot */}
							<div
								className={`flex-shrink-0 w-10 h-10 rounded-full ${getStatusColor(
									item.new_status_name
								)} flex items-center justify-center shadow-xs z-10`}
							>
								{getStatusIcon(item.new_status_name)}
							</div>

							{/* Timeline Content */}
							<div className="ml-5 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex-1">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
									<h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
										{item.status_change}
									</h5>
									<div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 sm:mt-0">
										<Clock className="w-3.5 h-3.5 text-slate-400" />
										<span>{item.change_date_relative}</span>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
									<div className="flex items-center gap-1.5">
										<User className="w-3.5 h-3.5 text-slate-400" />
										<span className="text-slate-500">Diubah oleh:</span>
										<span className="font-medium text-slate-800">
											{item.changed_by_name}
										</span>
									</div>
									<div className="flex items-center gap-1.5">
										<span className="text-slate-500">Departemen:</span>
										<span className="font-medium text-slate-800">
											{item.changed_by_department}
										</span>
									</div>
								</div>

								<div className="mt-2.5 text-[11px] text-slate-400">
									{item.change_date}
								</div>

								{/* Status badges */}
								<div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
									{item.old_status_name && (
										<span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] rounded-md">
											Dari: {item.old_status_display}
										</span>
									)}
									<span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-[11px] rounded-md font-medium">
										Ke: {item.new_status_display}
									</span>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Summary */}
			<div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
				<div className="flex items-center gap-2 mb-3">
					<Clock className="w-4 h-4 text-sky-600" />
					<span className="font-semibold text-xs sm:text-sm text-slate-900">Ringkasan Timeline</span>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
					<div>
						<span className="text-slate-500">Total Perubahan:</span>
						<span className="font-semibold text-slate-800 ml-1">
							{history.length}
						</span>
					</div>
					<div>
						<span className="text-slate-500">Status Pertama:</span>
						<span className="font-semibold text-slate-800 ml-1">
							{history[0]?.new_status_display}
						</span>
					</div>
					<div>
						<span className="text-slate-500">Status Terakhir:</span>
						<span className="font-semibold text-sky-700 ml-1">
							{history[history.length - 1]?.new_status_display}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TicketTimeline;
