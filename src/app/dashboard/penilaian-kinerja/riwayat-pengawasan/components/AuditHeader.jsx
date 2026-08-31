"use client";

import React from "react";
import { ShieldCheck, RefreshCcw } from "lucide-react";

export default function AuditHeader({ month, year, onReset }) {
	return (
		<div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-xs print:hidden">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="space-y-1.5 max-w-2xl">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono flex items-center gap-1.5">
							<ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
							Pengawasan & Audit SDM
						</span>
						<span className="text-xs text-slate-500 font-mono font-semibold">
							• Periode {month}/{year}
						</span>
					</div>
					<h1 className="text-xl md:text-2xl font-extrabold tracking-tight font-figtree text-slate-900 leading-tight">
						Riwayat Penilaian Kinerja Pegawai
					</h1>
					<p className="text-slate-600 text-xs md:text-sm font-normal leading-relaxed">
						Monitoring kepatuhan evaluasi kinerja bulanan, kelengkapan rekapitulasi penilaian pegawai seluruh unit, dan verifikasi independen SPI/SDM.
					</p>
				</div>
				<div className="flex gap-2 shrink-0 flex-wrap">
					<button
						type="button"
						onClick={onReset}
						className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs active:scale-95 transition-all"
					>
						<RefreshCcw className="h-3.5 w-3.5 text-slate-500" />
						Reset Filter
					</button>
				</div>
			</div>
		</div>
	);
}
