"use client";

import React from "react";
import { FileText, Loader2, Info, Eye, Lock, Clock, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function AuditTable({
	loading = false,
	rekapList = [],
	meta = { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
	sortField = "nama",
	sortDirection = "asc",
	onSortChange,
	onPageChange,
	onOpenDetail,
}) {
	const handleSort = (field) => {
		if (typeof onSortChange === "function") {
			onSortChange(field);
		}
	};

	const renderSortIcon = (field) => {
		if (sortField === field) {
			return sortDirection === "asc" ? (
				<ArrowUp className="w-3 h-3 text-sky-600 inline ml-1 shrink-0" />
			) : (
				<ArrowDown className="w-3 h-3 text-sky-600 inline ml-1 shrink-0" />
			);
		}
		return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover/th:text-slate-500 inline ml-1 shrink-0 transition-colors" />;
	};

	return (
		<div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
			{/* Table Header Section */}
			<div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50/50">
				<h3 className="font-bold text-slate-800 text-sm font-figtree flex items-center gap-2">
					<FileText className="w-4 h-4 text-sky-600" />
					Daftar Penilaian Kinerja Pegawai
				</h3>
				<span className="text-xs font-mono text-slate-500">
					Total: <strong className="text-slate-800 font-bold">{meta?.totalItems ?? 0}</strong> Pegawai
				</span>
			</div>

			{/* Table Body Content */}
			{loading ? (
				<div className="flex flex-col justify-center items-center py-20 space-y-3">
					<Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
					<span className="text-xs text-slate-500 font-mono">
						Memuat data audit pengawasan...
					</span>
				</div>
			) : !rekapList || rekapList.length === 0 ? (
				<div className="text-center py-16 px-4 space-y-2">
					<Info className="w-9 h-9 text-slate-300 mx-auto" />
					<p className="text-slate-800 font-bold text-sm">Tidak Ada Data Rekap Pengawasan</p>
					<p className="text-slate-500 text-xs">
						Sesuaikan kriteria filter atau periode pencarian Anda.
					</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs md:text-sm border-collapse">
						<thead className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono select-none">
							<tr>
								<th
									scope="col"
									onClick={() => handleSort("nik")}
									aria-sort={sortField === "nik" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="sticky left-0 z-20 bg-slate-50 py-3.5 px-4 whitespace-nowrap align-middle min-w-[90px] cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
								>
									<div className="flex items-center justify-between gap-1">
										<span>NIK</span>
										{renderSortIcon("nik")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("nama")}
									aria-sort={sortField === "nama" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="sticky left-[90px] z-20 bg-slate-50 py-3.5 px-4 whitespace-nowrap align-middle min-w-[180px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
								>
									<div className="flex items-center justify-between gap-1">
										<span>Nama Pegawai</span>
										{renderSortIcon("nama")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("nama_departemen")}
									aria-sort={sortField === "nama_departemen" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 whitespace-nowrap align-middle min-w-[140px] cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
								>
									<div className="flex items-center justify-between gap-1">
										<span>Departemen</span>
										{renderSortIcon("nama_departemen")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("stts_kerja")}
									aria-sort={sortField === "stts_kerja" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Status Kerja</span>
										{renderSortIcon("stts_kerja")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("total_hari_jadwal")}
									aria-sort={sortField === "total_hari_jadwal" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Total Hari Kerja Wajib Sesuai Jadwal Shift"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Wajib</span>
										{renderSortIcon("total_hari_jadwal")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("hari_approved")}
									aria-sort={sortField === "hari_approved" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Hari Evaluasi Disetujui Supervisor (Approved)"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Disetujui</span>
										{renderSortIcon("hari_approved")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("hari_pending")}
									aria-sort={sortField === "hari_pending" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Hari Evaluasi Menunggu Persetujuan Supervisor"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Pending</span>
										{renderSortIcon("hari_pending")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("hari_draft")}
									aria-sort={sortField === "hari_draft" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Hari Evaluasi Masih Status Draft / Revisi"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Draft</span>
										{renderSortIcon("hari_draft")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("hari_kosong")}
									aria-sort={sortField === "hari_kosong" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Hari Kerja Terjadwal Tanpa Pengisian Laporan Kegiatan"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Kosong</span>
										{renderSortIcon("hari_kosong")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("gap_hari")}
									aria-sort={sortField === "gap_hari" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Selisih Hari Wajib yang Belum Disetujui Supervisor"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Gap Hari</span>
										{renderSortIcon("gap_hari")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("rata_skor_total")}
									aria-sort={sortField === "rata_skor_total" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Rata-Rata Skor Penilaian Harian Disetujui"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Rata Skor</span>
										{renderSortIcon("rata_skor_total")}
									</div>
								</th>
								<th
									scope="col"
									onClick={() => handleSort("status_rekap")}
									aria-sort={sortField === "status_rekap" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
									className="py-3.5 px-4 text-center whitespace-nowrap align-middle cursor-pointer hover:bg-slate-100/90 transition-colors group/th"
									title="Status Kunci Rekapitulasi Akhir Bulanan"
								>
									<div className="flex items-center justify-center gap-1">
										<span>Rekap</span>
										{renderSortIcon("status_rekap")}
									</div>
								</th>
								<th scope="col" className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{rekapList.map((row) => {
								const isLocked = row.status_rekap === "LOCKED" || row.status_rekap === "final";
								const totalJadwal = Number(row.total_hari_jadwal || 0);
								const hariApproved = Number(row.hari_approved || 0);
								const hariPending = Number(row.hari_pending || 0);
								const hariDraft = Number(row.hari_draft || 0);
								const hariKosong = Number(row.hari_kosong || 0);
								const gapHari = Number(row.gap_hari || 0);
								const compliancePct = totalJadwal > 0 ? Math.round((hariApproved / totalJadwal) * 100) : 0;

								return (
									<tr
										key={row.id || `${row.pegawai_id}-${row.bulan}-${row.tahun}`}
										className="hover:bg-slate-50/80 transition-colors group"
									>
										{/* NIK (Sticky) */}
										<td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 py-3.5 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap align-middle transition-colors">
											{row.nik || "-"}
										</td>

										{/* Nama Pegawai (Sticky) */}
										<td className="sticky left-[90px] z-10 bg-white group-hover:bg-slate-50/90 py-3.5 px-4 font-bold text-slate-900 font-figtree align-middle shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] transition-colors">
											<div className="flex flex-col">
												<span className="truncate max-w-[220px]" title={row.nama}>{row.nama}</span>
												{totalJadwal > 0 && (
													<div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 max-w-[140px]" title={`Kepatuhan: ${compliancePct}% (${hariApproved}/${totalJadwal} hari)`}>
														<div
															className={`h-full rounded-full ${
																compliancePct >= 80 ? "bg-emerald-500" : compliancePct >= 50 ? "bg-amber-500" : "bg-rose-500"
															}`}
															style={{ width: `${Math.min(100, Math.max(0, compliancePct))}%` }}
														/>
													</div>
												)}
											</div>
										</td>

										{/* Departemen */}
										<td className="py-3.5 px-4 text-slate-600 font-medium align-middle">
											{row.nama_departemen || "-"}
										</td>

										{/* Status Kerja */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											<span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 rounded-md font-mono whitespace-nowrap">
												{row.stts_kerja || "-"}
											</span>
										</td>

										{/* Jadwal (Hari Wajib) */}
										<td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono align-middle">
											{totalJadwal}
										</td>

										{/* Disetujui (OK) */}
										<td className="py-3.5 px-4 text-center font-bold text-emerald-700 font-mono align-middle">
											<span className="inline-block px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-50 rounded border border-emerald-200/80 font-mono">
												{hariApproved}
											</span>
										</td>

										{/* Pending */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											{hariPending > 0 ? (
												<span className="inline-block px-2 py-0.5 text-xs font-bold text-amber-800 bg-amber-50 rounded border border-amber-200/80 font-mono">
													{hariPending}
												</span>
											) : (
												<span className="text-slate-300 font-mono">-</span>
											)}
										</td>

										{/* Draft */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											{hariDraft > 0 ? (
												<span className="inline-block px-2 py-0.5 text-xs font-bold text-slate-700 bg-slate-100 rounded border border-slate-200 font-mono">
													{hariDraft}
												</span>
											) : (
												<span className="text-slate-300 font-mono">-</span>
											)}
										</td>

										{/* Kosong */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											{hariKosong > 0 ? (
												<span className="inline-block px-2 py-0.5 text-xs font-bold text-rose-700 bg-rose-50 rounded border border-rose-200/80 font-mono">
													{hariKosong}
												</span>
											) : (
												<span className="text-slate-300 font-mono">-</span>
											)}
										</td>

										{/* Gap */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											{gapHari > 0 ? (
												<span className="inline-block px-2 py-0.5 text-xs font-bold text-rose-800 bg-rose-100 rounded-md border border-rose-200 font-mono shadow-2xs">
													{gapHari} Hari
												</span>
											) : (
												<span className="inline-block px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200/60 font-mono">
													0
												</span>
											)}
										</td>

										{/* Rata-Rata Skor */}
										<td className="py-3.5 px-4 text-center font-bold text-sky-800 font-figtree text-sm align-middle">
											{row.rata_skor_total != null ? Math.round(row.rata_skor_total) : 0}
										</td>

										{/* Status Rekap */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											{isLocked ? (
												<span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full inline-flex items-center gap-1 font-mono whitespace-nowrap">
													<Lock className="w-3 h-3 text-emerald-700" /> LOCKED
												</span>
											) : (
												<span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full inline-flex items-center gap-1 font-mono whitespace-nowrap">
													<Clock className="w-3 h-3 text-amber-700" /> DRAFT
												</span>
											)}
										</td>

										{/* Aksi */}
										<td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
											<button
												type="button"
												onClick={() => onOpenDetail && onOpenDetail(row)}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 rounded-xl hover:bg-sky-700 hover:text-white hover:border-sky-700 active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs whitespace-nowrap"
											>
												<Eye className="w-3.5 h-3.5" />
												<span>Detail Audit</span>
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination Controls */}
			<div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 text-xs">
				<div className="text-slate-500 font-medium">
					Halaman <span className="font-bold text-slate-800">{meta?.page ?? 1}</span> dari{" "}
					<span className="font-bold text-slate-800">{meta?.totalPages ?? 1}</span> (Total{" "}
					<span className="font-bold text-slate-800">{meta?.totalItems ?? 0}</span> pegawai)
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						disabled={(meta?.page ?? 1) <= 1 || loading}
						onClick={() => onPageChange && onPageChange(Math.max(1, (meta?.page ?? 1) - 1))}
						className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
					>
						<ChevronLeft className="w-4 h-4" />
						<span>Sebelumnya</span>
					</button>
					<button
						type="button"
						disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1) || loading}
						onClick={() =>
							onPageChange && onPageChange(Math.min(meta?.totalPages ?? 1, (meta?.page ?? 1) + 1))
						}
						className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
					>
						<span>Berikutnya</span>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
