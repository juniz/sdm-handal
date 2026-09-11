"use client";

import { useState } from "react";
import {
	Calendar,
	Users,
	Plus,
	Download,
	Edit,
	Trash2,
	ChevronUp,
	ChevronDown,
	Eye,
	CheckCircle2,
	FileText,
	ArrowUpDown,
} from "lucide-react";
import SignatureImage from "./SignatureImage";

const RapatSessionGroup = ({
	session,
	globalIndexOffset = 0,
	totalGlobalItems = 0,
	onAddAttendee,
	onExportPDF,
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	onUrutanChange,
	searchNamaPeserta = "",
	isITUser = false,
}) => {
	const { namaRapat, tanggal, pesertaList } = session;
	const [activeSignature, setActiveSignature] = useState(null);
	const [isReorderMode, setIsReorderMode] = useState(false);

	const highlightText = (text, searchTerm) => {
		if (!searchTerm || !text) return text;
		const sanitized = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`(${sanitized})`, "gi");
		const parts = text.split(regex);
		return parts.map((part, index) =>
			regex.test(part) ? (
				<mark
					key={index}
					className="bg-sky-100 text-sky-900 font-semibold px-0.5 rounded"
				>
					{part}
				</mark>
			) : (
				part
			)
		);
	};

	return (
		<div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden transition-all hover:border-slate-300">
			{/* Session Header */}
			<div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
				<div className="flex items-start md:items-center gap-3">
					<div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 text-sky-700">
						<FileText className="w-4 h-4" />
					</div>
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-bold text-slate-900 text-base leading-snug">
								{namaRapat}
							</h3>
							<span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
								<Users className="w-3 h-3" />
								{pesertaList.length} Peserta
							</span>
							{isReorderMode && (
								<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
									Mode Atur Urutan Aktif
								</span>
							)}
						</div>
						<div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
							<Calendar className="w-3.5 h-3.5 text-slate-400" />
							<span>{tanggal}</span>
						</div>
					</div>
				</div>

				{/* Quick Actions for this Session */}
				<div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
					{isITUser && onUrutanChange && (
						<button
							type="button"
							onClick={() => setIsReorderMode(!isReorderMode)}
							className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
								isReorderMode
									? "bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-300"
									: "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 focus:ring-slate-300"
							}`}
							title="Ubah urutan baris presensi"
						>
							<ArrowUpDown className="w-3.5 h-3.5" />
							<span>{isReorderMode ? "Selesai Atur" : "Atur Urutan"}</span>
						</button>
					)}

					<button
						type="button"
						onClick={() => onAddAttendee(namaRapat)}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
						title="Catat kehadiran untuk rapat ini"
					>
						<Plus className="w-3.5 h-3.5" />
						<span>+ Peserta</span>
					</button>

					<button
						type="button"
						onClick={() => onExportPDF(session)}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
						title="Unduh daftar presensi rapat ini (PDF)"
					>
						<Download className="w-3.5 h-3.5 text-slate-600" />
						<span>Export PDF</span>
					</button>
				</div>
			</div>

			{/* Dense Attendance Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-slate-100/60 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
							<th className="py-2.5 px-4 w-16 text-center">Urutan</th>
							<th className="py-2.5 px-4">Nama Peserta</th>
							<th className="py-2.5 px-4">Instansi / Unit</th>
							<th className="py-2.5 px-4 w-36">Tanda Tangan</th>
							<th className="py-2.5 px-4 w-28 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{pesertaList.map((item, idx) => {
							const globalIndex = globalIndexOffset + idx;
							const urutanVal = item.urutan || globalIndex + 1;

							return (
								<tr
									key={item.id}
									className="hover:bg-sky-50/40 transition-colors group"
								>
									{/* Urutan column */}
									<td className="py-2.5 px-4 align-middle text-center">
										{isITUser && isReorderMode && onUrutanChange ? (
											<div className="flex items-center justify-center gap-1">
												<input
													type="text"
													inputMode="numeric"
													defaultValue={urutanVal}
													key={urutanVal}
													onBlur={(e) => {
														const val = parseInt(e.target.value);
														if (
															!isNaN(val) &&
															val >= 1 &&
															val <= totalGlobalItems &&
															val !== urutanVal
														) {
															onUrutanChange(item.id, val);
														} else {
															e.target.value = urutanVal;
														}
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") e.target.blur();
													}}
													className="w-10 h-7 text-xs font-bold text-center border border-amber-300 rounded bg-white hover:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
													title={`Ubah urutan (1-${totalGlobalItems})`}
													aria-label={`Urutan presensi ${item.nama}`}
												/>
												<div className="flex flex-col">
													<button
														type="button"
														onClick={() => onMoveUp(globalIndex)}
														disabled={globalIndex === 0}
														className="text-slate-400 hover:text-sky-700 disabled:opacity-20 p-0.5 transition-colors"
														aria-label="Pindah urutan ke atas"
													>
														<ChevronUp className="w-3 h-3" />
													</button>
													<button
														type="button"
														onClick={() => onMoveDown(globalIndex)}
														disabled={globalIndex === totalGlobalItems - 1}
														className="text-slate-400 hover:text-sky-700 disabled:opacity-20 p-0.5 transition-colors"
														aria-label="Pindah urutan ke bawah"
													>
														<ChevronDown className="w-3 h-3" />
													</button>
												</div>
											</div>
										) : (
											<span className="inline-block px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded">
												#{urutanVal}
											</span>
										)}
									</td>

									{/* Peserta column */}
									<td className="py-2.5 px-4 align-middle font-medium text-slate-900">
										<div className="leading-snug">
											{highlightText(item.nama, searchNamaPeserta)}
										</div>
									</td>

									{/* Instansi column */}
									<td className="py-2.5 px-4 align-middle text-slate-600 text-xs md:text-sm">
										<span className="inline-block px-2 py-0.5 rounded bg-slate-50 border border-slate-200/80">
											{item.instansi || "-"}
										</span>
									</td>

									{/* Tanda Tangan column */}
									<td className="py-2.5 px-4 align-middle">
										{item.tanda_tangan ? (
											<button
												type="button"
												onClick={() => setActiveSignature(item)}
												className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
												title="Klik untuk melihat tanda tangan"
											>
												<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
												<span>Tersedia</span>
												<Eye className="w-3 h-3 text-emerald-500 opacity-60 ml-0.5" />
											</button>
										) : (
											<span className="text-xs text-slate-400 italic">
												Belum ada
											</span>
										)}
									</td>

									{/* Actions column */}
									<td className="py-2.5 px-4 align-middle text-right">
										<div className="inline-flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() => onEdit(item)}
												className="p-1.5 text-sky-700 hover:text-sky-800 hover:bg-sky-100/70 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
												aria-label={`Edit data ${item.nama}`}
												title="Edit"
											>
												<Edit className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() => onDelete(item.id, item.nama)}
												className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100/70 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
												aria-label={`Hapus data ${item.nama}`}
												title="Hapus"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Signature Preview Modal */}
			{activeSignature && (
				<div
					className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
					onClick={() => setActiveSignature(null)}
				>
					<div
						className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-sm w-full"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between pb-3 border-b border-slate-100">
							<div>
								<h4 className="font-bold text-slate-900 text-sm">
									Tanda Tangan Peserta
								</h4>
								<p className="text-xs text-slate-500 mt-0.5">
									{activeSignature.nama} ({activeSignature.instansi})
								</p>
							</div>
							<button
								type="button"
								onClick={() => setActiveSignature(null)}
								className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded bg-slate-100"
							>
								Tutup
							</button>
						</div>
						<div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center min-h-[140px]">
							<SignatureImage
								base64Data={activeSignature.tanda_tangan}
								signatureData={activeSignature.tanda_tangan}
								nama={activeSignature.nama}
								className="max-h-32 object-contain"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default RapatSessionGroup;
