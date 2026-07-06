"use client";

import { useState, useEffect } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import moment from "moment";
import { 
	Plus, 
	Edit, 
	Trash2, 
	Loader2, 
	AlertCircle, 
	CheckCircle, 
	Users, 
	X,
	GitMerge,
	Search,
	Power,
	UserCheck
} from "lucide-react";

export default function SupervisorMappingPage() {
	const [mappingList, setMappingList] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [bidangList, setBidangList] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	// Form Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
	const [selectedId, setSelectedId] = useState(null);
	
	const [tipeRelasi, setTipeRelasi] = useState("unit"); // "unit" or "personal"
	const [pegawaiId, setPegawaiId] = useState("");
	const [supervisorId, setSupervisorId] = useState("");
	const [tipeUnit, setTipeUnit] = useState("departemen"); // "departemen" or "bidang"
	const [kodeUnit, setKodeUnit] = useState("");
	const [berlakuMulai, setBerlakuMulai] = useState(moment().format("YYYY-MM-DD"));
	const [berlakuSampai, setBerlakuSampai] = useState("");
	const [isAktif, setIsAktif] = useState(1);
	const [saving, setSaving] = useState(false);
	
	// Search filter
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		loadMappings();
		loadEmployees();
		loadDepartments();
		loadBidang();
	}, []);

	const loadMappings = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/penilaian/mapping");
			if (!res.ok) throw new Error("Gagal mengambil data mapping");
			const data = await res.json();
			setMappingList(data.data || []);
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

	const loadDepartments = async () => {
		try {
			const res = await fetch("/api/departemen");
			if (res.ok) {
				const data = await res.json();
				setDepartments(data.data || []);
			}
		} catch (err) {
			console.error("Gagal memuat departemen:", err);
		}
	};

	const loadBidang = async () => {
		try {
			const res = await fetch("/api/bidang");
			if (res.ok) {
				const data = await res.json();
				setBidangList(data.data || []);
			}
		} catch (err) {
			console.error("Gagal memuat bidang:", err);
		}
	};

	const handleOpenAdd = () => {
		setModalMode("add");
		setSelectedId(null);
		setTipeRelasi("unit");
		setPegawaiId("");
		setSupervisorId("");
		setTipeUnit("departemen");
		setKodeUnit("");
		setBerlakuMulai(moment().format("YYYY-MM-DD"));
		setBerlakuSampai("");
		setIsAktif(1);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item) => {
		setModalMode("edit");
		setSelectedId(item.id);
		setTipeRelasi(item.tipe_relasi);
		setPegawaiId(item.pegawai_id || "");
		setSupervisorId(item.supervisor_id);
		setTipeUnit(item.tipe_unit || "departemen");
		setKodeUnit(item.kode_unit || "");
		setBerlakuMulai(moment(item.berlaku_mulai).format("YYYY-MM-DD"));
		setBerlakuSampai(item.berlaku_sampai ? moment(item.berlaku_sampai).format("YYYY-MM-DD") : "");
		setIsAktif(item.is_aktif);
		setIsModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!tipeRelasi || !supervisorId || !berlakuMulai) {
			setErrorMsg("Semua kolom wajib diisi kecuali tanggal berakhir");
			return;
		}

		if (tipeRelasi === "personal" && !pegawaiId) {
			setErrorMsg("Pegawai wajib dipilih untuk tipe relasi personal");
			return;
		}

		if (tipeRelasi === "unit" && !kodeUnit) {
			setErrorMsg("Kode unit wajib dipilih untuk tipe relasi unit");
			return;
		}

		// Prevent self-assessment in mapping
		if (tipeRelasi === "personal" && Number(pegawaiId) === Number(supervisorId)) {
			setErrorMsg("Pegawai dan supervisor tidak boleh orang yang sama");
			return;
		}

		setSaving(true);
		setErrorMsg("");
		setSuccessMsg("");
		
		const payload = {
			tipe_relasi: tipeRelasi,
			pegawai_id: tipeRelasi === "personal" ? Number(pegawaiId) : null,
			supervisor_id: Number(supervisorId),
			tipe_unit: tipeRelasi === "unit" ? tipeUnit : null,
			kode_unit: tipeRelasi === "unit" ? kodeUnit : null,
			berlaku_mulai: berlakuMulai,
			berlaku_sampai: berlakuSampai || null
		};

		try {
			let res;
			if (modalMode === "add") {
				res = await fetch("/api/penilaian/mapping", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch("/api/penilaian/mapping", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: selectedId, is_aktif: isAktif, ...payload })
				});
			}

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");

			setSuccessMsg(modalMode === "add" ? "Mapping supervisor berhasil ditambahkan!" : "Mapping supervisor berhasil diperbarui!");
			setIsModalOpen(false);
			await loadMappings();
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleToggleActive = async (id, currentStatus) => {
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch("/api/penilaian/mapping", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: id, is_aktif: currentStatus === 1 ? 0 : 1 })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal mengubah status");

			setSuccessMsg("Status aktif mapping berhasil diubah!");
			await loadMappings();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Apakah Anda yakin ingin menghapus mapping supervisor ini?")) return;
		
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/mapping?id=${id}`, {
				method: "DELETE"
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menghapus data");

			setSuccessMsg("Mapping supervisor berhasil dihapus!");
			await loadMappings();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	// Filter data
	const filteredList = mappingList.filter(item => 
		(item.nama_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
		(item.nik_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
		(item.nama_supervisor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
		(item.nik_supervisor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
		(item.kode_unit || "").toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Formatted options for searchable select
	const employeeOptions = employees.map((emp) => ({
		value: emp.id,
		label: emp.label || emp.nama,
		sublabel: `NIK: ${emp.value} — ${emp.nama_departemen || ""}`
	}));

	const unitOptions = tipeUnit === "departemen"
		? departments.map(d => ({ value: d.dep_id, label: d.nama }))
		: bidangList.map(b => ({ value: b.nama, label: b.nama }));


	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			<div className="bg-gradient-to-r from-primary-900 to-primary-800 border border-primary-800/20 rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10">
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800">Mapping Supervisor</h1>
					<p className="text-slate-550 text-sm mt-1 font-medium">Kelola relasi penilai kinerja pegawai berbasis unit departemen atau personal hierarki.</p>
				</div>
				<button 
					onClick={handleOpenAdd}
					className="relative z-10 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow transition-all duration-200 hover:-translate-y-[1px] cursor-pointer active:scale-95"
				>
					<Plus className="h-4 w-4" />
					Tambah Mapping
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
			<div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex items-center gap-3 transition-all duration-200 hover:shadow-md">
				<Search className="h-5 w-5 text-slate-400 shrink-0" />
				<input 
					type="text" 
					placeholder="Cari berdasarkan nama pegawai, supervisor, NIK, atau kode unit..."
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
					Tidak ada mapping supervisor ditemukan.
				</div>
			) : (
				<div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-primary-100 bg-primary-50/50 text-[10px] uppercase font-bold text-slate-600 tracking-wider font-figtree">
									<th className="px-5 py-3.5">Tipe Relasi</th>
									<th className="px-5 py-3.5">Pegawai / Unit dinilai</th>
									<th className="px-5 py-3.5">Supervisor (Evaluator)</th>
									<th className="px-5 py-3.5">Mulai Berlaku</th>
									<th className="px-5 py-3.5">Berakhir Berlaku</th>
									<th className="px-5 py-3.5 text-center">Status</th>
									<th className="px-5 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-150 text-xs text-slate-700 font-medium">
								{filteredList.map((row) => (
									<tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-5 py-4">
											{row.tipe_relasi === "personal" ? (
												<span className="px-2.5 py-1 text-[9px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wide font-figtree">
													Personal
												</span>
											) : (
												<span className="px-2.5 py-1 text-[9px] font-bold rounded-md bg-primary-50 text-primary-400 border border-primary-100 uppercase tracking-wide font-figtree">
													Unit ({row.tipe_unit})
												</span>
											)}
										</td>
										<td className="px-5 py-4">
											{row.tipe_relasi === "personal" ? (
												<>
													<span className="font-semibold text-slate-800 block text-sm">{row.nama_pegawai}</span>
													<span className="text-[10px] text-slate-400 block mt-0.5">NIK: {row.nik_pegawai}</span>
												</>
											) : (
												<span className="font-semibold text-slate-800 block text-sm font-figtree">
													Kode Unit: {row.kode_unit}
												</span>
											)}
										</td>
										<td className="px-5 py-4">
											<span className="font-semibold text-slate-800 block text-sm">{row.nama_supervisor}</span>
											<span className="text-[10px] text-slate-400 block mt-0.5">NIK: {row.nik_supervisor}</span>
										</td>
										<td className="px-5 py-4 font-bold text-slate-600 font-figtree">
											{moment(row.berlaku_mulai).format("DD/MM/YYYY")}
										</td>
										<td className="px-5 py-4 text-slate-500 font-medium">
											{row.berlaku_sampai ? moment(row.berlaku_sampai).format("DD/MM/YYYY") : "Aktif Seterusnya"}
										</td>
										<td className="px-5 py-4 text-center">
											<button 
												onClick={() => handleToggleActive(row.id, row.is_aktif)}
												className={`p-1.5 rounded-xl transition-all border cursor-pointer active:scale-95 ${
													row.is_aktif === 1 
														? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/60" 
														: "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
												}`}
											>
												<Power className="h-3.5 w-3.5" />
											</button>
										</td>
										<td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
											<button 
												onClick={() => handleOpenEdit(row)}
												className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button 
												onClick={() => handleDelete(row.id)}
												className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
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
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
						<div className="bg-gradient-to-r from-primary-900 to-primary-800 px-6 py-4 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none"></div>
							<h3 className="font-extrabold text-lg font-figtree relative z-10 text-slate-800">
								{modalMode === "add" ? "Tambah Mapping Baru" : "Edit Mapping Supervisor"}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-550 hover:text-slate-850 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto font-medium">
								<div className="space-y-2">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Tipe Relasi</label>
									<div className="flex gap-4">
										<label className="flex items-center gap-2 text-sm text-slate-700 font-bold cursor-pointer">
											<input 
												type="radio" 
												name="tipe_relasi"
												value="unit"
												checked={tipeRelasi === "unit"}
												onChange={(e) => setTipeRelasi(e.target.value)}
												disabled={modalMode === "edit"}
												className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
											/>
											Unit (Departemen/Bidang)
										</label>
										<label className="flex items-center gap-2 text-sm text-slate-700 font-bold cursor-pointer">
											<input 
												type="radio" 
												name="tipe_relasi"
												value="personal"
												checked={tipeRelasi === "personal"}
												onChange={(e) => setTipeRelasi(e.target.value)}
												disabled={modalMode === "edit"}
												className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
											/>
											Personal (Hierarki Atasan)
										</label>
									</div>
								</div>

								{/* Personal Employee Selector */}
								{tipeRelasi === "personal" && (
									<div className="space-y-1.5">
										<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Pilih Pegawai dinilai</label>
										<SearchableSelect 
											options={employeeOptions}
											value={pegawaiId}
											onChange={setPegawaiId}
											disabled={modalMode === "edit"}
											placeholder="Pilih Pegawai dinilai..."
										/>
									</div>
								)}

								{/* Unit Selector */}
								{tipeRelasi === "unit" && (
									<>
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Tipe Unit</label>
											<select 
												value={tipeUnit}
												onChange={(e) => {
													setTipeUnit(e.target.value);
													setKodeUnit("");
												}}
												disabled={modalMode === "edit"}
												required={tipeRelasi === "unit"}
												className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-700 font-semibold"
											>
												<option value="departemen">Departemen</option>
												<option value="bidang">Bidang</option>
											</select>
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Pilih Unit</label>
											<SearchableSelect 
												options={unitOptions}
												value={kodeUnit}
												onChange={setKodeUnit}
												disabled={modalMode === "edit"}
												placeholder="Pilih Unit..."
											/>
										</div>
									</>
								)}

								{/* Supervisor Selector */}
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Pilih Supervisor (Evaluator)</label>
									<SearchableSelect 
										options={employeeOptions}
										value={supervisorId}
										onChange={setSupervisorId}
										placeholder="Pilih Supervisor..."
									/>
								</div>

								{/* Validity Dates */}
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Mulai Berlaku</label>
									<input 
										type="date"
										value={berlakuMulai}
										onChange={(e) => setBerlakuMulai(e.target.value)}
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-700 font-semibold shadow-xs"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Berakhir Berlaku</label>
									<input 
										type="date"
										value={berlakuSampai}
										onChange={(e) => setBerlakuSampai(e.target.value)}
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-700 font-semibold shadow-xs"
									/>
								</div>

								{modalMode === "edit" && (
									<div className="space-y-1.5">
										<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-figtree">Status Aktif</label>
										<select 
											value={isAktif}
											onChange={(e) => setIsAktif(Number(e.target.value))}
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-700 font-semibold"
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
									className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer active:scale-95"
								>
									Batal
								</button>
								<button 
									type="submit"
									disabled={saving}
									className="px-5 py-2.5 bg-primary-600 hover:bg-primary-800 disabled:bg-primary-300 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow-md shadow-primary-500/10 cursor-pointer active:scale-95 hover:-translate-y-[1px]"
								>
									{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
									Simpan Mapping
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
