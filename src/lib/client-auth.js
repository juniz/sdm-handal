import Cookies from "js-cookie";

// Fungsi untuk menyimpan token di client-side
export function setClientToken(token) {
	Cookies.set("auth_token", token, {
		expires: 7, // 7 hari
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
	});
}

// Fungsi untuk mendapatkan token dari client-side
export function getClientToken() {
	return Cookies.get("auth_token");
}

// Fungsi untuk menghapus token dari client-side
export function removeClientToken() {
	Cookies.remove("auth_token", {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});
}
