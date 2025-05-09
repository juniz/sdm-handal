"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getClientToken } from "@/lib/client-auth";

export default function NotFound() {
	const router = useRouter();

	const handleBack = () => {
		const token = getClientToken();
		if (token) {
			router.push("/dashboard");
		} else {
			router.push("/");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-white p-4">
			<div className="text-center">
				{/* Animasi angka 404 */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{
						type: "spring",
						stiffness: 260,
						damping: 20,
					}}
					className="flex justify-center gap-4 text-8xl font-bold text-blue-600 mb-8"
				>
					<motion.span
						animate={{
							y: [0, -20, 0],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
							times: [0, 0.5, 1],
						}}
					>
						4
					</motion.span>
					<motion.span
						animate={{
							rotate: [0, 360],
						}}
						transition={{
							duration: 4,
							repeat: Infinity,
							ease: "linear",
						}}
					>
						<RefreshCcw className="w-24 h-24 text-blue-500" />
					</motion.span>
					<motion.span
						animate={{
							y: [0, -20, 0],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
							times: [0, 0.5, 1],
							delay: 0.5,
						}}
					>
						4
					</motion.span>
				</motion.div>

				{/* Pesan error */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="space-y-4"
				>
					<h2 className="text-2xl font-semibold text-gray-800">
						Oops! Halaman Tidak Ditemukan
					</h2>
					<p className="text-gray-600 max-w-md mx-auto">
						Maaf, halaman yang Anda cari tidak dapat ditemukan.
					</p>

					{/* Tombol kembali */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1 }}
						className="mt-8"
					>
						<button
							onClick={handleBack}
							className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 hover:scale-105 transform"
						>
							<Home className="w-5 h-5" />
							<span>Kembali ke Beranda</span>
						</button>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}
