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
	UserCheck,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Info,
	CalendarClock,
	Filter
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
	const [isAutoApprove, setIsAutoApprove] = useState(false);
	const [autoApproveDays, setAutoApproveDays] = useState(3);
	const [saving, setSaving] = useState(false);
	const [modalError, setModalError] = useState("");
	
	// Confirmation Modal State
	const [confirmModal, setConfirmModal] = useState({
		open: false,
		title: "",
		message: "",
		actionLabel: "Konfirmasi",
		isDestructive: false,
		loading: false,
		onConfirm: null
	});
	
	// Search and Facet filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterRelasi, setFilterRelasi] = useState("all"); // "all" | "unit" | "personal"
	const [filterStatus, setFilterStatus] = useState("all"); // "all" | "active" | "inactive" | "expired"
	
	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

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
		setIsAutoApprove(false);
		setAutoApproveDays(3);
		setModalError("");
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
		setIsAutoApprove(Boolean(item.is_auto_approve));
		setAutoApproveDays(item.auto_approve_days || 3);
		setModalError("");
		setIsModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setModalError("");

		if (!tipeRelasi || !supervisorId || !berlakuMulai) {
			setModalError("Semua kolom wajib diisi kecuali tanggal berakhir");
			return;
		}

		if (tipeRelasi === "personal" && !pegawaiId) {
			setModalError("Pegawai wajib dipilih untuk tipe relasi personal");
			return;
		}

		if (tipeRelasi === "unit" && !kodeUnit) {
			setModalError("Kode unit wajib dipilih untuk tipe relasi unit");
			return;
		}

		// Prevent self-assessment in mapping
		if (tipeRelasi === "personal" && Number(pegawaiId) === Number(supervisorId)) {
			setModalError("Pegawai dan supervisor tidak boleh orang yang sama");
			return;
		}

		// Validate date range
		if (berlakuSampai && moment(berlakuSampai).isBefore(moment(berlakuMulai))) {
			setModalError("Tanggal berakhir tidak boleh lebih awal dari tanggal mulai berlaku");
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
			berlaku_sampai: berlakuSampai || null,
			is_auto_approve: isAutoApprove,
			auto_approve_days: Number(autoApproveDays) || 3
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
			setModalError(err.message);
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

	const promptToggleActive = (row) => {
		const nextStatus = row.is_aktif === 1 ? 0 : 1;
		const statusText = nextStatus === 1 ? "mengaktifkan" : "menonaktifkan";
		const targetLabel = row.tipe_relasi === "personal"
			? `pegawai ${row.nama_pegawai || row.nik_pegawai}`
			: `unit ${row.kode_unit}`;

		setConfirmModal({
			open: true,
			title: `${nextStatus === 1 ? "Aktifkan" : "Nonaktifkan"} Mapping?`,
			message: `Anda yakin ingin ${statusText} relasi penilaian antara supervisor ${row.nama_supervisor} dan ${targetLabel}?`,
			actionLabel: nextStatus === 1 ? "Aktifkan" : "Nonaktifkan",
			isDestructive: nextStatus === 0,
			loading: false,
			onConfirm: async () => {
				setConfirmModal(prev => ({ ...prev, loading: true }));
				await handleToggleActive(row.id, row.is_aktif);
				setConfirmModal(prev => ({ ...prev, open: false, loading: false }));
			}
		});
	};

	const promptDelete = (row) => {
		const targetLabel = row.tipe_relasi === "personal"
			? `pegawai ${row.nama_pegawai || row.nik_pegawai}`
			: `unit ${row.kode_unit}`;

		setConfirmModal({
			open: true,
			title: "Hapus Mapping Supervisor?",
			message: `Tindakan ini permanen. Memutuskan relasi hierarki ini akan memengaruhi penilaian kinerja ${targetLabel} di bawah supervisor ${row.nama_supervisor}.`,
			actionLabel: "Hapus Mapping",
			isDestructive: true,
			loading: false,
			onConfirm: async () => {
				setConfirmModal(prev => ({ ...prev, loading: true }));
				await handleDelete(row.id);
				setConfirmModal(prev => ({ ...prev, open: false, loading: false }));
			}
		});
	};

	// Auto reset page when search or filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterRelasi, filterStatus, pageSize]);

	// Filter data with text search and facet chips
	const filteredList = mappingList.filter((item) => {
		const matchesSearch = 
			(item.nama_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.nik_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.nama_supervisor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.nik_supervisor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.kode_unit || "").toLowerCase().includes(searchQuery.toLowerCase());

		if (!matchesSearch) return false;

		// Filter Relasi
		if (filterRelasi !== "all" && item.tipe_relasi !== filterRelasi) {
			return false;
		}

		// Filter Status
		const isExpired = Boolean(item.berlaku_sampai && moment(item.berlaku_sampai).isBefore(moment(), "day"));
		if (filterStatus === "active") {
			return item.is_aktif === 1 && !isExpired;
		}
		if (filterStatus === "inactive") {
			return item.is_aktif === 0;
		}
		if (filterStatus === "expired") {
			return isExpired;
		}

		return true;
	});

	// Pagination calculations
	const totalItems = filteredList.length;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;
	const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
	const startIndex = (safeCurrentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, totalItems);
	const paginatedList = filteredList.slice(startIndex, endIndex);

	// Formatted options for searchable select
	const employeeOptions = employees.map((emp) => ({
		value: emp.id,
		label: emp.label || emp.nama,
		sublabel: `NIK: ${emp.value} — ${emp.nama_departemen || ""}`
	}));

	const unitOptions = tipeUnit === "departemen"
		? departments.map(d => ({ value: d.dep_id, label: d.nama }))
		: bidangList.map(b => ({ value: b.nama, label: b.nama }));

	const getUnitLabel = (kodeUnit, tipeUnit) => {
		if (!kodeUnit) return "-";
		if (tipeUnit === "departemen") {
			const dep = departments.find(d => String(d.dep_id) === String(kodeUnit));
			return dep ? `${dep.nama} (${kodeUnit})` : `Kode: ${kodeUnit}`;
		}
		const bidang = bidangList.find(b => String(b.nama) === String(kodeUnit));
		return bidang ? `${bidang.nama}` : `Kode: ${kodeUnit}`;
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				if (confirmModal.open) {
					setConfirmModal(prev => ({ ...prev, open: false }));
				} else if (isModalOpen) {
					setIsModalOpen(false);
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [confirmModal.open, isModalOpen]);


	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			<div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
						<GitMerge className="h-6 w-6" />
					</div>
					<div>
						<h1 className="text-2xl md:text-3xl font-bold tracking-tight font-figtree text-slate-900">Mapping Supervisor</h1>
						<p className="text-slate-500 text-sm mt-0.5 font-medium">Kelola relasi penilai kinerja pegawai berbasis unit departemen atau personal hierarki.</p>
					</div>
				</div>
				<button 
					onClick={handleOpenAdd}
					className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-95 shrink-0"
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

			{/* Search & Filter Bar */}
			<div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-3">
				<div className="flex items-center gap-3">
					<Search className="h-5 w-5 text-slate-400 shrink-0" />
					<input 
						type="text" 
						placeholder="Cari berdasarkan nama pegawai, supervisor, NIK, atau kode unit..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full text-sm text-slate-700 bg-transparent focus:outline-none placeholder-slate-400 font-medium"
					/>
					{searchQuery && (
						<button 
							onClick={() => setSearchQuery("")}
							className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
						>
							Hapus
						</button>
					)}
				</div>

				<div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold text-slate-500 flex items-center gap-1">
							<Filter className="h-3.5 w-3.5" />
							Relasi:
						</span>
						<div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
							{[
								{ id: "all", label: "Semua" },
								{ id: "unit", label: "Unit" },
								{ id: "personal", label: "Personal" }
							].map((chip) => (
								<button
									key={chip.id}
									onClick={() => setFilterRelasi(chip.id)}
									className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
										filterRelasi === chip.id
											? "bg-white text-sky-700 shadow-xs"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									{chip.label}
								</button>
							))}
						</div>

						<span className="font-semibold text-slate-500 ml-2">Status:</span>
						<div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
							{[
								{ id: "all", label: "Semua" },
								{ id: "active", label: "Aktif" },
								{ id: "inactive", label: "Nonaktif" },
								{ id: "expired", label: "Kedaluwarsa" }
							].map((chip) => (
								<button
									key={chip.id}
									onClick={() => setFilterStatus(chip.id)}
									className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
										filterStatus === chip.id
											? "bg-white text-sky-700 shadow-xs"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									{chip.label}
								</button>
							))}
						</div>
					</div>

					<div className="text-slate-500 font-medium">
						Total: <strong className="font-semibold text-slate-800">{totalItems}</strong> mapping
					</div>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
				</div>
			) : filteredList.length === 0 ? (
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs text-slate-400 font-medium">
					Tidak ada mapping supervisor ditemukan.
				</div>
			) : (
				<div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
					{/* Desktop Table View */}
					<div className="hidden md:block overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-slate-200 bg-slate-50/75 text-xs uppercase font-semibold text-slate-600 tracking-wider font-figtree">
									<th className="px-5 py-3.5">Tipe Relasi</th>
									<th className="px-5 py-3.5">Pegawai / Unit dinilai</th>
									<th className="px-5 py-3.5">Supervisor (Evaluator)</th>
									<th className="px-5 py-3.5">Mulai Berlaku</th>
									<th className="px-5 py-3.5">Berakhir Berlaku</th>
									<th className="px-5 py-3.5 text-center">Auto Approval</th>
									<th className="px-5 py-3.5 text-center">Status</th>
									<th className="px-5 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
								{paginatedList.map((row) => {
									const isExpired = Boolean(row.berlaku_sampai && moment(row.berlaku_sampai).isBefore(moment(), "day"));
									return (
										<tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
											<td className="px-5 py-4">
												{row.tipe_relasi === "personal" ? (
													<span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide font-figtree">
														Personal
													</span>
												) : (
													<span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide font-figtree">
														Unit ({row.tipe_unit})
													</span>
												)}
											</td>
											<td className="px-5 py-4">
												{row.tipe_relasi === "personal" ? (
													<>
														<span className="font-semibold text-slate-800 block text-sm">{row.nama_pegawai}</span>
														<span className="text-xs text-slate-400 block mt-0.5">NIK: {row.nik_pegawai}</span>
													</>
												) : (
													<span className="font-semibold text-slate-800 block text-sm font-figtree">
														{getUnitLabel(row.kode_unit, row.tipe_unit)}
													</span>
												)}
											</td>
											<td className="px-5 py-4">
												<span className="font-semibold text-slate-800 block text-sm">{row.nama_supervisor}</span>
												<span className="text-xs text-slate-400 block mt-0.5">NIK: {row.nik_supervisor}</span>
											</td>
											<td className="px-5 py-4 font-semibold text-slate-600 font-figtree">
												{moment(row.berlaku_mulai).format("DD/MM/YYYY")}
											</td>
											<td className="px-5 py-4 text-slate-500 font-medium">
												{row.berlaku_sampai ? (
													<div className="space-y-1">
														<span className="text-slate-600 font-medium block">
															{moment(row.berlaku_sampai).format("DD/MM/YYYY")}
														</span>
														{isExpired && (
															<span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
																<CalendarClock className="h-3 w-3" />
																Kedaluwarsa
															</span>
														)}
													</div>
												) : (
													<span className="text-slate-500 font-medium">Aktif Seterusnya</span>
												)}
											</td>
											<td className="px-5 py-4 text-center">
												{row.is_auto_approve === 1 || row.is_auto_approve === true ? (
													<span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block font-figtree">
														Aktif ({row.auto_approve_days || 3} Hari)
													</span>
												) : (
													<span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block font-figtree">
														Nonaktif
													</span>
												)}
											</td>
											<td className="px-5 py-4 text-center">
												<button 
													onClick={() => promptToggleActive(row)}
													title={row.is_aktif === 1 ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
													aria-label={row.is_aktif === 1 ? "Nonaktifkan mapping" : "Aktifkan mapping"}
													className={`p-1.5 rounded-xl transition-colors border cursor-pointer active:scale-95 ${
														row.is_aktif === 1 
															? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" 
															: "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
													}`}
												>
													<Power className="h-3.5 w-3.5" />
												</button>
											</td>
											<td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
												<button 
													onClick={() => handleOpenEdit(row)}
													aria-label="Edit mapping"
													className="p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
												>
													<Edit className="h-4 w-4" />
												</button>
												<button 
													onClick={() => promptDelete(row)}
													aria-label="Hapus mapping"
													className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Mobile Card View */}
					<div className="block md:hidden p-3 space-y-3">
						{paginatedList.map((row) => {
							const isExpired = Boolean(row.berlaku_sampai && moment(row.berlaku_sampai).isBefore(moment(), "day"));
							return (
								<div key={row.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
									{/* Card Top: Badges & Status Toggle */}
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 flex-wrap">
											{row.tipe_relasi === "personal" ? (
												<span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide font-figtree">
													Personal
												</span>
											) : (
												<span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide font-figtree">
													Unit ({row.tipe_unit})
												</span>
											)}

											{row.is_aktif === 1 ? (
												<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
													Aktif
												</span>
											) : (
												<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
													Nonaktif
												</span>
											)}

											{isExpired && (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
													<CalendarClock className="h-3 w-3" />
													Kedaluwarsa
												</span>
											)}
										</div>

										<button
											onClick={() => promptToggleActive(row)}
											title={row.is_aktif === 1 ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
											aria-label={row.is_aktif === 1 ? "Nonaktifkan mapping" : "Aktifkan mapping"}
											className={`p-2 rounded-xl transition-colors border cursor-pointer active:scale-95 shrink-0 ${
												row.is_aktif === 1
													? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
													: "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
											}`}
										>
											<Power className="h-4 w-4" />
										</button>
									</div>

									{/* Card Content */}
									<div className="space-y-2 pt-1">
										<div>
											<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block font-figtree">
												Pegawai / Unit dinilai
											</span>
											{row.tipe_relasi === "personal" ? (
												<div className="mt-0.5">
													<span className="font-semibold text-slate-900 block text-sm">{row.nama_pegawai}</span>
													<span className="text-xs text-slate-500 block">NIK: {row.nik_pegawai}</span>
												</div>
											) : (
												<span className="font-semibold text-slate-900 block text-sm font-figtree mt-0.5">
													{getUnitLabel(row.kode_unit, row.tipe_unit)}
												</span>
											)}
										</div>

										<div>
											<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block font-figtree">
												Supervisor (Evaluator)
											</span>
											<div className="mt-0.5">
												<span className="font-semibold text-slate-900 block text-sm">{row.nama_supervisor}</span>
												<span className="text-xs text-slate-500 block">NIK: {row.nik_supervisor}</span>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600">
											<div>
												<span className="text-slate-400 block font-medium">Mulai Berlaku:</span>
												<span className="font-semibold text-slate-700 font-figtree">
													{moment(row.berlaku_mulai).format("DD/MM/YYYY")}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block font-medium">Berakhir:</span>
												<span className="font-medium text-slate-700">
													{row.berlaku_sampai ? moment(row.berlaku_sampai).format("DD/MM/YYYY") : "Aktif Seterusnya"}
												</span>
											</div>
										</div>

										<div className="pt-1 text-xs">
											<span className="text-slate-400 font-medium">Auto Approval: </span>
											{row.is_auto_approve === 1 || row.is_auto_approve === true ? (
												<span className="font-semibold text-emerald-700">
													Aktif ({row.auto_approve_days || 3} Hari)
												</span>
											) : (
												<span className="font-medium text-slate-500">
													Nonaktif
												</span>
											)}
										</div>
									</div>

									{/* Card Actions */}
									<div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
										<button
											onClick={() => handleOpenEdit(row)}
											aria-label="Edit mapping"
											className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
										>
											<Edit className="h-3.5 w-3.5" />
											Edit
										</button>
										<button
											onClick={() => promptDelete(row)}
											aria-label="Hapus mapping"
											className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
										>
											<Trash2 className="h-3.5 w-3.5" />
											Hapus
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Pagination Bar */}
					<div className="p-4 bg-slate-50/75 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
						<div className="flex items-center gap-2">
							<span>Baris per halaman:</span>
							<select
								value={pageSize}
								onChange={(e) => setPageSize(Number(e.target.value))}
								className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-600 cursor-pointer"
							>
								<option value={10}>10</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
							</select>
							<span className="text-slate-400">|</span>
							<span>
								{totalItems > 0 ? (
									<>Menampilkan <strong className="font-semibold text-slate-800">{startIndex + 1}</strong> - <strong className="font-semibold text-slate-800">{endIndex}</strong> dari <strong className="font-semibold text-slate-800">{totalItems}</strong> mapping</>
								) : (
									"0 data"
								)}
							</span>
						</div>

						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage(1)}
								disabled={safeCurrentPage <= 1}
								aria-label="Halaman pertama"
								className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
							>
								<ChevronsLeft className="h-4 w-4" />
							</button>
							<button
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={safeCurrentPage <= 1}
								aria-label="Halaman sebelumnya"
								className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>

							<span className="px-3 py-1 font-semibold text-slate-700">
								Halaman {safeCurrentPage} / {totalPages}
							</span>

							<button
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={safeCurrentPage >= totalPages}
								aria-label="Halaman berikutnya"
								className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
							<button
								onClick={() => setCurrentPage(totalPages)}
								disabled={safeCurrentPage >= totalPages}
								aria-label="Halaman terakhir"
								className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
							>
								<ChevronsRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Form Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 border border-slate-200">
						<div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
							<h3 className="font-bold text-lg font-figtree text-slate-900">
								{modalMode === "add" ? "Tambah Mapping Baru" : "Edit Mapping Supervisor"}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto font-medium">
								{modalError && (
									<div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-fadeIn">
										<AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
										<span>{modalError}</span>
									</div>
								)}

								<div className="space-y-2">
									<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Tipe Relasi</label>
									<div className="flex gap-4">
										<label className="flex items-center gap-2 text-sm text-slate-700 font-bold cursor-pointer">
											<input 
												type="radio" 
												name="tipe_relasi"
												value="unit"
												checked={tipeRelasi === "unit"}
												onChange={(e) => setTipeRelasi(e.target.value)}
												disabled={modalMode === "edit"}
												className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
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
												className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
											/>
											Personal (Hierarki Atasan)
										</label>
									</div>
								</div>

								{/* Personal Employee Selector */}
								{tipeRelasi === "personal" && (
									<div className="space-y-1.5">
										<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Pilih Pegawai dinilai</label>
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
											<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Tipe Unit</label>
											<select 
												value={tipeUnit}
												onChange={(e) => {
													setTipeUnit(e.target.value);
													setKodeUnit("");
												}}
												disabled={modalMode === "edit"}
												required={tipeRelasi === "unit"}
												className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-700 font-semibold"
											>
												<option value="departemen">Departemen</option>
												<option value="bidang">Bidang</option>
											</select>
										</div>
										<div className="space-y-1.5">
											<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Pilih Unit</label>
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
									<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Pilih Supervisor (Evaluator)</label>
									<SearchableSelect 
										options={employeeOptions}
										value={supervisorId}
										onChange={setSupervisorId}
										placeholder="Pilih Supervisor..."
									/>
								</div>

								{/* Validity Dates */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Mulai Berlaku</label>
									<input 
										type="date"
										value={berlakuMulai}
										onChange={(e) => setBerlakuMulai(e.target.value)}
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-700 font-semibold shadow-xs"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Berakhir Berlaku</label>
									<input 
										type="date"
										value={berlakuSampai}
										onChange={(e) => setBerlakuSampai(e.target.value)}
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-700 font-semibold shadow-xs"
									/>
								</div>

								{/* Auto Approval Toggle & Days */}
								<div className="space-y-2 pt-2 border-t border-slate-100">
									<label className="flex items-center gap-2 text-sm text-slate-700 font-bold cursor-pointer">
										<input 
											type="checkbox" 
											id="is_auto_approve" 
											checked={isAutoApprove} 
											onChange={(e) => setIsAutoApprove(e.target.checked)} 
											className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded cursor-pointer"
										/>
										Aktifkan Auto Approval
									</label>
									<p className="text-xs text-slate-500 font-medium pl-6 leading-relaxed flex items-start gap-1.5">
										<Info className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
										<span>Toleransi dihitung dalam hari kalender. Jika evaluator tidak merespons dalam batas hari, sistem otomatis menyetujui evaluasi bawahan.</span>
									</p>

									{isAutoApprove && (
										<div className="space-y-1.5 pl-6">
											<label htmlFor="auto_approve_days" className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Toleransi Auto Approval (Hari)</label>
											<input 
												type="number" 
												id="auto_approve_days" 
												min="1" 
												value={autoApproveDays} 
												onChange={(e) => setAutoApproveDays(e.target.value)} 
												className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-700 font-semibold shadow-xs"
											/>
										</div>
									)}
								</div>

								{modalMode === "edit" && (
									<div className="space-y-1.5">
										<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block font-figtree">Status Aktif</label>
										<select 
											value={isAktif}
											onChange={(e) => setIsAktif(Number(e.target.value))}
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-700 font-semibold"
										>
											<option value={1}>Aktif</option>
											<option value={0}>Non-Aktif</option>
										</select>
									</div>
								)}
							</div>

							{/* Footer */}
							<div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
								<button 
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer active:scale-95"
								>
									Batal
								</button>
								<button 
									type="submit"
									disabled={saving}
									className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
								>
									{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
									Simpan Mapping
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
			{confirmModal.open && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 border border-slate-200">
						<div className="p-6 space-y-4">
							<div className="flex items-start gap-3.5">
								<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
									confirmModal.isDestructive 
										? "bg-rose-50 text-rose-600 border border-rose-100" 
										: "bg-amber-50 text-amber-600 border border-amber-100"
								}`}>
									<AlertCircle className="h-5 w-5" />
								</div>
								<div className="space-y-1">
									<h3 className="font-bold text-base text-slate-900 font-figtree">
										{confirmModal.title}
									</h3>
									<p className="text-xs text-slate-600 leading-relaxed font-medium">
										{confirmModal.message}
									</p>
								</div>
							</div>
						</div>
						<div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex justify-end gap-2">
							<button 
								type="button"
								disabled={confirmModal.loading}
								onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
								className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button 
								type="button"
								disabled={confirmModal.loading}
								onClick={confirmModal.onConfirm}
								className={`px-4 py-2 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
									confirmModal.isDestructive
										? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300"
										: "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300"
								}`}
							>
								{confirmModal.loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
								{confirmModal.actionLabel}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
