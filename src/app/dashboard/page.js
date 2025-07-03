"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Calendar,
	Clock,
	Users,
	MapPin,
	Settings,
	AlertCircle,
	CheckCircle,
	XCircle,
	PlusCircle,
	ArrowRight,
	TrendingUp,
	BarChart3,
	Activity,
	Bell,
	BookOpen,
	Briefcase,
	IdCard,
	NotebookPen,
	Ticket,
	Shield,
	Eye,
	AlertTriangle,
	MenuIcon,
	RefreshCcw,
} from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import { AttendanceStats } from "@/components/AttendanceStats";
import { Button } from "@/components/ui/button";
import { NotificationAlert } from "@/components/notifications";
import { useRouter } from "next/navigation";

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
			title: "Ajukan Izin",
			icon: NotebookPen,
			href: "/dashboard/izin",
			color: "from-blue-500 to-indigo-500",
		},
		{
			title: "Ajukan Cuti",
			icon: Briefcase,
			href: "/dashboard/cuti",
			color: "from-purple-500 to-pink-500",
		},
		{
			title: "Perbaikan IT",
			icon: Ticket,
			href: "/dashboard/ticket",
			color: "from-indigo-500 to-blue-500",
		},
		{
			title: "Penugasan IT",
			icon: Users,
			href: "/dashboard/ticket-assignment",
			color: "from-green-500 to-emerald-500",
		},
		{
			title: "Rapat",
			icon: Users,
			href: "/dashboard/rapat",
			color: "from-green-500 to-emerald-500",
		},
		{
			title: "Pengajuan KTA",
			icon: IdCard,
			href: "/dashboard/pengajuan-kta",
			color: "from-green-500 to-emerald-500",
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
				<div className="flex gap-1.5 p-2 rounded-md bg-blue-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
					{actions.map((action) => (
						<button
							key={action.title}
							onClick={() => router.push(action.href)}
							className="flex-none w-[100px] group relative overflow-hidden rounded-lg p-0.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
						>
							<div className="relative bg-white/90 rounded-[7px] py-2 px-1">
								<div className="flex flex-col items-center gap-1.5">
									<div
										className={`rounded-md bg-gradient-to-br ${action.color} p-1.5 text-white`}
									>
										<action.icon className="w-4 h-4" />
									</div>
									<span className="font-medium text-gray-900 text-xs text-center leading-tight">
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
			title: "Monitoring Presensi",
			description: "Monitor presensi seluruh pegawai",
			icon: Users,
			href: "/dashboard/it/attendance-monitoring",
			color: "from-purple-500 to-violet-500",
		},
		{
			title: "Error Logs",
			description: "Monitor error aplikasi",
			icon: AlertTriangle,
			href: "/dashboard/admin/error-logs",
			color: "from-red-500 to-orange-500",
		},
		{
			title: "Location Settings",
			description: "Konfigurasi lokasi presensi",
			icon: MapPin,
			href: "/dashboard/admin/location-settings",
			color: "from-green-500 to-emerald-500",
		},
		{
			title: "Security Monitoring",
			description: "Monitor keamanan sistem",
			icon: Eye,
			href: "/dashboard/admin/security-monitoring",
			color: "from-indigo-500 to-blue-500",
		},
		{
			title: "System Settings",
			description: "Konfigurasi sistem",
			icon: Settings,
			href: "/dashboard/admin/settings",
			color: "from-gray-500 to-slate-500",
		},
	];

	return (
		<Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-orange-50">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<Shield className="w-5 h-5 text-red-500" />
					Admin Panel
				</CardTitle>
			</CardHeader>
			<CardContent className="relative">
				<div className="grid grid-cols-2 gap-3">
					{adminActions.map((action) => (
						<button
							key={action.title}
							onClick={() => router.push(action.href)}
							className="group relative overflow-hidden rounded-lg p-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
						>
							<div className="flex flex-col items-center gap-2">
								<div
									className={`rounded-lg bg-gradient-to-br ${action.color} p-2 text-white shadow-sm`}
								>
									<action.icon className="w-5 h-5" />
								</div>
								<div className="text-center">
									<span className="font-medium text-gray-900 text-sm block">
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

					// Check if user is from IT department
					const isIT =
						userData.jbtn?.toLowerCase().includes("it") ||
						userData.jbtn?.toLowerCase().includes("teknologi") ||
						userData.jbtn?.toLowerCase().includes("sistem") ||
						userData.departemen?.toLowerCase().includes("it") ||
						userData.departemen?.toLowerCase().includes("teknologi") ||
						userData.departemen?.toLowerCase().includes("sistem");

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
					userDepartment === "IT" && <AdminMenu />
				)}

				{/* Aksi Cepat */}
				<QuickActions />

				{/* Statistik Presensi */}
				<AttendanceStats />
			</div>
		</div>
	);
}
