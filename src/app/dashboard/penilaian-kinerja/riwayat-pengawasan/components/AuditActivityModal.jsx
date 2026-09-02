"use client";

import React, { useState, useEffect } from "react";
import moment from "moment";
import {
	Calendar as CalendarIcon,
	X,
	Loader2,
	CheckCircle,
	XCircle,
	User,
	RotateCcw,
	AlertTriangle,
	Send,
	ShieldAlert,
	Check
} from "lucide-react";

export default function AuditActivityModal({
	isOpen,
	onClose,
	employee,
	dateStr,
	dayEval,
	dayMeta = { shift: "", isWorkDay: false },
	activities = [],
	loading = false,
	onEvaluationUpdated,
}) {
	const [showRevisiForm, setShowRevisiForm] = useState(false);
	const [catatanRevisi, setCatatanRevisi] = useState("");
	const [actionLoading, setActionLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	// Reset internal state when modal opens or date changes
	useEffect(() => {
		if (isOpen) {
			setShowRevisiForm(false);
			setCatatanRevisi("");
			setErrorMsg("");
			setSuccessMsg("");
		}
	}, [isOpen, dateStr, dayEval]);

	// Escape key dismissal
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && !actionLoading) {
				onClose && onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose, actionLoading]);

	if (!isOpen || !dateStr) return null;

	const formattedDate = moment(dateStr).format("DD MMMM YYYY");
	const dayName = moment(dateStr).format("dddd");

	const rawShift = dayEval?.shift_jadwal || dayMeta?.shift || "";
	const rawShiftUpper = String(rawShift).toUpperCase();

	// Prioritize Dinas Luar Kota detection
	const isModalDinasLuar =
		rawShiftUpper === "D" ||
		rawShiftUpper === "DL" ||
		rawShiftUpper.includes("DINAS") ||
		dayEval?.sumber_absensi === "izin_dinas" ||
		dayEval?.sumber_absensi === "izin" ||
		dayEval?.nilai_kondisi === "izin_dinas_luar" ||
		dayEval?.nilai_kondisi === "izin_dinas" ||
		(dayEval?.nilai_kondisi && String(dayEval.nilai_kondisi).toLowerCase().includes("dinas")) ||
		(dayEval?.catatan_supervisor && String(dayEval.catatan_supervisor).toLowerCase().includes("dinas"));

	// Cuti detection only if not Dinas Luar
	const isModalCuti =
		!isModalDinasLuar &&
		(rawShiftUpper === "C" ||
			rawShiftUpper === "CT" ||
			rawShiftUpper.startsWith("CUTI") ||
			dayEval?.sumber_absensi === "cuti" ||
			(dayEval?.nilai_kondisi && String(dayEval.nilai_kondisi).startsWith("cuti_")) ||
			dayEval?.nilai_kondisi === "sakit" ||
			(dayEval?.catatan_supervisor && String(dayEval.catatan_supervisor).toLowerCase().includes("cuti")));

	const handleAction = async (actionType, customNote = "") => {
		if (!dayEval?.id) return;
		const noteToSend = customNote || catatanRevisi;

		if ((actionType === "revisi" || actionType === "admin_revisi") && !noteToSend.trim()) {
			setErrorMsg("Catatan revisi wajib diisi untuk mengembalikan penilaian");
			return;
		}

		setActionLoading(true);
		setErrorMsg("");
		setSuccessMsg("");

		try {
			const res = await fetch(`/api/penilaian/harian/${dayEval.id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: actionType,
					catatan_supervisor: noteToSend.trim()
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal memproses penilaian");

			setSuccessMsg(
				actionType === "approve"
					? "Penilaian harian berhasil disetujui!"
					: actionType === "admin_draft" || actionType === "cancel_approval"
					? "Penilaian berhasil direset ke status Draf!"
					: "Penilaian berhasil dikembalikan ke pegawai untuk direvisi!"
			);
			setShowRevisiForm(false);
			setCatatanRevisi("");

			// Trigger parent refresh
			if (onEvaluationUpdated) {
				await onEvaluationUpdated();
			}
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
			{/* Backdrop click dismiss */}
			<div className="fixed inset-0" onClick={!actionLoading ? onClose : undefined} aria-hidden="true" />

			{/* Modal Dialog Card */}
			<div
				role="dialog"
				aria-modal="true"
				className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scaleIn"
			>
				{/* Modal Header */}
				<div className="p-5 bg-white border-b border-slate-200 flex justify-between items-start gap-4">
					<div className="space-y-1 min-w-0 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 uppercase tracking-widest font-mono bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200/80">
								<CalendarIcon className="w-3 h-3 text-sky-600" />
								Rincian Kegiatan Harian
							</span>
							{rawShift && (
								<span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-md border ${
									isModalDinasLuar
										? "bg-yellow-400 text-slate-950 border-yellow-500 font-black shadow-2xs"
										: isModalCuti
										? "bg-red-600 text-white border-red-700 font-black shadow-2xs"
										: "bg-slate-100 text-slate-700 border-slate-200"
								}`}>
									Shift: {isModalDinasLuar ? "D (Dinas Luar Kota)" : isModalCuti ? "C (Cuti)" : rawShift}
								</span>
							)}
							{dayEval && (
								<span
									className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${
										dayEval.status === "approved"
											? "bg-emerald-50 text-emerald-800 border-emerald-200"
											: dayEval.status === "submitted"
											? "bg-amber-50 text-amber-800 border-amber-200"
											: dayEval.status === "revisi"
											? "bg-rose-50 text-rose-800 border-rose-200"
											: "bg-slate-100 text-slate-700 border-slate-200"
									}`}
								>
									Status: {dayEval.status}
								</span>
							)}
						</div>
						<h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-figtree truncate">
							{dayName}, {formattedDate}
						</h3>
						{employee && (
							<div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
								<User className="w-3.5 h-3.5 text-slate-400" />
								<span className="font-bold text-slate-800">{employee.nama}</span>
								<span>•</span>
								<span>NIK: {employee.nik}</span>
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={actionLoading}
						className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
						title="Tutup (Esc)"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Notifications */}
				{errorMsg && (
					<div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs animate-fadeIn">
						<AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
						<span className="font-semibold">{errorMsg}</span>
					</div>
				)}
				{successMsg && (
					<div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2.5 text-xs animate-fadeIn">
						<CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
						<span className="font-semibold">{successMsg}</span>
					</div>
				)}

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-5 space-y-4">
					{loading ? (
						<div className="flex flex-col justify-center items-center py-16 space-y-3">
							<Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
							<span className="text-xs text-slate-500 font-medium font-mono">
								Memuat rincian aktivitas dan evaluasi...
							</span>
						</div>
					) : (
						<>
							{/* Attendance & Shift Summary Card */}
							{dayEval ? (
								<div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-xs">
									<div>
										<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-figtree">
											Shift Jadwal
										</span>
										<span className="font-extrabold text-slate-800 font-mono text-sm">
											{dayEval.shift_jadwal || dayMeta?.shift || "-"}
										</span>
									</div>
									<div>
										<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-figtree">
											Status Absensi
										</span>
										<span className="font-bold text-slate-700 capitalize">
											{dayEval.nilai_kondisi || "-"}
										</span>
									</div>
									<div>
										<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-figtree">
											Skor Absensi
										</span>
										<span className="font-extrabold text-emerald-700 font-mono text-sm">
											{dayEval.skor_absensi ?? 0}
										</span>
									</div>
									<div>
										<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-figtree">
											Total Skor Harian
										</span>
										<span className="font-black text-sky-700 font-mono text-base">
											{Math.round(dayEval.skor_total ?? 0)}
										</span>
									</div>
								</div>
							) : (
								<div className={`bg-white border rounded-2xl p-4 space-y-2 shadow-xs ${
									isModalDinasLuar
										? "border-amber-300 bg-amber-50/40"
										: isModalCuti
										? "border-red-300 bg-red-50/40"
										: "border-rose-200/80"
								}`}>
									<div className="flex items-center justify-between">
										<span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase font-mono shadow-2xs ${
											isModalDinasLuar
												? "bg-yellow-400 text-slate-950"
												: isModalCuti
												? "bg-red-600 text-white"
												: "bg-rose-100 text-rose-800"
										}`}>
											{isModalDinasLuar
												? "Izin Dinas Luar Kota (D)"
												: isModalCuti
												? "Cuti Pegawai (C)"
												: dayMeta?.isWorkDay
												? "Hari Kosong / Belum Diisi"
												: "Hari Libur (OFF)"}
										</span>
										{rawShift && (
											<span className="text-xs font-mono font-bold text-slate-600">
												Shift: <strong className="text-slate-900">{isModalDinasLuar ? "D (Dinas Luar Kota)" : isModalCuti ? "C (Cuti)" : rawShift}</strong>
											</span>
										)}
									</div>
									<p className={`text-xs leading-relaxed font-medium ${
										isModalDinasLuar
											? "text-amber-950"
											: isModalCuti
											? "text-red-950"
											: "text-rose-800"
									}`}>
										{isModalDinasLuar
											? "Pegawai terjadwal izin dinas luar kota pada tanggal ini."
											: isModalCuti
											? "Pegawai terjadwal cuti pada tanggal ini."
											: dayMeta?.isWorkDay
											? "Pegawai memiliki jadwal shift kerja pada tanggal ini, namun belum mengisi atau menyerahkan penilaian dan laporan kegiatan harian."
											: "Tidak ada jadwal shift kerja (OFF) untuk pegawai pada tanggal ini."}
									</p>
								</div>
							)}

							{/* Supervisor Note Banner if present */}
							{dayEval?.catatan_supervisor && (
								<div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-1 text-xs">
									<div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider font-mono text-[10px]">
										<ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
										Catatan Supervisor / Catatan Revisi:
									</div>
									<p className="text-amber-950 font-medium leading-relaxed pl-5">
										{dayEval.catatan_supervisor}
									</p>
								</div>
							)}

							{/* Admin Revision Form (Toggled) */}
							{showRevisiForm && (
								<div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs font-figtree">
											<RotateCcw className="w-4 h-4 text-rose-600" />
											Kembalikan Penilaian untuk Direvisi Pegawai
										</div>
										<button
											type="button"
											onClick={() => setShowRevisiForm(false)}
											className="text-slate-400 hover:text-slate-600 p-1"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
									<textarea
										rows={3}
										value={catatanRevisi}
										onChange={(e) => setCatatanRevisi(e.target.value)}
										placeholder="Tuliskan catatan/alasan revisi untuk pegawai..."
										className="w-full p-3 bg-white border border-rose-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans resize-none"
									/>
									<div className="flex justify-end gap-2">
										<button
											type="button"
											onClick={() => setShowRevisiForm(false)}
											className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
										>
											Batal
										</button>
										<button
											type="button"
											disabled={actionLoading || !catatanRevisi.trim()}
											onClick={() => handleAction("admin_revisi")}
											className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 active:scale-95 transition-all"
										>
											{actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
											Kirim Revisi ke Pegawai
										</button>
									</div>
								</div>
							)}

							{/* Activities List */}
							<div className="space-y-2.5">
								<div className="flex justify-between items-center pb-1">
									<h4 className="font-bold text-xs text-slate-700 uppercase font-figtree tracking-wider">
										Aktivitas &amp; Output Kerja
									</h4>
									<span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
										{activities.length} Kegiatan
									</span>
								</div>

								{activities.length === 0 ? (
									<div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-200/80">
										<p className="text-xs text-slate-500 font-medium">
											Tidak ada rincian kegiatan tercatat untuk tanggal ini.
										</p>
									</div>
								) : (
									<div className="space-y-2.5">
										{activities.map((act, idx) => {
											const isDone =
												act.status_selesai === "selesai" ||
												act.status_selesai === 1 ||
												act.status_selesai === "1" ||
												act.status_selesai === true;
											return (
												<div
													key={act.id || idx}
													className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs transition-shadow hover:shadow-md"
												>
													<div className="flex justify-between items-start gap-3">
														<span className="font-bold text-xs sm:text-sm text-slate-900 font-figtree flex-1 leading-snug">
															{idx + 1}. {act.judul_kegiatan}
														</span>
														{isDone ? (
															<span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
																<CheckCircle className="w-3 h-3 text-emerald-600" /> Selesai
															</span>
														) : (
															<span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200/80 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
																<XCircle className="w-3 h-3 text-rose-600" /> Belum Selesai
															</span>
														)}
													</div>
													{act.penjabaran && (
														<p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-sans">
															{act.penjabaran}
														</p>
													)}
													{!isDone && act.alasan_belum_selesai && (
														<p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100 italic leading-relaxed">
															<strong>Alasan:</strong> {act.alasan_belum_selesai}
														</p>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Modal Footer with Admin Actions */}
				<div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
					{/* Left: Admin Action Buttons */}
					<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
						{dayEval?.id && (
							<>
								{/* If already approved: allow cancel approval -> revisi or draft */}
								{dayEval.status === "approved" && (
									<>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => setShowRevisiForm(true)}
											className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
										>
											<RotateCcw className="w-3.5 h-3.5 text-rose-600" />
											<span>Batalkan &amp; Minta Revisi</span>
										</button>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => {
												if (window.confirm("Yakin ingin mereset penilaian ini kembali ke status Draf?")) {
													handleAction("admin_draft");
												}
											}}
											className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
										>
											<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
											<span>Reset ke Draf</span>
										</button>
									</>
								)}

								{/* If submitted: allow approve, revisi, or reset to draft */}
								{dayEval.status === "submitted" && (
									<>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => handleAction("approve")}
											className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
										>
											<Check className="w-3.5 h-3.5" />
											<span>Setujui</span>
										</button>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => setShowRevisiForm(true)}
											className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
										>
											<RotateCcw className="w-3.5 h-3.5 text-rose-600" />
											<span>Minta Revisi</span>
										</button>
										<button
											type="button"
											disabled={actionLoading}
											onClick={() => {
												if (window.confirm("Yakin ingin membatalkan pengiriman dan mereset ke Draf?")) {
													handleAction("admin_draft");
												}
											}}
											className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
										>
											<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
											<span>Reset ke Draf</span>
										</button>
									</>
								)}

								{/* If already in revisi: allow reset to draft */}
								{dayEval.status === "revisi" && (
									<button
										type="button"
										disabled={actionLoading}
										onClick={() => {
											if (window.confirm("Yakin ingin mereset penilaian revisi ini kembali ke status Draf?")) {
												handleAction("admin_draft");
											}
										}}
										className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
									>
										<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
										<span>Reset ke Draf</span>
									</button>
								)}
							</>
						)}
					</div>

					{/* Right: Close Button */}
					<button
						type="button"
						onClick={onClose}
						disabled={actionLoading}
						className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs w-full sm:w-auto"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
