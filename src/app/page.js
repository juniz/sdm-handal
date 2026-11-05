"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRound, KeyRound, ShieldCheck, ActivitySquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import {
	setClientToken,
	getClientToken,
	forceRestoreFromBackup,
	removeClientToken,
} from "@/lib/client-auth";
import Image from "next/image";

export default function LoginPage() {
	const [formData, setFormData] = useState({
		nip: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [mounted, setMounted] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState("");
	const [turnstileError, setTurnstileError] = useState(false);
	const PROD_SITE_KEY = "0x4AAAAAABnQ7KZ335kF5jw7";
	const FALLBACK_DEV_KEY = "1x00000000000000000000AA";
	const resolveProdKey = (k) => (!k || typeof k !== "string" || k === FALLBACK_DEV_KEY || /^[123]x00000/.test(k) ? PROD_SITE_KEY : k);
	const [siteKey, setSiteKey] = useState(() => resolveProdKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || FALLBACK_DEV_KEY));
	const turnstileContainerRef = useRef(null);
	const turnstileWidgetIdRef = useRef(null);

	const renderTurnstile = (overrideKey) => {
		if (typeof window === "undefined" || !window.turnstile || !turnstileContainerRef.current) {
			return;
		}
		if (turnstileWidgetIdRef.current !== null) {
			return;
		}

		const validOverride = typeof overrideKey === "string" && overrideKey ? overrideKey : null;
		const key = resolveProdKey(validOverride || siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
		if (!key) return;

		try {
			// shortcut: disable auto-retry so failed PoW/CSP never loops in background on low-RAM PCs
			turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
				sitekey: key,
				retry: "never",
				"refresh-expired": "manual",
				callback: (token) => {
					setTurnstileError(false);
					setTurnstileToken(token);
				},
				"expired-callback": () => {
					setTurnstileToken("");
					setTurnstileError(true);
				},
				"error-callback": () => {
					setTurnstileToken("");
					setTurnstileError(true);
					return false;
				},
				theme: "light",
			});
		} catch (err) {
			console.warn("Turnstile render error:", err);
		}
	};

	const resetTurnstile = () => {
		setTurnstileError(false);
		setTurnstileToken("");
		if (typeof window !== "undefined" && window.turnstile && turnstileWidgetIdRef.current !== null) {
			try {
				window.turnstile.reset(turnstileWidgetIdRef.current);
			} catch (err) {
				console.warn("Turnstile reset error:", err);
			}
		}
	};

	// Delay rendering of animation classes to avoid hydration mismatch, and auth checks
	useEffect(() => {
		setMounted(true);

		// Parse query parameters
		const params = new URLSearchParams(window.location.search);
		const errorParam = params.get("error");
		if (errorParam) {
			// If there is an authentication error, clear all client-side tokens to prevent redirection loops
			if (errorParam === "session_expired" || errorParam === "invalid_token" || errorParam === "server_error") {
				removeClientToken();
				if (errorParam === "session_expired") {
					setError("Sesi Anda telah berakhir. Silakan masuk kembali.");
				} else if (errorParam === "invalid_token") {
					setError("Token keamanan tidak valid. Silakan masuk kembali.");
				} else {
					setError("Terjadi kesalahan pada server. Silakan masuk kembali.");
				}
				// Clean URL to avoid repeating on manual reload
				window.history.replaceState({}, document.title, "/");
				return;
			}
		}

		const checkExistingAuth = async () => {
			const existingToken = getClientToken();
			if (existingToken) {
				window.location.href = "/dashboard";
				return;
			}
			try {
				const restored = forceRestoreFromBackup();
				if (restored) {
					setTimeout(() => {
						window.location.href = "/dashboard";
					}, 500);
				}
			} catch (error) {
				console.warn("Failed to restore token from backup:", error);
			}
		};
		checkExistingAuth();

		fetch("/api/auth/turnstile-config")
			.then((res) => res.json())
			.then((data) => {
				if (data?.siteKey && data.siteKey !== siteKey) {
					if (typeof window !== "undefined" && window.turnstile && turnstileWidgetIdRef.current !== null) {
						try {
							window.turnstile.remove(turnstileWidgetIdRef.current);
						} catch (_) {}
						turnstileWidgetIdRef.current = null;
					}
					setSiteKey(data.siteKey);
				}
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!mounted) return;
		renderTurnstile(siteKey);
	}, [mounted, siteKey]);

	useEffect(() => {
		return () => {
			if (typeof window !== "undefined" && window.turnstile && turnstileWidgetIdRef.current !== null) {
				try {
					window.turnstile.remove(turnstileWidgetIdRef.current);
				} catch (err) {
					console.warn("Turnstile cleanup error:", err);
				}
				turnstileWidgetIdRef.current = null;
			}
		};
	}, []);

	const handleNipChange = (e) => {
		const raw = e.target.value;
		const sanitized = raw.replace(/[<>'";\x00-\x1F\x7F]/g, "").slice(0, 50);
		setFormData((prev) => ({ ...prev, nip: sanitized }));
	};

	const handlePasswordChange = (e) => {
		const raw = e.target.value;
		const capped = raw.slice(0, 200);
		setFormData((prev) => ({ ...prev, password: capped }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.nip || !formData.password || !turnstileToken) {
			return;
		}
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nip: formData.nip,
					password: formData.password,
					turnstileToken,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				resetTurnstile();
				throw new Error(data.message || "Login gagal");
			}

			if (data.token) {
				setClientToken(data.token);
			}

			window.location.href = "/dashboard";
		} catch (error) {
			resetTurnstile();
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted) return null; // Avoid layout shifting during auth check

	return (
		<>
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
				strategy="afterInteractive"
				onLoad={renderTurnstile}
			/>
			<div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden text-slate-800">
			
			{/* Left Side: Form Area (45%) */}
			<div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12 md:py-16 relative z-10 bg-white">
				
				<div className="w-full max-w-sm mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
					
					{/* Header section */}
					<div className="space-y-4">
						{process.env.NEXT_PUBLIC_APP_LOGO === "true" && (
							<div className="w-16 h-16 relative mb-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center p-2">
								<Image
									src={process.env.NEXT_PUBLIC_APP_LOGO_PATH || "/logo.png"}
									alt="App Logo"
									fill
									className="object-contain p-1"
								/>
							</div>
						)}
						<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15]">
							Selamat datang kembali
						</h1>
						<p className="text-slate-500 text-base">
							Silakan masuk untuk melanjutkan ke {process.env.NEXT_PUBLIC_APP_NAME}.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="bg-red-50/80 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
								<svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p className="text-sm font-medium leading-relaxed">{error}</p>
							</div>
						)}

						<div className="space-y-5">
							<div className="space-y-2 relative group">
								<label htmlFor="nip" className="text-sm font-medium text-slate-700 ml-1">
									Nomor Induk Pegawai
								</label>
								<div className="relative">
									<Input
										id="nip"
										type="text"
										placeholder="Masukkan NIP"
										value={formData.nip}
										onChange={handleNipChange}
										maxLength={50}
										className="pl-12 h-14 bg-slate-50 border-slate-200 text-base focus:bg-white focus:border-[#0093dd] focus:ring-[#0093dd]/20 transition-all rounded-xl"
										disabled={loading}
									/>
									<UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0093dd] h-5 w-5 transition-colors" />
								</div>
							</div>

							<div className="space-y-2 relative group">
								<label htmlFor="password" className="text-sm font-medium text-slate-700 ml-1">
									Password
								</label>
								<div className="relative">
									<Input
										id="password"
										type="password"
										placeholder="Masukkan password"
										value={formData.password}
										onChange={handlePasswordChange}
										maxLength={200}
										className="pl-12 h-14 bg-slate-50 border-slate-200 text-base focus:bg-white focus:border-[#0093dd] focus:ring-[#0093dd]/20 transition-all rounded-xl"
										disabled={loading}
									/>
									<KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0093dd] h-5 w-5 transition-colors" />
								</div>
							</div>
						</div>

						{/* Turnstile Widget */}
						<div className="flex flex-col items-center justify-center my-2 min-h-[65px] gap-2">
							<div ref={turnstileContainerRef} />
							{turnstileError && (
								<button
									type="button"
									onClick={resetTurnstile}
									className="text-xs font-medium text-[#0093dd] hover:underline"
								>
									Muat ulang verifikasi keamanan
								</button>
							)}
						</div>

						<Button
							type="submit"
							className="w-full h-14 text-base font-semibold bg-[#0093dd] hover:bg-[#0082c4] text-white rounded-xl transition-all duration-300 shadow-lg shadow-[#0093dd]/20 hover:shadow-[#0093dd]/40 hover:-translate-y-0.5 active:translate-y-0"
							disabled={loading || !formData.nip || !formData.password || !turnstileToken}
						>
							{loading ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									<span>Verifikasi...</span>
								</div>
							) : (
								"Login"
							)}
						</Button>
					</form>

					<div className="pt-8 border-t border-slate-100 flex items-center justify-between">
						<p className="text-sm text-slate-400 font-medium tracking-wide">
							© {new Date().getFullYear()} IT {process.env.NEXT_PUBLIC_SATKER_NAME}
						</p>
					</div>
				</div>
			</div>

			{/* Right Side: Decorative Healthcare Aesthetic (55%) */}
			<div className="hidden md:flex flex-1 relative bg-slate-50 items-center justify-center p-12 lg:p-24 overflow-hidden border-l border-slate-100">
				
				{/* Background Gradients & Soft Shapes */}
				<div className="absolute inset-0 bg-gradient-to-br from-[#0093dd]/[0.03] to-[#0093dd]/[0.08]" />
				<div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#0093dd]/10 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#48cae4]/10 rounded-full blur-3xl pointer-events-none" />
				
				{/* Floating Elements (Subtle Grid) */}
				<div className="absolute inset-0 bg-[linear-gradient(rgba(0,147,221,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,147,221,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

				{/* Center Floating Card Focus Context */}
				<div className="relative z-10 w-full max-w-lg bg-white/95 border border-white p-10 lg:p-14 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,147,221,0.1)]">
					
					{/* Feature Badges Container */}
					<div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
						<div className="bg-[#0093dd]/10 p-2.5 rounded-xl text-[#0093dd]">
							<ShieldCheck size={24} strokeWidth={2} />
						</div>
						<div className="pr-2">
							<p className="text-xs text-slate-500 font-medium">Keamanan</p>
							<p className="text-sm font-bold text-slate-800">Terenskripsi</p>
						</div>
					</div>

					<div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
						<div className="bg-[#0093dd]/10 p-2.5 rounded-xl text-[#0093dd]">
							<ActivitySquare size={24} strokeWidth={2} />
						</div>
						<div className="pr-2">
							<p className="text-xs text-slate-500 font-medium">Status Server</p>
							<p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-emerald-500"></span>
								Online
							</p>
						</div>
					</div>

					<h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
						Sistem Terpadu <br className="hidden lg:block"/>
						<span className="text-[#0093dd]">Pengelolaan SDM</span>
					</h2>
					<p className="text-lg text-slate-600 leading-relaxed mb-8">
						Meningkatkan efisiensi pelayanan kepegawaian institusi melalui platform digital yang responsif, aman, dan dapat diandalkan.
					</p>

					<div className="flex gap-3">
						<div className="w-12 h-1.5 bg-[#0093dd] rounded-full" />
						<div className="w-3 h-1.5 bg-[#0093dd]/20 rounded-full" />
						<div className="w-3 h-1.5 bg-[#0093dd]/20 rounded-full" />
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
