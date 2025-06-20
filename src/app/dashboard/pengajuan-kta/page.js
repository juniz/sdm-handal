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
	const [showForm, setShowForm] = useState(false);
	const [selectedPengajuan, setSelectedPengajuan] = useState(null);
	const [showUpdateDialog, setShowUpdateDialog] = useState(false);

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

				setUserDepartment(isITorHRD ? "ADMIN" : "USER");
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
				setShowForm(false);
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
						Kelola pengajuan Kartu Tanda Anggota (KTA)
					</p>
				</div>

				{userDepartment === "USER" && (
					<Button
						onClick={() => setShowForm(true)}
						className="flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Ajukan KTA
					</Button>
				)}
			</div>

			{/* Form Pengajuan */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Form Pengajuan KTA</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="jenis">Jenis Pengajuan</Label>
									<Select
										value={formData.jenis}
										onValueChange={(value) =>
											setFormData({ ...formData, jenis: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih jenis pengajuan" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Baru">KTA Baru</SelectItem>
											<SelectItem value="Ganti">Ganti KTA</SelectItem>
											<SelectItem value="Hilang">KTA Hilang</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<Label htmlFor="alasan">Alasan Pengajuan</Label>
								<Textarea
									id="alasan"
									placeholder="Jelaskan alasan pengajuan KTA..."
									value={formData.alasan}
									onChange={(e) =>
										setFormData({ ...formData, alasan: e.target.value })
									}
									rows={4}
								/>
							</div>

							<div className="flex gap-2">
								<Button
									type="submit"
									disabled={submitLoading}
									className="flex items-center gap-2"
								>
									{submitLoading && (
										<Loader2 className="w-4 h-4 animate-spin" />
									)}
									Submit Pengajuan
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowForm(false)}
								>
									Batal
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

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
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>No</TableHead>
										{userDepartment === "ADMIN" && (
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
											{userDepartment === "ADMIN" && (
												<>
													<TableCell className="font-mono">
														{item.nik}
													</TableCell>
													<TableCell>{item.nama}</TableCell>
													<TableCell>{item.jabatan}</TableCell>
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
															// Bisa tambahkan dialog detail di sini
														}}
													>
														<Eye className="w-4 h-4" />
													</Button>

													{userDepartment === "ADMIN" && (
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
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
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
								<SelectTrigger>
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
		</div>
	);
}
