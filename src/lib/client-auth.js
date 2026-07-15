import Cookies from "js-cookie";

// Deteksi PWA mode
export function isPWAMode() {
	if (typeof window === "undefined") return false;

	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		window.navigator.standalone ||
		document.referrer.includes("android-app://") ||
		window.location.search.includes("utm_source=pwa")
	);
}

// Fungsi untuk mengecek apakah JWT sudah expired secara waktu (client-side check)
export function isTokenExpired(token) {
	if (!token) return true;
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return true;
		
		// Decode payload (bagian kedua JWT)
		const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
		if (payload && typeof payload.exp === "number") {
			const now = Math.floor(Date.now() / 1000);
			return payload.exp < now;
		}
		return false;
	} catch (e) {
		console.warn("Failed to check token expiry on client:", e);
		return true; // Anggap token rusak sebagai expired
	}
}

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

			// Tambahan untuk PWA
			if (isPWAMode()) {
				localStorage.setItem("auth_token_pwa", token);
				localStorage.setItem("auth_pwa_timestamp", Date.now().toString());
				console.log("Token saved with PWA persistence");
			}
		} catch (error) {
			console.warn("Failed to save token to localStorage:", error);
		}
	}
}

// Fungsi untuk mengambil token dari client-side
export function getClientToken() {
	if (typeof window === "undefined") return null;

	try {
		// Coba ambil dari cookie dulu
		const cookieToken = Cookies.get("auth_token");

		if (cookieToken) {
			if (isTokenExpired(cookieToken)) {
				console.log("Cookie token is expired, clearing");
				removeClientToken();
				return null;
			}
			return cookieToken;
		}

		// Jika tidak ada di cookie, coba ambil dari localStorage (fallback untuk Android)
		console.log("No cookie token, trying localStorage fallback");

		const backupToken = localStorage.getItem("auth_token_backup");
		const timestamp = localStorage.getItem("auth_token_timestamp");

		// Cek PWA token jika mode PWA
		let pwaToken = null;
		let pwaTimestamp = null;

		if (isPWAMode()) {
			pwaToken = localStorage.getItem("auth_token_pwa");
			pwaTimestamp = localStorage.getItem("auth_pwa_timestamp");
		}

		// Pilih token yang paling baru
		let selectedToken = backupToken;
		let selectedTimestamp = timestamp;

		if (pwaToken && pwaTimestamp) {
			const backupTime = timestamp ? parseInt(timestamp) : 0;
			const pwaTime = parseInt(pwaTimestamp);

			if (pwaTime > backupTime) {
				selectedToken = pwaToken;
				selectedTimestamp = pwaTimestamp;
				console.log("Using PWA token (newer)");
			}
		}

		if (selectedToken && selectedTimestamp) {
			const tokenAge = Date.now() - parseInt(selectedTimestamp);
			const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 hari

			if (tokenAge < maxAge && !isTokenExpired(selectedToken)) {
				console.log(
					"Using backup token, age:",
					Math.round(tokenAge / 1000 / 60),
					"minutes"
				);

				// Restore ke cookie juga
				Cookies.set("auth_token", selectedToken, {
					expires: 7,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
				});

				return selectedToken;
			} else {
				console.log("Backup token expired or invalid, clearing");
				// Hapus token yang expired
				removeClientToken();
			}
		}

		return null;
	} catch (error) {
		console.warn("Failed to retrieve token from localStorage:", error);
		return null;
	}
}

// Fungsi untuk menghapus token dari client-side
export function removeClientToken() {
	// Hapus dari cookie
	Cookies.remove("auth_token", { path: "/" });

	// Hapus dari localStorage
	if (typeof window !== "undefined") {
		try {
			localStorage.removeItem("auth_token_backup");
			localStorage.removeItem("auth_token_timestamp");
			localStorage.removeItem("auth_token_pwa");
			localStorage.removeItem("auth_pwa_timestamp");
			localStorage.removeItem("auth_last_active");
		} catch (error) {
			console.warn("Failed to remove token from localStorage:", error);
		}
	}
}

// Fungsi untuk sync token across tabs/windows
export function syncTokenAcrossTabs() {
	if (typeof window === "undefined") return;

	const handleStorageChange = (event) => {
		if (event.key === "auth_token_backup" || event.key === "auth_token_pwa") {
			console.log("Token changed in another tab/window");
			// Reload page untuk sync state
			window.location.reload();
		}
	};

	window.addEventListener("storage", handleStorageChange);

	return () => {
		window.removeEventListener("storage", handleStorageChange);
	};
}

// Fungsi untuk force refresh token dari backup
export function forceRestoreFromBackup() {
	if (typeof window === "undefined") return false;

	try {
		const backupToken = localStorage.getItem("auth_token_backup");
		const pwaToken = localStorage.getItem("auth_token_pwa");
		const backupTimestamp = localStorage.getItem("auth_token_timestamp");
		const pwaTimestamp = localStorage.getItem("auth_pwa_timestamp");

		// Pilih token yang paling baru
		let selectedToken = backupToken;
		let selectedTimestamp = backupTimestamp;

		if (pwaToken && pwaTimestamp && backupTimestamp) {
			if (parseInt(pwaTimestamp) > parseInt(backupTimestamp)) {
				selectedToken = pwaToken;
				selectedTimestamp = pwaTimestamp;
			}
		} else if (pwaToken && pwaTimestamp) {
			selectedToken = pwaToken;
			selectedTimestamp = pwaTimestamp;
		}

		if (selectedToken && selectedTimestamp) {
			const tokenAge = Date.now() - parseInt(selectedTimestamp);
			const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 hari

			if (tokenAge < maxAge && !isTokenExpired(selectedToken)) {
				console.log("Force restoring token from backup");
				setClientToken(selectedToken);
				return true;
			} else {
				console.log("Force restore found expired or invalid token, clearing");
				removeClientToken();
			}
		}

		return false;
	} catch (error) {
		console.warn("Failed to force restore token:", error);
		return false;
	}
}
