"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
	Bell,
	Send,
	RotateCcw,
	User,
	Users,
	Building2,
	Smartphone,
	ExternalLink,
	ArrowLeft,
	Loader2,
	AlertTriangle,
	CheckCircle2,
	Clock,
	History,
	Sparkles,
	Copy,
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";

const QUICK_ROUTES = [
	{ label: "Tukar Dinas", path: "/dashboard/pengajuan-tukar-dinas" },
	{ label: "Cuti", path: "/dashboard/cuti" },
	{ label: "Kinerja", path: "/dashboard/penilaian-kinerja" },
	{ label: "Slip Gaji", path: "/dashboard/penggajian" },
	{ label: "Tiket IT", path: "/dashboard/ticket" },
];

const CLINICAL_PRESETS = [
	{
		badge: "STR/SIP",
		title: "Peringatan Masa Berlaku STR/SIP",
		message:
			"Masa berlaku STR/SIP Anda segera berakhir. Mohon periksa tanggal kedaluwarsa dan unggah berkas perpanjangan ke SDM.",
		url: "/dashboard/profile",
	},
	{
		badge: "Tukar Dinas",
		title: "Persetujuan Tukar Dinas",
		message:
			"Terdapat permohonan tukar dinas baru yang memerlukan verifikasi atau persetujuan kepala ruangan/supervisor.",
		url: "/dashboard/pengajuan-tukar-dinas",
	},
	{
		badge: "Jadwal Shift",
		title: "Pembaruan Jadwal Dinas Shift",
		message:
			"Jadwal dinas baru telah dipublikasikan. Silakan periksa kalender tugas dan rotasi shift Anda di portal SDM.",
		url: "/dashboard/jadwal",
	},
	{
		badge: "Pengajuan Cuti",
		title: "Pengingat Batas Pengajuan Cuti",
		message:
			"Batas pengajuan cuti periode ini segera ditutup. Silakan lengkapi permohonan cuti sebelum batas waktu verifikasi.",
		url: "/dashboard/cuti",
	},
];

export default function AdminPushNotificationPage() {
	const [targetType, setTargetType] = useState("single");
	const [selectedNik, setSelectedNik] = useState("");
	const [selectedDept, setSelectedDept] = useState("");
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [url, setUrl] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);

	const [employees, setEmployees] = useState([]);
	const [isLoadingPegawai, setIsLoadingPegawai] = useState(true);
	const [sentHistory, setSentHistory] = useState([]);

	useEffect(() => {
		async function fetchPegawai() {
			try {
				setIsLoadingPegawai(true);
				const res = await fetch("/api/pegawai");
				const json = await res.json();
				if (json.status === "success" && Array.isArray(json.data)) {
					setEmployees(json.data);
				} else {
					toast.error("Gagal memuat daftar pegawai");
				}
			} catch (err) {
				console.error("Error fetching pegawai:", err);
				toast.error("Koneksi gagal saat memuat daftar pegawai");
			} finally {
				setIsLoadingPegawai(false);
			}
		}

		fetchPegawai();

		// Load local sent history if available
		try {
			const saved = localStorage.getItem("sdm_push_history");
			if (saved) {
				setSentHistory(JSON.parse(saved));
			}
		} catch (e) {
			console.warn("Failed to load sent history:", e);
		}
	}, []);

	const saveToHistory = (entry) => {
		try {
			const updated = [entry, ...sentHistory.slice(0, 9)];
			setSentHistory(updated);
			localStorage.setItem("sdm_push_history", JSON.stringify(updated));
		} catch (e) {
			console.warn("Failed to persist history:", e);
		}
	};

	const employeeOptions = useMemo(
		() =>
			employees.map((emp) => ({
				value: emp.value,
				label: emp.label,
				sublabel: `${emp.value}${emp.nama_departemen ? ` • ${emp.nama_departemen}` : ""}`,
			})),
		[employees]
	);

	const departmentOptions = useMemo(() => {
		const deptMap = new Map();
		employees.forEach((emp) => {
			if (emp.departemen) {
				deptMap.set(emp.departemen, emp.nama_departemen || emp.departemen);
			}
		});
		return Array.from(deptMap.entries())
			.map(([dep_id, dep_name]) => ({
				value: dep_id,
				label: dep_name,
				sublabel: `${employees.filter((e) => e.departemen === dep_id).length} Pegawai Aktif`,
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [employees]);

	const selectedEmployee = employees.find((e) => e.value === selectedNik);
	const selectedDeptObj = departmentOptions.find((d) => d.value === selectedDept);
	const deptEmployees = useMemo(
		() => employees.filter((e) => e.departemen === selectedDept),
		[employees, selectedDept]
	);

	const isFormDirty = !!(title || message || url || selectedNik || selectedDept);

	const handleResetForm = () => {
		setTargetType("single");
		setSelectedNik("");
		setSelectedDept("");
		setTitle("");
		setMessage("");
		setUrl("");
		setIsResetModalOpen(false);
		toast.info("Formulir telah dikosongkan");
	};

	const handleResetClick = () => {
		if (isFormDirty) {
			setIsResetModalOpen(true);
		} else {
			handleResetForm();
		}
	};

	const handleApplyPreset = (preset) => {
		setTitle(preset.title);
		setMessage(preset.message);
		setUrl(preset.url);
		toast.success(`Template "${preset.badge}" diterapkan`);
	};

	const handlePrefill = (item) => {
		setTitle(item.title || "");
		setMessage(item.message || "");
		setUrl(item.url || "");
		if (item.targetType) {
			setTargetType(item.targetType);
		}
		if (item.recipientNik) {
			setSelectedNik(item.recipientNik);
		}
		if (item.department) {
			setSelectedDept(item.department);
		}
		toast.success("Data notifikasi disalin ke formulir");
	};

	const handleOpenConfirm = (e) => {
		if (e?.preventDefault) e.preventDefault();

		if (targetType === "single" && !selectedNik) {
			toast.error("Pilih pegawai tujuan terlebih dahulu");
			return;
		}

		if (targetType === "department" && !selectedDept) {
			toast.error("Pilih unit/departemen tujuan terlebih dahulu");
			return;
		}

		if (!title.trim()) {
			toast.error("Judul notifikasi wajib diisi");
			return;
		}

		if (!message.trim()) {
			toast.error("Isi pesan notifikasi wajib diisi");
			return;
		}

		setIsConfirmModalOpen(true);
	};

	// Alex Power User accelerator: Cmd+Enter or Ctrl+Enter to submit
	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				if (!isConfirmModalOpen && !isResetModalOpen && !isSending) {
					e.preventDefault();
					handleOpenConfirm();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		title,
		message,
		targetType,
		selectedNik,
		selectedDept,
		isConfirmModalOpen,
		isResetModalOpen,
		isSending,
	]);

	const handleExecuteSend = async () => {
		setIsSending(true);

		try {
			const deptNiks =
				targetType === "department"
					? deptEmployees.map((e) => String(e.value))
					: undefined;

			const payload = {
				target_type: targetType,
				external_id: targetType === "single" ? selectedNik : undefined,
				department: targetType === "department" ? selectedDept : undefined,
				external_ids: targetType === "department" ? deptNiks : undefined,
				title: title.trim(),
				message: message.trim(),
				url: url.trim() || undefined,
			};

			const res = await fetch("/api/admin/push-notification", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const json = await res.json();

			if (!res.ok || json.status === "error") {
				const errMsg =
					json.error?.invalid_external_user_ids?.length > 0
						? `Pegawai (${json.error.invalid_external_user_ids.join(", ")}) belum mengaktifkan push notification di perangkatnya.`
						: typeof json.error === "string"
						? json.error
						: "Gagal mengirim push notification.";
				toast.error(errMsg);
				return;
			}

			toast.success(
				targetType === "all"
					? "Push notification broadcast berhasil dikirim ke seluruh pegawai!"
					: targetType === "department"
					? `Push notification berhasil dikirim ke unit ${selectedDeptObj?.label || selectedDept} (${deptEmployees.length} pegawai)`
					: `Push notification berhasil dikirim ke ${selectedEmployee?.label || selectedNik}`
			);

			// Append to sent audit history
			saveToHistory({
				id: json.data?.id || `push-${Date.now()}`,
				timestamp: new Date().toISOString(),
				targetType,
				department: targetType === "department" ? selectedDept : null,
				recipientName:
					targetType === "all"
						? "Semua Pegawai (Broadcast)"
						: targetType === "department"
						? `Unit: ${selectedDeptObj?.label || selectedDept} (${deptEmployees.length} org)`
						: selectedEmployee?.label || selectedNik,
				recipientNik: targetType === "single" ? selectedNik : null,
				title: title.trim(),
				message: message.trim(),
				url: url.trim() || null,
			});

			// Reset content fields
			setTitle("");
			setMessage("");
			setUrl("");
			setIsConfirmModalOpen(false);
		} catch (err) {
			console.error("Error sending push notification:", err);
			toast.error("Terjadi kesalahan jaringan saat mengirim notifikasi");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
			{/* Breadcrumb & Header */}
			<div>
				<div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2 font-figtree">
					<Link
						href="/dashboard/admin/settings"
						className="hover:text-sky-600 flex items-center gap-1 transition-colors"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						Pengaturan Sistem
					</Link>
					<span>/</span>
					<span className="text-slate-800">Notifikasi Push</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-figtree flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
								<Bell className="w-5 h-5" />
							</div>
							Kirim Push Notification
						</h1>
						<p className="text-sm text-slate-600 mt-1">
							Kirim pesan siaran per unit kerja, seluruh pegawai, atau notifikasi personal ke perangkat pegawai terdaftar
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
							<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
							OneSignal Aktif
						</span>
					</div>
				</div>
			</div>

			{/* Main Grid: Form (7 cols) + Preview & History (5 cols) */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left Column: Form Card */}
				<div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
					<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Send className="w-4 h-4 text-sky-600" />
							<h2 className="text-sm font-bold text-slate-900 font-figtree">
								Formulir Notifikasi
							</h2>
						</div>
						{isFormDirty && (
							<button
								type="button"
								onClick={handleResetClick}
								className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
							>
								<RotateCcw className="w-3.5 h-3.5" />
								Reset
							</button>
						)}
					</div>

					{/* Clinical Template Presets Bar */}
					<div className="px-6 pt-4 pb-2 bg-slate-50/70 border-b border-slate-100">
						<div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-figtree mb-2">
							<Sparkles className="w-3.5 h-3.5 text-sky-600" />
							<span>Template Notifikasi Cepat SDM:</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{CLINICAL_PRESETS.map((preset) => (
								<button
									key={preset.badge}
									type="button"
									onClick={() => handleApplyPreset(preset)}
									className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
								>
									{preset.badge}
								</button>
							))}
						</div>
					</div>

					<form onSubmit={handleOpenConfirm} className="p-6 space-y-5">
						{/* Target Type Selector (Accessible Radiogroup) */}
						<div>
							<label
								id="target-type-label"
								className="block text-xs font-bold text-slate-700 mb-2 font-figtree uppercase tracking-wider"
							>
								Sasaran Penerima <span className="text-rose-500">*</span>
							</label>
							<div
								role="radiogroup"
								aria-labelledby="target-type-label"
								className="grid grid-cols-1 sm:grid-cols-3 gap-2"
							>
								<button
									type="button"
									role="radio"
									aria-checked={targetType === "single"}
									onClick={() => setTargetType("single")}
									className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
										targetType === "single"
											? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs ring-1 ring-sky-500/20"
											: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
									}`}
								>
									<User className="w-4 h-4 shrink-0" />
									Pegawai Tertentu
								</button>
								<button
									type="button"
									role="radio"
									aria-checked={targetType === "department"}
									onClick={() => setTargetType("department")}
									className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
										targetType === "department"
											? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs ring-1 ring-sky-500/20"
											: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
									}`}
								>
									<Building2 className="w-4 h-4 shrink-0" />
									Unit / Departemen
								</button>
								<button
									type="button"
									role="radio"
									aria-checked={targetType === "all"}
									onClick={() => setTargetType("all")}
									className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
										targetType === "all"
											? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs ring-1 ring-sky-500/20"
											: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
									}`}
								>
									<Users className="w-4 h-4 shrink-0" />
									Semua Pegawai
								</button>
							</div>
						</div>

						{/* Dynamic Target Selection UI */}
						{targetType === "single" ? (
							<div>
								<label
									htmlFor="push-employee"
									className="block text-xs font-bold text-slate-700 mb-1.5 font-figtree uppercase tracking-wider"
								>
									Pilih Pegawai <span className="text-rose-500">*</span>
								</label>
								<SearchableSelect
									id="push-employee"
									options={employeeOptions}
									value={selectedNik}
									onChange={(val) => setSelectedNik(val)}
									placeholder={
										isLoadingPegawai
											? "Memuat data pegawai..."
											: "Cari nama pegawai atau NIK..."
									}
									disabled={isLoadingPegawai}
								/>
								{selectedEmployee && (
									<div className="mt-2.5 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
										<div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0">
											{selectedEmployee.label?.[0]?.toUpperCase() || "P"}
										</div>
										<div className="min-w-0 flex-1">
											<p className="font-bold text-slate-900 truncate">
												{selectedEmployee.label}
											</p>
											<p className="text-slate-500 font-mono text-[11px]">
												NIK: {selectedEmployee.value} •{" "}
												{selectedEmployee.nama_departemen || "Umum"}
											</p>
										</div>
									</div>
								)}
							</div>
						) : targetType === "department" ? (
							<div>
								<label
									htmlFor="push-department"
									className="block text-xs font-bold text-slate-700 mb-1.5 font-figtree uppercase tracking-wider"
								>
									Pilih Unit / Departemen <span className="text-rose-500">*</span>
								</label>
								<SearchableSelect
									id="push-department"
									options={departmentOptions}
									value={selectedDept}
									onChange={(val) => setSelectedDept(val)}
									placeholder={
										isLoadingPegawai
											? "Memuat daftar unit..."
											: "Pilih unit/departemen sasaran (contoh: IGD, ICU, Bangsal)..."
									}
									disabled={isLoadingPegawai}
								/>
								{selectedDeptObj && (
									<div className="mt-2.5 flex items-center justify-between p-3 bg-sky-50/60 border border-sky-200/80 rounded-lg text-xs text-sky-900">
										<div className="flex items-center gap-2.5">
											<Building2 className="w-4 h-4 text-sky-600 shrink-0" />
											<span className="font-bold">
												Unit {selectedDeptObj.label}
											</span>
										</div>
										<span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold font-mono text-[11px]">
											{deptEmployees.length} Pegawai Terdaftar
										</span>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900 leading-relaxed">
								<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
								<div>
									<p className="font-bold text-amber-950">
										Peringatan Siaran Massal
									</p>
									<p className="mt-0.5 text-amber-800 text-[11.5px]">
										Pesan akan dikirimkan ke seluruh perangkat ({employees.length} pegawai) yang saat ini terdaftar dan mengaktifkan notifikasi push.
									</p>
								</div>
							</div>
						)}

						{/* Notification Title */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label
									htmlFor="push-title"
									className="block text-xs font-bold text-slate-700 font-figtree uppercase tracking-wider"
								>
									Judul Notifikasi <span className="text-rose-500">*</span>
								</label>
								<span
									className={`text-[11px] font-mono ${
										title.length > 45 ? "text-amber-600 font-bold" : "text-slate-400"
									}`}
								>
									{title.length}/50
								</span>
							</div>
							<input
								id="push-title"
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								maxLength={50}
								placeholder="Contoh: Pengumuman Jadwal Dinas Baru"
								className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-sans"
							/>
							{title.length > 45 && (
								<p className="text-[11px] text-amber-600 mt-1 font-medium">
									Judul mendekati batas ideal layar ponsel agar tidak terpotong.
								</p>
							)}
						</div>

						{/* Notification Body */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label
									htmlFor="push-message"
									className="block text-xs font-bold text-slate-700 font-figtree uppercase tracking-wider"
								>
									Isi Pesan Notifikasi <span className="text-rose-500">*</span>
								</label>
								<span className="text-[11px] font-mono text-slate-400">
									{message.length}/500
								</span>
							</div>
							<textarea
								id="push-message"
								rows={4}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								maxLength={500}
								placeholder="Tuliskan pesan notifikasi secara padat dan jelas untuk pegawai..."
								className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-sans resize-y"
							/>
						</div>

						{/* Destination URL */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label
									htmlFor="push-url"
									className="block text-xs font-bold text-slate-700 font-figtree uppercase tracking-wider"
								>
									Tautan Tujuan / Deep Link{" "}
									<span className="text-slate-400 font-normal font-sans text-[11px] lowercase">
										(opsional)
									</span>
								</label>
							</div>
							<div className="relative">
								<input
									id="push-url"
									type="text"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="/dashboard/penilaian-kinerja atau https://..."
									className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-mono text-xs"
								/>
								<ExternalLink className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
							</div>

							{/* Quick Route Suggestions */}
							<div className="mt-2 flex flex-wrap items-center gap-1.5">
								<span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mr-1">
									Rekomendasi:
								</span>
								{QUICK_ROUTES.map((route) => (
									<button
										key={route.path}
										type="button"
										onClick={() => setUrl(route.path)}
										className={`px-2 py-0.5 text-[11px] rounded-md border font-medium transition-colors ${
											url === route.path
												? "bg-sky-100 border-sky-300 text-sky-800 font-bold"
												: "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
										}`}
									>
										{route.label}
									</button>
								))}
							</div>
						</div>

						{/* Submit Action Controls */}
						<div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
							<span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
								Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Cmd/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Enter</kbd> untuk kirim
							</span>
							<div className="flex items-center gap-2.5 ml-auto">
								<button
									type="button"
									onClick={handleResetClick}
									disabled={!isFormDirty || isSending}
									className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
								>
									Batal / Bersihkan
								</button>
								<button
									type="submit"
									disabled={isSending}
									className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none font-figtree tracking-wide"
								>
									{isSending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Mengirimkan...
										</>
									) : (
										<>
											<Send className="w-4 h-4" />
											Kirim Notifikasi
										</>
									)}
								</button>
							</div>
						</div>
					</form>
				</div>

				{/* Right Column: Clinical Preview & Sent History (5 cols) */}
				<div className="lg:col-span-5 space-y-6">
					{/* Clinical Preview Card */}
					<div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
						<div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Smartphone className="w-4 h-4 text-sky-600" />
								<h2 className="text-xs font-bold text-slate-900 font-figtree uppercase tracking-wider">
									Pratinjau Notifikasi
								</h2>
							</div>
							<span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
								Live
							</span>
						</div>

						<div className="p-5" aria-live="polite">
							<div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-2.5 transition-all">
								{/* Notification Header */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
											H
										</div>
										<div className="flex items-center gap-1.5">
											<span className="text-xs font-bold text-slate-900 font-figtree">
												SDM Handal
											</span>
											<span className="text-[10.5px] text-slate-400">• Baru saja</span>
										</div>
									</div>
									<span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
										{targetType === "all"
											? "Broadcast"
											: targetType === "department"
											? "Per Unit"
											: "Personal"}
									</span>
								</div>

								{/* Title & Body */}
								<div>
									<p className="text-xs font-bold text-slate-900 leading-snug">
										{title.trim() || "Judul Notifikasi Muncul di Sini"}
									</p>
									<p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
										{message.trim() ||
											"Isi pesan notifikasi yang Anda ketikkan pada formulir akan ditampilkan persis seperti ini di layar perangkat pengguna."}
									</p>
								</div>

								{/* Target & URL Chips */}
								<div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
									<span className="text-slate-500 font-mono">
										Kepada:{" "}
										<strong className="text-slate-800">
											{targetType === "all"
												? "Semua Pegawai"
												: targetType === "department"
												? `Unit ${selectedDeptObj?.label || "Pilih Unit"}`
												: selectedEmployee?.label || "Pilih Pegawai"}
										</strong>
									</span>
									{url && (
										<span className="text-sky-600 font-mono truncate max-w-[200px] flex items-center gap-1">
											<ExternalLink className="w-3 h-3 shrink-0" />
											{url}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Sent History Card */}
					<div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
						<div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<History className="w-4 h-4 text-slate-600" />
								<h2 className="text-xs font-bold text-slate-900 font-figtree uppercase tracking-wider">
									Riwayat Pengiriman Sesi Ini
								</h2>
							</div>
							<span className="text-[10px] font-mono text-slate-400">
								{sentHistory.length} terkirim
							</span>
						</div>

						<div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
							{sentHistory.length === 0 ? (
								<div className="py-8 text-center px-4">
									<Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
									<p className="text-xs text-slate-500 font-medium">
										Belum ada notifikasi yang dikirim pada sesi ini.
									</p>
									<p className="text-[11px] text-slate-400 mt-0.5">
										Riwayat akan tercatat otomatis saat pengiriman sukses.
									</p>
								</div>
							) : (
								sentHistory.map((item, idx) => (
									<div
										key={item.id || idx}
										className="p-3.5 hover:bg-slate-50 transition-colors text-xs space-y-1.5"
									>
										<div className="flex items-center justify-between gap-2">
											<span className="font-bold text-slate-900 truncate flex-1">
												{item.title}
											</span>
											<span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
												<CheckCircle2 className="w-2.5 h-2.5" />
												Terkirim
											</span>
										</div>
										<p className="text-slate-500 text-[11px] line-clamp-1">
											{item.message}
										</p>
										<div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
											<span className="truncate max-w-[180px]">
												{item.recipientName}
											</span>
											<div className="flex items-center gap-2">
												<span>
													{new Date(item.timestamp).toLocaleTimeString("id-ID", {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												<button
													type="button"
													onClick={() => handlePrefill(item)}
													title="Salin isi ke formulir"
													className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded transition-colors text-[10px] font-sans font-semibold"
												>
													<Copy className="w-2.5 h-2.5" />
													Pakai
												</button>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Reset Form Accessible Confirmation Dialog */}
			<Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
				<DialogContent className="sm:max-w-md p-6">
					<DialogHeader>
						<DialogTitle className="font-figtree text-base font-bold text-slate-900 flex items-center gap-2">
							<RotateCcw className="w-5 h-5 text-slate-500" />
							Kosongkan Draf Formulir?
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
							Draf judul, pesan, dan sasaran yang sudah Anda ketik akan dibersihkan kembali ke pengaturan awal.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0 pt-4">
						<button
							type="button"
							onClick={() => setIsResetModalOpen(false)}
							className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleResetForm}
							className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
						>
							Ya, Kosongkan
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Send Push Notification Accessible Confirmation Dialog */}
			<Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
				<DialogContent className="sm:max-w-lg p-6">
					<DialogHeader>
						<div className="flex items-center gap-2.5">
							<div
								className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${
									targetType === "all"
										? "bg-amber-50 text-amber-600 border-amber-200"
										: "bg-sky-50 text-sky-600 border-sky-200"
								}`}
							>
								{targetType === "all" ? (
									<AlertTriangle className="w-5 h-5" />
								) : targetType === "department" ? (
									<Building2 className="w-5 h-5" />
								) : (
									<User className="w-5 h-5" />
								)}
							</div>
							<div>
								<DialogTitle className="font-figtree text-base font-bold text-slate-900">
									Konfirmasi Pengiriman Notifikasi
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500">
									Pastikan sasaran dan pesan yang akan dikirimkan sudah benar
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-3.5 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
						<div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
							<p className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
								Sasaran Penerima:
							</p>
							{targetType === "all" ? (
								<p className="font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
									⚠️ Siaran Massal ke Seluruh Pegawai ({employees.length} terdaftar)
								</p>
							) : targetType === "department" ? (
								<p className="font-bold text-sky-900 bg-sky-50 px-2 py-1 rounded border border-sky-200">
									Unit {selectedDeptObj?.label || selectedDept} ({deptEmployees.length} pegawai aktif)
								</p>
							) : (
								<p className="font-bold text-slate-900">
									{selectedEmployee?.label} (NIK: {selectedNik})
								</p>
							)}
						</div>

						<div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1.5">
							<p className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
								Judul:
							</p>
							<p className="font-bold text-slate-900">{title}</p>

							<p className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider pt-2">
								Isi Pesan:
							</p>
							<p className="text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
								"{message}"
							</p>

							{url && (
								<div className="pt-2">
									<p className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
										Tautan:
									</p>
									<p className="text-sky-600 font-mono text-[11px] truncate">
										{url}
									</p>
								</div>
							)}
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-2">
						<button
							type="button"
							onClick={() => setIsConfirmModalOpen(false)}
							disabled={isSending}
							className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleExecuteSend}
							disabled={isSending}
							className={`inline-flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 ${
								targetType === "all"
									? "bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-600/20"
									: "bg-sky-600 hover:bg-sky-700"
							}`}
						>
							{isSending ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Mengirimkan...
								</>
							) : (
								<>
									<Send className="w-3.5 h-3.5" />
									{targetType === "all"
										? "Ya, Broadcast Semua Pegawai"
										: targetType === "department"
										? "Ya, Kirim ke Unit"
										: "Ya, Kirim Notifikasi"}
								</>
							)}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
