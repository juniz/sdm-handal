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
	ChevronRight,
	Search,
	Laptop2,
	X,
} from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import RevisiNotifPopup from "@/components/notifications/RevisiNotifPopup";
import { useRouter } from "next/navigation";
import adminType from "@/types/adminType";
import { useUser } from "@/hooks/useUser";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const QUICK_ACTIONS = [
	{ title: "Akreditasi", icon: BookOpen, href: "/dashboard/akreditasi" },
	{ title: "Tukar Dinas", icon: RefreshCcw, href: "/dashboard/pengajuan-tukar-dinas" },
	{ title: "Pengajuan Izin", icon: NotebookPen, href: "/dashboard/izin" },
	{ title: "Pengajuan Cuti", icon: Briefcase, href: "/dashboard/cuti" },
	{ title: "Ticket IT", icon: Ticket, href: "/dashboard/ticket" },
	{ title: "Assignment IT", icon: Users, href: "/dashboard/ticket-assignment" },
	{ title: "Rapat", icon: Users, href: "/dashboard/rapat" },
	{ title: "Pengajuan KTA", icon: IdCard, href: "/dashboard/pengajuan-kta" },
	{ title: "Pengembangan", icon: FileText, href: "/dashboard/development" },
	{ title: "Peminjaman Aset IT", icon: Laptop2, href: "/dashboard/pengajuan-aset" },
];

const ADMIN_ACTIONS = [
	{ title: "Hari Ini", description: "Monitor presensi seluruh pegawai", icon: Clock, href: "/dashboard/it/attendance-monitoring" },
	{ title: "Bulanan", description: "Monitor presensi bulanan seluruh pegawai", icon: Calendar, href: "/dashboard/reports/monthly-attendance" },
	{ title: "Pegawai Organik", description: "Lihat daftar pegawai organik", icon: Users, href: "/dashboard/pegawai-organik" },
];

const QuickActions = ({ searchQuery = "" }) => {
	const router = useRouter();
	const shouldReduceMotion = useReducedMotion();

	const filteredActions = QUICK_ACTIONS.map((action) => ({
		...action,
		colorClass: "bg-primary-50 text-primary-600 border-primary-100/60 group-hover:border-primary-100 group-hover:bg-primary-100/40 group-hover:shadow-md",
	})).filter((action) =>
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
				className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-5 py-4 bg-white rounded-xl border border-slate-200/60 shadow-sm p-3"
			>
				{filteredActions.map((action) => (
					<motion.button
						whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
						key={action.title}
						onClick={() => router.push(action.href)}
						className="flex min-h-11 flex-col items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-lg"
					>
						<div className={`w-14 h-14 rounded-lg border flex items-center justify-center transition-all duration-300 motion-reduce:transition-none group-hover:-translate-y-0.5 ${action.colorClass}`}>
							<action.icon className="w-6 h-6 stroke-[1.5]" />
						</div>
						<span className="text-xs font-bold text-slate-600 text-center leading-tight tracking-tight px-1 w-full">
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

	const filteredActions = ADMIN_ACTIONS.filter(
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
					<span className="text-[9px] items-center font-bold bg-primary-50 text-primary-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
					Admin
				</span>
			</div>
			<motion.div 
				initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
				className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-1.5 space-y-0.5 relative"
			>
				{filteredActions.map((action) => (
					<motion.button
						whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
						key={action.title}
						onClick={() => router.push(action.href)}
						className="w-full min-h-11 flex items-center gap-3.5 p-3 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors motion-reduce:transition-none text-left group outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
					>
						<div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 group-hover:border-primary-100 group-hover:text-primary-600 transition-colors motion-reduce:transition-none shrink-0">
							<action.icon className="w-5 h-5 stroke-[1.5]" />
						</div>
						<div className="flex-1 min-w-0 flex flex-col justify-center">
							<span className="text-[12px] font-bold text-slate-800 group-hover:text-primary-600 transition-colors motion-reduce:transition-none">
								{action.title}
							</span>
							<span className="text-xs font-medium text-slate-500 truncate mt-0.5">
								{action.description}
							</span>
						</div>
						<ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 transition-all motion-reduce:transition-none group-hover:translate-x-0.5 shrink-0" />
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

	const userDepartment = user?.departemen || null;
	const normalizedSearch = searchQuery.trim().toLowerCase();
	const hasSearchResults = !normalizedSearch ||
		(process.env.NEXT_PUBLIC_MENU_ADMIN === "true" && QUICK_ACTIONS.some((action) =>
			action.title.toLowerCase().includes(normalizedSearch))) ||
		([adminType.IT, adminType.SPI].includes(userDepartment) && ADMIN_ACTIONS.some((action) =>
			`${action.title} ${action.description}`.toLowerCase().includes(normalizedSearch)));

	return (
		<div className="min-h-screen w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto bg-slate-50/50 relative font-sans antialiased pb-28 pt-4">
			{/* Brand Accent Background Shapes - Soft Clinical Glow */}
			<div className="absolute top-0 inset-x-0 h-48 bg-primary-50/60 -z-10 pointer-events-none" />

			{/* Sticky Search Menu */}
			<div className="px-4 pb-4">
				<label htmlFor="dashboard-service-search" className="sr-only">Cari layanan pegawai</label>
				<div className="relative flex items-center h-11 rounded-lg bg-white shadow-sm border border-slate-200/60 overflow-hidden focus-within:ring-2 focus-within:ring-primary-600/30 transition-all motion-reduce:transition-none">
					<Search className="w-4 h-4 text-slate-400 absolute left-4" />
					<input 
						id="dashboard-service-search"
						type="text" 
						placeholder="Cari layanan pegawai..." 
						className="w-full h-full pl-11 pr-11 bg-transparent outline-none text-base md:text-[12.5px] font-semibold text-slate-700 placeholder:text-slate-400"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button 
							onClick={() => setSearchQuery("")}
							aria-label="Hapus pencarian"
							className="absolute right-1.5 h-10 w-10 inline-flex items-center justify-center text-[10px] font-bold text-slate-500 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1 bg-slate-100 rounded-full"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					)}
				</div>
			</div>

			{/* Content Body */}
			<div className="px-4 space-y-6">
				
				<AnimatePresence mode="wait">
					{!normalizedSearch ? (
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

							{/* Notifikasi Revisi Penilaian Kinerja Popup */}
							<RevisiNotifPopup />

							{/* Admin Menu - Hanya untuk Departemen IT/SPI */}
							{isLoading ? (
								<div className="flex justify-center items-center py-6">
								<div className="motion-reduce:animate-none animate-pulse text-slate-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
									<div className="motion-reduce:animate-none w-3.5 h-3.5 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
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
							{!hasSearchResults && <div className="flex flex-col items-center justify-center py-12 text-center" role="status" aria-live="polite">
								<Search className="w-8 h-8 text-slate-300 mb-2" />
								<p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Layanan tidak ditemukan</p>
								<p className="text-[11px] text-slate-400 mt-1">Gunakan kata kunci lain jika layanan tidak ditemukan</p>
							</div>}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
