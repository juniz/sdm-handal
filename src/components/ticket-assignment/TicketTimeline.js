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
			return <Circle className="w-4 h-4 text-blue-500" />;
		case "assigned":
			return <ArrowRight className="w-4 h-4 text-yellow-500" />;
		case "in progress":
			return <Loader className="w-4 h-4 text-orange-500" />;
		case "resolved":
			return <CheckCircle className="w-4 h-4 text-green-500" />;
		case "closed":
			return <XCircle className="w-4 h-4 text-gray-500" />;
		default:
			return <AlertCircle className="w-4 h-4 text-purple-500" />;
	}
};

const getStatusColor = (statusName) => {
	switch (statusName?.toLowerCase()) {
		case "open":
			return "bg-blue-500";
		case "assigned":
			return "bg-yellow-500";
		case "in progress":
			return "bg-orange-500";
		case "resolved":
			return "bg-green-500";
		case "closed":
			return "bg-gray-500";
		default:
			return "bg-purple-500";
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
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Memuat riwayat status...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<AlertCircle className="w-12 h-12 text-red-500 mb-2" />
				<p className="text-red-600 text-center">{error}</p>
			</div>
		);
	}

	if (history.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<Clock className="w-12 h-12 text-gray-400 mb-2" />
				<p className="text-gray-600">Tidak ada riwayat perubahan status</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Ticket Info Header */}
			{ticketInfo && (
				<div className="bg-gray-50 p-4 rounded-lg mb-6">
					<h4 className="font-semibold text-gray-900 mb-1">
						{ticketInfo.no_ticket}
					</h4>
					<p className="text-gray-600 text-sm mb-2">{ticketInfo.title}</p>
					<div className="flex items-center gap-2">
						<span className="text-xs text-gray-500">Status Saat Ini:</span>
						<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
							{ticketInfo.current_status}
						</span>
					</div>
				</div>
			)}

			{/* Timeline */}
			<div className="relative">
				{/* Timeline Line */}
				<div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

				{/* Timeline Items */}
				<div className="space-y-6">
					{history.map((item, index) => (
						<motion.div
							key={item.status_history_id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							className="relative flex items-start"
						>
							{/* Timeline Dot */}
							<div
								className={`flex-shrink-0 w-12 h-12 rounded-full ${getStatusColor(
									item.new_status_name
								)} flex items-center justify-center shadow-lg z-10`}
							>
								{getStatusIcon(item.new_status_name)}
							</div>

							{/* Timeline Content */}
							<div className="ml-6 bg-white rounded-lg border shadow-sm p-4 flex-1">
								<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2">
									<div className="flex items-center gap-2">
										<h5 className="font-semibold text-gray-900">
											{item.status_change}
										</h5>
									</div>
									<div className="flex items-center gap-2 text-sm text-gray-500 mt-1 lg:mt-0">
										<Clock className="w-3 h-3" />
										<span>{item.change_date_relative}</span>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
									<div className="flex items-center gap-2">
										<User className="w-3 h-3 text-gray-400" />
										<span className="text-gray-600">Diubah oleh:</span>
										<span className="font-medium text-gray-900">
											{item.changed_by_name}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-gray-600">Departemen:</span>
										<span className="text-gray-800">
											{item.changed_by_department}
										</span>
									</div>
								</div>

								<div className="mt-3 text-xs text-gray-500">
									{item.change_date}
								</div>

								{/* Status badges */}
								<div className="flex flex-wrap gap-2 mt-3">
									{item.old_status_name && (
										<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
											Dari: {item.old_status_display}
										</span>
									)}
									<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
										Ke: {item.new_status_display}
									</span>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Summary */}
			<div className="mt-6 p-4 bg-blue-50 rounded-lg">
				<div className="flex items-center gap-2 mb-2">
					<Clock className="w-4 h-4 text-blue-600" />
					<span className="font-medium text-blue-900">Ringkasan Timeline</span>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
					<div>
						<span className="text-blue-700">Total Perubahan:</span>
						<span className="font-medium text-blue-900 ml-1">
							{history.length}
						</span>
					</div>
					<div>
						<span className="text-blue-700">Status Pertama:</span>
						<span className="font-medium text-blue-900 ml-1">
							{history[0]?.new_status_display}
						</span>
					</div>
					<div>
						<span className="text-blue-700">Status Terakhir:</span>
						<span className="font-medium text-blue-900 ml-1">
							{history[history.length - 1]?.new_status_display}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TicketTimeline;
