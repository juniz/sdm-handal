"use client";

import React, { useState, useEffect, useRef } from "react";
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
	CreditCard,
	UserCheck,
	Calendar,
	Clock,
	ArrowUpRight,
	Stethoscope,
	Building2,
	Filter,
	Check,
	X,
	ShieldCheck,
} from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RawatJalanDashboard() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Filter States
	const [allPolis, setAllPolis] = useState([]);
	const [selectedPoli, setSelectedPoli] = useState([]);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [tempSelectedPoli, setTempSelectedPoli] = useState([]);
	const filterRef = useRef(null);

	const fetchData = async (polis = []) => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams();
			polis.forEach((p) => params.append("poli", p));

			const response = await fetch(
				`/api/rawat-jalan/dashboard?${params.toString()}`,
			);
			if (response.ok) {
				const result = await response.json();
				setData(result);
				if (allPolis.length === 0 && result.all_poli) {
					setAllPolis(result.all_poli);
				}
			} else {
				throw new Error("Gagal mengambil data dari server");
			}
		} catch (error) {
			console.error("Failed to load dashboard data", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData(selectedPoli);
	}, [selectedPoli]);

	// Click outside to close filter
	useEffect(() => {
		function handleClickOutside(event) {
			if (filterRef.current && !filterRef.current.contains(event.target)) {
				setIsFilterOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const togglePoli = (kd_poli) => {
		setTempSelectedPoli((prev) =>
			prev.includes(kd_poli)
				? prev.filter((p) => p !== kd_poli)
				: [...prev, kd_poli],
		);
	};

	const applyFilter = () => {
		setSelectedPoli(tempSelectedPoli);
		setIsFilterOpen(false);
	};

	const resetFilter = () => {
		setTempSelectedPoli([]);
		setSelectedPoli([]);
		setIsFilterOpen(false);
	};

	const openFilter = () => {
		setTempSelectedPoli(selectedPoli);
		setIsFilterOpen(true);
	};

	if (loading && !data) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50/50">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
					<p className="text-sm font-medium text-slate-500">Memuat Data...</p>
				</div>
			</div>
		);
	}

	if (error && !data) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50/50">
				<div className="flex flex-col items-center gap-4 text-red-500">
					<p className="text-sm font-medium">Terjadi kesalahan: {error}</p>
					<button
						onClick={() => fetchData()}
						className="min-h-[44px] px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
					>
						Coba Lagi
					</button>
				</div>
			</div>
		);
	}

	// Charts Configuration
	const trendOptions = {
		chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit" },
		colors: ["#2563eb"],
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.4,
				opacityTo: 0.05,
				stops: [0, 90, 100],
			},
		},
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		xaxis: {
			categories:
				data?.trend.map((t) =>
					new Date(t.date).toLocaleDateString("id-ID", {
						day: "2-digit",
						month: "short",
					}),
				) || [],
			axisBorder: { show: false },
			axisTicks: { show: false },
			labels: {
				style: { fontSize: "12px" }, // Ensure readable on mobile
			},
		},
		yaxis: {
			show: true,
			labels: {
				style: { fontSize: "12px", fontWeight: 500, colors: "#64748b" },
				formatter: (value) => {
					return Math.round(value);
				},
			},
			title: {
				text: "Jumlah Kunjungan",
				style: { fontSize: "11px", fontWeight: 500, color: "#94a3b8" },
			},
		},
		grid: { show: true, borderColor: "#f1f5f9", strokeDashArray: 4 },
		tooltip: {
			theme: "light",
			y: { formatter: (val) => val + " Pasien" },
		},
	};

	const poliOptions = {
		chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
		colors: ["#0f172a"],
		plotOptions: {
			bar: { borderRadius: 4, horizontal: true, barHeight: "60%" },
		},
		dataLabels: {
			enabled: true,
			textAnchor: "start",
			style: { colors: ["#fff"], fontSize: "12px" },
			formatter: (val) => val,
			offsetX: 0,
		},
		xaxis: {
			categories: data?.top_poli.map((p) => p.nm_poli) || [],
			labels: { show: false },
			axisBorder: { show: false },
			axisTicks: { show: false },
		},
		yaxis: {
			labels: {
				style: { fontSize: "12px", fontWeight: 500, colors: "#64748b" },
				maxWidth: 100, // Limit width on mobile
			},
		},
		grid: { show: false },
		tooltip: { theme: "light" },
	};

	const statusOptions = {
		chart: { type: "donut", fontFamily: "inherit" },
		labels: data?.patient_type.map((p) => p.stts_daftar) || [],
		colors: ["#3b82f6", "#e2e8f0"],
		legend: { position: "bottom", fontSize: "14px" },
		dataLabels: { enabled: false },
		plotOptions: {
			pie: {
				donut: {
					size: "75%",
					labels: {
						show: true,
						total: {
							show: true,
							label: "Total",
							fontSize: "12px",
							color: "#64748b",
							formatter: () => data?.summary.total_visits,
						},
					},
				},
			},
		},
		stroke: { width: 0 },
	};

	// Guarantor Chart Configuration
	const guarantorColorMap = {
		"BPJS KESEHATAN": "#10b981", // Green
		UMUM: "#3b82f6", // Blue
		"ASURANSI LAIN": "#f59e0b", // Amber
		"POLRI ANGGOTA": "#8b5cf6", // Purple
		"POLRI KELUARGA": "#ec4899", // Pink
		WATTAH: "#06b6d4", // Cyan
		"JASA RAHARJA": "#6366f1", // Indigo
	};

	const guarantorLabels = data?.guarantor?.map((g) => g.penjamin) || [];
	const guarantorSeries = data?.guarantor?.map((g) => g.total) || [];

	const guarantorColors = guarantorLabels.map((label) => {
		if (label.includes("BPJS")) return guarantorColorMap["BPJS KESEHATAN"];
		if (label.includes("UMUM") || label.includes("PRIBADI"))
			return guarantorColorMap["UMUM"];
		if (label.includes("POLRI") && label.includes("ANGGOTA"))
			return guarantorColorMap["POLRI ANGGOTA"];
		if (label.includes("POLRI") && label.includes("KELUARGA"))
			return guarantorColorMap["POLRI KELUARGA"];
		if (label.includes("WATTAH")) return guarantorColorMap["WATTAH"];
		if (label.includes("JASA")) return guarantorColorMap["JASA RAHARJA"];
		return "#94a3b8"; // Default slate gray
	});

	const guarantorOptions = {
		chart: { type: "donut", fontFamily: "inherit" },
		labels: guarantorLabels,
		colors: guarantorColors,
		legend: {
			position: "bottom",
			fontSize: "14px",
			formatter: function (seriesName, opts) {
				return (
					seriesName +
					" - (" +
					opts.w.globals.series[opts.seriesIndex] +
					") Pasien"
				);
			},
			itemMargin: {
				horizontal: 5,
				vertical: 5,
			},
		},
		dataLabels: { enabled: false },
		plotOptions: {
			pie: {
				donut: {
					size: "70%",
				},
			},
		},
		stroke: { width: 2, colors: ["#fff"] },
		tooltip: {
			theme: "light",
			y: {
				formatter: function (val) {
					return "(" + val + ") Pasien";
				},
			},
		},
	};

	return (
		<div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 relative overflow-x-hidden">
			{/* Loading Overlay */}
			{loading && data && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
					<div className="flex items-center gap-3 px-4 py-2 bg-white shadow-lg rounded-full border border-slate-100">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
						<span className="text-sm font-medium text-slate-600">
							Memperbarui data...
						</span>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
						Dashboard Rawat Jalan
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Overview performa poliklinik & kunjungan hari ini.
					</p>
				</div>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
					{/* Filter Poliklinik */}
					<div className="relative" ref={filterRef}>
						<button
							onClick={isFilterOpen ? () => setIsFilterOpen(false) : openFilter}
							className={`w-full sm:w-auto min-h-[44px] flex items-center justify-center sm:justify-start gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
								selectedPoli.length > 0
									? "border-blue-200 bg-blue-50 text-blue-700"
									: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
							}`}
						>
							<Filter className="h-4 w-4" />
							<span>Filter Poliklinik</span>
							{selectedPoli.length > 0 && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
									{selectedPoli.length}
								</span>
							)}
						</button>

						{isFilterOpen && (
							<div className="absolute right-0 top-full mt-2 w-full sm:w-72 z-50 rounded-xl border border-slate-200 bg-white shadow-xl origin-top-right animate-in fade-in zoom-in-95 duration-200">
								<div className="p-4 border-b border-slate-100">
									<div className="flex items-center justify-between mb-3">
										<h3 className="font-semibold text-slate-900 text-sm md:text-base">
											Pilih Poliklinik
										</h3>
										<button
											onClick={() => setIsFilterOpen(false)}
											className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
									<label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
										<div
											className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
												tempSelectedPoli.length === 0
													? "border-blue-600 bg-blue-600"
													: "border-slate-300 group-hover:border-blue-400 bg-white"
											}`}
										>
											{tempSelectedPoli.length === 0 && (
												<Check className="h-3.5 w-3.5 text-white" />
											)}
										</div>
										<span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
											Semua Poliklinik
										</span>
										{/* Hidden input to allow clicking to trigger reset temp state */}
										<input
											type="checkbox"
											className="hidden"
											checked={tempSelectedPoli.length === 0}
											onChange={() => setTempSelectedPoli([])}
										/>
									</label>
								</div>

								<div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
									{allPolis.map((poli) => {
										const isSelected = tempSelectedPoli.includes(poli.kd_poli);
										return (
											<label
												key={poli.kd_poli}
												className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg min-h-[44px]"
											>
												<div
													className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
														isSelected
															? "border-blue-600 bg-blue-600"
															: "border-slate-300 group-hover:border-blue-400 bg-white"
													}`}
												>
													{isSelected && (
														<Check className="h-3.5 w-3.5 text-white" />
													)}
												</div>
												<span className="text-sm text-slate-600 group-hover:text-slate-900">
													{poli.nm_poli}
												</span>
												<input
													type="checkbox"
													className="hidden"
													checked={isSelected}
													onChange={() => togglePoli(poli.kd_poli)}
												/>
											</label>
										);
									})}
								</div>

								<div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-b-xl">
									<button
										onClick={resetFilter}
										className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors min-h-[44px] px-2"
									>
										Reset
									</button>
									<button
										onClick={applyFilter}
										className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors min-h-[44px]"
									>
										Terapkan
									</button>
								</div>
							</div>
						)}
					</div>

					<div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm min-h-[44px]">
						<Calendar className="h-4 w-4" />
						<span>
							{new Date().toLocaleDateString("id-ID", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</span>
					</div>
					<button className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors min-h-[44px] w-full sm:w-auto">
						Export
					</button>
				</div>
			</div>

			{/* KPI Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<KpiCard
					title="Total Kunjungan"
					value={data?.summary.total_visits}
					icon={Users}
					trend="+12.5%"
					trendUp={true}
					description="vs kemarin"
				/>
				<KpiCard
					title="Pasien Terlayani"
					value={data?.summary.served_patients}
					icon={UserCheck}
					trend="98.2%"
					trendLabel="Rate"
					color="emerald"
				/>
				<KpiCard
					title="Pendapatan Harian"
					value={`Rp ${(data?.summary.total_revenue || 0).toLocaleString(
						"id-ID",
					)}`}
					icon={CreditCard}
					trend="+5.2%"
					trendUp={true}
					description="Estimasi"
				/>
				<KpiCard
					title="Rata-rata Tunggu"
					value="24m"
					icon={Clock}
					trend="-2m"
					trendUp={true}
					description="vs target"
					color="orange"
				/>
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-8">
				{/* Visit Trend Chart */}
				<Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
					<CardHeader className="p-4 md:p-6 pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base font-semibold text-slate-900">
									Tren Kunjungan Pasien
								</CardTitle>
								<CardDescription className="text-xs md:text-sm">
									Grafik jumlah registrasi 7 hari terakhir.
								</CardDescription>
							</div>
							<Activity className="h-4 w-4 text-slate-400" />
						</div>
					</CardHeader>
					<CardContent className="p-4 md:p-6 pt-0">
						<div className="mt-4">
							<Chart
								options={trendOptions}
								series={[
									{
										name: "Kunjungan",
										data: data?.trend.map((t) => t.total) || [],
									},
								]}
								type="area"
								height={300}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Guarantor Composition Chart */}
				<Card className="border-slate-200 shadow-sm overflow-hidden">
					<CardHeader className="p-4 md:p-6 pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base font-semibold text-slate-900">
									Komposisi Penjamin
								</CardTitle>
								<CardDescription className="text-xs md:text-sm">
									Persentase pasien berdasarkan cara bayar.
								</CardDescription>
							</div>
							<ShieldCheck className="h-4 w-4 text-slate-400" />
						</div>
					</CardHeader>
					<CardContent className="p-4 md:p-6 pt-0">
						<div className="flex h-[300px] items-center justify-center mt-4">
							<Chart
								options={guarantorOptions}
								series={guarantorSeries}
								type="donut"
								width="100%"
								height="100%"
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Secondary Grid */}
			<div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
				{/* Patient Demographics */}
				<Card className="border-slate-200 shadow-sm overflow-hidden">
					<CardHeader className="p-4 md:p-6 pb-2">
						<CardTitle className="text-base font-semibold text-slate-900">
							Demografi Pasien
						</CardTitle>
						<CardDescription className="text-xs md:text-sm">
							Status pasien lama vs baru.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 md:p-6 pt-0">
						<div className="flex h-[300px] items-center justify-center mt-4">
							<Chart
								options={statusOptions}
								series={data?.patient_type.map((p) => p.total) || []}
								type="donut"
								width="100%"
								height="100%"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Top Polyclinics */}
				<Card className="border-slate-200 shadow-sm lg:col-span-1 overflow-hidden">
					<CardHeader className="p-4 md:p-6 pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base font-semibold text-slate-900">
									Top 5 Poliklinik
								</CardTitle>
								<CardDescription className="text-xs md:text-sm">
									Poliklinik dengan kunjungan tertinggi hari ini.
								</CardDescription>
							</div>
							<Building2 className="h-4 w-4 text-slate-400" />
						</div>
					</CardHeader>
					<CardContent className="p-4 md:p-6 pt-0">
						<div className="mt-4">
							<Chart
								options={poliOptions}
								series={[
									{
										name: "Pasien",
										data: data?.top_poli.map((p) => p.total) || [],
									},
								]}
								type="bar"
								height={300}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Doctor Performance */}
				<Card className="border-slate-200 shadow-sm overflow-hidden">
					<CardHeader className="p-4 md:p-6 pb-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base font-semibold text-slate-900">
									Performa Dokter
								</CardTitle>
								<CardDescription className="text-xs md:text-sm">
									Jumlah pasien yang ditangani per dokter.
								</CardDescription>
							</div>
							<Stethoscope className="h-4 w-4 text-slate-400" />
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="mt-4 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent border-b border-slate-100">
										<TableHead className="w-[50px] pl-6 h-10 text-xs md:text-sm">
											#
										</TableHead>
										<TableHead className="h-10 text-xs md:text-sm min-w-[150px]">
											Nama Dokter
										</TableHead>
										<TableHead className="text-right h-10 text-xs md:text-sm">
											Pasien
										</TableHead>
										<TableHead className="text-right pr-6 h-10 text-xs md:text-sm">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.top_doctors.map((doc, i) => (
										<TableRow
											key={i}
											className="hover:bg-slate-50 border-b border-slate-50 last:border-0"
										>
											<TableCell className="font-medium text-slate-500 pl-6 py-3 text-xs md:text-sm">
												{i + 1}
											</TableCell>
											<TableCell className="font-medium text-slate-900 py-3 text-xs md:text-sm">
												{doc.nm_dokter}
											</TableCell>
											<TableCell className="text-right font-bold text-slate-700 py-3 text-xs md:text-sm">
												{doc.total}
											</TableCell>
											<TableCell className="text-right pr-6 py-3">
												<span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] md:text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
													Aktif
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
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
}) {
	const colorStyles = {
		blue: "text-blue-600 bg-blue-50",
		emerald: "text-emerald-600 bg-emerald-50",
		orange: "text-orange-600 bg-orange-50",
	};

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
								trendUp ? "text-emerald-600" : "text-slate-500"
							}`}
						>
							{trendUp && <ArrowUpRight className="mr-1 h-3 w-3" />}
							{trend}
							{trendLabel && (
								<span className="ml-1 text-slate-400">{trendLabel}</span>
							)}
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
