"use client";

import React, { useEffect } from "react";
import moment from "moment";
import { ShieldCheck, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
	selectedDateStr = "",
	onSelectDay,
	MONTHS = DEFAULT_MONTHS,
	YEARS = DEFAULT_YEARS,
}) {
	// Escape key dismissal
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && onClose) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen || !selectedEmp) return null;

	const monthPadded = String(panelMonth).padStart(2, "0");
	const daysInMonth = moment(`${panelYear}-${monthPadded}-01`, "YYYY-MM-DD").daysInMonth();

	let workDaysCount = 0;
	let kosongDays = 0;
	let futureWorkDays = 0;
	let pastWorkDays = 0;

	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${panelYear}-${monthPadded}-${String(d).padStart(2, "0")}`;
		const isFuture = moment(dateStr).isAfter(moment(), "day");
		const shift = panelSchedule ? panelSchedule[`h${d}`] || "" : "";
		const shiftStr = String(shift).trim();
		const shiftUpper = shiftStr.toUpperCase();

		const evaluation = panelEvaluations.find((e) => {
			if (!e?.tanggal) return false;
			const raw = String(e.tanggal);
			if (raw.startsWith(dateStr)) return true;
			const parsed = moment(e.tanggal).format("YYYY-MM-DD");
			return parsed === dateStr;
		});

		const isDinasLuar =
			shiftUpper === "D" ||
			shiftUpper === "DL" ||
			shiftUpper.includes("DINAS") ||
			evaluation?.sumber_absensi === "izin_dinas" ||
			evaluation?.sumber_absensi === "izin" ||
			evaluation?.nilai_kondisi === "izin_dinas_luar" ||
			evaluation?.nilai_kondisi === "izin_dinas" ||
			(evaluation?.nilai_kondisi && String(evaluation.nilai_kondisi).toLowerCase().includes("dinas")) ||
			(evaluation?.catatan_supervisor && String(evaluation.catatan_supervisor).toLowerCase().includes("dinas")) ||
			evaluation?.shift_jadwal === "D" ||
			(evaluation?.shift_jadwal && String(evaluation.shift_jadwal).toUpperCase().includes("DINAS"));

		const isCuti =
			!isDinasLuar &&
			(shiftUpper === "C" ||
				shiftUpper === "CT" ||
				shiftUpper.startsWith("CUTI") ||
				evaluation?.sumber_absensi === "cuti" ||
				(evaluation?.nilai_kondisi && String(evaluation.nilai_kondisi).startsWith("cuti_")) ||
				evaluation?.nilai_kondisi === "sakit" ||
				(evaluation?.catatan_supervisor && String(evaluation.catatan_supervisor).toLowerCase().includes("cuti")) ||
				evaluation?.shift_jadwal === "C" ||
				(evaluation?.shift_jadwal && String(evaluation.shift_jadwal).toUpperCase().startsWith("CUTI")));

		const isOff = shiftStr === "" || ["OFF", "LIBUR", "-", "0"].includes(shiftUpper);
		const isWorkDay = !isOff && !isCuti;

		if (isWorkDay) {
			workDaysCount++;
			if (isFuture) {
				futureWorkDays++;
			} else {
				pastWorkDays++;
			}

			if (!evaluation && !isFuture) {
				kosongDays++;
			}
		}
	}

	const approvedDays = panelEvaluations.filter((e) => e.status === "approved").length;
	const pendingDays = panelEvaluations.filter((e) => e.status === "submitted").length;
	const draftOrRevisiDays = panelEvaluations.filter(
		(e) => e.status === "draft" || e.status === "revisi"
	).length;

	const isCurrentMonth = moment().format("YYYY-MM") === `${panelYear}-${monthPadded}`;
	const gapDays = isCurrentMonth
		? futureWorkDays + Math.max(0, pastWorkDays - approvedDays)
		: Math.max(0, workDaysCount - approvedDays);

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
										Klik tanggal untuk membuka modal rincian kegiatan
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
						</>
					)}
				</div>
			</div>
		</div>
	);
}
