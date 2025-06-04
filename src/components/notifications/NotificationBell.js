import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Bell,
	BellRing,
	Check,
	CheckCheck,
	X,
	Ticket,
	Clock,
	Flag,
	User,
} from "lucide-react";
import useNotifications from "@/hooks/useNotifications";
import { useUser } from "@/hooks/useUser";

const getPriorityColor = (priority) => {
	switch (priority?.toLowerCase()) {
		case "low":
			return "text-green-600";
		case "medium":
			return "text-yellow-600";
		case "high":
			return "text-red-600";
		case "critical":
			return "text-purple-600";
		default:
			return "text-gray-600";
	}
};

const NotificationBell = () => {
	const {
		notifications,
		unreadCount,
		loading,
		markAsRead,
		markAllAsRead,
	} = useNotifications();
	const { user } = useUser();
	const [isOpen, setIsOpen] = useState(false);

	// Hanya tampilkan notifikasi jika user adalah departemen IT
	if (!user || user.departemen !== "IT") {
		return null;
	}

	const handleNotificationClick = async (notification) => {
		if (!notification.is_read) {
			await markAsRead(notification.assignment_id);
		}
		// Optional: Navigate to ticket detail or assignment page
	};

	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
	};

	return (
		<div className="relative">
			{/* Bell Icon */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative p-2 md:p-2 text-gray-600 hover:text-gray-900 transition-colors"
			>
				{unreadCount > 0 ? (
					<BellRing className="w-5 h-5 md:w-6 md:h-6" />
				) : (
					<Bell className="w-5 h-5 md:w-6 md:h-6" />
				)}

				{/* Badge */}
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-medium text-[10px] md:text-xs">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown Panel */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<div
							className="fixed inset-0 z-40"
							onClick={() => setIsOpen(false)}
						/>

						{/* Panel */}
						<motion.div
							initial={{ opacity: 0, y: -10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -10, scale: 0.95 }}
							className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border z-50 max-h-80 md:max-h-96 overflow-hidden"
						>
							{/* Header */}
							<div className="p-3 md:p-4 border-b bg-gray-50">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<BellRing className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
										<h3 className="text-sm md:text-base font-semibold text-gray-900">
											Notifikasi Assignment
										</h3>
									</div>
									<div className="flex items-center gap-2">
										{unreadCount > 0 && (
											<button
												onClick={handleMarkAllAsRead}
												className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
												title="Tandai semua sebagai sudah dibaca"
											>
												<CheckCheck className="w-3 h-3" />
												<span className="hidden md:inline">Tandai Semua</span>
												<span className="md:hidden">Semua</span>
											</button>
										)}
										<button
											onClick={() => setIsOpen(false)}
											className="text-gray-400 hover:text-gray-600"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="max-h-64 md:max-h-80 overflow-y-auto">
								{loading ? (
									<div className="p-4 text-center">
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
										<p className="text-sm text-gray-500 mt-2">
											Memuat notifikasi...
										</p>
									</div>
								) : notifications.length === 0 ? (
									<div className="p-6 text-center">
										<Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
										<p className="text-gray-500">Tidak ada notifikasi</p>
									</div>
								) : (
									<div className="divide-y">
										{notifications.map((notification) => (
											<motion.div
												key={notification.assignment_id}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className={`p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
													!notification.is_read
														? "bg-blue-50 border-l-4 border-l-blue-500"
														: ""
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="flex items-start gap-2 md:gap-3">
													{/* Icon */}
													<div className="flex-shrink-0">
														<div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
															<Ticket className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
														</div>
													</div>

													{/* Content */}
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between mb-1">
															<p className="text-xs md:text-sm font-medium text-gray-900 truncate">
																{notification.no_ticket ||
																	`#${notification.ticket_id}`}
															</p>
															{!notification.is_read && (
																<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
															)}
														</div>

														<p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
															{notification.title}
														</p>

														<div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs text-gray-500">
															<div className="flex items-center gap-1">
																<Flag
																	className={`w-3 h-3 ${getPriorityColor(
																		notification.priority_name
																	)}`}
																/>
																<span>{notification.priority_name}</span>
															</div>
															<div className="flex items-center gap-1">
																<User className="w-3 h-3" />
																<span>{notification.requester_name}</span>
															</div>
															<div className="flex items-center gap-1">
																<Clock className="w-3 h-3" />
																<span>{notification.time_ago}</span>
															</div>
														</div>

														{notification.assigned_by_name && (
															<p className="text-xs text-gray-500 mt-1">
																Ditugaskan oleh: {notification.assigned_by_name}
															</p>
														)}
													</div>
												</div>

												{/* Urgent indicator */}
												{notification.is_urgent && (
													<div className="mt-2 flex items-center gap-1 text-xs text-red-600">
														<Flag className="w-3 h-3" />
														<span className="font-medium">
															URGENT - Prioritas Tinggi
														</span>
													</div>
												)}
											</motion.div>
										))}
									</div>
								)}
							</div>

							{/* Footer */}
							{notifications.length > 0 && (
								<div className="p-3 border-t bg-gray-50">
									<button
										onClick={() => {
											setIsOpen(false);
											// TODO: Navigate to full notifications page
										}}
										className="w-full text-center text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
									>
										Lihat Semua Notifikasi
									</button>
								</div>
							)}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default NotificationBell;
