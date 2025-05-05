"use client";

import { useEffect, useState } from "react";

export function UserProfile() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchUser() {
			try {
				const response = await fetch("/api/auth/user");
				if (!response.ok) {
					throw new Error("Failed to fetch user");
				}
				const data = await response.json();
				setUser(data.user);
			} catch (error) {
				console.error("Error fetching user:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchUser();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center space-x-4">
				<div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
				<div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
			</div>
		);
	}

	if (!user) return null;

	// Fungsi untuk mendapatkan inisial dari nama
	const getInitials = (name) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	return (
		<div className="flex items-center space-x-4">
			<span className="text-sm text-gray-600">{user.nama}</span>
			<div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
				{getInitials(user.nama)}
			</div>
		</div>
	);
}
