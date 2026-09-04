"use client";

import { useState, useEffect, useRef } from "react";
import moment from "moment";
import { SearchableSelect } from "@/components/ui/searchable-select";
import * as XLSX from "xlsx";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
	Search,
	Download,
	Upload,
	Calendar
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
	
	// Search & Status filter
	const [searchQuery, setSearchQuery] = useState("");
	const [departemenList, setDepartemenList] = useState([]);
	const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL", "ACTIVE", "EXPIRED"
	const [selectedBulan, setSelectedBulan] = useState("ALL"); // "ALL", "01" to "12"
	const [selectedTahun, setSelectedTahun] = useState("ALL"); // "ALL", "2026", etc.
	const [selectedIds, setSelectedIds] = useState([]);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

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

	useEffect(() => {
		setSelectedIds([]);
		setCurrentPage(1);
	}, [searchQuery, selectedUnitFilter, statusFilter, selectedBulan, selectedTahun]);

	// Import Excel Modal State
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [importBerlakuMulai, setImportBerlakuMulai] = useState(moment().format("YYYY-MM-DD"));
	const [importBerlakuSampai, setImportBerlakuSampai] = useState("");
	const [pendingImportFile, setPendingImportFile] = useState(null);
	const [importErrorList, setImportErrorList] = useState([]);

	const formModalRef = useRef(null);
	const importModalRef = useRef(null);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				if (isModalOpen) {
					setIsModalOpen(false);
					setErrorMsg("");
				}
				if (isImportModalOpen) {
					setIsImportModalOpen(false);
					setPendingImportFile(null);
					setErrorMsg("");
				}
			}

			if (e.key === "Tab") {
				const activeModal = isModalOpen ? formModalRef.current : isImportModalOpen ? importModalRef.current : null;
				if (!activeModal) return;

				const focusables = activeModal.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				if (!focusables.length) return;

				const firstEl = focusables[0];
				const lastEl = focusables[focusables.length - 1];

				if (e.shiftKey) {
					if (document.activeElement === firstEl) {
						lastEl.focus();
						e.preventDefault();
					}
				} else {
					if (document.activeElement === lastEl) {
						firstEl.focus();
						e.preventDefault();
					}
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isModalOpen, isImportModalOpen]);

	useEffect(() => {
		loadJasaDasarData();
		loadEmployees();
		loadDepartemen();
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

	const loadDepartemen = async () => {
		try {
			const res = await fetch("/api/departemen");
			if (res.ok) {
				const result = await res.json();
				if (result.status === "success") {
					setDepartemenList(result.data || []);
				}
			}
		} catch (err) {
			console.error("Gagal memuat departemen:", err);
		}
	};

	const handleOpenAdd = () => {
		setErrorMsg("");
		setSuccessMsg("");
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
		setErrorMsg("");
		setSuccessMsg("");
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

		if (berlakuSampai && berlakuMulai && berlakuSampai < berlakuMulai) {
			setErrorMsg("Tanggal berakhir berlaku tidak boleh lebih awal dari tanggal mulai");
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

	const handleDelete = (id) => {
		triggerConfirm({
			title: "Hapus Konfigurasi Jasa Dasar",
			description: "Apakah Anda yakin ingin menghapus konfigurasi jasa dasar ini?",
			confirmText: "Hapus",
			cancelText: "Batal",
			variant: "danger",
			onConfirm: async () => {
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
			}
		});
	};

	const handleBulkDelete = () => {
		if (selectedIds.length === 0) return;
		triggerConfirm({
			title: "Hapus Terpilih",
			description: `Apakah Anda yakin ingin menghapus ${selectedIds.length} konfigurasi jasa dasar terpilih?`,
			confirmText: "Hapus Terpilih",
			cancelText: "Batal",
			variant: "danger",
			onConfirm: async () => {
				setErrorMsg("");
				setSuccessMsg("");
				setLoading(true);
				try {
					const res = await fetch("/api/penilaian/jasa-dasar", {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ids: selectedIds })
					});
					const data = await res.json();
					if (!res.ok) throw new Error(data.error || "Gagal menghapus data");

					setSuccessMsg(`${selectedIds.length} konfigurasi jasa dasar berhasil dihapus!`);
					setSelectedIds([]);
					await loadJasaDasarData();
				} catch (err) {
					setErrorMsg(err.message);
					setLoading(false);
				}
			}
		});
	};

	const handleDownloadTemplate = () => {
		const sortedEmployees = [...employees].sort((a, b) => {
			const deptA = a.nama_departemen || "";
			const deptB = b.nama_departemen || "";
			if (deptA !== deptB) return deptA.localeCompare(deptB);
			return (a.label || "").localeCompare(b.label || "");
		});

		const wsDataInput = [
			["Departemen/Unit", "NIK", "Nama Pegawai", "Nominal Jasa Dasar", "Keterangan (Opsional)"]
		];
		sortedEmployees.forEach(emp => {
			wsDataInput.push([
				emp.nama_departemen || "Tanpa Departemen",
				emp.value || "",
				emp.label || "",
				"",
				""
			]);
		});
		const wsInput = XLSX.utils.aoa_to_sheet(wsDataInput);

		// Set column widths
		wsInput["!cols"] = [
			{ wch: 25 },
			{ wch: 15 },
			{ wch: 30 },
			{ wch: 20 },
			{ wch: 25 }
		];

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, wsInput, "Form Input");

		XLSX.writeFile(wb, "Template_Jasa_Dasar_Pegawai.xlsx");
	};

	const handleImportFileSelect = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		setPendingImportFile(file);
		setImportBerlakuMulai(moment().format("YYYY-MM-DD"));
		setImportBerlakuSampai("");
		setImportErrorList([]);
		setIsImportModalOpen(true);
		e.target.value = "";
	};

	const executeImportExcel = async () => {
		if (!pendingImportFile) return;

		setImportErrorList([]);

		if (importBerlakuSampai && importBerlakuMulai && importBerlakuSampai < importBerlakuMulai) {
			setImportErrorList(["Tanggal berakhir berlaku import tidak boleh lebih awal dari tanggal mulai."]);
			return;
		}

		const reader = new FileReader();
		reader.onload = async (evt) => {
			try {
				setErrorMsg("");
				setSuccessMsg("");
				setLoading(true);

				const bstr = evt.target.result;
				const wb = XLSX.read(bstr, { type: "binary" });
				
				const wsName = wb.SheetNames[0];
				const ws = wb.Sheets[wsName];
				const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

				if (data.length === 0) {
					setImportErrorList(["File Excel kosong atau format tidak sesuai."]);
					setLoading(false);
					return;
				}

				const importPayload = [];
				const errors = [];

				data.forEach((row, index) => {
					const normalizedRow = {};
					Object.keys(row).forEach(key => {
						const normalizedKey = key.toLowerCase().trim();
						normalizedRow[normalizedKey] = row[key];
					});

					const nikKey = Object.keys(normalizedRow).find(k => k.includes("nik"));
					const nominalKey = Object.keys(normalizedRow).find(k => k.includes("nominal") || k.includes("jasa dasar"));
					const keteranganKey = Object.keys(normalizedRow).find(k => k.includes("keterangan") || k.includes("catatan"));

					const nik = normalizedRow[nikKey]?.toString().trim();
					const nominalStr = normalizedRow[nominalKey]?.toString().trim();
					const keterangan = normalizedRow[keteranganKey]?.toString().trim() || "";

					const rowNum = index + 2;

					if (nominalStr === undefined || nominalStr === "") {
						return;
					}

					if (!nik) {
						errors.push(`Baris ${rowNum}: NIK kosong.`);
						return;
					}

					const emp = employees.find(e => e.value === nik);
					if (!emp) {
						errors.push(`Baris ${rowNum}: Pegawai dengan NIK "${nik}" tidak ditemukan di database.`);
						return;
					}

					const nominalNum = Number(nominalStr);
					if (isNaN(nominalNum) || nominalNum < 0) {
						errors.push(`Baris ${rowNum}: Nominal Jasa Dasar "${nominalStr}" tidak valid.`);
						return;
					}

					importPayload.push({
						pegawai_id: emp.id,
						nominal_jasa_dasar: nominalNum,
						berlaku_mulai: importBerlakuMulai,
						berlaku_sampai: importBerlakuSampai || null,
						keterangan: keterangan || null
					});
				});

				if (errors.length > 0) {
					setImportErrorList(errors);
					setLoading(false);
					return;
				}

				if (importPayload.length === 0) {
					setImportErrorList(["Tidak ada data nominal yang diisi untuk diimport."]);
					setLoading(false);
					return;
				}

				const res = await fetch("/api/penilaian/jasa-dasar", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(importPayload)
				});

				const result = await res.json();
				if (!res.ok) throw new Error(result.error || "Gagal menyimpan data import");

				setSuccessMsg(`Berhasil mengimport ${importPayload.length} data jasa dasar pegawai!`);
				setIsImportModalOpen(false);
				setPendingImportFile(null);
				setImportErrorList([]);
				await loadJasaDasarData();
			} catch (err) {
				console.error(err);
				setImportErrorList([err.message]);
			} finally {
				setLoading(false);
			}
		};
		reader.readAsBinaryString(pendingImportFile);
	};

	const MONTH_OPTIONS = [
		{ value: "01", label: "01 - Januari" },
		{ value: "02", label: "02 - Februari" },
		{ value: "03", label: "03 - Maret" },
		{ value: "04", label: "04 - April" },
		{ value: "05", label: "05 - Mei" },
		{ value: "06", label: "06 - Juni" },
		{ value: "07", label: "07 - Juli" },
		{ value: "08", label: "08 - Agustus" },
		{ value: "09", label: "09 - September" },
		{ value: "10", label: "10 - Oktober" },
		{ value: "11", label: "11 - November" },
		{ value: "12", label: "12 - Desember" }
	];

	const currentYearNum = parseInt(moment().format("YYYY"), 10);
	const availableYears = Array.from(
		new Set([
			currentYearNum + 1,
			currentYearNum,
			currentYearNum - 1,
			currentYearNum - 2,
			...jasaList.map(item => item.berlaku_mulai ? moment(item.berlaku_mulai).year() : null).filter(Boolean),
			...jasaList.map(item => item.berlaku_sampai ? moment(item.berlaku_sampai).year() : null).filter(Boolean)
		])
	).sort((a, b) => b - a);

	const hasActiveFilters = 
		searchQuery !== "" || 
		selectedUnitFilter !== "ALL" || 
		statusFilter !== "ALL" || 
		selectedBulan !== "ALL" || 
		selectedTahun !== "ALL";

	const handleResetFilters = () => {
		setSearchQuery("");
		setSelectedUnitFilter("ALL");
		setStatusFilter("ALL");
		setSelectedBulan("ALL");
		setSelectedTahun("ALL");
	};

	// Helper to check validity period overlap
	const checkPeriodOverlap = (item) => {
		if (selectedTahun === "ALL" && selectedBulan === "ALL") return true;

		const itemStart = item.berlaku_mulai ? moment(item.berlaku_mulai).startOf("day") : null;
		const itemEnd = item.berlaku_sampai ? moment(item.berlaku_sampai).endOf("day") : null;

		if (selectedTahun !== "ALL" && selectedBulan !== "ALL") {
			const periodStart = moment(`${selectedTahun}-${selectedBulan}-01`).startOf("month");
			const periodEnd = moment(`${selectedTahun}-${selectedBulan}-01`).endOf("month");
			return (!itemStart || itemStart.isSameOrBefore(periodEnd, "day")) &&
			       (!itemEnd || itemEnd.isSameOrAfter(periodStart, "day"));
		} else if (selectedTahun !== "ALL") {
			const periodStart = moment(`${selectedTahun}-01-01`).startOf("year");
			const periodEnd = moment(`${selectedTahun}-12-31`).endOf("year");
			return (!itemStart || itemStart.isSameOrBefore(periodEnd, "day")) &&
			       (!itemEnd || itemEnd.isSameOrAfter(periodStart, "day"));
		} else if (selectedBulan !== "ALL") {
			const currentY = moment().format("YYYY");
			const periodStart = moment(`${currentY}-${selectedBulan}-01`).startOf("month");
			const periodEnd = moment(`${currentY}-${selectedBulan}-01`).endOf("month");
			return (!itemStart || itemStart.isSameOrBefore(periodEnd, "day")) &&
			       (!itemEnd || itemEnd.isSameOrAfter(periodStart, "day"));
		}
		return true;
	};

	// Base list matching search, unit, and period
	const baseListForCounts = jasaList.filter(item => {
		const matchesSearch = 
			(item.nama_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.nik_pegawai || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.nama_departemen || "").toLowerCase().includes(searchQuery.toLowerCase());
		
		const matchesUnit = selectedUnitFilter === "ALL" || item.departemen_id === selectedUnitFilter;
		const matchesPeriod = checkPeriodOverlap(item);

		return matchesSearch && matchesUnit && matchesPeriod;
	});

	// Counts for tabs
	const totalCount = baseListForCounts.length;
	const activeCount = baseListForCounts.filter(item => !item.berlaku_sampai || moment().isSameOrBefore(item.berlaku_sampai, "day")).length;
	const expiredCount = baseListForCounts.filter(item => item.berlaku_sampai && moment().isAfter(item.berlaku_sampai, "day")).length;

	// Filter data
	const filteredList = baseListForCounts.filter(item => {
		const isExpired = item.berlaku_sampai && moment().isAfter(item.berlaku_sampai, "day");
		const matchesStatus = 
			statusFilter === "ALL" ? true :
			statusFilter === "ACTIVE" ? !isExpired :
			isExpired;
		
		return matchesStatus;
	});

	const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
	const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	// Format employees for SearchableSelect
	const employeeOptions = employees.map((emp) => ({
		value: emp.id,
		label: emp.label,
		sublabel: `NIK: ${emp.value} — ${emp.nama_departemen || ""}`
	}));

	// Format departemen for SearchableSelect
	const departemenOptions = [
		{ value: "ALL", label: "Semua Departemen / Unit" },
		...departemenList.map(dep => ({
			value: dep.dep_id,
			label: dep.nama
		}))
	];

	return (
		<div className="w-full p-4 md:p-6 space-y-6 font-noto-sans">
			{/* Header */}
			<div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
				<div>
					<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-900">Jasa Dasar Pegawai</h1>
					<p className="text-slate-500 text-sm mt-1">Konfigurasi nominal jasa dasar per pegawai sebagai acuan rekap bulanan.</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{selectedIds.length > 0 && (
						<button 
							type="button"
							onClick={handleBulkDelete}
							className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer active:opacity-90"
						>
							<Trash2 className="h-4 w-4 text-white" />
							Hapus Terpilih ({selectedIds.length})
						</button>
					)}

					<button 
						type="button"
						onClick={handleDownloadTemplate}
						className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-colors cursor-pointer active:opacity-90"
					>
						<Download className="h-4 w-4 text-emerald-600" />
						Download Template
					</button>

					<label 
						className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-colors cursor-pointer active:opacity-90"
					>
						<Upload className="h-4 w-4 text-sky-600" />
						Import Excel
						<input 
							type="file" 
							accept=".xlsx, .xls" 
							onChange={handleImportFileSelect} 
							className="hidden" 
						/>
					</label>

					<button 
						type="button"
						onClick={handleOpenAdd}
						className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer active:opacity-90"
					>
						<Plus className="h-4 w-4 text-white" />
						Tambah Jasa Dasar
					</button>
				</div>
			</div>

			{errorMsg && !isModalOpen && (
				<div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start justify-between gap-3 animate-fadeIn">
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
						<span className="font-semibold text-sm">{errorMsg}</span>
					</div>
					<button 
						type="button" 
						onClick={() => setErrorMsg("")} 
						aria-label="Tutup pesan error"
						className="text-rose-400 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}

			{successMsg && (
				<div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start justify-between gap-3 animate-fadeIn">
					<div className="flex items-start gap-3">
						<CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
						<span className="font-semibold text-sm">{successMsg}</span>
					</div>
					<button 
						type="button" 
						onClick={() => setSuccessMsg("")} 
						aria-label="Tutup pesan sukses"
						className="text-emerald-400 hover:text-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Status Filter Tabs */}
			<div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-1">
				<button
					type="button"
					onClick={() => setStatusFilter("ALL")}
					className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
						statusFilter === "ALL" 
							? "bg-slate-900 text-white shadow-sm" 
							: "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
					}`}
				>
					Semua
					<span className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-semibold ${
						statusFilter === "ALL" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
					}`}>
						{totalCount}
					</span>
				</button>
				<button
					type="button"
					onClick={() => setStatusFilter("ACTIVE")}
					className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
						statusFilter === "ACTIVE" 
							? "bg-emerald-700 text-white shadow-sm" 
							: "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80"
					}`}
				>
					Aktif
					<span className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-semibold ${
						statusFilter === "ACTIVE" ? "bg-emerald-800 text-white" : "bg-emerald-100 text-emerald-800"
					}`}>
						{activeCount}
					</span>
				</button>
				<button
					type="button"
					onClick={() => setStatusFilter("EXPIRED")}
					className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
						statusFilter === "EXPIRED" 
							? "bg-rose-700 text-white shadow-sm" 
							: "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80"
					}`}
				>
					Kedaluwarsa
					<span className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-semibold ${
						statusFilter === "EXPIRED" ? "bg-rose-800 text-white" : "bg-rose-100 text-rose-800"
					}`}>
						{expiredCount}
					</span>
				</button>
			</div>

			{/* Search & Filter Bar */}
			<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
				{/* Top Row: Search & Unit Filter */}
				<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
					<div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
						<Search className="h-4 w-4 text-slate-400 shrink-0" />
						<input 
							type="text" 
							placeholder="Cari berdasarkan nama, NIK, atau departemen pegawai..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full text-sm text-slate-700 bg-transparent focus:outline-none placeholder-slate-400 font-medium"
						/>
						{searchQuery && (
							<button 
								type="button" 
								onClick={() => setSearchQuery("")}
								className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
								aria-label="Hapus teks pencarian"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
					<div className="w-full md:w-72">
						<SearchableSelect 
							options={departemenOptions}
							value={selectedUnitFilter}
							onChange={setSelectedUnitFilter}
							placeholder="Filter Unit / Departemen..."
						/>
					</div>
				</div>

				{/* Bottom Row: Periode Berlaku (Bulan, Tahun, and Reset) */}
				<div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
					<div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 font-figtree">
						<Calendar className="h-4 w-4 text-sky-600 shrink-0" />
						<span>Periode Berlaku:</span>
					</div>

					<div className="w-40 sm:w-44">
						<select
							value={selectedBulan}
							onChange={(e) => setSelectedBulan(e.target.value)}
							aria-label="Filter Bulan"
							className="w-full h-9 px-3 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
						>
							<option value="ALL">Semua Bulan</option>
							{MONTH_OPTIONS.map((m) => (
								<option key={m.value} value={m.value}>{m.label}</option>
							))}
						</select>
					</div>

					<div className="w-32 sm:w-36">
						<select
							value={selectedTahun}
							onChange={(e) => setSelectedTahun(e.target.value)}
							aria-label="Filter Tahun"
							className="w-full h-9 px-3 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
						>
							<option value="ALL">Semua Tahun</option>
							{availableYears.map((y) => (
								<option key={y} value={String(y)}>{y}</option>
							))}
						</select>
					</div>

					{hasActiveFilters && (
						<button
							type="button"
							onClick={handleResetFilters}
							className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 ml-auto"
						>
							<X className="h-3.5 w-3.5" />
							Reset Filter
						</button>
					)}
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
				</div>
			) : filteredList.length === 0 ? (
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm text-slate-500 font-medium space-y-3">
					<p>Tidak ada konfigurasi jasa dasar ditemukan untuk kriteria filter yang dipilih.</p>
					{hasActiveFilters && (
						<button
							type="button"
							onClick={handleResetFilters}
							className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
						>
							<X className="h-3.5 w-3.5" />
							Reset Semua Filter
						</button>
					)}
				</div>
			) : (
				<div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs">
								<tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider font-figtree">
									<th className="px-5 py-3.5 w-10">
										<input 
											type="checkbox"
											aria-label="Pilih semua baris jasa dasar pada halaman ini"
											checked={paginatedList.length > 0 && paginatedList.every(item => selectedIds.includes(item.id))}
											onChange={(e) => {
												if (e.target.checked) {
													const newIds = Array.from(new Set([...selectedIds, ...paginatedList.map(item => item.id)]));
													setSelectedIds(newIds);
												} else {
													const pageIds = paginatedList.map(item => item.id);
													setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
												}
											}}
											className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
										/>
									</th>
									<th className="px-5 py-3.5">Pegawai</th>
									<th className="px-5 py-3.5 text-right">Nominal Jasa Dasar</th>
									<th className="px-5 py-3.5">Mulai Berlaku</th>
									<th className="px-5 py-3.5">Berakhir Berlaku</th>
									<th className="px-5 py-3.5">Keterangan</th>
									<th className="px-5 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
								{paginatedList.map((row) => (
									<tr key={row.id} className={`hover:bg-slate-50/60 transition-colors ${selectedIds.includes(row.id) ? 'bg-sky-50/40' : ''}`}>
										<td className="px-5 py-4 w-10">
											<input 
												type="checkbox"
												aria-label={`Pilih baris ${row.nama_pegawai}`}
												checked={selectedIds.includes(row.id)}
												onChange={(e) => {
													if (e.target.checked) {
														setSelectedIds([...selectedIds, row.id]);
													} else {
														setSelectedIds(selectedIds.filter(id => id !== row.id));
													}
												}}
												className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
											/>
										</td>
										<td className="px-5 py-4">
											<span className="font-bold text-slate-800 block text-sm">{row.nama_pegawai}</span>
											<span className="text-[10px] text-slate-500 block mt-0.5">NIK: {row.nik_pegawai} — {row.nama_departemen}</span>
										</td>
										<td className="px-5 py-4 text-right font-bold text-slate-900 tabular-nums text-sm">
											Rp {Number(row.nominal_jasa_dasar).toLocaleString("id-ID")}
										</td>
										<td className="px-5 py-4 font-semibold text-slate-600">
											{moment(row.berlaku_mulai).format("DD/MM/YYYY")}
										</td>
										<td className="px-5 py-4 text-slate-600 font-semibold">
											<div>{row.berlaku_sampai ? moment(row.berlaku_sampai).format("DD/MM/YYYY") : "-"}</div>
											<div className="mt-1">
												{(!row.berlaku_sampai || moment().isSameOrBefore(row.berlaku_sampai, "day")) ? (
													<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
														Aktif
													</span>
												) : (
													<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
														Kedaluwarsa
													</span>
												)}
											</div>
										</td>
										<td className="px-5 py-4 text-slate-500 max-w-xs truncate font-medium">
											{row.keterangan || "-"}
										</td>
										<td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
											<button 
												type="button"
												onClick={() => handleOpenEdit(row)}
												aria-label={`Edit jasa dasar ${row.nama_pegawai}`}
												className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button 
												type="button"
												onClick={() => handleDelete(row.id)}
												aria-label={`Hapus jasa dasar ${row.nama_pegawai}`}
												className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Pagination Controls */}
					{filteredList.length > 0 && (
						<div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
							<div className="flex items-center gap-2">
								<span>Baris per halaman:</span>
								<select
									value={pageSize}
									onChange={(e) => {
										setPageSize(Number(e.target.value));
										setCurrentPage(1);
									}}
									aria-label="Jumlah baris per halaman"
									className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-600 cursor-pointer"
								>
									<option value={10}>10</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
								<span className="text-slate-400">|</span>
								<span className="tabular-nums font-medium text-slate-600">
									Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredList.length)} dari {filteredList.length} data
								</span>
							</div>

							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
								>
									Sebelumnya
								</button>
								<span className="px-2.5 py-1 text-xs font-bold text-slate-800 tabular-nums">
									{currentPage} / {totalPages}
								</span>
								<button
									type="button"
									onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
									disabled={currentPage >= totalPages}
									className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
								>
									Berikutnya
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Form Modal */}
			{isModalOpen && (
				<div 
					role="dialog"
					aria-modal="true"
					aria-labelledby="modal-form-title"
					onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
					className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
				>
					<div ref={formModalRef} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
						{/* Header */}
						<div className="bg-slate-50 px-6 py-4 text-slate-800 flex justify-between items-center border-b border-slate-200">
							<h3 id="modal-form-title" className="font-extrabold text-lg font-figtree text-slate-900">
								{modalMode === "add" ? "Tambah Jasa Dasar Baru" : "Edit Jasa Dasar Pegawai"}
							</h3>
							<button 
								type="button"
								onClick={() => setIsModalOpen(false)} 
								aria-label="Tutup modal"
								className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
								{errorMsg && (
									<div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs animate-fadeIn">
										<AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
										<span className="font-semibold">{errorMsg}</span>
									</div>
								)}

								<div className="space-y-1.5">
									<label htmlFor="form-pegawai" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Pilih Pegawai</label>
									<SearchableSelect 
										id="form-pegawai"
										options={employeeOptions}
										value={pegawaiId}
										onChange={setPegawaiId}
										disabled={modalMode === "edit"}
										placeholder="Pilih Pegawai..."
									/>
								</div>

								<div className="space-y-1.5">
									<div className="flex justify-between items-center">
										<label htmlFor="form-nominal" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Nominal Jasa Dasar (Rp)</label>
										{nominal && !isNaN(Number(nominal)) && Number(nominal) > 0 && (
											<span aria-live="polite" className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 tabular-nums">
												Rp {Number(nominal).toLocaleString("id-ID")}
											</span>
										)}
									</div>
									<input 
										id="form-nominal"
										type="number"
										min="0"
										step="1000"
										value={nominal}
										onChange={(e) => setNominal(e.target.value)}
										placeholder="Contoh: 3000000"
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-800 font-semibold transition-colors"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label htmlFor="form-berlaku-mulai" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Mulai Berlaku</label>
										<input 
											id="form-berlaku-mulai"
											type="date"
											value={berlakuMulai}
											onChange={(e) => setBerlakuMulai(e.target.value)}
											required
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-800 font-semibold transition-colors"
										/>
									</div>
									<div className="space-y-1.5">
										<label htmlFor="form-berlaku-sampai" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Berakhir Berlaku</label>
										<input 
											id="form-berlaku-sampai"
											type="date"
											min={berlakuMulai}
											value={berlakuSampai}
											onChange={(e) => setBerlakuSampai(e.target.value)}
											className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-800 font-semibold transition-colors"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="form-keterangan" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Keterangan</label>
									<input 
										id="form-keterangan"
										type="text"
										value={keterangan}
										onChange={(e) => setKeterangan(e.target.value)}
										placeholder="Catatan tambahan"
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-800 font-semibold transition-colors"
									/>
								</div>
							</div>

							{/* Footer */}
							<div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
								<button 
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button 
									type="submit"
									disabled={saving}
									className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-200 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
								>
									{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
									Simpan Konfigurasi
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Import Date Selection Modal */}
			{isImportModalOpen && (
				<div 
					role="dialog"
					aria-modal="true"
					aria-labelledby="modal-import-title"
					onClick={(e) => { if (e.target === e.currentTarget) { setIsImportModalOpen(false); setPendingImportFile(null); } }}
					className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
				>
					<div ref={importModalRef} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
						{/* Header */}
						<div className="bg-slate-50 px-6 py-4 text-slate-800 flex justify-between items-center border-b border-slate-200">
							<h3 id="modal-import-title" className="font-extrabold text-lg font-figtree text-slate-900">
								Tanggal Masa Berlaku Import
							</h3>
							<button 
								type="button"
								onClick={() => { setIsImportModalOpen(false); setPendingImportFile(null); }} 
								aria-label="Tutup modal import"
								className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Form */}
						<div className="p-6 space-y-4">
							{importErrorList.length > 0 && (
								<div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-1.5 text-xs max-h-40 overflow-y-auto animate-fadeIn">
									<div className="font-bold flex items-center gap-1.5 text-rose-900">
										<AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
										Validasi Import Gagal ({importErrorList.length} kesalahan):
									</div>
									<ul className="list-disc list-inside space-y-0.5 text-rose-700">
										{importErrorList.slice(0, 8).map((err, idx) => (
											<li key={idx}>{err}</li>
										))}
										{importErrorList.length > 8 && (
											<li className="font-semibold italic">...dan {importErrorList.length - 8} baris lainnya</li>
										)}
									</ul>
								</div>
							)}

							<div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-800 space-y-1">
								<div className="font-bold flex items-center gap-1.5 text-sky-900">
									<Info className="h-4 w-4 shrink-0" />
									Informasi Masa Berlaku
								</div>
								<p className="font-medium">
									{pendingImportFile ? (
										<span>File: <strong className="text-sky-950 font-semibold">{pendingImportFile.name}</strong>. </span>
									) : null}
									Pilih tanggal mulai berlaku dan berakhir berlaku untuk seluruh data jasa dasar yang diimport dalam file ini.
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label htmlFor="import-berlaku-mulai" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Mulai Berlaku</label>
									<input 
										id="import-berlaku-mulai"
										type="date"
										value={importBerlakuMulai}
										onChange={(e) => setImportBerlakuMulai(e.target.value)}
										required
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-800 font-semibold transition-colors"
									/>
								</div>
								<div className="space-y-1.5">
									<label htmlFor="import-berlaku-sampai" className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-figtree">Berakhir Berlaku</label>
									<input 
										id="import-berlaku-sampai"
										type="date"
										min={importBerlakuMulai}
										value={importBerlakuSampai}
										onChange={(e) => setImportBerlakuSampai(e.target.value)}
										className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-sm text-slate-800 font-semibold transition-colors"
									/>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
							<button 
								type="button"
								onClick={() => {
									setIsImportModalOpen(false);
									setPendingImportFile(null);
								}}
								className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button 
								type="button"
								onClick={executeImportExcel}
								className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
							>
								Proses Import
							</button>
						</div>
					</div>
				</div>
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
