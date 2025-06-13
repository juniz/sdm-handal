"use client";

import { useEffect, useRef } from "react";
import { getClientToken, setClientToken } from "@/lib/client-auth";

export default function PWAHandler() {
	const keepAliveInterval = useRef(null);
	const visibilityTimeout = useRef(null);
	const lastActiveTime = useRef(Date.now());

	useEffect(() => {
		// Deteksi jika running sebagai PWA
		const isPWA =
			window.matchMedia("(display-mode: standalone)").matches ||
			window.navigator.standalone ||
			document.referrer.includes("android-app://");

		console.log("PWA Handler initialized, isPWA:", isPWA);

		// Service Worker message handler
		const handleSWMessage = (event) => {
			console.log("Received SW message:", event.data);

			if (event.data.type === "AUTH_SYNC") {
				// Sync auth state dari service worker
				const token = getClientToken();
				if (token && event.data.data) {
					console.log("Syncing auth state from SW");
				}
			}

			if (event.data.type === "CHECK_AUTH_STATE") {
				// Service worker meminta check auth state
				const token = getClientToken();
				console.log("SW requested auth check, token exists:", !!token);

				if (!token) {
					// Jika tidak ada token, coba restore dari backup
					restoreTokenFromBackup();
				}
			}

			if (event.data.type === "SESSION_KEEPALIVE") {
				// Keep session alive
				lastActiveTime.current = Date.now();
				console.log("Session keepalive from SW");
			}
		};

		// Register service worker message listener
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", handleSWMessage);
		}

		// Visibility change handler untuk Android PWA
		const handleVisibilityChange = () => {
			console.log("Visibility changed:", document.visibilityState);

			if (document.visibilityState === "visible") {
				// App kembali visible (resumed)
				console.log("App resumed, checking auth state");

				// Clear timeout jika ada
				if (visibilityTimeout.current) {
					clearTimeout(visibilityTimeout.current);
					visibilityTimeout.current = null;
				}

				// Check dan restore token jika perlu
				setTimeout(() => {
					checkAndRestoreAuth();
				}, 100);

				// Start keep alive
				startKeepAlive();
			} else if (document.visibilityState === "hidden") {
				// App menjadi hidden (minimized/background)
				console.log("App going to background");

				// Set timeout untuk backup token sebelum app benar-benar tertutup
				visibilityTimeout.current = setTimeout(() => {
					backupCurrentAuth();
				}, 1000);

				// Stop keep alive
				stopKeepAlive();
			}
		};

		// Page focus/blur handlers
		const handleFocus = () => {
			console.log("Window focused");
			lastActiveTime.current = Date.now();
			checkAndRestoreAuth();
			startKeepAlive();
		};

		const handleBlur = () => {
			console.log("Window blurred");
			backupCurrentAuth();
		};

		// Beforeunload handler untuk backup
		const handleBeforeUnload = () => {
			console.log("Before unload, backing up auth");
			backupCurrentAuth();
		};

		// Page show/hide handlers (untuk back/forward navigation)
		const handlePageShow = (event) => {
			console.log("Page show, persisted:", event.persisted);
			if (event.persisted) {
				// Page loaded from cache
				checkAndRestoreAuth();
			}
		};

		const handlePageHide = () => {
			console.log("Page hide, backing up auth");
			backupCurrentAuth();
		};

		// Register event listeners
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleFocus);
		window.addEventListener("blur", handleBlur);
		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("pageshow", handlePageShow);
		window.addEventListener("pagehide", handlePageHide);

		// Initial auth check
		checkAndRestoreAuth();

		// Start keep alive jika PWA
		if (isPWA) {
			startKeepAlive();
		}

		// Cleanup
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("pageshow", handlePageShow);
			window.removeEventListener("pagehide", handlePageHide);

			if ("serviceWorker" in navigator) {
				navigator.serviceWorker.removeEventListener("message", handleSWMessage);
			}

			stopKeepAlive();

			if (visibilityTimeout.current) {
				clearTimeout(visibilityTimeout.current);
			}
		};
	}, []);

	// Fungsi untuk backup auth state
	const backupCurrentAuth = () => {
		try {
			const token = getClientToken();
			if (token) {
				localStorage.setItem("auth_token_backup", token);
				localStorage.setItem("auth_token_timestamp", Date.now().toString());
				localStorage.setItem(
					"auth_last_active",
					lastActiveTime.current.toString()
				);
				console.log("Auth backed up to localStorage");

				// Notify service worker
				if (
					"serviceWorker" in navigator &&
					navigator.serviceWorker.controller
				) {
					navigator.serviceWorker.controller.postMessage({
						type: "SYNC_AUTH",
						authData: { token, timestamp: Date.now() },
					});
				}
			}
		} catch (error) {
			console.warn("Failed to backup auth:", error);
		}
	};

	// Fungsi untuk restore token dari backup
	const restoreTokenFromBackup = () => {
		try {
			const backupToken = localStorage.getItem("auth_token_backup");
			const timestamp = localStorage.getItem("auth_token_timestamp");
			const lastActive = localStorage.getItem("auth_last_active");

			if (backupToken && timestamp) {
				const tokenAge = Date.now() - parseInt(timestamp);
				const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 hari

				if (tokenAge < maxAge) {
					console.log(
						"Restoring token from backup, age:",
						Math.round(tokenAge / 1000 / 60),
						"minutes"
					);
					setClientToken(backupToken);

					// Update last active time
					if (lastActive) {
						lastActiveTime.current = parseInt(lastActive);
					}

					return true;
				} else {
					console.log("Backup token too old, clearing");
					localStorage.removeItem("auth_token_backup");
					localStorage.removeItem("auth_token_timestamp");
					localStorage.removeItem("auth_last_active");
				}
			}
		} catch (error) {
			console.warn("Failed to restore token from backup:", error);
		}
		return false;
	};

	// Fungsi untuk check dan restore auth
	const checkAndRestoreAuth = () => {
		const currentToken = getClientToken();

		if (!currentToken) {
			console.log("No current token, attempting restore");
			const restored = restoreTokenFromBackup();

			if (restored) {
				console.log("Token restored successfully");
				// Refresh page untuk update UI
				setTimeout(() => {
					window.location.reload();
				}, 500);
			} else {
				console.log("Could not restore token");
			}
		} else {
			console.log("Current token exists");
			// Backup current token
			backupCurrentAuth();
		}
	};

	// Keep alive mechanism
	const startKeepAlive = () => {
		if (keepAliveInterval.current) {
			clearInterval(keepAliveInterval.current);
		}

		keepAliveInterval.current = setInterval(() => {
			lastActiveTime.current = Date.now();

			// Ping service worker
			if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
				const channel = new MessageChannel();
				navigator.serviceWorker.controller.postMessage({ type: "KEEP_ALIVE" }, [
					channel.port2,
				]);
			}

			// Backup auth periodically
			backupCurrentAuth();

			console.log("Keep alive ping");
		}, 30000); // Setiap 30 detik
	};

	const stopKeepAlive = () => {
		if (keepAliveInterval.current) {
			clearInterval(keepAliveInterval.current);
			keepAliveInterval.current = null;
		}
	};

	// Component tidak render apa-apa, hanya handler
	return null;
}
