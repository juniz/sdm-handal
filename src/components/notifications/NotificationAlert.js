import { motion, AnimatePresence } from "framer-motion";
import {
	AlertTriangle,
	X,
	Ticket,
	Clock,
	User,
	ExternalLink,
} from "lucide-react";
import useNotifications from "@/hooks/useNotifications";
import { useUser } from "@/hooks/useUser";

const NotificationAlert = () => {
	// Disable notifications jika environment variable diset ke true
	if (process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === "true") {
		return null;
	}

	const { notifications, markAsRead } = useNotifications();
	const { user } = useUser();

	// Hanya tampilkan notifikasi jika user adalah departemen IT
	if (!user || user.departemen !== "IT") {
		return null;
	}

	// Filter notifications untuk yang urgent dan belum dibaca
	const urgentNotifications = notifications.filter(
		(notification) => notification.is_urgent && !notification.is_read
	);

	const handleDismiss = async (notification) => {
		await markAsRead(notification.assignment_id);
	};

	const handleViewTicket = (notification) => {
		// Optional: Navigate to ticket detail
		console.log("View ticket:", notification.ticket_id);
	};

	if (urgentNotifications.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<AnimatePresence>
				{urgentNotifications.slice(0, 3).map((notification) => (
					<motion.div
						key={notification.assignment_id}
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-3 md:p-4 rounded-lg shadow-sm"
					>
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
								{/* Icon */}
								<div className="flex-shrink-0">
									<div className="w-6 h-6 md:w-8 md:h-8 bg-red-100 rounded-full flex items-center justify-center">
										<AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
									</div>
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1 flex-wrap">
										<h4 className="text-xs md:text-sm font-semibold text-red-800">
											Ticket Urgent Ditugaskan
										</h4>
										<span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
											{notification.priority_name}
										</span>
									</div>

									<div className="mb-2">
										<p className="text-xs md:text-sm text-gray-700 font-medium line-clamp-1">
											{notification.no_ticket || `#${notification.ticket_id}`} -{" "}
											{notification.title}
										</p>
										<p className="text-xs md:text-sm text-gray-600 line-clamp-2 mt-1">
											{notification.description}
										</p>
									</div>

									{/* Mobile: Stack info vertically */}
									<div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs text-gray-600">
										<div className="flex items-center gap-1">
											<User className="w-3 h-3" />
											<span>Dari: {notification.requester_name}</span>
										</div>
										<div className="flex items-center gap-1">
											<Clock className="w-3 h-3" />
											<span>Ditugaskan: {notification.time_ago}</span>
										</div>
									</div>

									{notification.assigned_by_name && (
										<p className="text-xs text-gray-600 mt-1">
											Ditugaskan oleh: {notification.assigned_by_name}
										</p>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="flex items-start gap-1 md:gap-2 flex-shrink-0 ml-2 md:ml-4">
								<button
									onClick={() => handleViewTicket(notification)}
									className="p-1 md:p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
									title="Lihat Detail Ticket"
								>
									<ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
								</button>
								<button
									onClick={() => handleDismiss(notification)}
									className="p-1 md:p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
									title="Tutup Notifikasi"
								>
									<X className="w-3 h-3 md:w-4 md:h-4" />
								</button>
							</div>
						</div>

						{/* Progress bar untuk urgency */}
						<div className="mt-2 md:mt-3">
							<div className="w-full bg-red-200 rounded-full h-1">
								<div className="bg-red-500 h-1 rounded-full w-full animate-pulse"></div>
							</div>
						</div>
					</motion.div>
				))}
			</AnimatePresence>

			{/* Show more indicator */}
			{urgentNotifications.length > 3 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center"
				>
					<p className="text-xs md:text-sm text-gray-600">
						+{urgentNotifications.length - 3} notifikasi urgent lainnya
					</p>
				</motion.div>
			)}
		</div>
	);
};

export default NotificationAlert;
