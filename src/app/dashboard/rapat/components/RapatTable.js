"use client";

import { useState } from "react";
import {
	Users,
	Edit,
	Trash2,
	ChevronUp,
	ChevronDown,
	Eye,
	CheckCircle2,
	ArrowUpDown,
	Calendar,
	Building,
	FileText,
} from "lucide-react";
import SignatureImage from "./SignatureImage";

const RapatTable = ({
	rapatList,
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	onUrutanChange,
	searchNamaRapat = "",
	searchNamaPeserta = "",
	isITUser = false,
}) => {
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
		<div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
			{/* Table Toolbar Header */}
			<div className="bg-slate-50/80 px-4 sm:px-5 py-3 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
						Daftar Hadir Presensi
					</span>
					<span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
						<Users className="w-3 h-3" />
						{rapatList.length} Peserta
					</span>
					{isReorderMode && (
						<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
							Mode Atur Urutan Aktif
						</span>
					)}
				</div>

				{isITUser && onUrutanChange && (
					<button
						type="button"
						onClick={() => setIsReorderMode(!isReorderMode)}
						className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 w-full sm:w-auto ${
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
			</div>

			{/* Desktop & Tablet Table View (hidden on mobile) */}
			<div className="hidden md:block overflow-x-auto">
				<table className="w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-slate-100/60 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
							<th className="py-2.5 px-4 w-16 text-center">Urutan</th>
							<th className="py-2.5 px-4">Nama Rapat</th>
							<th className="py-2.5 px-4">Nama Peserta</th>
							<th className="py-2.5 px-4">Instansi / Unit</th>
							<th className="py-2.5 px-4 w-36">Tanda Tangan</th>
							<th className="py-2.5 px-4 w-28 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{rapatList.map((item, idx) => {
							const urutanVal = item.urutan || idx + 1;

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
															val <= rapatList.length &&
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
													title={`Ubah urutan (1-${rapatList.length})`}
													aria-label={`Urutan presensi ${item.nama}`}
												/>
												<div className="flex flex-col">
													<button
														type="button"
														onClick={() => onMoveUp(idx)}
														disabled={idx === 0}
														className="text-slate-400 hover:text-sky-700 disabled:opacity-20 p-0.5 transition-colors"
														aria-label="Pindah urutan ke atas"
													>
														<ChevronUp className="w-3 h-3" />
													</button>
													<button
														type="button"
														onClick={() => onMoveDown(idx)}
														disabled={idx === rapatList.length - 1}
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

									{/* Nama Rapat column */}
									<td className="py-2.5 px-4 align-middle">
										<div className="font-semibold text-slate-900 leading-snug">
											{highlightText(item.rapat, searchNamaRapat)}
										</div>
										<div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
											<Calendar className="w-3 h-3 text-slate-400" />
											<span>{item.tanggal}</span>
										</div>
									</td>

									{/* Nama Peserta column */}
									<td className="py-2.5 px-4 align-middle font-medium text-slate-900">
										<div className="leading-snug">
											{highlightText(item.nama, searchNamaPeserta)}
										</div>
									</td>

									{/* Instansi / Unit column */}
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

									{/* Aksi column */}
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

			{/* Mobile Card List View (block on mobile, hidden on md+) */}
			<div className="block md:hidden divide-y divide-slate-200/80">
				{rapatList.map((item, idx) => {
					const urutanVal = item.urutan || idx + 1;

					return (
						<div
							key={item.id}
							className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors"
						>
							{/* Card Top Row: Urutan & Actions */}
							<div className="flex items-center justify-between gap-2">
								{isITUser && isReorderMode && onUrutanChange ? (
									<div className="flex items-center gap-1.5">
										<span className="text-xs font-semibold text-slate-500">
											Urutan:
										</span>
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
													val <= rapatList.length &&
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
											className="w-12 h-8 text-xs font-bold text-center border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
											aria-label={`Ubah urutan ${item.nama}`}
										/>
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => onMoveUp(idx)}
												disabled={idx === 0}
												className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
												aria-label="Pindah ke atas"
											>
												<ChevronUp className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() => onMoveDown(idx)}
												disabled={idx === rapatList.length - 1}
												className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
												aria-label="Pindah ke bawah"
											>
												<ChevronDown className="w-4 h-4" />
											</button>
										</div>
									</div>
								) : (
									<span className="inline-block px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-md">
										#{urutanVal}
									</span>
								)}

								{/* Mobile Touch Action Buttons (min 44px touch ergonomics) */}
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => onEdit(item)}
										className="p-2 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500"
										aria-label={`Edit data ${item.nama}`}
										title="Edit"
									>
										<Edit className="w-4 h-4" />
									</button>
									<button
										type="button"
										onClick={() => onDelete(item.id, item.nama)}
										className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-500"
										aria-label={`Hapus data ${item.nama}`}
										title="Hapus"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Card Body: Attendee & Unit */}
							<div className="space-y-1">
								<h4 className="text-base font-bold text-slate-900 leading-snug">
									{highlightText(item.nama, searchNamaPeserta)}
								</h4>
								<div className="flex items-center gap-1.5 text-xs text-slate-600">
									<Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
									<span>{item.instansi || "-"}</span>
								</div>
							</div>

							{/* Card Footer: Meeting Title & Signature */}
							<div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
								<div className="flex items-center gap-1.5 text-xs text-slate-600">
									<FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
									<span className="font-semibold text-slate-800">
										{highlightText(item.rapat, searchNamaRapat)}
									</span>
								</div>

								{/* Signature Button */}
								{item.tanda_tangan ? (
									<button
										type="button"
										onClick={() => setActiveSignature(item)}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors min-h-[36px]"
										title="Lihat tanda tangan"
									>
										<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
										<span>Tanda Tangan</span>
										<Eye className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />
									</button>
								) : (
									<span className="text-xs text-slate-400 italic">
										Belum bertanda tangan
									</span>
								)}
							</div>
						</div>
					);
				})}
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
								className="text-slate-400 hover:text-slate-600 text-xs px-2.5 py-1.5 rounded bg-slate-100"
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

export default RapatTable;
