"use client";

import React from "react";
import moment from "moment";

export default function AuditCalendarGrid({
	panelYear,
	panelMonth,
	panelSchedule,
	panelIsTambahanMap,
	panelEvaluations = [],
	selectedDateStr = "",
	onSelectDay,
}) {
	const monthPadded = String(panelMonth).padStart(2, "0");
	const monthStr = `${panelYear}-${monthPadded}-01`;
	const daysInMonth = moment(monthStr, "YYYY-MM-DD").daysInMonth();
	const startDayOfWeek = moment(monthStr, "YYYY-MM-DD").day();
	const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

	const daysList = [];
	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${panelYear}-${monthPadded}-${String(d).padStart(2, "0")}`;
		const isFuture = moment(dateStr).isAfter(moment(), "day");
		const shift = panelSchedule ? panelSchedule[`h${d}`] || "" : "";
		const isWorkDay = shift !== "";
		const isTambahan = panelIsTambahanMap ? Boolean(panelIsTambahanMap[`h${d}`]) : false;

		// Timezone-safe and format-safe evaluation matching
		const evaluation = panelEvaluations.find((e) => {
			if (!e?.tanggal) return false;
			const raw = String(e.tanggal);
			if (raw.startsWith(dateStr)) return true;
			const parsed = moment(e.tanggal).format("YYYY-MM-DD");
			return parsed === dateStr;
		});

		daysList.push({ day: d, dateStr, isFuture, isWorkDay, shift, isTambahan, evaluation });
	}

	return (
		<div className="space-y-3">
			{/* Shift Legend */}
			<div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
				<span className="font-bold text-slate-700 uppercase">Kode Shift:</span>
				<div className="flex items-center gap-3">
					<span><strong>P</strong> = Pagi</span>
					<span><strong>S</strong> = Siang</span>
					<span><strong>M</strong> = Malam</span>
					<span><strong>OFF</strong> = Libur</span>
					<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block" /> Shift Tambahan</span>
				</div>
			</div>

			{/* Days Header */}
			<div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest pb-2 border-b border-slate-200 font-mono">
				<div>Sen</div>
				<div>Sel</div>
				<div>Rab</div>
				<div>Kam</div>
				<div>Jum</div>
				<div>Sab</div>
				<div>Min</div>
			</div>

			{/* Calendar Cells */}
			<div className="grid grid-cols-7 gap-2">
				{Array.from({ length: adjustedStartDay }).map((_, idx) => (
					<div
						key={`empty-${idx}`}
						className="aspect-square bg-slate-50/60 border border-slate-100 rounded-xl pointer-events-none opacity-30"
					/>
				))}
				{daysList.map((dayItem) => {
					let boxBgClass = "bg-white";
					let borderClass = "border-slate-200 hover:border-slate-400";
					let textClass = "text-slate-900";
					let statusBadge = null;
					const isClickable = true;
					const isSelected = selectedDateStr === dayItem.dateStr;

					if (!dayItem.isWorkDay) {
						boxBgClass = "bg-slate-50 text-slate-400";
						borderClass = "border-slate-200/80 hover:border-slate-300";
						textClass = "text-slate-400";
						statusBadge = (
							<span className="text-[9px] font-bold text-slate-400 font-mono tracking-wide">
								OFF
							</span>
						);
					} else if (!dayItem.evaluation) {
						if (dayItem.isFuture) {
							boxBgClass = "bg-white text-slate-300";
							borderClass = "border-slate-200 border-dashed hover:border-slate-400";
							textClass = "text-slate-400";
							statusBadge = (
								<span className="text-[9px] font-bold text-slate-300 font-mono">-</span>
							);
						} else {
							boxBgClass = "bg-rose-50/70 text-rose-900";
							borderClass = "border-rose-200 hover:border-rose-400";
							textClass = "text-rose-900";
							statusBadge = (
								<span className="px-1 py-0.5 text-[8px] font-bold bg-rose-100 text-rose-800 rounded uppercase font-mono">
									KOSONG
								</span>
							);
						}
					} else {
						const status = dayItem.evaluation.status;
						if (status === "approved") {
							boxBgClass = "bg-emerald-50/70 text-emerald-950";
							borderClass = "border-emerald-200 hover:border-emerald-400";
							textClass = "text-emerald-950";
							statusBadge = (
								<div className="flex flex-col items-center">
									<span className="px-1 py-0.5 text-[8px] font-bold bg-emerald-100 text-emerald-800 rounded uppercase font-mono">
										OK
									</span>
									<span className="text-xs font-black mt-0.5 text-emerald-900 font-mono">
										{Math.round(dayItem.evaluation.skor_total || 0)}
									</span>
								</div>
							);
						} else if (status === "submitted") {
							boxBgClass = "bg-amber-50/70 text-amber-950";
							borderClass = "border-amber-200 hover:border-amber-400";
							textClass = "text-amber-950";
							statusBadge = (
								<div className="flex flex-col items-center">
									<span className="px-1 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-800 rounded uppercase font-mono">
										PENDING
									</span>
									<span className="text-xs font-black mt-0.5 text-amber-900 font-mono">
										{Math.round(dayItem.evaluation.skor_total || 0)}
									</span>
								</div>
							);
						} else if (status === "revisi") {
							boxBgClass = "bg-rose-50/70 text-rose-950";
							borderClass = "border-rose-200 hover:border-rose-400";
							textClass = "text-rose-950";
							statusBadge = (
								<div className="flex flex-col items-center">
									<span className="px-1 py-0.5 text-[8px] font-bold rounded uppercase font-mono bg-rose-100 text-rose-800">
										REVISI
									</span>
									<span className="text-xs font-black mt-0.5 font-mono text-rose-900">
										{Math.round(dayItem.evaluation.skor_total || 0)}
									</span>
								</div>
							);
						} else {
							boxBgClass = "bg-slate-100/70 text-slate-800";
							borderClass = "border-slate-200 hover:border-slate-400";
							textClass = "text-slate-800";
							statusBadge = (
								<div className="flex flex-col items-center">
									<span className="px-1 py-0.5 text-[8px] font-bold rounded uppercase font-mono bg-slate-200 text-slate-700">
										DRAF
									</span>
									<span className="text-xs font-black mt-0.5 font-mono text-slate-800">
										{Math.round(dayItem.evaluation.skor_total || 0)}
									</span>
								</div>
							);
						}
					}

					return (
						<div
							key={dayItem.day}
							role="button"
							tabIndex={0}
							aria-label={`Tanggal ${dayItem.day}, Shift ${dayItem.shift || "OFF"}, Status ${dayItem.evaluation?.status || (dayItem.isWorkDay ? (dayItem.isFuture ? "belum" : "kosong") : "libur")}`}
							onClick={() => {
								if (onSelectDay) {
									onSelectDay(dayItem.dateStr, dayItem.evaluation || null, dayItem.shift, dayItem.isWorkDay);
								}
							}}
							onKeyDown={(e) => {
								if ((e.key === "Enter" || e.key === " ") && onSelectDay) {
									e.preventDefault();
									onSelectDay(dayItem.dateStr, dayItem.evaluation || null, dayItem.shift, dayItem.isWorkDay);
								}
							}}
							className={`aspect-square rounded-xl border p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-500 ${boxBgClass} ${borderClass} ${
								isSelected ? "ring-2 ring-sky-600 ring-offset-1 shadow-sm" : ""
							}`}
						>
							<div className="flex justify-between items-center w-full leading-none">
								<span className={`text-xs font-bold font-mono ${textClass}`}>
									{dayItem.day}
								</span>
								{dayItem.isWorkDay && (
									<span className="text-[9px] font-extrabold text-slate-500 uppercase font-mono">
										{dayItem.shift}
									</span>
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
}
