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
		</div>
	);
}
