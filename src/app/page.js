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
import { useState } from "react";

export default function LoginPage() {
	const [formData, setFormData] = useState({
		nip: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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

			// Periksa cookie setelah login
			console.log("Cookies setelah login:", document.cookie);

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
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-white p-4">
			<Card className="w-full max-w-md animate-in slide-in-from-bottom duration-500 shadow-lg bg-white/70 backdrop-blur-sm">
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-bold text-center text-blue-800">
						SDM Handal
					</CardTitle>
					<CardDescription className="text-center text-blue-600">
						Masuk ke akun Anda untuk melanjutkan
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<label
								htmlFor="nip"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-700 flex items-center gap-2"
							>
								<UserRound className="h-4 w-4" />
								NIP
							</label>
							<div className="relative">
								<UserRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
								<Input
									id="nip"
									type="text"
									placeholder="Masukkan NIP Anda"
									value={formData.nip}
									onChange={(e) =>
										setFormData({ ...formData, nip: e.target.value })
									}
									className="animate-in fade-in duration-300 bg-white/50 focus:bg-white pl-10"
									disabled={loading}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="password"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-700 flex items-center gap-2"
							>
								<KeyRound className="h-4 w-4" />
								Password
							</label>
							<div className="relative">
								<KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
								<Input
									id="password"
									type="password"
									placeholder="Masukkan password Anda"
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									className="animate-in fade-in duration-300 bg-white/50 focus:bg-white pl-10"
									disabled={loading}
								/>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							className="w-full my-5 animate-in fade-in duration-500 hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700"
							disabled={loading}
						>
							{loading ? "Memproses..." : "Masuk"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
