"use client";
import { useCallback, useRef, useEffect } from "react";
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
	FileText,
	ShieldCheck,
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
	currentUserNik,

	// Delete Dialog
	showDeleteDialog,
	setShowDeleteDialog,
	pengajuanToDelete,
	setPengajuanToDelete,
	onDeleteConfirm,
}) => {
	const isMountedRef = useRef(true);
	const isClosingRef = useRef({
		update: false,
		detail: false,
		delete: false,
	});

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Safe dialog close handlers untuk mencegah removeChild error
	const handleUpdateDialogChange = useCallback((open) => {
		if (!isMountedRef.current) return;
		if (!open && isClosingRef.current.update) return;

		if (!open) {
			isClosingRef.current.update = true;
			requestAnimationFrame(() => {
				if (isMountedRef.current) {
					setShowUpdateDialog(false);
				}
				setTimeout(() => {
					isClosingRef.current.update = false;
				}, 200);
			});
		} else {
			setShowUpdateDialog(true);
		}
	}, [setShowUpdateDialog]);

	const handleDetailDialogChange = useCallback((open) => {
		if (!isMountedRef.current) return;
		if (!open && isClosingRef.current.detail) return;

		if (!open) {
			isClosingRef.current.detail = true;
			requestAnimationFrame(() => {
				if (isMountedRef.current) {
					setShowDetailDialog(false);
				}
				setTimeout(() => {
					isClosingRef.current.detail = false;
				}, 200);
			});
		} else {
			setShowDetailDialog(true);
		}
	}, [setShowDetailDialog]);

	const handleDeleteDialogChange = useCallback((open) => {
		if (!isMountedRef.current) return;
		if (!open && isClosingRef.current.delete) return;

		if (!open) {
			isClosingRef.current.delete = true;
			requestAnimationFrame(() => {
				if (isMountedRef.current) {
					setShowDeleteDialog(false);
					setPengajuanToDelete(null);
				}
				setTimeout(() => {
					isClosingRef.current.delete = false;
				}, 200);
			});
		} else {
			setShowDeleteDialog(true);
		}
	}, [setShowDeleteDialog, setPengajuanToDelete]);

	const getStatusBadge = (status) => {
		const statusConfig = {
			"Proses Pengajuan": {
				className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
				icon: Clock,
				text: "Proses Pengajuan",
			},
			Disetujui: {
				className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
				icon: CheckCircle,
				text: "Disetujui",
			},
			Ditolak: {
				className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
				icon: XCircle,
				text: "Ditolak",
			},
		};

		const config = statusConfig[status] || statusConfig["Proses Pengajuan"];
		const Icon = config.icon;

		return (
			<Badge
				variant="outline"
				className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.className}`}
			>
				<Icon className="w-3 h-3 flex-shrink-0" />
				<span>{config.text}</span>
			</Badge>
		);
	};

	const getShiftBadge = (shift) => {
		const shiftConfig = {
			Pagi: "bg-amber-50 text-amber-800 border-amber-200",
			Siang: "bg-orange-50 text-orange-800 border-orange-200",
			Malam: "bg-indigo-50 text-indigo-800 border-indigo-200",
		};

		const style = shiftConfig[shift] || "bg-slate-100 text-slate-800 border-slate-200";

		return (
			<span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${style}`}>
				{shift || "-"}
			</span>
		);
	};

	return (
		<>
			{/* Dialog Update Status */}
			<Dialog open={showUpdateDialog} onOpenChange={handleUpdateDialogChange} modal={false}>
				<DialogContent className="max-w-md rounded-xl border-slate-200 p-0 overflow-hidden bg-white">
					<DialogHeader className="p-5 pb-4 border-b border-slate-100">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
								<ShieldCheck className="w-4 h-4" />
							</div>
							<div>
								<DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
									Update Status Pengajuan
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500 mt-0.5">
									Konfirmasi persetujuan atau penolakan tukar dinas
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-5 space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="status" className="text-xs font-medium text-slate-700">
								Status Persetujuan <span className="text-red-500">*</span>
							</Label>
							<Select
								value={updateData.status}
								onValueChange={(value) =>
									setUpdateData({ ...updateData, status: value })
								}
							>
								<SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm">
									<SelectValue placeholder="Pilih status persetujuan" />
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
							<div className="space-y-1.5">
								<Label htmlFor="alasan_ditolak" className="text-xs font-medium text-slate-700">
									Alasan Penolakan <span className="text-red-500">*</span>
								</Label>
								<Textarea
									id="alasan_ditolak"
									placeholder="Tuliskan alasan penolakan secara jelas (misal: bentrok jadwal unit, kuota tukar habis)..."
									value={updateData.alasan_ditolak}
									onChange={(e) =>
										setUpdateData({
											...updateData,
											alasan_ditolak: e.target.value,
										})
									}
									rows={3}
									className="resize-none bg-white border-slate-200 text-sm focus:border-sky-500 focus:ring-sky-500/20"
								/>
							</div>
						)}
					</div>

					<DialogFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => handleUpdateDialogChange(false)}
							className="h-9 text-xs border-slate-200 text-slate-700"
						>
							Batal
						</Button>
						<Button
							onClick={onUpdateStatus}
							className="h-9 text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
						>
							Simpan Perubahan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Detail Pengajuan (Ticket Slip Style) */}
			<Dialog open={showDetailDialog} onOpenChange={handleDetailDialogChange} modal={false}>
				<DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-xl border-slate-200 bg-white">
					<DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex-shrink-0">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 flex-shrink-0">
									<FileText className="w-5 h-5" />
								</div>
								<div>
									<DialogTitle className="text-lg font-bold text-slate-900">
										Detail Pengajuan Tukar Dinas
									</DialogTitle>
									<DialogDescription className="text-xs text-slate-500 mt-0.5">
										No. Tiket:{" "}
										<span className="font-mono font-semibold text-sky-700">
											{selectedPengajuan?.no_pengajuan || `#${selectedPengajuan?.id}`}
										</span>
									</DialogDescription>
								</div>
							</div>
							{selectedPengajuan && (
								<div>{getStatusBadge(selectedPengajuan.status)}</div>
							)}
						</div>
					</DialogHeader>

					{selectedPengajuan && (
						<div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
							{/* Exchange Flow Visual Slip */}
							<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
								<div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
									Rincian Pertukaran Shift
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
									{/* Dinas Asal */}
									<div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
										<div className="text-[11px] font-medium text-slate-500">Dinas Asal (Pemohon)</div>
										<div className="text-sm font-semibold text-slate-900">
											{moment(selectedPengajuan.tgl_dinas).format("DD MMMM YYYY")}
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-slate-500">Shift:</span>
											{getShiftBadge(selectedPengajuan.shift1)}
										</div>
									</div>

									{/* Dinas Pengganti */}
									<div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
										<div className="text-[11px] font-medium text-slate-500">Dinas Pengganti (Rekan)</div>
										<div className="text-sm font-semibold text-slate-900">
											{moment(selectedPengajuan.tgl_ganti).format("DD MMMM YYYY")}
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-slate-500">Shift:</span>
											{getShiftBadge(selectedPengajuan.shift2)}
										</div>
									</div>
								</div>
							</div>

							{/* Identitas Staf & Penanggung Jawab */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
									<div className="text-[11px] font-medium text-slate-500">Pemohon (NIK / Nama)</div>
									<div className="text-xs font-mono text-slate-600">{selectedPengajuan.nik}</div>
									<div className="text-sm font-semibold text-slate-900">
										{selectedPengajuan.nama_pemohon || selectedPengajuan.nik}
									</div>
								</div>

								<div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
									<div className="text-[11px] font-medium text-slate-500">Rekan Pengganti (NIK / Nama)</div>
									<div className="text-xs font-mono text-slate-600">{selectedPengajuan.nik_ganti}</div>
									<div className="text-sm font-semibold text-slate-900">
										{selectedPengajuan.nama_pengganti || selectedPengajuan.nik_ganti}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
									<div className="text-[11px] font-medium text-slate-500">Penanggung Jawab / Atasan</div>
									<div className="text-sm font-semibold text-slate-900">
										{selectedPengajuan.nama_pj || (selectedPengajuan.nik_pj ? selectedPengajuan.nik_pj : "-")}
									</div>
								</div>

								<div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
									<div className="text-[11px] font-medium text-slate-500">Tanggal Pengajuan</div>
									<div className="text-sm font-semibold text-slate-900">
										{moment(selectedPengajuan.tanggal).format("DD MMMM YYYY")}
									</div>
								</div>
							</div>

							{/* Alasan / Kepentingan */}
							<div className="space-y-1.5">
								<div className="text-xs font-medium text-slate-700">Alasan / Keperluan:</div>
								<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
									{selectedPengajuan.kepentingan || "-"}
								</div>
							</div>

							{/* Alasan Penolakan jika Ditolak */}
							{selectedPengajuan.status === "Ditolak" && selectedPengajuan.alasan_ditolak && (
								<div className="space-y-1.5">
									<div className="text-xs font-medium text-rose-700">Catatan Penolakan dari PJ:</div>
									<div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs sm:text-sm text-rose-800 leading-relaxed break-words">
										{selectedPengajuan.alasan_ditolak}
									</div>
								</div>
							)}
						</div>
					)}

					<DialogFooter className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0 flex gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => handleDetailDialogChange(false)}
							className="h-9 text-xs border-slate-200 text-slate-700"
						>
							Tutup
						</Button>
						{selectedPengajuan && currentUserNik === selectedPengajuan.nik_pj && (
							<Button
								onClick={() => {
									setUpdateData({
										status: selectedPengajuan.status,
										alasan_ditolak: selectedPengajuan.alasan_ditolak || "",
									});
									handleDetailDialogChange(false);
									setTimeout(() => {
										if (isMountedRef.current) {
											setShowUpdateDialog(true);
										}
									}, 250);
								}}
								className="h-9 text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
							>
								<Edit className="w-3.5 h-3.5 mr-1" />
								Update Status
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Konfirmasi Hapus */}
			<Dialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange} modal={false}>
				<DialogContent className="max-w-md rounded-xl border-slate-200 p-0 overflow-hidden bg-white">
					<DialogHeader className="p-5 pb-4 border-b border-slate-100">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-600 flex-shrink-0">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
									Hapus Pengajuan Tukar Dinas
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500 mt-0.5">
									Tindakan ini permanen dan tidak dapat dibatalkan
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{pengajuanToDelete && (
						<div className="p-5 space-y-3">
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
								<div className="flex items-center justify-between">
									<span className="text-slate-500">No. Pengajuan:</span>
									<span className="font-mono font-semibold text-slate-900">
										{pengajuanToDelete.no_pengajuan || `#${pengajuanToDelete.id}`}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Pemohon:</span>
									<span className="font-semibold text-slate-900">
										{pengajuanToDelete.nama_pemohon || pengajuanToDelete.nik}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Tanggal Pengajuan:</span>
									<span className="text-slate-700">
										{moment(pengajuanToDelete.tanggal).format("DD MMM YYYY")}
									</span>
								</div>
							</div>

							<p className="text-xs text-slate-500 leading-relaxed">
								Apakah Anda yakin ingin membatalkan dan menghapus data pengajuan ini?
							</p>
						</div>
					)}

					<DialogFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => handleDeleteDialogChange(false)}
							className="h-9 text-xs border-slate-200 text-slate-700"
						>
							Batal
						</Button>
						<Button
							variant="destructive"
							onClick={onDeleteConfirm}
							className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
						>
							<Trash2 className="w-3.5 h-3.5 mr-1" />
							Hapus Pengajuan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default PengajuanDialogs;

