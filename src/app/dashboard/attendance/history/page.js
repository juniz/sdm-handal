"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
	Clock,
	Calendar,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Search,
	ChevronDown,
	ChevronUp,
	X,
} from "lucide-react";

const StatusBadge = ({ status, keterlambatan }) => {
	const getStatusConfig = (status) => {
		switch (status?.toLowerCase()) {
			case "tepat waktu":
				return {
					icon: CheckCircle2,
					bgColor: "bg-green-50",
					textColor: "text-green-600",
					borderColor: "border-green-200",
				};
			case "terlambat toleransi":
			case "terlambat i":
				return {
					icon: AlertCircle,
					bgColor: "bg-yellow-50",
					textColor: "text-yellow-600",
					borderColor: "border-yellow-200",
				};
			case "terlambat ii":
				return {
					icon: XCircle,
					bgColor: "bg-red-50",
					textColor: "text-red-600",
					borderColor: "border-red-200",
				};
			default:
				return {
					icon: Clock,
					bgColor: "bg-gray-50",
					textColor: "text-gray-600",
					borderColor: "border-gray-200",
				};
		}
	};

	const config = getStatusConfig(status);
	const Icon = config.icon;

	return (
		<div
			className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
		>
			<Icon className="w-4 h-4" />
			<span className="text-sm font-medium">{status}</span>
			{keterlambatan && keterlambatan !== "0" && (
				<span className="text-xs">({keterlambatan} menit)</span>
			)}
		</div>
	);
};

const getPhotoUrl = (photoPath) => {
	if (!photoPath) return null;

	// Jika photoPath sudah berupa URL lengkap
	if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
		return photoPath;
	}

	// Jika menggunakan BASE_IMAGE_URL dari environment
	const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL;
	if (baseUrl) {
		return `${baseUrl}${photoPath}`;
	}

	// Jika tidak ada BASE_IMAGE_URL, gunakan path relatif
	return photoPath;
};

const PhotoModal = ({ isOpen, onClose, photoUrl, name }) => {
	if (!isOpen) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="relative max-w-lg w-full bg-white rounded-xl p-1 overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
				<div className="relative w-full aspect-square">
					<Image
						src={photoUrl || "/default-avatar.png"}
						alt={name}
						fill
						className="object-cover rounded-lg"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						priority
					/>
				</div>
				<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
					<p className="text-white font-medium truncate">{name}</p>
				</div>
			</motion.div>
		</motion.div>
	);
};

const AttendanceCard = ({ attendance }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

	const formatTime = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleTimeString("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-white rounded-xl p-4 shadow-sm"
			>
				<div className="flex items-start gap-4">
					<div
						className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
						onClick={(e) => {
							e.stopPropagation();
							setIsPhotoModalOpen(true);
						}}
					>
						<Image
							src={attendance.photo || "/default-avatar.png"}
							alt={attendance.nama}
							fill
							className="rounded-full object-cover"
							sizes="(max-width: 768px) 40px, 48px"
						/>
					</div>
					<div
						className="flex-1 min-w-0 cursor-pointer"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold truncate">{attendance.nama}</h3>
								<p className="text-sm text-gray-500 truncate">
									{attendance.nik}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<StatusBadge
									status={attendance.status}
									keterlambatan={attendance.keterlambatan}
								/>
								{isExpanded ? (
									<ChevronUp className="w-5 h-5 text-gray-400" />
								) : (
									<ChevronDown className="w-5 h-5 text-gray-400" />
								)}
							</div>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="overflow-hidden"
						>
							<div className="mt-4 pt-4 border-t">
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
									<div>
										<p className="text-sm text-gray-500 flex items-center gap-1">
											<Clock className="w-4 h-4" />
											Jam Datang
										</p>
										<p className="font-medium">
											{formatTime(attendance.jam_datang)}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500 flex items-center gap-1">
											<Clock className="w-4 h-4" />
											Jam Pulang
										</p>
										<p className="font-medium">
											{formatTime(attendance.jam_pulang) || "-"}
										</p>
									</div>
									<div className="col-span-2 sm:col-span-1">
										<p className="text-sm text-gray-500 flex items-center gap-1">
											<Calendar className="w-4 h-4" />
											Shift
										</p>
										<p className="font-medium">{attendance.shift}</p>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			<PhotoModal
				isOpen={isPhotoModalOpen}
				onClose={() => setIsPhotoModalOpen(false)}
				photoUrl={attendance.photo}
				name={attendance.nama}
			/>
		</>
	);
};

const StatCard = ({ label, value, color }) => (
	<div
		className={`bg-${color}-50 p-3 sm:p-4 rounded-lg border border-${color}-100`}
	>
		<p className={`text-${color}-600 text-sm`}>{label}</p>
		<p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
	</div>
);

export default function AttendanceHistoryPage() {
	const [attendances, setAttendances] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("semua");

	useEffect(() => {
		const fetchAttendances = async () => {
			try {
				const response = await fetch("/api/attendance/history");
				const data = await response.json();

				if (data.error) {
					throw new Error(data.error);
				}

				setAttendances(data.data);
			} catch (error) {
				console.error("Error fetching attendances:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchAttendances();
	}, []);

	const filteredAttendances = attendances.filter((attendance) => {
		const matchSearch =
			attendance.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attendance.nik.toLowerCase().includes(searchTerm.toLowerCase());

		const matchStatus =
			filterStatus === "semua" ||
			attendance.status.toLowerCase() === filterStatus.toLowerCase();

		return matchSearch && matchStatus;
	});

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const stats = [
		{
			label: "Total Pegawai",
			value: attendances.length,
			color: "blue",
		},
		{
			label: "Tepat Waktu",
			value: attendances.filter((a) => a.status === "Tepat Waktu").length,
			color: "green",
		},
		{
			label: "Terlambat",
			value: attendances.filter((a) =>
				a.status.toLowerCase().includes("terlambat")
			).length,
			color: "yellow",
		},
		{
			label: "Belum Presensi",
			value: "-",
			color: "gray",
		},
	];

	return (
		<div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
			<div className="mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
					Riwayat Presensi Departemen
				</h1>
				<p className="text-sm sm:text-base text-gray-500">
					Data presensi hari ini untuk departemen Anda
				</p>
			</div>

			{/* Summary Cards - Shown at top for mobile */}
			<div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 sm:hidden">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			{/* Filter dan Search */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
						type="text"
						placeholder="Cari nama atau NIK..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
					/>
				</div>
				<div className="relative">
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="w-full px-4 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
					>
						<option value="semua">Semua Status</option>
						<option value="tepat waktu">Tepat Waktu</option>
						<option value="terlambat toleransi">Terlambat Toleransi</option>
						<option value="terlambat i">Terlambat I</option>
						<option value="terlambat ii">Terlambat II</option>
					</select>
					<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
				</div>
			</div>

			{/* Daftar Presensi */}
			<div className="space-y-3 sm:space-y-4">
				{filteredAttendances.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-500">Tidak ada data presensi</p>
					</div>
				) : (
					filteredAttendances.map((attendance) => (
						<AttendanceCard key={attendance.id} attendance={attendance} />
					))
				)}
			</div>

			{/* Summary Cards - Hidden on mobile, shown on desktop */}
			<div className="mt-8 hidden sm:grid grid-cols-4 gap-4">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>
		</div>
	);
}
