"use client";

import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import {
	Users,
	TrendingUp,
	CheckCircle2,
	Award,
	Search,
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
	Eye,
	X,
	Loader2,
	AlertCircle,
	Filter,
	Lock,
	Clock,
	CheckCircle,
	XCircle,
	Info,
	FileText,
	ShieldCheck,
	RefreshCcw
} from "lucide-react";

const MONTHS = [
	{ value: "01", label: "Januari" },
	{ value: "02", label: "Februari" },
	{ value: "03", label: "Maret" },
	{ value: "04", label: "April" },
	{ value: "05", label: "Mei" },
	{ value: "06", label: "Juni" },
	{ value: "07", label: "Juli" },
	{ value: "08", label: "Agustus" },
	{ value: "09", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

const YEARS = ["2024", "2025", "2026", "2027"];

export default function RiwayatPenilaianPengawasanPage() {
	// Filter State
	const [month, setMonth] = useState(moment().format("MM"));
	const [year, setYear] = useState(moment().format("YYYY"));
	const [departemen, setDepartemen] = useState("ALL");
	const [sttsKerja, setSttsKerja] = useState("ALL");
	const [searchNama, setSearchNama] = useState("");
	const [page, setPage] = useState(1);

	// Data State
	const [rekapList, setRekapList] = useState([]);
	const [meta, setMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(true);
	const [errorMsg, setErrorMsg] = useState("");

	// Filter Options State
	const [departemenList, setDepartemenList] = useState([]);
	const [sttsKerjaList, setSttsKerjaList] = useState([]);

	// Slide-over Panel State (Employee Detail Drawer)
	const [panelOpen, setPanelOpen] = useState(false);
	const [selectedEmp, setSelectedEmp] = useState(null);
	const [panelMonth, setPanelMonth] = useState(moment().format("MM"));
	const [panelYear, setPanelYear] = useState(moment().format("YYYY"));
	const [panelLoading, setPanelLoading] = useState(false);
	const [panelSchedule, setPanelSchedule] = useState(null);
	const [panelIsTambahanMap, setPanelIsTambahanMap] = useState({});
	const [panelEvaluations, setPanelEvaluations] = useState([]);

	// Activity Detail Modal State
	const [activityModalOpen, setActivityModalOpen] = useState(false);
	const [selectedDateStr, setSelectedDateStr] = useState("");
	const [selectedEval, setSelectedEval] = useState(null);
	const [activityLoading, setActivityLoading] = useState(false);
	const [activities, setActivities] = useState([]);

	// Fetch Departments & Status Kerja Options
	useEffect(() => {
		fetchDepartments();
		fetchSttsKerja();
	}, []);

	const fetchDepartments = async () => {
		try {
			const res = await fetch("/api/departemen");
			if (res.ok) {
				const result = await res.json();
				if (result.status === "success") {
					setDepartemenList(result.data || []);
				}
			}
		} catch (err) {
			console.error("Gagal mengambil data departemen:", err);
		}
	};

	const fetchSttsKerja = async () => {
		try {
			const res = await fetch("/api/stts-kerja");
			if (res.ok) {
				const result = await res.json();
				if (result.status === "success") {
					setSttsKerjaList(result.data || []);
				}
			}
		} catch (err) {
			console.error("Gagal mengambil data status kerja:", err);
		}
	};

	// Fetch Rekap Pengawasan Data
	const loadRekapData = useCallback(async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			const params = new URLSearchParams({
				bulan: month,
				tahun: year,
				departemen,
				stts_kerja: sttsKerja,
				nama: searchNama,
				page: page.toString(),
				limit: "10"
			});
			const res = await fetch(`/api/penilaian/rekap-pengawasan?${params}`);
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || "Gagal mengambil data rekap pengawasan");
			}
			const result = await res.json();
			setRekapList(result.data || []);
			setMeta(result.meta || { page: 1, limit: 10, totalItems: 0, totalPages: 1 });
			setSummary(result.summary || null);
		} catch (err) {
			console.error("Error loadRekapData:", err);
			setErrorMsg(err.message || "Terjadi kesalahan saat memuat data rekap pengawasan.");
		} finally {
			setLoading(false);
		}
	}, [month, year, departemen, sttsKerja, searchNama, page]);

	useEffect(() => {
		const timer = setTimeout(() => {
			loadRekapData();
		}, 300);
		return () => clearTimeout(timer);
	}, [loadRekapData]);

	// Reset Filters
	const handleResetFilters = () => {
		setMonth(moment().format("MM"));
		setYear(moment().format("YYYY"));
		setDepartemen("ALL");
		setSttsKerja("ALL");
		setSearchNama("");
		setPage(1);
	};

	// Open Employee Detail Slide-Over
	const handleOpenDetail = (emp) => {
		setSelectedEmp(emp);
		setPanelMonth(month);
		setPanelYear(year);
		setPanelOpen(true);
	};

	// Load Employee Detail Panel Data (Schedule + Evaluations)
	const loadEmployeePanelData = useCallback(async () => {
		if (!selectedEmp) return;
		setPanelLoading(true);
		try {
			const schedRes = await fetch(
				`/api/penilaian/jadwal?bulan=${panelMonth}&tahun=${panelYear}&pegawai_id=${selectedEmp.pegawai_id}`
			);
			const schedData = await schedRes.json();
			setPanelSchedule(schedData.hasSchedule ? schedData.schedule : null);
			setPanelIsTambahanMap(schedData.isTambahan || {});

			const harianRes = await fetch(
				`/api/penilaian/harian?bulan=${panelMonth}&tahun=${panelYear}&pegawai_id=${selectedEmp.pegawai_id}`
			);
			const harianData = await harianRes.json();
			setPanelEvaluations(harianData.data || []);
		} catch (err) {
			console.error("Error loading panel history:", err);
		} finally {
			setPanelLoading(false);
		}
	}, [selectedEmp, panelMonth, panelYear]);

	useEffect(() => {
		if (selectedEmp && panelOpen) {
			loadEmployeePanelData();
		}
	}, [selectedEmp, panelOpen, loadEmployeePanelData]);

	// Open Activity Modal for specific date
	const handleViewDayActivities = async (dateStr, dayEval) => {
		setSelectedDateStr(dateStr);
		setSelectedEval(dayEval);
		setActivityModalOpen(true);
		setActivityLoading(true);
		try {
			const res = await fetch(`/api/penilaian/harian?tanggal=${dateStr}&pegawai_id=${selectedEmp.pegawai_id}`);
			if (!res.ok) throw new Error("Gagal memuat detail kegiatan harian");
			const data = await res.json();
			setActivities(data.data?.kegiatan || []);
		} catch (err) {
			console.error("Error loading activities:", err);
			setActivities([]);
		} finally {
			setActivityLoading(false);
		}
	};

	// Render Calendar Grid for Employee Drawer
	const renderPanelCalendarGrid = () => {
		const daysInMonth = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").daysInMonth();
		const daysList = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${panelYear}-${String(panelMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
			const isFuture = moment(dateStr).isAfter(moment(), "day");
			const shift = panelSchedule ? (panelSchedule[`h${d}`] || "") : "";
			const isWorkDay = shift !== "";
			const isTambahan = panelIsTambahanMap ? (panelIsTambahanMap[`h${d}`] || false) : false;
			const evaluation = panelEvaluations.find(e => moment(e.tanggal).format("YYYY-MM-DD") === dateStr);
			daysList.push({ day: d, dateStr, isFuture, isWorkDay, shift, isTambahan, evaluation });
		}

		const startDayOfWeek = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").day();
		const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

		return (
			<div>
				<div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest pb-2.5 border-b border-slate-200 mb-3 font-mono">
					<div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
				</div>
				<div className="grid grid-cols-7 gap-2">
					{Array.from({ length: adjustedStartDay }).map((_, idx) => (
						<div key={`empty-${idx}`} className="aspect-square bg-slate-50 border border-slate-100 rounded-lg pointer-events-none opacity-30" />
					))}
					{daysList.map((dayItem) => {
						let boxBgClass = "bg-white";
						let borderClass = "border-slate-200";
						let textClass = "text-slate-900";
						let statusBadge = null;
						let isClickable = false;

						if (!dayItem.isWorkDay) {
							boxBgClass = "bg-slate-50 text-slate-400";
							borderClass = "border-slate-200/80";
							textClass = "text-slate-400";
							statusBadge = <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wide">OFF</span>;
						} else if (!dayItem.evaluation) {
							if (dayItem.isFuture) {
								boxBgClass = "bg-white text-slate-300";
								borderClass = "border-slate-200 border-dashed";
								textClass = "text-slate-400";
								statusBadge = <span className="text-[9px] font-bold text-slate-300 font-mono">-</span>;
							} else {
								boxBgClass = "bg-rose-50/70 text-rose-900";
								borderClass = "border-rose-200";
								textClass = "text-rose-900";
								statusBadge = <span className="px-1 py-0.5 text-[8px] font-black bg-rose-100 text-rose-800 rounded uppercase font-mono">KOSONG</span>;
							}
						} else {
							const status = dayItem.evaluation.status;
							isClickable = true;
							if (status === "approved") {
								boxBgClass = "bg-emerald-50/50 text-emerald-950";
								borderClass = "border-emerald-200 hover:border-emerald-400";
								textClass = "text-emerald-950";
								statusBadge = (
									<div className="flex flex-col items-center">
										<span className="px-1 py-0.5 text-[8px] font-black bg-emerald-100 text-emerald-800 rounded uppercase font-mono">OK</span>
										<span className="text-xs font-black mt-0.5 text-emerald-900 font-mono">{Math.round(dayItem.evaluation.skor_total)}</span>
									</div>
								);
							} else if (status === "submitted") {
								boxBgClass = "bg-amber-50/50 text-amber-950";
								borderClass = "border-amber-200 hover:border-amber-400";
								textClass = "text-amber-950";
								statusBadge = (
									<div className="flex flex-col items-center">
										<span className="px-1 py-0.5 text-[8px] font-black bg-amber-100 text-amber-800 rounded uppercase font-mono">PENDING</span>
										<span className="text-xs font-black mt-0.5 text-amber-900 font-mono">{Math.round(dayItem.evaluation.skor_total)}</span>
									</div>
								);
							} else {
								const isRevisi = status === "revisi";
								boxBgClass = isRevisi ? "bg-rose-50/50 text-rose-950" : "bg-slate-100/70 text-slate-800";
								borderClass = isRevisi ? "border-rose-200 hover:border-rose-400" : "border-slate-200 hover:border-slate-400";
								textClass = isRevisi ? "text-rose-950" : "text-slate-800";
								statusBadge = (
									<div className="flex flex-col items-center">
										<span className={`px-1 py-0.5 text-[8px] font-black rounded uppercase font-mono ${isRevisi ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-700"}`}>
											{isRevisi ? "REVISI" : "DRAF"}
										</span>
										<span className={`text-xs font-black mt-0.5 font-mono ${isRevisi ? "text-rose-900" : "text-slate-800"}`}>
											{Math.round(dayItem.evaluation.skor_total)}
										</span>
									</div>
								);
							}
						}

						return (
							<div
								key={dayItem.day}
								onClick={() => isClickable && handleViewDayActivities(dayItem.dateStr, dayItem.evaluation)}
								className={`aspect-square rounded-xl border p-2 flex flex-col justify-between transition-all duration-150 ${boxBgClass} ${borderClass} ${
									isClickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95" : "pointer-events-none"
								}`}
							>
								<div className="flex justify-between items-center w-full leading-none">
									<span className={`text-xs font-black font-mono ${textClass}`}>{dayItem.day}</span>
									{dayItem.isWorkDay && (
										<span className="text-[9px] font-extrabold text-slate-500 uppercase font-mono">{dayItem.shift}</span>
									)}
								</div>
								<div className="flex-1 flex items-center justify-center pt-1">{statusBadge}</div>
								{dayItem.isWorkDay && dayItem.isTambahan && (
									<div className="w-full flex justify-end">
										<span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Shift Tambahan" />
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	// Calculate Stats for Employee Drawer
	const calcEmpPanelStats = () => {
		const daysInMonth = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").daysInMonth();
		let workDaysCount = 0;
		for (let d = 1; d <= daysInMonth; d++) {
			if (panelSchedule && (panelSchedule[`h${d}`] || "") !== "") {
				workDaysCount++;
			}
		}
		const approvedDays = panelEvaluations.filter(e => e.status === "approved").length;
		const pendingDays = panelEvaluations.filter(e => e.status === "submitted").length;
		const draftOrRevisiDays = panelEvaluations.filter(e => e.status === "draft" || e.status === "revisi").length;
		const approvedEvals = panelEvaluations.filter(e => e.status === "approved");
		const avgScore = approvedEvals.length > 0
			? Math.round(approvedEvals.reduce((sum, e) => sum + Number(e.skor_total), 0) / approvedEvals.length)
			: 0;
		const gapDays = Math.max(0, workDaysCount - approvedDays);
		return { workDaysCount, approvedDays, pendingDays, draftOrRevisiDays, avgScore, gapDays };
	};

	const panelEmpStats = calcEmpPanelStats();

	// Ratings label helper
	const getRatingBadge = (score) => {
		const num = Number(score || 0);
		if (num >= 85) return <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase font-mono">SANGAT BAIK</span>;
		if (num >= 75) return <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded uppercase font-mono">BAIK</span>;
		if (num >= 60) return <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded uppercase font-mono">CUKUP</span>;
		return <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800 rounded uppercase font-mono">KURANG</span>;
	};

	return (
		<div className="w-full p-4 md:p-6 space-y-5 font-noto-sans bg-slate-50/50 min-h-screen text-slate-900">
			{/* Brand-Consistent Header (matching Rekap Kinerja Bulanan) */}
			<div className="relative bg-primary-900 border border-primary-800/40 rounded-2xl overflow-hidden shadow-xs print:hidden">
				{/* Decorative radial glow */}
				<div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-700/10 rounded-full blur-3xl pointer-events-none" />

				<div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8">
					<div className="space-y-1.5 max-w-2xl">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest font-mono flex items-center gap-1.5">
								<ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
								Riwayat Penilaian (Pengawasan / HRD)
							</span>
							<span className="text-xs text-slate-500 font-mono font-bold">• Periode {month}/{year}</span>
						</div>
						<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-900 leading-tight">
							Riwayat Penilaian (Pengawasan / Audit SDM)
						</h1>
						<p className="text-slate-600 text-sm mt-1.5 font-medium leading-relaxed">
							Monitoring kepatuhan evaluasi kinerja bulanan, kelengkapan rekapitulasi penilaian pegawai seluruh unit, dan verifikasi independen SPI/SDM.
						</p>
					</div>
					<div className="flex gap-2 shrink-0 flex-wrap">
						<button
							onClick={handleResetFilters}
							className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs active:scale-95 transition-all"
						>
							<RefreshCcw className="h-4 w-4 text-slate-500" />
							Reset Filter
						</button>
					</div>
				</div>
			</div>

			{/* Error Alert */}
			{errorMsg && (
				<div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-start gap-3 shadow-xs">
					<AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
					<div className="space-y-0.5">
						<h4 className="font-bold text-sm text-rose-950">Gagal Memuat Data Pengawasan</h4>
						<p className="text-xs text-rose-800">{errorMsg}</p>
					</div>
				</div>
			)}

			{/* Executive Metrics & Compliance Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Card 1: Total Pegawai Terpantau */}
				<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2 transition-shadow duration-200 hover:shadow-md">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
							Pegawai Terpantau
						</span>
						<Users className="w-4 h-4 text-slate-400" />
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl md:text-3xl font-extrabold text-slate-800 font-figtree">
							{summary?.totalEmployees ?? 0}
						</span>
						<span className="text-xs font-bold text-slate-500">Pegawai</span>
					</div>
					<p className="text-xs text-slate-500 font-medium">Dalam cakupan audit institusi</p>
				</div>

				{/* Card 2: Rata-Rata Skor Kinerja */}
				<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2 transition-shadow duration-200 hover:shadow-md">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
							Rata-Rata Skor Kinerja
						</span>
						<TrendingUp className="w-4 h-4 text-emerald-600" />
					</div>
					<div className="flex items-center gap-3">
						<span className="text-2xl md:text-3xl font-extrabold text-emerald-600 font-figtree">
							{summary?.avgMonthlyScore != null ? Number(summary.avgMonthlyScore).toFixed(1) : "0.0"}
						</span>
						{getRatingBadge(summary?.avgMonthlyScore)}
					</div>
					<p className="text-xs text-slate-500 font-medium">Nilai agregat seluruh pegawai</p>
				</div>

				{/* Card 3: Status Rekapitulasi */}
				<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2 transition-shadow duration-200 hover:shadow-md">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
							Status Rekapitulasi
						</span>
						<CheckCircle2 className="w-4 h-4 text-primary-600" />
					</div>
					<div className="flex items-baseline gap-3">
						<div className="flex items-center gap-1.5">
							<span className="w-2 h-2 rounded-full bg-emerald-500" />
							<span className="text-xl font-extrabold text-slate-800 font-mono">{summary?.totalLocked ?? 0}</span>
							<span className="text-[10px] text-slate-500 font-bold uppercase">Locked</span>
						</div>
						<span className="text-slate-300">/</span>
						<div className="flex items-center gap-1.5">
							<span className="w-2 h-2 rounded-full bg-amber-500" />
							<span className="text-xl font-extrabold text-slate-800 font-mono">{summary?.totalDraft ?? 0}</span>
							<span className="text-[10px] text-slate-500 font-bold uppercase">Draft</span>
						</div>
					</div>
					<p className="text-xs text-slate-500 font-medium">Rekapitulasi akhir yang dikunci</p>
				</div>

				{/* Card 4: Tingkat Kepatuhan Unit */}
				<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2.5 transition-shadow duration-200 hover:shadow-md">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
							Kepatuhan Supervisor
						</span>
						<Award className="w-4 h-4 text-primary-600" />
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl md:text-3xl font-extrabold text-primary-700 font-figtree">
							{summary?.compliancePercentage != null ? Math.round(summary.compliancePercentage) : 0}%
						</span>
						<span className="text-[10px] font-extrabold text-slate-500 uppercase font-mono">
							{ (summary?.compliancePercentage ?? 0) >= 80 ? "TINGGI" : (summary?.compliancePercentage ?? 0) >= 50 ? "SEDANG" : "PERLU AUDIT" }
						</span>
					</div>
					<div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-500 ${
								(summary?.compliancePercentage ?? 0) >= 80 ? "bg-emerald-600" : (summary?.compliancePercentage ?? 0) >= 50 ? "bg-amber-500" : "bg-rose-500"
							}`}
							style={{ width: `${Math.min(100, Math.max(0, summary?.compliancePercentage ?? 0))}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Integrated Filter Toolbar */}
			<div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 print:hidden transition-shadow duration-200 hover:shadow-md">
				<div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4 text-primary-600" />
						<span className="font-bold text-xs uppercase tracking-widest text-slate-700 font-mono">Filter & Pencarian Audit</span>
					</div>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
					{/* Bulan Selector */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Bulan</label>
						<select
							value={month}
							onChange={(e) => { setMonth(e.target.value); setPage(1); }}
							className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
						>
							{MONTHS.map((m) => (
								<option key={m.value} value={m.value}>{m.label}</option>
							))}
						</select>
					</div>

					{/* Tahun Selector */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Tahun</label>
						<select
							value={year}
							onChange={(e) => { setYear(e.target.value); setPage(1); }}
							className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
						>
							{YEARS.map((y) => (
								<option key={y} value={y}>{y}</option>
							))}
						</select>
					</div>

					{/* Departemen Filter */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Departemen</label>
						<select
							value={departemen}
							onChange={(e) => { setDepartemen(e.target.value); setPage(1); }}
							className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
						>
							<option value="ALL">Semua Departemen</option>
							{departemenList.map((d) => (
								<option key={d.dep_id || d.nama} value={d.nama}>{d.nama}</option>
							))}
						</select>
					</div>

					{/* Status Kerja Filter */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Status Kerja</label>
						<select
							value={sttsKerja}
							onChange={(e) => { setSttsKerja(e.target.value); setPage(1); }}
							className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
						>
							<option value="ALL">Semua Status Kerja</option>
							{sttsKerjaList.map((s) => (
								<option key={s.stts} value={s.stts}>{s.ktg || s.stts}</option>
							))}
						</select>
					</div>

					{/* Search Nama / NIK */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Cari Nama / NIK</label>
						<div className="relative">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
							<input
								type="text"
								placeholder="Cari..."
								value={searchNama}
								onChange={(e) => { setSearchNama(e.target.value); setPage(1); }}
								className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 transition-all"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Main Audit Data Table */}
			<div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
				<div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50/50">
					<h3 className="font-bold text-slate-800 text-sm font-figtree flex items-center gap-2">
						<FileText className="w-4 h-4 text-primary-600" />
						Daftar Penilaian Kinerja Pegawai
					</h3>
					<span className="text-xs font-mono text-slate-500">
						Total: <strong className="text-slate-800 font-bold">{meta.totalItems}</strong> Pegawai
					</span>
				</div>

				{loading ? (
					<div className="flex flex-col justify-center items-center py-20 space-y-3">
						<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
						<span className="text-xs text-slate-500 font-mono">Memuat data audit pengawasan...</span>
					</div>
				) : rekapList.length === 0 ? (
					<div className="text-center py-16 px-4 space-y-2">
						<Info className="w-9 h-9 text-slate-300 mx-auto" />
						<p className="text-slate-800 font-bold text-sm">Tidak Ada Data Rekap Pengawasan</p>
						<p className="text-slate-500 text-xs">Sesuaikan kriteria filter atau periode pencarian Anda.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs md:text-sm">
							<thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
								<tr>
									<th className="py-3.5 px-4 whitespace-nowrap align-middle">NIK</th>
									<th className="py-3.5 px-4 whitespace-nowrap align-middle">Nama Pegawai</th>
									<th className="py-3.5 px-4 whitespace-nowrap align-middle">Departemen</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Status Kerja</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Jadwal</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Disetujui</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Gap</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Rata-Rata Skor</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Status Rekap</th>
									<th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 text-slate-700">
								{rekapList.map((row) => {
									const isLocked = row.status_rekap === "LOCKED" || row.status_rekap === "final";
									return (
										<tr key={row.id || `${row.pegawai_id}-${row.bulan}-${row.tahun}`} className="hover:bg-slate-50/80 transition-colors">
											<td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap align-middle">{row.nik || "-"}</td>
											<td className="py-3.5 px-4 font-bold text-slate-900 font-figtree align-middle">{row.nama}</td>
											<td className="py-3.5 px-4 text-slate-600 font-medium align-middle">{row.nama_departemen || "-"}</td>
											<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
												<span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100/90 border border-slate-200/90 rounded-full font-mono whitespace-nowrap shadow-2xs">
													{row.stts_kerja || "-"}
												</span>
											</td>
											<td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono align-middle">{row.total_hari_jadwal ?? 0}</td>
											<td className="py-3.5 px-4 text-center font-black text-emerald-600 font-mono align-middle">{row.hari_approved ?? 0}</td>
											<td className="py-3.5 px-4 text-center align-middle">
												<span className={`inline-block font-black font-mono ${row.gap_hari > 0 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" : "text-slate-400"}`}>
													{row.gap_hari ?? 0}
												</span>
											</td>
											<td className="py-3.5 px-4 text-center font-extrabold text-primary-700 font-figtree text-sm align-middle">
												{row.rata_skor_total != null ? Math.round(row.rata_skor_total) : 0}
											</td>
											<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
												{isLocked ? (
													<span className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-100/90 text-emerald-900 border border-emerald-200 rounded-full inline-flex items-center gap-1 font-mono whitespace-nowrap">
														<Lock className="w-3 h-3 text-emerald-700" /> LOCKED
													</span>
												) : (
													<span className="px-2.5 py-1 text-[11px] font-extrabold bg-amber-100/90 text-amber-900 border border-amber-200 rounded-full inline-flex items-center gap-1 font-mono whitespace-nowrap">
														<Clock className="w-3 h-3 text-amber-700" /> DRAFT
													</span>
												)}
											</td>
											<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
												<button
													onClick={() => handleOpenDetail(row)}
													className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200/90 rounded-xl hover:bg-primary-700 hover:text-white hover:border-primary-700 active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs whitespace-nowrap"
												>
													<Eye className="w-3.5 h-3.5" />
													<span>Detail Audit</span>
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination Controls */}
				<div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 text-xs">
					<div className="text-slate-500 font-medium">
						Halaman <span className="font-bold text-slate-800">{meta.page}</span> dari{" "}
						<span className="font-bold text-slate-800">{meta.totalPages}</span> (Total{" "}
						<span className="font-bold text-slate-800">{meta.totalItems}</span> pegawai)
					</div>
					<div className="flex items-center gap-2">
						<button
							disabled={meta.page <= 1 || loading}
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
						>
							<ChevronLeft className="w-4 h-4" />
							<span>Sebelumnya</span>
						</button>
						<button
							disabled={meta.page >= meta.totalPages || loading}
							onClick={() => setPage((prev) => prev + 1)}
							className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
						>
							<span>Berikutnya</span>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Slide-over Panel (Employee Detail Drawer) */}
			{panelOpen && selectedEmp && (
				<div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
					<div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
						{/* Drawer Header */}
						<div className="p-5 bg-primary-900 flex justify-between items-start border-b border-primary-800/60 relative">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<ShieldCheck className="w-4 h-4 text-primary-600" />
									<span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest font-mono">
										Audit Detail Pegawai
									</span>
								</div>
								<h2 className="text-xl font-extrabold text-slate-900 font-figtree">{selectedEmp.nama}</h2>
								<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
									<span>NIK: <strong className="text-slate-900 font-bold">{selectedEmp.nik}</strong></span>
									<span>•</span>
									<span>Dept: <strong className="text-slate-900 font-bold">{selectedEmp.nama_departemen || "-"}</strong></span>
									<span>•</span>
									<span>Status: <strong className="text-slate-900 font-bold">{selectedEmp.stts_kerja || "-"}</strong></span>
								</div>
							</div>
							<button
								onClick={() => setPanelOpen(false)}
								className="p-1.5 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-xs"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Drawer Month / Year Controls */}
						<div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center">
							<span className="text-xs font-bold text-slate-800 font-figtree uppercase tracking-wider">
								Periode Evaluation Grid
							</span>
							<div className="flex items-center gap-2">
								<select
									value={panelMonth}
									onChange={(e) => setPanelMonth(e.target.value)}
									className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
								>
									{MONTHS.map((m) => (
										<option key={m.value} value={m.value}>{m.label}</option>
									))}
								</select>
								<select
									value={panelYear}
									onChange={(e) => setPanelYear(e.target.value)}
									className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
								>
									{YEARS.map((y) => (
										<option key={y} value={y}>{y}</option>
									))}
								</select>
							</div>
						</div>

						{/* Drawer Body */}
						<div className="flex-1 overflow-y-auto p-5 space-y-6">
							{panelLoading ? (
								<div className="flex flex-col justify-center items-center py-20 space-y-3">
									<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
									<span className="text-xs text-slate-500 font-medium">Memuat riwayat kinerja pegawai...</span>
								</div>
							) : (
								<>
									{/* Employee Summary Stats */}
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
										<div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-0.5">
											<span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-figtree">Hari Wajib Kerja</span>
											<span className="text-xl font-extrabold text-slate-900 font-figtree">{panelEmpStats.workDaysCount} Hari</span>
										</div>
										<div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-0.5">
											<span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block font-figtree">Disetujui Spv</span>
											<span className="text-xl font-extrabold text-emerald-700 font-figtree">{panelEmpStats.approvedDays} Hari</span>
										</div>
										<div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-0.5">
											<span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider block font-figtree">Gap Hari</span>
											<span className="text-xl font-extrabold text-rose-700 font-figtree">{panelEmpStats.gapDays} Hari</span>
										</div>
										<div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-0.5">
											<span className="text-[10px] font-extrabold text-sky-900 uppercase tracking-wider block font-figtree">Rata-Rata Nilai</span>
											<span className="text-xl font-black text-sky-700 font-figtree">{panelEmpStats.avgScore}</span>
										</div>
									</div>

									{/* Calendar Grid */}
									<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
										<div className="flex justify-between items-center border-b border-slate-100 pb-2">
											<h4 className="font-bold text-slate-900 text-xs md:text-sm font-figtree">
												Kalender Kegiatan Harian
											</h4>
											<span className="text-[10px] text-slate-500 font-bold">Klik tanggal untuk melihat detail aktivitas</span>
										</div>
										{renderPanelCalendarGrid()}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Daily Activity Detail Modal */}
			{activityModalOpen && (
				<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
						{/* Modal Header */}
						<div className="p-4 bg-primary-900 border-b border-primary-800/60 flex justify-between items-center">
							<div className="flex items-center gap-2">
								<CalendarIcon className="w-5 h-5 text-primary-600" />
								<span className="font-bold text-sm font-figtree text-slate-900">
									Detail Evaluasi: {moment(selectedDateStr).format("DD MMMM YYYY")}
								</span>
							</div>
							<button
								onClick={() => setActivityModalOpen(false)}
								className="p-1 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/80 cursor-pointer shadow-xs"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Modal Body */}
						<div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
							{activityLoading ? (
								<div className="flex flex-col justify-center items-center py-12 space-y-2">
									<Loader2 className="h-7 w-7 text-primary-600 animate-spin" />
									<span className="text-xs text-slate-500 font-medium">Memuat rincian aktivitas...</span>
								</div>
							) : (
								<>
									{/* Daily Summary Info */}
									{selectedEval && (
										<div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
											<div>
												<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">Shift</span>
												<span className="font-extrabold text-slate-800 font-mono">{selectedEval.shift_jadwal || "-"}</span>
											</div>
											<div>
												<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">Kondisi Absensi</span>
												<span className="font-semibold text-slate-700 capitalize">{selectedEval.nilai_kondisi || "-"}</span>
											</div>
											<div>
												<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">Skor Absensi</span>
												<span className="font-extrabold text-emerald-600 font-mono">{selectedEval.skor_absensi ?? 0}</span>
											</div>
											<div>
												<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">Total Skor Harian</span>
												<span className="font-black text-primary-700 font-figtree text-sm">{Math.round(selectedEval.skor_total ?? 0)}</span>
											</div>
										</div>
									)}

									{/* List of Activities */}
									<div className="space-y-3">
										<h5 className="font-bold text-xs text-slate-600 uppercase font-figtree tracking-wider">
											Aktivitas & Output Kerja ({activities.length})
										</h5>

										{activities.length === 0 ? (
											<div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
												<p className="text-xs text-slate-500 font-medium">Tidak ada rincian kegiatan tercatat untuk tanggal ini.</p>
											</div>
										) : (
											<div className="space-y-2">
												{activities.map((act, idx) => {
													const isDone = act.status_selesai === 1 || act.status_selesai === "1" || act.status_selesai === true;
													return (
														<div key={act.id || idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
															<div className="flex justify-between items-start gap-2">
																<span className="font-bold text-xs md:text-sm text-slate-800 font-figtree">
																	{idx + 1}. {act.judul_kegiatan}
																</span>
																{isDone ? (
																	<span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
																		<CheckCircle className="w-3 h-3" /> Selesai
																	</span>
																) : (
																	<span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
																		<XCircle className="w-3 h-3" /> Belum Selesai
																	</span>
																)}
															</div>
															{act.penjabaran && (
																<p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
																	{act.penjabaran}
																</p>
															)}
															{!isDone && act.alasan_belum_selesai && (
																<p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 italic">
																	Alasan: {act.alasan_belum_selesai}
																</p>
															)}
														</div>
													);
												})}
											</div>
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
