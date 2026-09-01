"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	Calendar,
	CheckCircle2,
	AlertCircle,
	RefreshCw,
	Search,
	Filter,
	CheckSquare,
	Square,
	Zap,
	Building2,
	Clock,
	User,
	FileText,
	X,
	ShieldCheck,
	Layers,
	Check,
	Loader2,
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	Info,
} from "lucide-react";
import moment from "moment";
import "moment/locale/id";
import { toast } from "sonner";
import {
	fetchDeteksiCutiGql,
	executeBypassCutiGql,
} from "@/lib/deteksi-cuti-gql-client";

moment.locale("id");

export default function DeteksiCutiPage() {
	// Data states
	const [leaveData, setLeaveData] = useState([]);
	const [summary, setSummary] = useState({
		total_cuti_shift: 0,
		approved_100: 0,
		perlu_bypass: 0,
	});
	const [departments, setDepartments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState(null);

	// Filter states
	const [tanggalAwal, setTanggalAwal] = useState(
		moment().startOf("month").format("YYYY-MM-DD")
	);
	const [tanggalAkhir, setTanggalAkhir] = useState(
		moment().endOf("month").format("YYYY-MM-DD")
	);
	const [selectedDepartment, setSelectedDepartment] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	// Selection state
	const [selectedKeys, setSelectedKeys] = useState(new Set());

	// Action modal states
	const [isProcessing, setIsProcessing] = useState(false);
	const [confirmModal, setConfirmModal] = useState({
		isOpen: false,
		title: "",
		description: "",
		items: [],
		count: 0,
	});

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [tanggalAwal, tanggalAkhir, selectedDepartment, statusFilter, debouncedSearch, pageSize]);

	// Close modal on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && confirmModal.isOpen && !isProcessing) {
				setConfirmModal((prev) => ({ ...prev, isOpen: false }));
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [confirmModal.isOpen, isProcessing]);

	// Fetch departemen options
	useEffect(() => {
		const fetchDepartemen = async () => {
			try {
				const res = await fetch("/api/departemen");
				if (res.ok) {
					const json = await res.json();
					if (json.data && Array.isArray(json.data)) {
						setDepartments(json.data);
					}
				}
			} catch (err) {
				console.error("Gagal memuat data departemen:", err);
			}
		};
		fetchDepartemen();
	}, []);

	// Fetch deteksi cuti data
	const fetchData = useCallback(
		async (silent = false) => {
			if (!silent) setIsLoading(true);
			setIsRefreshing(true);
			setError(null);

			try {
				let resultData = null;
				let summaryData = null;

				try {
					const filter = {
						tanggalAwal,
						tanggalAkhir,
						departemen: selectedDepartment !== "ALL" ? selectedDepartment : undefined,
						statusFilter: statusFilter !== "ALL" ? statusFilter : undefined,
						searchTerm: debouncedSearch || undefined,
					};
					const gqlRes = await fetchDeteksiCutiGql(filter);
					if (gqlRes) {
						resultData = gqlRes.items || [];
						summaryData = gqlRes.summary || {
							total_cuti_shift: 0,
							approved_100: 0,
							perlu_bypass: 0,
						};
					}
				} catch (gqlErr) {
					console.warn("GraphQL fetch failed, falling back to REST:", gqlErr);
					const params = new URLSearchParams({
						tanggal_awal: tanggalAwal,
						tanggal_akhir: tanggalAkhir,
						departemen: selectedDepartment,
						status_filter: statusFilter,
						search: debouncedSearch,
					});

					const res = await fetch(`/api/it/deteksi-cuti?${params}`);
					const result = await res.json();

					if (!res.ok || !result.success) {
						throw new Error(result.error || result.message || "Gagal memuat data deteksi cuti");
					}

					resultData = result.data || [];
					summaryData = result.summary;
				}

				setLeaveData(resultData || []);
				if (summaryData) {
					setSummary(summaryData);
				}
				// Clear invalid selections
				setSelectedKeys(new Set());
			} catch (err) {
				console.error("Error fetching deteksi cuti:", err);
				setError(err.message);
				toast.error(err.message || "Terjadi kesalahan saat memuat data");
			} finally {
				setIsLoading(false);
				setIsRefreshing(false);
			}
		},
		[tanggalAwal, tanggalAkhir, selectedDepartment, statusFilter, debouncedSearch]
	);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Item key helper
	const getItemKey = (item) => `${item.pegawai_id}_${item.tanggal}_${item.no_pengajuan || ""}`;

	// Selectable items (items that are NOT yet approved_100)
	const selectableItems = useMemo(() => {
		return leaveData.filter((item) => item.status_bypass !== "approved_100");
	}, [leaveData]);

	// Pagination calculations
	const totalItems = leaveData.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return leaveData.slice(start, start + pageSize);
	}, [leaveData, currentPage, pageSize]);

	// Checkbox handlers
	const handleToggleSelectAll = () => {
		if (selectedKeys.size === selectableItems.length && selectableItems.length > 0) {
			setSelectedKeys(new Set());
		} else {
			const nextKeys = new Set(selectableItems.map(getItemKey));
			setSelectedKeys(nextKeys);
		}
	};

	const handleToggleItem = (item) => {
		if (item.status_bypass === "approved_100") return;
		const key = getItemKey(item);
		setSelectedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	// Execute bypass API call
	const executeBypass = async (itemsToProcess) => {
		if (!itemsToProcess || itemsToProcess.length === 0) {
			toast.info("Tidak ada data untuk diproses");
			return;
		}

		setIsProcessing(true);
		setConfirmModal((prev) => ({ ...prev, isOpen: false }));

		const toastId = toast.loading(`Memproses bypass untuk ${itemsToProcess.length} data cuti...`);

		try {
			const formattedItems = itemsToProcess.map((item) => ({
				pegawai_id: Number(item.pegawai_id),
				tanggal: item.tanggal,
				no_pengajuan: item.no_pengajuan || "",
				urgensi: item.urgensi || "",
				shift: item.shift || "",
			}));

			let successMessage = "Bypass penilaian berhasil diproses!";

			try {
				const gqlRes = await executeBypassCutiGql(formattedItems);
				if (!gqlRes || !gqlRes.success) {
					throw new Error(gqlRes?.message || "GraphQL bypass failed");
				}
				if (gqlRes.message) {
					successMessage = gqlRes.message;
				}
			} catch (gqlErr) {
				console.warn("GraphQL bypass failed, falling back to REST:", gqlErr);
				const payload = {
					items: formattedItems,
				};

				const res = await fetch("/api/it/deteksi-cuti", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				const result = await res.json();

				if (!res.ok || !result.success) {
					throw new Error(result.error || result.message || "Gagal memproses bypass penilaian");
				}

				if (result.message) {
					successMessage = result.message;
				}
			}

			toast.success(successMessage, {
				id: toastId,
			});

			// Refresh data
			await fetchData(true);
		} catch (err) {
			console.error("Error executing bypass:", err);
			toast.error(err.message || "Terjadi kesalahan saat memproses bypass", {
				id: toastId,
			});
		} finally {
			setIsProcessing(false);
		}
	};

	// Prompt Single Bypass
	const handleSingleBypass = (item) => {
		if (item.status_bypass === "approved_100") return;
		setConfirmModal({
			isOpen: true,
			title: "Konfirmasi Bypass Penilaian",
			description: `Lakukan bypass penilaian harian 100% untuk ${item.pegawai_nama} pada tanggal ${moment(
				item.tanggal
			).format("dddd, DD MMMM YYYY")} (Shift: ${item.shift})?`,
			items: [item],
			count: 1,
		});
	};

	// Prompt Bulk Selected Bypass
	const handleBulkSelectedBypass = () => {
		const itemsToProcess = leaveData.filter(
			(item) => selectedKeys.has(getItemKey(item)) && item.status_bypass !== "approved_100"
		);

		if (itemsToProcess.length === 0) {
			toast.info("Pilih setidaknya 1 item yang belum disetujui 100%");
			return;
		}

		setConfirmModal({
			isOpen: true,
			title: "Konfirmasi Bypass Terpilih",
			description: `Apakah Anda yakin ingin memproses bypass penilaian harian 100% untuk ${itemsToProcess.length} data cuti yang dipilih?`,
			items: itemsToProcess,
			count: itemsToProcess.length,
		});
	};

	// Prompt Bulk All Unbypassed
	const handleBulkAllUnbypassed = () => {
		const itemsToProcess = leaveData.filter((item) => item.status_bypass !== "approved_100");

		if (itemsToProcess.length === 0) {
			toast.info("Semua cuti dalam filter saat ini sudah Disetujui 100%");
			return;
		}

		setConfirmModal({
			isOpen: true,
			title: "Konfirmasi Bypass Semua Belum Diproses",
			description: `Apakah Anda yakin ingin memproses bypass 100% untuk seluruh ${itemsToProcess.length} jadwal cuti yang belum disetujui dalam rentang filter saat ini?`,
			items: itemsToProcess,
			count: itemsToProcess.length,
		});
	};

	// Urgensi / Leave Type badge styles
	const getUrgensiBadge = (urgensi) => {
		const label = urgensi || "Lainnya";
		switch (urgensi) {
			case "Tahunan":
			case "Tahunan ke luar negeri":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
						{label}
					</span>
				);
			case "Sakit":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
						{label}
					</span>
				);
			case "Melahirkan":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
						{label}
					</span>
				);
			case "Ibadah Keagamaan":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
						{label}
					</span>
				);
			case "Istimewa":
			case "Karena Alasan Penting":
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
						{label}
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
						{label}
					</span>
				);
		}
	};

	// Status Penilaian Harian badge
	const getStatusPenilaianBadge = (item) => {
		if (item.status_bypass === "approved_100") {
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
					<CheckCircle2 className="w-3.5 h-3.5" />
					Disetujui 100%
				</span>
			);
		}

		if (item.status_bypass === "perlu_bypass" && item.penilaian_status) {
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
					<AlertCircle className="w-3.5 h-3.5" />
					{item.penilaian_status === "draft"
						? "Draf (Perlu Bypass)"
						: `Status: ${item.penilaian_status} (Perlu Update)`}
				</span>
			);
		}

		return (
			<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
				<Clock className="w-3.5 h-3.5" />
				Belum Dibuat
			</span>
		);
	};

	return (
		<div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
			{/* Header */}
			<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2.5">
							<div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
								<ShieldCheck className="w-6 h-6" />
							</div>
							<div>
								<h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
									Deteksi Cuti Pegawai & Bypass Penilaian
								</h1>
								<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
									Scan pengajuan cuti yang disetujui pada jadwal shift kerja dan lakukan bypass nilai absensi & kegiatan (100% Disetujui).
								</p>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2 self-end md:self-auto">
						<button
							onClick={() => fetchData(false)}
							disabled={isRefreshing || isProcessing}
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition shadow-sm disabled:opacity-50 min-h-[42px]"
						>
							<RefreshCw
								className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${
									isRefreshing ? "animate-spin text-sky-600 dark:text-sky-400" : ""
								}`}
							/>
							<span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
						</button>
					</div>
				</div>

				{/* Contextual Help Banner */}
				<div className="mt-4 p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-300">
					<Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
					<p className="leading-relaxed">
						<strong>Tentang Bypass Cuti:</strong> Tindakan bypass otomatis mengatur status penilaian harian pegawai menjadi <strong>Disetujui (Approved)</strong> dengan skor absensi <strong>100</strong> dan skor kegiatan <strong>100</strong>, serta menyisipkan 1 riwayat kegiatan cuti default agar hak kinerja pegawai selama cuti resmi tetap terjaga penuh.
					</p>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Total Hari Cuti Terjadwal */}
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
								Total Hari Cuti Terjadwal
							</p>
							<h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
								{summary.total_cuti_shift || 0}
							</h2>
							<p className="text-xs text-slate-400 dark:text-slate-500">
								Shift kerja bertabrakan cuti
							</p>
						</div>
						<div className="p-3.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/50 rounded-2xl text-sky-600 dark:text-sky-400">
							<Calendar className="w-6 h-6" />
						</div>
					</div>
				</div>

				{/* Sudah Approved 100% */}
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
								Sudah Approved 100%
							</p>
							<h2 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
								{summary.approved_100 || 0}
							</h2>
							<p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
								Penilaian bypass lengkap
							</p>
						</div>
						<div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
							<CheckCircle2 className="w-6 h-6" />
						</div>
					</div>
				</div>

				{/* Belum Diproses / Perlu Bypass */}
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
								Belum Diproses / Perlu Bypass
							</p>
							<h2 className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">
								{summary.perlu_bypass || 0}
							</h2>
							<p className="text-xs text-amber-600/70 dark:text-amber-400/70">
								Menunggu tindakan bypass
							</p>
						</div>
						<div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400">
							<AlertCircle className="w-6 h-6" />
						</div>
					</div>
				</div>
			</div>

			{/* Filter Bar */}
			<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
				<div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
					<Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
					<span>Filter & Pencarian</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
					{/* Tanggal Awal */}
					<div className="space-y-1">
						<label htmlFor="filter-tanggal-awal" className="text-xs font-medium text-slate-600 dark:text-slate-400">
							Tanggal Awal
						</label>
						<input
							id="filter-tanggal-awal"
							type="date"
							value={tanggalAwal}
							onChange={(e) => setTanggalAwal(e.target.value)}
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition min-h-[42px]"
						/>
					</div>

					{/* Tanggal Akhir */}
					<div className="space-y-1">
						<label htmlFor="filter-tanggal-akhir" className="text-xs font-medium text-slate-600 dark:text-slate-400">
							Tanggal Akhir
						</label>
						<input
							id="filter-tanggal-akhir"
							type="date"
							value={tanggalAkhir}
							onChange={(e) => setTanggalAkhir(e.target.value)}
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition min-h-[42px]"
						/>
					</div>

					{/* Departemen */}
					<div className="space-y-1">
						<label htmlFor="filter-departemen" className="text-xs font-medium text-slate-600 dark:text-slate-400">
							Departemen
						</label>
						<select
							id="filter-departemen"
							value={selectedDepartment}
							onChange={(e) => setSelectedDepartment(e.target.value)}
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition min-h-[42px]"
						>
							<option value="ALL">Semua Departemen</option>
							{departments.map((dept) => (
								<option key={dept.dep_id} value={dept.dep_id}>
									{dept.nama}
								</option>
							))}
						</select>
					</div>

					{/* Status Bypass */}
					<div className="space-y-1">
						<label htmlFor="filter-status" className="text-xs font-medium text-slate-600 dark:text-slate-400">
							Status Penilaian
						</label>
						<select
							id="filter-status"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition min-h-[42px]"
						>
							<option value="ALL">Semua Status</option>
							<option value="perlu_bypass">Belum Diproses / Perlu Bypass</option>
							<option value="approved_100">Sudah Selesai (Disetujui 100%)</option>
						</select>
					</div>
				</div>

				{/* Search Bar */}
				<div className="relative">
					<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						id="filter-search"
						aria-label="Cari berdasarkan NIK, Nama Pegawai, atau No. Pengajuan Cuti"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Cari berdasarkan NIK, Nama Pegawai, atau No. Pengajuan Cuti..."
						className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition min-h-[42px]"
					/>
					{searchTerm && (
						<button
							type="button"
							aria-label="Hapus kata kunci pencarian"
							onClick={() => setSearchTerm("")}
							className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>

			{/* Action Bar */}
			<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
					<div className="flex items-center gap-3">
						<button
							onClick={handleToggleSelectAll}
							disabled={selectableItems.length === 0}
							className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition disabled:opacity-40 min-h-[38px]"
						>
							{selectedKeys.size > 0 && selectedKeys.size === selectableItems.length ? (
								<CheckSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
							) : (
								<Square className="w-5 h-5 text-slate-400" />
							)}
							<span>Pilih Semua Belum Diproses ({selectableItems.length})</span>
						</button>

						{selectedKeys.size > 0 && (
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
								{selectedKeys.size} dipilih
							</span>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						<button
							onClick={handleBulkSelectedBypass}
							disabled={selectedKeys.size === 0 || isProcessing}
							className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]"
						>
							<Zap className="w-4 h-4" />
							<span>Bypass Terpilih ({selectedKeys.size})</span>
						</button>

						<button
							onClick={handleBulkAllUnbypassed}
							disabled={summary.perlu_bypass === 0 || isProcessing || selectableItems.length === 0}
							className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]"
						>
							<Layers className="w-4 h-4" />
							<span>Bypass Semua Belum Diproses</span>
						</button>
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			{isLoading ? (
				/* Loading skeleton */
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
					<div className="flex flex-col items-center justify-center space-y-3">
						<Loader2 className="w-8 h-8 animate-spin text-sky-600 dark:text-sky-400" />
						<p className="text-sm font-medium text-slate-600 dark:text-slate-400">
							Memindai jadwal shift kerja dan pengajuan cuti pegawai...
						</p>
					</div>
				</div>
			) : error ? (
				/* Error state */
				<div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center shadow-sm">
					<div className="max-w-md mx-auto space-y-3">
						<AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
						<h3 className="text-base font-bold text-slate-900 dark:text-white">
							Gagal Mengambil Data Deteksi Cuti
						</h3>
						<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{error}</p>
						<button
							onClick={() => fetchData(false)}
							className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition min-h-[42px]"
						>
							<RefreshCw className="w-4 h-4" />
							<span>Coba Lagi</span>
						</button>
					</div>
				</div>
			) : leaveData.length === 0 ? (
				/* Empty state */
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
					<div className="max-w-md mx-auto space-y-3">
						<div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-slate-400">
							<Calendar className="w-8 h-8" />
						</div>
						<h3 className="text-base font-bold text-slate-900 dark:text-white">
							Tidak Ada Cuti Terjadwal Ditemukan
						</h3>
						<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
							Tidak ditemukan pengajuan cuti yang disetujui pada hari kerja dalam rentang tanggal dan kriteria filter yang dipilih.
						</p>
					</div>
				</div>
			) : (
				/* Data Table & Mobile Cards */
				<div className="space-y-4">
					{/* Desktop Table View */}
					<div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
								<thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
									<tr>
										<th scope="col" className="p-4 w-12 text-center">
											<div className="flex items-center justify-center">
												<input
													type="checkbox"
													aria-label="Pilih semua baris belum disetujui"
													checked={
														selectedKeys.size > 0 &&
														selectedKeys.size === selectableItems.length &&
														selectableItems.length > 0
													}
													onChange={handleToggleSelectAll}
													disabled={selectableItems.length === 0}
													className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer disabled:opacity-40 w-4 h-4"
												/>
											</div>
										</th>
										<th scope="col" className="py-3.5 px-4">
											Pegawai
										</th>
										<th scope="col" className="py-3.5 px-4">
											Tanggal & Shift
										</th>
										<th scope="col" className="py-3.5 px-4">
											Info Cuti
										</th>
										<th scope="col" className="py-3.5 px-4">
											Status Penilaian
										</th>
										<th scope="col" className="py-3.5 px-4 text-center">
											Aksi
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
									{paginatedData.map((item) => {
										const key = getItemKey(item);
										const isSelected = selectedKeys.has(key);
										const isApproved = item.status_bypass === "approved_100";

										return (
											<tr
												key={key}
												className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
													isSelected ? "bg-sky-50/40 dark:bg-sky-950/20" : ""
												}`}
											>
												<td className="p-4 text-center">
													<div className="flex items-center justify-center">
														<input
															type="checkbox"
															aria-label={`Pilih ${item.pegawai_nama} tanggal ${item.tanggal}`}
															checked={isSelected}
															onChange={() => handleToggleItem(item)}
															disabled={isApproved}
															className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-4 h-4"
														/>
													</div>
												</td>
												<td className="py-3.5 px-4">
													<div className="font-semibold text-slate-900 dark:text-white">
														{item.pegawai_nama}
													</div>
													<div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
														NIK: {item.nik}
													</div>
													<div className="mt-1">
														<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
															<Building2 className="w-3 h-3" />
															{item.departemen_nama || item.departemen || "Umum"}
														</span>
													</div>
												</td>
												<td className="py-3.5 px-4">
													<div className="font-medium text-slate-900 dark:text-white">
														{moment(item.tanggal).format("DD/MM/YYYY")}
													</div>
													<div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
														{moment(item.tanggal).format("dddd")}
													</div>
													<div className="mt-1">
														<span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
															<Clock className="w-3 h-3" />
															Shift: {item.shift}
														</span>
													</div>
												</td>
												<td className="py-3.5 px-4 space-y-1">
													<div>{getUrgensiBadge(item.urgensi)}</div>
													<div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
														<FileText className="w-3 h-3" />
														{item.no_pengajuan || "-"}
													</div>
												</td>
												<td className="py-3.5 px-4">{getStatusPenilaianBadge(item)}</td>
												<td className="py-3.5 px-4 text-center">
													{isApproved ? (
														<span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl min-h-[36px]">
															<Check className="w-3.5 h-3.5" />
															Selesai
														</span>
													) : (
														<button
															onClick={() => handleSingleBypass(item)}
															disabled={isProcessing}
															className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50 min-h-[36px]"
														>
															<Zap className="w-3.5 h-3.5" />
															<span>Bypass</span>
														</button>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{/* Mobile Responsive Cards View */}
					<div className="md:hidden space-y-3">
						{paginatedData.map((item) => {
							const key = getItemKey(item);
							const isSelected = selectedKeys.has(key);
							const isApproved = item.status_bypass === "approved_100";

							return (
								<div
									key={key}
									className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm space-y-3 transition ${
										isSelected
											? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/20"
											: "border-slate-200 dark:border-slate-800"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-start gap-3">
											<div className="min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1">
												<input
													type="checkbox"
													aria-label={`Pilih ${item.pegawai_nama} tanggal ${item.tanggal}`}
													checked={isSelected}
													onChange={() => handleToggleItem(item)}
													disabled={isApproved}
													className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed w-4 h-4"
												/>
											</div>
											<div>
												<h4 className="font-semibold text-slate-900 dark:text-white text-sm">
													{item.pegawai_nama}
												</h4>
												<p className="text-xs text-slate-500 dark:text-slate-400">
													NIK: {item.nik}
												</p>
											</div>
										</div>
										<div>{getUrgensiBadge(item.urgensi)}</div>
									</div>

									<div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
										<div>
											<span className="text-slate-400 block">Tanggal:</span>
											<span className="font-medium text-slate-800 dark:text-slate-200">
												{moment(item.tanggal).format("DD/MM/YYYY")} (
												{moment(item.tanggal).format("ddd")})
											</span>
										</div>
										<div>
											<span className="text-slate-400 block">Shift & Dept:</span>
											<span className="font-medium text-slate-800 dark:text-slate-200">
												{item.shift} • {item.departemen_nama || item.departemen}
											</span>
										</div>
									</div>

									<div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
										<div>{getStatusPenilaianBadge(item)}</div>
										<div>
											{isApproved ? (
												<span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl min-h-[44px]">
													<Check className="w-3.5 h-3.5" />
													Selesai
												</span>
											) : (
												<button
													onClick={() => handleSingleBypass(item)}
													disabled={isProcessing}
													className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50 min-h-[44px]"
												>
													<Zap className="w-3.5 h-3.5" />
													<span>Bypass</span>
												</button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Pagination Controls */}
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
							<span>
								Menampilkan{" "}
								<strong className="text-slate-700 dark:text-slate-200">
									{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
								</strong>{" "}
								-{" "}
								<strong className="text-slate-700 dark:text-slate-200">
									{Math.min(currentPage * pageSize, totalItems)}
								</strong>{" "}
								dari <strong className="text-slate-700 dark:text-slate-200">{totalItems}</strong> jadwal cuti
							</span>

							<div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
								<label htmlFor="select-page-size" className="sr-only">
									Jumlah data per halaman
								</label>
								<select
									id="select-page-size"
									value={pageSize}
									onChange={(e) => setPageSize(Number(e.target.value))}
									className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
								>
									<option value={10}>10 / hal</option>
									<option value={25}>25 / hal</option>
									<option value={50}>50 / hal</option>
									<option value={100}>100 / hal</option>
								</select>
							</div>
						</div>

						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								aria-label="Halaman sebelumnya"
								className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[38px] min-h-[38px] flex items-center justify-center"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>

							<span className="text-xs sm:text-sm font-medium px-3 text-slate-700 dark:text-slate-300">
								Hal {currentPage} dari {totalPages}
							</span>

							<button
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={currentPage >= totalPages}
								aria-label="Halaman berikutnya"
								className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[38px] min-h-[38px] flex items-center justify-center"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
			{confirmModal.isOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirm-modal-title"
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
				>
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
						<div className="flex items-start gap-3">
							<div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
								<Zap className="w-6 h-6" />
							</div>
							<div className="space-y-1">
								<h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
									{confirmModal.title}
								</h3>
								<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
									{confirmModal.description}
								</p>
							</div>
						</div>

						<div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 space-y-1.5">
							<div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
								<Check className="w-3.5 h-3.5 text-emerald-500" />
								<span>Dampak Bypass Sistem:</span>
							</div>
							<ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400 pl-1">
								<li>Penilaian harian otomatis dibuat/diupdate ke status Disetujui (Approved).</li>
								<li>Skor absensi dan kegiatan harian diatur ke 100%.</li>
								<li>Tercatat sumber absensi cuti & referensi nomor pengajuan resmi.</li>
							</ul>
						</div>

						<div className="flex items-center justify-end gap-2.5 pt-2">
							<button
								type="button"
								onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
								disabled={isProcessing}
								className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition min-h-[42px]"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={() => executeBypass(confirmModal.items)}
								disabled={isProcessing}
								className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm disabled:opacity-50 min-h-[42px]"
							>
								{isProcessing ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Memproses...</span>
									</>
								) : (
									<>
										<Zap className="w-4 h-4" />
										<span>Ya, Lakukan Bypass</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
