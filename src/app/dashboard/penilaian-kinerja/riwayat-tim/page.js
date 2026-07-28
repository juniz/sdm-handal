"use client";

import { useState, useEffect } from "react";
import moment from "moment";
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
	Users,
	Search,
	ShieldAlert
} from "lucide-react";

export default function RiwayatPenilaianTimPage() {
	// Role State
	const [userProfile, setUserProfile] = useState(null);
	const [hasElevatedRole, setHasElevatedRole] = useState(false);
	const [isSupervisor, setIsSupervisor] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [roleLoading, setRoleLoading] = useState(true);

	// Team History State
	const [teamLoading, setTeamLoading] = useState(false);
	const [teamList, setTeamList] = useState([]);
	const [teamMonth, setTeamMonth] = useState(moment().format("MM"));
	const [teamYear, setTeamYear] = useState(moment().format("YYYY"));
	const [teamDepartemen, setTeamDepartemen] = useState("ALL");
	const [teamSearch, setTeamSearch] = useState("");
	const [teamPage, setTeamPage] = useState(1);
	const [teamTotalPages, setTeamTotalPages] = useState(1);
	const [teamSummary, setTeamSummary] = useState(null);
	const [departemenList, setDepartemenList] = useState([]);

	// Slide-over Panel State (Employee Detail)
	const [selectedEmp, setSelectedEmp] = useState(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMonth, setPanelMonth] = useState(moment().format("MM"));
	const [panelYear, setPanelYear] = useState(moment().format("YYYY"));
	const [panelLoading, setPanelLoading] = useState(false);
	const [panelSchedule, setPanelSchedule] = useState(null);
	const [panelIsTambahanMap, setPanelIsTambahanMap] = useState({});
	const [panelEvaluations, setPanelEvaluations] = useState([]);

	// Modal Activity Detail State
	const [selectedEval, setSelectedEval] = useState(null);
	const [modalLoading, setModalLoading] = useState(false);
	const [modalActivities, setModalActivities] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// 1. Initial Role Detection & Dept Fetch
	useEffect(() => {
		checkRole();
		fetchDepartments();
	}, []);

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

	// 2. Load Team History (For Elevated Roles)
	useEffect(() => {
		if (hasElevatedRole) {
			const timer = setTimeout(() => {
				loadTeamHistory();
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [hasElevatedRole, teamMonth, teamYear, teamDepartemen, teamSearch, teamPage]);

	const loadTeamHistory = async () => {
		setTeamLoading(true);
		try {
			const params = new URLSearchParams({
				bulan: teamMonth,
				tahun: teamYear,
				departemen: teamDepartemen,
				nama: teamSearch,
				page: teamPage.toString(),
				limit: "10"
			});
			const res = await fetch(`/api/penilaian/rekap?${params}`);
			if (!res.ok) throw new Error("Gagal mengambil riwayat tim");
			const result = await res.json();
			setTeamList(result.data || []);
			setTeamTotalPages(result.meta?.totalPages || 1);
			setTeamSummary(result.summary || null);
		} catch (err) {
			console.error(err);
		} finally {
			setTeamLoading(false);
		}
	};

	// 3. Load Slide-Over Panel Data (Selected Employee History)
	useEffect(() => {
		if (selectedEmp && panelOpen) {
			loadPanelHistory();
		}
	}, [selectedEmp, panelMonth, panelYear, panelOpen]);

	const loadPanelHistory = async () => {
		if (!selectedEmp) return;
		setPanelLoading(true);
		try {
			const schedRes = await fetch(`/api/penilaian/jadwal?bulan=${panelMonth}&tahun=${panelYear}&pegawai_id=${selectedEmp.pegawai_id}`);
			const schedData = await schedRes.json();
			setPanelSchedule(schedData.hasSchedule ? schedData.schedule : null);
			setPanelIsTambahanMap(schedData.isTambahan || {});

			const harianRes = await fetch(`/api/penilaian/harian?bulan=${panelMonth}&tahun=${panelYear}&pegawai_id=${selectedEmp.pegawai_id}`);
			const harianData = await harianRes.json();
			setPanelEvaluations(harianData.data || []);
		} catch (err) {
			console.error("Error loading panel history", err);
		} finally {
			setPanelLoading(false);
		}
	};

	const handleOpenPanel = (emp) => {
		setSelectedEmp(emp);
		setPanelMonth(teamMonth);
		setPanelYear(teamYear);
		setPanelOpen(true);
	};

	const viewDetail = async (record, pegawaiIdOverride = null) => {
		setSelectedEval(record);
		setModalLoading(true);
		setIsModalOpen(true);
		try {
			let url = `/api/penilaian/harian?tanggal=${moment(record.tanggal).format("YYYY-MM-DD")}`;
			if (pegawaiIdOverride) {
				url += `&pegawai_id=${pegawaiIdOverride}`;
			} else if (selectedEmp?.pegawai_id) {
				url += `&pegawai_id=${selectedEmp.pegawai_id}`;
			}
			const res = await fetch(url);
			if (!res.ok) throw new Error("Gagal memuat detail kegiatan");
			const data = await res.json();
			setModalActivities(data.data?.kegiatan || []);
		} catch (err) {
			console.error(err);
		} finally {
			setModalLoading(false);
		}
	};

	// Calendar generator helper
	const renderCalendarGrid = (mMonth, mYear, mSched, mIsTambahan, mEvals, onCardClick) => {
		const daysInMonth = moment(`${mYear}-${mMonth}-01`, "YYYY-MM-DD").daysInMonth();
		const daysList = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${mYear}-${String(mMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
			const isFuture = moment(dateStr).isAfter(moment(), "day");
			const shift = mSched ? (mSched[`h${d}`] || "") : "";
			const isWorkDay = shift !== "";
			const isTambahan = mIsTambahan ? (mIsTambahan[`h${d}`] || false) : false;
			const evaluation = mEvals.find(e => moment(e.tanggal).format("YYYY-MM-DD") === dateStr);
			daysList.push({ day: d, dateStr, isFuture, isWorkDay, shift, isTambahan, evaluation });
		}

		const startDayOfWeek = moment(`${mYear}-${mMonth}-01`, "YYYY-MM-DD").day();
		const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

		return (
			<div>
				<div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 mb-3 font-figtree">
					<div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
				</div>
				<div className="grid grid-cols-7 gap-1.5 md:gap-3">
					{Array.from({ length: adjustedStartDay }).map((_, idx) => (
						<div key={`empty-${idx}`} className="aspect-square bg-slate-50/30 border border-slate-100/50 rounded-xl pointer-events-none opacity-20" />
					))}
					{daysList.map((dayItem) => {
						let boxBgClass = "bg-white";
						let borderClass = "border-slate-200";
						let textClass = "text-slate-800";
						let statusBadge = null;
						let isClickable = false;

						if (!dayItem.isWorkDay) {
							boxBgClass = "bg-slate-50/70 text-slate-400";
							borderClass = "border-slate-200";
							textClass = "text-slate-400";
							statusBadge = <span className="text-[7px] md:text-[9px] font-bold text-slate-400 font-mono">OFF</span>;
						} else if (!dayItem.evaluation) {
							if (dayItem.isFuture) {
								boxBgClass = "bg-white text-slate-300";
								borderClass = "border-slate-200 border-dashed";
								textClass = "text-slate-300";
								statusBadge = <span className="text-[8px] md:text-[9px] font-bold text-slate-300 font-mono">-</span>;
							} else {
								boxBgClass = "bg-rose-50/30 text-rose-800";
								borderClass = "border-rose-200";
								textClass = "text-rose-800";
								statusBadge = <span className="px-1 py-0.5 text-[7px] md:text-[9px] font-extrabold bg-rose-100 text-rose-700 rounded uppercase tracking-wider font-mono">KOSONG</span>;
							}
						} else {
							const status = dayItem.evaluation.status;
							isClickable = true;
							if (status === "approved") {
								boxBgClass = "bg-emerald-50/20 text-emerald-900";
								borderClass = "border-emerald-200 hover:border-emerald-400";
								textClass = "text-emerald-900";
								statusBadge = (
									<div className="flex flex-col items-center">
										<span className="hidden md:inline-block px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold bg-emerald-100 text-emerald-700 rounded uppercase tracking-wider font-mono">OK</span>
										<span className="text-xs md:text-sm font-black md:mt-1 text-emerald-800 font-figtree leading-none">{Math.round(dayItem.evaluation.skor_total)}</span>
									</div>
								);
							} else if (status === "submitted") {
								boxBgClass = "bg-amber-50/20 text-amber-900";
								borderClass = "border-amber-200 hover:border-amber-400";
								textClass = "text-amber-900";
								statusBadge = (
									<div className="flex flex-col items-center">
										<span className="hidden md:inline-block px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold bg-amber-100 text-amber-700 rounded uppercase tracking-wider font-mono animate-pulse">PENDING</span>
										<span className="text-xs md:text-sm font-black md:mt-1 text-amber-800 font-figtree leading-none">{Math.round(dayItem.evaluation.skor_total)}</span>
									</div>
								);
							} else {
								const isRevisi = status === "revisi";
								boxBgClass = isRevisi ? "bg-rose-50/20 text-rose-900" : "bg-slate-50 text-slate-700";
								borderClass = isRevisi ? "border-rose-200 hover:border-rose-400" : "border-slate-200 hover:border-slate-350";
								textClass = isRevisi ? "text-rose-900" : "text-slate-700";
								statusBadge = (
									<div className="flex flex-col items-center">
										<span className={`hidden md:inline-block px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold rounded uppercase tracking-wider font-mono ${isRevisi ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"}`}>
											{isRevisi ? "REVISI" : "DRAF"}
										</span>
										<span className={`text-xs md:text-sm font-black md:mt-1 font-figtree leading-none ${isRevisi ? "text-rose-800" : "text-slate-700"}`}>
											{Math.round(dayItem.evaluation.skor_total)}
										</span>
									</div>
								);
							}
						}

						return (
							<div
								key={dayItem.day}
								onClick={() => isClickable && onCardClick(dayItem.evaluation)}
								className={`aspect-square rounded-xl md:rounded-2xl border p-1 md:p-3 flex flex-col justify-between transition-all duration-200 ${boxBgClass} ${borderClass} ${
									isClickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95" : "pointer-events-none"
								}`}
							>
								<div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-0.5 leading-none">
									<span className={`text-[10px] md:text-sm font-extrabold font-figtree ${textClass}`}>{dayItem.day}</span>
									{dayItem.isWorkDay && (
										<span className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase font-mono tracking-tighter md:tracking-normal">{dayItem.shift}</span>
									)}
								</div>
								<div className="flex-1 flex items-center justify-center pt-0.5 md:pt-2">{statusBadge}</div>
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

	// Statistics helper
	const calcStats = (mMonth, mYear, mSched, mIsTambahan, mEvals) => {
		const daysInMonth = moment(`${mYear}-${mMonth}-01`, "YYYY-MM-DD").daysInMonth();
		let workDaysCount = 0;
		for (let d = 1; d <= daysInMonth; d++) {
			if (mSched && (mSched[`h${d}`] || "") !== "") {
				workDaysCount++;
			}
		}
		const approvedDays = mEvals.filter(e => e.status === "approved").length;
		const pendingDays = mEvals.filter(e => e.status === "submitted").length;
		const draftOrRevisiDays = mEvals.filter(e => e.status === "draft" || e.status === "revisi").length;
		const approvedEvals = mEvals.filter(e => e.status === "approved");
		const avgScore = approvedEvals.length > 0
			? Math.round(approvedEvals.reduce((sum, e) => sum + Number(e.skor_total), 0) / approvedEvals.length)
			: 0;
		const gapDays = Math.max(0, workDaysCount - approvedDays);
		return { workDaysCount, approvedDays, pendingDays, draftOrRevisiDays, avgScore, gapDays };
	};

	const panelStats = calcStats(panelMonth, panelYear, panelSchedule, panelIsTambahanMap, panelEvaluations);

	if (roleLoading) {
		return (
			<div className="flex justify-center items-center py-24">
				<Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
			</div>
		);
	}

	if (!hasElevatedRole) {
		return (
			<div className="w-full p-6 space-y-6 font-noto-sans">
				<div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto mt-12 shadow-xs">
					<ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
					<h2 className="text-xl font-bold text-slate-800 font-figtree">Akses Terbatas</h2>
					<p className="text-slate-600 text-xs leading-relaxed">
						Halaman ini hanya dapat diakses oleh Supervisor dan Administrator untuk memantau riwayat evaluasi tim.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			{/* Header Banner */}
			<div className="bg-gradient-to-r from-primary-900 to-primary-800 border border-primary-800/20 rounded-2xl p-4 md:p-8 text-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10">
					<div className="flex items-center gap-2">
						<h1 className="text-xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800">
							Riwayat Penilaian Tim & Pegawai
						</h1>
						<span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-figtree">
							{isAdmin ? "Mode Admin" : "Mode Supervisor"}
						</span>
					</div>
					<p className="text-slate-550 text-xs md:text-sm mt-1">
						Pantau riwayat evaluasi bulanan pegawai yang Anda kelola. Klik baris pegawai untuk membuka detail kalender.
					</p>
				</div>

				{teamSummary && (
					<div className="relative z-10 flex items-center gap-4 bg-white/90 px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs text-xs font-figtree">
						<div>
							<span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pegawai</span>
							<span className="font-extrabold text-slate-800 text-base">{teamSummary.totalEmployees} Orang</span>
						</div>
						<div className="h-7 w-px bg-slate-200" />
						<div>
							<span className="text-slate-400 block text-[10px] uppercase font-bold">Rata-Rata Skor</span>
							<span className="font-extrabold text-blue-600 text-base">{Math.round(teamSummary.avgMonthlyScore || 0)}</span>
						</div>
					</div>
				)}
			</div>

			{/* Filters & Table Card */}
			<div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
				{/* Filters Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{/* Month Select */}
					<div className="space-y-1">
						<label className="text-[11px] font-semibold text-slate-500">Bulan</label>
						<select
							value={teamMonth}
							onChange={(e) => { setTeamMonth(e.target.value); setTeamPage(1); }}
							className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
						>
							{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
								const val = String(m).padStart(2, "0");
								return (
									<option key={val} value={val}>
										{moment(`2026-${val}-01`, "YYYY-MM-DD").locale("id").format("MMMM")}
									</option>
								);
							})}
						</select>
					</div>

					{/* Year Input */}
					<div className="space-y-1">
						<label className="text-[11px] font-semibold text-slate-500">Tahun</label>
						<input
							type="number"
							value={teamYear}
							onChange={(e) => { setTeamYear(e.target.value); setTeamPage(1); }}
							className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
							placeholder="Tahun"
						/>
					</div>

					{/* Departemen Select */}
					<div className="space-y-1">
						<label className="text-[11px] font-semibold text-slate-500">Departemen</label>
						<select
							value={teamDepartemen}
							onChange={(e) => { setTeamDepartemen(e.target.value); setTeamPage(1); }}
							className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
						<label className="text-[11px] font-semibold text-slate-500">Cari Pegawai</label>
						<div className="relative">
							<Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
							<input
								type="text"
								value={teamSearch}
								onChange={(e) => { setTeamSearch(e.target.value); setTeamPage(1); }}
								placeholder="Nama atau NIK..."
								className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2.5 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>

				{/* Team Table View */}
				<div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
					<table className="w-full text-left border-collapse text-xs">
						<thead>
							<tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-figtree uppercase tracking-wider font-semibold">
								<th className="py-3 px-4">NIK</th>
								<th className="py-3 px-4">Nama Pegawai</th>
								<th className="py-3 px-4">Departemen</th>
								<th className="py-3 px-4 text-center">Hari Wajib</th>
								<th className="py-3 px-4 text-center">Disetujui</th>
								<th className="py-3 px-4 text-center">Gap Hari</th>
								<th className="py-3 px-4 text-right">Rata Skor</th>
								<th className="py-3 px-4 text-center">Status</th>
								<th className="py-3 px-4 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{teamLoading ? (
								<tr>
									<td colSpan={9} className="py-12 text-center text-slate-500">
										<div className="flex items-center justify-center gap-2">
											<Loader2 className="h-5 w-5 animate-spin text-blue-600" />
											<span>Memuat riwayat tim...</span>
										</div>
									</td>
								</tr>
							) : teamList.length === 0 ? (
								<tr>
									<td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
										Tidak ada data pegawai ditemukan.
									</td>
								</tr>
							) : (
								teamList.map((row) => (
									<tr
										key={row.id || row.pegawai_id}
										onClick={() => handleOpenPanel(row)}
										className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
									>
										<td className="py-3 px-4 font-mono font-medium text-slate-600">{row.nik || "-"}</td>
										<td className="py-3 px-4 font-bold text-slate-800 font-figtree group-hover:text-blue-600 transition-colors">{row.nama}</td>
										<td className="py-3 px-4 text-slate-500">{row.nama_departemen || "-"}</td>
										<td className="py-3 px-4 text-center font-medium text-slate-700">{row.total_hari_jadwal || 0}</td>
										<td className="py-3 px-4 text-center font-bold text-emerald-600">{row.hari_approved || 0}</td>
										<td className="py-3 px-4 text-center font-bold text-rose-500">{row.gap_hari || 0}</td>
										<td className="py-3 px-4 text-right font-black text-slate-800 font-figtree">{Math.round(row.rata_skor_total || 0)}</td>
										<td className="py-3 px-4 text-center">
											<span className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase font-figtree tracking-wider ${
												row.status_rekap === "LOCKED"
													? "bg-slate-100 text-slate-700 border border-slate-200"
													: "bg-emerald-50 text-emerald-700 border border-emerald-200"
											}`}>
												{row.status_rekap || "OPEN"}
											</span>
										</td>
										<td className="py-3 px-4 text-center">
											<button
												onClick={(e) => { e.stopPropagation(); handleOpenPanel(row); }}
												className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-figtree"
											>
												<Eye className="w-3.5 h-3.5" />
												<span>Detail</span>
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Team Table Pagination */}
				<div className="flex items-center justify-between pt-2">
					<span className="text-xs text-slate-500 font-medium">
						Halaman {teamPage} dari {teamTotalPages}
					</span>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
							disabled={teamPage <= 1 || teamLoading}
							className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
						>
							<ChevronLeft className="w-4 h-4 inline" /> Prev
						</button>
						<button
							onClick={() => setTeamPage((p) => Math.min(teamTotalPages, p + 1))}
							disabled={teamPage >= teamTotalPages || teamLoading}
							className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
						>
							Next <ChevronRight className="w-4 h-4 inline" />
						</button>
					</div>
				</div>
			</div>

			{/* SLIDE-OVER PANEL: DETAIL KALENDER PEGAWAI (TEAM MEMBER) */}
			{panelOpen && selectedEmp && (
				<div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs">
					<div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
						<div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
							
							{/* Panel Header */}
							<div className="p-5 bg-gradient-to-r from-primary-900 to-primary-800 text-slate-800 border-b border-slate-200 flex items-center justify-between relative overflow-hidden">
								<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none" />
								<div className="relative z-10 space-y-0.5">
									<h3 className="font-extrabold text-lg font-figtree text-slate-800">
										Riwayat Penilaian: {selectedEmp.nama}
									</h3>
									<p className="text-xs text-slate-500">
										NIK: {selectedEmp.nik || "-"} • Departemen: {selectedEmp.nama_departemen || "-"}
									</p>
								</div>
								<div className="flex items-center gap-2 relative z-10">
									{/* Month Navigator inside Panel */}
									<div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
										<button onClick={() => {
											let m = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").subtract(1, "month");
											setPanelMonth(m.format("MM"));
											setPanelYear(m.format("YYYY"));
										}} className="p-1 hover:bg-slate-100 rounded-lg transition-all text-slate-700">
											<ChevronLeft className="h-4 w-4" />
										</button>
										<span className="font-bold text-slate-800 min-w-[100px] text-center font-figtree text-xs">
											{moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").locale("id").format("MMMM YYYY")}
										</span>
										<button onClick={() => {
											let m = moment(`${panelYear}-${panelMonth}-01`, "YYYY-MM-DD").add(1, "month");
											setPanelMonth(m.format("MM"));
											setPanelYear(m.format("YYYY"));
										}} className="p-1 hover:bg-slate-100 rounded-lg transition-all text-slate-700">
											<ChevronRight className="h-4 w-4" />
										</button>
									</div>

									<button
										onClick={() => { setPanelOpen(false); setSelectedEmp(null); }}
										className="p-2 hover:bg-slate-200/50 rounded-xl text-slate-600 transition-colors"
									>
										<X className="w-5 h-5" />
									</button>
								</div>
							</div>

							{/* Panel Content Body */}
							<div className="flex-1 overflow-y-auto p-5 space-y-6">
								{panelLoading ? (
									<div className="flex justify-center items-center py-20">
										<Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
									</div>
								) : (
									<>
										{/* Stat Cards */}
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
											<div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-0.5">
												<span className="text-[9px] text-slate-400 font-bold uppercase font-figtree block">Hari Wajib</span>
												<span className="text-xl font-black text-slate-800 font-figtree">{panelStats.workDaysCount} Hari</span>
											</div>
											<div className="bg-emerald-50/20 border border-emerald-200 rounded-xl p-3 shadow-2xs space-y-0.5">
												<span className="text-[9px] text-emerald-800 font-bold uppercase font-figtree block">Disetujui</span>
												<span className="text-xl font-black text-emerald-600 font-figtree">{panelStats.approvedDays} Hari</span>
											</div>
											<div className="bg-rose-50/20 border border-rose-200 rounded-xl p-3 shadow-2xs space-y-0.5">
												<span className="text-[9px] text-rose-800 font-bold uppercase font-figtree block">Gap Hari</span>
												<span className="text-xl font-black text-rose-600 font-figtree">{panelStats.gapDays} Hari</span>
											</div>
											<div className="bg-blue-50/20 border border-blue-200 rounded-xl p-3 shadow-2xs space-y-0.5">
												<span className="text-[9px] text-blue-800 font-bold uppercase font-figtree block">Rata-Rata Skor</span>
												<span className="text-xl font-black text-blue-600 font-figtree">{panelStats.avgScore}</span>
											</div>
										</div>

										{/* Calendar Grid */}
										<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
											<h4 className="font-bold text-slate-800 text-sm font-figtree border-b border-slate-100 pb-2">
												Rincian Evaluasi Kalender
											</h4>
											{renderCalendarGrid(panelMonth, panelYear, panelSchedule, panelIsTambahanMap, panelEvaluations, (rec) => viewDetail(rec, selectedEmp.pegawai_id))}
										</div>
									</>
								)}
							</div>

							{/* Panel Footer */}
							<div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
								<button
									onClick={() => { setPanelOpen(false); setSelectedEmp(null); }}
									className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
								>
									Tutup Panel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL: DETAIL KEGIATAN KERJA HARIAN */}
			{isModalOpen && selectedEval && (
				<div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 pb-28 md:p-4">
					<div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 relative">
						<div className="bg-gradient-to-r from-primary-900 to-primary-800 px-4 py-3 md:px-6 md:py-4 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none"></div>
							<div className="relative z-10">
								<h3 className="font-extrabold text-base md:text-lg font-figtree text-slate-800">Detail Kegiatan Kerja</h3>
								<p className="text-[10px] md:text-xs text-slate-550 mt-0.5 font-medium">
									{moment(selectedEval.tanggal).locale("id").format("dddd, D MMMM YYYY")} — Shift {selectedEval.shift_jadwal}
								</p>
							</div>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-550 hover:text-slate-850 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="p-4 md:p-6 space-y-4 md:space-y-5 max-h-[70vh] overflow-y-auto">
							<div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
								<div className="text-center p-1.5 bg-white border border-slate-100/80 rounded-lg shadow-xs">
									<span className="text-[8px] md:text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-figtree">Skor Kegiatan</span>
									<span className="text-sm md:text-base font-extrabold text-slate-850 mt-0.5 block font-figtree">{Math.round(selectedEval.skor_kegiatan)}</span>
								</div>
								<div className="text-center p-1.5 bg-white border border-slate-100/80 rounded-lg shadow-xs">
									<span className="text-[8px] md:text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-figtree">Skor Absensi</span>
									<span className="text-sm md:text-base font-extrabold text-slate-850 mt-0.5 block font-figtree">{Math.round(selectedEval.skor_absensi)}</span>
								</div>
								<div className="text-center p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg shadow-xs">
									<span className="text-[8px] md:text-[9px] text-emerald-700 font-bold block uppercase tracking-wider font-figtree">Skor Akhir</span>
									<span className="text-sm md:text-base font-black text-emerald-900 mt-0.5 block font-figtree">{Math.round(selectedEval.skor_total)}</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm bg-slate-50 border border-slate-100 p-3 md:p-4 rounded-xl">
								<div>
									<span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Sumber Kehadiran</span>
									<span className="font-semibold text-slate-800 block uppercase mt-0.5">{selectedEval.sumber_absensi}</span>
								</div>
								<div>
									<span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Kondisi Absensi</span>
									<span className="font-semibold text-slate-800 block capitalize mt-0.5">{selectedEval.nilai_kondisi.replace(/_/g, " ")}</span>
								</div>
							</div>

							{selectedEval.alasan_terlambat && (
								<div className="p-3 md:p-4 bg-rose-50/60 border border-rose-100/50 rounded-xl space-y-1">
									<span className="text-[8px] md:text-[9px] text-rose-600 font-bold block uppercase tracking-wider font-figtree">Alasan Terlambat</span>
									<p className="text-xs text-rose-955 leading-relaxed font-semibold break-words">
										{selectedEval.alasan_terlambat}
									</p>
								</div>
							)}

							{selectedEval.catatan_supervisor && (
								<div className="p-3 md:p-4 bg-rose-50/50 border border-rose-100 text-rose-800 rounded-xl space-y-1 animate-fadeIn">
									<div className="flex items-center gap-1.5 font-bold text-xs font-figtree uppercase tracking-wider">
										<Info className="h-4 w-4 text-rose-600" />
										Catatan Supervisor
									</div>
									<p className="text-xs text-rose-700 italic leading-relaxed font-medium bg-white/60 p-3 rounded-lg border border-rose-100/50 mt-1.5">{selectedEval.catatan_supervisor}</p>
								</div>
							)}

							<div className="space-y-3">
								<h4 className="font-bold text-slate-800 text-sm font-figtree">Daftar Item Kegiatan</h4>
								
								{modalLoading ? (
									<div className="flex justify-center items-center py-10">
										<Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
									</div>
								) : modalActivities.length === 0 ? (
									<p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl font-medium">
										Tidak ada data kegiatan.
									</p>
								) : (
									<div className="space-y-2">
										{modalActivities.map((act) => (
											<div 
												key={act.id} 
												className={`p-3 border rounded-xl flex items-start gap-2.5 transition-colors ${
													act.status_selesai === "selesai" 
														? "border-emerald-100 bg-emerald-50/10" 
														: "border-slate-200/60 bg-slate-50/30"
												}`}
											>
												{act.status_selesai === "selesai" ? (
													<CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
												) : (
													<XCircle className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
												)}
												<div className="flex-1 min-w-0">
													<span className={`text-sm font-semibold text-slate-800 block break-words ${act.status_selesai === "selesai" ? "line-through text-slate-400" : ""}`}>{act.judul_kegiatan}</span>
													{act.penjabaran && <p className="text-xs text-slate-550 mt-1 leading-relaxed break-words">{act.penjabaran}</p>}
													{act.status_selesai === "belum" && act.alasan_belum_selesai && (
														<div className="mt-2 p-2 bg-amber-50/60 border border-amber-100/40 rounded-lg">
															<span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block font-figtree">Alasan Belum Selesai</span>
															<p className="text-xs font-semibold text-amber-900 mt-0.5 break-words leading-relaxed">{act.alasan_belum_selesai}</p>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						<div className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
							<button 
								onClick={() => setIsModalOpen(false)}
								className="px-5 py-2 md:py-2.5 bg-slate-800 hover:bg-slate-900 transition-all text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 shadow-sm"
							>
								Tutup
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
