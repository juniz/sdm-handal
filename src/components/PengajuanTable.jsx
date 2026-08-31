"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
	Eye,
	Edit,
	Trash2,
	Clock,
	CheckCircle,
	XCircle,
	ArrowRight,
	Calendar,
} from "lucide-react";
import moment from "moment-timezone";

const PengajuanTable = ({
	data = [],
	currentPage = 1,
	itemsPerPage = 10,
	userDepartment = "USER",
	currentUserNik = null,
	onView,
	onEdit,
	onDelete,
}) => {
	const startIndex = (currentPage - 1) * itemsPerPage;

	// Helper function to determine user's role in pengajuan
	const getUserRole = (item) => {
		if (currentUserNik === item.nik) {
			return { role: "Pemohon", className: "bg-sky-100 text-sky-800 border-sky-200" };
		} else if (currentUserNik === item.nik_pj) {
			return { role: "PJ / Verifikator", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
		} else if (currentUserNik === item.nik_ganti) {
			return { role: "Rekan Pengganti", className: "bg-amber-100 text-amber-800 border-amber-200" };
		}
		return null;
	};

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

	if (data.length === 0) {
		return (
			<div className="text-center py-12">
				<Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
				<p className="text-slate-500 text-sm font-medium">Belum ada data pengajuan tukar dinas</p>
			</div>
		);
	}

	return (
		<>
			{/* Desktop Table View - Streamlined 6 Essential Columns */}
			<div className="hidden md:block overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-200">
							<TableHead className="w-12 text-center text-xs font-semibold text-slate-700">No</TableHead>
							<TableHead className="w-40 text-xs font-semibold text-slate-700">Pengajuan</TableHead>
							<TableHead className="w-48 text-xs font-semibold text-slate-700">Pemohon & Peran</TableHead>
							<TableHead className="text-xs font-semibold text-slate-700">Pertukaran Dinas (Asal → Pengganti)</TableHead>
							<TableHead className="w-44 text-xs font-semibold text-slate-700">Penanggung Jawab</TableHead>
							<TableHead className="w-48 text-center text-xs font-semibold text-slate-700">Status & Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((item, index) => {
							const userRole = getUserRole(item);
							const isPJ = currentUserNik === item.nik_pj;
							const isPemohon = currentUserNik === item.nik;
							const canDelete = isPemohon && item.status === "Proses Pengajuan";

							return (
								<TableRow key={`pengajuan-${item.id}-${index}`} className="hover:bg-slate-50/60 border-slate-100 transition-colors">
									{/* 1. No */}
									<TableCell className="text-center text-xs font-medium text-slate-500 py-3.5">
										{startIndex + index + 1}
									</TableCell>

									{/* 2. No. Pengajuan & Tanggal */}
									<TableCell className="py-3.5">
										<div className="font-mono text-xs font-semibold text-sky-700">
											{item.no_pengajuan || `#${item.id}`}
										</div>
										<div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
											<Calendar className="w-3 h-3 text-slate-400" />
											{moment(item.tanggal).format("DD MMM YYYY")}
										</div>
									</TableCell>

									{/* 3. Pemohon & Role */}
									<TableCell className="py-3.5">
										<div className="text-sm font-medium text-slate-900 leading-snug">
											{item.nama_pemohon || item.nik}
										</div>
										{userRole && (
											<span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${userRole.className}`}>
												{userRole.role}
											</span>
										)}
									</TableCell>

									{/* 4. Pertukaran Dinas (Asal -> Pengganti) */}
									<TableCell className="py-3.5">
										<div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/70 rounded-lg p-2.5 max-w-xl">
											{/* Asal */}
											<div className="flex-1 min-w-0">
												<div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">
													Dinas Asal
												</div>
												<div className="text-xs font-semibold text-slate-900">
													{moment(item.tgl_dinas).format("DD MMM YYYY")}
												</div>
												<div className="mt-1">
													{getShiftBadge(item.shift1)}
												</div>
											</div>

											{/* Arrow */}
											<div className="flex-shrink-0 text-slate-400 px-1">
												<ArrowRight className="w-4 h-4 text-sky-600" />
											</div>

											{/* Pengganti */}
											<div className="flex-1 min-w-0">
												<div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">
													Pengganti: <span className="text-slate-900 font-semibold">{item.nama_pengganti || item.nik_ganti}</span>
												</div>
												<div className="text-xs font-semibold text-slate-900">
													{moment(item.tgl_ganti).format("DD MMM YYYY")}
												</div>
												<div className="mt-1">
													{getShiftBadge(item.shift2)}
												</div>
											</div>
										</div>
									</TableCell>

									{/* 5. Penanggung Jawab */}
									<TableCell className="py-3.5 text-xs text-slate-700">
										<div className="font-medium text-slate-900">
											{item.nama_pj || (item.nik_pj ? item.nik_pj : "-")}
										</div>
										<div className="text-[11px] text-slate-400 mt-0.5">Verifikator</div>
									</TableCell>

									{/* 6. Status & Aksi */}
									<TableCell className="py-3.5 text-center">
										<div className="flex flex-col items-center gap-2">
											{getStatusBadge(item.status)}
											<div className="flex items-center justify-center gap-1.5 mt-0.5">
												<Button
													size="sm"
													variant="outline"
													className="h-8 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
													onClick={() => onView(item)}
													title="Lihat detail pengajuan"
												>
													<Eye className="w-3.5 h-3.5 mr-1" />
													Detail
												</Button>

												{isPJ && (
													<Button
														size="sm"
														variant="outline"
														className="h-8 px-2.5 text-xs border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
														onClick={() => onEdit(item)}
														title="Update status persetujuan"
													>
														<Edit className="w-3.5 h-3.5 mr-1" />
														Status
													</Button>
												)}

												{canDelete && (
													<Button
														size="sm"
														variant="outline"
														className="h-8 px-2 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
														onClick={() => onDelete(item)}
														title="Hapus pengajuan"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												)}
											</div>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Mobile Card View */}
			<div className="md:hidden space-y-3">
				{data.map((item, index) => {
					const userRole = getUserRole(item);
					const isPJ = currentUserNik === item.nik_pj;
					const isPemohon = currentUserNik === item.nik;
					const canDelete = isPemohon && item.status === "Proses Pengajuan";

					return (
						<Card key={`mobile-card-${item.id}-${index}`} className="p-4 border-slate-200 bg-white shadow-sm space-y-3">
							{/* Top Bar: No, Status, Date */}
							<div className="flex items-center justify-between pb-2 border-b border-slate-100">
								<div className="flex items-center gap-2">
									<span className="text-xs font-bold text-slate-400">
										#{startIndex + index + 1}
									</span>
									<span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
										{item.no_pengajuan || `#${item.id}`}
									</span>
								</div>
								<span className="text-xs text-slate-500">
									{moment(item.tanggal).format("DD MMM YYYY")}
								</span>
							</div>

							{/* Status & Role Badges */}
							<div className="flex items-center justify-between gap-2">
								{getStatusBadge(item.status)}
								{userRole && (
									<span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${userRole.className}`}>
										{userRole.role}
									</span>
								)}
							</div>

							{/* Pemohon (if IT_HRD) */}
							{userDepartment === "IT_HRD" && (
								<div className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
									<span className="text-slate-500">Pemohon:</span>{" "}
									<span className="font-semibold text-slate-900">{item.nama_pemohon || item.nik}</span>
								</div>
							)}

							{/* Side-by-Side Exchange Grid */}
							<div className="grid grid-cols-2 gap-2 bg-slate-50/80 border border-slate-200/80 rounded-lg p-3">
								<div className="space-y-1">
									<div className="text-[10px] font-bold text-slate-400 uppercase">Dinas Asal</div>
									<div className="text-xs font-semibold text-slate-900">
										{moment(item.tgl_dinas).format("DD MMM YYYY")}
									</div>
									<div>{getShiftBadge(item.shift1)}</div>
								</div>

								<div className="space-y-1 border-l border-slate-200 pl-2">
									<div className="text-[10px] font-bold text-slate-400 uppercase">Dinas Pengganti</div>
									<div className="text-xs font-semibold text-slate-900">
										{moment(item.tgl_ganti).format("DD MMM YYYY")}
									</div>
									<div>{getShiftBadge(item.shift2)}</div>
								</div>
							</div>

							{/* Rekan & PJ info */}
							<div className="text-xs text-slate-600 space-y-1 pt-1">
								<div>
									<span className="text-slate-400">Rekan Pengganti:</span>{" "}
									<span className="font-semibold text-slate-800">{item.nama_pengganti || item.nik_ganti}</span>
								</div>
								{item.nama_pj && (
									<div>
										<span className="text-slate-400">PJ / Atasan:</span>{" "}
										<span className="font-medium text-slate-800">{item.nama_pj}</span>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2 pt-2 border-t border-slate-100">
								<Button
									size="sm"
									variant="outline"
									className="flex-1 h-9 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
									onClick={() => onView(item)}
								>
									<Eye className="w-3.5 h-3.5 mr-1" />
									Detail
								</Button>

								{isPJ && (
									<Button
										size="sm"
										variant="outline"
										className="flex-1 h-9 text-xs border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
										onClick={() => onEdit(item)}
									>
										<Edit className="w-3.5 h-3.5 mr-1" />
										Status
									</Button>
								)}

								{canDelete && (
									<Button
										size="sm"
										variant="outline"
										className="h-9 px-3 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
										onClick={() => onDelete(item)}
										title="Hapus pengajuan"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</Button>
								)}
							</div>
						</Card>
					);
				})}
			</div>
		</>
	);
};

export default PengajuanTable;

