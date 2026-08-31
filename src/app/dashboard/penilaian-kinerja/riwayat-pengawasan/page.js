"use client";

import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import { AlertCircle } from "lucide-react";

import AuditHeader from "./components/AuditHeader";
import AuditSummaryCards from "./components/AuditSummaryCards";
import AuditFilters from "./components/AuditFilters";
import AuditTable from "./components/AuditTable";
import AuditDetailDrawer from "./components/AuditDetailDrawer";

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
	const [limit, setLimit] = useState(10);
	const [onlyAnomali, setOnlyAnomali] = useState(false);
	const [sortField, setSortField] = useState("nama");
	const [sortDirection, setSortDirection] = useState("asc");

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

	// Inline Activity Inspection State
	const [selectedDateStr, setSelectedDateStr] = useState("");
	const [selectedEval, setSelectedEval] = useState(null);
	const [selectedDayMeta, setSelectedDayMeta] = useState({ shift: "", isWorkDay: false });
	const [activityLoading, setActivityLoading] = useState(false);
	const [activities, setActivities] = useState([]);

	// Fetch Departments & Status Kerja Options
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

	useEffect(() => {
		fetchDepartments();
		fetchSttsKerja();
	}, []);

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
				limit: limit.toString(),
				sort_by: sortField,
				sort_order: sortDirection,
				only_anomali: onlyAnomali ? "true" : "false",
			});
			const res = await fetch(`/api/penilaian/rekap-pengawasan?${params}`);
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || "Gagal mengambil data rekap pengawasan");
			}
			const result = await res.json();
			setRekapList(result.data || []);
			setMeta(result.meta || { page: 1, limit, totalItems: 0, totalPages: 1 });
			setSummary(result.summary || null);
		} catch (err) {
			console.error("Error loadRekapData:", err);
			setErrorMsg(err.message || "Terjadi kesalahan saat memuat data rekap pengawasan.");
		} finally {
			setLoading(false);
		}
	}, [month, year, departemen, sttsKerja, searchNama, page, limit, sortField, sortDirection, onlyAnomali]);

	useEffect(() => {
		const timer = setTimeout(() => {
			loadRekapData();
		}, 300);
		return () => clearTimeout(timer);
	}, [loadRekapData]);

	// Sort Change Handler
	const handleSortChange = (field) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
		setPage(1);
	};

	// Reset Filters
	const handleResetFilters = () => {
		setMonth(moment().format("MM"));
		setYear(moment().format("YYYY"));
		setDepartemen("ALL");
		setSttsKerja("ALL");
		setSearchNama("");
		setPage(1);
		setLimit(10);
		setOnlyAnomali(false);
		setSortField("nama");
		setSortDirection("asc");
	};

	// Full-Dataset Export CSV generator
	const handleExportCsv = async () => {
		try {
			const params = new URLSearchParams({
				bulan: month,
				tahun: year,
				departemen,
				stts_kerja: sttsKerja,
				nama: searchNama,
				page: "1",
				limit: "10000",
				sort_by: sortField,
				sort_order: sortDirection,
				only_anomali: onlyAnomali ? "true" : "false",
			});
			const res = await fetch(`/api/penilaian/rekap-pengawasan?${params}`);
			if (!res.ok) throw new Error("Gagal mengambil data untuk ekspor");
			const result = await res.json();
			const exportData = result.data || [];
			if (exportData.length === 0) return;

			const headers = [
				"NIK",
				"Nama Pegawai",
				"Departemen",
				"Status Kerja",
				"Wajib Kerja",
				"Disetujui",
				"Pending",
				"Draft",
				"Kosong",
				"Gap Hari",
				"Rata Skor",
				"Status Rekap",
			];
			const rows = exportData.map((r) => [
				`"${r.nik || ""}"`,
				`"${(r.nama || "").replace(/"/g, '""')}"`,
				`"${r.nama_departemen || ""}"`,
				`"${r.stts_kerja || ""}"`,
				r.total_hari_jadwal ?? 0,
				r.hari_approved ?? 0,
				r.hari_pending ?? 0,
				r.hari_draft ?? 0,
				r.hari_kosong ?? 0,
				r.gap_hari ?? 0,
				r.rata_skor_total != null ? Math.round(r.rata_skor_total) : 0,
				`"${r.status_rekap || "DRAFT"}"`,
			]);
			const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.setAttribute("href", url);
			link.setAttribute("download", `Rekap_Audit_Kinerja_${month}_${year}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			console.error("Export error:", err);
		}
	};

	// Employee traversal navigation in drawer
	const currentEmpIndex = rekapList.findIndex(
		(r) => (r.pegawai_id && r.pegawai_id === selectedEmp?.pegawai_id) || r.nik === selectedEmp?.nik
	);
	const hasPrev = currentEmpIndex > 0;
	const hasNext = currentEmpIndex >= 0 && currentEmpIndex < rekapList.length - 1;

	const handlePrevEmp = () => {
		if (hasPrev) {
			handleOpenDetail(rekapList[currentEmpIndex - 1]);
		}
	};

	const handleNextEmp = () => {
		if (hasNext) {
			handleOpenDetail(rekapList[currentEmpIndex + 1]);
		}
	};

	// Open Employee Detail Slide-Over
	const handleOpenDetail = (emp) => {
		setSelectedEmp(emp);
		setPanelMonth(month);
		setPanelYear(year);
		setSelectedDateStr("");
		setSelectedEval(null);
		setActivities([]);
		setPanelOpen(true);
	};

	// Close Detail Drawer and cleanup inline inspection
	const handleCloseDetail = () => {
		setPanelOpen(false);
		setSelectedEmp(null);
		setSelectedDateStr("");
		setSelectedEval(null);
		setSelectedDayMeta({ shift: "", isWorkDay: false });
		setActivities([]);
	};

	// Close inline day inspection
	const handleCloseDayActivities = () => {
		setSelectedDateStr("");
		setSelectedEval(null);
		setSelectedDayMeta({ shift: "", isWorkDay: false });
		setActivities([]);
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

	// Inspect daily activity inline inside drawer
	const handleViewDayActivities = async (dateStr, dayEval, dayShift, isWorkDay) => {
		if (!selectedEmp) return;
		setSelectedDateStr(dateStr);
		setSelectedEval(dayEval || null);
		setSelectedDayMeta({ shift: dayShift || "", isWorkDay: Boolean(isWorkDay) });

		if (!dayEval) {
			setActivities([]);
			setActivityLoading(false);
			return;
		}

		setActivityLoading(true);
		try {
			const res = await fetch(
				`/api/penilaian/harian?tanggal=${dateStr}&pegawai_id=${selectedEmp.pegawai_id}`
			);
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

	// Ratings label helper
	const getRatingBadge = (score) => {
		const num = Number(score || 0);
		if (num >= 85) {
			return (
				<span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase font-mono">
					SANGAT BAIK
				</span>
			);
		}
		if (num >= 75) {
			return (
				<span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded uppercase font-mono">
					BAIK
				</span>
			);
		}
		if (num >= 60) {
			return (
				<span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded uppercase font-mono">
					CUKUP
				</span>
			);
		}
		return (
			<span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800 rounded uppercase font-mono">
				KURANG
			</span>
		);
	};

	return (
		<div className="w-full p-4 md:p-6 space-y-5 font-noto-sans bg-slate-50/50 min-h-screen text-slate-900">
			{/* Brand-Consistent Header */}
			<AuditHeader
				month={month}
				year={year}
				onReset={handleResetFilters}
			/>

			{/* Error Alert */}
			{errorMsg && (
				<div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center justify-between gap-3 shadow-xs">
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
						<div className="space-y-0.5">
							<h4 className="font-bold text-sm text-rose-950">Gagal Memuat Data Pengawasan</h4>
							<p className="text-xs text-rose-800">{errorMsg}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={loadRekapData}
						className="px-3 py-1.5 bg-white hover:bg-rose-100/80 text-rose-900 border border-rose-200 font-bold rounded-lg text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
					>
						Coba Lagi
					</button>
				</div>
			)}

			{/* Executive Metrics & Compliance Cards */}
			<AuditSummaryCards
				summary={summary}
				getRatingBadge={getRatingBadge}
			/>

			{/* Filter Toolbar */}
			<AuditFilters
				month={month}
				setMonth={(val) => {
					setMonth(val);
					setPage(1);
				}}
				year={year}
				setYear={(val) => {
					setYear(val);
					setPage(1);
				}}
				departemen={departemen}
				setDepartemen={(val) => {
					setDepartemen(val);
					setPage(1);
				}}
				sttsKerja={sttsKerja}
				setSttsKerja={(val) => {
					setSttsKerja(val);
					setPage(1);
				}}
				searchNama={searchNama}
				setSearchNama={(val) => {
					setSearchNama(val);
					setPage(1);
				}}
				limit={limit}
				setLimit={(val) => {
					setLimit(val);
					setPage(1);
				}}
				onlyAnomali={onlyAnomali}
				setOnlyAnomali={(val) => {
					setOnlyAnomali(val);
					setPage(1);
				}}
				onExportCsv={handleExportCsv}
				departemenList={departemenList}
				sttsKerjaList={sttsKerjaList}
				MONTHS={MONTHS}
				YEARS={YEARS}
			/>

			{/* Data Table */}
			<AuditTable
				loading={loading}
				rekapList={rekapList}
				meta={meta}
				sortField={sortField}
				sortDirection={sortDirection}
				onSortChange={handleSortChange}
				onPageChange={setPage}
				onOpenDetail={handleOpenDetail}
			/>

			{/* Slide-over Panel (Employee Detail Drawer with Inline Activity Inspection & Traversal) */}
			<AuditDetailDrawer
				isOpen={panelOpen}
				onClose={handleCloseDetail}
				selectedEmp={selectedEmp}
				hasPrev={hasPrev}
				hasNext={hasNext}
				onPrevEmp={handlePrevEmp}
				onNextEmp={handleNextEmp}
				panelMonth={panelMonth}
				setPanelMonth={setPanelMonth}
				panelYear={panelYear}
				setPanelYear={setPanelYear}
				panelLoading={panelLoading}
				panelSchedule={panelSchedule}
				panelIsTambahanMap={panelIsTambahanMap}
				panelEvaluations={panelEvaluations}
				selectedDateStr={selectedDateStr}
				selectedEval={selectedEval}
				selectedDayMeta={selectedDayMeta}
				activities={activities}
				activityLoading={activityLoading}
				onSelectDay={handleViewDayActivities}
				onCloseDayActivities={handleCloseDayActivities}
				MONTHS={MONTHS}
				YEARS={YEARS}
			/>
		</div>
	);
}
