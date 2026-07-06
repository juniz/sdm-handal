"use client";

import { useState, useEffect } from "react";
import { 
	Plus, 
	Edit, 
	Trash2, 
	Loader2, 
	AlertCircle, 
	CheckCircle, 
	SlidersHorizontal, 
	X,
	Info,
	Power
} from "lucide-react";

export default function ParameterPenilaianPage() {
	const [paramList, setParamList] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	// Form Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
	const [selectedId, setSelectedId] = useState(null);
	
	const [kode, setKode] = useState("");
	const [namaParameter, setNamaParameter] = useState("");
	const [kategori, setKategori] = useState("absensi"); // "kegiatan" or "absensi"
	const [bobotPersen, setBobotPersen] = useState("");
	const [nilaiKondisi, setNilaiKondisi] = useState("");
	const [nilaiSkor, setNilaiSkor] = useState("");
	const [deskripsi, setDeskripsi] = useState("");
	const [isAktif, setIsAktif] = useState(1);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadParameters();
	}, []);

	const loadParameters = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/penilaian/parameter");
			if (!res.ok) throw new Error("Gagal mengambil data parameter");
			const data = await res.json();
			setParamList(data.data || []);
		} catch (err) {
			console.error(err);
			setErrorMsg(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenAdd = () => {
		setModalMode("add");
		setSelectedId(null);
		setKode("");
		setNamaParameter("");
		setKategori("absensi");
		setBobotPersen("40");
		setNilaiKondisi("");
		setNilaiSkor("");
		setDeskripsi("");
		setIsAktif(1);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item) => {
		setModalMode("edit");
		setSelectedId(item.id);
		setKode(item.kode);
		setNamaParameter(item.nama_parameter);
		setKategori(item.kategori);
		setBobotPersen(item.bobot_persen);
		setNilaiKondisi(item.nilai_kondisi || "");
		setNilaiSkor(item.nilai_skor !== null ? item.nilai_skor : "");
		setDeskripsi(item.deskripsi || "");
		setIsAktif(item.is_aktif);
		setIsModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!kode || !namaParameter || !kategori || bobotPersen === "") {
			setErrorMsg("Kode, nama parameter, kategori, dan bobot wajib diisi");
			return;
		}

		setSaving(true);
		setErrorMsg("");
		setSuccessMsg("");
		
		const payload = {
			kode,
			nama_parameter: namaParameter,
			kategori,
			bobot_persen: Number(bobotPersen),
			nilai_kondisi: nilaiKondisi || null,
			nilai_skor: nilaiSkor !== "" ? Number(nilaiSkor) : null,
			deskripsi: deskripsi || null,
			is_aktif: isAktif
		};

		try {
			let res;
			if (modalMode === "add") {
				res = await fetch("/api/penilaian/parameter", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch("/api/penilaian/parameter", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: selectedId, ...payload })
				});
			}

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");

			setSuccessMsg(modalMode === "add" ? "Parameter berhasil ditambahkan!" : "Parameter berhasil diperbarui!");
			setIsModalOpen(false);
			await loadParameters();
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleToggleActive = async (item) => {
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch("/api/penilaian/parameter", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					id: item.id, 
					nama_parameter: item.nama_parameter,
					bobot_persen: item.bobot_persen,
					nilai_kondisi: item.nilai_kondisi,
					nilai_skor: item.nilai_skor,
					deskripsi: item.deskripsi,
					is_aktif: item.is_aktif === 1 ? 0 : 1 
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal merubah status");

			setSuccessMsg("Status aktif parameter berhasil diubah!");
			await loadParameters();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Apakah Anda yakin ingin menghapus parameter penilaian ini?")) return;
		
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/parameter?id=${id}`, {
				method: "DELETE"
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menghapus parameter");

			setSuccessMsg("Parameter penilaian berhasil dihapus!");
			await loadParameters();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			<div className="relative bg-primary-900 border border-primary-800/40 rounded-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
				{/* Decorative radial glow */}
				<div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-700/10 rounded-full blur-3xl pointer-events-none" />
				<div className="relative z-10">
					<div className="flex items-center gap-2 mb-1.5">
						<SlidersHorizontal className="h-4 w-4 text-primary-400" />
						<span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest font-mono">Pengaturan Sistem</span>
					</div>
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800">Parameter Penilaian</h1>
					<p className="text-slate-500 text-sm mt-1 font-medium font-noto-sans">Konfigurasi bobot tertimbang dan skor per kondisi cuti, izin, atau presensi.</p>
				</div>
				<button 
					onClick={handleOpenAdd}
					className="relative z-10 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow active:scale-95 transition-all duration-150"
				>
					<Plus className="h-4 w-4" />
					Tambah Parameter
				</button>
			</div>

			{errorMsg && (
				<div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
					<AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm leading-relaxed">{errorMsg}</span>
				</div>
			)}

			{successMsg && (
				<div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
					<CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm leading-relaxed">{successMsg}</span>
				</div>
			)}

			{loading ? (
				<div className="flex flex-col justify-center items-center py-24 gap-3">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
					<span className="text-sm text-slate-400 font-medium animate-pulse">Memuat parameter…</span>
				</div>
			) : paramList.length === 0 ? (
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
					<div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<SlidersHorizontal className="h-8 w-8" />
					</div>
					<h3 className="text-lg font-bold text-slate-800 font-figtree mb-1">Parameter Kosong</h3>
					<p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
						Tidak ada parameter penilaian ditemukan. Silakan tambahkan parameter baru untuk memulai konfigurasi.
					</p>
				</div>
			) : (
				<div className="space-y-6">
					{/* Mobile Card Layout */}
					<div className="grid grid-cols-1 gap-4 md:hidden">
						{paramList.map((row) => (
							<div key={row.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-650 border border-slate-200/60 uppercase">
											{row.kode}
										</span>
										<h3 className="font-bold text-slate-800 text-sm pt-1 leading-snug">{row.nama_parameter}</h3>
										{row.deskripsi && <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{row.deskripsi}</p>}
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										{row.kategori === "kegiatan" ? (
											<span className="px-2 py-0.5 text-[9px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-100 uppercase">
												Kegiatan
											</span>
										) : (
											<span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
												Absensi
											</span>
										)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 bg-slate-50/60 rounded-xl px-4 text-xs">
									<div>
										<span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Bobot</span>
										<span className="font-extrabold text-slate-700 text-sm">{row.bobot_persen}%</span>
									</div>
									<div>
										<span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Kondisi / Skor</span>
										<span className="font-extrabold text-slate-700 text-sm capitalize">
											{row.nilai_kondisi ? `${row.nilai_kondisi.replace(/_/g, " ")} (${row.nilai_skor !== null ? Math.round(row.nilai_skor) : 0})` : "-"}
										</span>
									</div>
								</div>

								<div className="flex justify-between items-center pt-1">
									<div className="flex items-center gap-2">
										<span className="text-[11px] font-semibold text-slate-400">Status:</span>
										<button 
											onClick={() => handleToggleActive(row)}
											className={`p-2 rounded-xl transition-all border inline-flex items-center gap-1.5 text-[11px] font-bold ${
												row.is_aktif === 1 
													? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" 
													: "text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100"
											}`}
										>
											<Power className="h-3.5 w-3.5" />
											<span>{row.is_aktif === 1 ? "Aktif" : "Non-Aktif"}</span>
										</button>
									</div>
									<div className="flex gap-2">
										<button 
											onClick={() => handleOpenEdit(row)}
											className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center justify-center"
											aria-label="Edit parameter"
										>
											<Edit className="h-4 w-4" />
										</button>
										<button 
											onClick={() => handleDelete(row.id)}
											className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-100 transition-all flex items-center justify-center"
											aria-label="Delete parameter"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Desktop Table View */}
					<div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
										<th className="px-6 py-4">Kode</th>
										<th className="px-6 py-4">Nama Parameter</th>
										<th className="px-6 py-4">Kategori</th>
										<th className="px-6 py-4 text-center">Bobot</th>
										<th className="px-6 py-4">Kondisi Absensi</th>
										<th className="px-6 py-4 text-center">Skor Kehadiran</th>
										<th className="px-6 py-4 text-center">Status</th>
										<th className="px-6 py-4 text-right">Aksi</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-xs text-slate-700">
									{paramList.map((row) => (
										<tr key={row.id} className="hover:bg-slate-50/40 transition-colors duration-150">
											<td className="px-6 py-4 font-mono font-bold text-slate-800">
												<span className="px-2 py-0.5 rounded bg-slate-100 text-slate-650 border border-slate-200/60 uppercase">
													{row.kode}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className="font-bold text-slate-800 block text-sm leading-tight">{row.nama_parameter}</span>
												{row.deskripsi && <span className="text-[10px] text-slate-400 block mt-1 font-medium">{row.deskripsi}</span>}
											</td>
											<td className="px-6 py-4">
												{row.kategori === "kegiatan" ? (
													<span className="px-2 py-0.5 text-[9px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-100 uppercase">
														Kegiatan
													</span>
												) : (
													<span className="px-2 py-0.5 text-[9px] font-bold rounded bg-primary-50 text-primary-400 border border-primary-100 uppercase">
														Absensi
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-center font-extrabold text-slate-750 text-sm">
												{row.bobot_persen}%
											</td>
											<td className="px-6 py-4 text-slate-650 capitalize font-semibold">
												{row.nilai_kondisi ? row.nilai_kondisi.replace(/_/g, " ") : "-"}
											</td>
											<td className="px-6 py-4 text-center font-extrabold text-slate-800 text-sm">
												{row.nilai_skor !== null ? Math.round(row.nilai_skor) : "-"}
											</td>
											<td className="px-6 py-4 text-center">
												<button 
													onClick={() => handleToggleActive(row)}
													className={`p-1.5 rounded-lg transition-all border ${
														row.is_aktif === 1 
															? "text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100" 
															: "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
													}`}
													title={row.is_aktif === 1 ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
												>
													<Power className="h-3.5 w-3.5" />
												</button>
											</td>
											<td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
												<button 
													onClick={() => handleOpenEdit(row)}
													className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-all inline-flex items-center justify-center border border-transparent hover:border-slate-200"
												>
													<Edit className="h-4 w-4" />
												</button>
												<button 
													onClick={() => handleDelete(row.id)}
													className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-flex items-center justify-center border border-transparent hover:border-rose-100"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* Form Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
						{/* Header */}
						<div className="bg-primary-900 px-6 py-5 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200/80">
							{/* Background radial glow */}
							<div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-700/10 rounded-full blur-2xl pointer-events-none" />
							<h3 className="font-extrabold text-base relative z-10 font-figtree tracking-tight text-slate-800">
								{modalMode === "add" ? "Tambah Parameter Baru" : "Edit Parameter Penilaian"}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-200/50 rounded-lg transition-all relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kode Parameter</label>
									<input 
										type="text"
										value={kode}
										onChange={(e) => setKode(e.target.value.toUpperCase())}
										placeholder="Contoh: ABN_TEPAT, CUT_SAKIT"
										disabled={modalMode === "edit"}
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 font-mono disabled:opacity-60 font-semibold"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Parameter</label>
									<input 
										type="text"
										value={namaParameter}
										onChange={(e) => setNamaParameter(e.target.value)}
										placeholder="Contoh: Hadir Tepat Waktu"
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 font-semibold"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kategori</label>
										<select 
											value={kategori}
											onChange={(e) => {
												setKategori(e.target.value);
												if (e.target.value === "kegiatan") {
													setBobotPersen("60");
													setNilaiKondisi("");
													setNilaiSkor("");
												} else {
													setBobotPersen("40");
												}
											}}
											disabled={modalMode === "edit"}
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 font-bold"
										>
											<option value="absensi">Absensi</option>
											<option value="kegiatan">Kegiatan</option>
										</select>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bobot (%)</label>
										<input 
											type="number"
											value={bobotPersen}
											onChange={(e) => setBobotPersen(e.target.value)}
											required
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 font-semibold"
										/>
									</div>
								</div>

								{kategori === "absensi" && (
									<div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
										<div className="space-y-1.5">
											<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kode Kondisi</label>
											<input 
												type="text"
												value={nilaiKondisi}
												onChange={(e) => setNilaiKondisi(e.target.value.toLowerCase())}
												placeholder="Contoh: tepat_waktu, sakit"
												required={kategori === "absensi"}
												className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-750 font-mono font-semibold"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Skor Kehadiran</label>
											<input 
												type="number"
												value={nilaiSkor}
												onChange={(e) => setNilaiSkor(e.target.value)}
												placeholder="Contoh: 100"
												required={kategori === "absensi"}
												className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 font-semibold"
											/>
										</div>
									</div>
								)}

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Deskripsi</label>
									<textarea 
										value={deskripsi}
										onChange={(e) => setDeskripsi(e.target.value)}
										placeholder="Catatan deskripsi singkat mengenai parameter"
										rows={2}
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 resize-none font-medium"
									></textarea>
								</div>

								{modalMode === "edit" && (
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status Aktif</label>
										<select 
											value={isAktif}
											onChange={(e) => setIsAktif(Number(e.target.value))}
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 focus:bg-white text-sm text-slate-700 font-bold"
										>
											<option value={1}>Aktif</option>
											<option value={0}>Non-Aktif</option>
										</select>
									</div>
								)}
							</div>

							{/* Footer */}
							<div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
								<button 
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold rounded-xl text-xs transition-colors"
								>
									Batal
								</button>
								<button 
									type="submit"
									disabled={saving}
									className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs transition-all shadow active:scale-95 inline-flex items-center gap-1.5"
								>
									{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
									Simpan Parameter
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
