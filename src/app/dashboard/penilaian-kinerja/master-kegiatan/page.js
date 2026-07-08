"use client";

import { useState, useEffect } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { 
	Plus, 
	Edit, 
	Trash2, 
	Loader2, 
	AlertCircle, 
	CheckCircle, 
	ClipboardList, 
	X,
	Info,
	Power,
	Search,
	Filter
} from "lucide-react";

export default function MasterKegiatanKerjaPage() {
	const [masterList, setMasterList] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const isIT = userProfile && (userProfile.departemen === "IT" || userProfile.departemen_name?.toLowerCase().includes("it"));

	// Filter State
	const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Form Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
	const [selectedId, setSelectedId] = useState(null);
	
	const [depId, setDepId] = useState(""); // "" represents global (NULL)
	const [namaKegiatan, setNamaKegiatan] = useState("");
	const [deskripsi, setDeskripsi] = useState("");
	const [prioritas, setPrioritas] = useState("sedang");
	const [isAktif, setIsAktif] = useState(1);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadMasterList();
		loadDepartments();
		loadUserProfile();
	}, []);

	const loadUserProfile = async () => {
		try {
			const res = await fetch("/api/auth/user");
			if (res.ok) {
				const data = await res.json();
				if (data.user) {
					setUserProfile(data.user);
				}
			}
		} catch (err) {
			console.error("Gagal memuat profil pengguna:", err);
		}
	};

	const loadMasterList = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/penilaian/master-kegiatan");
			if (!res.ok) throw new Error("Gagal mengambil template kegiatan");
			const data = await res.json();
			setMasterList(data.data || []);
		} catch (err) {
			console.error(err);
			setErrorMsg(err.message);
		} finally {
			setLoading(false);
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

	const handleOpenAdd = () => {
		setModalMode("add");
		setSelectedId(null);
		setDepId(isIT ? "" : (userProfile?.departemen || ""));
		setNamaKegiatan("");
		setDeskripsi("");
		setPrioritas("sedang");
		setIsAktif(1);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item) => {
		setModalMode("edit");
		setSelectedId(item.id);
		setDepId(item.dep_id || "");
		setNamaKegiatan(item.nama_kegiatan);
		setDeskripsi(item.deskripsi || "");
		setPrioritas(item.prioritas || "sedang");
		setIsAktif(item.is_aktif);
		setIsModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!namaKegiatan.trim()) {
			setErrorMsg("Nama kegiatan wajib diisi");
			return;
		}

		setSaving(true);
		setErrorMsg("");
		setSuccessMsg("");
		
		const payload = {
			dep_id: isIT ? (depId || null) : (userProfile?.departemen || null),
			nama_kegiatan: namaKegiatan.trim(),
			deskripsi: deskripsi.trim() || null,
			prioritas: prioritas,
			is_aktif: isAktif
		};

		try {
			let res;
			if (modalMode === "add") {
				res = await fetch("/api/penilaian/master-kegiatan", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch(`/api/penilaian/master-kegiatan/${selectedId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
			}

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menyimpan template");

			setSuccessMsg(modalMode === "add" ? "Template kegiatan berhasil ditambahkan!" : "Template kegiatan berhasil diperbarui!");
			setIsModalOpen(false);
			await loadMasterList();
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
			const res = await fetch(`/api/penilaian/master-kegiatan/${item.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					dep_id: item.dep_id,
					nama_kegiatan: item.nama_kegiatan,
					deskripsi: item.deskripsi,
					prioritas: item.prioritas,
					is_aktif: item.is_aktif === 1 ? 0 : 1 
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal merubah status");

			setSuccessMsg("Status aktif template kegiatan berhasil diubah!");
			await loadMasterList();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Apakah Anda yakin ingin menghapus template kegiatan ini?")) return;
		
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/master-kegiatan/${id}`, {
				method: "DELETE"
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menghapus template");

			setSuccessMsg("Template kegiatan berhasil dihapus!");
			await loadMasterList();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	// Client-side filtering logic
	const filteredList = masterList.filter(item => {
		// If not IT, strictly limit to user's unit and global templates
		if (!isIT) {
			const userDept = userProfile?.departemen;
			if (item.dep_id !== null && item.dep_id !== userDept) {
				return false;
			}
		} else {
			// Department Filter (for IT admin)
			if (selectedDeptFilter !== "all") {
				if (selectedDeptFilter === "global" && item.dep_id !== null) return false;
				if (selectedDeptFilter !== "global" && item.dep_id !== selectedDeptFilter) return false;
			}
		}

		// Search Query
		if (searchQuery.trim() !== "") {
			const query = searchQuery.toLowerCase();
			const matchTitle = item.nama_kegiatan.toLowerCase().includes(query);
			const matchDesc = item.deskripsi?.toLowerCase().includes(query) || false;
			const matchDeptName = item.nama_departemen?.toLowerCase().includes(query) || false;
			return matchTitle || matchDesc || matchDeptName;
		}

		return true;
	});

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			<div className="bg-gradient-to-r from-primary-900 to-primary-800 border border-primary-800/20 rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10">
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree flex items-center gap-2 text-slate-800">
						<ClipboardList className="h-7 w-7 text-primary-400" />
						Master Template Kegiatan Kerja
					</h1>
					<p className="text-slate-500 text-sm mt-1">Kelola template nama kegiatan standar yang dapat dipilih oleh pegawai per unit.</p>
				</div>
				<button 
					onClick={handleOpenAdd}
					className="relative z-10 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow"
				>
					<Plus className="h-4 w-4 text-white" />
					Tambah Template
				</button>
			</div>

			{/* Notifications */}
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

			{/* Filters / Controls */}
			<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
				<div className="relative w-full md:w-80">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<input 
						type="text" 
						placeholder="Cari nama kegiatan atau deskripsi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 font-medium text-slate-700"
					/>
				</div>

				<div className="flex w-full md:w-auto items-center gap-2">
					<Filter className="h-4 w-4 text-slate-400 shrink-0" />
					<select 
						value={isIT ? selectedDeptFilter : (userProfile?.departemen || "")}
						disabled={!isIT}
						onChange={(e) => isIT && setSelectedDeptFilter(e.target.value)}
						className="w-full md:w-56 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 font-medium text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400"
					>
						{isIT ? (
							<>
								<option value="all">Semua Unit Kerja</option>
								<option value="global">Umum / Global</option>
								{departments.map((dept) => (
									<option key={dept.dep_id} value={dept.dep_id}>{dept.nama}</option>
								))}
							</>
						) : (
							<option value={userProfile?.departemen || ""}>
								{userProfile?.departemen_name || "Unit Kerja Saya"}
							</option>
						)}
					</select>
				</div>
			</div>

			{/* Data Table */}
			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
				</div>
			) : filteredList.length === 0 ? (
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm text-slate-400 font-medium">
					Tidak ada data template kegiatan ditemukan.
				</div>
			) : (
				<div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-primary-100 bg-primary-50/50 text-[10px] uppercase font-bold text-slate-600 tracking-wider font-figtree">
									<th className="px-5 py-3.5">Unit Kerja / Departemen</th>
									<th className="px-5 py-3.5">Template Kegiatan</th>
									<th className="px-5 py-3.5">Prioritas</th>
									<th className="px-5 py-3.5">Deskripsi Panduan</th>
									<th className="px-5 py-3.5 text-center">Status</th>
									<th className="px-5 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-150 text-xs text-slate-700 font-medium">
								{filteredList.map((row) => (
									<tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-5 py-4 whitespace-nowrap">
											{row.dep_id === null ? (
												<span className="px-2.5 py-0.5 text-[9px] font-extrabold rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-figtree">
													UMUM / GLOBAL
												</span>
											) : (
												<span className="px-2.5 py-0.5 text-[9px] font-extrabold rounded-md bg-primary-50 text-primary-400 border border-primary-100 font-figtree uppercase">
													{row.nama_departemen || row.dep_id}
												</span>
											)}
										</td>
										<td className="px-5 py-4">
											<span className="font-bold text-slate-800 block text-sm">{row.nama_kegiatan}</span>
										</td>
										<td className="px-5 py-4 whitespace-nowrap">
											<span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-md font-figtree uppercase border ${
												row.prioritas === "tinggi" 
													? "bg-rose-50 text-rose-600 border-rose-100" 
													: row.prioritas === "rendah"
													? "bg-slate-100 text-slate-500 border-slate-200"
													: "bg-amber-50 text-amber-600 border-amber-100"
											}`}>
												{row.prioritas || "sedang"}
											</span>
										</td>
										<td className="px-5 py-4 max-w-xs text-slate-500 break-words leading-relaxed font-medium">
											{row.deskripsi || "-"}
										</td>
										<td className="px-5 py-4 text-center">
											{isIT || row.dep_id === userProfile?.departemen ? (
												<button 
													onClick={() => handleToggleActive(row)}
													className={`p-1.5 rounded-lg transition-all border cursor-pointer active:scale-90 ${
														row.is_aktif === 1 
															? "text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100" 
															: "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
													}`}
													title={row.is_aktif === 1 ? "Nonaktifkan" : "Aktifkan"}
												>
													<Power className="h-3.5 w-3.5" />
												</button>
											) : (
												<span className="text-slate-400 text-xs">-</span>
											)}
										</td>
										<td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
											{isIT || row.dep_id === userProfile?.departemen ? (
												<>
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
												</>
											) : (
												<span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-400 rounded border border-slate-200 font-medium">Read-Only</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Add/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
						<div className="bg-gradient-to-r from-primary-900 to-primary-800 px-6 py-4 text-slate-800 flex justify-between items-center relative overflow-hidden border-b border-slate-200">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-2xl pointer-events-none"></div>
							<h3 className="font-extrabold text-lg font-figtree relative z-10 text-slate-800">
								{modalMode === "add" ? "Tambah Template Baru" : "Edit Template Kegiatan"}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-850 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer relative z-10">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
								
								{isIT && (
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Unit Kerja / Departemen</label>
										<SearchableSelect
											options={[
												{ value: "", label: "Umum / Semua Departemen (Global)", sublabel: "Akan muncul untuk semua pegawai" },
												...departments.map((dept) => ({
													value: dept.dep_id,
													label: dept.nama,
													sublabel: dept.dep_id
												}))
											]}
											value={depId || ""}
											onChange={(val) => setDepId(val)}
											placeholder="Pilih Unit Kerja / Departemen..."
										/>
									</div>
								)}

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Nama Kegiatan Kerja</label>
									<input 
										type="text"
										value={namaKegiatan}
										onChange={(e) => setNamaKegiatan(e.target.value)}
										placeholder="Contoh: Menyiapkan rekap shift harian"
										maxLength={200}
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-800 font-bold"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Prioritas Kerja / Bobot</label>
									<select 
										value={prioritas}
										onChange={(e) => setPrioritas(e.target.value)}
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-700 font-semibold"
									>
										<option value="tinggi">Tinggi (Bobot x3)</option>
										<option value="sedang">Sedang (Bobot x2)</option>
										<option value="rendah">Rendah (Bobot x1)</option>
									</select>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Deskripsi Panduan (Opsional)</label>
									<textarea 
										value={deskripsi}
										onChange={(e) => setDeskripsi(e.target.value)}
										placeholder="Petunjuk detail atau petunjuk tambahan mengenai kegiatan ini..."
										rows={3}
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:bg-white text-sm text-slate-700 resize-none font-medium"
									></textarea>
								</div>

								{modalMode === "edit" && (
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-figtree">Status Aktif</label>
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
									className="px-5 py-2.5 bg-primary-600 hover:bg-primary-800 disabled:bg-primary-300 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow-md shadow-primary-500/10 cursor-pointer active:scale-95"
								>
									{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
									Simpan Template
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
