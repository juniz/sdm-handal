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
			<div className="p-8 text-center text-black font-mono text-sm">
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
		<div className="text-black font-sans text-xs bg-white w-full">
			{/* Kop Formulir Resmi Kedinasan Polri / RSB Nganjuk */}
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
						<div className="border border-black p-1.5 bg-white">
							<div className="text-black font-bold text-[8.5px]">NOMOR TIKET</div>
							<div className="font-black text-black text-xs">{request.no_request || "-"}</div>
						</div>
						<div className="mt-1 text-[8.5px]">Dicetak: {formattedPrintDate} WIB</div>
					</div>
				</div>
			</div>

			{/* Judul Dokumen */}
			<div className="text-center my-3">
				<h2 className="text-sm sm:text-base font-black text-black uppercase tracking-wider underline">
					FORMULIR PERMINTAAN PENGEMBANGAN SISTEM INFORMASI
				</h2>
				<p className="text-[9.5px] text-black font-mono mt-0.5">
					Software Development Request Form (SDRF)
				</p>
			</div>

			{/* Bagian I: Data Pemohon & Tiket */}
			<div className="mb-3.5 print-avoid-break">
				<div className="bg-white border border-black px-3 py-1 font-bold text-[10px] uppercase tracking-wide text-black font-mono mb-1.5">
					Bagian I: Data Pemohon & Identitas Tiket
				</div>
				<table className="w-full border-collapse border border-black text-[10px]">
					<tbody>
						<tr className="border-b border-black">
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								Nomor Tiket
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold font-mono text-black border-r border-black">
								{request.no_request || "-"}
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								Tanggal Pengajuan
							</td>
							<td className="w-1/4 px-3 py-1.5 text-black">
								{formatDate(request.submission_date)}
							</td>
						</tr>
						<tr className="border-b border-black">
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Nama Pemohon
							</td>
							<td className="px-3 py-1.5 font-semibold text-black border-r border-black">
								{request.user_name || "-"}
							</td>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								NIP / NIK Pemohon
							</td>
							<td className="px-3 py-1.5 font-mono text-black">
								{request.user_id || "-"}
							</td>
						</tr>
						<tr className="border-b border-black">
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Departemen / Unit
							</td>
							<td className="px-3 py-1.5 text-black border-r border-black">
								{request.departemen_name || "-"}
							</td>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Kategori Modul
							</td>
							<td className="px-3 py-1.5 font-medium text-black">
								{request.module_type || "-"}
							</td>
						</tr>
						<tr>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Prioritas
							</td>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								<span className="border border-black px-1 py-0.5 uppercase text-[9px]">
									{request.priority || request.priority_level || "Normal"}
								</span>
							</td>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Status Saat Ini
							</td>
							<td className="px-3 py-1.5 font-bold uppercase text-black">
								<span className="border border-black px-1.5 py-0.5 text-[9px]">
									{formatStatusIndonesian(request.current_status)}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian II: Rincian Kebutuhan Pengembangan */}
			<div className="mb-3.5 print-avoid-break">
				<div className="bg-white border border-black px-3 py-1 font-bold text-[10px] uppercase tracking-wide text-black font-mono mb-1.5">
					Bagian II: Rincian Spesifikasi Kebutuhan Sistem
				</div>
				<div className="border border-black divide-y divide-black text-[10px]">
					<div className="p-2 bg-white">
						<div className="text-black font-bold text-[9px] uppercase mb-0.5">Judul Permintaan / Modul</div>
						<div className="font-bold text-black text-xs sm:text-sm">{request.title}</div>
					</div>
					<div className="p-2 bg-white">
						<div className="text-black font-bold text-[9px] uppercase mb-1">Deskripsi Spesifikasi / Kebutuhan Fitur</div>
						<div className="text-black leading-relaxed whitespace-pre-wrap font-sans">
							{request.description || "-"}
						</div>
					</div>
					{(request.business_impact || request.impact_analysis) && (
						<div className="p-2 bg-white">
							<div className="text-black font-bold text-[9px] uppercase mb-1">Dampak Terhadap Alur Kerja / Layanan</div>
							<div className="text-black leading-relaxed whitespace-pre-wrap font-sans">
								{request.business_impact || request.impact_analysis}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bagian III: Verifikasi & Persetujuan (Approval) */}
			<div className="mb-3.5 print-avoid-break">
				<div className="bg-white border border-black px-3 py-1 font-bold text-[10px] uppercase tracking-wide text-black font-mono mb-1.5">
					Bagian III: Verifikasi & Persetujuan Manajemen
				</div>
				<table className="w-full border-collapse border border-black text-[10px]">
					<tbody>
						<tr className="border-b border-black">
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								Status Persetujuan
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold uppercase text-black border-r border-black">
								<span className="border border-black px-1.5 py-0.5 text-[9px]">
									{request.approval_status || (request.current_status === "Rejected" ? "DITOLAK" : request.current_status === "Draft" ? "DRAFT" : "DISETUJUI")}
								</span>
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								Tanggal Approval
							</td>
							<td className="w-1/4 px-3 py-1.5 text-black font-mono">
								{formatDate(request.approval_date || request.updated_at)}
							</td>
						</tr>
						<tr className="border-b border-black">
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Penyetuju / Approver
							</td>
							<td colSpan={3} className="px-3 py-1.5 font-bold text-black">
								{request.approved_by_name || request.approver_name || "-"}
							</td>
						</tr>
						<tr>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Catatan Persetujuan
							</td>
							<td colSpan={3} className="px-3 py-1.5 text-black italic">
								{request.approval_notes || request.approval_reason || "Tidak ada catatan khusus."}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian IV: Penugasan & Pelaksanaan IT */}
			<div className="mb-4 print-avoid-break">
				<div className="bg-white border border-black px-3 py-1 font-bold text-[10px] uppercase tracking-wide text-black font-mono mb-1.5">
					Bagian IV: Penugasan Teknis & Pelaksanaan IT
				</div>
				<table className="w-full border-collapse border border-black text-[10px]">
					<tbody>
						<tr className="border-b border-black">
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								PIC Developer / Teknisi
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								{request.assigned_to_name || request.developer_name || "-"}
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold text-black border-r border-black">
								Progres Pengerjaan
							</td>
							<td className="w-1/4 px-3 py-1.5 font-bold font-mono text-black">
								{request.progress_percentage ?? 0}%
							</td>
						</tr>
						<tr>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Target Selesai
							</td>
							<td className="px-3 py-1.5 font-mono text-black border-r border-black">
								{formatDate(request.expected_completion_date)}
							</td>
							<td className="px-3 py-1.5 font-bold text-black border-r border-black">
								Realisasi Selesai
							</td>
							<td className="px-3 py-1.5 font-mono text-black">
								{formatDate(request.actual_completion_date)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian V: Lembar Pengesahan (3 Kolom Tanda Tangan) */}
			<div className="pt-2 print-avoid-break border-t-2 border-black">
				<div className="text-[9.5px] text-black font-mono mb-2 text-center uppercase tracking-wider font-bold">
					LEMBAR PENGESAHAN PERMINTAAN PENGEMBANGAN SISTEM
				</div>
				<div className="grid grid-cols-3 gap-3 text-center">
					{/* Pemohon */}
					<div className="border border-black p-2 bg-white">
						<p className="text-[9px] text-black mb-0.5">Pemohon,</p>
						<p className="text-[9.5px] font-bold text-black">Staff / Pengaju</p>
						<div className="h-16 border-b border-black w-32 mx-auto mb-1"></div>
						<p className="text-[9.5px] font-bold text-black truncate px-1">
							{request.user_name || "( ................................ )"}
						</p>
						<p className="text-[8px] font-mono text-black">
							{request.user_id ? `NIP: ${request.user_id}` : ""}
						</p>
					</div>

					{/* Atasan Pemohon */}
					<div className="border border-black p-2 bg-white">
						<p className="text-[9px] text-black mb-0.5">Menyetujui,</p>
						<p className="text-[9.5px] font-bold text-black">Ka. Instalasi / Departemen</p>
						<div className="h-16 border-b border-black w-32 mx-auto mb-1"></div>
						<p className="text-[9.5px] font-bold text-black truncate px-1">
							{request.approved_by_name || "( ................................ )"}
						</p>
						<p className="text-[8px] font-mono text-black truncate">
							{request.departemen_name || ""}
						</p>
					</div>

					{/* Penanggung Jawab IT */}
					<div className="border border-black p-2 bg-white">
						<p className="text-[9px] text-black mb-0.5">Pelaksana IT,</p>
						<p className="text-[9.5px] font-bold text-black">Lead Dev / Ka. SIMRS</p>
						<div className="h-16 border-b border-black w-32 mx-auto mb-1"></div>
						<p className="text-[9.5px] font-bold text-black truncate px-1">
							{request.assigned_to_name || "( ................................ )"}
						</p>
						<p className="text-[8px] font-mono text-black">
							Tim Pengembang SIMRS
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
