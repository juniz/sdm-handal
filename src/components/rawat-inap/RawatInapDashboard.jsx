"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Activity,
	Users,
	CalendarCheck,
	TrendingUp,
	TrendingDown,
	Filter,
} from "lucide-react";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RawatInapDashboard() {
	const [data, setData] = useState({
		patients: [],
		hourly_stats: [],
		comparison: {},
		last_updated: null,
	});
	const [loading, setLoading] = useState(true);
	const [roomFilter, setRoomFilter] = useState("");

	const fetchData = useCallback(async () => {
		try {
			const response = await fetch("/api/rawat-inap/dashboard");
			if (!response.ok) {
				throw new Error("Failed to fetch data");
			}
			const result = await response.json();
			setData(result);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();

		// Auto-refresh every 5 minutes
		const interval = setInterval(() => {
			fetchData();
		}, 5 * 60 * 1000);

		return () => clearInterval(interval);
	}, [fetchData]);

	// Comparison Indicators
	const getPercentageChange = (current, previous) => {
		if (!previous) return current > 0 ? 100 : 0;
		return ((current - previous) / previous) * 100;
	};

	const admissionsChange = getPercentageChange(
		data.comparison.admissions_today || 0,
		data.comparison.admissions_yesterday || 0,
	);

	const dischargesChange = getPercentageChange(
		data.comparison.discharges_today || 0,
		data.comparison.discharges_yesterday || 0,
	);

	// Filtered Patients for Table
	const filteredPatients = roomFilter
		? data.patients.filter((p) => p.kd_kamar === roomFilter)
		: data.patients.filter((p) => p.stts_pulang === "-");

	// Unique Rooms for Filter
	const uniqueRooms = [
		...new Set(
			data.patients.filter((p) => p.stts_pulang === "-").map((p) => p.kd_kamar),
		),
	].sort();

	// Prepare Chart Data
	// 1. Daily Trend Chart (Last 30 Days) - Total Active Patients
	const dailyCategories =
		data.daily_stats?.map((d) => {
			const date = new Date(d.date);
			return date.toLocaleDateString("id-ID", {
				day: "2-digit",
				month: "2-digit",
			});
		}) || [];

	const dailyActive = data.daily_stats?.map((d) => d.total_active) || [];

	const trendChartOptions = {
		chart: {
			type: "line",
			toolbar: {
				show: true,
				tools: {
					download: true,
					selection: true,
					zoom: true,
					zoomin: true,
					zoomout: true,
					pan: true,
					reset: true,
				},
				autoSelected: "zoom",
			},
			zoom: {
				enabled: true,
				type: "x",
				autoScaleYaxis: true,
			},
		},
		xaxis: {
			categories: dailyCategories,
			title: { text: "Tanggal" },
			tickAmount: 10, // Limit ticks to avoid clutter
		},
		yaxis: {
			title: { text: "Jumlah Pasien" },
		},
		stroke: { curve: "smooth", width: 3 },
		colors: ["#3b82f6"], // Blue color for single line
		dataLabels: { enabled: false },
		title: { text: "Tren Total Pasien Inap (30 Hari Terakhir)", align: "left" },
		legend: { position: "top" },
		tooltip: {
			x: {
				format: "dd/MM",
			},
			y: {
				formatter: function (val) {
					return val + " Pasien";
				},
			},
		},
		markers: {
			size: 4,
			hover: {
				size: 6,
			},
		},
	};

	const trendChartSeries = [{ name: "Total Pasien", data: dailyActive }];

	// 2. Payment Method Distribution (Pie Chart) - based on active patients
	const paymentDistribution = filteredPatients.reduce((acc, curr) => {
		const key = curr.penjab_nama || "Lainnya";
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});

	// Define consistent colors for common payment methods
	const paymentColorMap = {
		"BPJS KESEHATAN": "#10b981", // Green
		UMUM: "#3b82f6", // Blue
		"ASURANSI LAIN": "#f59e0b", // Amber
		"POLRI ANGGOTA": "#8b5cf6", // Purple
		"POLRI KELUARGA": "#ec4899", // Pink
		WATTAH: "#06b6d4", // Cyan
		"JASA RAHARJA": "#6366f1", // Indigo
		Lainnya: "#ef4444", // Red
	};

	const paymentLabels = Object.keys(paymentDistribution);
	const paymentSeries = Object.values(paymentDistribution);

	// Assign colors based on label, fallback to gray/random if not mapped
	const paymentColors = paymentLabels.map((label) => {
		// Check for partial matches or exact matches
		if (label.includes("BPJS")) return paymentColorMap["BPJS KESEHATAN"];
		if (label.includes("UMUM") || label.includes("PRIBADI"))
			return paymentColorMap["UMUM"];
		if (label.includes("POLRI") && label.includes("ANGGOTA"))
			return paymentColorMap["POLRI ANGGOTA"];
		if (label.includes("POLRI") && label.includes("KELUARGA"))
			return paymentColorMap["POLRI KELUARGA"];
		if (label.includes("WATTAH")) return paymentColorMap["WATTAH"];
		if (label.includes("JASA")) return paymentColorMap["JASA RAHARJA"];

		return paymentColorMap[label] || "#94a3b8"; // Default slate gray
	});

	const paymentChartOptions = {
		chart: { type: "donut" },
		labels: paymentLabels,
		colors: paymentColors,
		legend: {
			position: "bottom",
			formatter: function (seriesName, opts) {
				return (
					seriesName +
					" - (" +
					opts.w.globals.series[opts.seriesIndex] +
					") Pasien"
				);
			},
		},
		dataLabels: { enabled: true },
		title: { text: "Distribusi Cara Bayar (Aktif)", align: "center" },
		tooltip: {
			y: {
				formatter: function (val) {
					return "(" + val + ") Pasien";
				},
			},
		},
	};
	const paymentChartSeries = paymentSeries;

	// 3. Top Diagnoses (Bar Chart) - based on active patients
	const diagnosesCount = filteredPatients.reduce((acc, curr) => {
		const key = curr.diagnosa_awal || "Belum Ada Diagnosa";
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});
	const sortedDiagnoses = Object.entries(diagnosesCount)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	const diagnosisChartOptions = {
		chart: { type: "bar" },
		plotOptions: { bar: { borderRadius: 4, horizontal: true } },
		xaxis: { categories: sortedDiagnoses.map((d) => d[0]) },
		colors: ["#6366f1"],
		title: { text: "5 Diagnosa Terbanyak (Aktif)", align: "center" },
	};
	const diagnosisChartSeries = [
		{ name: "Pasien", data: sortedDiagnoses.map((d) => d[1]) },
	];

	if (loading) {
		return (
			<div className="p-8 text-center text-gray-500">
				Memuat data dashboard...
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 bg-gray-50 min-h-screen">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-gray-900">
						Dashboard Rawat Inap
					</h1>
					<p className="text-gray-500">
						Monitoring real-time hari ini:{" "}
						{new Date().toLocaleDateString("id-ID", {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>
				<div className="text-xs text-gray-400">
					Diperbarui:{" "}
					{data.last_updated
						? new Date(data.last_updated).toLocaleTimeString()
						: "-"}
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Pasien Dirawat
						</CardTitle>
						<Users className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.comparison?.total_active || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Pasien aktif saat ini
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Masuk Hari Ini
						</CardTitle>
						<Activity className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.comparison?.admissions_today || 0}
						</div>
						<div className="flex items-center text-xs mt-1">
							{admissionsChange >= 0 ? (
								<TrendingUp className="h-3 w-3 text-green-500 mr-1" />
							) : (
								<TrendingDown className="h-3 w-3 text-red-500 mr-1" />
							)}
							<span
								className={
									admissionsChange >= 0 ? "text-green-500" : "text-red-500"
								}
							>
								{Math.abs(admissionsChange).toFixed(1)}%
							</span>
							<span className="text-muted-foreground ml-1">vs kemarin</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pulang Hari Ini
						</CardTitle>
						<CalendarCheck className="h-4 w-4 text-orange-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.comparison?.discharges_today || 0}
						</div>
						<div className="flex items-center text-xs mt-1">
							{dischargesChange >= 0 ? (
								<TrendingUp className="h-3 w-3 text-green-500 mr-1" />
							) : (
								<TrendingDown className="h-3 w-3 text-red-500 mr-1" />
							)}
							<span
								className={
									dischargesChange >= 0 ? "text-green-500" : "text-red-500"
								}
							>
								{Math.abs(dischargesChange).toFixed(1)}%
							</span>
							<span className="text-muted-foreground ml-1">vs kemarin</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Estimasi Pendapatan
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-purple-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							Rp{" "}
							{(
								data.patients.reduce(
									(acc, curr) => acc + (curr.ttl_biaya || 0),
									0,
								) / 1000000
							).toFixed(1)}
							M
						</div>
						<p className="text-xs text-muted-foreground">
							Total tagihan (bulan ini)
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Section */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Tren Pasien (30 Hari Terakhir)</CardTitle>
						<CardDescription>
							Grafik jumlah total pasien rawat inap per hari. Gunakan fitur zoom
							untuk melihat detail periode tertentu.
						</CardDescription>
					</CardHeader>
					<CardContent className="pl-2">
						<Chart
							options={trendChartOptions}
							series={trendChartSeries}
							type="line"
							height={350}
						/>
					</CardContent>
				</Card>

				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Komposisi Penjamin</CardTitle>
						<CardDescription>
							Persentase pasien aktif berdasarkan cara bayar.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Chart
							options={paymentChartOptions}
							series={paymentChartSeries}
							type="donut"
							height={300}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Diagnosa Terbanyak</CardTitle>
						<CardDescription>
							Top 5 penyakit pasien aktif saat ini.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Chart
							options={diagnosisChartOptions}
							series={diagnosisChartSeries}
							type="bar"
							height={300}
						/>
					</CardContent>
				</Card>

				{/* Recent Patients Table / Room Detail */}
				<Card className="md:col-span-1">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Detail Pasien Per Ruangan</CardTitle>
								<CardDescription>
									Filter berdasarkan kode kamar/bangsal.
								</CardDescription>
							</div>
						</div>
						<div className="mt-2">
							<select
								className="w-full p-2 border rounded-md text-sm"
								value={roomFilter}
								onChange={(e) => setRoomFilter(e.target.value)}
							>
								<option value="">Semua Ruangan</option>
								{uniqueRooms.map((room) => (
									<option key={room} value={room}>
										{room}
									</option>
								))}
							</select>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4 max-h-[300px] overflow-y-auto">
							{filteredPatients.length > 0 ? (
								filteredPatients.slice(0, 10).map((patient, i) => (
									<div
										key={i}
										className="flex items-center justify-between border-b pb-2 last:border-0"
									>
										<div className="flex items-center gap-4">
											<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
												<UserIcon className="h-5 w-5 text-blue-600" />
											</div>
											<div className="space-y-1">
												<p className="text-sm font-medium leading-none">
													{patient.nm_pasien}
												</p>
												<p className="text-xs text-muted-foreground">
													{patient.no_rkm_medis} • {patient.kd_kamar}
												</p>
											</div>
										</div>
										<div className="text-sm font-medium text-gray-500">
											{patient.penjab_nama}
										</div>
									</div>
								))
							) : (
								<div className="text-sm text-gray-500 py-4 text-center">
									Tidak ada pasien ditemukan.
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Daftar Lengkap Pasien Rawat Inap</CardTitle>
					<CardDescription>
						Total {filteredPatients.length} pasien ditampilkan.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>No. Rawat</TableHead>
								<TableHead>No. RM</TableHead>
								<TableHead>Nama Pasien</TableHead>
								<TableHead>Kamar</TableHead>
								<TableHead>Tgl Masuk</TableHead>
								<TableHead>Penjamin</TableHead>
								<TableHead>Diagnosa Awal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredPatients.slice(0, 20).map((patient) => (
								<TableRow key={patient.no_rawat}>
									<TableCell className="font-medium">
										{patient.no_rawat}
									</TableCell>
									<TableCell>{patient.no_rkm_medis}</TableCell>
									<TableCell>{patient.nm_pasien}</TableCell>
									<TableCell>{patient.kd_kamar}</TableCell>
									<TableCell>{patient.tgl_masuk}</TableCell>
									<TableCell>{patient.penjab_nama}</TableCell>
									<TableCell>{patient.diagnosa_awal}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

function UserIcon({ className }) {
	return (
		<svg
			className={className}
			fill="none"
			height="24"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width="24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	);
}
