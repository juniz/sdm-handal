"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
	Loader2,
	Plus,
	Eye,
	Edit,
	CreditCard,
	Clock,
	CheckCircle,
	XCircle,
	Trash2,
	AlertTriangle,
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
				// Gunakan departemen_name jika ada, atau fallback ke departemen
				const dept = data.data.departemen_name || data.data.departemen;
				const deptId = data.data.departemen;

				// Cek apakah user dari IT atau HRD (bisa berdasarkan ID atau nama)
				const isITorHRD =
					deptId === "IT" ||
					deptId === "HRD" ||
					dept?.toLowerCase().includes("it") ||
					dept?.toLowerCase().includes("teknologi") ||
					dept?.toLowerCase().includes("hrd") ||
					dept?.toLowerCase().includes("human resource");

				// IT dan HRD bisa mengajukan DAN memproses
				setUserDepartment(isITorHRD ? "IT_HRD" : "USER");
			}
		} catch (error) {
			console.error("Error checking user department:", error);
		}
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/pengajuan-kta");

			if (response.ok) {
				const result = await response.json();
				setPengajuanData(result.data || []);
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

		if (!formData.jenis || !formData.alasan) {
			toast.error("Semua field harus diisi");
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
				toast.success("Pengajuan KTA berhasil disubmit");
				setFormData({ jenis: "", alasan: "" });
				setShowFormDialog(false);
				fetchData(); // Refresh data
			} else {
				toast.error(result.message || "Gagal submit pengajuan KTA");
			}
		} catch (error) {
			console.error("Error submitting:", error);
			toast.error("Terjadi kesalahan saat submit pengajuan");
		} finally {
			setSubmitLoading(false);
		}
	};

	const handleUpdateStatus = async () => {
		if (!updateData.status) {
			toast.error("Status harus dipilih");
			return;
		}

		if (updateData.status === "ditolak" && !updateData.alasan_ditolak) {
			toast.error("Alasan penolakan harus diisi");
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
				toast.success("Status pengajuan berhasil diupdate");
				setShowUpdateDialog(false);
				setSelectedPengajuan(null);
				setUpdateData({ status: "", alasan_ditolak: "" });
				fetchData(); // Refresh data
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
				toast.success("Pengajuan berhasil dihapus");
				setShowDeleteDialog(false);
				setPengajuanToDelete(null);
				fetchData(); // Refresh data
			} else {
				toast.error(result.message || "Gagal menghapus pengajuan");
			}
		} catch (error) {
			console.error("Error deleting pengajuan:", error);
			toast.error("Terjadi kesalahan saat menghapus pengajuan");
		}
	};

	const getStatusBadge = (status) => {
		const statusConfig = {
			pending: { variant: "secondary", icon: Clock, text: "Pending" },
			disetujui: { variant: "default", icon: CheckCircle, text: "Disetujui" },
			ditolak: { variant: "destructive", icon: XCircle, text: "Ditolak" },
			proses: { variant: "default", icon: Loader2, text: "Proses" },
			selesai: { variant: "default", icon: CheckCircle, text: "Selesai" },
		};

		const config = statusConfig[status] || statusConfig.pending;
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="flex items-center gap-1">
				<Icon className="w-3 h-3" />
				{config.text}
			</Badge>
		);
	};

	const getJenisBadge = (jenis) => {
		const jenisConfig = {
			Baru: { variant: "default", text: "Baru" },
			Ganti: { variant: "secondary", text: "Ganti" },
			Hilang: { variant: "destructive", text: "Hilang" },
		};

		const config = jenisConfig[jenis] || jenisConfig["Baru"];

		return <Badge variant={config.variant}>{config.text}</Badge>;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
						<CreditCard className="w-8 h-8 text-blue-600" />
						Pengajuan KTA
					</h1>
					<p className="text-gray-600 mt-1">
						Kelola pengajuan Kartu Tanda Anggota (KTA). Pengajuan dengan status
						pending dapat dihapus.
					</p>
				</div>

				{(userDepartment === "USER" || userDepartment === "IT_HRD") && (
					<Button
						onClick={() => setShowFormDialog(true)}
						className="flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Ajukan KTA
					</Button>
				)}
			</div>

			{/* Form Pengajuan Modal */}
			<Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
								<CreditCard className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<DialogTitle className="text-lg font-semibold text-gray-900">
									Form Pengajuan KTA
								</DialogTitle>
								<DialogDescription className="text-sm text-gray-600 mt-1">
									Isi form berikut untuk mengajukan Kartu Tanda Anggota
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="jenis">Jenis Pengajuan</Label>
							<Select
								value={formData.jenis}
								onValueChange={(value) =>
									setFormData({ ...formData, jenis: value })
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih jenis pengajuan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Baru">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											<span>Baru</span>
										</div>
									</SelectItem>
									<SelectItem value="Ganti">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
											<span>Ganti</span>
										</div>
									</SelectItem>
									<SelectItem value="Hilang">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-red-500 rounded-full"></div>
											<span>Hilang</span>
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="alasan">Alasan Pengajuan</Label>
							<Textarea
								id="alasan"
								placeholder="Jelaskan alasan pengajuan KTA Anda..."
								value={formData.alasan}
								onChange={(e) =>
									setFormData({ ...formData, alasan: e.target.value })
								}
								rows={4}
								className="resize-none"
							/>
							<div className="text-xs text-gray-500 mt-1">
								Minimum 10 karakter, maksimum 500 karakter
							</div>
						</div>

						<DialogFooter className="gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setShowFormDialog(false);
									setFormData({ jenis: "", alasan: "" });
								}}
								className="flex-1 sm:flex-none"
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={submitLoading || !formData.jenis || !formData.alasan}
								className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
							>
								{submitLoading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin mr-2" />
										Mengirim...
									</>
								) : (
									<>
										<Plus className="w-4 h-4 mr-2" />
										Submit Pengajuan
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Tabel Data */}
			<Card>
				<CardHeader>
					<CardTitle>Data Pengajuan KTA</CardTitle>
				</CardHeader>
				<CardContent>
					{pengajuanData.length === 0 ? (
						<div className="text-center py-8">
							<CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-500">Belum ada data pengajuan KTA</p>
						</div>
					) : (
						<>
							{/* Desktop Table View */}
							<div className="hidden md:block">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>No</TableHead>
											<TableHead>No Pengajuan</TableHead>
											{userDepartment === "IT_HRD" && (
												<>
													<TableHead>NIK</TableHead>
													<TableHead>Nama</TableHead>
													<TableHead>Jabatan</TableHead>
												</>
											)}
											<TableHead>Jenis</TableHead>
											<TableHead>Alasan</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Tanggal Pengajuan</TableHead>
											{selectedPengajuan?.alasan_ditolak && (
												<TableHead>Alasan Ditolak</TableHead>
											)}
											<TableHead>Aksi</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pengajuanData.map((item, index) => (
											<TableRow key={item.id}>
												<TableCell>{index + 1}</TableCell>
												<TableCell className="font-mono text-blue-600">
													{item.no_pengajuan || "-"}
												</TableCell>
												{userDepartment === "IT_HRD" && (
													<>
														<TableCell className="font-mono">
															{item.nik}
														</TableCell>
														<TableCell>{item.nama}</TableCell>
														<TableCell>{item.jbtn}</TableCell>
													</>
												)}
												<TableCell>{getJenisBadge(item.jenis)}</TableCell>
												<TableCell
													className="max-w-xs truncate"
													title={item.alasan}
												>
													{item.alasan}
												</TableCell>
												<TableCell>{getStatusBadge(item.status)}</TableCell>
												<TableCell>
													{moment(item.created_at).format("DD MMM YYYY, HH:mm")}
												</TableCell>
												{item.alasan_ditolak && (
													<TableCell
														className="max-w-xs truncate text-red-600"
														title={item.alasan_ditolak}
													>
														{item.alasan_ditolak}
													</TableCell>
												)}
												<TableCell>
													<div className="flex gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																setSelectedPengajuan(item);
																setShowDetailDialog(true);
															}}
														>
															<Eye className="w-4 h-4" />
														</Button>

														{userDepartment === "IT_HRD" && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setSelectedPengajuan(item);
																	setUpdateData({
																		status: item.status,
																		alasan_ditolak: item.alasan_ditolak || "",
																	});
																	setShowUpdateDialog(true);
																}}
															>
																<Edit className="w-4 h-4" />
															</Button>
														)}

														{/* Tombol hapus hanya untuk status pending */}
														{item.status === "pending" && (
															<Button
																size="sm"
																variant="outline"
																className="text-red-600 hover:text-red-700 hover:bg-red-50"
																onClick={() => handleDeleteClick(item)}
																title="Hapus pengajuan"
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
							<div className="md:hidden space-y-4">
								{pengajuanData.map((item, index) => (
									<Card key={item.id} className="p-4">
										<div className="space-y-3">
											{/* Header dengan nomor dan status */}
											<div className="flex justify-between items-start">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium text-gray-500">
															#{index + 1}
														</span>
														{getJenisBadge(item.jenis)}
													</div>
													{item.no_pengajuan && (
														<div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
															{item.no_pengajuan}
														</div>
													)}
												</div>
												{getStatusBadge(item.status)}
											</div>

											{/* Data pegawai (hanya untuk IT_HRD) */}
											{userDepartment === "IT_HRD" && (
												<div className="space-y-2 border-l-2 border-gray-200 pl-3">
													<div className="text-sm">
														<span className="font-medium">NIK:</span>{" "}
														<span className="font-mono">{item.nik}</span>
													</div>
													<div className="text-sm">
														<span className="font-medium">Nama:</span>{" "}
														{item.nama}
													</div>
													<div className="text-sm">
														<span className="font-medium">Jabatan:</span>{" "}
														{item.jbtn}
													</div>
												</div>
											)}

											{/* Alasan */}
											<div>
												<div className="text-sm font-medium text-gray-700 mb-1">
													Alasan Pengajuan:
												</div>
												<div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
													{item.alasan}
												</div>
											</div>

											{/* Alasan ditolak jika ada */}
											{item.alasan_ditolak && (
												<div>
													<div className="text-sm font-medium text-red-700 mb-1">
														Alasan Ditolak:
													</div>
													<div className="text-sm text-red-600 bg-red-50 p-2 rounded">
														{item.alasan_ditolak}
													</div>
												</div>
											)}

											{/* Tanggal */}
											<div className="text-xs text-gray-500">
												{moment(item.created_at).format("DD MMM YYYY, HH:mm")}
											</div>

											{/* Actions */}
											<div className="flex gap-2 pt-2 border-t">
												<Button
													size="sm"
													variant="outline"
													className="flex-1"
													onClick={() => {
														setSelectedPengajuan(item);
														setShowDetailDialog(true);
													}}
												>
													<Eye className="w-4 h-4 mr-1" />
													Lihat
												</Button>

												{userDepartment === "IT_HRD" && (
													<Button
														size="sm"
														variant="outline"
														className="flex-1"
														onClick={() => {
															setSelectedPengajuan(item);
															setUpdateData({
																status: item.status,
																alasan_ditolak: item.alasan_ditolak || "",
															});
															setShowUpdateDialog(true);
														}}
													>
														<Edit className="w-4 h-4 mr-1" />
														Edit
													</Button>
												)}

												{/* Tombol hapus hanya untuk status pending */}
												{item.status === "pending" && (
													<Button
														size="sm"
														variant="outline"
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
														onClick={() => handleDeleteClick(item)}
														title="Hapus pengajuan"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
									</Card>
								))}
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Dialog Update Status */}
			<Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Status Pengajuan</DialogTitle>
						<DialogDescription>
							Update status pengajuan KTA untuk {selectedPengajuan?.nama}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="status">Status</Label>
							<Select
								value={updateData.status}
								onValueChange={(value) =>
									setUpdateData({ ...updateData, status: value })
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="disetujui">Disetujui</SelectItem>
									<SelectItem value="ditolak">Ditolak</SelectItem>
									<SelectItem value="proses">Proses</SelectItem>
									<SelectItem value="selesai">Selesai</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{updateData.status === "ditolak" && (
							<div>
								<Label htmlFor="alasan_ditolak">Alasan Penolakan</Label>
								<Textarea
									id="alasan_ditolak"
									placeholder="Jelaskan alasan penolakan..."
									value={updateData.alasan_ditolak}
									onChange={(e) =>
										setUpdateData({
											...updateData,
											alasan_ditolak: e.target.value,
										})
									}
									rows={3}
								/>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowUpdateDialog(false)}
						>
							Batal
						</Button>
						<Button onClick={handleUpdateStatus}>Update Status</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Detail Pengajuan */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
					<DialogHeader className="flex-shrink-0">
						<DialogTitle>Detail Pengajuan KTA</DialogTitle>
						<DialogDescription>
							Informasi lengkap pengajuan KTA
						</DialogDescription>
					</DialogHeader>

					{selectedPengajuan && (
						<div className="flex-1 overflow-y-auto space-y-6 pr-2">
							{/* Informasi Pengajuan */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label className="text-sm font-medium text-gray-700">
										No Pengajuan
									</Label>
									<div className="mt-1 p-2 bg-blue-50 rounded text-sm font-mono text-blue-600">
										{selectedPengajuan.no_pengajuan ||
											`#${selectedPengajuan.id}`}
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium text-gray-700">
										Status
									</Label>
									<div className="mt-1">
										{getStatusBadge(selectedPengajuan.status)}
									</div>
								</div>
							</div>

							{/* Data Pemohon */}
							<div className="border-t pt-4">
								<h4 className="font-medium text-gray-900 mb-3">Data Pemohon</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-gray-700">
											NIK
										</Label>
										<div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono">
											{selectedPengajuan.nik}
										</div>
									</div>
									{selectedPengajuan.nama && (
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Nama
											</Label>
											<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
												{selectedPengajuan.nama}
											</div>
										</div>
									)}
									{selectedPengajuan.jbtn && (
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Jabatan
											</Label>
											<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
												{selectedPengajuan.jbtn}
											</div>
										</div>
									)}
									{selectedPengajuan.departemen && (
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Departemen
											</Label>
											<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
												{selectedPengajuan.departemen}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Detail Pengajuan */}
							<div className="border-t pt-4">
								<h4 className="font-medium text-gray-900 mb-3">
									Detail Pengajuan
								</h4>
								<div className="space-y-4">
									<div>
										<Label className="text-sm font-medium text-gray-700">
											Jenis Pengajuan
										</Label>
										<div className="mt-1">
											{getJenisBadge(selectedPengajuan.jenis)}
										</div>
									</div>
									<div>
										<Label className="text-sm font-medium text-gray-700">
											Alasan Pengajuan
										</Label>
										<div className="mt-1 p-3 bg-gray-50 rounded text-sm break-words">
											{selectedPengajuan.alasan}
										</div>
									</div>
									{selectedPengajuan.alasan_ditolak && (
										<div>
											<Label className="text-sm font-medium text-red-700">
												Alasan Ditolak
											</Label>
											<div className="mt-1 p-3 bg-red-50 rounded text-sm text-red-600 break-words">
												{selectedPengajuan.alasan_ditolak}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Informasi Waktu */}
							<div className="border-t pt-4 pb-4">
								<h4 className="font-medium text-gray-900 mb-3">
									Informasi Waktu
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-gray-700">
											Tanggal Pengajuan
										</Label>
										<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
											{moment(selectedPengajuan.created_at).format(
												"DD MMMM YYYY, HH:mm"
											)}
										</div>
									</div>
									{selectedPengajuan.updated_at &&
										selectedPengajuan.updated_at !==
											selectedPengajuan.created_at && (
											<div>
												<Label className="text-sm font-medium text-gray-700">
													Terakhir Diupdate
												</Label>
												<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
													{moment(selectedPengajuan.updated_at).format(
														"DD MMMM YYYY, HH:mm"
													)}
												</div>
											</div>
										)}
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
						<Button
							variant="outline"
							onClick={() => setShowDetailDialog(false)}
						>
							Tutup
						</Button>
						{userDepartment === "IT_HRD" && selectedPengajuan && (
							<Button
								onClick={() => {
									setUpdateData({
										status: selectedPengajuan.status,
										alasan_ditolak: selectedPengajuan.alasan_ditolak || "",
									});
									setShowDetailDialog(false);
									setShowUpdateDialog(true);
								}}
							>
								<Edit className="w-4 h-4 mr-1" />
								Edit Status
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
							<div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
								<AlertTriangle className="w-6 h-6 text-red-600" />
							</div>
							<div>
								<DialogTitle className="text-lg font-semibold text-gray-900">
									Konfirmasi Hapus Pengajuan
								</DialogTitle>
								<DialogDescription className="text-sm text-gray-600 mt-1">
									Tindakan ini tidak dapat dibatalkan
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{pengajuanToDelete && (
						<div className="py-4">
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-700">
										No Pengajuan:
									</span>
									<span className="text-sm font-mono text-red-600 bg-white px-2 py-1 rounded">
										{pengajuanToDelete.no_pengajuan ||
											`#${pengajuanToDelete.id}`}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-700">
										Jenis:
									</span>
									<div className="text-sm">
										{getJenisBadge(pengajuanToDelete.jenis)}
									</div>
								</div>

								{pengajuanToDelete.nama && (
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-700">
											Pemohon:
										</span>
										<span className="text-sm text-gray-900">
											{pengajuanToDelete.nama}
										</span>
									</div>
								)}

								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-700">
										Tanggal:
									</span>
									<span className="text-sm text-gray-600">
										{moment(pengajuanToDelete.created_at).format("DD MMM YYYY")}
									</span>
								</div>
							</div>

							<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex items-start gap-3">
									<AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
									<div className="text-sm text-yellow-800">
										<p className="font-medium mb-1">Peringatan:</p>
										<p>
											Pengajuan KTA ini akan dihapus secara permanen dan tidak
											dapat dikembalikan. Pastikan Anda yakin dengan tindakan
											ini.
										</p>
									</div>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setShowDeleteDialog(false);
								setPengajuanToDelete(null);
							}}
							className="flex-1 sm:flex-none"
						>
							Batal
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Ya, Hapus
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
