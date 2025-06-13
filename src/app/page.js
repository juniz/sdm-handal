"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRound, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { setClientToken, getClientToken } from "@/lib/client-auth";
import Image from "next/image";

export default function LoginPage() {
	const [formData, setFormData] = useState({
		nip: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Cek apakah user sudah login saat component mount
	useEffect(() => {
		const checkExistingAuth = () => {
			const existingToken = getClientToken();
			if (existingToken) {
				console.log("Existing token found, redirecting to dashboard");
				window.location.href = "/dashboard";
			}
		};

		checkExistingAuth();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			console.log("Mengirim request login...");
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();
			console.log("Response login:", data);

			if (!response.ok) {
				throw new Error(data.message || "Login gagal");
			}

			// Simpan token di client-side (sudah include localStorage backup)
			const cookies = response.headers.get("set-cookie");
			if (cookies) {
				const tokenMatch = cookies.match(/auth_token=([^;]+)/);
				if (tokenMatch) {
					setClientToken(tokenMatch[1]);
				}
			}

			// Redirect ke dashboard jika berhasil
			window.location.href = "/dashboard";
		} catch (error) {
			console.error("Error login:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-white p-4 relative overflow-hidden">
			{/* Decorative Elements */}
			{/* <div className="absolute top-0 left-0 w-full h-64 bg-blue-500 rounded-b-[100px] opacity-10 transform -skew-y-6"></div>
			<div className="absolute bottom-0 right-0 w-full h-64 bg-blue-600 rounded-t-[100px] opacity-10 transform skew-y-6"></div> */}

			<div className="w-full max-w-md z-10">
				{/* Logo dan Header */}
				<div className="flex flex-col items-center mb-8">
					<div className="w-24 h-24 relative mb-4">
						<Image
							src="/logo.png"
							alt="SDM Handal Logo"
							width={96}
							height={96}
							className="drop-shadow-xl"
						/>
					</div>
					<h1 className="text-3xl font-bold text-blue-800 mb-2">SDM Handal</h1>
					<p className="text-blue-600 text-center max-w-xs">
						Sistem Informasi Manajemen SDM Terintegrasi
					</p>
				</div>

				<Card className="w-full backdrop-blur-md bg-white/80 border-0 shadow-2xl">
					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-6 pt-6">
							{error && (
								<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
									<div className="flex">
										<div className="flex-shrink-0">
											<svg
												className="h-5 w-5 text-red-400"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
										<div className="ml-3">
											<p className="text-sm text-red-700">{error}</p>
										</div>
									</div>
								</div>
							)}

							<div className="space-y-2">
								<div className="relative">
									<Input
										id="nip"
										type="text"
										placeholder="Masukkan NIP"
										value={formData.nip}
										onChange={(e) =>
											setFormData({ ...formData, nip: e.target.value })
										}
										className="pl-12 h-12 text-lg bg-white/50 focus:bg-white transition-colors"
										disabled={loading}
									/>
									<UserRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
								</div>
							</div>

							<div className="space-y-2">
								<div className="relative">
									<Input
										id="password"
										type="password"
										placeholder="Masukkan Password"
										value={formData.password}
										onChange={(e) =>
											setFormData({ ...formData, password: e.target.value })
										}
										className="pl-12 h-12 text-lg bg-white/50 focus:bg-white transition-colors"
										disabled={loading}
									/>
									<KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
								</div>
							</div>

							<Button
								type="submit"
								className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
								disabled={loading}
							>
								{loading ? (
									<div className="flex items-center justify-center">
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										<span>Memproses...</span>
									</div>
								) : (
									"Masuk"
								)}
							</Button>
						</CardContent>
					</form>
				</Card>

				{/* Footer */}
				<p className="text-center text-sm text-blue-600/80 mt-6">
					© {new Date().getFullYear()} IT Bhayangkara Nganjuk.
				</p>
			</div>
		</div>
	);
}
