import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";

const useNotifications = () => {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const { user } = useUser();

	// Fetch notifications
	const fetchNotifications = useCallback(
		async (unreadOnly = false, limit = 10) => {
			// Hanya fetch jika user adalah departemen IT
			if (!user || user.departemen !== "IT") {
				setNotifications([]);
				setUnreadCount(0);
				return;
			}
			setLoading(true);
			try {
				const params = new URLSearchParams({
					limit: limit.toString(),
					unread_only: unreadOnly.toString(),
				});

				const response = await fetch(
					`/api/notifications/assignments?${params}`
				);
				const data = await response.json();

				if (data.status === "success") {
					setNotifications(data.data.notifications);
					setUnreadCount(data.data.unread_count);
				} else {
					console.error("Error fetching notifications:", data.error);
				}
			} catch (error) {
				console.error("Error fetching notifications:", error);
			} finally {
				setLoading(false);
			}
		},
		[user]
	);

	// Mark notification as read
	const markAsRead = async (assignmentId) => {
		// Hanya mark as read jika user adalah departemen IT
		if (!user || user.departemen !== "IT") {
			return { success: false, error: "Akses ditolak" };
		}

		try {
			const response = await fetch("/api/notifications/assignments", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					assignment_id: assignmentId,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				// Update local state
				setNotifications((prev) =>
					prev.map((notification) =>
						notification.assignment_id === assignmentId
							? { ...notification, is_read: true }
							: notification
					)
				);
				setUnreadCount((prev) => Math.max(0, prev - 1));
				return { success: true };
			} else {
				throw new Error(
					data.error || "Gagal menandai notifikasi sebagai sudah dibaca"
				);
			}
		} catch (error) {
			console.error("Error marking notification as read:", error);
			return { success: false, error: error.message };
		}
	};

	// Mark all notifications as read
	const markAllAsRead = async () => {
		// Hanya mark all read jika user adalah departemen IT
		if (!user || user.departemen !== "IT") {
			return { success: false, error: "Akses ditolak" };
		}

		try {
			const response = await fetch("/api/notifications/assignments", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					mark_all: true,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				// Update local state
				setNotifications((prev) =>
					prev.map((notification) => ({ ...notification, is_read: true }))
				);
				setUnreadCount(0);
				return { success: true };
			} else {
				throw new Error(
					data.error || "Gagal menandai semua notifikasi sebagai sudah dibaca"
				);
			}
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
			return { success: false, error: error.message };
		}
	};

	// Auto refresh notifications every 30 seconds
	useEffect(() => {
		// Initial fetch hanya jika user sudah terload
		if (user !== null) {
			fetchNotifications();

			// Set up auto refresh hanya jika user adalah departemen IT
			if (user && user.departemen === "IT") {
				const interval = setInterval(() => {
					fetchNotifications();
				}, 30000); // 30 seconds

				return () => clearInterval(interval);
			}
		}
	}, [fetchNotifications, user]);

	return {
		notifications,
		unreadCount,
		loading,
		fetchNotifications,
		markAsRead,
		markAllAsRead,
	};
};

export default useNotifications;
