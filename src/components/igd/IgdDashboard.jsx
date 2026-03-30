"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
	Activity,
	Users,
	Clock,
	AlertTriangle,
	BedDouble,
	HeartPulse,
	Calendar,
	Filter,
	Download,
	ChevronDown,
	ArrowUpRight,
	ArrowDownRight,
	Stethoscope,
	FileText,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function IgdDashboard() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [selectedShift, setSelectedShift] = useState(""); // "", "Pagi", "Siang", "Malam"

	const fetchData = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (selectedDate) params.append("date", selectedDate);
			if (selectedShift) params.append("shift", selectedShift);

			const response = await fetch(`/api/igd/dashboard?${params.toString()}`);
			if (response.ok) {
				const result = await response.json();
				setData(result);
			} else {
				throw new Error("Gagal mengambil data dashboard");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, 60000); // Auto refresh every 1 minute
		return () => clearInterval(interval);
	}, [selectedDate, selectedShift]);

	// Chart Options
	const hourlyOptions = {
		chart: {
			type: "area",
			toolbar: { show: false },
			fontFamily: "inherit",
			animations: { enabled: true },
		},
		colors: ["#2563eb"],
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.4,
				opacityTo: 0.05,
				stops: [0, 100],
			},
		},
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		xaxis: {
			categories: data?.hourly_trend?.map((h) => `${h.hour}:00`) || [],
			labels: { style: { fontSize: "12px", colors: "#64748b" } },
			axisBorder: { show: false },
			axisTicks: { show: false },
		},
		yaxis: {
			show: true,
			labels: { style: { fontSize: "12px", colors: "#64748b" } },
		},
		grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
		tooltip: { theme: "light" },
	};

	const statusOptions = {
		chart: { type: "donut", fontFamily: "inherit" },
		labels: data?.patient_status?.map((s) => s.status) || [],
		colors: ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"],
		legend: { position: "bottom" },
		plotOptions: {
			pie: {
				donut: {
					size: "70%",
					labels: {
						show: true,
						total: {
							show: true,
							label: "Total",
							formatter: () => data?.summary?.total_visits || 0,
						},
					},
				},
			},
		},
		stroke: { show: false },
	};

	const diagnosisOptions = {
		chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
		colors: ["#334155"],
		plotOptions: {
			bar: { borderRadius: 4, horizontal: true, barHeight: "60%" },
		},
		dataLabels: { enabled: true, textAnchor: "start", offsetX: 0 },
		xaxis: {
			categories: data?.top_diagnoses?.map((d) => d.diagnosis) || [],
			labels: { show: false },
		},
		yaxis: {
			labels: { style: { fontSize: "12px", colors: "#64748b" }, maxWidth: 200 },
		},
		grid: { show: false },
		tooltip: { theme: "light" },
	};

	if (loading && !data) {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-50">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
					<p className="text-sm font-medium text-slate-500">
						Memuat Dashboard IGD...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
			{/* Header */}
			<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
						<Activity className="h-6 w-6 text-red-600" />
						Instalasi Gawat Darurat (IGD)
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Real-time monitoring performa layanan gawat darurat.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative">
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<select
						value={selectedShift}
						onChange={(e) => setSelectedShift(e.target.value)}
						className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="">Semua Shift</option>
						<option value="Pagi">Shift Pagi (07-14)</option>
						<option value="Siang">Shift Siang (14-21)</option>
						<option value="Malam">Shift Malam (21-07)</option>
					</select>
					<button
						onClick={() => {
							const rows = [
								["Laporan Harian IGD", selectedDate],
								[],
								["Ringkasan Eksekutif"],
								["Total Kunjungan", data?.summary?.total_visits],
								["Pasien Terlayani", data?.summary?.served_patients],
								["Pasien Kritis", data?.summary?.critical_patients],
								["Rata-rata Waktu Tunggu (menit)", data?.summary?.avg_wait_time],
								[],
								["Tren Kunjungan Harian (7 Hari Terakhir)"],
								["Tanggal", "Jumlah Pasien"],
								...(data?.daily_trend?.map((d) => [d.date, d.total]) || []),
							];

							const csvContent =
								"data:text/csv;charset=utf-8," +
								rows.map((e) => e.join(",")).join("\n");
							const encodedUri = encodeURI(csvContent);
							const link = document.createElement("a");
							link.setAttribute("href", encodedUri);
							link.setAttribute("download", `laporan_igd_${selectedDate}.csv`);
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
						}}
						className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors"
					>
						<Download className="h-4 w-4" />
						Export Laporan
					</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
				<KpiCard
					title="Pasien Masuk"
					value={data?.summary?.total_visits || 0}
					icon={Users}
					trend="+5%"
					trendUp={true}
					color="blue"
				/>
				<KpiCard
					title="Waktu Tunggu (Avg)"
					value={`${Math.round(data?.summary?.avg_wait_time || 0)} menit`}
					icon={Clock}
					trend="-2m"
					trendUp={true}
					color="orange"
					inverseTrend={true} // Lower is better
				/>
				<KpiCard
					title="Pasien Kritis/Dirawat"
					value={data?.summary?.critical_patients || 0}
					icon={AlertTriangle}
					trend="12%"
					trendLabel="Rasio"
					color="red"
				/>
				<KpiCard
					title="Okupasi Bed (Est)"
					value={`${Math.round(
						((data?.summary?.bed_occupancy?.occupied || 0) /
							(data?.summary?.bed_occupancy?.total || 1)) *
							100,
					)}%`}
					icon={BedDouble}
					description={`${data?.summary?.bed_occupancy?.occupied || 0} / ${
						data?.summary?.bed_occupancy?.total || 0
					} Terisi`}
					color="indigo"
				/>
				<KpiCard
					title="Kepuasan Pasien"
					value={data?.summary?.patient_satisfaction?.score || 0}
					icon={HeartPulse}
					trend="4.5/5"
					trendLabel="Score"
					color="emerald"
				/>
			</div>

			{/* Main Grid */}
			<div className="grid gap-6 lg:grid-cols-3 mb-8">
				{/* Hourly Trend */}
				<Card className="lg:col-span-2 border-slate-200 shadow-sm">
					<CardHeader className="p-6 pb-2">
						<CardTitle className="text-base font-semibold text-slate-900">
							Tren Kunjungan Jam {selectedShift || "Harian"}
						</CardTitle>
						<CardDescription>
							Distribusi kedatangan pasien per jam.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="mt-4">
							<Chart
								options={hourlyOptions}
								series={[
									{
										name: "Pasien",
										data: data?.hourly_trend?.map((h) => h.total) || [],
									},
								]}
								type="area"
								height={300}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Executive Summary */}
				<Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
					<CardHeader className="p-6 pb-2">
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-blue-600" />
							<CardTitle className="text-base font-semibold text-slate-900">
								Executive Summary
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="p-6">
						<div className="space-y-4">
							<div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
								<h4 className="text-sm font-semibold text-blue-800 mb-1">
									Status Operasional
								</h4>
								<p className="text-sm text-blue-700 leading-relaxed">
									Kunjungan IGD hari ini mencapai{" "}
									<strong>{data?.summary?.total_visits} pasien</strong>. Waktu
									tunggu rata-rata{" "}
									<strong>
										{Math.round(data?.summary?.avg_wait_time || 0)} menit
									</strong>
									, {data?.summary?.avg_wait_time > 20 ? "di atas" : "di bawah"}{" "}
									target standar pelayanan (20 menit).
								</p>
							</div>
							<div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
								<h4 className="text-sm font-semibold text-slate-800 mb-1">
									Bed Capacity Alert
								</h4>
								<p className="text-sm text-slate-600 leading-relaxed">
									Tingkat hunian bed IGD saat ini{" "}
									<strong>
										{Math.round(
											((data?.summary?.bed_occupancy?.occupied || 0) /
												(data?.summary?.bed_occupancy?.total || 1)) *
												100,
										)}
										%
									</strong>
									. Kapasitas {data?.summary?.bed_occupancy?.occupied > 15 ? "HAMPIR PENUH" : "AMAN"}.
								</p>
							</div>
							<div className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100 flex justify-between">
								<span>Generated by SDM AI System</span>
								<span>
									Last update:{" "}
									{new Date(data?.last_updated).toLocaleTimeString()}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Secondary Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Top Diagnoses */}
				<Card className="border-slate-200 shadow-sm lg:col-span-1">
					<CardHeader className="p-6 pb-2">
						<CardTitle className="text-base font-semibold text-slate-900">
							Top 5 Diagnosa
						</CardTitle>
						<CardDescription>Penyakit terbanyak ditangani.</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="mt-4">
							<Chart
								options={diagnosisOptions}
								series={[
									{
										name: "Kasus",
										data: data?.top_diagnoses?.map((d) => d.total) || [],
									},
								]}
								type="bar"
								height={300}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Patient Status / Triage */}
				<Card className="border-slate-200 shadow-sm lg:col-span-1">
					<CardHeader className="p-6 pb-2">
						<CardTitle className="text-base font-semibold text-slate-900">
							Status Pulang / Triage
						</CardTitle>
						<CardDescription>Distribusi output pelayanan.</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="flex h-[300px] items-center justify-center mt-4">
							<Chart
								options={statusOptions}
								series={data?.patient_status?.map((s) => s.total) || []}
								type="donut"
								width="100%"
								height="100%"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Doctor Performance Table (Simulated for now, reused layout) */}
				<Card className="border-slate-200 shadow-sm lg:col-span-1">
					<CardHeader className="p-6 pb-2">
						<CardTitle className="text-base font-semibold text-slate-900">
							Jadwal Dokter Jaga
						</CardTitle>
						<CardDescription>Tim medis yang bertugas.</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<div className="mt-4 overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="bg-slate-50 text-slate-500 font-medium">
									<tr>
										<th className="px-6 py-3">Nama Dokter</th>
										<th className="px-6 py-3 text-right">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{[
										"dr. Budi Santoso",
										"dr. Siti Aminah",
										"dr. Andi Wijaya",
									].map((doc, i) => (
										<tr key={i} className="hover:bg-slate-50">
											<td className="px-6 py-3 font-medium text-slate-900">
												{doc}
											</td>
											<td className="px-6 py-3 text-right">
												<span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
													Standby
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function KpiCard({
	title,
	value,
	icon: Icon,
	trend,
	trendUp,
	trendLabel,
	description,
	color = "blue",
	inverseTrend = false,
}) {
	const colorStyles = {
		blue: "text-blue-600 bg-blue-50",
		emerald: "text-emerald-600 bg-emerald-50",
		orange: "text-orange-600 bg-orange-50",
		red: "text-red-600 bg-red-50",
		indigo: "text-indigo-600 bg-indigo-50",
	};

	const isPositive = inverseTrend ? !trendUp : trendUp;

	return (
		<Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
			<CardContent className="mt-4 p-4 md:p-6">
				<div className="flex items-center justify-between mb-4">
					<div
						className={`rounded-lg p-2 ${
							colorStyles[color] || colorStyles.blue
						}`}
					>
						<Icon className="h-5 w-5" />
					</div>
					{trend && (
						<div
							className={`flex items-center text-xs font-medium ${
								isPositive ? "text-emerald-600" : "text-red-600"
							}`}
						>
							{isPositive ? (
								<ArrowUpRight className="mr-1 h-3 w-3" />
							) : (
								<ArrowDownRight className="mr-1 h-3 w-3" />
							)}
							{trend}
						</div>
					)}
				</div>
				<div>
					<h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-none mb-1">
						{value}
					</h3>
					<p className="text-xs md:text-sm font-medium text-slate-500">
						{title}
					</p>
					{description && (
						<p className="mt-1 text-[10px] md:text-xs text-slate-400">
							{description}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
