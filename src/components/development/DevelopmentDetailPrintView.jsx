"use client";

import React from "react";
import moment from "moment";
import { formatStatusIndonesian } from "@/lib/development-helper";

export default function DevelopmentDetailPrintView({
	request,
	statusHistory = [],
	notes = [],
	user,
	printDate,
}) {
	if (!request) {
		return (
			<div className="p-8 text-center text-slate-500 font-mono text-sm">
				Data pengajuan tidak ditemukan untuk dicetak.
			</div>
		);
	}

	const formattedPrintDate = printDate || moment().format("DD MMMM YYYY, HH:mm");

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
			return moment(dateStr).format("DD MMMM YYYY");
		} catch {
			return dateStr;
		}
	};

	return (
		<div className="text-slate-900 font-sans text-xs bg-white w-full">
			{/* Kop Formulir Resmi */}
			<div className="border-b-2 border-slate-900 pb-3 mb-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<img
							src="/logo-kop.png"
							alt="Logo Instansi"
							className="h-14 w-auto object-contain"
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
						<div>
							<h3 className="text-[10px] font-bold tracking-wider uppercase text-slate-600 font-mono">
								SISTEM INFORMASI MANAJEMEN SUMBER DAYA MANUSIA
							</h3>
							<h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
								Formulir Permintaan Pengembangan Sistem Informasi
							</h1>
							<p className="text-[10px] text-slate-500 font-mono">
								Software Development Request Form (SDRF)
							</p>
						</div>
					</div>
					<div className="text-right text-[10px] font-mono text-slate-600 flex-shrink-0">
						<div className="border border-slate-400 p-1.5 rounded bg-slate-50">
							<div className="text-slate-500 text-[9px]">NOMOR TIKET</div>
							<div className="font-bold text-slate-900 text-xs">{request.no_request || "-"}</div>
						</div>
						<div className="mt-1 text-[9px]">Dicetak: {formattedPrintDate} WIB</div>
					</div>
				</div>
			</div>

			{/* Bagian I: Data Pemohon & Tiket */}
			<div className="mb-4 print-avoid-break">
				<div className="bg-slate-100 border border-slate-400 px-3 py-1 font-bold text-[10.5px] uppercase tracking-wide text-slate-800 font-mono mb-2">
					Bagian I: Data Pemohon & Identitas Tiket
				</div>
				<table className="w-full border-collapse border border-slate-300 text-[10.5px]">
					<tbody>
						<tr className="border-b border-slate-200">
							<td className="w-1/4 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Nomor Tiket
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold font-mono text-slate-900 border-r border-slate-200">
								{request.no_request || "-"}
							</td>
							<td className="w-1/4 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Tanggal Pengajuan
							</td>
							<td className="w-1/4 px-3 py-1.5 text-slate-900">
								{formatDate(request.submission_date)}
							</td>
						</tr>
						<tr className="border-b border-slate-200">
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Nama Pemohon
							</td>
							<td className="px-3 py-1.5 font-semibold text-slate-900 border-r border-slate-200">
								{request.user_name || "-"}
							</td>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								NIP / NIK Pemohon
							</td>
							<td className="px-3 py-1.5 font-mono text-slate-800">
								{request.user_id || "-"}
							</td>
						</tr>
						<tr className="border-b border-slate-200">
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Departemen / Unit
							</td>
							<td className="px-3 py-1.5 text-slate-800 border-r border-slate-200">
								{request.departemen_name || "-"}
							</td>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Kategori Modul
							</td>
							<td className="px-3 py-1.5 font-medium text-slate-900">
								{request.module_type || "-"}
							</td>
						</tr>
						<tr>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Prioritas
							</td>
							<td className="px-3 py-1.5 font-semibold text-slate-900 border-r border-slate-200">
								{request.priority || request.priority_level || "Normal"}
							</td>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Status Saat Ini
							</td>
							<td className="px-3 py-1.5 font-bold uppercase text-slate-900">
								{formatStatusIndonesian(request.current_status)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian II: Rincian Kebutuhan Pengembangan */}
			<div className="mb-4 print-avoid-break">
				<div className="bg-slate-100 border border-slate-400 px-3 py-1 font-bold text-[10.5px] uppercase tracking-wide text-slate-800 font-mono mb-2">
					Bagian II: Rincian Spesifikasi Kebutuhan Sistem
				</div>
				<div className="border border-slate-300 rounded divide-y divide-slate-200 text-[10.5px]">
					<div className="p-2.5 bg-slate-50/50">
						<div className="text-slate-500 font-medium text-[9.5px] uppercase mb-0.5">Judul Permintaan / Modul</div>
						<div className="font-bold text-slate-900 text-sm">{request.title}</div>
					</div>
					<div className="p-2.5">
						<div className="text-slate-500 font-medium text-[9.5px] uppercase mb-1">Deskripsi Spesifikasi / Kebutuhan Fitur</div>
						<div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
							{request.description || "-"}
						</div>
					</div>
					{(request.business_impact || request.impact_analysis) && (
						<div className="p-2.5 bg-slate-50/50">
							<div className="text-slate-500 font-medium text-[9.5px] uppercase mb-1">Dampak Terhadap Alur Kerja / Layanan</div>
							<div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
								{request.business_impact || request.impact_analysis}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bagian III: Verifikasi & Persetujuan (Approval) */}
			<div className="mb-4 print-avoid-break">
				<div className="bg-slate-100 border border-slate-400 px-3 py-1 font-bold text-[10.5px] uppercase tracking-wide text-slate-800 font-mono mb-2">
					Bagian III: Verifikasi & Persetujuan Manajemen
				</div>
				<table className="w-full border-collapse border border-slate-300 text-[10.5px]">
					<tbody>
						<tr className="border-b border-slate-200">
							<td className="w-1/4 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Status Persetujuan
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold uppercase text-slate-900 border-r border-slate-200">
								{request.approval_status || (request.current_status === "Rejected" ? "DITOLAK" : request.current_status === "Draft" ? "DRAFT" : "DISETUJUI")}
							</td>
							<td className="w-1/4 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Tanggal Approval
							</td>
							<td className="w-1/4 px-3 py-1.5 text-slate-900">
								{formatDate(request.approval_date || request.updated_at)}
							</td>
						</tr>
						<tr className="border-b border-slate-200">
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Penyetuju / Approver
							</td>
							<td colSpan={3} className="px-3 py-1.5 font-semibold text-slate-900">
								{request.approved_by_name || request.approver_name || "-"}
							</td>
						</tr>
						<tr>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Catatan Persetujuan
							</td>
							<td colSpan={3} className="px-3 py-1.5 text-slate-800 italic">
								{request.approval_notes || request.approval_reason || "Tidak ada catatan khusus."}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian IV: Penugasan & Pelaksanaan IT */}
			<div className="mb-4 print-avoid-break">
				<div className="bg-slate-100 border border-slate-400 px-3 py-1 font-bold text-[10.5px] uppercase tracking-wide text-slate-800 font-mono mb-2">
					Bagian IV: Penugasan Teknis & Pelaksanaan IT
				</div>
				<table className="w-full border-collapse border border-slate-300 text-[10.5px]">
					<tbody>
						<tr className="border-b border-slate-200">
							<td className="w-1/4 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								PIC Developer / Teknisi
							</td>
							<td className="w-1/4 px-3 py-1.5 font-semibold text-slate-900 border-r border-slate-200">
								{request.assigned_to_name || request.developer_name || "-"}
							</td>
							<td className="w-1/4 bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Progres Pengerjaan
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold font-mono text-slate-900">
								{request.progress_percentage ?? 0}%
							</td>
						</tr>
						<tr>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Target Selesai
							</td>
							<td className="px-3 py-1.5 font-mono text-slate-800 border-r border-slate-200">
								{formatDate(request.expected_completion_date)}
							</td>
							<td className="bg-slate-50 px-3 py-1.5 font-medium text-slate-600 border-r border-slate-200">
								Realisasi Selesai
							</td>
							<td className="px-3 py-1.5 font-mono text-slate-800">
								{formatDate(request.actual_completion_date)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian V: Lembar Pengesahan (3 Kolom Tanda Tangan) */}
			<div className="pt-3 print-avoid-break border-t border-slate-300">
				<div className="text-[10px] text-slate-500 font-mono mb-2 text-center uppercase tracking-wider">
					Lembar Pengesahan Pelaksanaan Pengembangan Sistem
				</div>
				<div className="grid grid-cols-3 gap-4 text-center">
					{/* Pemohon */}
					<div className="border border-slate-300 p-2.5 rounded bg-white">
						<p className="text-[9.5px] text-slate-500 mb-0.5">Pemohon,</p>
						<p className="text-[10px] font-semibold text-slate-800">Staff / Petugas Pengaju</p>
						<div className="h-16 border-b border-slate-400 w-36 mx-auto mb-1"></div>
						<p className="text-[10px] font-bold text-slate-900 truncate px-1">
							{request.user_name || "( .................................... )"}
						</p>
						<p className="text-[8.5px] font-mono text-slate-500">
							{request.user_id ? `NIP: ${request.user_id}` : ""}
						</p>
					</div>

					{/* Atasan Pemohon */}
					<div className="border border-slate-300 p-2.5 rounded bg-white">
						<p className="text-[9.5px] text-slate-500 mb-0.5">Menyetujui,</p>
						<p className="text-[10px] font-semibold text-slate-800">Ka. Instalasi / Departemen</p>
						<div className="h-16 border-b border-slate-400 w-36 mx-auto mb-1"></div>
						<p className="text-[10px] font-bold text-slate-900 truncate px-1">
							{request.approved_by_name || "( .................................... )"}
						</p>
						<p className="text-[8.5px] font-mono text-slate-500">
							{request.departemen_name || ""}
						</p>
					</div>

					{/* Penanggung Jawab IT */}
					<div className="border border-slate-300 p-2.5 rounded bg-white">
						<p className="text-[9.5px] text-slate-500 mb-0.5">Pelaksana IT,</p>
						<p className="text-[10px] font-semibold text-slate-800">Lead Developer / Ka. SIMRS</p>
						<div className="h-16 border-b border-slate-400 w-36 mx-auto mb-1"></div>
						<p className="text-[10px] font-bold text-slate-900 truncate px-1">
							{request.assigned_to_name || "( .................................... )"}
						</p>
						<p className="text-[8.5px] font-mono text-slate-500">
							Tim Pengembang SIMRS
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
