"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calendar, FileCheck } from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";

const stats = [
	{
		title: "Total Presensi Bulan Ini",
		value: "21/22",
		icon: Clock,
		description: "95.5% Kehadiran",
		trend: "up",
	},
	{
		title: "Pegawai Aktif",
		value: "150",
		icon: Users,
		description: "Dari 155 Total Pegawai",
		trend: "neutral",
	},
	{
		title: "Cuti Tersedia",
		value: "12",
		icon: Calendar,
		description: "Hari Cuti Tersisa",
		trend: "down",
	},
	{
		title: "Laporan Pending",
		value: "3",
		icon: FileCheck,
		description: "Menunggu Persetujuan",
		trend: "up",
	},
];

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

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			{/* Kartu Pegawai */}
			<div className="w-full max-w-md flex justify-center">
				<EmployeeCard />
			</div>

			{/* Aktivitas Hari Ini */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Aktivitas Hari Ini</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-8">
							{activities.map((activity, index) => (
								<div key={index} className="flex items-center">
									<div className="space-y-1">
										<p className="text-sm font-medium leading-none">
											{activity.event}
										</p>
										<p className="text-sm text-muted-foreground">
											{activity.time} - {activity.date}
										</p>
									</div>
									<div
										className={`ml-auto flex h-2 w-2 rounded-full ${
											activity.status === "success"
												? "bg-green-500"
												: activity.status === "ongoing"
												? "bg-blue-500"
												: "bg-yellow-500"
										}`}
									/>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Pengumuman atau Informasi Penting */}
				<Card className="bg-blue-50">
					<CardHeader>
						<CardTitle className="text-blue-800">Pengumuman</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-blue-600">
							Rapat koordinasi bulanan akan diadakan pada tanggal 25 Juli 2024
							pukul 09:00 WIB di Ruang Rapat Utama.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
