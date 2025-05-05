"use client";

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export function useUser() {
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				// Cek apakah kode berjalan di browser
				if (typeof window === "undefined") {
					return;
				}

				// Gunakan API endpoint untuk mendapatkan data user
				const response = await fetch("/api/auth/user");
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Gagal mengambil data user");
				}

				if (!data.user) {
					throw new Error("Data user tidak ditemukan");
				}

				// Format tanggal lahir jika ada
				let formattedDate = "";
				if (data.user.tgl_lahir) {
					formattedDate = new Date(data.user.tgl_lahir).toLocaleDateString(
						"id-ID",
						{
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						}
					);
				}

				setUser({
					...data.user,
					formattedBirthDate: formattedDate,
				});
				setError(null);
			} catch (error) {
				console.error("Error fetching user:", error);
				setError(error.message || "Gagal mengambil data user");
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUser();
	}, []);

	return {
		user,
		error,
		isLoading,
	};
}
