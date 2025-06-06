"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Ticket,
	NotebookPen,
	Briefcase,
	MenuIcon,
	BookOpen,
	Users,
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
			title: "Akreditasi",
			icon: BookOpen,
			href: "/dashboard/akreditasi",
			color: "from-rose-500 to-pink-500",
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

export default function DashboardPage() {
	return (
		<div className="max-w-lg mx-auto space-y-4">
			{/* Notifikasi Assignment Urgent */}
			<NotificationAlert />

			{/* Profile dan Statistik */}
			<div className="space-y-4">
				{/* Kartu Pegawai */}
				<EmployeeCard />

				{/* Aksi Cepat */}
				<QuickActions />

				{/* Statistik Presensi */}
				<AttendanceStats />
			</div>
		</div>
	);
}
