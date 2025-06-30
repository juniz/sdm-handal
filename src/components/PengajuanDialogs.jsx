"use client";
import { Button } from "@/components/ui/button";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
	Edit,
	AlertTriangle,
	Trash2,
	Clock,
	CheckCircle,
	XCircle,
} from "lucide-react";
import moment from "moment-timezone";

const PengajuanDialogs = ({
	// Update Status Dialog
	showUpdateDialog,
	setShowUpdateDialog,
	selectedPengajuan,
	updateData,
	setUpdateData,
	onUpdateStatus,

	// Detail Dialog
	showDetailDialog,
	setShowDetailDialog,
	userDepartment,

	// Delete Dialog
	showDeleteDialog,
	setShowDeleteDialog,
	pengajuanToDelete,
	setPengajuanToDelete,
	onDeleteConfirm,
}) => {
	const getStatusBadge = (status) => {
		const statusConfig = {
			"Proses Pengajuan": {
				variant: "secondary",
				icon: Clock,
				text: "Proses Pengajuan",
			},
			Disetujui: { variant: "default", icon: CheckCircle, text: "Disetujui" },
			Ditolak: { variant: "destructive", icon: XCircle, text: "Ditolak" },
		};

		const config = statusConfig[status] || statusConfig["Proses Pengajuan"];
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="flex items-center gap-1">
				<Icon className="w-3 h-3" />
				{config.text}
			</Badge>
		);
	};

	const getShiftBadge = (shift) => {
		const shiftConfig = {
			Pagi: {
				variant: "default",
				text: "Pagi",
				color: "bg-yellow-100 text-yellow-800",
			},
			Siang: {
				variant: "secondary",
				text: "Siang",
				color: "bg-orange-100 text-orange-800",
			},
			Malam: {
				variant: "outline",
				text: "Malam",
				color: "bg-blue-100 text-blue-800",
			},
		};

		const config = shiftConfig[shift] || shiftConfig["Pagi"];

		return (
			<span
				className={`px-2 py-1 rounded-md text-xs font-medium ${config.color}`}
			>
				{config.text}
			</span>
		);
	};

	return (
		<>
			{/* Dialog Update Status */}
			<Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Status Pengajuan</DialogTitle>
						<DialogDescription>
							Update status pengajuan tukar dinas
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
									<SelectItem key="status-proses" value="Proses Pengajuan">
										Proses Pengajuan
									</SelectItem>
									<SelectItem key="status-disetujui" value="Disetujui">
										Disetujui
									</SelectItem>
									<SelectItem key="status-ditolak" value="Ditolak">
										Ditolak
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{updateData.status === "Ditolak" && (
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
						<Button onClick={onUpdateStatus}>Update Status</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Detail Pengajuan */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
					<DialogHeader className="flex-shrink-0">
						<DialogTitle>Detail Pengajuan Tukar Dinas</DialogTitle>
						<DialogDescription>
							Informasi lengkap pengajuan tukar dinas
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
									<div>
										<Label className="text-sm font-medium text-gray-700">
											Nama
										</Label>
										<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
											{selectedPengajuan.nama_pemohon || selectedPengajuan.nik}
										</div>
									</div>
								</div>
							</div>

							{/* Detail Tukar Dinas */}
							<div className="border-t pt-4">
								<h4 className="font-medium text-gray-900 mb-3">
									Detail Tukar Dinas
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<h5 className="font-medium text-gray-800">Dinas Asal</h5>
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Tanggal Dinas
											</Label>
											<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
												{moment(selectedPengajuan.tgl_dinas).format(
													"DD MMMM YYYY"
												)}
											</div>
										</div>
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Shift
											</Label>
											<div className="mt-1">
												{getShiftBadge(selectedPengajuan.shift1)}
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<h5 className="font-medium text-gray-800">
											Dinas Pengganti
										</h5>
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Tanggal Dinas
											</Label>
											<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
												{moment(selectedPengajuan.tgl_ganti).format(
													"DD MMMM YYYY"
												)}
											</div>
										</div>
										<div>
											<Label className="text-sm font-medium text-gray-700">
												Shift
											</Label>
											<div className="mt-1">
												{getShiftBadge(selectedPengajuan.shift2)}
											</div>
										</div>
									</div>
								</div>

								<div className="mt-4 space-y-4">
									<div>
										<Label className="text-sm font-medium text-gray-700">
											Pegawai Pengganti
										</Label>
										<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
											{selectedPengajuan.nama_pengganti ||
												selectedPengajuan.nik_ganti}
										</div>
									</div>

									{selectedPengajuan.nama_pj && (
										<div key="detail-pj">
											<Label className="text-sm font-medium text-gray-700">
												Penanggung Jawab
											</Label>
											<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
												{selectedPengajuan.nama_pj ||
													(selectedPengajuan.nik_pj
														? selectedPengajuan.nik_pj
														: "-")}
											</div>
										</div>
									)}

									<div>
										<Label className="text-sm font-medium text-gray-700">
											Kepentingan/Alasan
										</Label>
										<div className="mt-1 p-3 bg-gray-50 rounded text-sm break-words">
											{selectedPengajuan.keptingan}
										</div>
									</div>
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
											{moment(selectedPengajuan.tanggal).format("DD MMMM YYYY")}
										</div>
									</div>
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
										Pemohon:
									</span>
									<span className="text-sm text-gray-900">
										{pengajuanToDelete.nama_pemohon || pengajuanToDelete.nik}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-700">
										Tanggal:
									</span>
									<span className="text-sm text-gray-600">
										{moment(pengajuanToDelete.tanggal).format("DD MMM YYYY")}
									</span>
								</div>
							</div>

							<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex items-start gap-3">
									<AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
									<div className="text-sm text-yellow-800">
										<p className="font-medium mb-1">Peringatan:</p>
										<p>
											Pengajuan tukar dinas ini akan dihapus secara permanen dan
											tidak dapat dikembalikan. Pastikan Anda yakin dengan
											tindakan ini.
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
							onClick={onDeleteConfirm}
							className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Ya, Hapus
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default PengajuanDialogs;
