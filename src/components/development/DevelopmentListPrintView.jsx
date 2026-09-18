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
		<div className="text-black font-sans text-xs bg-white w-full">
			{/* Kop Resmi Kedinasan Polri / RSB Nganjuk */}
			<div className="border-b-4 border-double border-black pb-3 mb-3">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3.5">
						<img
							src="/logo-kop.png"
							alt="Logo Instansi"
							className="h-14 w-auto object-contain"
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
						<div>
							<h3 className="text-[11px] font-bold tracking-wide uppercase text-black leading-tight">
								POLRI DAERAH JAWA TIMUR
							</h3>
							<h3 className="text-[11px] font-bold tracking-wide uppercase text-black leading-tight">
								BIDANG KEDOKTERAN DAN KESEHATAN
							</h3>
							<h1 className="text-sm sm:text-base font-black tracking-wide text-black uppercase leading-tight">
								RUMAH SAKIT BHAYANGKARA TK. III NGANJUK
							</h1>
							<p className="text-[9px] text-black font-sans mt-0.5">
								Jl. Wachid Hasyim No. 119 Nganjuk • Telp. (0358) 321882
							</p>
						</div>
					</div>
					<div className="text-right text-[9.5px] font-mono text-black flex-shrink-0">
						<div>Dicetak pada:</div>
						<div className="font-bold text-black">{formattedPrintDate} WIB</div>
					</div>
				</div>
			</div>

			{/* Judul Dokumen */}
			<div className="text-center my-3">
				<h2 className="text-sm sm:text-base font-black text-black uppercase tracking-wider underline">
					LAPORAN REKAPITULASI PENGAJUAN PENGEMBANGAN SISTEM
				</h2>
			</div>

			{/* Filter Metadata Info Bar (Monokrom) */}
			<div className="mb-3 p-2 rounded-none border border-black grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-black bg-white">
				<div>
					<span>Status: </span>
					<strong className="font-bold">{getFilterLabel("status", filters.selectedStatus)}</strong>
				</div>
				<div>
					<span>Prioritas: </span>
					<strong className="font-bold">{getFilterLabel("priority", filters.selectedPriority)}</strong>
				</div>
				<div>
					<span>Jenis Modul: </span>
					<strong className="font-bold">{getFilterLabel("module_type", filters.selectedModuleType)}</strong>
				</div>
				<div>
					<span>Departemen: </span>
					<strong className="font-bold">{getFilterLabel("department", filters.selectedDepartment)}</strong>
				</div>
			</div>

			{/* Tabel Daftar Pengajuan (Monokrom) */}
			<div className="mb-4 overflow-x-auto">
				<table className="w-full border-collapse border border-black text-[10px] leading-tight">
					<thead>
						<tr className="bg-white text-black font-bold uppercase font-mono text-[9px] border-b-2 border-black">
							<th className="border border-black px-1.5 py-2 text-center w-7">No</th>
							<th className="border border-black px-2 py-2 text-left w-24">No. Tiket</th>
							<th className="border border-black px-2 py-2 text-center w-20">Tgl Ajuan</th>
							<th className="border border-black px-2.5 py-2 text-left">Judul Pengajuan</th>
							<th className="border border-black px-2 py-2 text-left w-28">Pemohon / Dept</th>
							<th className="border border-black px-2 py-2 text-center w-20">Modul</th>
							<th className="border border-black px-1.5 py-2 text-center w-16">Prioritas</th>
							<th className="border border-black px-2 py-2 text-center w-24">Status</th>
							<th className="border border-black px-2 py-2 text-left w-24">PIC IT</th>
							<th className="border border-black px-2 py-2 text-center w-20">Target</th>
						</tr>
					</thead>
					<tbody>
						{requests.length === 0 ? (
							<tr>
								<td colSpan={10} className="border border-black px-4 py-6 text-center text-black italic">
									Tidak ada data pengajuan pengembangan yang sesuai dengan filter.
								</td>
							</tr>
						) : (
							requests.map((req, idx) => (
								<tr
									key={req.request_id || req.id || idx}
									className="border-b border-black bg-white print-avoid-break text-black"
								>
									<td className="border border-black px-1.5 py-1.5 text-center font-mono font-medium">
										{idx + 1}
									</td>
									<td className="border border-black px-2 py-1.5 font-mono font-bold text-black">
										{req.no_request || "-"}
									</td>
									<td className="border border-black px-2 py-1.5 text-center font-mono text-[9.5px]">
										{formatDate(req.submission_date)}
									</td>
									<td className="border border-black px-2.5 py-1.5 text-black">
										<div className="font-bold text-black leading-snug">{req.title}</div>
										{req.description && (
											<div className="text-black text-[9px] line-clamp-1 mt-0.5">
												{req.description}
											</div>
										)}
									</td>
									<td className="border border-black px-2 py-1.5 text-black">
										<div className="font-bold text-black">{req.user_name || "-"}</div>
										<div className="text-[9px] text-black">{req.departemen_name || "-"}</div>
									</td>
									<td className="border border-black px-2 py-1.5 text-center text-[9.5px] font-medium">
										{req.module_type || "-"}
									</td>
									<td className="border border-black px-1.5 py-1.5 text-center font-bold text-[9px]">
										<span className="border border-black px-1 py-0.5 uppercase">
											{req.priority || req.priority_level || "-"}
										</span>
									</td>
									<td className="border border-black px-2 py-1.5 text-center">
										<span className="font-bold text-black border border-black px-1.5 py-0.5 text-[8.5px] uppercase">
											{formatStatusIndonesian(req.current_status || req.status)}
										</span>
									</td>
									<td className="border border-black px-2 py-1.5 text-black text-[9.5px] font-medium">
										{req.assigned_to_name || req.technician_name || "-"}
									</td>
									<td className="border border-black px-2 py-1.5 text-center font-mono text-[9.5px]">
										{formatDate(req.expected_completion_date)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Ringkasan Status (Monokrom) */}
			<div className="border border-black p-2.5 bg-white mb-6 print-avoid-break text-black">
				<div className="font-bold text-[10px] text-black uppercase tracking-wider mb-1.5 font-mono">
					Ringkasan Status Permintaan
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
					<div className="p-1.5 border border-black bg-white">
						<span>Total Pengajuan: </span>
						<strong className="font-bold text-black">{statistics.total_requests || requests.length || 0}</strong>
					</div>
					<div className="p-1.5 border border-black bg-white">
						<span>Menunggu Review: </span>
						<strong className="font-bold text-black">{statistics.pending_review || 0}</strong>
					</div>
					<div className="p-1.5 border border-black bg-white">
						<span>Sedang Dikerjakan: </span>
						<strong className="font-bold text-black">{statistics.in_progress || 0}</strong>
					</div>
					<div className="p-1.5 border border-black bg-white">
						<span>Selesai: </span>
						<strong className="font-bold text-black">{statistics.completed || 0}</strong>
					</div>
					<div className="p-1.5 border border-black bg-white">
						<span>Ditolak: </span>
						<strong className="font-bold text-black">{statistics.rejected || 0}</strong>
					</div>
				</div>
			</div>

			{/* Kolom Tanda Tangan Pengesahan (Monokrom) */}
			<div className="grid grid-cols-2 gap-8 text-center pt-2 print-avoid-break text-black">
				<div>
					<p className="text-[10px] text-black mb-1">Dibuat Oleh,</p>
					<p className="text-[10px] font-bold text-black">Petugas / Operator SIMRS</p>
					<div className="h-16 border-b border-black w-44 mx-auto mb-1"></div>
					<p className="text-[10px] font-bold text-black">( ............................................ )</p>
				</div>
				<div>
					<p className="text-[10px] text-black mb-1">Mengetahui,</p>
					<p className="text-[10px] font-bold text-black">Kepala Sub Bagian IT & SIMRS</p>
					<div className="h-16 border-b border-black w-44 mx-auto mb-1"></div>
					<p className="text-[10px] font-bold text-black">( ............................................ )</p>
				</div>
			</div>
		</div>
	);
}
