"use client";
 
import { useState, useEffect } from "react";
import { fetchSdmProfile } from "@/lib/attendance-gql-client";
 
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
 
				// Gunakan GraphQL client untuk mendapatkan data user
				const sdmProfile = await fetchSdmProfile();
 
				if (!sdmProfile) {
					throw new Error("Data user tidak ditemukan");
				}
 
				// Format tanggal lahir jika ada
				let formattedDate = "";
				if (sdmProfile.tgl_lahir) {
					formattedDate = new Date(sdmProfile.tgl_lahir).toLocaleDateString(
						"id-ID",
						{
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						}
					);
				}
 
				setUser({
					...sdmProfile,
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
