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
		<div className="text-black font-sans text-xs bg-white w-full leading-normal print-doc-container">
			<style dangerouslySetInnerHTML={{ __html: `
				.print-doc-container {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
					color: #000000 !important;
					background: #ffffff !important;
				}
				.print-table {
					width: 100% !important;
					border-collapse: collapse !important;
					border: 1px solid #000000 !important;
				}
				.print-table th, .print-table td {
					border: 1px solid #000000 !important;
					padding: 3px 6px !important;
				}
				.print-border-double {
					border-bottom: 4px double #000000 !important;
				}
			` }} />
			{/* Kop Formulir Resmi Kedinasan Polri / RSB Nganjuk */}
			<div className="border-b-4 border-double border-black pb-2 mb-2.5 print-avoid-break print-border-double">
				<div className="flex items-center justify-between gap-3">
					<div className="flex-shrink-0">
						<img
							src="/logo-kop.png"
							alt="Logo Instansi"
							className="h-14 w-auto object-contain"
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					</div>
					<div className="flex-1 text-center px-2">
						<h3 className="text-[11px] font-bold tracking-wide uppercase text-black leading-tight">
							POLRI DAERAH JAWA TIMUR
						</h3>
						<h3 className="text-[11px] font-bold tracking-wide uppercase text-black leading-tight">
							BIDANG KEDOKTERAN DAN KESEHATAN
						</h3>
						<h1 className="text-sm sm:text-base font-black tracking-wide text-black uppercase leading-tight mt-0.5">
							RUMAH SAKIT BHAYANGKARA TK. III NGANJUK
						</h1>
					</div>
					<div className="text-right text-[8.5px] font-mono text-black flex-shrink-0">
						<div className="border border-black p-1 bg-white text-center">
							<div className="text-black font-bold text-[8px]">NOMOR TIKET</div>
							<div className="font-black text-black text-xs">{request.no_request || "-"}</div>
						</div>
						<div className="mt-1 text-[8px]">Dicetak: {formattedPrintDate} WIB</div>
					</div>
				</div>
			</div>

			{/* Judul Dokumen */}
			<div className="text-center my-2 print-avoid-break">
				<h2 className="text-sm font-black text-black uppercase tracking-wider underline">
					FORMULIR PERMINTAAN PENGEMBANGAN SISTEM INFORMASI
				</h2>
				<p className="text-[9px] text-black font-mono mt-0.5">
					Software Development Request Form (SDRF)
				</p>
			</div>

			{/* Bagian I: Data Pemohon & Tiket */}
			<div className="mb-2.5 print-avoid-break">
				<div className="bg-white border border-black px-2.5 py-0.5 font-bold text-[9.5px] uppercase tracking-wide text-black font-mono mb-1">
					Bagian I: Data Pemohon & Identitas Tiket
				</div>
				<table className="w-full border-collapse border border-black text-[9.5px] print-table">
					<tbody>
						<tr className="border-b border-black">
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								Nomor Tiket
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold font-mono text-black border-r border-black">
								{request.no_request || "-"}
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								Tanggal Pengajuan
							</td>
							<td className="w-1/4 px-2.5 py-1 text-black">
								{formatDate(request.submission_date)}
							</td>
						</tr>
						<tr className="border-b border-black">
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Nama Pemohon
							</td>
							<td className="px-2.5 py-1 font-semibold text-black border-r border-black">
								{request.user_name || "-"}
							</td>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								NIP / NIK Pemohon
							</td>
							<td className="px-2.5 py-1 font-mono text-black">
								{request.user_id || "-"}
							</td>
						</tr>
						<tr className="border-b border-black">
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Departemen / Unit
							</td>
							<td className="px-2.5 py-1 text-black border-r border-black">
								{request.departemen_name || "-"}
							</td>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Kategori Modul
							</td>
							<td className="px-2.5 py-1 font-medium text-black">
								{request.module_type || "-"}
							</td>
						</tr>
						<tr>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Prioritas
							</td>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								<span className="border border-black px-1 py-0.2 uppercase text-[8.5px]">
									{request.priority || request.priority_level || "Normal"}
								</span>
							</td>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Status Saat Ini
							</td>
							<td className="px-2.5 py-1 font-bold uppercase text-black">
								<span className="border border-black px-1 py-0.2 text-[8.5px]">
									{formatStatusIndonesian(request.current_status)}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian II: Rincian Kebutuhan Pengembangan */}
			<div className="mb-2.5 print-avoid-break">
				<div className="bg-white border border-black px-2.5 py-0.5 font-bold text-[9.5px] uppercase tracking-wide text-black font-mono mb-1">
					Bagian II: Rincian Spesifikasi Kebutuhan Sistem
				</div>
				<div className="border border-black divide-y divide-black text-[9.5px]">
					<div className="p-1.5 bg-white">
						<div className="text-black font-bold text-[8.5px] uppercase">Judul Permintaan / Modul</div>
						<div className="font-bold text-black text-xs">{request.title}</div>
					</div>
					<div className="p-1.5 bg-white">
						<div className="text-black font-bold text-[8.5px] uppercase mb-0.5">Deskripsi Spesifikasi / Kebutuhan Fitur</div>
						<div className="text-black leading-relaxed whitespace-pre-wrap font-sans text-[9px]">
							{request.description || "-"}
						</div>
					</div>
					{(request.business_impact || request.impact_analysis) && (
						<div className="p-1.5 bg-white">
							<div className="text-black font-bold text-[8.5px] uppercase mb-0.5">Dampak Terhadap Alur Kerja / Layanan</div>
							<div className="text-black leading-relaxed whitespace-pre-wrap font-sans text-[9px]">
								{request.business_impact || request.impact_analysis}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bagian III: Verifikasi & Persetujuan (Approval) */}
			<div className="mb-2.5 print-avoid-break">
				<div className="bg-white border border-black px-2.5 py-0.5 font-bold text-[9.5px] uppercase tracking-wide text-black font-mono mb-1">
					Bagian III: Verifikasi & Persetujuan Manajemen
				</div>
				<table className="w-full border-collapse border border-black text-[9.5px] print-table">
					<tbody>
						<tr className="border-b border-black">
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								Status Persetujuan
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold uppercase text-black border-r border-black">
								<span className="border border-black px-1 py-0.2 text-[8.5px]">
									{request.approval_status || (request.current_status === "Rejected" ? "DITOLAK" : request.current_status === "Draft" ? "DRAFT" : "DISETUJUI")}
								</span>
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								Tanggal Approval
							</td>
							<td className="w-1/4 px-2.5 py-1 text-black font-mono">
								{formatDate(request.approval_date || request.updated_at)}
							</td>
						</tr>
						<tr className="border-b border-black">
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Penyetuju / Approver
							</td>
							<td colSpan={3} className="px-2.5 py-1 font-bold text-black">
								{request.approved_by_name || request.approver_name || "-"}
							</td>
						</tr>
						<tr>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Catatan Persetujuan
							</td>
							<td colSpan={3} className="px-2.5 py-1 text-black italic">
								{request.approval_notes || request.approval_reason || "Tidak ada catatan khusus."}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian IV: Penugasan & Pelaksanaan IT */}
			<div className="mb-3 print-avoid-break">
				<div className="bg-white border border-black px-2.5 py-0.5 font-bold text-[9.5px] uppercase tracking-wide text-black font-mono mb-1">
					Bagian IV: Penugasan Teknis & Pelaksanaan IT
				</div>
				<table className="w-full border-collapse border border-black text-[9.5px] print-table">
					<tbody>
						<tr className="border-b border-black">
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								PIC Developer / Teknisi
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								{request.assigned_to_name || request.developer_name || "-"}
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold text-black border-r border-black">
								Progres Pengerjaan
							</td>
							<td className="w-1/4 px-2.5 py-1 font-bold font-mono text-black">
								{request.progress_percentage ?? 0}%
							</td>
						</tr>
						<tr>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Target Selesai
							</td>
							<td className="px-2.5 py-1 font-mono text-black border-r border-black">
								{formatDate(request.expected_completion_date)}
							</td>
							<td className="px-2.5 py-1 font-bold text-black border-r border-black">
								Realisasi Selesai
							</td>
							<td className="px-2.5 py-1 font-mono text-black">
								{formatDate(request.actual_completion_date)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Bagian V: Lembar Pengesahan (3 Kolom Tanda Tangan) */}
			<div className="pt-2 print-avoid-break border-t-2 border-black">
				<div className="text-[9px] text-black font-mono mb-1.5 text-center uppercase tracking-wider font-bold">
					LEMBAR PENGESAHAN PERMINTAAN PENGEMBANGAN SISTEM
				</div>
				<div className="grid grid-cols-3 gap-3 text-center">
					{/* Pemohon */}
					<div className="border border-black p-1.5 bg-white">
						<p className="text-[8.5px] text-black mb-0.5">Pemohon,</p>
						<p className="text-[9px] font-bold text-black">Staff / Pengaju</p>
						<div className="h-12 border-b border-black w-28 mx-auto mb-1"></div>
						<p className="text-[9px] font-bold text-black truncate px-1">
							{request.user_name || "( ................................ )"}
						</p>
						<p className="text-[7.5px] font-mono text-black">
							{request.user_id ? `NIP: ${request.user_id}` : ""}
						</p>
					</div>

					{/* Atasan Pemohon */}
					<div className="border border-black p-1.5 bg-white">
						<p className="text-[8.5px] text-black mb-0.5">Menyetujui,</p>
						<p className="text-[9px] font-bold text-black">Ka. Instalasi / Departemen</p>
						<div className="h-12 border-b border-black w-28 mx-auto mb-1"></div>
						<p className="text-[9px] font-bold text-black truncate px-1">
							{request.approved_by_name || "( ................................ )"}
						</p>
						<p className="text-[7.5px] font-mono text-black truncate">
							{request.departemen_name || ""}
						</p>
					</div>

					{/* Penanggung Jawab IT */}
					<div className="border border-black p-1.5 bg-white">
						<p className="text-[8.5px] text-black mb-0.5">Pelaksana IT,</p>
						<p className="text-[9px] font-bold text-black">Lead Dev / Ka. SIMRS</p>
						<div className="h-12 border-b border-black w-28 mx-auto mb-1"></div>
						<p className="text-[9px] font-bold text-black truncate px-1">
							{request.assigned_to_name || "( ................................ )"}
						</p>
						<p className="text-[7.5px] font-mono text-black">
							Tim Pengembang SIMRS
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
