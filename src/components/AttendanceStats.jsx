"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Check, Clock, AlertCircle, Calendar, Loader2 } from "lucide-react";

const DayStatus = ({ day, status }) => {
	const statusConfig = useMemo(() => {
		switch (status) {
			case "hadir":
				return {
					icon: Check,
					color: "bg-green-500",
				};
			case "sakit":
				return {
					icon: AlertCircle,
					color: "bg-orange-400",
				};
			case "izin":
				return {
					icon: Clock,
					color: "bg-blue-500",
				};
			case "terlambat":
				return {
					icon: Clock,
					color: "bg-yellow-500",
				};
			default:
				return {
					icon: Clock,
					color: "bg-gray-300",
				};
		}
	}, [status]);

	const Icon = statusConfig.icon;

	return (
		<div className="flex flex-col items-center">
			<div
				className={`w-10 h-10 ${statusConfig.color} rounded-full flex items-center justify-center mb-1`}
			>
				<Icon className="w-5 h-5 text-white" />
			</div>
			<span className="text-xs font-medium text-gray-600">{day}</span>
		</div>
	);
};

const StatBox = ({
	label,
	value,
	bgColor = "bg-blue-50",
	textColor = "text-blue-600",
}) => (
	<div className={`${bgColor} rounded-xl p-4`}>
		<p className={`text-2xl font-bold ${textColor} mb-1`}>{value}%</p>
		<p className={`text-sm ${textColor}`}>{label}</p>
	</div>
);

const days = {
	Mon: "Senin",
	Tue: "Selasa",
	Wed: "Rabu",
	Thu: "Kamis",
	Fri: "Jumat",
};

export function AttendanceStats() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [stats, setStats] = useState({
		daily: [],
		stats: {
			total: 0,
			onTime: 0,
			late: 0,
			leave: 0,
		},
	});

	const mapDays = useMemo(() => {
		return (day) => days[day] || day;
	}, []);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await fetch("/api/attendance/stats");
				const data = await response.json();

				if (data.error) {
					throw new Error(data.error);
				}

				setStats(data.data);
			} catch (error) {
				console.error("Error fetching stats:", error);
				setError(error.message);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, []);

	const statsContent = useMemo(() => {
		if (!stats) return null;

		return (
			<>
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-lg font-bold text-gray-900">
						Statistik Presensi Minggu Ini
					</h2>
					<Calendar className="w-5 h-5 text-gray-400" />
				</div>

				<div className="flex justify-between mb-6">
					{stats.daily.map((item, index) => (
						<DayStatus
							key={index}
							day={mapDays(item.day)}
							status={item.status}
						/>
					))}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<StatBox
						label="Total Kehadiran"
						value={stats.stats.total}
						bgColor="bg-blue-50"
						textColor="text-blue-600"
					/>
					<StatBox
						label="Tepat Waktu"
						value={stats.stats.onTime}
						bgColor="bg-green-50"
						textColor="text-green-600"
					/>
					<StatBox
						label="Terlambat"
						value={stats.stats.late}
						bgColor="bg-yellow-50"
						textColor="text-yellow-600"
					/>
					<StatBox
						label="Izin"
						value={stats.stats.leave}
						bgColor="bg-red-50"
						textColor="text-red-600"
					/>
				</div>
			</>
		);
	}, [stats, mapDays]);

	if (loading) {
		return (
			<Card className="p-5 bg-white">
				<div className="flex items-center justify-center h-[200px]">
					<div className="flex flex-col items-center gap-2">
						<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
						<p className="text-sm text-gray-500">
							Memuat statistik presensi...
						</p>
					</div>
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-5 bg-white">
				<div className="flex items-center justify-center h-[200px]">
					<div className="flex flex-col items-center gap-2 text-center">
						<AlertCircle className="w-8 h-8 text-red-500" />
						<p className="text-sm text-gray-500">{error}</p>
					</div>
				</div>
			</Card>
		);
	}

	return <Card className="p-5 bg-white">{statsContent}</Card>;
}
