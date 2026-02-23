"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Calendar,
	Clock,
	Users,
	BookOpen,
	Briefcase,
	IdCard,
	NotebookPen,
	Ticket,
	Shield,
	MenuIcon,
	RefreshCcw,
	FileText,
	Coins,
	Percent,
	BadgeDollarSign,
} from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import { AttendanceStats } from "@/components/AttendanceStats";
import { Button } from "@/components/ui/button";
import { NotificationAlert } from "@/components/notifications";
import { useRouter } from "next/navigation";
import adminType from "@/types/adminType";

const activities = [
	{
		time: "08:00",
		event: "Check In",
		status: "success",
		date: "Hari ini",
	},
	{
		time: "10:30",
		event: "Meeting Tim IT",
		status: "ongoing",
		date: "Hari ini",
	},
	{
		time: "13:00",
		event: "Istirahat",
		status: "pending",
		date: "Hari ini",
	},
];

const QuickActions = () => {
	const router = useRouter();
	const actions = [
		{
			title: "Akreditasi",
			icon: BookOpen,
			href: "/dashboard/akreditasi",
			color: "from-rose-500 to-pink-500",
		},
		{
			title: "Tukar Dinas",
			icon: RefreshCcw,
			href: "/dashboard/pengajuan-tukar-dinas",
			color: "from-orange-500 to-red-500",
		},
		{
			title: "Pengajuan Izin",
			icon: NotebookPen,
			href: "/dashboard/izin",
			color: "from-blue-500 to-indigo-500",
		},
		{
			title: "Pengajuan Cuti",
			icon: Briefcase,
			href: "/dashboard/cuti",
			color: "from-purple-500 to-pink-500",
		},
		{
			title: "Ticket IT",
			icon: Ticket,
			href: "/dashboard/ticket",
			color: "from-indigo-500 to-blue-500",
		},
		{
			title: "Assignment IT",
			icon: Users,
			href: "/dashboard/ticket-assignment",
			color: "from-emerald-500 to-teal-500",
		},
		{
			title: "Rapat",
			icon: Users,
			href: "/dashboard/rapat",
			color: "from-cyan-500 to-blue-500",
		},
		{
			title: "Pengajuan KTA",
			icon: IdCard,
			href: "/dashboard/pengajuan-kta",
			color: "from-amber-500 to-orange-500",
		},
		{
			title: "Pengajuan Pengembangan",
			icon: FileText,
			href: "/dashboard/development",
			color: "from-violet-500 to-purple-500",
		},
	];

	return (
		<Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-white">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<MenuIcon className="w-5 h-5 text-blue-500" />
					Menu
				</CardTitle>
			</CardHeader>
			<CardContent className="relative">
				<div className="grid grid-cols-4 gap-3 p-2">
					{actions.map((action) => (
						<button
							key={action.title}
							onClick={() => router.push(action.href)}
							className="group relative overflow-hidden rounded-lg p-0.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] h-24"
						>
							<div className="relative bg-white/90 rounded-[7px] h-full flex flex-col items-center px-1 py-2">
								<div className="flex flex-col items-center gap-1.5">
									<div
										className={`rounded-lg bg-gradient-to-br ${action.color} p-2.5 text-white shadow-sm flex items-center justify-center shrink-0`}
									>
										<action.icon className="w-4 h-4" />
									</div>
									<span className="font-medium text-gray-900 text-[10px] text-center leading-tight px-1">
										{action.title}
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

const AdminMenu = () => {
	const router = useRouter();
	const adminActions = [
		{
			title: "Hari Ini",
			description: "Monitor presensi seluruh pegawai",
			icon: Clock,
			href: "/dashboard/it/attendance-monitoring",
			color: "from-purple-500 to-violet-500",
		},
		{
			title: "Bulanan",
			description: "Monitor presensi bulanan seluruh pegawai",
			icon: Calendar,
			href: "/dashboard/reports/monthly-attendance",
			color: "from-orange-500 to-red-500",
		},
		{
			title: "Pegawai Organik",
			description: "Lihat daftar pegawai organik",
			icon: Users,
			href: "/dashboard/pegawai-organik",
			color: "from-green-500 to-lime-500",
		},
	];

	return (
		<Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-orange-50">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<Users className="w-5 h-5 text-red-500" />
					Monitoring Presensi
				</CardTitle>
			</CardHeader>
			<CardContent className="relative">
				<div className="grid grid-cols-1 gap-2">
					{adminActions.map((action) => (
						<button
							key={action.title}
							onClick={() => router.push(action.href)}
							className="group relative overflow-hidden rounded-lg p-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
						>
							<div className="flex items-center gap-3">
								<div
									className={`rounded-lg bg-gradient-to-br ${action.color} p-2 text-white shadow-sm flex-shrink-0`}
								>
									<action.icon className="w-4 h-4" />
								</div>
								<div className="flex-1 text-left min-w-0">
									<span className="font-medium text-gray-900 text-sm block">
										{action.title}
									</span>
									<span className="text-xs text-gray-500 line-clamp-1">
										{action.description}
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

const FinanceMenu = () => {
	const router = useRouter();
	const financeActions = [
		{
			title: "Penggajian",
			description: "Kelola data gaji pegawai",
			icon: FileText,
			href: "/dashboard/penggajian/data-gaji",
			color: "from-blue-600 to-indigo-600",
		},
		{
			title: "Presentase",
			description: "Kelola presentase gaji",
			icon: Percent,
			href: "/dashboard/penggajian/presentase",
			color: "from-emerald-600 to-teal-600",
		},
		{
			title: "Riwayat Gaji",
			description: "Lihat history gaji pegawai",
			icon: Clock,
			href: "/dashboard/penggajian",
			color: "from-amber-600 to-orange-600",
		},
		{
			title: "Gapok",
			description: "Kelola gaji pokok pegawai",
			icon: BadgeDollarSign,
			href: "/dashboard/penggajian/gapok",
			color: "from-rose-600 to-pink-600",
		},
	];

	return (
		<Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<Coins className="w-5 h-5 text-blue-600" />
					Keuangan
				</CardTitle>
			</CardHeader>
			<CardContent className="relative">
				<div className="grid grid-cols-1 gap-2">
					{financeActions.map((action) => (
						<button
							key={action.title}
							onClick={() => router.push(action.href)}
							className="group relative overflow-hidden rounded-lg p-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
						>
							<div className="flex items-center gap-3">
								<div
									className={`rounded-lg bg-gradient-to-br ${action.color} p-2 text-white shadow-sm flex-shrink-0`}
								>
									<action.icon className="w-4 h-4" />
								</div>
								<div className="flex-1 text-left min-w-0">
									<span className="font-medium text-gray-900 text-sm block">
										{action.title}
									</span>
									<span className="text-xs text-gray-500 line-clamp-1">
										{action.description}
									</span>
								</div>
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

export default function DashboardPage() {
	const [userDepartment, setUserDepartment] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Check user department on component mount
	useEffect(() => {
		const checkUserDepartment = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					const userData = data.user;

					console.log("User data:", userData); // Debug log

					// Check if user is from IT department (Strict check per NEXT_PUBLIC_DEPARTMENT_IT)
					const isIT = userData.departemen === process.env.NEXT_PUBLIC_DEPARTMENT_IT;

					console.log("Is IT department:", isIT, "jbtn:", userData.jbtn); // Debug log

					setUserDepartment(isIT ? "IT" : userData.jbtn || userData.departemen);
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
		<div className="max-w-lg mx-auto space-y-4">
			{/* Notifikasi Assignment Urgent */}
			<NotificationAlert />

			{/* Profile dan Statistik */}
			<div className="space-y-4">
				{/* Kartu Pegawai */}
				<EmployeeCard />

				{/* Admin Menu - Hanya untuk Departemen IT */}
				{isLoading ? (
					<div className="flex justify-center items-center py-4">
						<div className="animate-pulse text-gray-500 text-sm">
							Mengecek akses admin...
						</div>
					</div>
				) : (
					<>
						{userDepartment === adminType.IT && (
							<>
								<AdminMenu />
								<FinanceMenu />
							</>
						)}
						{userDepartment === adminType.SPI && <AdminMenu />}
					</>
				)}

				{/* Aksi Cepat */}
				{process.env.NEXT_PUBLIC_MENU_ADMIN === "true" ? (
					<QuickActions />
				) : null}

				{/* Statistik Presensi */}
				<AttendanceStats />
			</div>
		</div>
	);
}
