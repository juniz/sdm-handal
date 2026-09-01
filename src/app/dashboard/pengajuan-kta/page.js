"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
	Loader2,
	Plus,
	Eye,
	Edit,
	CreditCard,
	Clock,
	CheckCircle2,
	XCircle,
	Trash2,
	AlertTriangle,
	Search,
	RotateCcw,
	Printer,
	PackageCheck,
	ShieldCheck,
	User,
	Building2,
	Calendar,
	Info,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import moment from "moment-timezone";
import "moment/locale/id";

// Set locale ke Indonesia
moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

export default function PengajuanKTAPage() {
	const [pengajuanData, setPengajuanData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [userDepartment, setUserDepartment] = useState(null);
	const [showFormDialog, setShowFormDialog] = useState(false);
	const [selectedPengajuan, setSelectedPengajuan] = useState(null);
	const [showUpdateDialog, setShowUpdateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [pengajuanToDelete, setPengajuanToDelete] = useState(null);
	const [visibleData, setVisibleData] = useState([]);
	const [searchNama, setSearchNama] = useState("");
	const [searchJenis, setSearchJenis] = useState("ALL");
	const [searchStatus, setSearchStatus] = useState("ALL");
	const [filtersApplied, setFiltersApplied] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	// Form state
	const [formData, setFormData] = useState({
		jenis: "",
		alasan: "",
	});

	// Update status state
	const [updateData, setUpdateData] = useState({
		status: "",
		alasan_ditolak: "",
	});

	const router = useRouter();

	useEffect(() => {
		fetchData();
		checkUserDepartment();
	}, []);

	const checkUserDepartment = async () => {
		try {
			const response = await fetch("/api/auth/profile");
			if (response.ok) {
				const data = await response.json();
				const deptId = data.data?.departemen;

				const isITorHRD =
					deptId?.toUpperCase() === "IT" ||
					deptId?.toUpperCase() === "HRD";

				// IT dan HRD bisa mengajukan DAN memproses
				setUserDepartment(isITorHRD ? "IT_HRD" : "USER");
			}
		} catch (error) {
			console.error("Error checking user department:", error);
		}
	};

	const handleSearch = () => {
		const namaQuery = searchNama.trim().toLowerCase();
		const jenisQuery = searchJenis === "ALL" ? "" : searchJenis;
		const statusQuery = searchStatus === "ALL" ? "" : searchStatus;

		const filtered = (pengajuanData || []).filter((item) => {
			const matchNama = namaQuery
				? (item.nama || "").toLowerCase().includes(namaQuery) ||
				  (item.nik || "").toLowerCase().includes(namaQuery) ||
				  (item.no_pengajuan || "").toLowerCase().includes(namaQuery)
				: true;
			const matchJenis = jenisQuery ? item.jenis === jenisQuery : true;
			const matchStatus = statusQuery ? item.status === statusQuery : true;
			return matchNama && matchJenis && matchStatus;
		});

		setVisibleData(filtered);
		setCurrentPage(1);
		setFiltersApplied(
			Boolean(namaQuery) || Boolean(jenisQuery) || Boolean(statusQuery)
		);
	};

	const handleResetFilters = () => {
		setSearchNama("");
		setSearchJenis("ALL");
		setSearchStatus("ALL");
		setVisibleData(pengajuanData || []);
		setCurrentPage(1);
		setFiltersApplied(false);
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/pengajuan-kta");

			if (response.ok) {
				const result = await response.json();
				setPengajuanData(result.data || []);
				setVisibleData(result.data || []);
				setCurrentPage(1);
			} else {
				const errorData = await response.json();
				toast.error(errorData.message || "Gagal mengambil data pengajuan KTA");
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Terjadi kesalahan saat mengambil data");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.jenis) {
			toast.error("Pilih jenis pengajuan KTA");
			return;
		}

		if (!formData.alasan || formData.alasan.trim().length < 10) {
			toast.error("Alasan pengajuan harus diisi minimal 10 karakter");
			return;
		}

		try {
			setSubmitLoading(true);
			const response = await fetch("/api/pengajuan-kta", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Pengajuan KTA berhasil dikirim ke antrean HRD");
				setFormData({ jenis: "", alasan: "" });
				setShowFormDialog(false);
				fetchData();
			} else {
				toast.error(result.message || "Gagal submit pengajuan KTA");
			}
		} catch (error) {
			console.error("Error submitting:", error);
			toast.error("Terjadi kesalahan saat mengirim pengajuan");
		} finally {
			setSubmitLoading(false);
		}
	};

	const handleUpdateStatus = async () => {
		if (!updateData.status) {
			toast.error("Pilih status pengajuan");
			return;
		}

		if (updateData.status === "ditolak" && !updateData.alasan_ditolak.trim()) {
			toast.error("Alasan penolakan wajib diisi");
			return;
		}

		try {
			const response = await fetch("/api/pengajuan-kta", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: selectedPengajuan.id,
					status: updateData.status,
					alasan_ditolak: updateData.alasan_ditolak,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Status pengajuan berhasil diperbarui");
				setShowUpdateDialog(false);
				setSelectedPengajuan(null);
				setUpdateData({ status: "", alasan_ditolak: "" });
				fetchData();
			} else {
				toast.error(result.message || "Gagal update status");
			}
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error("Terjadi kesalahan saat update status");
		}
	};

	const handleDeleteClick = (pengajuan) => {
		setPengajuanToDelete(pengajuan);
		setShowDeleteDialog(true);
	};

	const handleDeleteConfirm = async () => {
		if (!pengajuanToDelete) return;

		try {
			const response = await fetch("/api/pengajuan-kta", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: pengajuanToDelete.id }),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Pengajuan berhasil dibatalkan dan dihapus");
				setShowDeleteDialog(false);
				setPengajuanToDelete(null);
				fetchData();
			} else {
				toast.error(result.message || "Gagal menghapus pengajuan");
			}
		} catch (error) {
			console.error("Error deleting pengajuan:", error);
			toast.error("Terjadi kesalahan saat menghapus pengajuan");
		}
	};

	const getStatusBadge = (status) => {
		switch (status?.toLowerCase()) {
			case "pending":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
						<Clock className="w-3 h-3 text-amber-600" />
						Pending
					</span>
				);
			case "disetujui":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
						<CheckCircle2 className="w-3 h-3 text-sky-600" />
						Disetujui
					</span>
				);
			case "proses":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80">
						<Printer className="w-3 h-3 text-cyan-600 animate-pulse" />
						Proses Cetak
					</span>
				);
			case "selesai":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
						<PackageCheck className="w-3 h-3 text-emerald-600" />
						Siap Diambil
					</span>
				);
			case "ditolak":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
						<XCircle className="w-3 h-3 text-rose-600" />
						Ditolak
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
						<Clock className="w-3 h-3" />
						{status || "Pending"}
					</span>
				);
		}
	};

	const getJenisBadge = (jenis) => {
		switch (jenis) {
			case "Baru":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
						Baru
					</span>
				);
			case "Ganti":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
						Penggantian
					</span>
				);
			case "Hilang":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
						Kartu Hilang
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
						{jenis || "Baru"}
					</span>
				);
		}
	};

	const isReasonValid = formData.alasan.trim().length >= 10;

	return (
		<div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
						<div className="p-2 bg-sky-100 text-[#0284C7] rounded-lg">
							<CreditCard className="w-6 h-6" />
						</div>
						Pengajuan KTA
					</h1>
					<p className="text-sm text-slate-600 mt-1">
						Layanan penerbitan dan penggantian Kartu Tanda Anggota RS Bhayangkara Nganjuk
					</p>
				</div>

				{(userDepartment === "USER" || userDepartment === "IT_HRD") && (
					<Button
						onClick={() => setShowFormDialog(true)}
						className="flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition-all"
					>
						<Plus className="w-4 h-4" />
						Ajukan KTA
					</Button>
				)}
			</div>

			{/* Filter Section */}
			<Card className="border-slate-200 shadow-sm">
				<CardContent className="pt-5 pb-5">
					<div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
						<div className="md:col-span-4">
							<Label htmlFor="filter_nama" className="text-xs font-semibold text-slate-700">
								Cari Pemohon / No Pengajuan
							</Label>
							<div className="relative mt-1">
								<Input
									id="filter_nama"
									placeholder="Masukkan nama, NIK, atau no pengajuan..."
									value={searchNama}
									onChange={(e) => setSearchNama(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleSearch();
									}}
									className="pr-8 h-9 text-sm border-slate-300 focus-visible:ring-[#0284C7]"
								/>
								{searchNama && (
									<button
										type="button"
										onClick={() => setSearchNama("")}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
									>
										×
									</button>
								)}
							</div>
						</div>
						<div className="md:col-span-3">
							<Label htmlFor="filter_jenis" className="text-xs font-semibold text-slate-700">
								Jenis Pengajuan
							</Label>
							<Select
								value={searchJenis}
								onValueChange={(val) => setSearchJenis(val)}
							>
								<SelectTrigger id="filter_jenis" className="w-full mt-1 h-9 text-sm border-slate-300">
									<SelectValue placeholder="Semua jenis" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Jenis</SelectItem>
									<SelectItem value="Baru">Baru</SelectItem>
									<SelectItem value="Ganti">Penggantian (Rusak/Ubah)</SelectItem>
									<SelectItem value="Hilang">Hilang</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="md:col-span-3">
							<Label htmlFor="filter_status" className="text-xs font-semibold text-slate-700">
								Status Verifikasi
							</Label>
							<Select
								value={searchStatus}
								onValueChange={(val) => setSearchStatus(val)}
							>
								<SelectTrigger id="filter_status" className="w-full mt-1 h-9 text-sm border-slate-300">
									<SelectValue placeholder="Semua status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Status</SelectItem>
									<SelectItem value="pending">Pending (Menunggu)</SelectItem>
									<SelectItem value="disetujui">Disetujui</SelectItem>
									<SelectItem value="proses">Proses Cetak</SelectItem>
									<SelectItem value="selesai">Selesai / Siap Diambil</SelectItem>
									<SelectItem value="ditolak">Ditolak</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="md:col-span-2 flex gap-2">
							<Button
								onClick={handleSearch}
								className="flex-1 h-9 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold"
							>
								<Search className="w-3.5 h-3.5 mr-1.5" />
								Cari
							</Button>
							<Button
								variant="outline"
								onClick={handleResetFilters}
								className="h-9 px-3 border-slate-300 hover:bg-slate-50 text-slate-600"
								title="Reset filter"
								aria-label="Reset filter"
							>
								<RotateCcw className="w-3.5 h-3.5" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Form Pengajuan Modal */}
			<Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="flex-shrink-0 w-11 h-11 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-center text-[#0284C7]">
								<CreditCard className="w-6 h-6" />
							</div>
							<div>
								<DialogTitle className="text-lg font-semibold text-slate-900">
									Form Pengajuan KTA
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-600 mt-0.5">
									Penerbitan Kartu Tanda Anggota Pegawai RS Bhayangkara
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3 text-xs text-sky-950 flex gap-2.5 items-start">
						<Info className="w-4 h-4 text-[#0284C7] flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-semibold text-sky-950">Informasi Otomatis:</p>
							<p className="mt-0.5 text-sky-800">
								Foto profil, NIK, dan jabatan disinkronkan langsung dari Master Pegawai. Kartu fisik dapat diambil di bagian SDM setelah status <span className="font-medium text-emerald-700">Siap Diambil</span>.
							</p>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4 pt-1">
						<div>
							<Label htmlFor="jenis" className="text-xs font-semibold text-slate-700">
								Jenis Pengajuan <span className="text-rose-500">*</span>
							</Label>
							<Select
								value={formData.jenis}
								onValueChange={(value) =>
									setFormData({ ...formData, jenis: value })
								}
							>
								<SelectTrigger className="w-full mt-1.5 h-10 border-slate-300">
									<SelectValue placeholder="Pilih alasan penerbitan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Baru">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-sky-500 rounded-full"></div>
											<span className="font-medium">Baru (Pegawai Baru / Belum Memiliki)</span>
										</div>
									</SelectItem>
									<SelectItem value="Ganti">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-slate-500 rounded-full"></div>
											<span className="font-medium">Penggantian (Kartu Rusak / Perubahan Data)</span>
										</div>
									</SelectItem>
									<SelectItem value="Hilang">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-amber-500 rounded-full"></div>
											<span className="font-medium">Hilang (Lapor Kehilangan)</span>
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<div className="flex justify-between items-center">
								<Label htmlFor="alasan" className="text-xs font-semibold text-slate-700">
									Keterangan / Alasan Pengajuan <span className="text-rose-500">*</span>
								</Label>
								<span
									className={`text-[11px] font-medium ${
										formData.alasan.length === 0
											? "text-slate-400"
											: isReasonValid
											? "text-emerald-600"
											: "text-amber-600"
									}`}
								>
									{formData.alasan.length}/500 (min. 10)
								</span>
							</div>
							<Textarea
								id="alasan"
								placeholder="Contoh: KTA pertama pegawai baru atau KTA lama rusak chip..."
								value={formData.alasan}
								onChange={(e) =>
									setFormData({ ...formData, alasan: e.target.value })
								}
								maxLength={500}
								rows={4}
								className="mt-1.5 resize-none border-slate-300 text-sm focus-visible:ring-[#0284C7]"
							/>
							{!isReasonValid && formData.alasan.length > 0 && (
								<p className="text-[11px] text-amber-600 mt-1">
									Minimal 10 karakter dibutuhkan untuk verifikasi HRD.
								</p>
							)}
						</div>

						<DialogFooter className="gap-2 pt-3 border-t border-slate-100">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setShowFormDialog(false);
									setFormData({ jenis: "", alasan: "" });
								}}
								className="flex-1 sm:flex-none border-slate-300 text-slate-700"
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={submitLoading || !formData.jenis || !isReasonValid}
								className="flex-1 sm:flex-none bg-[#0284C7] hover:bg-[#0369A1] text-white"
							>
								{submitLoading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin mr-2" />
										Mengirim...
									</>
								) : (
									<>
										<Plus className="w-4 h-4 mr-1.5" />
										Kirim Pengajuan
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Main Data Section */}
			<Card className="border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="bg-slate-50/70 border-b border-slate-200 px-6 py-4 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-base font-semibold text-slate-900">
							Daftar Pengajuan KTA
						</CardTitle>
						<CardDescription className="text-xs text-slate-500 mt-0.5">
							{visibleData.length} data ditemukan
						</CardDescription>
					</div>
					{filtersApplied && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleResetFilters}
							className="text-xs text-[#0284C7] hover:text-[#0369A1] h-8"
						>
							Tampilkan Semua
						</Button>
					)}
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-6 space-y-4">
							<div className="flex gap-4">
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-3">
								{[...Array(5)].map((_, i) => (
									<Skeleton key={i} className="h-12 w-full" />
								))}
							</div>
						</div>
					) : visibleData.length === 0 ? (
						<div className="text-center py-12 px-4">
							<div className="w-14 h-14 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center text-sky-400 mx-auto mb-3">
								<CreditCard className="w-7 h-7" />
							</div>
							<h3 className="text-sm font-semibold text-slate-800">
								{filtersApplied
									? "Tidak ada data sesuai filter pencarian"
									: "Belum ada pengajuan KTA"}
							</h3>
							<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
								{filtersApplied
									? "Coba ubah kata kunci nama, NIK, atau pilih semua jenis/status."
									: "Mulai dengan membuat pengajuan baru menggunakan tombol di bawah."}
							</p>
							<div className="mt-4 flex justify-center gap-2">
								{filtersApplied ? (
									<Button
										variant="outline"
										size="sm"
										onClick={handleResetFilters}
										className="text-xs"
									>
										<RotateCcw className="w-3.5 h-3.5 mr-1.5" />
										Reset Filter
									</Button>
								) : (
									<Button
										size="sm"
										onClick={() => setShowFormDialog(true)}
										className="bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs"
									>
										<Plus className="w-3.5 h-3.5 mr-1.5" />
										Buat Pengajuan Baru
									</Button>
								)}
							</div>
						</div>
					) : (
						<>
							{/* Desktop Table View */}
							<div className="hidden md:block overflow-x-auto">
								<Table>
									<TableHeader className="bg-slate-50/90 border-b border-slate-200">
										<TableRow>
											<TableHead className="w-12 text-center text-xs font-semibold text-slate-600">
												No
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-600">
												No Pengajuan
											</TableHead>
											{userDepartment === "IT_HRD" && (
												<>
													<TableHead className="text-xs font-semibold text-slate-600">
														NIK
													</TableHead>
													<TableHead className="text-xs font-semibold text-slate-600">
														Nama Pegawai
													</TableHead>
													<TableHead className="text-xs font-semibold text-slate-600">
														Jabatan
													</TableHead>
												</>
											)}
											<TableHead className="text-xs font-semibold text-slate-600">
												Jenis
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-600 max-w-[200px]">
												Alasan
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-600">
												Status
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-600">
												Tanggal
											</TableHead>
											<TableHead className="text-right text-xs font-semibold text-slate-600 pr-6">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100">
										{visibleData
											.slice((currentPage - 1) * pageSize, currentPage * pageSize)
											.map((item, index) => (
												<TableRow
													key={item.id}
													className="hover:bg-sky-50/40 transition-colors"
												>
													<TableCell className="text-center text-xs font-medium text-slate-500">
														{(currentPage - 1) * pageSize + index + 1}
													</TableCell>
													<TableCell className="font-mono text-xs font-semibold text-[#0284C7]">
														{item.no_pengajuan || `#${item.id}`}
													</TableCell>
													{userDepartment === "IT_HRD" && (
														<>
															<TableCell className="font-mono text-xs text-slate-600">
																{item.nik || "-"}
															</TableCell>
															<TableCell className="text-xs font-medium text-slate-900">
																{item.nama || "-"}
															</TableCell>
															<TableCell className="text-xs text-slate-600">
																{item.jbtn || "-"}
															</TableCell>
														</>
													)}
													<TableCell>{getJenisBadge(item.jenis)}</TableCell>
													<TableCell
														className="max-w-[220px] truncate text-xs text-slate-700"
														title={item.alasan}
													>
														{item.alasan}
													</TableCell>
													<TableCell>{getStatusBadge(item.status)}</TableCell>
													<TableCell className="text-xs text-slate-500 whitespace-nowrap">
														{moment(item.created_at).format("DD MMM YYYY, HH:mm")}
													</TableCell>
													<TableCell className="text-right pr-6">
														<div className="flex justify-end gap-1.5">
															<Button
																size="sm"
																variant="ghost"
																className="h-8 w-8 p-0 text-slate-600 hover:text-[#0284C7] hover:bg-slate-100"
																onClick={() => {
																	setSelectedPengajuan(item);
																	setShowDetailDialog(true);
																}}
																title="Lihat Detail"
																aria-label="Lihat Detail"
															>
																<Eye className="w-4 h-4" />
															</Button>

															{userDepartment === "IT_HRD" && (
																<Button
																	size="sm"
																	variant="ghost"
																	className="h-8 w-8 p-0 text-slate-600 hover:text-[#0284C7] hover:bg-slate-100"
																	onClick={() => {
																		setSelectedPengajuan(item);
																		setUpdateData({
																			status: item.status,
																			alasan_ditolak: item.alasan_ditolak || "",
																		});
																		setShowUpdateDialog(true);
																	}}
																	title="Ubah Status Verifikasi"
																	aria-label="Ubah Status Verifikasi"
																>
																	<Edit className="w-4 h-4" />
																</Button>
															)}

															{item.status === "pending" && (
																<Button
																	size="sm"
																	variant="ghost"
																	className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-slate-100"
																	onClick={() => handleDeleteClick(item)}
																	title="Batalkan Pengajuan"
																	aria-label="Batalkan Pengajuan"
																>
																	<Trash2 className="w-4 h-4" />
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							</div>

							{/* Mobile Card View */}
							<div className="md:hidden p-3 space-y-3 divide-y divide-slate-100">
								{visibleData
									.slice((currentPage - 1) * pageSize, currentPage * pageSize)
									.map((item, index) => (
										<div key={item.id} className="pt-3 first:pt-0 space-y-3">
											<div className="flex justify-between items-start">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="text-xs font-semibold text-slate-400">
															#{(currentPage - 1) * pageSize + index + 1}
														</span>
														{getJenisBadge(item.jenis)}
													</div>
													<div className="font-mono text-xs font-semibold text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded inline-block">
														{item.no_pengajuan || `#${item.id}`}
													</div>
												</div>
												{getStatusBadge(item.status)}
											</div>

											{userDepartment === "IT_HRD" && (
												<div className="text-xs bg-slate-50 p-2.5 rounded-lg space-y-1 border border-slate-100">
													<div className="flex justify-between">
														<span className="text-slate-500">Nama:</span>
														<span className="font-medium text-slate-800">{item.nama}</span>
													</div>
													<div className="flex justify-between">
														<span className="text-slate-500">NIK:</span>
														<span className="font-mono text-slate-700">{item.nik}</span>
													</div>
													<div className="flex justify-between">
														<span className="text-slate-500">Jabatan:</span>
														<span className="text-slate-700">{item.jbtn}</span>
													</div>
												</div>
											)}

											<div>
												<p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
													Alasan Pengajuan:
												</p>
												<p className="text-xs text-slate-700 bg-slate-50/80 p-2 rounded border border-slate-100 leading-relaxed">
													{item.alasan}
												</p>
											</div>

											{item.alasan_ditolak && (
												<div className="bg-rose-50 border border-rose-200 p-2 rounded text-xs text-rose-700">
													<span className="font-semibold">Alasan Ditolak: </span>
													{item.alasan_ditolak}
												</div>
											)}

											<div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
												<span>{moment(item.created_at).format("DD MMM YYYY, HH:mm")}</span>
												<div className="flex gap-1.5">
													<Button
														size="sm"
														variant="outline"
														className="h-8 px-2.5 text-xs text-slate-700"
														onClick={() => {
															setSelectedPengajuan(item);
															setShowDetailDialog(true);
														}}
													>
														<Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
														Detail
													</Button>

													{userDepartment === "IT_HRD" && (
														<Button
															size="sm"
															variant="outline"
															className="h-8 px-2.5 text-xs text-[#0284C7] border-sky-200"
															onClick={() => {
																setSelectedPengajuan(item);
																setUpdateData({
																	status: item.status,
																	alasan_ditolak: item.alasan_ditolak || "",
																});
																setShowUpdateDialog(true);
															}}
														>
															<Edit className="w-3.5 h-3.5 mr-1" />
															Update
														</Button>
													)}

													{item.status === "pending" && (
														<Button
															size="sm"
															variant="outline"
															className="h-8 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
															onClick={() => handleDeleteClick(item)}
															aria-label="Hapus pengajuan"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</Button>
													)}
												</div>
											</div>
										</div>
									))}
							</div>

							{/* Pagination Controls */}
							{visibleData.length > 0 && (
								<div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
									<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
										<span>
											Menampilkan{" "}
											<span className="font-semibold text-slate-900">
												{(currentPage - 1) * pageSize + 1}
											</span>{" "}
											-{" "}
											<span className="font-semibold text-slate-900">
												{Math.min(currentPage * pageSize, visibleData.length)}
											</span>{" "}
											dari{" "}
											<span className="font-semibold text-slate-900">
												{visibleData.length}
											</span>{" "}
											data
										</span>
										<div className="flex items-center gap-1.5">
											<span className="text-slate-500">Baris:</span>
											<Select
												value={pageSize.toString()}
												onValueChange={(val) => {
													setPageSize(Number(val));
													setCurrentPage(1);
												}}
											>
												<SelectTrigger className="h-7 w-[68px] text-xs bg-white border-slate-300">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="5">5</SelectItem>
													<SelectItem value="10">10</SelectItem>
													<SelectItem value="25">25</SelectItem>
													<SelectItem value="50">50</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="sm"
											className="h-8 w-8 p-0 border-slate-300 text-slate-700 disabled:opacity-40"
											onClick={() => setCurrentPage(1)}
											disabled={currentPage === 1}
											title="Halaman Pertama"
											aria-label="Halaman Pertama"
										>
											<ChevronsLeft className="w-3.5 h-3.5" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="h-8 w-8 p-0 border-slate-300 text-slate-700 disabled:opacity-40"
											onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
											disabled={currentPage === 1}
											title="Halaman Sebelumnya"
											aria-label="Halaman Sebelumnya"
										>
											<ChevronLeft className="w-3.5 h-3.5" />
										</Button>

										<div className="flex items-center gap-1 px-1">
											{Array.from(
												{
													length: Math.min(
														5,
														Math.ceil(visibleData.length / pageSize) || 1
													),
												},
												(_, i) => {
													const totalP =
														Math.ceil(visibleData.length / pageSize) || 1;
													let pageNum;
													if (totalP <= 5) {
														pageNum = i + 1;
													} else if (currentPage <= 3) {
														pageNum = i + 1;
													} else if (currentPage >= totalP - 2) {
														pageNum = totalP - 4 + i;
													} else {
														pageNum = currentPage - 2 + i;
													}

													const isActive = pageNum === currentPage;
													return (
														<Button
															key={pageNum}
															variant={isActive ? "default" : "outline"}
															size="sm"
															className={`h-8 w-8 p-0 text-xs font-semibold ${
																isActive
																	? "bg-[#0284C7] hover:bg-[#0369A1] text-white border-transparent shadow-sm"
																	: "border-slate-300 text-slate-700 hover:bg-slate-100"
															}`}
															onClick={() => setCurrentPage(pageNum)}
														>
															{pageNum}
														</Button>
													);
												}
											)}
										</div>

										<Button
											variant="outline"
											size="sm"
											className="h-8 w-8 p-0 border-slate-300 text-slate-700 disabled:opacity-40"
											onClick={() =>
												setCurrentPage((p) =>
													Math.min(
														Math.ceil(visibleData.length / pageSize) || 1,
														p + 1
													)
												)
											}
											disabled={
												currentPage ===
												(Math.ceil(visibleData.length / pageSize) || 1)
											}
											title="Halaman Berikutnya"
											aria-label="Halaman Berikutnya"
										>
											<ChevronRight className="w-3.5 h-3.5" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="h-8 w-8 p-0 border-slate-300 text-slate-700 disabled:opacity-40"
											onClick={() =>
												setCurrentPage(
													Math.ceil(visibleData.length / pageSize) || 1
												)
											}
											disabled={
												currentPage ===
												(Math.ceil(visibleData.length / pageSize) || 1)
											}
											title="Halaman Terakhir"
											aria-label="Halaman Terakhir"
										>
											<ChevronsRight className="w-3.5 h-3.5" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Dialog Update Status (HRD Role) */}
			<Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold text-slate-900">
							Verifikasi Status Pengajuan KTA
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-600">
							Perbarui tahapan penerbitan KTA untuk pemohon:{" "}
							<span className="font-semibold text-slate-800">
								{selectedPengajuan?.nama || selectedPengajuan?.nik}
							</span>
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 pt-1">
						<div>
							<Label htmlFor="status" className="text-xs font-semibold text-slate-700">
								Tahap Status
							</Label>
							<Select
								value={updateData.status}
								onValueChange={(value) =>
									setUpdateData({ ...updateData, status: value })
								}
							>
								<SelectTrigger className="w-full mt-1.5 h-10 border-slate-300">
									<SelectValue placeholder="Pilih tahapan status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">Pending (Menunggu Verifikasi)</SelectItem>
									<SelectItem value="disetujui">Disetujui (Siap Masuk Antrean Cetak)</SelectItem>
									<SelectItem value="proses">Proses (Sedang Dicetak)</SelectItem>
									<SelectItem value="selesai">Selesai (Siap Diambil di HRD)</SelectItem>
									<SelectItem value="ditolak">Ditolak (Data Tidak Valid)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{updateData.status === "ditolak" && (
							<div>
								<Label htmlFor="alasan_ditolak" className="text-xs font-semibold text-rose-700">
									Alasan Penolakan <span className="text-rose-500">*</span>
								</Label>
								<Textarea
									id="alasan_ditolak"
									placeholder="Tuliskan alasan penolakan secara jelas agar pemohon dapat memperbaiki..."
									value={updateData.alasan_ditolak}
									onChange={(e) =>
										setUpdateData({
											...updateData,
											alasan_ditolak: e.target.value,
										})
									}
									rows={3}
									className="mt-1.5 resize-none border-rose-300 text-sm focus-visible:ring-rose-400"
								/>
							</div>
						)}
					</div>

					<DialogFooter className="gap-2 pt-3 border-t border-slate-100">
						<Button
							variant="outline"
							onClick={() => setShowUpdateDialog(false)}
							className="border-slate-300 text-slate-700"
						>
							Batal
						</Button>
						<Button
							onClick={handleUpdateStatus}
							className="bg-[#0284C7] hover:bg-[#0369A1] text-white"
						>
							Simpan Perubahan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Detail Pengajuan with Stepper & Digital Preview */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
					<DialogHeader className="p-5 pb-3 border-b border-slate-100">
						<div className="flex items-center justify-between">
							<div>
								<DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
									<CreditCard className="w-5 h-5 text-[#0284C7]" />
									Detail Pengajuan KTA
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500 mt-0.5">
									Informasi lengkap status & identitas kartu anggota
								</DialogDescription>
							</div>
							{selectedPengajuan && (
								<div className="text-right">
									<span className="font-mono text-xs font-semibold text-[#0284C7] bg-sky-50 px-2.5 py-1 rounded border border-sky-100">
										{selectedPengajuan.no_pengajuan || `#${selectedPengajuan.id}`}
									</span>
								</div>
							)}
						</div>
					</DialogHeader>

					{selectedPengajuan && (
						<div className="flex-1 overflow-y-auto p-5 space-y-6">
							{/* Status Pipeline Stepper */}
							<div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
								<div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
									Tahapan Verifikasi & Penerbitan
								</div>
								{selectedPengajuan.status === "ditolak" ? (
									<div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex gap-2.5 items-start">
										<XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
										<div>
											<p className="font-bold text-rose-900">Pengajuan Ditolak</p>
											<p className="mt-0.5 text-rose-800">
												Alasan: {selectedPengajuan.alasan_ditolak || "Data tidak sesuai persyaratan."}
											</p>
										</div>
									</div>
								) : (
									<div className="grid grid-cols-4 gap-2 text-center text-xs">
										{/* Step 1 */}
										<div className="flex flex-col items-center">
											<div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
												✓
											</div>
											<span className="font-semibold text-slate-800 mt-1">Diajukan</span>
											<span className="text-[10px] text-slate-400">
												{moment(selectedPengajuan.created_at).format("DD/MM HH:mm")}
											</span>
										</div>
										{/* Step 2 */}
										<div className="flex flex-col items-center">
											<div
												className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
													selectedPengajuan.status === "disetujui" ||
													selectedPengajuan.status === "proses" ||
													selectedPengajuan.status === "selesai"
														? "bg-emerald-100 text-emerald-700"
														: "bg-slate-200 text-slate-500"
												}`}
											>
												{selectedPengajuan.status === "disetujui" ||
												selectedPengajuan.status === "proses" ||
												selectedPengajuan.status === "selesai"
													? "✓"
													: "2"}
											</div>
											<span className="font-semibold text-slate-800 mt-1">Disetujui</span>
											<span className="text-[10px] text-slate-400">Verifikasi HRD</span>
										</div>
										{/* Step 3 */}
										<div className="flex flex-col items-center">
											<div
												className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
													selectedPengajuan.status === "proses" ||
													selectedPengajuan.status === "selesai"
														? "bg-emerald-100 text-emerald-700"
														: "bg-slate-200 text-slate-500"
												}`}
											>
												{selectedPengajuan.status === "selesai" ? "✓" : "3"}
											</div>
											<span className="font-semibold text-slate-800 mt-1">Proses Cetak</span>
											<span className="text-[10px] text-slate-400">Antrean Cetak</span>
										</div>
										{/* Step 4 */}
										<div className="flex flex-col items-center">
											<div
												className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
													selectedPengajuan.status === "selesai"
														? "bg-emerald-600 text-white"
														: "bg-slate-200 text-slate-500"
												}`}
											>
												{selectedPengajuan.status === "selesai" ? "✓" : "4"}
											</div>
											<span className="font-semibold text-slate-800 mt-1">Siap Diambil</span>
											<span className="text-[10px] text-slate-400">Ruang SDM</span>
										</div>
									</div>
								)}
							</div>

							{/* Digital Card Mockup Preview */}
							<div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-5 shadow-md relative overflow-hidden border border-sky-800/40">
								<div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>
								<div className="flex justify-between items-start relative z-10">
									<div className="flex items-center gap-2.5">
										<ShieldCheck className="w-6 h-6 text-sky-400" />
										<div>
											<p className="text-[11px] font-bold tracking-widest text-sky-300 uppercase">
												RS Bhayangkara Nganjuk
											</p>
											<p className="text-[10px] text-slate-300">
												Kartu Tanda Anggota Pegawai
											</p>
										</div>
									</div>
									<div className="text-right">
										{getJenisBadge(selectedPengajuan.jenis)}
									</div>
								</div>

								<div className="mt-5 grid grid-cols-3 gap-4 items-center relative z-10">
									<div className="col-span-2 space-y-1">
										<p className="text-base font-bold text-white tracking-wide">
											{selectedPengajuan.nama || "Pegawai RS Bhayangkara"}
										</p>
										<p className="text-xs font-mono text-sky-300">
											NIK: {selectedPengajuan.nik || "-"}
										</p>
										<p className="text-xs text-slate-300">
											{selectedPengajuan.jbtn || "Staff"} · {selectedPengajuan.departemen || "RS"}
										</p>
									</div>
									<div className="text-right">
										<div className="w-14 h-18 bg-white/10 border border-white/20 rounded-lg ml-auto flex items-center justify-center text-slate-400 text-[10px]">
											<User className="w-8 h-8 text-sky-200/60" />
										</div>
									</div>
								</div>

								<div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400 relative z-10">
									<span>KTA ID: {selectedPengajuan.no_pengajuan || `#${selectedPengajuan.id}`}</span>
									<span>SDM Handal Certified</span>
								</div>
							</div>

							{/* Detail Information List */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
								<div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
									<span className="text-slate-500 font-medium">Alasan Pengajuan:</span>
									<p className="text-slate-800 mt-1 font-medium leading-relaxed">
										{selectedPengajuan.alasan}
									</p>
								</div>
								<div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
									<div className="flex justify-between">
										<span className="text-slate-500">Waktu Pengajuan:</span>
										<span className="font-medium text-slate-800">
											{moment(selectedPengajuan.created_at).format("DD MMM YYYY, HH:mm")}
										</span>
									</div>
									{selectedPengajuan.updated_at && (
										<div className="flex justify-between">
											<span className="text-slate-500">Pembaruan Terakhir:</span>
											<span className="font-medium text-slate-800">
												{moment(selectedPengajuan.updated_at).format("DD MMM YYYY, HH:mm")}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between sm:justify-between items-center">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowDetailDialog(false)}
							className="text-xs border-slate-300"
						>
							Tutup
						</Button>
						{userDepartment === "IT_HRD" && selectedPengajuan && (
							<Button
								size="sm"
								onClick={() => {
									setUpdateData({
										status: selectedPengajuan.status,
										alasan_ditolak: selectedPengajuan.alasan_ditolak || "",
									});
									setShowDetailDialog(false);
									setShowUpdateDialog(true);
								}}
								className="bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs"
							>
								<Edit className="w-3.5 h-3.5 mr-1.5" />
								Update Status
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Konfirmasi Hapus */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="flex-shrink-0 w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
								<AlertTriangle className="w-6 h-6" />
							</div>
							<div>
								<DialogTitle className="text-base font-semibold text-slate-900">
									Batalkan Pengajuan KTA?
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-600 mt-0.5">
									Pengajuan dengan status pending akan dihapus permanen
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{pengajuanToDelete && (
						<div className="space-y-3 pt-1 text-xs">
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
								<div className="flex justify-between">
									<span className="text-slate-500">No Pengajuan:</span>
									<span className="font-mono font-semibold text-[#0284C7]">
										{pengajuanToDelete.no_pengajuan || `#${pengajuanToDelete.id}`}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Jenis:</span>
									<span>{getJenisBadge(pengajuanToDelete.jenis)}</span>
								</div>
								{pengajuanToDelete.nama && (
									<div className="flex justify-between">
										<span className="text-slate-500">Pemohon:</span>
										<span className="font-medium text-slate-800">
											{pengajuanToDelete.nama}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 pt-3 border-t border-slate-100">
						<Button
							variant="outline"
							onClick={() => {
								setShowDeleteDialog(false);
								setPengajuanToDelete(null);
							}}
							className="flex-1 sm:flex-none border-slate-300 text-slate-700 text-xs"
						>
							Batal
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white text-xs"
						>
							<Trash2 className="w-3.5 h-3.5 mr-1.5" />
							Hapus Pengajuan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
