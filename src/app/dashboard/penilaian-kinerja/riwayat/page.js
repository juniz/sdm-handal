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
	Clock,
	X,
	Eye,
	Loader2,
	AlertCircle
} from "lucide-react";

export default function RiwayatPenilaianPage() {
	const [currentMonth, setCurrentMonth] = useState(moment().format("MM"));
	const [currentYear, setCurrentYear] = useState(moment().format("YYYY"));
	const [loading, setLoading] = useState(true);
	
	const [schedule, setSchedule] = useState(null);
	const [isTambahanMap, setIsTambahanMap] = useState({});
	const [evaluations, setEvaluations] = useState([]);
	const [selectedEval, setSelectedEval] = useState(null);
	const [modalLoading, setModalLoading] = useState(false);
	const [modalActivities, setModalActivities] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	useEffect(() => {
		loadHistory();
	}, [currentMonth, currentYear]);

	const loadHistory = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			// 1. Fetch Schedule for Month
			const schedRes = await fetch(`/api/penilaian/jadwal?bulan=${currentMonth}&tahun=${currentYear}`);
			if (!schedRes.ok) throw new Error("Gagal mengambil jadwal");
			const schedData = await schedRes.json();
			setSchedule(schedData.hasSchedule ? schedData.schedule : null);
			setIsTambahanMap(schedData.isTambahan || {});

			// 2. Fetch Harian Records for Month
			const harianRes = await fetch(`/api/penilaian/harian?bulan=${currentMonth}&tahun=${currentYear}`);
			if (!harianRes.ok) throw new Error("Gagal mengambil data riwayat");
			const harianData = await harianRes.json();
			setEvaluations(harianData.data || []);
		} catch (err) {
			console.error(err);
			setErrorMsg(err.message || "Gagal memuat data riwayat");
		} finally {
			setLoading(false);
		}
	};

	const handlePrevMonth = () => {
		let m = moment(`${currentYear}-${currentMonth}-01`, "YYYY-MM-DD").subtract(1, "month");
		setCurrentMonth(m.format("MM"));
		setCurrentYear(m.format("YYYY"));
	};

	const handleNextMonth = () => {
		let m = moment(`${currentYear}-${currentMonth}-01`, "YYYY-MM-DD").add(1, "month");
		setCurrentMonth(m.format("MM"));
		setCurrentYear(m.format("YYYY"));
	};

	const viewDetail = async (record) => {
		setSelectedEval(record);
		setModalLoading(true);
		setIsModalOpen(true);
		try {
			const res = await fetch(`/api/penilaian/harian?tanggal=${moment(record.tanggal).format("YYYY-MM-DD")}`);
			if (!res.ok) throw new Error("Gagal memuat detail kegiatan");
			const data = await res.json();
			setModalActivities(data.data?.kegiatan || []);
		} catch (err) {
			console.error(err);
		} finally {
			setModalLoading(false);
		}
	};

	// Generate all days of the month
	const daysInMonth = moment(`${currentYear}-${currentMonth}-01`, "YYYY-MM-DD").daysInMonth();
	const daysList = [];
	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
		const isFuture = moment(dateStr).isAfter(moment(), "day");
		const shift = schedule ? (schedule[`h${d}`] || "") : "";
		const isWorkDay = shift !== "";
		const isTambahan = isTambahanMap[`h${d}`] || false;
		
		// Find matching evaluation
		const evaluation = evaluations.find(e => moment(e.tanggal).format("YYYY-MM-DD") === dateStr);
		
		daysList.push({
			day: d,
			dateStr,
			isFuture,
			isWorkDay,
			shift,
			isTambahan,
			evaluation
		});
	}

	// Statistics
	const totalWorkDays = daysList.filter(d => d.isWorkDay).length;
	const approvedDays = evaluations.filter(e => e.status === "approved").length;
	const pendingDays = evaluations.filter(e => e.status === "submitted").length;
	const draftOrRevisiDays = evaluations.filter(e => e.status === "draft" || e.status === "revisi").length;
	
	const approvedEvals = evaluations.filter(e => e.status === "approved");
	const avgScore = approvedEvals.length > 0
		? Math.round(approvedEvals.reduce((sum, e) => sum + Number(e.skor_total), 0) / approvedEvals.length)
		: 0;

	const gapDays = Math.max(0, totalWorkDays - approvedDays);

	const startDayOfWeek = moment(`${currentYear}-${currentMonth}-01`, "YYYY-MM-DD").day(); // 0 (Sun) to 6 (Sat)
	const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

	const getStatusBadge = (status) => {
		switch (status) {
			case "draft":
				return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-slate-100 text-slate-700 border border-slate-200 font-figtree tracking-wider">DRAF</span>;
			case "submitted":
				return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-amber-50 text-amber-800 border border-amber-200 font-figtree tracking-wider animate-pulse">PENDING</span>;
			case "approved":
				return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-figtree tracking-wider">DISETUJUI</span>;
			case "revisi":
				return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-rose-50 text-rose-800 border border-rose-200 font-figtree tracking-wider">REVISI</span>;
			default:
				return null;
		}
	};

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			<div className="bg-gradient-to-r from-primary-900 to-primary-800 border border-primary-800/20 rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10">
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800">Riwayat Penilaian Saya</h1>
					<p className="text-slate-550 text-sm mt-1">Lacak pencapaian skor harian dan rekap bulanan Anda.</p>
				</div>
				<div className="relative z-10 flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
					<button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-all duration-200 text-slate-700 hover:scale-105 active:scale-95 cursor-pointer">
						<ChevronLeft className="h-5 w-5" />
					</button>
					<span className="font-bold text-slate-800 min-w-[120px] text-center font-figtree text-sm">
						{moment(`${currentYear}-${currentMonth}-01`, "YYYY-MM-DD").locale("id").format("MMMM YYYY")}
					</span>
					<button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-all duration-200 text-slate-700 hover:scale-105 active:scale-95 cursor-pointer">
						<ChevronRight className="h-5 w-5" />
					</button>
				</div>
			</div>

			{errorMsg && (
				<div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 animate-fadeIn">
					<AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm">{errorMsg}</span>
				</div>
			)}

			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
				</div>
			) : (
				<>
					{/* Monthly Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1 transition-all duration-200 hover:shadow-md">
							<span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Hari Wajib Kerja</span>
							<span className="text-3xl font-extrabold text-slate-800 font-figtree">{totalWorkDays} Hari</span>
							<span className="text-[10px] text-slate-500 block mt-1 font-medium">Sesuai jadwal dinas shift</span>
						</div>
						<div className="bg-emerald-50/20 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-1 transition-all duration-200 hover:shadow-md">
							<span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block font-figtree">Disetujui Supervisor</span>
							<span className="text-3xl font-extrabold text-emerald-600 font-figtree">{approvedDays} Hari</span>
							<span className="text-[10px] text-emerald-700 block mt-1 font-medium">{pendingDays} pending, {draftOrRevisiDays} draf/revisi</span>
						</div>
						<div className={`${gapDays > 0 ? "bg-rose-50/20 border-rose-200" : "bg-white border-slate-200/80"} border rounded-2xl p-5 shadow-sm space-y-1 transition-all duration-200 hover:shadow-md`}>
							<span className={`text-[10px] ${gapDays > 0 ? "text-rose-800" : "text-slate-400"} font-bold uppercase tracking-wider block font-figtree`}>Gap Hari (Deduction)</span>
							<span className={`text-3xl font-extrabold font-figtree ${gapDays > 0 ? "text-rose-600" : "text-slate-800"}`}>
								{gapDays} Hari
							</span>
							<span className={`text-[10px] ${gapDays > 0 ? "text-rose-700" : "text-slate-500"} block mt-1 font-medium`}>Hari kerja belum disetujui</span>
						</div>
						<div className="bg-gradient-to-br from-white to-primary-50/10 border border-primary-100 rounded-2xl p-5 shadow-sm space-y-1 transition-all duration-200 hover:shadow-md relative overflow-hidden">
							{/* Accent strip */}
							<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />
							<span className="text-[10px] text-primary-800 font-bold uppercase tracking-wider block font-figtree">Rata-Rata Nilai</span>
							<span className="text-3xl font-black text-primary-600 font-figtree">{avgScore}</span>
							<span className="text-[10px] text-primary-500 block mt-1 font-medium">Dari hari yang disetujui</span>
						</div>
					</div>

					{/* Calendar Days Sheet (Grid View) */}
					<div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
						<div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
							<h3 className="font-bold text-slate-800 text-sm font-figtree">Rincian Hari per Bulan</h3>
							<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500 font-figtree uppercase tracking-wider">
								<div className="flex items-center gap-1.5">
									<div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded"></div>
									<span>Libur/Off</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded"></div>
									<span>Belum Diisi</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="w-3 h-3 bg-emerald-50/20 border border-emerald-200 rounded"></div>
									<span>Disetujui</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="w-3 h-3 bg-amber-50/20 border border-amber-200 rounded"></div>
									<span>Pending</span>
								</div>
							</div>
						</div>

						<div className="p-4 md:p-6">
							{/* Day names row */}
							<div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-100 mb-3">
								<div>Sen</div>
								<div>Sel</div>
								<div>Rab</div>
								<div>Kam</div>
								<div>Jum</div>
								<div>Sab</div>
								<div>Min</div>
							</div>

							{/* Grid cells */}
							<div className="grid grid-cols-7 gap-2 md:gap-3">
								{/* Placeholder cells for alignment */}
								{Array.from({ length: adjustedStartDay }).map((_, idx) => (
									<div 
										key={`empty-${idx}`} 
										className="aspect-square bg-slate-50/30 border border-slate-100/50 rounded-xl pointer-events-none opacity-20"
									/>
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
										statusBadge = (
											<span className="text-[8px] md:text-[9px] font-bold text-slate-400 font-mono">
												OFF
											</span>
										);
									} else if (!dayItem.evaluation) {
										if (dayItem.isFuture) {
											boxBgClass = "bg-white text-slate-350";
											borderClass = "border-slate-200 border-dashed";
											textClass = "text-slate-355";
										} else {
											boxBgClass = "bg-rose-50/30 text-rose-800";
											borderClass = "border-rose-200";
											textClass = "text-rose-800";
											statusBadge = (
												<span className="px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold bg-rose-100 text-rose-700 rounded uppercase tracking-wider font-mono">
													KOSONG
												</span>
											);
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
													<span className="px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold bg-emerald-100 text-emerald-700 rounded uppercase tracking-wider font-mono">
														OK
													</span>
													<span className="text-xs md:text-sm font-black mt-1 text-emerald-800">
														{Math.round(dayItem.evaluation.skor_total)}
													</span>
												</div>
											);
										} else if (status === "submitted") {
											boxBgClass = "bg-amber-50/20 text-amber-900";
											borderClass = "border-amber-200 hover:border-amber-400";
											textClass = "text-amber-900";
											statusBadge = (
												<div className="flex flex-col items-center">
													<span className="px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold bg-amber-100 text-amber-700 rounded uppercase tracking-wider font-mono animate-pulse">
														PENDING
													</span>
													<span className="text-xs md:text-sm font-black mt-1 text-amber-800">
														{Math.round(dayItem.evaluation.skor_total)}
													</span>
												</div>
											);
										} else {
											const isRevisi = status === "revisi";
											boxBgClass = isRevisi ? "bg-rose-50/20 text-rose-900" : "bg-slate-50 text-slate-700";
											borderClass = isRevisi ? "border-rose-200 hover:border-rose-400" : "border-slate-200 hover:border-slate-350";
											textClass = isRevisi ? "text-rose-900" : "text-slate-700";
											statusBadge = (
												<div className="flex flex-col items-center">
													<span className={`px-1.5 py-0.5 text-[8px] md:text-[9px] font-extrabold rounded uppercase tracking-wider font-mono ${
														isRevisi ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"
													}`}>
														{isRevisi ? "REVISI" : "DRAF"}
													</span>
													<span className="text-xs md:text-sm font-black mt-1 text-slate-800">
														{Math.round(dayItem.evaluation.skor_total)}
													</span>
												</div>
											);
										}
									}

									return (
										<div
											key={dayItem.day}
											onClick={() => isClickable && viewDetail(dayItem.evaluation)}
											className={`aspect-square rounded-2xl border p-1.5 md:p-3 flex flex-col justify-between transition-all duration-200 ${boxBgClass} ${borderClass} ${
												isClickable 
													? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95" 
													: "pointer-events-none"
											}`}
										>
											{/* Header of box: number and shift */}
											<div className="flex justify-between items-center w-full">
												<span className={`text-xs md:text-sm font-extrabold font-figtree ${textClass}`}>
													{dayItem.day}
												</span>
												{dayItem.isWorkDay && (
													<span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase font-mono">
														{dayItem.shift}
													</span>
												)}
											</div>

											{/* Center/bottom status & score */}
											<div className="flex-1 flex items-center justify-center pt-1 md:pt-2">
												{statusBadge}
											</div>

											{/* Footer flag for tambahan */}
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
					</div>
				</>
			)}

			{/* Modal Detail */}
			{isModalOpen && selectedEval && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 relative">
						<div className="bg-gradient-to-r from-primary-900 to-primary-800 px-6 py-4 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none"></div>
							<div className="relative z-10">
								<h3 className="font-extrabold text-lg font-figtree text-slate-800">Detail Kegiatan Kerja</h3>
								<p className="text-xs text-slate-550 mt-0.5 font-medium">
									{moment(selectedEval.tanggal).locale("id").format("dddd, D MMMM YYYY")} — Shift {selectedEval.shift_jadwal}
								</p>
							</div>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-550 hover:text-slate-850 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
							{/* Performance values grid */}
							<div className="grid grid-cols-3 gap-3 bg-primary-50/30 border border-primary-100/50 p-4 rounded-xl">
								<div className="text-center">
									<span className="text-[9px] text-primary-800 font-bold block uppercase tracking-wider font-figtree">Skor Kegiatan</span>
									<span className="text-lg font-extrabold text-slate-800 mt-1 block font-figtree">{Math.round(selectedEval.skor_kegiatan)}</span>
								</div>
								<div className="text-center">
									<span className="text-[9px] text-primary-800 font-bold block uppercase tracking-wider font-figtree">Skor Absensi</span>
									<span className="text-lg font-extrabold text-slate-800 mt-1 block font-figtree">{Math.round(selectedEval.skor_absensi)}</span>
								</div>
								<div className="text-center bg-primary-50 border border-primary-100 rounded-lg p-1.5">
									<span className="text-[9px] text-primary-800 font-bold block uppercase tracking-wider font-figtree">Skor Akhir</span>
									<span className="text-lg font-black text-primary-900 mt-1 block font-figtree">{Math.round(selectedEval.skor_total)}</span>
								</div>
							</div>

							{/* Resolved condition */}
							<div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-100 p-4 rounded-xl">
								<div>
									<span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Sumber Kehadiran</span>
									<span className="font-semibold text-slate-800 block uppercase mt-0.5">{selectedEval.sumber_absensi}</span>
								</div>
								<div>
									<span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Kondisi Absensi</span>
									<span className="font-semibold text-slate-800 block capitalize mt-0.5">{selectedEval.nilai_kondisi.replace(/_/g, " ")}</span>
								</div>
							</div>

							{/* Late Reason Display */}
							{selectedEval.alasan_terlambat && (
								<div className="p-4 bg-rose-50/60 border border-rose-100/50 rounded-xl space-y-1">
									<span className="text-[9px] text-rose-600 font-bold block uppercase tracking-wider font-figtree">Alasan Terlambat</span>
									<p className="text-xs text-rose-955 leading-relaxed font-semibold break-words">
										{selectedEval.alasan_terlambat}
									</p>
								</div>
							)}

							{/* Supervisor comments */}
							{selectedEval.catatan_supervisor && (
								<div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-800 rounded-xl space-y-1 animate-fadeIn">
									<div className="flex items-center gap-1.5 font-bold text-xs font-figtree uppercase tracking-wider">
										<Info className="h-4 w-4 text-rose-600" />
										Catatan Supervisor
									</div>
									<p className="text-xs text-rose-700 italic leading-relaxed font-medium bg-white/60 p-3 rounded-lg border border-rose-100/50 mt-1.5">{selectedEval.catatan_supervisor}</p>
								</div>
							)}

							{/* Activities section */}
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
									<div className="space-y-2.5">
										{modalActivities.map((act) => (
											<div 
												key={act.id} 
												className={`p-3.5 border rounded-xl flex items-start gap-3 transition-colors ${
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
													{act.penjabaran && <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{act.penjabaran}</p>}
													{act.status_selesai === "belum" && act.alasan_belum_selesai && (
														<div className="mt-2 p-2.5 bg-amber-50/60 border border-amber-100/40 rounded-lg">
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

						{/* Modal Footer */}
						<div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
							<button 
								onClick={() => setIsModalOpen(false)}
								className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 transition-all text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 shadow-sm"
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
