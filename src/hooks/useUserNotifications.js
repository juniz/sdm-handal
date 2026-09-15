import { useState, useEffect, useCallback } from "react";

export function useUserNotifications() {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);

	const fetchNotifications = useCallback(async () => {
		try {
			const res = await fetch("/api/notifications?limit=20");
			if (!res.ok) return;
			const json = await res.json();
			if (json.status === "success" && json.data) {
				setNotifications(json.data.notifications || []);
				setUnreadCount(json.data.unread_count || 0);
			}
		} catch (err) {
			console.error("Failed to fetch user notifications:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setLoading(true);
		fetchNotifications();

		const interval = setInterval(fetchNotifications, 30000);
		const handleFocus = () => fetchNotifications();
		window.addEventListener("focus", handleFocus);

		return () => {
			clearInterval(interval);
			window.removeEventListener("focus", handleFocus);
		};
	}, [fetchNotifications]);

	const markAsRead = async (id) => {
		try {
			await fetch("/api/notifications/read", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			setNotifications((prev) => {
				const target = prev.find((n) => n.id === id);
				if (target && !target.is_read) {
					setUnreadCount((c) => Math.max(0, c - 1));
				}
				return prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
			});
		} catch (err) {
			console.error("Failed to mark notification as read:", err);
		}
	};

	const markAllAsRead = async () => {
		try {
			await fetch("/api/notifications/read", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ all: true }),
			});
			setNotifications((prev) =>
				prev.map((n) => ({ ...n, is_read: true }))
			);
			setUnreadCount(0);
		} catch (err) {
			console.error("Failed to mark all notifications as read:", err);
		}
	};

	return {
		notifications,
		unreadCount,
		loading,
		markAsRead,
		markAllAsRead,
		refetch: fetchNotifications,
	};
}

export default useUserNotifications;
