import { useState, useEffect, useCallback } from "react";

const useNotifications = () => {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);

	// Fetch notifications
	const fetchNotifications = useCallback(
		async (unreadOnly = false, limit = 10) => {
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
		[]
	);

	// Mark notification as read
	const markAsRead = async (assignmentId) => {
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
		// Initial fetch
		fetchNotifications();

		// Set up auto refresh
		const interval = setInterval(() => {
			fetchNotifications();
		}, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, [fetchNotifications]);

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
