"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Bell,
	BellRing,
	CheckCheck,
	X,
	Clock,
} from "lucide-react";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import moment from "moment";
import "moment/locale/id";

const NotificationBell = () => {
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
	} = useUserNotifications();
	const [isOpen, setIsOpen] = useState(false);

	const handleNotificationClick = async (notification) => {
		if (!notification.is_read) {
			await markAsRead(notification.id);
		}
		setIsOpen(false);
		if (notification.url) {
			window.location.href = notification.url;
		}
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
				aria-label="Notifikasi"
			>
				{unreadCount > 0 ? (
					<BellRing className="w-5 h-5 md:w-6 md:h-6 text-blue-600 animate-pulse" />
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
							className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border z-50 max-h-80 md:max-h-96 overflow-hidden flex flex-col"
						>
							{/* Header */}
							<div className="p-3 md:p-4 border-b bg-gray-50 flex-shrink-0">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<BellRing className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
										<h3 className="text-sm md:text-base font-semibold text-gray-900">
											Notifikasi
										</h3>
									</div>
									<div className="flex items-center gap-2">
										{unreadCount > 0 && (
											<button
												onClick={handleMarkAllAsRead}
												className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
												title="Tandai semua sebagai sudah dibaca"
											>
												<CheckCheck className="w-3.5 h-3.5" />
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
								{loading && notifications.length === 0 ? (
									<div className="p-4 text-center">
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
										<p className="text-sm text-gray-500 mt-2">
											Memuat notifikasi...
										</p>
									</div>
								) : notifications.length === 0 ? (
									<div className="p-6 text-center">
										<Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
										<p className="text-gray-500 text-sm">Tidak ada notifikasi</p>
									</div>
								) : (
									<div className="divide-y divide-gray-100">
										{notifications.map((notification) => (
											<motion.div
												key={notification.id}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												className={`p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
													!notification.is_read
														? "bg-blue-50/60 border-l-4 border-l-blue-500"
														: ""
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="flex items-start justify-between gap-2 mb-1">
													<p
														className={`text-xs md:text-sm ${
															!notification.is_read
																? "font-semibold text-gray-900"
																: "font-medium text-gray-700"
														} line-clamp-1`}
													>
														{notification.title}
													</p>
													{!notification.is_read && (
														<span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
													)}
												</div>

												<p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
													{notification.message}
												</p>

												<div className="flex items-center gap-1 text-[11px] text-gray-400">
													<Clock className="w-3 h-3" />
													<span>
														{moment(notification.created_at).fromNow()}
													</span>
												</div>
											</motion.div>
										))}
									</div>
								)}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default NotificationBell;
