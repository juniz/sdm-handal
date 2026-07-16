"use client";

import { useState } from "react";
import {
	Calendar,
	Clock,
	Users,
	BookOpen,
	Briefcase,
	IdCard,
	NotebookPen,
	Ticket,
	RefreshCcw,
	FileText,
	Percent,
	BadgeDollarSign,
	ChevronRight,
	Search,
	Laptop2,
	Home,
	User,
	Bell,
} from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import NotificationBellMobile from "@/components/notifications/NotificationBellMobile";
import { useRouter } from "next/navigation";
import adminType from "@/types/adminType";
import { useUser } from "@/hooks/useUser";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const QuickActions = ({ searchQuery = "" }) => {
	const router = useRouter();
	const shouldReduceMotion = useReducedMotion();
	const actions = [
		{
			title: "Akreditasi",
			icon: BookOpen,
			href: "/dashboard/akreditasi",
			colorClass: "bg-indigo-50 text-indigo-600 border-indigo-100/60 group-hover:border-indigo-200 group-hover:bg-indigo-100/40 group-hover:shadow-[0_8px_20px_rgba(99,102,241,0.12)]",
		},
		{
			title: "Tukar Dinas",
			icon: RefreshCcw,
			href: "/dashboard/pengajuan-tukar-dinas",
			colorClass: "bg-teal-50 text-teal-600 border-teal-100/60 group-hover:border-teal-200 group-hover:bg-teal-100/40 group-hover:shadow-[0_8px_20px_rgba(20,184,166,0.12)]",
		},
		{
			title: "Pengajuan Izin",
			icon: NotebookPen,
			href: "/dashboard/izin",
			colorClass: "bg-amber-50 text-amber-600 border-amber-100/60 group-hover:border-amber-200 group-hover:bg-amber-100/40 group-hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)]",
		},
		{
			title: "Pengajuan Cuti",
			icon: Briefcase,
			href: "/dashboard/cuti",
			colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100/60 group-hover:border-emerald-200 group-hover:bg-emerald-100/40 group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.12)]",
		},
		{
			title: "Ticket IT",
			icon: Ticket,
			href: "/dashboard/ticket",
			colorClass: "bg-rose-50 text-rose-600 border-rose-100/60 group-hover:border-rose-200 group-hover:bg-rose-100/40 group-hover:shadow-[0_8px_20px_rgba(244,63,94,0.12)]",
		},
		{
			title: "Assignment IT",
			icon: Users,
			href: "/dashboard/ticket-assignment",
			colorClass: "bg-[#0093dd]/[0.05] text-[#0093dd] border-[#0093dd]/10 group-hover:border-[#0093dd]/20 group-hover:bg-[#0093dd]/10 group-hover:shadow-[0_8px_20px_rgba(0,147,221,0.12)]",
		},
		{
			title: "Rapat",
			icon: Users,
			href: "/dashboard/rapat",
			colorClass: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100/60 group-hover:border-fuchsia-200 group-hover:bg-fuchsia-100/40 group-hover:shadow-[0_8px_20px_rgba(217,70,239,0.12)]",
		},
		{
			title: "Pengajuan KTA",
			icon: IdCard,
			href: "/dashboard/pengajuan-kta",
			colorClass: "bg-orange-50 text-orange-600 border-orange-100/60 group-hover:border-orange-200 group-hover:bg-orange-100/40 group-hover:shadow-[0_8px_20px_rgba(249,115,22,0.12)]",
		},
		{
			title: "Pengembangan",
			icon: FileText,
			href: "/dashboard/development",
			colorClass: "bg-sky-50 text-sky-600 border-sky-100/60 group-hover:border-sky-200 group-hover:bg-sky-100/40 group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.12)]",
		},
		{
			title: "Peminjaman Aset IT",
			icon: Laptop2,
			href: "/dashboard/pengajuan-aset",
			colorClass: "bg-sky-50 text-sky-600 border-sky-100/60 group-hover:border-sky-200 group-hover:bg-sky-100/40 group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.12)]",
		}
	];

	const filteredActions = actions.filter((action) =>
		action.title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (filteredActions.length === 0) return null;

	return (
		<div id="layanan-pegawai" className="px-1 relative">
			<h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
				Layanan Pegawai
			</h3>
			<motion.div 
				initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
				className="grid grid-cols-3 gap-x-2 gap-y-5 py-4 bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-1.5"
			>
				{filteredActions.map((action) => (
					<motion.button
						whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
						key={action.title}
						onClick={() => router.push(action.href)}
						className="flex flex-col items-center gap-2 group outline-none"
					>
						<div className={`w-14 h-14 rounded-[20px] border flex items-center justify-center transition-all duration-300 group-hover:-translate-y-0.5 ${action.colorClass}`}>
							<action.icon className="w-6 h-6 stroke-[1.5]" />
						</div>
						<span className="text-[10px] font-bold text-slate-600 text-center leading-tight tracking-tight px-1 w-full">
							{action.title}
						</span>
					</motion.button>
				))}
			</motion.div>
		</div>
	);
};

const AdminMenu = ({ searchQuery = "" }) => {
	const router = useRouter();
	const shouldReduceMotion = useReducedMotion();
	const adminActions = [
		{
			title: "Hari Ini",
			description: "Monitor presensi seluruh pegawai",
			icon: Clock,
			href: "/dashboard/it/attendance-monitoring",
		},
		{
			title: "Bulanan",
			description: "Monitor presensi bulanan seluruh pegawai",
			icon: Calendar,
			href: "/dashboard/reports/monthly-attendance",
		},
		{
			title: "Pegawai Organik",
			description: "Lihat daftar pegawai organik",
			icon: Users,
			href: "/dashboard/pegawai-organik",
		},
	];

	const filteredActions = adminActions.filter(
		(action) =>
			action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			action.description.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (filteredActions.length === 0) return null;

	return (
		<div className="space-y-3">
			<div className="px-3 flex items-center justify-between">
				<h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
					Monitoring Presensi
				</h3>
				<span className="text-[9px] items-center font-bold bg-[#0093dd]/10 text-[#0093dd] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
					Admin
				</span>
			</div>
			<motion.div 
				initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
				className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-1.5 space-y-0.5 relative z-10"
			>
				{filteredActions.map((action) => (
					<motion.button
						whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
						key={action.title}
						onClick={() => router.push(action.href)}
						className="w-full flex items-center gap-3.5 p-3 rounded-[18px] hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group outline-none"
					>
						<div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#0093dd]/10 group-hover:border-[#0093dd]/20 group-hover:text-[#0093dd] transition-colors shrink-0">
							<action.icon className="w-5 h-5 stroke-[1.5]" />
						</div>
						<div className="flex-1 min-w-0 flex flex-col justify-center">
							<span className="text-[12px] font-bold text-slate-800 group-hover:text-[#0093dd] transition-colors">
								{action.title}
							</span>
							<span className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
								{action.description}
							</span>
						</div>
						<ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0093dd] transition-all group-hover:translate-x-0.5 shrink-0" />
					</motion.button>
				))}
			</motion.div>
		</div>
	);
};

export default function DashboardPage() {
	const shouldReduceMotion = useReducedMotion();
	const { user, isLoading } = useUser();
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();

	const userDepartment = user?.departemen || null;

	return (
		<div className="min-h-screen max-w-md mx-auto bg-slate-50/50 relative font-sans antialiased pb-28 pt-4">
			{/* Brand Accent Background Shapes - Soft Clinical Glow */}
			<div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-[#0093dd]/[0.08] to-transparent -z-10 pointer-events-none" />
			<div className="absolute top-[-80px] right-[-60px] w-72 h-72 bg-[#0093dd]/12 rounded-full blur-[80px] -z-10 pointer-events-none" />

			{/* Sticky Search Menu */}
			<div className="px-4 pb-4">
				<div className="relative flex items-center h-11 rounded-2xl bg-white shadow-sm border border-slate-200/60 overflow-hidden focus-within:ring-2 focus-within:ring-[#0093dd]/30 transition-all">
					<Search className="w-4 h-4 text-slate-400 absolute left-4" />
					<input 
						type="text" 
						placeholder="Cari layanan pegawai..." 
						className="w-full h-full pl-11 pr-11 bg-transparent outline-none text-[12.5px] font-semibold text-slate-755 placeholder:text-slate-400"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button 
							onClick={() => setSearchQuery("")}
							className="absolute right-4 text-[10px] font-bold text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
						>
							✕
						</button>
					)}
				</div>
			</div>

			{/* Content Body */}
			<div className="px-4 space-y-6">
				
				<AnimatePresence mode="wait">
					{!searchQuery ? (
						<motion.div 
							key="dashboard-content"
							initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							exit={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -15 }}
							transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
							className="space-y-6"
						>
							{/* Profil Pegawai (Physical 3D ID Card with Flippable Stats) */}
							<EmployeeCard />

							{/* Admin Menu - Hanya untuk Departemen IT/SPI */}
							{isLoading ? (
								<div className="flex justify-center items-center py-6">
									<div className="animate-pulse text-slate-450 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
										<div className="w-3.5 h-3.5 border-2 border-[#0093dd]/30 border-t-[#0093dd] rounded-full animate-spin" />
										Mengecek akses menu...
									</div>
								</div>
							) : (
								<>
									{userDepartment === adminType.IT && <AdminMenu searchQuery={searchQuery} />}
									{userDepartment === adminType.SPI && <AdminMenu searchQuery={searchQuery} />}
								</>
							)}

							{/* Aksi Cepat / Layanan Pegawai */}
							{process.env.NEXT_PUBLIC_MENU_ADMIN === "true" && (
								<QuickActions searchQuery={searchQuery} />
							)}
						</motion.div>
					) : (
						<motion.div
							key="search-content"
							initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							exit={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -15 }}
							transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
							className="space-y-6"
						>
							{/* Search results filtered in list */}
							{userDepartment === adminType.IT && <AdminMenu searchQuery={searchQuery} />}
							{userDepartment === adminType.SPI && <AdminMenu searchQuery={searchQuery} />}
							{process.env.NEXT_PUBLIC_MENU_ADMIN === "true" && (
								<QuickActions searchQuery={searchQuery} />
							)}

							{/* Empty Search State */}
							<div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
								<Search className="w-8 h-8 text-slate-300 mb-2" />
								<p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hasil Pencarian</p>
								<p className="text-[11px] text-slate-400 mt-1">Gunakan kata kunci lain jika layanan tidak ditemukan</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
