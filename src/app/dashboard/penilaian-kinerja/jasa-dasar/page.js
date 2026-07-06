"use client";

import { useState, useEffect } from "react";
import moment from "moment";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { 
	Plus, 
	Edit, 
	Trash2, 
	Loader2, 
	AlertCircle, 
	CheckCircle, 
	Coins, 
	X,
	Info,
	Search
} from "lucide-react";

export default function JasaDasarPegawaiPage() {
	const [jasaList, setJasaList] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	// Form Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
	const [selectedId, setSelectedId] = useState(null);
	
	const [pegawaiId, setPegawaiId] = useState("");
	const [nominal, setNominal] = useState("");
	const [berlakuMulai, setBerlakuMulai] = useState(moment().format("YYYY-MM-DD"));
	const [berlakuSampai, setBerlakuSampai] = useState("");
	const [keterangan, setKeterangan] = useState("");
	const [saving, setSaving] = useState(false);
	
	// Search filter
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		loadJasaDasarData();
		loadEmployees();
	}, []);

	const loadJasaDasarData = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/penilaian/jasa-dasar");
			if (!res.ok) throw new Error("Gagal mengambil data jasa dasar");
			const data = await res.json();
			setJasaList(data.data || []);
		} catch (err) {
			console.error(err);
			setErrorMsg(err.message);
		} finally {
			setLoading(false);
		}
	};

	const loadEmployees = async () => {
		try {
			const res = await fetch("/api/pegawai");
			if (res.ok) {
				const data = await res.json();
				setEmployees(data.data || []);
			}
		} catch (err) {
			console.error("Gagal memuat pegawai:", err);
		}
	};

	const handleOpenAdd = () => {
		setModalMode("add");
		setSelectedId(null);
		setPegawaiId("");
		setNominal("");
		setBerlakuMulai(moment().format("YYYY-MM-DD"));
		setBerlakuSampai("");
		setKeterangan("");
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item) => {
		setModalMode("edit");
		setSelectedId(item.id);
		setPegawaiId(item.pegawai_id);
		setNominal(item.nominal_jasa_dasar);
		setBerlakuMulai(moment(item.berlaku_mulai).format("YYYY-MM-DD"));
		setBerlakuSampai(item.berlaku_sampai ? moment(item.berlaku_sampai).format("YYYY-MM-DD") : "");
		setKeterangan(item.keterangan || "");
		setIsModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!pegawaiId || !nominal || !berlakuMulai) {
			setErrorMsg("Semua kolom wajib diisi kecuali berlaku sampai & keterangan");
			return;
		}

		setSaving(true);
		setErrorMsg("");
		setSuccessMsg("");
		
		const payload = {
			pegawai_id: Number(pegawaiId),
			nominal_jasa_dasar: Number(nominal),
			berlaku_mulai: berlakuMulai,
			berlaku_sampai: berlakuSampai || null,
			keterangan: keterangan || null
		};

		try {
			let res;
			if (modalMode === "add") {
				res = await fetch("/api/penilaian/jasa-dasar", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch("/api/penilaian/jasa-dasar", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: selectedId, ...payload })
				});
			}

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");

			setSuccessMsg(modalMode === "add" ? "Jasa dasar berhasil ditambahkan!" : "Jasa dasar berhasil diperbarui!");
			setIsModalOpen(false);
			await loadJasaDasarData();
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Apakah Anda yakin ingin menghapus konfigurasi jasa dasar ini?")) return;
		
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/jasa-dasar?id=${id}`, {
				method: "DELETE"
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menghapus data");

			setSuccessMsg("Konfigurasi jasa dasar berhasil dihapus!");
			await loadJasaDasarData();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	// Filter data
	const filteredList = jasaList.filter(item => 
		(item.nama_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
		(item.nik_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
		(item.nama_departemen || "").toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Format employees for SearchableSelect
	const employeeOptions = employees.map((emp) => ({
		value: emp.id,
		label: emp.label,
		sublabel: `NIK: ${emp.value} — ${emp.nama_departemen || ""}`
	}));

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			{/* Header */}
			<div className="bg-gradient-to-r from-primary-900 to-primary-800 border border-primary-800/20 rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10">
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800">Jasa Dasar Pegawai</h1>
					<p className="text-slate-550 text-sm mt-1">Konfigurasi nominal jasa dasar per pegawai sebagai acuan rekap bulanan.</p>
				</div>
				<button 
					onClick={handleOpenAdd}
					className="relative z-10 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-all cursor-pointer hover:scale-105 active:scale-95"
				>
					<Plus className="h-4 w-4 text-primary-600" />
					Tambah Jasa Dasar
				</button>
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

			{/* Search Filter bar */}
			<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-all duration-200 hover:shadow-md">
				<Search className="h-4 w-4 text-slate-400 shrink-0" />
				<input 
					type="text" 
					placeholder="Cari berdasarkan nama, NIK, atau departemen pegawai..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full text-sm text-slate-700 bg-transparent focus:outline-none placeholder-slate-400 font-medium"
				/>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
				</div>
			) : filteredList.length === 0 ? (
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm text-slate-400 font-medium">
					Tidak ada konfigurasi jasa dasar ditemukan.
				</div>
			) : (
				<div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-primary-100 bg-primary-50/50 text-[10px] uppercase font-bold text-slate-600 tracking-wider font-figtree">
									<th className="px-5 py-3.5">Pegawai</th>
									<th className="px-5 py-3.5 text-right">Nominal Jasa Dasar</th>
									<th className="px-5 py-3.5">Mulai Berlaku</th>
									<th className="px-5 py-3.5">Berakhir Berlaku</th>
									<th className="px-5 py-3.5">Keterangan</th>
									<th className="px-5 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-150 text-xs text-slate-700 font-medium">
								{filteredList.map((row) => (
									<tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-5 py-4">
											<span className="font-bold text-slate-800 block text-sm">{row.nama_pegawai}</span>
											<span className="text-[10px] text-slate-400 block mt-0.5">NIK: {row.nik_pegawai} — {row.nama_departemen}</span>
										</td>
										<td className="px-5 py-4 text-right font-extrabold text-primary-400 text-sm">
											Rp {Number(row.nominal_jasa_dasar).toLocaleString("id-ID")}
										</td>
										<td className="px-5 py-4 font-semibold text-slate-600">
											{moment(row.berlaku_mulai).format("DD/MM/YYYY")}
										</td>
										<td className="px-5 py-4 text-slate-500 font-semibold">
											{row.berlaku_sampai ? moment(row.berlaku_sampai).format("DD/MM/YYYY") : "Masih Berlaku"}
										</td>
										<td className="px-5 py-4 text-slate-500 max-w-xs truncate font-medium">
											{row.keterangan || "-"}
										</td>
										<td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
											<button 
												onClick={() => handleOpenEdit(row)}
												className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer active:scale-95"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button 
												onClick={() => handleDelete(row.id)}
												className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer active:scale-95"
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
			)}

			{/* Form Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
						{/* Header */}
						<div className="bg-gradient-to-r from-primary-900 to-primary-800 px-6 py-4 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none"></div>
							<h3 className="font-extrabold text-lg font-figtree relative z-10 text-slate-800">
								{modalMode === "add" ? "Tambah Jasa Dasar Baru" : "Edit Jasa Dasar Pegawai"}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-550 hover:text-slate-800 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Pilih Pegawai</label>
									<SearchableSelect 
										options={employeeOptions}
										value={pegawaiId}
										onChange={setPegawaiId}
										disabled={modalMode === "edit"}
										placeholder="Pilih Pegawai..."
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Nominal Jasa Dasar (Rp)</label>
									<input 
										type="number"
										value={nominal}
										onChange={(e) => setNominal(e.target.value)}
										placeholder="Contoh: 3000000"
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-750 font-semibold"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Mulai Berlaku</label>
										<input 
											type="date"
											value={berlakuMulai}
											onChange={(e) => setBerlakuMulai(e.target.value)}
											required
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-750 font-semibold"
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Berakhir Berlaku</label>
										<input 
											type="date"
											value={berlakuSampai}
											onChange={(e) => setBerlakuSampai(e.target.value)}
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-750 font-semibold"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Keterangan</label>
									<input 
										type="text"
										value={keterangan}
										onChange={(e) => setKeterangan(e.target.value)}
										placeholder="Catatan tambahan"
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-750 font-semibold"
									/>
								</div>
							</div>

							{/* Footer */}
							<div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
								<button 
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded-xl text-xs transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button 
									type="submit"
									disabled={saving}
									className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-200 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
								>
									{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
									Simpan Konfigurasi
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
