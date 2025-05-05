"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
	MapPin,
	Mail,
	Phone,
	ArrowLeft,
	Building2,
	Calendar,
	Home,
	User,
	AlertCircle,
} from "lucide-react";
import { AttendanceStats } from "./AttendanceStats";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";

export function EmployeeCard() {
	const [showStats, setShowStats] = useState(false);
	const [imageError, setImageError] = useState(false);
	const { user, error, isLoading } = useUser();

	useEffect(() => {
		console.log("EmployeeCard state:", { user, error, isLoading });
	}, [user, error, isLoading]);

	if (isLoading) {
		return (
			<Card className="p-4 w-[360px]">
				<div className="flex items-center justify-center h-40">
					<div className="flex flex-col items-center gap-2">
						<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
						<p className="text-gray-500">Memuat data pegawai...</p>
					</div>
				</div>
			</Card>
		);
	}

	if (error) {
		console.error("EmployeeCard error:", error);
		return (
			<Card className="p-4 w-[360px]">
				<div className="flex items-center justify-center h-40">
					<div className="flex flex-col items-center gap-2 text-center">
						<AlertCircle className="w-8 h-8 text-red-500" />
						<p className="text-gray-500">{error}</p>
					</div>
				</div>
			</Card>
		);
	}

	if (!user) {
		console.warn("EmployeeCard: No user data available");
		return (
			<Card className="p-4 w-[360px]">
				<div className="flex items-center justify-center h-40">
					<div className="flex flex-col items-center gap-2 text-center">
						<AlertCircle className="w-8 h-8 text-yellow-500" />
						<p className="text-gray-500">Data pegawai tidak ditemukan</p>
					</div>
				</div>
			</Card>
		);
	}

	console.log("EmployeeCard rendering with user:", user);

	return (
		<div className="relative w-[360px]">
			<AnimatePresence mode="wait">
				{!showStats ? (
					<motion.div
						key="profile"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2 }}
					>
						<Card
							className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
							onClick={() => setShowStats(true)}
						>
							<div className="flex items-center gap-3">
								<div className="relative w-25 h-35 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
									{user.photo && !imageError ? (
										<Image
											src={user.photo}
											alt={user.nama}
											fill
											className="object-cover"
											onError={() => setImageError(true)}
											sizes="80px"
											priority
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center bg-blue-100">
											<User className="w-12 h-12 text-blue-400" />
										</div>
									)}
								</div>
								<div className="flex-1">
									<h3 className="text-md font-semibold">{user.nama}</h3>
									<p className="text-sm text-gray-500">{user.departemen}</p>
									<div className="mt-3 space-y-1.5">
										<div className="flex items-center text-sm text-gray-600">
											<Building2 className="w-4 h-4 mr-2" />
											<span>NIP: {user.username}</span>
										</div>
										<div className="flex items-center text-sm text-gray-600">
											<Calendar className="w-4 h-4 mr-2" />
											<span>
												{user.tmp_lahir}
												{user.formattedBirthDate &&
													`, ${user.formattedBirthDate}`}
											</span>
										</div>
										<div className="flex items-center text-sm text-gray-600">
											<Home className="w-4 h-4 mr-2" />
											<span className="line-clamp-1">{user.alamat}</span>
										</div>
									</div>
								</div>
							</div>
						</Card>
					</motion.div>
				) : (
					<motion.div
						key="stats"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						transition={{ duration: 0.2 }}
					>
						<Card className="relative">
							<button
								onClick={() => setShowStats(false)}
								className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
							>
								<ArrowLeft className="w-5 h-5 text-white" />
							</button>
							<AttendanceStats stats={user.stats} />
						</Card>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
