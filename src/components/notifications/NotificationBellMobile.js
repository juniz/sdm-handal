import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Bell,
	BellRing,
	CheckCheck,
	X,
	Ticket,
	Clock,
	Flag,
	User,
} from "lucide-react";
import useNotifications from "@/hooks/useNotifications";

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

const NotificationBellMobile = () => {
	const {
		notifications,
		unreadCount,
		loading,
		markAsRead,
		markAllAsRead,
	} = useNotifications();
	const [isOpen, setIsOpen] = useState(false);

	const handleNotificationClick = async (notification) => {
		if (!notification.is_read) {
			await markAsRead(notification.assignment_id);
		}
	};

	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
	};

	return (
		<div className="relative">
			{/* Bell Icon for Mobile */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`flex flex-col items-center transition-colors duration-300 px-3 ${
					isOpen ? "text-blue-600" : "text-gray-500 hover:text-blue-500"
				}`}
			>
				<div className="relative">
					{unreadCount > 0 ? (
						<BellRing
							className={`w-6 h-6 ${
								isOpen ? "stroke-[2.5px]" : "stroke-[2px]"
							}`}
						/>
					) : (
						<Bell
							className={`w-6 h-6 ${
								isOpen ? "stroke-[2.5px]" : "stroke-[2px]"
							}`}
						/>
					)}

					{/* Badge */}
					{unreadCount > 0 && (
						<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</div>
				<span className={`text-xs mt-1 ${isOpen ? "font-medium" : ""}`}>
					Notifikasi
				</span>
			</button>

			{/* Mobile Modal */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<div
							className="fixed inset-0 bg-black bg-opacity-50 z-40"
							onClick={() => setIsOpen(false)}
						/>

						{/* Modal Panel - Bottom Sheet Style */}
						<motion.div
							initial={{ opacity: 0, y: "100%" }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: "100%" }}
							className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-50 max-h-[80vh] overflow-hidden"
						>
							{/* Header */}
							<div className="p-4 border-b bg-gray-50 rounded-t-lg">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<BellRing className="w-5 h-5 text-blue-500" />
										<h3 className="font-semibold text-gray-900">
											Notifikasi Assignment
										</h3>
									</div>
									<div className="flex items-center gap-2">
										{unreadCount > 0 && (
											<button
												onClick={handleMarkAllAsRead}
												className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 bg-blue-50 rounded"
												title="Tandai semua sebagai sudah dibaca"
											>
												<CheckCheck className="w-3 h-3" />
												Semua
											</button>
										)}
										<button
											onClick={() => setIsOpen(false)}
											className="text-gray-400 hover:text-gray-600 p-1"
										>
											<X className="w-5 h-5" />
										</button>
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="max-h-[60vh] overflow-y-auto">
								{loading ? (
									<div className="p-6 text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
										<p className="text-sm text-gray-500 mt-3">
											Memuat notifikasi...
										</p>
									</div>
								) : notifications.length === 0 ? (
									<div className="p-8 text-center">
										<Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<p className="text-gray-500">Tidak ada notifikasi</p>
									</div>
								) : (
									<div className="divide-y">
										{notifications.map((notification) => (
											<motion.div
												key={notification.assignment_id}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
													!notification.is_read
														? "bg-blue-50 border-l-4 border-l-blue-500"
														: ""
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="flex items-start gap-3">
													{/* Icon */}
													<div className="flex-shrink-0">
														<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
															<Ticket className="w-5 h-5 text-blue-600" />
														</div>
													</div>

													{/* Content */}
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between mb-1">
															<p className="text-sm font-medium text-gray-900 truncate">
																{notification.no_ticket ||
																	`#${notification.ticket_id}`}
															</p>
															{!notification.is_read && (
																<div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
															)}
														</div>

														<p className="text-sm text-gray-600 line-clamp-2 mb-2">
															{notification.title}
														</p>

														<div className="space-y-1">
															<div className="flex items-center gap-4 text-xs text-gray-500">
																<div className="flex items-center gap-1">
																	<Flag
																		className={`w-3 h-3 ${getPriorityColor(
																			notification.priority_name
																		)}`}
																	/>
																	<span>{notification.priority_name}</span>
																</div>
																<div className="flex items-center gap-1">
																	<Clock className="w-3 h-3" />
																	<span>{notification.time_ago}</span>
																</div>
															</div>
															<div className="flex items-center gap-1 text-xs text-gray-500">
																<User className="w-3 h-3" />
																<span>Dari: {notification.requester_name}</span>
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
													<div className="mt-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 p-2 rounded">
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

							{/* Footer - Pull indicator */}
							<div className="p-3 border-t bg-gray-50">
								<div className="w-12 h-1 bg-gray-300 rounded-full mx-auto"></div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default NotificationBellMobile;
