import Cookies from "js-cookie";

// Fungsi untuk menyimpan token di client-side
export function setClientToken(token) {
	// Simpan di cookie
	Cookies.set("auth_token", token, {
		expires: 7, // 7 hari
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax", // Ubah dari "strict" ke "lax" untuk Android compatibility
		path: "/",
	});

	// Backup di localStorage untuk Android PWA persistence
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem("auth_token_backup", token);
			localStorage.setItem("auth_token_timestamp", Date.now().toString());
		} catch (error) {
			console.warn("Failed to save token to localStorage:", error);
		}
	}
}

// Fungsi untuk mendapatkan token dari client-side
export function getClientToken() {
	// Coba ambil dari cookie terlebih dahulu
	let token = Cookies.get("auth_token");

	// Jika tidak ada di cookie, coba ambil dari localStorage (fallback untuk Android)
	if (!token && typeof window !== "undefined") {
		try {
			const backupToken = localStorage.getItem("auth_token_backup");
			const timestamp = localStorage.getItem("auth_token_timestamp");

			// Cek apakah backup token masih valid (tidak lebih dari 7 hari)
			if (backupToken && timestamp) {
				const tokenAge = Date.now() - parseInt(timestamp);
				const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 hari dalam milliseconds

				if (tokenAge < maxAge) {
					// Restore token ke cookie
					Cookies.set("auth_token", backupToken, {
						expires: 7,
						secure: process.env.NODE_ENV === "production",
						sameSite: "lax",
						path: "/",
					});
					token = backupToken;
				} else {
					// Token backup sudah expired, hapus
					localStorage.removeItem("auth_token_backup");
					localStorage.removeItem("auth_token_timestamp");
				}
			}
		} catch (error) {
			console.warn("Failed to retrieve token from localStorage:", error);
		}
	}

	return token;
}

// Fungsi untuk menghapus token dari client-side
export function removeClientToken() {
	// Hapus dari cookie
	Cookies.remove("auth_token", {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax", // Ubah dari "strict" ke "lax"
	});

	// Hapus dari localStorage
	if (typeof window !== "undefined") {
		try {
			localStorage.removeItem("auth_token_backup");
			localStorage.removeItem("auth_token_timestamp");
		} catch (error) {
			console.warn("Failed to remove token from localStorage:", error);
		}
	}
}
