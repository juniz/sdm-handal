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

const NotificationBellMobile = () => {
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
			{/* Bell Icon Trigger */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`relative w-12 h-12 flex items-center justify-center rounded-[20px] bg-white border border-slate-200/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 active:scale-95 ${
					isOpen ? "text-[#0093dd] ring-2 ring-[#0093dd]/20" : "text-slate-500"
				}`}
				aria-label="Notifikasi"
			>
				{unreadCount > 0 ? (
					<BellRing className={`w-5 h-5 text-[#0093dd] ${isOpen ? "animate-none" : "animate-bounce"}`} />
				) : (
					<Bell className="w-5 h-5" />
				)}

				{/* Soft Notification Badge */}
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white border-2 border-white text-[9px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-bold shadow-md transform translate-x-1/4 -translate-y-1/4">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Mobile Modal - Soft & Trustworthy Bottom Sheet */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop with blurring glass effect */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
							onClick={() => setIsOpen(false)}
						/>

						{/* Bottom Sheet */}
						<motion.div
							initial={{ opacity: 0, y: "100%" }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: "100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[110] max-h-[85vh] flex flex-col overflow-hidden"
						>
							{/* Handle for bottom sheet */}
							<div className="flex justify-center pt-3 pb-1">
								<div className="w-12 h-1.5 bg-slate-200 rounded-full" />
							</div>

							{/* Header */}
							<div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-2xl bg-[#0093dd]/10 flex items-center justify-center">
										<BellRing className="w-5 h-5 text-[#0093dd]" />
									</div>
									<div>
										<h3 className="font-bold text-slate-800 text-base">
											Notifikasi
										</h3>
										<p className="text-xs text-slate-500 font-medium">
											{unreadCount > 0 ? `${unreadCount} pesan baru` : "Semua sudah dibaca"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{unreadCount > 0 && (
										<button
											onClick={handleMarkAllAsRead}
											className="text-[11px] font-bold text-[#0093dd] bg-[#0093dd]/5 px-3 py-2 rounded-xl active:bg-[#0093dd]/10 transition-colors flex items-center gap-1"
										>
											<CheckCheck className="w-3.5 h-3.5" />
											<span>Baca Semua</span>
										</button>
									)}
									<button
										onClick={() => setIsOpen(false)}
										className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-y-auto overscroll-contain pb-10">
								{loading && notifications.length === 0 ? (
									<div className="p-12 text-center">
										<div className="w-10 h-10 border-4 border-[#0093dd]/20 border-t-[#0093dd] rounded-full animate-spin mx-auto" />
										<p className="text-sm text-slate-400 mt-4 font-medium">Memuat pemberitahuan...</p>
									</div>
								) : notifications.length === 0 ? (
									<div className="px-10 py-16 text-center">
										<div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
											<Bell className="w-10 h-10 text-slate-200" />
										</div>
										<h4 className="font-bold text-slate-800 mb-1">Cukup Tenang Di Sini</h4>
										<p className="text-sm text-slate-500 px-4">Belum ada notifikasi baru untuk saat ini.</p>
									</div>
								) : (
									<div className="divide-y divide-slate-50">
										{notifications.map((notification) => (
											<motion.div
												key={notification.id}
												whileTap={{ scale: 0.98 }}
												className={`p-5 flex gap-4 transition-colors ${
													!notification.is_read
														? "bg-[#0093dd]/[0.02]"
														: "hover:bg-slate-50"
												}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className="relative flex-shrink-0">
													<div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
														!notification.is_read ? "bg-[#0093dd]/20 shadow-[0_4px_12px_rgba(0,147,221,0.2)]" : "bg-slate-100"
													}`}>
														<Bell className={`w-6 h-6 ${!notification.is_read ? "text-[#0093dd]" : "text-slate-400"}`} />
													</div>
													{!notification.is_read && (
														<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
													)}
												</div>

												<div className="flex-1 min-w-0">
													<div className="flex justify-between items-start mb-1">
														<span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
															<Clock className="w-3 h-3" />
															{moment(notification.created_at).fromNow()}
														</span>
													</div>
													
													<h4 className={`text-[13px] leading-snug mb-1 ${!notification.is_read ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
														{notification.title}
													</h4>
													<p className="text-xs text-slate-500 line-clamp-2">
														{notification.message}
													</p>
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

export default NotificationBellMobile;
