"use client";

import { useState, useEffect } from "react";
import moment from "moment";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
	Search, 
	Lock, 
	Unlock, 
	Download, 
	Printer, 
	AlertTriangle, 
	Loader2, 
	CheckCircle,
	Coins,
	FileBarChart,
	TrendingUp
} from "lucide-react";

export default function AdminRekapBulananPage() {
	const [currentMonth, setCurrentMonth] = useState(moment().format("MM"));
	const [currentYear, setCurrentYear] = useState(moment().format("YYYY"));
	const [selectedDept, setSelectedDept] = useState("ALL");
	
	const [departments, setDepartments] = useState([]);
	const [rekapList, setRekapList] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const [actionLoadingId, setActionLoadingId] = useState(null);

	// Pagination states
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [meta, setMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
	const [summary, setSummary] = useState({ totalJasaDasar: 0, totalPengurang: 0, totalJasaFinal: 0, avgMonthlyScore: 0, totalLocked: 0, totalEmployees: 0 });
	const [selectedIds, setSelectedIds] = useState([]);
	const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
	
	const [confirmState, setConfirmState] = useState({
		isOpen: false,
		title: "",
		description: "",
		confirmText: "",
		cancelText: "",
		variant: "primary",
		onConfirm: () => {}
	});

	const triggerConfirm = ({ title, description, confirmText, cancelText, variant, onConfirm }) => {
		setConfirmState({
			isOpen: true,
			title,
			description,
			confirmText,
			cancelText,
			variant,
			onConfirm: () => {
				onConfirm();
				setConfirmState(prev => ({ ...prev, isOpen: false }));
			}
		});
	};

	const [searchName, setSearchName] = useState("");
	const [debouncedSearchName, setDebouncedSearchName] = useState("");

	// Reset selection when filter parameters change
	useEffect(() => {
		setSelectedIds([]);
	}, [currentMonth, currentYear, selectedDept, debouncedSearchName, selectedStatusFilter, page]);

	// Debounce search input to prevent overloading backend database queries
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchName(searchName);
			setPage(1); // Reset page to 1 on new search
		}, 400);
		return () => clearTimeout(handler);
	}, [searchName]);

	// Load departments
	useEffect(() => {
		const loadDepts = async () => {
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
		loadDepts();
	}, []);

	// Load Rekap List
	const loadRekap = async () => {
		setLoading(true);
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/rekap?bulan=${currentMonth}&tahun=${currentYear}&departemen=${selectedDept}&nama=${encodeURIComponent(debouncedSearchName)}&status=${selectedStatusFilter}&page=${page}&limit=${limit}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal memuat rekap bulanan");
			setRekapList(data.data || []);
			if (data.meta) setMeta(data.meta);
			if (data.summary) setSummary(data.summary);
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRekap();
	}, [currentMonth, currentYear, selectedDept, page, limit, debouncedSearchName, selectedStatusFilter]);

	const handleLockAction = (id, actionType) => {
		triggerConfirm({
			title: actionType === "lock" ? "Kunci Rekap Bulanan" : "Buka Kunci Rekap Bulanan",
			description: actionType === "lock" 
				? "Apakah Anda yakin ingin mengunci rekap bulanan ini? Data yang dikunci tidak dapat diubah lagi."
				: "Apakah Anda yakin ingin membuka kunci rekap bulanan ini?",
			confirmText: actionType === "lock" ? "Kunci" : "Buka Kunci",
			cancelText: "Batal",
			variant: actionType === "lock" ? "warning" : "primary",
			onConfirm: async () => {
				setActionLoadingId(id);
				setErrorMsg("");
				setSuccessMsg("");
				try {
					const res = await fetch(`/api/penilaian/rekap/${id}/lock`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ action: actionType })
					});
					const data = await res.json();
					if (!res.ok) throw new Error(data.error || "Gagal memproses penguncian");

					setSuccessMsg(
						actionType === "lock" 
							? "Rekap bulanan pegawai berhasil dikunci (Final)!" 
							: "Kunci rekap bulanan pegawai berhasil dibuka!"
					);
					
					// Refresh list
					await loadRekap();
				} catch (err) {
					setErrorMsg(err.message);
				} finally {
					setActionLoadingId(null);
				}
			}
		});
	};

	const handleBulkLockAction = (actionType) => {
		if (selectedIds.length === 0) return;
		triggerConfirm({
			title: actionType === "lock" ? "Kunci Rekap Terpilih" : "Buka Kunci Rekap Terpilih",
			description: actionType === "lock"
				? `Apakah Anda yakin ingin mengunci ${selectedIds.length} rekap bulanan terpilih? Data yang dikunci tidak dapat diubah lagi.`
				: `Apakah Anda yakin ingin membuka kunci ${selectedIds.length} rekap bulanan terpilih?`,
			confirmText: actionType === "lock" ? "Kunci Terpilih" : "Buka Kunci Terpilih",
			cancelText: "Batal",
			variant: actionType === "lock" ? "warning" : "primary",
			onConfirm: async () => {
				setLoading(true);
				setErrorMsg("");
				setSuccessMsg("");
				try {
					const res = await fetch("/api/penilaian/rekap/lock", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ids: selectedIds, action: actionType })
					});
					const data = await res.json();
					if (!res.ok) throw new Error(data.error || "Gagal memproses penguncian");

					setSuccessMsg(
						actionType === "lock" 
							? `${selectedIds.length} rekap bulanan berhasil dikunci!` 
							: `Kunci ${selectedIds.length} rekap bulanan berhasil dibuka!`
					);
					setSelectedIds([]);
					await loadRekap();
				} catch (err) {
					setErrorMsg(err.message);
					setLoading(false);
				}
			}
		});
	};

	const exportToCSV = () => {
		if (rekapList.length === 0) return;
		
		let csvContent = "data:text/csv;charset=utf-8,";
		csvContent += "NIK,Nama,Departemen,Hari Jadwal,Hari Approved,Gap Hari,Rata-rata Skor,Jasa Dasar,Pengurang Jasa,Jasa Final,Status\n";
		
		rekapList.forEach(row => {
			csvContent += `"${row.nik}","${row.nama}","${row.nama_departemen}",${row.total_hari_jadwal},${row.hari_approved},${row.gap_hari},${Math.round(row.rata_skor_total)},${row.nominal_jasa_dasar},${row.pengurang_jasa},${row.nominal_jasa_final},"${row.status_rekap}"\n`;
		});

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `Rekap_Kinerja_${currentYear}_${currentMonth}_${selectedDept}${debouncedSearchName ? `_${debouncedSearchName}` : ""}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const triggerPrint = () => {
		window.print();
	};

	// Aggregate metrics from summary payload
	const totalJasaDasar = summary.totalJasaDasar;
	const totalPengurang = summary.totalPengurang;
	const totalJasaFinal = summary.totalJasaFinal;
	const avgMonthlyScore = summary.avgMonthlyScore;

	// Format departments for SearchableSelect
	const deptOptions = [
		{ value: "ALL", label: "Semua Departemen" },
		...departments.map((dept) => ({
			value: dept.dep_id,
			label: dept.nama
		}))
	];

	return (
		<div className="w-full p-4 md:p-6 space-y-5 font-noto-sans">
			{/* Header */}
			<div className="relative bg-primary-900 border border-primary-800/40 rounded-2xl overflow-hidden shadow-sm print:hidden">
				{/* Decorative radial glow */}
				<div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-700/10 rounded-full blur-3xl pointer-events-none" />
				
				<div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest font-mono">Rekapitulasi Kinerja</span>
						</div>
						<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800 leading-tight">
							Rekap Kinerja Bulanan
						</h1>
						<p className="text-slate-500 text-sm mt-1.5 font-medium">
							Rekapitulasi to-do list harian, gap hari approved, dan pengurang jasa pegawai.
						</p>
					</div>
					<div className="flex gap-2 shrink-0">
						{selectedIds.length > 0 && (
							<>
								<button 
									onClick={() => handleBulkLockAction("lock")}
									className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-800 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
								>
									<Lock className="h-4 w-4" />
									Kunci Terpilih ({selectedIds.length})
								</button>
								<button 
									onClick={() => handleBulkLockAction("unlock")}
									className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
								>
									<Unlock className="h-4 w-4" />
									Buka Kunci Terpilih ({selectedIds.length})
								</button>
							</>
						)}
						<button 
							onClick={exportToCSV}
							disabled={rekapList.length === 0}
							className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 text-slate-700 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs"
						>
							<Download className="h-4 w-4" />
							Export CSV
						</button>
						<button 
							onClick={triggerPrint}
							disabled={rekapList.length === 0}
							className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 text-slate-700 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs"
						>
							<Printer className="h-4 w-4" />
							Cetak Laporan
						</button>
					</div>
				</div>
			</div>

			{/* Filter Section */}
			<div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 print:hidden transition-shadow duration-200 hover:shadow-md">
				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Tahun</label>
					<select 
						value={currentYear}
						onChange={(e) => {
							setCurrentYear(e.target.value);
							setPage(1);
						}}
						className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
					>
						<option value="2026">2026</option>
						<option value="2025">2025</option>
						<option value="2024">2024</option>
					</select>
				</div>

				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Bulan</label>
					<select 
						value={currentMonth}
						onChange={(e) => {
							setCurrentMonth(e.target.value);
							setPage(1);
						}}
						className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
					>
						{moment.months().map((m, idx) => (
							<option key={idx} value={String(idx + 1).padStart(2, "0")}>{m}</option>
						))}
					</select>
				</div>

				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Unit / Departemen</label>
					<SearchableSelect 
						options={deptOptions}
						value={selectedDept}
						onChange={(val) => {
							setSelectedDept(val);
							setPage(1);
						}}
						placeholder="Pilih Unit/Departemen..."
					/>
				</div>

				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Status Lock</label>
					<select 
						value={selectedStatusFilter}
						onChange={(e) => {
							setSelectedStatusFilter(e.target.value);
							setPage(1);
						}}
						className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
					>
						<option value="ALL">Semua Status</option>
						<option value="LOCKED">Terkunci (Final)</option>
						<option value="DRAFT">Belum Terkunci (Draft)</option>
					</select>
				</div>

				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Cari Pegawai</label>
					<div className="relative">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						<input 
							type="text" 
							placeholder="Nama atau NIK..."
							value={searchName}
							onChange={(e) => setSearchName(e.target.value)}
							className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 focus:bg-white text-sm font-semibold text-slate-700 transition-all placeholder-slate-400"
						/>
					</div>
				</div>

				<div className="flex items-end md:col-span-2">
					<button 
						onClick={loadRekap}
						className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow"
					>
						<Search className="h-4 w-4" />
						Segarkan
					</button>
				</div>
			</div>

			{errorMsg && (
				<div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-start gap-3 print:hidden">
					<AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm leading-relaxed">{errorMsg}</span>
				</div>
			)}

			{successMsg && (
				<div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-3 print:hidden">
					<CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm leading-relaxed">{successMsg}</span>
				</div>
			)}

			{loading ? (
				<div className="flex flex-col justify-center items-center py-24 gap-3">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
					<span className="text-sm text-slate-400 font-medium">Memuat data rekap bulanan…</span>
				</div>
			) : (
				<>
					{/* Aggregate statistics */}
					<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
						<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow duration-200">
							<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block">Total Jasa Dasar</span>
							<span className="text-xl font-black text-slate-800 font-figtree">Rp {totalJasaDasar.toLocaleString("id-ID")}</span>
						</div>
						<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow duration-200">
							<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block">Total Pengurang Jasa</span>
							<span className="text-xl font-black text-red-600 font-figtree">Rp {totalPengurang.toLocaleString("id-ID")}</span>
						</div>
						<div className="bg-primary-900 border border-primary-800/40 rounded-2xl p-5 text-slate-800 shadow-sm space-y-1 relative overflow-hidden">
							<div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-700/10 rounded-full blur-xl pointer-events-none" />
							<span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest font-mono block relative z-10">Total Jasa Terbayar</span>
							<span className="text-xl font-black text-primary-400 font-figtree relative z-10">Rp {totalJasaFinal.toLocaleString("id-ID")}</span>
						</div>
						<div className="bg-primary-800 border border-primary-800 rounded-2xl p-5 text-slate-800 shadow-sm space-y-1 relative overflow-hidden">
							<div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-700/10 rounded-full blur-xl pointer-events-none" />
							<span className="text-[10px] text-slate-650 font-bold uppercase tracking-widest font-mono block relative z-10">Rerata Nilai Kinerja</span>
							<span className="text-xl font-black text-primary-400 font-figtree relative z-10">{avgMonthlyScore} / 100</span>
						</div>
						<div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow duration-200">
							<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block">Status Penguncian</span>
							<span className="text-xl font-black text-slate-800 font-figtree">
								{summary.totalLocked} <span className="text-slate-450 text-xs font-bold">/ {summary.totalEmployees} Locked</span>
							</span>
						</div>
					</div>

					{/* Rekapitulasi Table */}
					<div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
						<div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 print:hidden flex justify-between items-center">
							<h3 className="font-bold text-slate-800 text-sm font-figtree">Daftar Rekap Bulanan Pegawai</h3>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">
										<th className="px-5 py-3.5 w-10 print:hidden">
											<input 
												type="checkbox"
												checked={rekapList.length > 0 && selectedIds.length === rekapList.length}
												onChange={(e) => {
													if (e.target.checked) {
														setSelectedIds(rekapList.map(item => item.id));
													} else {
														setSelectedIds([]);
													}
												}}
												className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
											/>
										</th>
										<th className="px-5 py-3.5">Pegawai</th>
										<th className="px-5 py-3.5 text-center">Jadwal</th>
										<th className="px-5 py-3.5 text-center">Approved</th>
										<th className="px-5 py-3.5 text-center">Gap Hari</th>
										<th className="px-5 py-3.5 text-center">Rerata Skor</th>
										<th className="px-5 py-3.5 text-right">Jasa Dasar</th>
										<th className="px-5 py-3.5 text-right">Pengurang</th>
										<th className="px-5 py-3.5 text-right">Jasa Final</th>
										<th className="px-5 py-3.5 text-center print:hidden">Status</th>
										<th className="px-5 py-3.5 text-right print:hidden">Aksi</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-xs">
									{rekapList.length === 0 ? (
										<tr>
											<td colSpan="11" className="px-5 py-10 text-center text-slate-400 font-medium">
												Tidak ada data rekapitulasi untuk bulan/tahun terpilih.
											</td>
										</tr>
									) : (
										rekapList.map((row) => (
											<tr key={row.id} className={`hover:bg-[#E0F7FE]/20 transition-colors duration-150 ${selectedIds.includes(row.id) ? 'bg-[#E0F7FE]/10' : ''}`}>
												<td className="px-5 py-4 w-10 print:hidden">
													<input 
														type="checkbox"
														checked={selectedIds.includes(row.id)}
														onChange={(e) => {
															if (e.target.checked) {
																setSelectedIds([...selectedIds, row.id]);
															} else {
																setSelectedIds(selectedIds.filter(id => id !== row.id));
															}
														}}
														className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
													/>
												</td>
												<td className="px-5 py-4">
													<span className="font-bold text-slate-800 block text-sm font-figtree">{row.nama}</span>
													<span className="text-[10px] text-slate-400 block mt-0.5 font-medium">NIK: {row.nik} — {row.nama_departemen}</span>
												</td>
												<td className="px-5 py-4 text-center font-semibold text-slate-700 font-figtree">
													{row.total_hari_jadwal} hari
												</td>
												<td className="px-5 py-4 text-center font-bold text-emerald-600 font-figtree">
													{row.hari_approved} hari
												</td>
												<td className={`px-5 py-4 text-center font-bold font-figtree ${row.gap_hari > 0 ? "text-rose-600" : "text-slate-500"}`}>
													{row.gap_hari} hari
												</td>
												<td className="px-5 py-4 text-center font-bold text-slate-700 font-figtree">
													{Math.round(row.rata_skor_total)}
												</td>
												<td className="px-5 py-4 text-right font-medium text-slate-600 font-mono">
													Rp {Number(row.nominal_jasa_dasar).toLocaleString("id-ID")}
												</td>
												<td className={`px-5 py-4 text-right font-bold font-mono ${row.pengurang_jasa > 0 ? "text-red-600" : "text-slate-400"}`}>
													Rp {Number(row.pengurang_jasa).toLocaleString("id-ID")}
												</td>
												<td className="px-5 py-4 text-right font-extrabold text-[#0090CC] text-sm font-mono">
													Rp {Number(row.nominal_jasa_final).toLocaleString("id-ID")}
												</td>
												<td className="px-5 py-4 text-center print:hidden">
													{row.status_rekap === "final" ? (
														<span className="px-2.5 py-1 text-[9px] font-bold rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 font-figtree uppercase tracking-wider">
															Locked
														</span>
													) : (
														<span className="px-2.5 py-1 text-[9px] font-bold rounded-full border bg-slate-50 text-slate-700 border-slate-200 font-figtree uppercase tracking-wider">
															Draft
														</span>
													)}
												</td>
												<td className="px-5 py-4 text-right print:hidden">
													{actionLoadingId === row.id ? (
														<Loader2 className="h-5 w-5 animate-spin text-slate-400 ml-auto" />
													) : row.status_rekap === "final" ? (
														<button 
															onClick={() => handleLockAction(row.id, "unlock")}
															className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 active:scale-[0.98] transition-colors text-rose-700 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 border border-rose-100 cursor-pointer"
														>
															<Unlock className="h-3 w-3" />
															Unlock
														</button>
													) : (
														<button 
															onClick={() => handleLockAction(row.id, "lock")}
															className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 active:scale-[0.98] transition-colors text-emerald-700 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 border border-emerald-100 cursor-pointer"
														>
															<Lock className="h-3 w-3" />
															Lock
														</button>
													)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Controls */}
						<div className="bg-white border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
							<div className="text-xs text-slate-500 font-medium">
								Menampilkan <span className="font-semibold text-slate-700">{meta.totalItems > 0 ? (page - 1) * limit + 1 : 0}</span> sampai{" "}
								<span className="font-semibold text-slate-700">{Math.min(page * limit, meta.totalItems)}</span> dari{" "}
								<span className="font-semibold text-slate-700">{meta.totalItems}</span> data
							</div>
							
							<div className="flex items-center gap-4">
								{/* Limit Selector */}
								<div className="flex items-center gap-2">
									<span className="text-xs text-slate-500 font-medium">Baris:</span>
									<select
										value={limit}
										onChange={(e) => {
											setLimit(Number(e.target.value));
											setPage(1);
										}}
										className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-primary-600 focus:bg-white"
									>
										<option value={10}>10</option>
										<option value={25}>25</option>
										<option value={50}>50</option>
										<option value={100}>100</option>
									</select>
								</div>

								{/* Page Buttons */}
								<div className="flex items-center gap-1.5">
									<button
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
										className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-150 text-[11px] font-bold"
									>
										Sebelumnya
									</button>
									
									{Array.from({ length: meta.totalPages }, (_, i) => i + 1)
										.filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
										.map((p, idx, arr) => {
											const prev = arr[idx - 1];
											return (
												<div key={p} className="flex items-center gap-1.5">
													{prev && p - prev > 1 && <span className="text-slate-400 text-xs px-1">...</span>}
													<button
														onClick={() => setPage(p)}
														className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
															page === p
																? "bg-primary-600 text-white shadow-sm"
																: "hover:bg-slate-50 text-slate-600 border border-slate-200"
														}`}
													>
														{p}
													</button>
												</div>
											);
										})}

									<button
										onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
										disabled={page === meta.totalPages || meta.totalPages === 0}
										className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-150 text-[11px] font-bold"
									>
										Berikutnya
									</button>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Confirmation Dialog */}
			<ConfirmationDialog 
				isOpen={confirmState.isOpen}
				onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
				onConfirm={confirmState.onConfirm}
				title={confirmState.title}
				description={confirmState.description}
				confirmText={confirmState.confirmText}
				cancelText={confirmState.cancelText}
				variant={confirmState.variant}
			/>
		</div>
	);
}
