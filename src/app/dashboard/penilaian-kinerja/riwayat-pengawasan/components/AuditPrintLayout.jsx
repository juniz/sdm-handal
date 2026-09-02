"use client";

import React from "react";
import moment from "moment";

export default function AuditPrintLayout({
	month,
	year,
	departemen,
	sttsKerja,
	rekapList = [],
	summary,
	MONTHS = [],
}) {
	const monthLabel =
		MONTHS.find((m) => m.value === month)?.label ||
		moment(month, "MM").format("MMMM");

	const printDate = moment().format("DD MMMM YYYY, HH:mm");
	const compliance =
		summary?.compliancePercentage != null
			? Math.round(summary.compliancePercentage)
			: 0;

	return (
		<div className="hidden print:block font-noto-sans text-slate-900 bg-white p-0 m-0 w-full">
			<style dangerouslySetInnerHTML={{ __html: `
				@page {
					size: A4 landscape;
					margin: 6mm 8mm;
				}
				@media print {
					html, body, #__next, div[class*="min-h-screen"] {
						height: auto !important;
						min-height: 0 !important;
						margin: 0 !important;
						padding: 0 !important;
						background: #ffffff !important;
						overflow: visible !important;
					}
					header, aside, nav, .bottom-navigation, [role="navigation"], .fixed.bottom-6 {
						display: none !important;
						visibility: hidden !important;
					}
					.print-avoid-break {
						page-break-inside: avoid;
						break-inside: avoid;
					}
				}
			`}} />

			{/* Kop Laporan Formal */}
			<div className="border-b-2 border-slate-900 pb-3 mb-4">
				<div className="flex justify-between items-start">
					<div>
						<h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-600 font-mono">
							Sistem Informasi Manajemen Sumber Daya Manusia
						</h3>
						<h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
							Laporan Rekapitulasi Pengawasan Penilaian Kinerja Pegawai
						</h1>
						<div className="flex items-center gap-4 text-[10px] font-mono mt-1 text-slate-700">
							<span>
								Periode: <strong>{monthLabel} {year}</strong>
							</span>
							<span>•</span>
							<span>
								Departemen: <strong>{departemen === "ALL" ? "Semua Departemen" : departemen}</strong>
							</span>
							<span>•</span>
							<span>
								Status Kerja: <strong>{sttsKerja === "ALL" ? "Semua Status" : sttsKerja}</strong>
							</span>
						</div>
					</div>
					<div className="text-right text-[9px] font-mono text-slate-500">
						<div>Dicetak pada:</div>
						<div className="font-bold text-slate-800">{printDate} WIB</div>
					</div>
				</div>
			</div>

			{/* Tabel Audit Pegawai */}
			<table className="w-full text-left border-collapse border border-slate-400 text-[9px] leading-tight">
				<thead>
					<tr className="bg-slate-100 text-slate-900 font-bold uppercase font-mono text-[8.5px] border-b border-slate-400">
						<th className="border border-slate-400 px-1.5 py-1.5 text-center w-6">No</th>
						<th className="border border-slate-400 px-1.5 py-1.5 w-16">NIK</th>
						<th className="border border-slate-400 px-2 py-1.5">Nama Pegawai</th>
						<th className="border border-slate-400 px-2 py-1.5">Departemen</th>
						<th className="border border-slate-400 px-1.5 py-1.5 text-center">Status</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center">Wajib</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center bg-emerald-50">Apprv</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center">Pend</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center">Draft</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center bg-rose-50">Kosong</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center bg-rose-50">Gap</th>
						<th className="border border-slate-400 px-1 py-1.5 text-center bg-sky-50">Skor</th>
						<th className="border border-slate-400 px-1.5 py-1.5 text-center w-14">Status Rekap</th>
					</tr>
				</thead>
				<tbody>
					{rekapList.map((row, idx) => (
						<tr
							key={row.id || row.pegawai_id || row.nik || idx}
							className={`border-b border-slate-300 ${idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
						>
							<td className="border border-slate-400 px-1.5 py-1 text-center font-mono">{idx + 1}</td>
							<td className="border border-slate-400 px-1.5 py-1 font-mono font-medium">{row.nik || "-"}</td>
							<td className="border border-slate-400 px-2 py-1 font-bold text-slate-900 truncate max-w-[160px]">
								{row.nama}
							</td>
							<td className="border border-slate-400 px-2 py-1 truncate max-w-[120px]">
								{row.nama_departemen || "-"}
							</td>
							<td className="border border-slate-400 px-1.5 py-1 text-center font-mono text-[8px]">
								{row.stts_kerja || "-"}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono font-semibold">
								{row.total_hari_jadwal ?? 0}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
								{row.hari_approved ?? 0}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono">
								{row.hari_pending ?? 0}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono">
								{row.hari_draft ?? 0}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono font-semibold text-rose-800 bg-rose-50/30">
								{row.hari_kosong ?? 0}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono font-bold text-rose-900 bg-rose-50/50">
								{row.gap_hari ?? 0}
							</td>
							<td className="border border-slate-400 px-1 py-1 text-center font-mono font-black text-sky-900 bg-sky-50/40">
								{row.rata_skor_total != null ? Math.round(row.rata_skor_total) : 0}
							</td>
							<td className="border border-slate-400 px-1.5 py-1 text-center font-mono font-bold text-[8px]">
								{row.status_rekap || "DRAFT"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
