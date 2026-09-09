"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
	Bell,
	Send,
	RotateCcw,
	User,
	Users,
	Smartphone,
	ExternalLink,
	ArrowLeft,
	Loader2,
	Info,
	Radio,
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function AdminPushNotificationPage() {
	const [targetType, setTargetType] = useState("single");
	const [selectedNik, setSelectedNik] = useState("");
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [url, setUrl] = useState("");
	const [isSending, setIsSending] = useState(false);

	const [employees, setEmployees] = useState([]);
	const [isLoadingPegawai, setIsLoadingPegawai] = useState(true);

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
	}, []);

	const employeeOptions = employees.map((emp) => ({
		value: emp.value,
		label: emp.label,
		sublabel: `${emp.value}${emp.nama_departemen ? ` • ${emp.nama_departemen}` : ""}`,
	}));

	const selectedEmployee = employees.find((e) => e.value === selectedNik);

	const handleReset = () => {
		setTargetType("single");
		setSelectedNik("");
		setTitle("");
		setMessage("");
		setUrl("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (targetType === "single" && !selectedNik) {
			toast.error("Pilih pegawai tujuan terlebih dahulu");
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

		setIsSending(true);

		try {
			const payload = {
				target_type: targetType,
				external_id: targetType === "single" ? selectedNik : undefined,
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

			const data = await res.json();

			if (!res.ok || data.status === "error") {
				let errMsg = "Gagal mengirim notifikasi";
				if (typeof data.error === "string") {
					errMsg = data.error;
				} else if (Array.isArray(data.error)) {
					errMsg = data.error.join(", ");
				} else if (data.error?.invalid_external_user_ids) {
					errMsg = `User belum terhubung ke push notifikasi: ${data.error.invalid_external_user_ids.join(", ")}`;
				}
				toast.error(errMsg);
				return;
			}

			toast.success(data.message || "Push notification berhasil dikirim");
			setTitle("");
			setMessage("");
			setUrl("");
		} catch (err) {
			console.error("Error submitting notification:", err);
			toast.error("Terjadi kesalahan sistem saat mengirim notifikasi");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
			{/* Breadcrumb & Navigation */}
			<div className="flex items-center gap-2 text-sm text-slate-500">
				<Link
					href="/dashboard/admin/settings"
					className="inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>System Settings</span>
				</Link>
				<span>/</span>
				<span className="text-slate-800 font-medium">Push Notification</span>
			</div>

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
						<Bell className="w-7 h-7 text-indigo-600" />
						Kirim Push Notification
					</h1>
					<p className="text-sm text-slate-600 mt-1">
						Kirim push notification OneSignal ke pegawai tertentu atau broadcast ke seluruh perangkat terdaftar.
					</p>
				</div>
			</div>

			{/* Main Grid: Form (7 cols) & Live Preview (5 cols) */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left Column: Form */}
				<div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Target Type Pill Buttons */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
								Target Penerima
							</label>
							<div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
								<button
									type="button"
									onClick={() => setTargetType("single")}
									className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
										targetType === "single"
											? "bg-white text-indigo-600 shadow-xs border border-slate-200/80 font-semibold"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									<User className="w-4 h-4" />
									<span>Pegawai Tertentu</span>
								</button>
								<button
									type="button"
									onClick={() => setTargetType("all")}
									className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
										targetType === "all"
											? "bg-white text-indigo-600 shadow-xs border border-slate-200/80 font-semibold"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									<Users className="w-4 h-4" />
									<span>Broadcast Semua Pegawai</span>
								</button>
							</div>
						</div>

						{/* Single Target Employee Selection */}
						{targetType === "single" && (
							<div className="space-y-1.5">
								<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
									Pilih Pegawai <span className="text-rose-500">*</span>
								</label>
								<SearchableSelect
									options={employeeOptions}
									value={selectedNik}
									onChange={(val) => setSelectedNik(val)}
									placeholder={isLoadingPegawai ? "Memuat pegawai..." : "Cari berdasarkan nama atau NIK..."}
									disabled={isLoadingPegawai}
								/>
								{selectedEmployee && (
									<div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
										<span className="font-semibold text-slate-800">{selectedEmployee.label}</span>
										<span>•</span>
										<span className="font-mono text-slate-500">{selectedEmployee.value}</span>
										{selectedEmployee.nama_departemen && (
											<>
												<span>•</span>
												<span className="text-slate-600">{selectedEmployee.nama_departemen}</span>
											</>
										)}
									</div>
								)}
							</div>
						)}

						{/* Broadcast Warning Notice */}
						{targetType === "all" && (
							<div className="flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
								<Radio className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
								<div>
									<span className="font-semibold">Perhatian Siaran Massal:</span> Notifikasi akan dikirimkan ke seluruh perangkat pegawai yang telah aktif berlangganan push notification OneSignal.
								</div>
							</div>
						)}

						{/* Judul Notifikasi */}
						<div className="space-y-1.5">
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Judul Notifikasi <span className="text-rose-500">*</span>
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="cth: Pengumuman Jadwal Dinas"
								className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
								required
							/>
						</div>

						{/* Isi Pesan */}
						<div className="space-y-1.5">
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Isi Pesan <span className="text-rose-500">*</span>
							</label>
							<textarea
								rows={4}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Tulis pesan notifikasi..."
								className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none leading-relaxed"
								required
							/>
							<div className="flex justify-between items-center text-[11px] text-slate-400">
								<span>Disarankan singkat dan jelas untuk tampilan notifikasi ponsel.</span>
								<span>{message.length} karakter</span>
							</div>
						</div>

						{/* URL Tujuan */}
						<div className="space-y-1.5">
							<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								URL Tujuan <span className="text-slate-400 font-normal lowercase">(opsional)</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="/dashboard/pengajuan-tukar-dinas"
									className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
								/>
								<ExternalLink className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
							</div>
							<p className="text-[11px] text-slate-400">
								Halaman tujuan saat penerima mengetuk notifikasi. Gunakan tautan relatif atau absolut.
							</p>
						</div>

						{/* Action Buttons */}
						<div className="flex items-center gap-3 pt-2">
							<button
								type="submit"
								disabled={isSending}
								className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
							>
								{isSending ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Mengirim Notifikasi...</span>
									</>
								) : (
									<>
										<Send className="w-4 h-4" />
										<span>Kirim Notifikasi</span>
									</>
								)}
							</button>
							<button
								type="button"
								onClick={handleReset}
								disabled={isSending}
								className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
							>
								<RotateCcw className="w-4 h-4" />
								<span>Reset</span>
							</button>
						</div>
					</form>
				</div>

				{/* Right Column: Realistic Live Preview */}
				<div className="lg:col-span-5 space-y-4">
					<div className="flex items-center justify-between px-1">
						<h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
							<Smartphone className="w-4 h-4 text-indigo-500" />
							Live Push Preview
						</h2>
						<span className="text-[11px] font-medium text-slate-400">Tampilan Mobile</span>
					</div>

					{/* Phone Container */}
					<div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-xl border-4 border-slate-800">
						{/* Screen */}
						<div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-950 p-4 min-h-[380px] flex flex-col justify-between relative border border-white/5">
							{/* Phone Speaker & Camera Notch */}
							<div className="flex justify-center mb-6">
								<div className="h-4 w-28 bg-black/80 rounded-full flex items-center justify-center gap-2 px-2">
									<div className="w-2 h-2 rounded-full bg-slate-800"></div>
									<div className="w-1.5 h-1.5 rounded-full bg-indigo-900/60"></div>
								</div>
							</div>

							{/* Status Bar */}
							<div className="flex justify-between items-center text-[10px] text-white/70 px-2 -mt-4 mb-8">
								<span className="font-semibold">09:41</span>
								<div className="flex items-center gap-1.5">
									<span className="text-[9px]">5G</span>
									<div className="w-4 h-2 border border-white/70 rounded-xs flex items-center p-0.5">
										<div className="w-full h-full bg-white/90 rounded-2xs"></div>
									</div>
								</div>
							</div>

							{/* Notification Banner */}
							<div className="my-auto">
								<div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-white/40 text-slate-900 transition-all">
									{/* App Header Row */}
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center shadow-xs">
												<Bell className="w-3 h-3 text-white" />
											</div>
											<span className="text-xs font-semibold text-slate-800">SDM Handal</span>
											<span className="text-[10px] text-slate-400">• Baru saja</span>
										</div>
									</div>

									{/* Notification Content */}
									<div className="space-y-1">
										<h3 className="text-xs font-bold text-slate-900 truncate">
											{title.trim() || "cth: Pengumuman Jadwal Dinas"}
										</h3>
										<p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
											{message.trim() || "Tulis pesan notifikasi pada form untuk melihat simulasi tampilan push notification di perangkat pengguna."}
										</p>
									</div>

									{/* Action / URL Indicator */}
									{url.trim() && (
										<div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-600 font-medium">
											<span className="truncate max-w-[190px] font-mono">{url.trim()}</span>
											<ExternalLink className="w-3 h-3 shrink-0" />
										</div>
									)}
								</div>

								{/* Target recipient preview badge */}
								<div className="mt-3 text-center">
									<span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300/80 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-800/40">
										{targetType === "single" ? (
											<>
												<User className="w-3 h-3" />
												<span>Penerima: {selectedEmployee ? selectedEmployee.label : "Belum dipilih"}</span>
											</>
										) : (
											<>
												<Users className="w-3 h-3" />
												<span>Penerima: Semua Pegawai (Broadcast)</span>
											</>
										)}
									</span>
								</div>
							</div>

							{/* Home Indicator Bar */}
							<div className="flex justify-center pt-6 pb-1">
								<div className="w-28 h-1 bg-white/40 rounded-full"></div>
							</div>
						</div>
					</div>

					{/* Helper Card */}
					<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
						<div className="flex items-center gap-1.5 font-semibold text-slate-700">
							<Info className="w-3.5 h-3.5 text-indigo-500" />
							<span>Informasi Pengiriman</span>
						</div>
						<p className="text-[11px] text-slate-500 leading-normal">
							Notifikasi dikirim melalui layanan OneSignal. Hanya pegawai yang telah mengizinkan izin notifikasi pada peramban/aplikasi yang akan menerima push notification.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
