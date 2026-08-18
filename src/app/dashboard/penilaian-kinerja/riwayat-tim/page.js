"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import moment from "moment";
import "moment/locale/id";
import { 
	Calendar as CalendarIcon, 
	ChevronLeft, 
	ChevronRight, 
	Info, 
	CheckCircle2, 
	XCircle, 
	X,
	Eye,
	Loader2,
	AlertCircle,
	Search,
	ShieldAlert,
	ArrowLeft,
	List,
	Grid,
	User,
	AlertTriangle,
	Clock,
	RefreshCw
} from "lucide-react";

export default function RiwayatPenilaianTimPage() {
	// Role State
	const [userProfile, setUserProfile] = useState(null);
	const [hasElevatedRole, setHasElevatedRole] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isSupervisor, setIsSupervisor] = useState(false);
	const [roleLoading, setRoleLoading] = useState(true);

	// Team History State
	const [teamLoading, setTeamLoading] = useState(false);
	const [teamError, setTeamError] = useState(null);
	const [teamList, setTeamList] = useState([]);
	const [teamMonth, setTeamMonth] = useState(moment().format("MM"));
	const [teamYear, setTeamYear] = useState(moment().format("YYYY"));
	const [teamDepartemen, setTeamDepartemen] = useState("ALL");
	const [teamSearch, setTeamSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [quickFilter, setQuickFilter] = useState("ALL"); // ALL | GAP | LOCKED
	const [teamPage, setTeamPage] = useState(1);
	const [teamTotalPages, setTeamTotalPages] = useState(1);
	const [teamSummary, setTeamSummary] = useState(null);
	const [departemenList, setDepartemenList] = useState([]);

	// Slide-over Panel State (Employee Detail)
	const [selectedEmpIndex, setSelectedEmpIndex] = useState(-1);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMonth, setPanelMonth] = useState(moment().format("MM"));
	const [panelYear, setPanelYear] = useState(moment().format("YYYY"));
	const [panelLoading, setPanelLoading] = useState(false);
	const [panelError, setPanelError] = useState(null);
	const [panelSchedule, setPanelSchedule] = useState(null);
	const [panelIsTambahanMap, setPanelIsTambahanMap] = useState({});
	const [panelEvaluations, setPanelEvaluations] = useState([]);
	const [panelViewMode, setPanelViewMode] = useState("grid"); // "grid" | "list"

	// Inline Day Detail (Drill-down within drawer)
	const [activeDayDetail, setActiveDayDetail] = useState(null);
	const [dayDetailLoading, setDayDetailLoading] = useState(false);
	const [dayDetailError, setDayDetailError] = useState(null);
	const [dayDetailActivities, setDayDetailActivities] = useState([]);

	// 1. Initial Role Detection & Dept Fetch
	useEffect(() => {
		checkRole();
		fetchDepartments();
	}, []);

	// Search Debounce handler
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(teamSearch);
			setTeamPage(1);
		}, 300);
		return () => clearTimeout(handler);
	}, [teamSearch]);

	const checkRole = async () => {
		setRoleLoading(true);
		try {
			const authRes = await fetch("/api/auth/user");
			if (authRes.ok) {
				const authData = await authRes.json();
				const user = authData.user;
				setUserProfile(user);
				const adminCheck = user?.departemen?.toUpperCase() === "IT";
				setIsAdmin(adminCheck);

				let supCheck = false;
				try {
					const supRes = await fetch("/api/penilaian/is-supervisor");
					if (supRes.ok) {
						const supData = await supRes.json();
						supCheck = supData.isSupervisor || false;
						setIsSupervisor(supCheck);
					}
				} catch (e) {
					console.error("Error checking supervisor status", e);
				}

				const elevated = adminCheck || supCheck;
				setHasElevatedRole(elevated);
			}
		} catch (err) {
			console.error("Error loading user role", err);
		} finally {
			setRoleLoading(false);
		}
	};

	const fetchDepartments = async () => {
		try {
			const res = await fetch("/api/departemen");
			const result = await res.json();
			if (result.status === "success") {
				setDepartemenList(result.data || []);
			}
		} catch (err) {
			console.error("Error fetching departments", err);
		}
	};

	// 2. Load Team History
	const loadTeamHistory = useCallback(async () => {
		if (!hasElevatedRole) return;
		setTeamLoading(true);
		setTeamError(null);
		try {
			const params = new URLSearchParams({
				bulan: teamMonth,
				tahun: teamYear,
				departemen: teamDepartemen,
				nama: debouncedSearch,
				page: teamPage.toString(),
				limit: "10"
			});
			const res = await fetch(`/api/penilaian/rekap?${params}`);
			if (!res.ok) {
				throw new Error(`Gagal memuat riwayat tim (Status: ${res.status})`);
			}
			const result = await res.json();
			setTeamList(result.data || []);
			setTeamTotalPages(result.meta?.totalPages || 1);
			setTeamSummary(result.summary || null);
		} catch (err) {
			console.error(err);
			setTeamError(err.message || "Terjadi kesalahan saat memuat data riwayat tim.");
		} finally {
			setTeamLoading(false);
		}
	}, [hasElevatedRole, teamMonth, teamYear, teamDepartemen, debouncedSearch, teamPage]);

	useEffect(() => {
		loadTeamHistory();
	}, [loadTeamHistory]);

	// Filtered list based on Quick Filter
	const filteredTeamList = useMemo(() => {
		if (quickFilter === "GAP") {
			return teamList.filter(item => (Number(item.gap_hari) || 0) > 0);
		}
		if (quickFilter === "LOCKED") {
			return teamList.filter(item => item.status_rekap === "LOCKED");
		}
		return teamList;
	}, [teamList, quickFilter]);

	// Selected employee helper
	const selectedEmp = selectedEmpIndex >= 0 && selectedEmpIndex < teamList.length ? teamList[selectedEmpIndex] : null;

	// 3. Load Slide-Over Panel Data (Selected Employee History)
	const loadPanelHistory = useCallback(async () => {
		if (!selectedEmp) return;
		setPanelLoading(true);
		setPanelError(null);
		setActiveDayDetail(null);
		try {
			const [schedRes, harianRes] = await Promise.all([
				fetch(`/api/penilaian/jadwal?bulan=${panelMonth}&tahun=${panelYear}&pegawai_id=${selectedEmp.pegawai_id}`),
				fetch(`/api/penilaian/harian?bulan=${panelMonth}&tahun=${panelYear}&pegawai_id=${selectedEmp.pegawai_id}`)
			]);

			if (!schedRes.ok || !harianRes.ok) {
				throw new Error("Gagal memuat jadwal atau riwayat harian pegawai.");
			}

			const schedData = await schedRes.json();
			const harianData = await harianRes.json();

			setPanelSchedule(schedData.hasSchedule ? schedData.schedule : null);
			setPanelIsTambahanMap(schedData.isTambahan || {});
			setPanelEvaluations(harianData.data || []);
		} catch (err) {
			console.error("Error loading panel history", err);
			setPanelError(err.message || "Gagal memuat data kalender pegawai.");
		} finally {
			setPanelLoading(false);
		}
	}, [selectedEmp, panelMonth, panelYear]);

	useEffect(() => {
		if (panelOpen && selectedEmp) {
			loadPanelHistory();
		}
	}, [panelOpen, selectedEmp, loadPanelHistory]);

	const handleOpenPanel = (emp) => {
		const idx = teamList.findIndex(e => (e.id || e.pegawai_id) === (emp.id || emp.pegawai_id));
		setSelectedEmpIndex(idx >= 0 ? idx : 0);
		setPanelMonth(teamMonth);
		setPanelYear(teamYear);
		setActiveDayDetail(null);
		setPanelOpen(true);
	};

	const handlePrevEmployee = () => {
		if (selectedEmpIndex > 0) {
			setSelectedEmpIndex(prev => prev - 1);
		}
	};

	const handleNextEmployee = () => {
		if (selectedEmpIndex < teamList.length - 1) {
			setSelectedEmpIndex(prev => prev + 1);
		}
	};
	// Keyboard navigation when drawer is open
	useEffect(() => {
		if (!panelOpen) return;

		const handleKeyDown = (e) => {
			// Don't trigger if typing in an input/textarea
			if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
				return;
			}

			if (e.key === "Escape") {
				if (activeDayDetail) {
					setActiveDayDetail(null);
				} else {
					setPanelOpen(false);
				}
			} else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
				handlePrevEmployee();
			} else if (e.key === "ArrowRight" || e.key === "k" || e.key === "K") {
				handleNextEmployee();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [panelOpen, activeDayDetail, selectedEmpIndex, teamList.length]);


	// 4. Load Day Detail (Inline Drilldown inside Drawer)
	const handleSelectDay = async (dayItem) => {
		if (!dayItem.evaluation) return;
		setActiveDayDetail(dayItem);
		setDayDetailLoading(true);
		setDayDetailError(null);
		try {
			const dateStr = moment(dayItem.evaluation.tanggal).format("YYYY-MM-DD");
			const res = await fetch(`/api/penilaian/harian?tanggal=${dateStr}&pegawai_id=${selectedEmp.pegawai_id}`);
			if (!res.ok) throw new Error("Gagal memuat rincian kegiatan kerja harian.");
			const data = await res.json();
			setDayDetailActivities(data.data?.kegiatan || []);
		} catch (err) {
			console.error(err);
			setDayDetailError(err.message || "Gagal memuat detail kegiatan.");
		} finally {
			setDayDetailLoading(false);
		}
	};

	// Compute month days matrix
	const daysMatrix = useMemo(() => {
		const daysInMonth = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").daysInMonth();
		const list = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${panelYear}-${String(panelMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
			const isFuture = moment(dateStr).isAfter(moment(), "day");
			const shift = panelSchedule ? (panelSchedule[`h${d}`] || "") : "";
			const isWorkDay = shift !== "";
			const isTambahan = panelIsTambahanMap ? (panelIsTambahanMap[`h${d}`] || false) : false;
			const evaluation = panelEvaluations.find(e => moment(e.tanggal).format("YYYY-MM-DD") === dateStr);
			list.push({ day: d, dateStr, isFuture, isWorkDay, shift, isTambahan, evaluation });
		}
		return list;
	}, [panelMonth, panelYear, panelSchedule, panelIsTambahanMap, panelEvaluations]);

	// Panel Stats
	const panelStats = useMemo(() => {
		let workDaysCount = 0;
		daysMatrix.forEach(d => {
			if (d.isWorkDay) workDaysCount++;
		});
		const approvedDays = panelEvaluations.filter(e => e.status === "approved").length;
		const pendingDays = panelEvaluations.filter(e => e.status === "submitted").length;
		const revisiDays = panelEvaluations.filter(e => e.status === "revisi").length;
		const drafDays = panelEvaluations.filter(e => e.status === "draft").length;
		const approvedEvals = panelEvaluations.filter(e => e.status === "approved");
		const avgScore = approvedEvals.length > 0
			? Math.round(approvedEvals.reduce((sum, e) => sum + Number(e.skor_total), 0) / approvedEvals.length)
			: 0;
		const gapDays = Math.max(0, workDaysCount - approvedDays);
		return { workDaysCount, approvedDays, pendingDays, revisiDays, drafDays, avgScore, gapDays };
	}, [daysMatrix, panelEvaluations]);

	if (roleLoading) {
		return (
			<div className="flex flex-col justify-center items-center py-28 space-y-3">
				<Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
				<span className="text-xs font-semibold text-slate-500 font-figtree">Memeriksa hak akses pengguna...</span>
			</div>
		);
	}

	if (!hasElevatedRole) {
		return (
			<div className="w-full p-6 space-y-6 font-noto-sans">
				<div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto mt-12 shadow-xs">
					<ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
					<h2 className="text-xl font-bold text-slate-900 font-figtree">Akses Terbatas</h2>
					<p className="text-slate-600 text-xs leading-relaxed">
						Halaman ini hanya dapat diakses oleh Supervisor dan Administrator untuk memantau rekapitulasi evaluasi tim.
					</p>
				</div>
			</div>
		);
	}

	const startDayOfWeek = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").day();
	const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans bg-slate-50/50 min-h-screen">
			{/* Header Surface */}
			<div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5 flex-wrap">
						<h1 className="text-xl md:text-2xl font-bold tracking-tight font-figtree text-slate-900">
							Riwayat Penilaian Tim & Pegawai
						</h1>
						<span className={`px-2.5 py-0.5 text-xs font-bold rounded-md font-figtree border ${
							isAdmin 
								? "bg-purple-50 text-purple-700 border-purple-200" 
								: "bg-sky-50 text-sky-700 border-sky-200"
						}`}>
							{isAdmin ? "Mode Administrator" : "Mode Supervisor"}
						</span>
					</div>
					<p className="text-slate-500 text-xs md:text-sm">
						Audit dan pantau riwayat kinerja bulanan pegawai. Klik baris pegawai untuk meninjau kalender dan rincian tugas.
					</p>
				</div>

				{teamSummary && (
					<div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs font-figtree w-full md:w-auto justify-around md:justify-start">
						<div>
							<span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Total Pegawai</span>
							<span className="font-extrabold text-slate-900 text-base">{teamSummary.totalEmployees} Pegawai</span>
						</div>
						<div className="h-8 w-px bg-slate-200" />
						<div>
							<span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Rata-Rata Skor</span>
							<span className="font-extrabold text-sky-600 text-base">{Math.round(teamSummary.avgMonthlyScore || 0)}</span>
						</div>
					</div>
				)}
			</div>

			{/* Filters & Content Area */}
			<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
				{/* Top Controls Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{/* Month Select */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-slate-600 font-figtree">Bulan Evaluasi</label>
						<select
							value={teamMonth}
							onChange={(e) => { setTeamMonth(e.target.value); setTeamPage(1); }}
							className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
						>
							{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
								const val = String(m).padStart(2, "0");
								return (
									<option key={val} value={val}>
										{moment(`${teamYear}-${val}-01`, "YYYY-MM-DD").locale("id").format("MMMM")}
									</option>
								);
							})}
						</select>
					</div>

					{/* Year Input */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-slate-600 font-figtree">Tahun</label>
						<input
							type="number"
							min="2020"
							max="2099"
							value={teamYear}
							onChange={(e) => { setTeamYear(e.target.value); setTeamPage(1); }}
							className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
							placeholder="Tahun"
						/>
					</div>

					{/* Departemen Select */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-slate-600 font-figtree">Departemen</label>
						<select
							value={teamDepartemen}
							onChange={(e) => { setTeamDepartemen(e.target.value); setTeamPage(1); }}
							className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
						>
							<option value="ALL">Semua Departemen</option>
							{departemenList.map((dep) => (
								<option key={dep.dep_id} value={dep.dep_id}>
									{dep.nama}
								</option>
							))}
						</select>
					</div>

					{/* Search Input */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-slate-600 font-figtree">Cari Pegawai</label>
						<div className="relative">
							<Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
							<input
								type="text"
								value={teamSearch}
								onChange={(e) => setTeamSearch(e.target.value)}
								placeholder="Cari Nama atau NIK..."
								className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg pl-9 pr-8 py-2.5 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
							/>
							{teamSearch && (
								<button 
									onClick={() => setTeamSearch("")}
									className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Quick Filter Chips */}
				<div className="flex items-center gap-2 pt-1 pb-1 flex-wrap text-xs font-figtree">
					<span className="text-slate-500 text-xs font-semibold mr-1">Filter Cepat:</span>
					<button
						onClick={() => setQuickFilter("ALL")}
						className={`px-3 py-1 rounded-md font-semibold transition-all ${
							quickFilter === "ALL"
								? "bg-slate-900 text-white"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
						}`}
					>
						Semua Pegawai
					</button>
					<button
						onClick={() => setQuickFilter("GAP")}
						className={`px-3 py-1 rounded-md font-semibold transition-all ${
							quickFilter === "GAP"
								? "bg-rose-600 text-white"
								: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
						}`}
					>
						Ada Gap Hari ({teamList.filter(i => (Number(i.gap_hari) || 0) > 0).length})
					</button>
					<button
						onClick={() => setQuickFilter("LOCKED")}
						className={`px-3 py-1 rounded-md font-semibold transition-all ${
							quickFilter === "LOCKED"
								? "bg-slate-700 text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
						}`}
					>
						Status Terkunci ({teamList.filter(i => i.status_rekap === "LOCKED").length})
					</button>
				</div>

				{/* Error State Banner */}
				{teamError && (
					<div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-xs">
						<div className="flex items-center gap-2">
							<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
							<span>{teamError}</span>
						</div>
						<button
							onClick={loadTeamHistory}
							className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors font-figtree shrink-0"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							<span>Coba Lagi</span>
						</button>
					</div>
				)}

				{/* Main Team Table */}
				<div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-xs">
							<thead>
								<tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-figtree uppercase tracking-wider font-semibold">
									<th className="py-3 px-4">NIK</th>
									<th className="py-3 px-4">Nama Pegawai</th>
									<th className="py-3 px-4">Departemen</th>
									<th className="py-3 px-4 text-center">Hari Wajib</th>
									<th className="py-3 px-4 text-center">Disetujui</th>
									<th className="py-3 px-4 text-center">
										<div className="inline-flex items-center justify-center gap-1 group/tooltip relative">
											<span>Gap Hari</span>
											<Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
											<div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block z-20 w-48 p-2 bg-slate-900 text-white text-[10px] font-normal normal-case rounded-lg shadow-lg text-center leading-tight pointer-events-none">
												Selisih hari jadwal wajib dengan hari yang disetujui (Hari Wajib - Disetujui)
											</div>
										</div>
									</th>
									<th className="py-3 px-4 text-right">Rata Skor</th>
									<th className="py-3 px-4 text-center">Status</th>
									<th className="py-3 px-4 text-center">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{teamLoading ? (
									<tr>
										<td colSpan={9} className="py-16 text-center text-slate-500">
											<div className="flex flex-col items-center justify-center gap-2">
												<Loader2 className="h-6 w-6 animate-spin text-sky-600" />
												<span className="font-figtree font-medium">Memuat data riwayat tim...</span>
											</div>
										</td>
									</tr>
								) : filteredTeamList.length === 0 ? (
									<tr>
										<td colSpan={9} className="py-16 text-center text-slate-500 font-medium">
											<div className="space-y-1">
												<p className="text-sm font-bold text-slate-700 font-figtree">Tidak Ada Data Pegawai</p>
												<p className="text-xs text-slate-400">Tidak ada pegawai yang sesuai dengan filter atau kata kunci pencarian.</p>
											</div>
										</td>
									</tr>
								) : (
									filteredTeamList.map((row) => {
										const gap = Number(row.gap_hari) || 0;
										return (
											<tr
												key={row.id || row.pegawai_id}
												onClick={() => handleOpenPanel(row)}
												className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
											>
												<td className="py-3.5 px-4 font-mono font-medium text-slate-600">{row.nik || "-"}</td>
												<td className="py-3.5 px-4 font-bold text-slate-900 font-figtree group-hover:text-sky-700 transition-colors">
													{row.nama}
												</td>
												<td className="py-3.5 px-4 text-slate-600">{row.nama_departemen || "-"}</td>
												<td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.total_hari_jadwal || 0}</td>
												<td className="py-3.5 px-4 text-center font-bold text-emerald-600">{row.hari_approved || 0}</td>
												<td className="py-3.5 px-4 text-center">
													{gap > 0 ? (
														<span className="inline-block font-extrabold px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-700">
															{gap}
														</span>
													) : (
														<span className="inline-block font-medium px-2 py-0.5 text-xs text-slate-500">
															{gap}
														</span>
													)}
												</td>
												<td className="py-3.5 px-4 text-right font-black text-slate-900 font-figtree">
													{Math.round(row.rata_skor_total || 0)}
												</td>
												<td className="py-3.5 px-4 text-center">
													<span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md uppercase font-figtree tracking-wide border ${
														row.status_rekap === "LOCKED"
															? "bg-slate-100 text-slate-700 border-slate-300"
															: "bg-emerald-50 text-emerald-700 border-emerald-200"
													}`}>
														{row.status_rekap || "OPEN"}
													</span>
												</td>
												<td className="py-3.5 px-4 text-center">
													<button
														onClick={(e) => { e.stopPropagation(); handleOpenPanel(row); }}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors font-figtree"
													>
														<Eye className="w-3.5 h-3.5" />
														<span>Detail</span>
													</button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Table Pagination */}
				<div className="flex items-center justify-between pt-2">
					<span className="text-xs text-slate-500 font-medium font-figtree">
						Halaman {teamPage} dari {teamTotalPages}
					</span>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
							disabled={teamPage <= 1 || teamLoading}
							className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer font-figtree"
						>
							<ChevronLeft className="w-4 h-4 inline" /> Prev
						</button>
						<button
							onClick={() => setTeamPage((p) => Math.min(teamTotalPages, p + 1))}
							disabled={teamPage >= teamTotalPages || teamLoading}
							className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer font-figtree"
						>
							Next <ChevronRight className="w-4 h-4 inline" />
						</button>
					</div>
				</div>
			</div>

			{/* SLIDE-OVER DRAWER (MASTER-DETAIL FOR EMPLOYEE APPRAISAL) */}
			{panelOpen && selectedEmp && (
				<div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
					<div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-300">
						
						{/* Drawer Header with Employee Stepper & Month Navigation */}
						<div className="p-4 md:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="space-y-0.5">
								<div className="flex items-center gap-2">
									<h3 className="font-bold text-base md:text-lg font-figtree text-slate-900">
										{selectedEmp.nama}
									</h3>
									<span className="text-xs px-2 py-0.5 font-mono font-semibold bg-slate-100 text-slate-700 rounded">
										{selectedEmp.nik || "-"}
									</span>
								</div>
								<p className="text-xs text-slate-500 font-medium">
									Departemen: {selectedEmp.nama_departemen || "-"}
								</p>
							</div>

							<div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
								{/* Prev / Next Employee Quick Navigation */}
								<div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-figtree">
									<button
										onClick={handlePrevEmployee}
										disabled={selectedEmpIndex <= 0}
										title="Pegawai Sebelumnya"
										className="p-1 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-slate-700"
									>
										<ChevronLeft className="w-4 h-4" />
									</button>
									<span className="px-1.5 text-slate-600 font-medium text-[11px]" title="Gunakan tombol panah ← / → atau J / K">
										{selectedEmpIndex + 1}/{teamList.length}
									</span>
									<button
										onClick={handleNextEmployee}
										disabled={selectedEmpIndex >= teamList.length - 1}
										title="Pegawai Berikutnya"
										className="p-1 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-slate-700"
									>
										<ChevronRight className="w-4 h-4" />
									</button>
								</div>

								{/* Month Selector */}
								<div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
									<button 
										onClick={() => {
											let m = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").subtract(1, "month");
											setPanelMonth(m.format("MM"));
											setPanelYear(m.format("YYYY"));
										}} 
										className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
									>
										<ChevronLeft className="h-4 w-4" />
									</button>
									<span className="font-bold text-slate-900 min-w-[90px] text-center font-figtree text-xs">
										{moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").locale("id").format("MMM YYYY")}
									</span>
									<button 
										onClick={() => {
											let m = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").add(1, "month");
											setPanelMonth(m.format("MM"));
											setPanelYear(m.format("YYYY"));
										}} 
										className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
									>
										<ChevronRight className="h-4 w-4" />
									</button>
								</div>

								{/* Close Drawer Button */}
								<button
									onClick={() => { setPanelOpen(false); setActiveDayDetail(null); }}
									className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>

						{/* Drawer Body */}
						<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
							{panelError && (
								<div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
									<div className="flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
										<span>{panelError}</span>
									</div>
									<button
										onClick={loadPanelHistory}
										className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors font-figtree"
									>
										Coba Lagi
									</button>
								</div>
							)}

							{panelLoading ? (
								<div className="flex flex-col justify-center items-center py-24 space-y-3">
									<Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
									<span className="text-xs font-semibold text-slate-500 font-figtree">Memuat kalender evaluasi pegawai...</span>
								</div>
							) : activeDayDetail ? (
								/* INLINE DAY DETAIL VIEW (Drilldown inside Drawer - No modal-on-drawer trap!) */
								<div className="space-y-4 animate-in fade-in duration-200">
									{/* Drilldown Back Bar */}
									<div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
										<button
											onClick={() => setActiveDayDetail(null)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs font-figtree transition-all shadow-xs"
										>
											<ArrowLeft className="w-4 h-4 text-slate-600" />
											<span>Kembali ke Kalender</span>
										</button>
										<div className="text-right">
											<span className="text-xs font-bold text-slate-900 font-figtree block">
												{moment(activeDayDetail.dateStr).locale("id").format("dddd, D MMMM YYYY")}
											</span>
											<span className="text-[11px] text-slate-500 font-medium">
												Shift: {activeDayDetail.shift || "Non-Shift"} {activeDayDetail.isTambahan ? "(Tambahan)" : ""}
											</span>
										</div>
									</div>

									{dayDetailError && (
										<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
											<span>{dayDetailError}</span>
											<button 
												onClick={() => handleSelectDay(activeDayDetail)}
												className="px-2 py-1 bg-rose-600 text-white rounded font-bold text-[11px]"
											>
												Ulangi
											</button>
										</div>
									)}

									{/* Score Metrics Trio */}
									<div className="grid grid-cols-3 gap-3">
										<div className="bg-white border border-slate-200 p-3 rounded-xl text-center shadow-xs">
											<span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-figtree block">Skor Kegiatan</span>
											<span className="text-lg md:text-xl font-bold text-slate-900 mt-0.5 block font-figtree">
												{Math.round(activeDayDetail.evaluation?.skor_kegiatan || 0)}
											</span>
										</div>
										<div className="bg-white border border-slate-200 p-3 rounded-xl text-center shadow-xs">
											<span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-figtree block">Skor Absensi</span>
											<span className="text-lg md:text-xl font-bold text-slate-900 mt-0.5 block font-figtree">
												{Math.round(activeDayDetail.evaluation?.skor_absensi || 0)}
											</span>
										</div>
										<div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center shadow-xs">
											<span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider font-figtree block">Skor Total</span>
											<span className="text-lg md:text-xl font-black text-emerald-700 mt-0.5 block font-figtree">
												{Math.round(activeDayDetail.evaluation?.skor_total || 0)}
											</span>
										</div>
									</div>

									{/* Attendance & Condition Details */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
										<div>
											<span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-figtree">Sumber Kehadiran</span>
											<span className="font-semibold text-slate-800 uppercase block mt-0.5">
												{activeDayDetail.evaluation?.sumber_absensi || "Presensi Mesin"}
											</span>
										</div>
										<div>
											<span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-figtree">Kondisi Absensi</span>
											<span className="font-semibold text-slate-800 capitalize block mt-0.5">
												{activeDayDetail.evaluation?.nilai_kondisi?.replace(/_/g, " ") || "Hadir Tepat Waktu"}
											</span>
										</div>
									</div>

									{/* Late Reason */}
									{activeDayDetail.evaluation?.alasan_terlambat && (
										<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
											<span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block font-figtree">Alasan Terlambat</span>
											<p className="text-xs text-rose-900 font-medium leading-relaxed">
												{activeDayDetail.evaluation.alasan_terlambat}
											</p>
										</div>
									)}

									{/* Supervisor Note */}
									{activeDayDetail.evaluation?.catatan_supervisor && (
										<div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
											<div className="flex items-center gap-1.5 font-bold text-xs text-sky-800 font-figtree uppercase tracking-wider">
												<Info className="h-4 w-4 text-sky-600" />
												Catatan Supervisor
											</div>
											<p className="text-xs text-sky-900 italic font-medium mt-1 leading-relaxed">
												{activeDayDetail.evaluation.catatan_supervisor}
											</p>
										</div>
									)}

									{/* Activity List */}
									<div className="space-y-3 pt-2">
										<h4 className="font-bold text-slate-900 text-sm font-figtree">
											Daftar Kegiatan Kerja Harian
										</h4>

										{dayDetailLoading ? (
											<div className="flex justify-center items-center py-8">
												<Loader2 className="h-6 w-6 text-sky-600 animate-spin" />
											</div>
										) : dayDetailActivities.length === 0 ? (
											<div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl text-xs font-medium">
												Tidak ada rincian kegiatan kerja yang tercatat.
											</div>
										) : (
											<div className="space-y-2">
												{dayDetailActivities.map((act) => {
													const isDone = act.status_selesai === "selesai";
													return (
														<div
															key={act.id}
															className={`p-3.5 border rounded-xl flex items-start gap-3 transition-colors ${
																isDone ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white"
															}`}
														>
															{isDone ? (
																<CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
															) : (
																<XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
															)}
															<div className="flex-1 min-w-0">
																<span className={`text-xs md:text-sm font-semibold block ${isDone ? "text-slate-700" : "text-slate-900"}`}>
																	{act.judul_kegiatan}
																</span>
																{act.penjabaran && (
																	<p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.penjabaran}</p>
																)}
																{!isDone && act.alasan_belum_selesai && (
																	<div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
																		<span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block font-figtree">
																			Alasan Belum Selesai
																		</span>
																		<p className="text-xs font-medium text-amber-900 mt-0.5 leading-relaxed">
																			{act.alasan_belum_selesai}
																		</p>
																	</div>
																)}
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								</div>
							) : (
								/* CALENDAR / LIST MASTER VIEW */
								<>
									{/* Monthly Metric Cards */}
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
										<div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-0.5">
											<span className="text-[10px] text-slate-500 font-bold uppercase font-figtree block">Hari Wajib</span>
											<span className="text-lg font-bold text-slate-900 font-figtree">{panelStats.workDaysCount} Hari</span>
										</div>
										<div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 shadow-xs space-y-0.5">
											<span className="text-[10px] text-emerald-800 font-bold uppercase font-figtree block">Disetujui</span>
											<span className="text-lg font-bold text-emerald-700 font-figtree">{panelStats.approvedDays} Hari</span>
										</div>
										<div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 shadow-xs space-y-0.5">
											<span className="text-[10px] text-rose-800 font-bold uppercase font-figtree block">Gap Hari</span>
											<span className="text-lg font-bold text-rose-700 font-figtree">{panelStats.gapDays} Hari</span>
										</div>
										<div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5 shadow-xs space-y-0.5">
											<span className="text-[10px] text-sky-800 font-bold uppercase font-figtree block">Rata-Rata Skor</span>
											<span className="text-lg font-bold text-sky-700 font-figtree">{panelStats.avgScore}</span>
										</div>
									</div>

									{/* View Switcher & Title */}
									<div className="flex items-center justify-between border-b border-slate-200 pb-3">
										<h4 className="font-bold text-slate-900 text-sm font-figtree">
											Rincian Evaluasi Bulanan
										</h4>
										<div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-figtree">
											<button
												onClick={() => setPanelViewMode("grid")}
												className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-all ${
													panelViewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
												}`}
											>
												<Grid className="w-3.5 h-3.5" />
												<span>Kalender</span>
											</button>
											<button
												onClick={() => setPanelViewMode("list")}
												className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-all ${
													panelViewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
												}`}
											>
												<List className="w-3.5 h-3.5" />
												<span>Daftar Detail</span>
											</button>
										</div>
									</div>

									{/* Mode 1: Calendar Grid */}
									{panelViewMode === "grid" ? (
										<div className="space-y-3">
											<div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 font-figtree">
												<div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
											</div>
											<div className="grid grid-cols-7 gap-1.5 md:gap-2.5">
												{Array.from({ length: adjustedStartDay }).map((_, idx) => (
													<div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 border border-slate-100 rounded-xl pointer-events-none opacity-20" />
												))}
												{daysMatrix.map((dayItem) => {
													let boxClass = "bg-white border-slate-200 text-slate-800";
													let badge = null;
													let isClickable = false;

													if (!dayItem.isWorkDay) {
														boxClass = "bg-slate-50 text-slate-400 border-slate-200/80";
														badge = <span className="text-[10px] font-bold text-slate-400 font-mono">OFF</span>;
													} else if (!dayItem.evaluation) {
														if (dayItem.isFuture) {
															boxClass = "bg-white text-slate-300 border-slate-200 border-dashed";
															badge = <span className="text-[10px] font-bold text-slate-300 font-mono">-</span>;
														} else {
															boxClass = "bg-rose-50/50 text-rose-800 border-rose-200";
															badge = <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded font-figtree">KOSONG</span>;
														}
													} else {
														isClickable = true;
														const status = dayItem.evaluation.status;
														if (status === "approved") {
															boxClass = "bg-emerald-50/40 text-emerald-900 border-emerald-200 hover:border-emerald-400 hover:shadow-xs";
															badge = (
																<div className="text-center">
																	<span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-100 text-emerald-700 rounded font-mono">OK</span>
																	<span className="text-xs md:text-sm font-bold block text-emerald-800 font-figtree mt-0.5 leading-none">
																		{Math.round(dayItem.evaluation.skor_total)}
																	</span>
																</div>
															);
														} else if (status === "submitted") {
															boxClass = "bg-amber-50/40 text-amber-900 border-amber-200 hover:border-amber-400 hover:shadow-xs";
															badge = (
																<div className="text-center">
																	<span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-800 rounded font-mono">PENDING</span>
																	<span className="text-xs md:text-sm font-bold block text-amber-900 font-figtree mt-0.5 leading-none">
																		{Math.round(dayItem.evaluation.skor_total)}
																	</span>
																</div>
															);
														} else {
															const isRev = status === "revisi";
															boxClass = isRev 
																? "bg-rose-50/40 text-rose-900 border-rose-200 hover:border-rose-400 hover:shadow-xs"
																: "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400 hover:shadow-xs";
															badge = (
																<div className="text-center">
																	{isRev ? (
																		<span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded font-mono bg-rose-100 text-rose-700">
																			REVISI
																		</span>
																	) : (
																		<span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded font-mono bg-slate-200 text-slate-700">
																			DRAF
																		</span>
																	)}
																	<span className="text-xs md:text-sm font-bold block text-slate-800 font-figtree mt-0.5 leading-none">
																		{Math.round(dayItem.evaluation.skor_total)}
																	</span>
																</div>
															);
														}
													}

													return (
														<div
															key={dayItem.day}
															onClick={() => isClickable && handleSelectDay(dayItem)}
															className={`aspect-square rounded-xl border p-1.5 md:p-2.5 flex flex-col justify-between transition-all ${boxClass} ${
																isClickable ? "cursor-pointer hover:-translate-y-0.5 active:scale-95" : "pointer-events-none"
															}`}
														>
															<div className="flex justify-between items-center w-full leading-none">
																<span className="text-xs md:text-sm font-bold font-figtree">{dayItem.day}</span>
																{dayItem.isWorkDay && (
																	<span className="text-[10px] font-semibold text-slate-500 font-mono">{dayItem.shift}</span>
																)}
															</div>
															<div className="flex-1 flex items-center justify-center py-1">{badge}</div>
															{dayItem.isWorkDay && dayItem.isTambahan && (
																<div className="w-full flex justify-end">
																	<span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Shift Tambahan" />
																</div>
															)}
														</div>
													);
												})}
											</div>

											{/* Persistent Legend */}
											<div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-figtree flex items-center gap-4 flex-wrap text-slate-600">
												<span className="font-bold text-slate-700">Keterangan:</span>
												<div className="flex items-center gap-1.5">
													<span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
													<span>OK (Disetujui)</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
													<span>PENDING (Menunggu)</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
													<span>REVISI / KOSONG</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
													<span>OFF (Libur)</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="w-2 h-2 rounded-full bg-amber-500" />
													<span>Shift Tambahan</span>
												</div>
											</div>
										</div>
									) : (
										/* Mode 2: Chronological List View */
										<div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
											<table className="w-full text-left border-collapse text-xs">
												<thead>
													<tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-figtree uppercase tracking-wider font-semibold">
														<th className="py-2.5 px-3">Tanggal</th>
														<th className="py-2.5 px-3">Hari</th>
														<th className="py-2.5 px-3 text-center">Shift</th>
														<th className="py-2.5 px-3 text-center">Status</th>
														<th className="py-2.5 px-3 text-right">Skor Total</th>
														<th className="py-2.5 px-3 text-center">Aksi</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{daysMatrix.map((item) => {
														const mDate = moment(item.dateStr);
														const isEvaluated = !!item.evaluation;
														return (
															<tr
																key={item.day}
																onClick={() => isEvaluated && handleSelectDay(item)}
																className={`transition-colors ${
																	isEvaluated ? "hover:bg-sky-50/40 cursor-pointer" : ""
																}`}
															>
																<td className="py-2.5 px-3 font-mono font-medium text-slate-700">
																	{mDate.format("DD/MM/YYYY")}
																</td>
																<td className="py-2.5 px-3 font-semibold text-slate-800 font-figtree">
																	{mDate.locale("id").format("dddd")}
																</td>
																<td className="py-2.5 px-3 text-center font-mono">
																	{item.shift ? (
																		item.isTambahan ? (
																			<span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
																				{item.shift} (T)
																			</span>
																		) : (
																			<span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
																				{item.shift}
																			</span>
																		)
																	) : (
																		<span className="text-slate-400">-</span>
																	)}
																</td>
																<td className="py-2.5 px-3 text-center">
																	{!item.isWorkDay ? (
																		<span className="text-slate-400 font-bold">OFF</span>
																	) : !item.evaluation ? (
																		item.isFuture ? (
																			<span className="text-slate-400">-</span>
																		) : (
																			<span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
																				KOSONG
																			</span>
																		)
																	) : (
																		<span className={`px-2 py-0.5 rounded font-bold uppercase font-figtree ${
																			item.evaluation.status === "approved"
																				? "bg-emerald-50 text-emerald-700 border border-emerald-200"
																				: item.evaluation.status === "submitted"
																				? "bg-amber-50 text-amber-700 border border-amber-200"
																				: "bg-rose-50 text-rose-700 border border-rose-200"
																		}`}>
																			{item.evaluation.status}
																		</span>
																	)}
																</td>
																<td className="py-2.5 px-3 text-right font-bold text-slate-900 font-figtree">
																	{item.evaluation ? Math.round(item.evaluation.skor_total) : "-"}
																</td>
																<td className="py-2.5 px-3 text-center">
																	{isEvaluated ? (
																		<button
																			onClick={(e) => { e.stopPropagation(); handleSelectDay(item); }}
																			className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors font-figtree"
																		>
																			Lihat
																		</button>
																	) : (
																		<span className="text-slate-300">-</span>
																	)}
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									)}
								</>
							)}
						</div>

						{/* Drawer Footer */}
						<div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
							<button
								onClick={() => { setPanelOpen(false); setActiveDayDetail(null); }}
								className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all cursor-pointer font-figtree"
							>
								Tutup Panel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
