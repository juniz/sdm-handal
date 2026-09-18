"use client";

import React from "react";
import moment from "moment";
import { formatStatusIndonesian } from "@/lib/development-helper";

export default function DevelopmentListPrintView({
	requests = [],
	statistics = {},
	filters = {},
	masterData = {},
	printDate,
}) {
	const formattedPrintDate = printDate || moment().format("DD MMMM YYYY, HH:mm");

	// Resolve filter label names for readable printout
	const getFilterLabel = (key, val) => {
		if (!val || val === "ALL") return "Semua";
		if (key === "status") {
			const s = masterData?.statuses?.find((item) => String(item.status_id) === String(val));
			return s ? s.status_name : val;
		}
		if (key === "priority") {
			const p = masterData?.priorities?.find((item) => String(item.priority_id) === String(val));
			return p ? p.priority_name : val;
		}
		if (key === "module_type") {
			const m = masterData?.moduleTypes?.find((item) => String(item.type_id) === String(val));
			return m ? m.type_name : val;
		}
		if (key === "department") {
			const d = masterData?.departments?.find((item) => String(item.dep_id) === String(val));
			return d ? d.nama : val;
		}
		return val;
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "-";
		if (
			typeof dateStr === "string" &&
			(dateStr.includes("Januari") ||
				dateStr.includes("Februari") ||
				dateStr.includes("Maret") ||
				dateStr.includes("April") ||
				dateStr.includes("Mei") ||
				dateStr.includes("Juni") ||
				dateStr.includes("Juli") ||
				dateStr.includes("Agustus") ||
				dateStr.includes("September") ||
				dateStr.includes("Oktober") ||
				dateStr.includes("November") ||
				dateStr.includes("Desember"))
		) {
			return dateStr.replace(/(\d+)\s+(\w+)\s+(\d+).*/, "$1 $2 $3");
		}
		try {
			return moment(dateStr).format("DD/MM/YYYY");
		} catch {
			return dateStr;
		}
	};

	return (
		<div className="text-slate-900 font-sans text-xs bg-white w-full">
			{/* Kop Surat / Header Dokumen */}
			<div className="border-b-2 border-slate-900 pb-3 mb-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						{/* Logo instansi dengan fallback teks */}
						<img
							src="/logo-kop.png"
							alt="Logo Instansi"
							className="h-12 w-auto object-contain"
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
						<div>
							<h3 className="text-[10px] font-bold tracking-wider uppercase text-slate-600 font-mono">
								SISTEM INFORMASI MANAJEMEN SUMBER DAYA MANUSIA
							</h3>
							<h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
								Laporan Rekapitulasi Pengajuan Pengembangan Sistem
							</h1>
							<p className="text-[10px] text-slate-500 font-mono">
								Dokumen Resmi Monitoring & Evaluasi Kebutuhan Modul SIMRS
							</p>
						</div>
					</div>
					<div className="text-right text-[10px] font-mono text-slate-600 flex-shrink-0">
						<div>Dicetak pada:</div>
						<div className="font-bold text-slate-900">{formattedPrintDate} WIB</div>
					</div>
				</div>

				{/* Filter Metadata Info Bar */}
				<div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] text-slate-700 bg-slate-50/80 p-2 rounded border border-slate-200">
					<div>
						<span className="text-slate-500">Status: </span>
						<strong className="font-semibold">{getFilterLabel("status", filters.selectedStatus)}</strong>
					</div>
					<div>
						<span className="text-slate-500">Prioritas: </span>
						<strong className="font-semibold">{getFilterLabel("priority", filters.selectedPriority)}</strong>
					</div>
					<div>
						<span className="text-slate-500">Jenis Modul: </span>
						<strong className="font-semibold">{getFilterLabel("module_type", filters.selectedModuleType)}</strong>
					</div>
					<div>
						<span className="text-slate-500">Departemen: </span>
						<strong className="font-semibold">{getFilterLabel("department", filters.selectedDepartment)}</strong>
					</div>
				</div>
			</div>

			{/* Tabel Daftar Pengajuan */}
			<div className="mb-4 overflow-x-auto">
				<table className="w-full border-collapse border border-slate-400 text-[10px] leading-tight">
					<thead>
						<tr className="bg-slate-100 text-slate-900 font-bold uppercase font-mono text-[9px] border-b border-slate-400">
							<th className="border border-slate-400 px-1.5 py-2 text-center w-7">No</th>
							<th className="border border-slate-400 px-2 py-2 text-left w-24">No. Tiket</th>
							<th className="border border-slate-400 px-2 py-2 text-center w-20">Tgl Ajuan</th>
							<th className="border border-slate-400 px-2.5 py-2 text-left">Judul Pengajuan</th>
							<th className="border border-slate-400 px-2 py-2 text-left w-28">Pemohon / Dept</th>
							<th className="border border-slate-400 px-2 py-2 text-center w-20">Modul</th>
							<th className="border border-slate-400 px-1.5 py-2 text-center w-16">Prioritas</th>
							<th className="border border-slate-400 px-2 py-2 text-center w-24">Status</th>
							<th className="border border-slate-400 px-2 py-2 text-left w-24">PIC IT</th>
							<th className="border border-slate-400 px-2 py-2 text-center w-20">Target</th>
						</tr>
					</thead>
					<tbody>
						{requests.length === 0 ? (
							<tr>
								<td colSpan={10} className="border border-slate-400 px-4 py-6 text-center text-slate-500 italic">
									Tidak ada data pengajuan pengembangan yang sesuai dengan filter.
								</td>
							</tr>
						) : (
							requests.map((req, idx) => (
								<tr
									key={req.request_id || req.id || idx}
									className={`border-b border-slate-300 ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"} print-avoid-break`}
								>
									<td className="border border-slate-400 px-1.5 py-1.5 text-center font-mono">
										{idx + 1}
									</td>
									<td className="border border-slate-400 px-2 py-1.5 font-mono font-bold text-slate-900">
										{req.no_request || "-"}
									</td>
									<td className="border border-slate-400 px-2 py-1.5 text-center font-mono text-[9.5px]">
										{formatDate(req.submission_date)}
									</td>
									<td className="border border-slate-400 px-2.5 py-1.5 font-medium text-slate-900">
										<div className="font-semibold text-slate-900 leading-snug">{req.title}</div>
										{req.description && (
											<div className="text-slate-600 text-[9px] line-clamp-1 mt-0.5">
												{req.description}
											</div>
										)}
									</td>
									<td className="border border-slate-400 px-2 py-1.5 text-slate-800">
										<div className="font-medium">{req.user_name || "-"}</div>
										<div className="text-[9px] text-slate-500">{req.departemen_name || "-"}</div>
									</td>
									<td className="border border-slate-400 px-2 py-1.5 text-center text-[9.5px]">
										{req.module_type || "-"}
									</td>
									<td className="border border-slate-400 px-1.5 py-1.5 text-center font-medium text-[9.5px]">
										{req.priority || req.priority_level || "-"}
									</td>
									<td className="border border-slate-400 px-2 py-1.5 text-center">
										<span className="font-semibold text-slate-900 border border-slate-300 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] uppercase">
											{formatStatusIndonesian(req.current_status || req.status)}
										</span>
									</td>
									<td className="border border-slate-400 px-2 py-1.5 text-slate-800 text-[9.5px]">
										{req.assigned_to_name || req.technician_name || "-"}
									</td>
									<td className="border border-slate-400 px-2 py-1.5 text-center font-mono text-[9.5px]">
										{formatDate(req.expected_completion_date)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Ringkasan Statistik */}
			<div className="border border-slate-400 rounded p-2.5 bg-slate-50 mb-6 print-avoid-break">
				<div className="font-bold text-[10px] text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
					Ringkasan Status Permintaan
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
					<div className="bg-white p-1.5 rounded border border-slate-200">
						<span className="text-slate-500">Total Pengajuan: </span>
						<strong className="font-bold text-slate-900">{statistics.total_requests || requests.length || 0}</strong>
					</div>
					<div className="bg-white p-1.5 rounded border border-slate-200">
						<span className="text-slate-500">Menunggu Review: </span>
						<strong className="font-bold text-amber-700">{statistics.pending_review || 0}</strong>
					</div>
					<div className="bg-white p-1.5 rounded border border-slate-200">
						<span className="text-slate-500">Sedang Dikerjakan: </span>
						<strong className="font-bold text-sky-700">{statistics.in_progress || 0}</strong>
					</div>
					<div className="bg-white p-1.5 rounded border border-slate-200">
						<span className="text-slate-500">Selesai: </span>
						<strong className="font-bold text-emerald-700">{statistics.completed || 0}</strong>
					</div>
					<div className="bg-white p-1.5 rounded border border-slate-200">
						<span className="text-slate-500">Ditolak: </span>
						<strong className="font-bold text-rose-700">{statistics.rejected || 0}</strong>
					</div>
				</div>
			</div>

			{/* Kolom Tanda Tangan Pengesahan */}
			<div className="grid grid-cols-2 gap-8 text-center pt-2 print-avoid-break">
				<div>
					<p className="text-[10px] text-slate-600 mb-1">Dibuat Oleh,</p>
					<p className="text-[10px] font-medium text-slate-800">Petugas / Operator SIMRS</p>
					<div className="h-16 border-b border-slate-400 w-44 mx-auto mb-1"></div>
					<p className="text-[10px] font-bold text-slate-900">( ............................................ )</p>
				</div>
				<div>
					<p className="text-[10px] text-slate-600 mb-1">Mengetahui,</p>
					<p className="text-[10px] font-medium text-slate-800">Kepala Bagian / Sub Bagian IT & SIMRS</p>
					<div className="h-16 border-b border-slate-400 w-44 mx-auto mb-1"></div>
					<p className="text-[10px] font-bold text-slate-900">( ............................................ )</p>
				</div>
			</div>
		</div>
	);
}
