"use client";

import React, { useEffect } from "react";
import moment from "moment";
import { ShieldCheck, X, Loader2, Calendar as CalendarIcon, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import AuditCalendarGrid from "./AuditCalendarGrid";

const DEFAULT_MONTHS = [
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

const DEFAULT_YEARS = ["2024", "2025", "2026", "2027"];

export default function AuditDetailDrawer({
	isOpen,
	onClose,
	selectedEmp,
	hasPrev = false,
	hasNext = false,
	onPrevEmp,
	onNextEmp,
	panelMonth,
	setPanelMonth,
	panelYear,
	setPanelYear,
	panelLoading = false,
	panelSchedule,
	panelIsTambahanMap,
	panelEvaluations = [],
	selectedDateStr,
	selectedEval,
	selectedDayMeta = { shift: "", isWorkDay: false },
	activities = [],
	activityLoading = false,
	onSelectDay,
	onCloseDayActivities,
	MONTHS = DEFAULT_MONTHS,
	YEARS = DEFAULT_YEARS,
}) {
	// Escape key dismissal
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				if (selectedDateStr && onCloseDayActivities) {
					onCloseDayActivities();
				} else if (onClose) {
					onClose();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, selectedDateStr, onClose, onCloseDayActivities]);

	if (!isOpen || !selectedEmp) return null;

	const monthPadded = String(panelMonth).padStart(2, "0");
	const daysInMonth = moment(`${panelYear}-${monthPadded}-01`, "YYYY-MM-DD").daysInMonth();

	let workDaysCount = 0;
	let kosongDays = 0;
	let futureWorkDays = 0;

	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${panelYear}-${monthPadded}-${String(d).padStart(2, "0")}`;
		const isFuture = moment(dateStr).isAfter(moment(), "day");
		const shift = panelSchedule ? panelSchedule[`h${d}`] || "" : "";
		const isWorkDay = shift !== "";

		if (isWorkDay) {
			workDaysCount++;
			const evaluation = panelEvaluations.find((e) => {
				if (!e?.tanggal) return false;
				const raw = String(e.tanggal);
				if (raw.startsWith(dateStr)) return true;
				const parsed = moment(e.tanggal).format("YYYY-MM-DD");
				return parsed === dateStr;
			});

			if (!evaluation) {
				if (isFuture) {
					futureWorkDays++;
				} else {
					kosongDays++;
				}
			}
		}
	}

	const approvedDays = panelEvaluations.filter((e) => e.status === "approved").length;
	const pendingDays = panelEvaluations.filter((e) => e.status === "submitted").length;
	const draftOrRevisiDays = panelEvaluations.filter(
		(e) => e.status === "draft" || e.status === "revisi"
	).length;
	const gapDays = futureWorkDays > 0 ? futureWorkDays : Math.max(0, workDaysCount - approvedDays);

	const approvedEvals = panelEvaluations.filter((e) => e.status === "approved");
	const avgScore =
		approvedEvals.length > 0
			? Math.round(
					approvedEvals.reduce((sum, e) => sum + Number(e.skor_total || 0), 0) /
						approvedEvals.length
			  )
			: 0;

	const formattedSelectedDate = selectedDateStr
		? moment(selectedDateStr).format("DD MMMM YYYY")
		: "";

	return (
		<div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
			<div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
				{/* Drawer Header */}
				<div className="p-5 bg-white flex justify-between items-start border-b border-slate-200 relative gap-3">
					<div className="space-y-1 flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<ShieldCheck className="w-4 h-4 text-sky-600" />
							<span className="text-[10px] font-bold text-sky-800 uppercase tracking-widest font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200/80">
								Audit Detail Pegawai
							</span>
						</div>
						<h2 className="text-xl font-extrabold text-slate-900 font-figtree truncate">
							{selectedEmp.nama}
						</h2>
						<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
							<span>
								NIK: <strong className="text-slate-900 font-bold">{selectedEmp.nik}</strong>
							</span>
							<span>•</span>
							<span>
								Dept:{" "}
								<strong className="text-slate-900 font-bold">
									{selectedEmp.nama_departemen || "-"}
								</strong>
							</span>
							<span>•</span>
							<span>
								Status:{" "}
								<strong className="text-slate-900 font-bold">
									{selectedEmp.stts_kerja || "-"}
								</strong>
							</span>
						</div>
					</div>

					{/* Navigation controls & Close button */}
					<div className="flex items-center gap-1.5 shrink-0">
						{onPrevEmp && (
							<button
								type="button"
								onClick={onPrevEmp}
								disabled={!hasPrev}
								className={`p-1.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-xs ${
									hasPrev
										? "bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
										: "bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed"
								}`}
								title="Pegawai Sebelumnya"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
						)}
						{onNextEmp && (
							<button
								type="button"
								onClick={onNextEmp}
								disabled={!hasNext}
								className={`p-1.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-xs ${
									hasNext
										? "bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
										: "bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed"
								}`}
								title="Pegawai Berikutnya"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-xs ml-1"
							title="Tutup (Esc)"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Drawer Month / Year Controls */}
				<div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
					<span className="text-xs font-bold text-slate-700 font-figtree uppercase tracking-wider">
						Periode Grid Evaluasi
					</span>
					<div className="flex items-center gap-2">
						<select
							value={panelMonth}
							onChange={(e) => setPanelMonth(e.target.value)}
							className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
						>
							{MONTHS.map((m) => (
								<option key={m.value} value={m.value}>
									{m.label}
								</option>
							))}
						</select>
						<select
							value={panelYear}
							onChange={(e) => setPanelYear(e.target.value)}
							className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
						>
							{YEARS.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Drawer Body */}
				<div className="flex-1 overflow-y-auto p-5 space-y-5">
					{panelLoading ? (
						<div className="flex flex-col justify-center items-center py-20 space-y-3">
							<Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
							<span className="text-xs text-slate-500 font-medium">
								Memuat riwayat kinerja pegawai...
							</span>
						</div>
					) : (
						<>
							{/* Employee Summary Stats: 7 metrics */}
							<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
								{/* 1. Hari Wajib Kerja */}
								<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
									<span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">
										Wajib Kerja
									</span>
									<span className="text-base font-extrabold text-slate-900 font-figtree">
										{workDaysCount} <span className="text-xs font-normal text-slate-500">Hari</span>
									</span>
								</div>

								{/* 2. Disetujui Spv */}
								<div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-0.5">
									<span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block font-figtree">
										Disetujui
									</span>
									<span className="text-base font-extrabold text-emerald-700 font-figtree">
										{approvedDays} <span className="text-xs font-normal text-emerald-600">Hari</span>
									</span>
								</div>

								{/* 3. Pending Spv */}
								<div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-0.5">
									<span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block font-figtree">
										Pending
									</span>
									<span className="text-base font-extrabold text-amber-700 font-figtree">
										{pendingDays} <span className="text-xs font-normal text-amber-600">Hari</span>
									</span>
								</div>

								{/* 4. Draft / Revisi */}
								<div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-0.5">
									<span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block font-figtree">
										Draft/Rev
									</span>
									<span className="text-base font-extrabold text-slate-800 font-figtree">
										{draftOrRevisiDays} <span className="text-xs font-normal text-slate-500">Hari</span>
									</span>
								</div>

								{/* 5. Kosong */}
								<div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-0.5">
									<span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider block font-figtree">
										Kosong
									</span>
									<span className="text-base font-extrabold text-rose-700 font-figtree">
										{kosongDays} <span className="text-xs font-normal text-rose-600">Hari</span>
									</span>
								</div>

								{/* 6. Gap Hari */}
								<div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-0.5">
									<span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider block font-figtree">
										Gap Hari
									</span>
									<span className="text-base font-extrabold text-rose-700 font-figtree">
										{gapDays} <span className="text-xs font-normal text-rose-600">Hari</span>
									</span>
								</div>

								{/* 7. Rata-Rata Nilai */}
								<div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 space-y-0.5 col-span-2 sm:col-span-2 lg:col-span-1">
									<span className="text-[9px] font-bold text-sky-800 uppercase tracking-wider block font-figtree">
										Rata Skor
									</span>
									<span className="text-base font-extrabold text-sky-700 font-figtree">
										{avgScore}
									</span>
								</div>
							</div>

							{/* Calendar Grid Section */}
							<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
								<div className="flex justify-between items-center border-b border-slate-100 pb-2">
									<h4 className="font-bold text-slate-900 text-xs md:text-sm font-figtree">
										Kalender Kegiatan Harian
									</h4>
									<span className="text-[10px] text-slate-500 font-medium">
										Pilih tanggal untuk melihat rincian aktivitas inline
									</span>
								</div>
								<AuditCalendarGrid
									panelYear={panelYear}
									panelMonth={panelMonth}
									panelSchedule={panelSchedule}
									panelIsTambahanMap={panelIsTambahanMap}
									panelEvaluations={panelEvaluations}
									selectedDateStr={selectedDateStr}
									onSelectDay={onSelectDay}
								/>
							</div>

							{/* Inline Daily Activity Inspector */}
							{selectedDateStr && (
								<div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3.5 animate-fadeIn">
									<div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
										<div className="flex items-center gap-2">
											<CalendarIcon className="w-4 h-4 text-sky-600" />
											<h4 className="font-bold text-sm text-slate-900 font-figtree">
												Rincian Kegiatan: {formattedSelectedDate}
											</h4>
										</div>
										<button
											type="button"
											onClick={onCloseDayActivities}
											className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-xs"
										>
											Tutup Rincian
										</button>
									</div>

									{activityLoading ? (
										<div className="flex flex-col justify-center items-center py-8 space-y-2">
											<Loader2 className="h-6 w-6 text-sky-600 animate-spin" />
											<span className="text-xs text-slate-500 font-medium">
												Memuat rincian aktivitas harian...
											</span>
										</div>
									) : (
										<>
											{/* Daily Attendance & Shift Summary */}
											{selectedEval ? (
												<div className="bg-white border border-slate-200/80 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shadow-2xs">
													<div>
														<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">
															Shift Jadwal
														</span>
														<span className="font-extrabold text-slate-800 font-mono">
															{selectedEval.shift_jadwal || "-"}
														</span>
													</div>
													<div>
														<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">
															Status Absensi
														</span>
														<span className="font-semibold text-slate-700 capitalize">
															{selectedEval.nilai_kondisi || "-"}
														</span>
													</div>
													<div>
														<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">
															Skor Absensi
														</span>
														<span className="font-bold text-emerald-700 font-mono">
															{selectedEval.skor_absensi ?? 0}
														</span>
													</div>
													<div>
														<span className="text-[10px] font-bold text-slate-400 uppercase block font-figtree">
															Total Skor Harian
														</span>
														<span className="font-extrabold text-sky-800 font-figtree text-sm">
															{Math.round(selectedEval.skor_total ?? 0)}
														</span>
													</div>
												</div>
											) : (
												<div className="bg-white border border-rose-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
													<div className="flex items-center justify-between">
														<span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded uppercase font-mono">
															{selectedDayMeta?.isWorkDay ? "Hari Kosong / Belum Diisi" : "Hari Libur (OFF)"}
														</span>
														{selectedDayMeta?.shift && (
															<span className="text-xs font-mono font-bold text-slate-600">
																Shift: <strong className="text-slate-900">{selectedDayMeta.shift}</strong>
															</span>
														)}
													</div>
													<p className="text-xs text-rose-800">
														{selectedDayMeta?.isWorkDay
															? "Pegawai memiliki jadwal shift kerja pada tanggal ini, namun belum mengisi atau menyerahkan penilaian dan laporan kegiatan harian."
															: "Tidak ada jadwal shift kerja (OFF) untuk pegawai pada tanggal ini."}
													</p>
												</div>
											)}

											{/* Daily Activities List */}
											<div className="space-y-2">
												<h5 className="font-bold text-xs text-slate-600 uppercase font-figtree tracking-wider">
													Aktivitas & Output Kerja ({activities.length})
												</h5>

												{activities.length === 0 ? (
													<div className="text-center py-6 bg-white rounded-xl border border-slate-200/80">
														<p className="text-xs text-slate-500 font-medium">
															Tidak ada rincian kegiatan tercatat untuk tanggal ini.
														</p>
													</div>
												) : (
													<div className="space-y-2">
														{activities.map((act, idx) => {
															const isDone =
																act.status_selesai === "selesai" ||
																act.status_selesai === 1 ||
																act.status_selesai === "1" ||
																act.status_selesai === true;
															return (
																<div
																	key={act.id || idx}
																	className="bg-white border border-slate-200/80 rounded-xl p-3 space-y-1.5 shadow-2xs"
																>
																	<div className="flex justify-between items-start gap-2">
																		<span className="font-bold text-xs text-slate-800 font-figtree">
																			{idx + 1}. {act.judul_kegiatan}
																		</span>
																		{isDone ? (
																			<span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
																				<CheckCircle className="w-3 h-3 text-emerald-600" /> Selesai
																			</span>
																		) : (
																			<span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200/80 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
																				<XCircle className="w-3 h-3 text-rose-600" /> Belum Selesai
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
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
