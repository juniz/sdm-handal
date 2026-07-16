"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Building2, Calendar, Home, User, Landmark, Check, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { fetchSdmAttendanceStats } from "@/lib/attendance-gql-client";
import { motion, useReducedMotion } from "framer-motion";

// Helper component to render a realistic vector barcode based on user's NIP
function Barcode({ value }) {
	const bars = useMemo(() => {
		const str = String(value || "1234567890");
		const elements = [];
		let currentX = 2;
		
		for (let i = 0; i < str.length; i++) {
			const num = parseInt(str[i], 10) || 1;
			const barWidth = (num % 3) + 1;
			elements.push(
				<rect key={`bar-${i}`} x={currentX} y={0} width={barWidth} height={20} fill="#1e293b" />
			);
			currentX += barWidth;
			const gapWidth = (num % 2) + 1;
			currentX += gapWidth;
		}
		
		return { elements, totalWidth: currentX + 2 };
	}, [value]);

	return (
		<div className="flex flex-col items-center gap-1 mt-auto w-full">
			<svg 
				className="h-8 text-slate-800 max-w-[180px] w-full opacity-80" 
				viewBox={`0 0 ${bars.totalWidth} 20`} 
				preserveAspectRatio="none"
			>
				{bars.elements}
			</svg>
			<span className="text-[9px] font-mono tracking-[0.2em] text-slate-400 font-semibold uppercase">
				* {value || "NIP"} *
			</span>
		</div>
	);
}

// DayStatus rendering for back of the card
const DayStatus = ({ day, status }) => {
	const statusConfig = useMemo(() => {
		switch (status) {
			case "hadir":
				return { icon: Check, color: "bg-green-500" };
			case "sakit":
				return { icon: AlertCircle, color: "bg-orange-400" };
			case "izin":
				return { icon: Clock, color: "bg-blue-500" };
			case "terlambat":
				return { icon: Clock, color: "bg-yellow-500" };
			default:
				return { icon: Clock, color: "bg-slate-200" };
		}
	}, [status]);

	const Icon = statusConfig.icon;

	return (
		<div className="flex flex-col items-center">
			<div className={`w-8 h-8 ${statusConfig.color} rounded-full flex items-center justify-center mb-1 shadow-sm`}>
				<Icon className="w-4 h-4 text-white stroke-[2.5]" />
			</div>
			<span className="text-[9px] font-bold text-slate-500 uppercase">{day}</span>
		</div>
	);
};

const StatBox = ({ label, value, bgColor = "bg-blue-50/50", textColor = "text-blue-600" }) => (
	<div className={`${bgColor} border border-slate-100 rounded-xl p-2.5 text-center`}>
		<p className={`text-base font-extrabold ${textColor} leading-none mb-1`}>{value}%</p>
		<p className={`text-[9px] font-bold ${textColor} uppercase tracking-wider`}>{label}</p>
	</div>
);

const daysMap = {
	Mon: "Sen",
	Tue: "Sel",
	Wed: "Rab",
	Thu: "Kam",
	Fri: "Jum",
};

export function EmployeeCard() {
	const shouldReduceMotion = useReducedMotion();
	const [imageError, setImageError] = useState(false);
	const [isFlipped, setIsFlipped] = useState(false);
	const [stats, setStats] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);
	
	const { user, error, isLoading } = useUser();

	useEffect(() => {
		if (!user) return;
		const loadStats = async () => {
			try {
				const data = await fetchSdmAttendanceStats();
				setStats(data);
			} catch (e) {
				console.error("Error loading sdm attendance stats:", e);
			} finally {
				setStatsLoading(false);
			}
		};
		loadStats();
	}, [user]);

	// Render Front Side (ID Card)
	const frontContent = useMemo(() => {
		if (!user) return null;

		return (
			<div className="relative w-full h-full flex flex-col items-center">
				{/* Top Blue Header Indicator */}
				<div className="absolute top-0 inset-x-0 h-2 bg-[#185FA5]" />

				{/* Hospital Identity Header */}
				<div className="w-full text-center mt-3 mb-5 px-4">
					<span className="inline-flex items-center gap-1 text-[#185FA5] text-[9px] font-extrabold tracking-[0.18em] uppercase">
						<Landmark className="w-2.5 h-2.5" />
						RS Bhayangkara Nganjuk
					</span>
					<h3 className="text-[10px] font-bold text-slate-500 tracking-[0.12em] uppercase mt-0.5">
						Kartu Identitas Pegawai
					</h3>
				</div>

				{/* Lanyard Hole Clip Graphic */}
				<div className="w-12 h-3 bg-slate-100 rounded-full border border-slate-200/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] mb-5 flex items-center justify-center">
					<div className="w-6 h-1.5 bg-slate-300 rounded-full" />
				</div>

				{/* Photo Section - Portrait ID Profile */}
				<div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 ring-4 ring-blue-50 border border-slate-100 shadow-md mb-4 shrink-0">
					{user.photo && !imageError ? (
						<Image
							src={user.photo}
							alt={user.nama}
							fill
							className="object-cover object-center"
							onError={() => setImageError(true)}
							sizes="112px"
							priority
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-slate-50">
							<User className="w-16 h-16 text-[#185FA5]/60" />
						</div>
					)}
				</div>

				{/* Main Employee Title & Department Badge */}
				<div className="w-full text-center px-4 flex flex-col items-center mb-4">
					<h2 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
						{user.nama}
					</h2>
					<span className="mt-1 inline-flex items-center gap-1 bg-blue-50/80 border border-blue-100/60 text-[#185FA5] text-[10px] font-bold px-2 rounded-full">
						{user.departemen_name || user.departemen}
					</span>
				</div>

				{/* Metadata details list */}
				<div className="w-full space-y-1.5 mt-auto pt-3 border-t border-slate-100/80 text-left">
					<div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/50 border border-slate-100/40 rounded-xl">
						<Building2 className="w-3.5 h-3.5 text-[#378ADD] shrink-0" />
						<span className="text-[10px] font-semibold text-slate-600 truncate">
							{user.jabatan || "Pegawai"}
						</span>
					</div>
					
					<div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/50 border border-slate-100/40 rounded-xl">
						<Calendar className="w-3.5 h-3.5 text-[#378ADD] shrink-0" />
						<span className="text-[10px] font-semibold text-slate-600">
							{user.tmp_lahir}
							{user.formattedBirthDate && `, ${user.formattedBirthDate}`}
						</span>
					</div>

					<div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/50 border border-slate-100/40 rounded-xl">
						<Home className="w-3.5 h-3.5 text-[#378ADD] shrink-0" />
						<span className="text-[10px] font-semibold text-slate-600 truncate">
							{user.alamat}
						</span>
					</div>
				</div>

				{/* Scanning Barcode with Employee ID */}
				<Barcode value={user.username} />

				{/* Tap Hint Banner */}
				<div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] font-semibold text-[#185FA5]/75 bg-blue-50/50 border border-blue-100/30 px-3 py-1 rounded-full animate-pulse select-none">
					<RefreshCw className="w-2.5 h-2.5 animate-spin [animation-duration:8s]" />
					<span>Sentuh untuk detail presensi</span>
				</div>

				{/* Flip Prompt Badge */}
				<div className="absolute bottom-1.5 right-1.5 bg-slate-100 text-slate-500 p-1.5 rounded-full hover:bg-blue-50 hover:text-[#185FA5] transition-colors duration-200">
					<RefreshCw className="w-3 h-3" />
				</div>
			</div>
		);
	}, [user, imageError]);

	// Render Back Side (Attendance Card)
	const backContent = useMemo(() => {
		if (!user) return null;

		return (
			<div className="relative w-full h-full flex flex-col items-center">
				{/* Top Orange Header Indicator */}
				<div className="absolute top-0 inset-x-0 h-2 bg-[#378ADD]" />

				{/* Hospital Identity Header */}
				<div className="w-full text-center mt-3 mb-5 px-4">
					<span className="inline-flex items-center gap-1 text-[#378ADD] text-[9px] font-extrabold tracking-[0.18em] uppercase">
						<Landmark className="w-2.5 h-2.5" />
						RS Bhayangkara Nganjuk
					</span>
					<h3 className="text-[10px] font-bold text-slate-500 tracking-[0.12em] uppercase mt-0.5">
						Register Kehadiran Mingguan
					</h3>
				</div>

				{/* Lanyard Hole Clip Graphic */}
				<div className="w-12 h-3 bg-slate-100 rounded-full border border-slate-200/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] mb-5 flex items-center justify-center">
					<div className="w-6 h-1.5 bg-slate-300 rounded-full" />
				</div>

				{statsLoading ? (
					<div className="flex-1 flex flex-col items-center justify-center gap-2">
						<div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
						<span className="text-xs text-slate-400 font-medium">Memuat statistik...</span>
					</div>
				) : stats ? (
					<div className="w-full flex-1 flex flex-col justify-between">
						{/* Daily Status Bubbles */}
						<div className="w-full px-1">
							<h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 text-center sm:text-left">
								Jurnal Mingguan
							</h4>
							<div className="flex justify-between items-center bg-slate-50/50 border border-slate-100/60 rounded-2xl p-3.5">
								{stats.daily.map((item, index) => (
									<DayStatus
										key={index}
										day={daysMap[item.day] || item.day}
										status={item.status}
									/>
								))}
							</div>
						</div>

						{/* Stats Metrics Grid */}
						<div className="w-full px-1 mt-4">
							<h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center sm:text-left">
								Persentase Kehadiran
							</h4>
							<div className="grid grid-cols-2 gap-2">
								<StatBox
									label="Hadir"
									value={stats.stats.total}
									bgColor="bg-blue-50/60"
									textColor="text-[#185FA5]"
								/>
								<StatBox
									label="Tepat"
									value={stats.stats.onTime}
									bgColor="bg-green-50/60"
									textColor="text-green-600"
								/>
								<StatBox
									label="Telat"
									value={stats.stats.late}
									bgColor="bg-yellow-50/60"
									textColor="text-yellow-600"
								/>
								<StatBox
									label="Cuti"
									value={stats.stats.leave}
									bgColor="bg-red-50/60"
									textColor="text-red-500"
								/>
							</div>
						</div>

						{/* Scan Instruction Footer */}
						<div className="w-full text-center mt-3 pt-3 border-t border-slate-100/80 flex flex-col items-center shrink-0">
							<span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
								Pindai barcode depan untuk presensi
							</span>
							<span className="text-[7.5px] text-slate-350 mt-0.5">
								RS Bhayangkara Nganjuk © 2026
							</span>
							
							{/* Tap Hint Banner */}
							<div className="flex items-center justify-center gap-1.5 mt-2.5 text-[10px] font-semibold text-[#378ADD]/75 bg-blue-50/50 border border-blue-100/30 px-3 py-1 rounded-full animate-pulse select-none">
								<RefreshCw className="w-2.5 h-2.5 animate-spin [animation-duration:8s]" />
								<span>Sentuh untuk melihat profil</span>
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center text-center">
						<AlertCircle className="w-8 h-8 text-red-500 mb-2" />
						<span className="text-xs font-semibold text-slate-700">Data gagal dimuat</span>
					</div>
				)}

				{/* Flip Prompt Badge */}
				<div className="absolute bottom-1.5 right-1.5 bg-slate-100 text-slate-500 p-1.5 rounded-full hover:bg-blue-50 hover:text-[#185FA5] transition-colors duration-200">
					<RefreshCw className="w-3 h-3" />
				</div>
			</div>
		);
	}, [user, stats, statsLoading]);

	if (isLoading) {
		return (
			<Card className="max-w-xs mx-auto p-5 bg-white border border-slate-200/60 shadow-sm rounded-[24px] flex flex-col items-center h-[500px]">
				<div className="w-full h-2 bg-slate-100 absolute top-0 inset-x-0" />
				<div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse mt-3 mb-6" />
				<div className="w-12 h-3 bg-slate-50 rounded-full animate-pulse mb-6" />
				<div className="w-28 h-28 rounded-2xl bg-slate-100 animate-pulse ring-4 ring-slate-50 border border-slate-200/30 mb-4" />
				<div className="h-5 bg-slate-100 rounded w-3/4 animate-pulse mb-2" />
				<div className="h-4 bg-slate-50 rounded-full w-1/2 animate-pulse mb-6" />
				<div className="w-full space-y-2 pt-4 border-t border-slate-100/60">
					<div className="h-7 bg-slate-50/60 border border-slate-100/40 rounded-xl animate-pulse w-full" />
					<div className="h-7 bg-slate-50/60 border border-slate-100/40 rounded-xl animate-pulse w-full" />
				</div>
				<div className="w-36 h-8 bg-slate-100 animate-pulse rounded mt-6" />
			</Card>
		);
	}

	if (error || !user) {
		return (
			<Card className="max-w-xs mx-auto p-6 bg-white border border-red-100/80 shadow-sm rounded-[24px] flex flex-col items-center text-center h-[500px] justify-center">
				<div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
					<User className="w-6 h-6 text-red-500" />
				</div>
				<p className="text-sm font-semibold text-slate-700">Profil Tidak Tersedia</p>
				<p className="text-xs text-slate-400 mt-1 max-w-[200px]">
					{error || "Data pegawai tidak ditemukan"}
				</p>
			</Card>
		);
	}

	return (
		<div className="w-full flex justify-center py-2">
			{/* 3D Perspective Card Container */}
			<div 
				className="w-full max-w-xs cursor-pointer [perspective:1000px]"
				onClick={() => setIsFlipped(!isFlipped)}
				title="Klik untuk membalik kartu"
			>
				<motion.div
					animate={{ rotateY: isFlipped ? 180 : 0 }}
					whileHover={shouldReduceMotion ? {} : { y: -4 }}
					whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
					transition={shouldReduceMotion ? { duration: 0 } : { 
						type: "spring", 
						stiffness: 180, 
						damping: 22 
					}}
					className="w-full relative [transform-style:preserve-3d] h-[500px]"
				>
					{/* Front Side: Employee ID Card */}
					<div className="absolute inset-0 [backface-visibility:hidden] w-full h-full">
						<Card className="p-5 bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-[24px] relative overflow-hidden h-full flex flex-col items-center">
							{frontContent}
							{/* Holo Reflection Overlay */}
							<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-[24px]" />
						</Card>
					</div>

					{/* Back Side: Attendance Register Card */}
					<div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] w-full h-full">
						<Card className="p-5 bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-[24px] relative overflow-hidden h-full flex flex-col items-center">
							{backContent}
							{/* Holo Reflection Overlay */}
							<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-[24px]" />
						</Card>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
