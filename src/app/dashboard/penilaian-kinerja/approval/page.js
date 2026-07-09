"use client";

import { useState, useEffect } from "react";
import moment from "moment";
import { 
	CheckCircle, 
	XCircle, 
	Info, 
	Loader2, 
	Eye, 
	Check, 
	RotateCcw, 
	AlertCircle,
	X,
	MapPin
} from "lucide-react";
import OptimizedPhotoDisplay from "@/components/OptimizedPhotoDisplay";
import { Map, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/mapcn";

export default function SupervisorApprovalPage() {
	const [pendingList, setPendingList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	// Modal State
	const [selectedEval, setSelectedEval] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);
	const [activities, setActivities] = useState([]);
	const [harianDetail, setHarianDetail] = useState(null);
	const [catatan, setCatatan] = useState("");
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		loadPendingQueue();
	}, []);

	const loadPendingQueue = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/penilaian/supervisor/pending");
			if (!res.ok) throw new Error("Gagal mengambil antrean approval");
			const data = await res.json();
			setPendingList(data.data || []);
		} catch (err) {
			console.error(err);
			setErrorMsg(err.message || "Gagal memuat antrean approval");
		} finally {
			setLoading(false);
		}
	};

	const handleReview = async (record) => {
		setSelectedEval(record);
		setCatatan("");
		setModalLoading(true);
		setIsModalOpen(true);
		setHarianDetail(null);
		try {
			const res = await fetch(`/api/penilaian/harian?tanggal=${moment(record.tanggal).format("YYYY-MM-DD")}&pegawai_id=${record.pegawai_id}`);
			if (!res.ok) throw new Error("Gagal mengambil detail kegiatan");
			const data = await res.json();
			setActivities(data.data?.kegiatan || []);
			setHarianDetail(data.data || null);
		} catch (err) {
			console.error(err);
		} finally {
			setModalLoading(false);
		}
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setSelectedEval(null);
		setHarianDetail(null);
		setActivities([]);
	};

	const handleAction = async (actionType) => {
		if (actionType === "revisi" && !catatan.trim()) {
			setErrorMsg("Catatan revisi wajib diisi untuk mengembalikan penilaian");
			return;
		}

		setActionLoading(true);
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/harian/${selectedEval.id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					action: actionType,
					catatan_supervisor: catatan.trim() 
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal memproses penilaian");

			setSuccessMsg(
				actionType === "approve" 
					? "Penilaian harian berhasil disetujui!" 
					: "Penilaian berhasil dikembalikan untuk direvisi!"
			);
			closeModal();
			await loadPendingQueue();
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			<div className="bg-gradient-to-r from-primary-900 to-primary-800 border border-primary-800/20 rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10">
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800">Penilaian Tim (Approval)</h1>
					<p className="text-slate-550 text-sm mt-1">Review dan verifikasi laporan kegiatan harian tim Anda.</p>
				</div>
			</div>

			{errorMsg && (
				<div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 animate-fadeIn">
					<AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm">{errorMsg}</span>
				</div>
			)}

			{successMsg && (
				<div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-3 animate-fadeIn">
					<CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm">{successMsg}</span>
				</div>
			)}

			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
				</div>
			) : pendingList.length === 0 ? (
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm space-y-3">
					<div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
						<CheckCircle className="h-6 w-6" />
					</div>
					<div>
						<h3 className="font-bold text-slate-800 text-base font-figtree">Antrean Bersih</h3>
						<p className="text-slate-400 text-xs mt-1 font-medium">Tidak ada laporan kinerja harian pegawai yang menunggu persetujuan Anda saat ini.</p>
					</div>
				</div>
			) : (
				<div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
					<div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
						<h3 className="font-bold text-slate-800 text-sm font-figtree">Menunggu Persetujuan ({pendingList.length} pengajuan)</h3>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-primary-100 bg-primary-50/50 text-[10px] uppercase font-bold text-slate-600 tracking-wider font-figtree">
									<th className="px-5 py-3.5">Pegawai</th>
									<th className="px-5 py-3.5">Tanggal</th>
									<th className="px-5 py-3.5">Shift</th>
									<th className="px-5 py-3.5 text-center">Skor Absen (40%)</th>
									<th className="px-5 py-3.5 text-center">Skor Kegiatan (60%)</th>
									<th className="px-5 py-3.5 text-center">Skor Total</th>
									<th className="px-5 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-150 text-sm font-medium">
								{pendingList.map((row) => (
									<tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-5 py-4">
											<span className="font-semibold text-slate-800 block">{row.nama}</span>
											<span className="text-xs text-slate-400 block mt-0.5">NIK: {row.nik} — {row.departemen}</span>
										</td>
										<td className="px-5 py-4 text-slate-700 font-semibold font-figtree">
											{moment(row.tanggal).format("DD/MM/YYYY")}
										</td>
										<td className="px-5 py-4">
											<span className="px-2.5 py-0.5 text-xs font-bold rounded bg-primary-50 text-primary-400 border border-primary-100 font-figtree">
												{row.shift_jadwal}
											</span>
										</td>
										<td className="px-5 py-4 text-center font-bold text-slate-700 font-figtree">
											{Math.round(row.skor_absensi)}
										</td>
										<td className="px-5 py-4 text-center font-bold text-slate-700 font-figtree">
											{Math.round(row.skor_kegiatan)}
										</td>
										<td className="px-5 py-4 text-center">
											<span className="text-base font-black text-primary-400 font-figtree">
												{Math.round(row.skor_total)}
											</span>
										</td>
										<td className="px-5 py-4 text-right">
											<button 
												onClick={() => handleReview(row)}
												className="px-3.5 py-1.5 bg-white border border-primary-100 text-primary-400 hover:bg-primary-50 transition-all rounded-xl text-xs font-bold font-figtree inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-primary-200 active:scale-95"
											>
												<Eye className="h-3.5 w-3.5 text-primary-600" />
												Tinjau
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Review Modal */}
			{isModalOpen && selectedEval && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 relative">
						<div className="bg-gradient-to-r from-primary-900 to-primary-800 px-6 py-4 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none"></div>
							<div className="relative z-10">
								<h3 className="font-extrabold text-lg font-figtree text-slate-800">Tinjau Laporan Harian</h3>
								<p className="text-xs text-slate-550 mt-0.5 font-medium">
									{selectedEval.nama} ({selectedEval.nik}) — {moment(selectedEval.tanggal).format("dddd, D MMMM YYYY")}
								</p>
							</div>
							<button onClick={closeModal} className="text-slate-550 hover:text-slate-800 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Content */}
						<div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
							{/* Performance metrics */}
							<div className="grid grid-cols-3 gap-3 bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
								<div className="text-center">
									<span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-figtree">Skor Kegiatan</span>
									<span className="text-lg font-extrabold text-slate-800 mt-1 block font-figtree">{Math.round(selectedEval.skor_kegiatan)}</span>
								</div>
								<div className="text-center">
									<span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-figtree">Skor Absensi</span>
									<span className="text-lg font-extrabold text-slate-800 mt-1 block font-figtree">{Math.round(selectedEval.skor_absensi)}</span>
								</div>
								<div className="text-center bg-primary-900 border border-primary-800/30 rounded-lg p-1.5">
									<span className="text-[9px] text-primary-400 font-bold block uppercase tracking-wider font-figtree">Skor Akhir</span>
									<span className="text-lg font-black text-primary-400 mt-1 block font-figtree">{Math.round(selectedEval.skor_total)}</span>
								</div>
							</div>

							{/* Resolved condition */}
							<div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl font-medium">
								<div>
									<span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Sumber Kehadiran</span>
									<span className="font-semibold text-slate-800 block uppercase mt-0.5">{selectedEval.sumber_absensi}</span>
								</div>
								<div>
									<span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Kondisi Absensi</span>
									<span className="font-semibold text-slate-800 block capitalize mt-0.5">{selectedEval.nilai_kondisi.replace(/_/g, " ")}</span>
								</div>
								<div>
									<span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-figtree">Shift Jadwal</span>
									<span className="font-semibold text-slate-800 block mt-0.5">{selectedEval.shift_jadwal}</span>
								</div>
							</div>

							{/* Late Reason Display */}
							{harianDetail && harianDetail.alasan_terlambat && (
								<div className="p-4 bg-rose-50/60 border border-rose-100/50 rounded-xl space-y-1">
									<span className="text-[9px] text-rose-600 font-bold block uppercase tracking-wider font-figtree">Alasan Terlambat</span>
									<p className="text-xs text-rose-955 leading-relaxed font-semibold break-words">
										{harianDetail.alasan_terlambat}
									</p>
								</div>
							)}

							{/* Bukti Presensi & Lokasi */}
							{harianDetail?.presensi && (harianDetail.presensi.photo || (harianDetail.presensi.latitude && harianDetail.presensi.longitude)) && (
								<div className="space-y-3">
									<h4 className="font-bold text-slate-800 text-sm font-figtree">Bukti Presensi & Lokasi</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Foto Presensi */}
										<div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col items-center justify-center min-h-[220px]">
											<span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-figtree mb-3">Foto Presensi Masuk</span>
											{harianDetail.presensi.photo ? (
												<div className="rounded-xl overflow-hidden border border-slate-100 shadow-xs w-full max-w-[160px] aspect-square relative flex items-center justify-center bg-black">
													<OptimizedPhotoDisplay
														photoUrl={harianDetail.presensi.photo}
														alt="Foto Presensi Masuk"
														width={160}
														height={160}
														priority={false}
														lazy={true}
													/>
												</div>
											) : (
												<div className="text-slate-400 text-xs font-semibold py-10 flex flex-col items-center gap-2">
													<MapPin className="w-8 h-8 text-slate-300" />
													<span>Tidak ada foto presensi</span>
												</div>
											)}
										</div>

										{/* Peta Lokasi */}
										<div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col min-h-[220px]">
											<span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-figtree mb-3">Peta Lokasi</span>
											{harianDetail.presensi.latitude && harianDetail.presensi.longitude ? (
												<div className="w-full flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-inner h-[160px] min-h-[160px] relative">
													<Map
														center={[harianDetail.presensi.longitude, harianDetail.presensi.latitude]}
														zoom={15}
														className="w-full h-full"
													>
														{/* Marker Pegawai */}
														<MapMarker
															longitude={harianDetail.presensi.longitude}
															latitude={harianDetail.presensi.latitude}
														>
															<MarkerContent>
																<div className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white shadow-lg">
																	<MapPin className="w-4 h-4" />
																</div>
															</MarkerContent>
															<MarkerTooltip>Lokasi Pegawai</MarkerTooltip>
														</MapMarker>

														{/* Marker Kantor */}
														<MapMarker
															longitude={parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || "111.9015")}
															latitude={parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || "-7.9797")}
														>
															<MarkerContent>
																<div className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg">
																	<MapPin className="w-4 h-4" />
																</div>
															</MarkerContent>
															<MarkerTooltip>Kantor (RS Bhayangkara Nganjuk)</MarkerTooltip>
														</MapMarker>
													</Map>
												</div>
											) : (
												<div className="text-slate-400 text-xs font-semibold py-10 flex flex-col items-center justify-center gap-2 flex-1">
													<MapPin className="w-8 h-8 text-slate-300" />
													<span>Koordinat lokasi tidak tersedia</span>
												</div>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Activities List */}
							<div className="space-y-3">
								<h4 className="font-bold text-slate-800 text-sm font-figtree">Target Kegiatan Dilaporkan</h4>

								{modalLoading ? (
									<div className="flex justify-center items-center py-10">
										<Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
									</div>
								) : activities.length === 0 ? (
									<p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl font-medium">
										Pegawai tidak melampirkan kegiatan apapun.
									</p>
								) : (
									<div className="space-y-2.5">
										{activities.map((act) => (
											<div 
												key={act.id} 
												className={`p-3.5 border rounded-xl flex items-start gap-3 transition-colors ${
													act.status_selesai === "selesai" 
														? "border-emerald-100 bg-emerald-50/10" 
														: "border-slate-200/60 bg-slate-50/30"
												}`}
											>
												{act.status_selesai === "selesai" ? (
													<span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-emerald-100/60 text-emerald-800 uppercase mt-0.5 shrink-0 font-figtree">
														Selesai
													</span>
												) : (
													<span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-slate-200 text-slate-500 uppercase mt-0.5 shrink-0 font-figtree">
														Belum
													</span>
												)}
												<div className="flex-1 min-w-0">
													<span className={`text-sm font-semibold text-slate-800 block break-words ${act.status_selesai === "selesai" ? "line-through text-slate-400" : ""}`}>{act.judul_kegiatan}</span>
													{act.penjabaran && <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{act.penjabaran}</p>}
													{act.status_selesai === "belum" && act.alasan_belum_selesai && (
														<div className="mt-2 p-2.5 bg-amber-50/60 border border-amber-100/40 rounded-lg">
															<span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block font-figtree">Alasan Belum Selesai</span>
															<p className="text-xs font-semibold text-amber-900 mt-0.5 break-words leading-relaxed">{act.alasan_belum_selesai}</p>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Supervisor note textarea */}
							<div className="space-y-2 pt-4 border-t border-slate-100">
								<label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-figtree">Catatan / Umpan Balik</label>
								<textarea 
									placeholder="Tulis alasan jika mengembalikan draf untuk direvisi pegawai..."
									value={catatan}
									onChange={(e) => setCatatan(e.target.value)}
									rows={3}
									className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 resize-none focus:bg-white transition-all font-medium"
								></textarea>
							</div>
						</div>

						{/* Footer Actions */}
						<div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
							<button 
								onClick={() => handleAction("revisi")}
								disabled={actionLoading || modalLoading || !catatan.trim()}
								className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 text-rose-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
							>
								{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
								Kembalikan (Minta Revisi)
							</button>

							<div className="flex gap-2 justify-end w-full sm:w-auto">
								<button 
									onClick={closeModal}
									className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer active:scale-95"
								>
									Batal
								</button>
								<button 
									onClick={() => handleAction("approve")}
									disabled={actionLoading || modalLoading}
									className="px-5 py-2 bg-primary-600 hover:bg-primary-800 disabled:bg-primary-300 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow-md shadow-primary-500/10 cursor-pointer active:scale-95 hover:-translate-y-[1px]"
								>
									{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
									Setujui Laporan
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
