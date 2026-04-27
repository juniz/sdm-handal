"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
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
	Clock,
	Calendar,
	Search,
	ArrowUpRight,
	ArrowDownRight,
	CheckCircle,
	Shield,
	User,
	ChevronRight,
	MapPin,
	FileText,
	Info,
} from "lucide-react";
import { useRealTime } from "@/hooks/useRealTime";
import moment from "moment";
import "moment/locale/id";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RawatInapDashboard() {
	const { formattedTime, formattedDate } = useRealTime();
	const [data, setData] = useState({
		patients: [],
		hourly_stats: [],
		comparison: {},
		last_updated: null,
	});
	const [loading, setLoading] = useState(true);
	const [roomFilter, setRoomFilter] = useState("");
	const [searchQuery, setSearchQuery] = useState("");

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

	const admissionsChange = useMemo(() => getPercentageChange(
		data.comparison.admissions_today || 0,
		data.comparison.admissions_yesterday || 0,
	), [data.comparison]);

	const dischargesChange = useMemo(() => getPercentageChange(
		data.comparison.discharges_today || 0,
		data.comparison.discharges_yesterday || 0,
	), [data.comparison]);

	// Filtered Patients for Table
	const filteredPatients = useMemo(() => {
		let result = [...data.patients];
		
		// Priority: Active patients first if no room filter
		if (!roomFilter) {
			result = result.filter((p) => p.stts_pulang === "-");
		} else {
			result = result.filter((p) => p.kd_kamar === roomFilter);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(p) =>
					p.nm_pasien?.toLowerCase().includes(query) ||
					p.no_rkm_medis?.toLowerCase().includes(query) ||
					p.no_rawat?.toLowerCase().includes(query)
			);
		}

		return result;
	}, [data.patients, roomFilter, searchQuery]);

	// Unique Rooms for Filter
	const uniqueRooms = useMemo(() => [
		...new Set(
			data.patients.filter((p) => p.stts_pulang === "-").map((p) => p.kd_kamar),
		),
	].sort(), [data.patients]);

	// Prepare Chart Data
	const trendChartOptions = useMemo(() => {
		const dailyCategories = data.daily_stats?.map((d) => {
			const date = new Date(d.date);
			return date.toLocaleDateString("id-ID", {
				day: "2-digit",
				month: "2-digit",
			});
		}) || [];

		return {
			chart: {
				type: "area",
				fontFamily: "inherit",
				toolbar: { show: false },
				animations: {
					enabled: true,
					easing: "easeinout",
					speed: 800,
				},
			},
			fill: {
				type: "gradient",
				gradient: {
					shadeIntensity: 1,
					opacityFrom: 0.45,
					opacityTo: 0.05,
					stops: [20, 100, 100, 100]
				}
			},
			xaxis: {
				categories: dailyCategories,
				axisBorder: { show: false },
				axisTicks: { show: false },
				tickAmount: 8,
			},
			yaxis: {
				labels: {
					formatter: (val) => Math.floor(val),
				},
			},
			stroke: { curve: "smooth", width: 3 },
			colors: ["#0093dd"],
			dataLabels: { enabled: false },
			grid: {
				borderColor: "#f1f1f1",
				strokeDashArray: 4,
				padding: { left: 20, right: 20 }
			},
			tooltip: {
				theme: "light",
				y: {
					formatter: (val) => `${val} Pasien`,
				},
			},
		};
	}, [data.daily_stats]);

	const trendChartSeries = useMemo(() => [
		{ 
			name: "Total Pasien", 
			data: data.daily_stats?.map((d) => d.total_active) || [] 
		}
	], [data.daily_stats]);

	// Payment Distribution Data
	const paymentData = useMemo(() => {
		const distribution = filteredPatients.reduce((acc, curr) => {
			const key = curr.penjab_nama || "Lainnya";
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		const labels = Object.keys(distribution);
		const series = Object.values(distribution);
		
		const colorMap = {
			"BPJS KESEHATAN": "#10b981", 
			UMUM: "#0093dd",
			"ASURANSI LAIN": "#f59e0b",
			"POLRI ANGGOTA": "#8b5cf6",
			Lainnya: "#94a3b8",
		};

		const colors = labels.map((label) => {
			if (label.includes("BPJS")) return colorMap["BPJS KESEHATAN"];
			if (label.includes("UMUM") || label.includes("PRIBADI")) return colorMap["UMUM"];
			return colorMap[label] || colorMap["Lainnya"];
		});

		return { labels, series, colors };
	}, [filteredPatients]);

	const paymentChartOptions = {
		chart: { type: "donut", fontFamily: "inherit" },
		labels: paymentData.labels,
		colors: paymentData.colors,
		stroke: { width: 0 },
		plotOptions: {
			pie: {
				donut: {
					size: "75%",
					labels: {
						show: true,
						total: {
							show: true,
							label: "Total Pasien",
							formatter: () => filteredPatients.length
						}
					}
				}
			}
		},
		legend: { position: "bottom" },
		dataLabels: { enabled: false },
	};

	// Top Diagnoses Data
	const diagnosisData = useMemo(() => {
		const counts = filteredPatients.reduce((acc, curr) => {
			const key = curr.diagnosa_awal || "Belum Ada Diagnosa";
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	}, [filteredPatients]);

	const diagnosisChartOptions = {
		chart: { type: "bar", fontFamily: "inherit", toolbar: { show: false } },
		plotOptions: { 
			bar: { 
				borderRadius: 8, 
				horizontal: true,
				barHeight: "60%",
				distributed: true
			} 
		},
		grid: { show: false },
		xaxis: { 
			categories: diagnosisData.map((d) => d[0].substring(0, 20) + (d[0].length > 20 ? "..." : "")),
			labels: { show: false },
			axisBorder: { show: false },
			axisTicks: { show: false }
		},
		colors: ["#6366f1", "#0093dd", "#10b981", "#f59e0b", "#ec4899"],
		legend: { show: false },
		dataLabels: {
			enabled: true,
			textAnchor: "start",
			style: { colors: ["#fff"] },
			formatter: (val, opt) => `${opt.w.globals.labels[opt.dataPointIndex]}: ${val}`,
			offsetX: 0,
		},
	};
	const diagnosisChartSeries = [
		{ name: "Pasien", data: diagnosisData.map((d) => d[1]) },
	];

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
				<div className="text-center space-y-4">
					<div className="w-16 h-16 border-4 border-[#0093dd] border-t-transparent rounded-full animate-spin mx-auto"></div>
					<p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Menyinkronkan Data Command Center...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] pb-12 font-sans selection:bg-blue-100">
			{/* Premium Glassmorphic Header */}
			<div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
				<div className="max-w-[1600px] mx-auto px-6 py-4">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0093dd] to-[#00b4ff] flex items-center justify-center shadow-lg shadow-blue-200">
								<Activity className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Command Center Rawat Inap</h1>
								<div className="flex items-center gap-2 mt-1.5">
									<div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100 overflow-hidden">
										<div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
										<span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Sistem Live</span>
									</div>
									<span className="text-xs text-gray-400 font-medium">Diperbarui: {data.last_updated ? moment(data.last_updated).format("HH:mm:ss") : "-"}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-6">
							<div className="hidden lg:flex items-center gap-4 py-2 px-4 bg-gray-50 rounded-2xl border border-gray-100">
								<div className="flex flex-col items-end">
									<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Waktu Lokal</span>
									<span className="text-sm font-bold text-gray-700 leading-none">{formattedTime}</span>
								</div>
								<div className="w-px h-8 bg-gray-200"></div>
								<div className="flex flex-col">
									<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tanggal</span>
									<span className="text-sm font-bold text-gray-700 leading-none">{formattedDate}</span>
								</div>
							</div>

							<div className="relative w-full md:w-64 group">
								<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0093dd] transition-colors" />
								<input 
									type="text"
									placeholder="Cari pasien atau no. RM..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0093dd] transition-all outline-none"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
				{/* KPI Cards Section */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<KPICard 
						title="Total Pasien" 
						value={data.comparison?.total_active || 0}
						subValue="Pasien aktif saat ini"
						icon={<Users className="w-6 h-6" />}
						color="blue"
						delay={0}
					/>
					<KPICard 
						title="Masuk Hari Ini" 
						value={data.comparison?.admissions_today || 0}
						change={admissionsChange}
						icon={<Activity className="w-6 h-6" />}
						color="green"
						delay={0.1}
					/>
					<KPICard 
						title="Pulang Hari Ini" 
						value={data.comparison?.discharges_today || 0}
						change={dischargesChange}
						icon={<CalendarCheck className="w-6 h-6" />}
						color="orange"
						delay={0.2}
					/>
					<KPICard 
						title="Estimasi Pendapatan" 
						value={`Rp ${(data.patients.reduce((acc, curr) => acc + (curr.ttl_biaya || 0), 0) / 1000000).toFixed(1)}M`}
						subValue="Akumulasi tagihan bulan ini"
						icon={<TrendingUp className="w-6 h-6" />}
						color="purple"
						delay={0.3}
					/>
				</div>

				{/* Visualizations Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Main Trend Chart */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
					>
						<div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 group-hover:scale-110 transition-transform duration-700"></div>
						<div className="relative">
							<div className="flex items-center justify-between mb-8">
								<div>
									<h3 className="text-xl font-black text-gray-900 tracking-tight">Tren Okupansi Pasien</h3>
									<p className="text-xs text-gray-500 font-medium">Monitoring pergerakan harian dalam 30 hari terakhir</p>
								</div>
								<div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
									<div className="w-2 h-2 bg-[#0093dd] rounded-full"></div>
									<span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Active Patients</span>
								</div>
							</div>
							<Chart
								options={trendChartOptions}
								series={trendChartSeries}
								type="area"
								height={320}
							/>
						</div>
					</motion.div>

					{/* Distribution Chart */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"
					>
						<h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 text-center">Analisis Penjamin</h3>
						<p className="text-xs text-center text-gray-500 font-medium mb-8">Distribusi metode pembayaran pasien</p>
						<div className="flex flex-col items-center">
							<Chart
								options={paymentChartOptions}
								series={paymentData.series}
								type="donut"
								width="100%"
								height={320}
							/>
						</div>
					</motion.div>

					{/* Top Diagnosis / Table Info */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="lg:col-span-5 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"
					>
						<div className="flex items-center gap-3 mb-8">
							<div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
								<Shield className="w-5 h-5 text-indigo-600" />
							</div>
							<h3 className="text-xl font-black text-gray-900 tracking-tight">Diagnosis Utama</h3>
						</div>
						<Chart
							options={diagnosisChartOptions}
							series={diagnosisChartSeries}
							type="bar"
							height={300}
						/>
					</motion.div>

					{/* Room Intelligence Tracker */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
						className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"
					>
						<div className="flex items-center justify-between mb-8">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
									<MapPin className="w-5 h-5 text-orange-600" />
								</div>
								<h3 className="text-xl font-black text-gray-900 tracking-tight">Okupansi Per Bangsal</h3>
							</div>
							<div className="relative group">
								<Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
								<select
									className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
									value={roomFilter}
									onChange={(e) => setRoomFilter(e.target.value)}
								>
									<option value="">Semua Ruangan</option>
									{uniqueRooms.map((room) => (
										<option key={room} value={room}>{room}</option>
									))}
								</select>
							</div>
						</div>

						<div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-100">
							<AnimatePresence mode="popLayout">
								{filteredPatients.length > 0 ? (
									filteredPatients.slice(0, 15).map((patient, i) => (
										<motion.div
											layout
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											key={patient.no_rawat}
											className="group flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300"
										>
											<div className="flex items-center gap-4">
												<div className="relative">
													<div className="w-11 h-11 rounded-1.5xl bg-white flex items-center justify-center shadow-sm group-hover:bg-blue-50 group-hover:text-[#0093dd] transition-colors">
														<User className="w-5 h-5" />
													</div>
													<div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${patient.stts_pulang === "-" ? 'bg-green-500' : 'bg-gray-300'}`}></div>
												</div>
												<div>
													<p className="text-sm font-black text-gray-900 leading-none group-hover:text-[#0093dd] transition-colors">{patient.nm_pasien}</p>
													<div className="flex items-center gap-2 mt-1.5">
														<span className="text-[10px] font-bold text-gray-400 tracking-wider">RM: {patient.no_rkm_medis}</span>
														<span className="w-1 h-1 bg-gray-300 rounded-full"></span>
														<span className="text-[10px] font-black text-[#0093dd] uppercase tracking-widest">{patient.kd_kamar}</span>
													</div>
												</div>
											</div>
											<div className="flex flex-col items-end gap-1.5">
												<span className="px-2.5 py-1 rounded-lg bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100 shadow-sm group-hover:bg-[#0093dd] group-hover:text-white transition-all">
													{patient.penjab_nama}
												</span>
												<div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
													<Clock className="w-3 h-3" />
													{patient.tgl_masuk}
												</div>
											</div>
										</motion.div>
									))
								) : (
									<div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
										<Search className="w-12 h-12 mb-4 opacity-20" />
										<p className="text-sm font-bold uppercase tracking-widest opacity-50">Data Pasien Tidak Ditemukan</p>
									</div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				</div>

				{/* Complete Surveillance Table Area */}
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
					className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
				>
					<div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
								<FileText className="w-6 h-6 text-[#0093dd]" />
							</div>
							<div>
								<h3 className="text-xl font-black text-gray-900 tracking-tight">Vigilans Pasien Rawat Inap</h3>
								<p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-widest">Surveillance data real-time: {filteredPatients.length} Pasien</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500">
								Urutan: Masuk Terlama
							</div>
							<div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors">
								<TrendingUp className="w-5 h-5" />
							</div>
						</div>
					</div>
					
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-gray-50/50">
								<TableRow className="hover:bg-transparent border-0">
									<TableHead className="py-5 px-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Profil Pasien</TableHead>
									<TableHead className="py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Detail Rawat</TableHead>
									<TableHead className="py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Bangsal & Kamar</TableHead>
									<TableHead className="py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Penjamin</TableHead>
									<TableHead className="py-5 px-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPatients.slice(0, 50).map((patient) => (
									<TableRow key={patient.no_rawat} className="group border-gray-50 hover:bg-gray-50/70 transition-colors">
										<TableCell className="py-5 px-8">
											<div className="flex items-center gap-4">
												<div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs ring-4 ring-transparent group-hover:ring-blue-100 group-hover:text-[#0093dd] group-hover:bg-white transition-all">
													{patient.nm_pasien.charAt(0)}
												</div>
												<div>
													<div className="font-bold text-gray-900 transition-colors group-hover:text-[#0093dd]">{patient.nm_pasien}</div>
													<div className="text-[10px] font-bold text-gray-400 mt-0.5">RM: {patient.no_rkm_medis}</div>
												</div>
											</div>
										</TableCell>
										<TableCell className="py-5">
											<div className="space-y-1">
												<div className="text-[10px] font-black text-[#0093dd] uppercase tracking-tighter">{patient.no_rawat}</div>
												<div className="flex items-center gap-2">
													<Calendar className="w-3 h-3 text-gray-300" />
													<span className="text-xs font-bold text-gray-600 tracking-tight">{patient.tgl_masuk}</span>
												</div>
											</div>
										</TableCell>
										<TableCell className="py-5">
											<div className="flex items-center gap-2.5">
												<div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
													<MapPin className="w-4 h-4 text-orange-600" />
												</div>
												<div className="font-black text-xs text-gray-700 uppercase tracking-widest">{patient.kd_kamar}</div>
											</div>
										</TableCell>
										<TableCell className="py-5 text-center">
											<span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
												patient.penjab_nama.includes("BPJS") ? "bg-green-100 text-green-700" :
												patient.penjab_nama.includes("UMUM") ? "bg-blue-100 text-[#0093dd]" : "bg-gray-100 text-gray-600"
											}`}>
												{patient.penjab_nama}
											</span>
										</TableCell>
										<TableCell className="py-5 px-8 text-right">
											<button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#0093dd] hover:text-white transition-all shadow-sm">
												<ChevronRight className="w-4 h-4" />
											</button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					{filteredPatients.length > 50 && (
						<div className="p-6 bg-gray-50/50 flex items-center justify-center border-t border-gray-50">
							<button className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#0093dd] transition-colors flex items-center gap-2">
								<Activity className="w-3 h-3" />
								Scroll Untuk Memuat Lebih Banyak
							</button>
						</div>
					)}
				</motion.div>
			</div>
		</div>
	);
}

// Internal Premium Components
function KPICard({ title, value, subValue, change, icon, color, delay }) {
	const colors = {
		blue: "from-blue-500 to-blue-600 shadow-blue-100 text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-300",
		green: "from-emerald-500 to-emerald-600 shadow-emerald-100 text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-300",
		orange: "from-orange-500 to-orange-600 shadow-orange-100 text-orange-600 bg-orange-50 border-orange-100 hover:border-orange-300",
		purple: "from-purple-500 to-purple-600 shadow-purple-100 text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-300",
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay, duration: 0.4 }}
			whileHover={{ y: -4 }}
			className={`relative overflow-hidden bg-white p-6 rounded-[2rem] border transition-all duration-300 group ${colors[color].split(' ').slice(4).join(' ')}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-inherit transition-colors mb-1">{title}</p>
					<h4 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-3">{value}</h4>
					
					{change !== undefined ? (
						<div className="flex items-center gap-2">
							<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-black ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
								{change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
								{Math.abs(change).toFixed(1)}%
							</div>
							<span className="text-[10px] font-bold text-gray-400">vs kemarin</span>
						</div>
					) : (
						<p className="text-[10px] font-bold text-gray-400">{subValue}</p>
					)}
				</div>
				<div className={`w-12 h-12 rounded-2xl flex items-center justify-center ring-4 ring-transparent transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${colors[color].split(' ').slice(2, 4).join(' ')} ring-white shadow-xl`}>
					<div className="text-white">
						{icon}
					</div>
				</div>
			</div>
			
			{/* Decorative Elements */}
			<div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gray-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
		</motion.div>
	);
}
