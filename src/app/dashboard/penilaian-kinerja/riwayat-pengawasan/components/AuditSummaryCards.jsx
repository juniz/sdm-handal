"use client";

import React from "react";
import { Users, TrendingUp, CheckCircle2, Award } from "lucide-react";

export default function AuditSummaryCards({ summary, getRatingBadge }) {
	const renderRatingBadge = (score) => {
		if (typeof getRatingBadge === "function") {
			return getRatingBadge(score);
		}
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

	const compliance = summary?.compliancePercentage != null ? Math.round(summary.compliancePercentage) : 0;
	const complianceLevel = compliance >= 80 ? "TINGGI" : compliance >= 50 ? "SEDANG" : "PERLU AUDIT";
	const complianceColor = compliance >= 80 ? "bg-emerald-600" : compliance >= 50 ? "bg-amber-500" : "bg-rose-500";

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
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
					{renderRatingBadge(summary?.avgMonthlyScore)}
				</div>
				<p className="text-xs text-slate-500 font-medium">Nilai agregat seluruh pegawai</p>
			</div>

			{/* Card 3: Status Rekapitulasi */}
			<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2 transition-shadow duration-200 hover:shadow-md">
				<div className="flex items-center justify-between">
					<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
						Status Rekapitulasi
					</span>
					<CheckCircle2 className="w-4 h-4 text-sky-600" />
				</div>
				<div className="flex items-baseline gap-3">
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-emerald-500" />
						<span className="text-xl font-extrabold text-slate-800 font-mono">
							{summary?.totalLocked ?? 0}
						</span>
						<span className="text-[10px] text-slate-500 font-bold uppercase">Locked</span>
					</div>
					<span className="text-slate-300">/</span>
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-amber-500" />
						<span className="text-xl font-extrabold text-slate-800 font-mono">
							{summary?.totalDraft ?? 0}
						</span>
						<span className="text-[10px] text-slate-500 font-bold uppercase">Draft</span>
					</div>
				</div>
				<p className="text-xs text-slate-500 font-medium">Rekapitulasi akhir yang dikunci</p>
			</div>

			{/* Card 4: Tingkat Kepatuhan Supervisor */}
			<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2.5 transition-shadow duration-200 hover:shadow-md">
				<div className="flex items-center justify-between">
					<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
						Kepatuhan Supervisor
					</span>
					<Award className="w-4 h-4 text-sky-600" />
				</div>
				<div className="flex items-baseline justify-between">
					<span className="text-2xl md:text-3xl font-extrabold text-sky-800 font-figtree">
						{compliance}%
					</span>
					<span className="text-[10px] font-extrabold text-slate-500 uppercase font-mono">
						{complianceLevel}
					</span>
				</div>
				<div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
					<div
						className={`h-full rounded-full transition-all duration-500 ${complianceColor}`}
						style={{ width: `${Math.min(100, Math.max(0, compliance))}%` }}
					/>
				</div>
			</div>
		</div>
	);
}
