"use client";

import { useState, useEffect } from "react";
import {
	Calendar,
	Clock,
	Users,
	BookOpen,
	Briefcase,
	IdCard,
	NotebookPen,
	Ticket,
	MenuIcon,
	RefreshCcw,
	FileText,
	Coins,
	Percent,
	BadgeDollarSign,
	ChevronRight,
	Search,
} from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import { AttendanceStats } from "@/components/AttendanceStats";
import { NotificationAlert } from "@/components/notifications";
import NotificationBellMobile from "@/components/notifications/NotificationBellMobile";
import { useRouter } from "next/navigation";
import adminType from "@/types/adminType";

const QuickActions = ({ searchQuery = "" }) => {
	const router = useRouter();
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
	];

	const filteredActions = actions.filter((action) =>
		action.title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (filteredActions.length === 0) return null;

	return (
		<div className="px-1 relative">
			<h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4 px-2 flex items-center gap-2">
				Layanan Pegawai
			</h3>
			<div className="grid grid-cols-3 gap-x-2 gap-y-6 py-4 bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-1.5 space-y-0.5 relative z-10 transition-shadow hover:shadow-md">
				{filteredActions.map((action) => (
					<button
						key={action.title}
						onClick={() => router.push(action.href)}
						className="flex flex-col items-center gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-[#0093dd]/50 rounded-xl"
					>
						<div className={`w-[60px] h-[60px] rounded-[22px] border flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:scale-95 group-active:translate-y-0 ${action.colorClass}`}>
							<action.icon className="w-[26px] h-[26px] stroke-[1.5]" />
						</div>
						<span className="text-[11px] font-semibold text-slate-600 text-center leading-tight tracking-tight group-hover:text-slate-900 px-1 w-full">
							{action.title}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

const AdminMenu = ({ searchQuery = "" }) => {
	const router = useRouter();
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
				<h3 className="text-sm font-bold text-slate-800 tracking-tight">
					Monitoring Presensi
				</h3>
				<span className="text-[10px] items-center font-bold bg-[#0093dd]/10 text-[#0093dd] px-2.5 py-1 rounded-full uppercase tracking-wider">
					Admin
				</span>
			</div>
			<div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-1.5 space-y-0.5 relative z-10 transition-shadow hover:shadow-md">
				{filteredActions.map((action) => (
					<button
						key={action.title}
						onClick={() => router.push(action.href)}
						className="w-full flex items-center gap-3.5 p-3 rounded-[18px] hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group outline-none focus-visible:ring-2 focus-visible:ring-[#0093dd]/50"
					>
						<div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#0093dd]/10 group-hover:border-[#0093dd]/20 group-hover:text-[#0093dd] transition-colors shrink-0">
							<action.icon className="w-[22px] h-[22px] stroke-[1.5]" />
						</div>
						<div className="flex-1 min-w-0 flex flex-col justify-center">
							<span className="text-[13px] font-semibold text-slate-800 group-hover:text-[#0093dd] transition-colors">
								{action.title}
							</span>
							<span className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
								{action.description}
							</span>
						</div>
						<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0093dd] transition-all group-hover:translate-x-0.5 shrink-0" />
					</button>
				))}
			</div>
		</div>
	);
};

const FinanceMenu = ({ searchQuery = "" }) => {
	const router = useRouter();
	const financeActions = [
		{
			title: "Penggajian",
			description: "Kelola data gaji pegawai",
			icon: FileText,
			href: "/dashboard/penggajian/data-gaji",
		},
		{
			title: "Presentase",
			description: "Kelola presentase gaji",
			icon: Percent,
			href: "/dashboard/penggajian/presentase",
		},
		{
			title: "Riwayat Gaji",
			description: "Lihat history gaji pegawai",
			icon: Clock,
			href: "/dashboard/penggajian",
		},
		{
			title: "Gapok",
			description: "Kelola gaji pokok pegawai",
			icon: BadgeDollarSign,
			href: "/dashboard/penggajian/gapok",
		},
	];

	const filteredActions = financeActions.filter(
		(action) =>
			action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			action.description.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (filteredActions.length === 0) return null;

	return (
		<div className="space-y-3">
			<div className="px-3 flex items-center justify-between">
				<h3 className="text-sm font-bold text-slate-800 tracking-tight">
					Keuangan Pegawai
				</h3>
				<span className="text-[10px] items-center font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
					Keuangan
				</span>
			</div>
			<div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-1.5 space-y-0.5 relative z-10 transition-shadow hover:shadow-md">
				{filteredActions.map((action) => (
					<button
						key={action.title}
						onClick={() => router.push(action.href)}
						className="w-full flex items-center gap-3.5 p-3 rounded-[18px] hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
					>
						<div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 group-hover:text-emerald-600 transition-colors shrink-0">
							<action.icon className="w-[22px] h-[22px] stroke-[1.5]" />
						</div>
						<div className="flex-1 min-w-0 flex flex-col justify-center">
							<span className="text-[13px] font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
								{action.title}
							</span>
							<span className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
								{action.description}
							</span>
						</div>
						<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-all group-hover:translate-x-0.5 shrink-0" />
					</button>
				))}
			</div>
		</div>
	);
};

export default function DashboardPage() {
	const [userDepartment, setUserDepartment] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const checkUserDepartment = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					setUserDepartment(data.user?.departemen);
				}
			} catch (error) {
				console.error("Error checking user department:", error);
			} finally {
				setIsLoading(false);
			}
		};

		checkUserDepartment();
	}, []);

	return (
		<div className="h-screen overflow-y-auto bg-slate-50/50 pb-32 font-sans scroll-smooth">
			{/* Brand Accent Background Shapes - Soft Clinical Glow */}
			<div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#0093dd]/[0.10] to-transparent -z-10 pointer-events-none" />
			<div className="absolute top-[-80px] right-[-60px] w-72 h-72 bg-[#0093dd]/15 rounded-full blur-[80px] -z-10 pointer-events-none" />
			<div className="absolute top-[200px] left-[-60px] w-64 h-64 bg-[#0093dd]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
			
			<div className="max-w-md mx-auto px-4 pt-6 space-y-7 relative">

				{/* Sticky Search Menu */}
				<div className="sticky top-0 pt-4 pb-2 z-[60] -mx-4 px-4">
					<div className="absolute inset-0 bg-slate-50/80 backdrop-blur-md -z-10" />
					<div className="flex items-center gap-2">
						<div className="relative flex-1 flex items-center h-12 rounded-[20px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-200/40 overflow-hidden focus-within:ring-2 focus-within:ring-[#0093dd]/30 focus-within:bg-white transition-all">
							<Search className="w-4 h-4 text-slate-400 absolute left-4" />
							<input 
								type="text" 
								placeholder="Cari layanan..." 
								className="w-full h-full pl-11 pr-11 bg-transparent outline-none text-[13px] font-medium text-slate-700 placeholder:text-slate-400"
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
						<div className="flex-shrink-0">
							<NotificationBellMobile />
						</div>
					</div>
				</div>

				<div className="space-y-7">
					{/* Sembunyikan profil dan statistik presensi ketika sedang mencari untuk mengurangi distraksi */}
					{!searchQuery && (
						<>
							{/* Profil Pegawai */}
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both">
								<EmployeeCard />
							</div>

							{/* Statistik Presensi (Primary Use Case) */}
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both delay-100">
								<AttendanceStats />
							</div>
						</>
					)}

					{/* Admin Menu - Hanya untuk Departemen IT/SPI */}
					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<div className="animate-pulse text-slate-400 text-[13px] font-medium flex items-center gap-2">
								<div className="w-4 h-4 border-2 border-[#0093dd]/30 border-t-[#0093dd] rounded-full animate-spin" />
								Mengecek akses menu...
							</div>
						</div>
					) : (
						<div className={`space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both ${!searchQuery ? "delay-200" : ""}`}>
							{userDepartment === adminType.IT && (
								<>
									<AdminMenu searchQuery={searchQuery} />
									{/* <FinanceMenu searchQuery={searchQuery} /> */}
								</>
							)}
							{userDepartment === adminType.SPI && <AdminMenu searchQuery={searchQuery} />}
						</div>
					)}

					{/* Aksi Cepat / Layanan Pegawai */}
					{process.env.NEXT_PUBLIC_MENU_ADMIN === "true" && (
						<div className={`animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both ${!searchQuery ? "delay-300" : ""}`}>
							<QuickActions searchQuery={searchQuery} />
						</div>
					)}
					
					{/* Status Jika Pencarian Kosong */}
					{searchQuery && (
						<div className="flex flex-col items-center justify-center py-10 opacity-60">
							<Search className="w-8 h-8 text-slate-300 mb-2" />
							<p className="text-xs text-slate-500 font-medium">Lanjutkan mengetik untuk mencari layanan...</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
