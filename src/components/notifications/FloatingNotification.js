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

const FloatingNotification = () => {
	// Disable notifications jika environment variable diset ke true
	if (process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS === "true") {
		return null;
	}

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
		<>
			{/* Floating Icon - Only visible on mobile */}
			<motion.div
				initial={{ opacity: 0, scale: 0 }}
				animate={{ opacity: 1, scale: 1 }}
				className="fixed top-2 right-4 z-50 md:hidden"
			>
				<motion.button
					onClick={() => setIsOpen(!isOpen)}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className="relative w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors duration-200"
				>
					{unreadCount > 0 ? (
						<BellRing className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
					) : (
						<Bell className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
					)}

					{/* Badge */}
					{unreadCount > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</motion.span>
					)}

					{/* Pulse animation for urgent notifications */}
					{notifications.some((n) => n.is_urgent && !n.is_read) && (
						<motion.div
							animate={{ scale: [1, 1.3, 1] }}
							transition={{ duration: 2, repeat: Infinity }}
							className="absolute inset-0 bg-red-500 rounded-full opacity-30"
						/>
					)}
				</motion.button>
			</motion.div>

			{/* Mobile Modal - Bottom Sheet */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
							onClick={() => setIsOpen(false)}
						/>

						{/* Modal Panel - Bottom Sheet Style */}
						<motion.div
							initial={{ opacity: 0, y: "100%" }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: "100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[85vh] overflow-hidden md:hidden"
						>
							{/* Handle Bar */}
							<div className="flex justify-center pt-3 pb-2">
								<div className="w-12 h-1 bg-gray-300 rounded-full"></div>
							</div>

							{/* Header */}
							<div className="px-6 pb-4 border-b bg-gray-50/50">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<BellRing className="w-4 h-4 text-blue-600" />
										</div>
										<div>
											<h3 className="font-semibold text-gray-900 text-lg">
												Notifikasi Assignment
											</h3>
											<p className="text-sm text-gray-500">
												{unreadCount} notifikasi belum dibaca
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{unreadCount > 0 && (
											<motion.button
												whileTap={{ scale: 0.95 }}
												onClick={handleMarkAllAsRead}
												className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-2 bg-blue-50 rounded-full font-medium"
											>
												<CheckCheck className="w-3 h-3" />
												Tandai Semua
											</motion.button>
										)}
										<motion.button
											whileTap={{ scale: 0.95 }}
											onClick={() => setIsOpen(false)}
											className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
										>
											<X className="w-5 h-5" />
										</motion.button>
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="max-h-[60vh] overflow-y-auto">
								{loading ? (
									<div className="p-8 text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
										<p className="text-sm text-gray-500 mt-3">
											Memuat notifikasi...
										</p>
									</div>
								) : notifications.length === 0 ? (
									<div className="p-8 text-center">
										<Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<p className="text-gray-500 text-lg mb-2">
											Tidak ada notifikasi
										</p>
										<p className="text-gray-400 text-sm">
											Anda akan menerima notifikasi ketika ada ticket yang
											ditugaskan
										</p>
									</div>
								) : (
									<div className="divide-y divide-gray-100">
										{notifications.map((notification, index) => (
											<motion.div
												key={notification.assignment_id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.05 }}
												className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
													!notification.is_read
														? "bg-blue-50/50 border-l-4 border-l-blue-500"
														: ""
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="flex items-start gap-3">
													{/* Icon */}
													<div className="flex-shrink-0">
														<div
															className={`w-10 h-10 rounded-full flex items-center justify-center ${
																notification.is_urgent
																	? "bg-red-100"
																	: "bg-blue-100"
															}`}
														>
															<Ticket
																className={`w-5 h-5 ${
																	notification.is_urgent
																		? "text-red-600"
																		: "text-blue-600"
																}`}
															/>
														</div>
													</div>

													{/* Content */}
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between mb-1">
															<p className="text-sm font-semibold text-gray-900 truncate">
																{notification.no_ticket ||
																	`#${notification.ticket_id}`}
															</p>
															{!notification.is_read && (
																<div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
															)}
														</div>

														<p className="text-sm text-gray-700 font-medium line-clamp-1 mb-2">
															{notification.title}
														</p>

														<p className="text-xs text-gray-600 line-clamp-2 mb-3">
															{notification.description}
														</p>

														<div className="flex flex-wrap gap-3 text-xs text-gray-500">
															<div className="flex items-center gap-1">
																<Flag
																	className={`w-3 h-3 ${getPriorityColor(
																		notification.priority_name
																	)}`}
																/>
																<span className="font-medium">
																	{notification.priority_name}
																</span>
															</div>
															<div className="flex items-center gap-1">
																<User className="w-3 h-3" />
																<span>Dari: {notification.requester_name}</span>
															</div>
															<div className="flex items-center gap-1">
																<Clock className="w-3 h-3" />
																<span>{notification.time_ago}</span>
															</div>
														</div>

														{notification.assigned_by_name && (
															<p className="text-xs text-gray-500 mt-2 bg-gray-50 px-2 py-1 rounded">
																Ditugaskan oleh: {notification.assigned_by_name}
															</p>
														)}
													</div>
												</div>

												{/* Urgent indicator */}
												{notification.is_urgent && (
													<motion.div
														initial={{ opacity: 0, scale: 0.9 }}
														animate={{ opacity: 1, scale: 1 }}
														className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200"
													>
														<Flag className="w-3 h-3" />
														<span className="font-semibold">
															URGENT - Prioritas Tinggi
														</span>
													</motion.div>
												)}
											</motion.div>
										))}
									</div>
								)}
							</div>

							{/* Footer */}
							{notifications.length > 0 && (
								<div className="p-4 border-t bg-gray-50/50">
									<motion.button
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											setIsOpen(false);
											// TODO: Navigate to full notifications page
										}}
										className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-3 hover:bg-blue-50 rounded-lg transition-colors"
									>
										Lihat Semua Notifikasi
									</motion.button>
								</div>
							)}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
};

export default FloatingNotification;
