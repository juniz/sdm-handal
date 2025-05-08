"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calendar, FileCheck } from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import { AttendanceStats } from "@/components/AttendanceStats";
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
		<div className="max-w-lg mx-auto space-y-4">
			{/* Profile dan Statistik */}
			<div className="space-y-4">
				{/* Kartu Pegawai */}
				<EmployeeCard />

				{/* Statistik Presensi */}
				<AttendanceStats />
			</div>

			{/* Aktivitas dan Pengumuman */}
			<div className="space-y-4">
				{/* Aktivitas Hari Ini */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-bold text-gray-900">
							Aktivitas Hari Ini
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{activities.map((activity, index) => (
								<div key={index} className="flex items-center">
									<div className="space-y-1">
										<p className="text-sm font-medium leading-none">
											{activity.event}
										</p>
										<p className="text-xs text-gray-500">
											{activity.time} - {activity.date}
										</p>
									</div>
									<div
										className={`ml-auto flex h-2.5 w-2.5 rounded-full ${
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

				{/* Pengumuman */}
				<Card className="bg-blue-50">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-bold text-blue-900">
							Pengumuman
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-blue-700">
							Rapat koordinasi bulanan akan diadakan pada tanggal 25 Juli 2024
							pukul 09:00 WIB di Ruang Rapat Utama.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
