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
import { Eye, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
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
			return { role: "Pemohon", color: "bg-blue-100 text-blue-800" };
		} else if (currentUserNik === item.nik_pj) {
			return { role: "Penanggung Jawab", color: "bg-green-100 text-green-800" };
		}
		return null;
	};

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

	if (data.length === 0) {
		return (
			<div className="text-center py-8">
				<Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<p className="text-gray-500">Belum ada data pengajuan tukar dinas</p>
			</div>
		);
	}

	return (
		<>
			{/* Desktop Table View */}
			<div className="hidden md:block overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead key="no">No</TableHead>
							<TableHead key="no-pengajuan">No Pengajuan</TableHead>
							<TableHead key="tanggal">Tanggal</TableHead>
							{userDepartment === "IT_HRD" && (
								<TableHead key="pemohon">Pemohon</TableHead>
							)}
							{currentUserNik && <TableHead key="role">Role</TableHead>}
							<TableHead key="dinas-asal">Dinas Asal</TableHead>
							<TableHead key="pengganti">Pengganti</TableHead>
							<TableHead key="dinas-ganti">Dinas Ganti</TableHead>
							<TableHead key="pj">PJ</TableHead>
							<TableHead key="status">Status</TableHead>
							<TableHead key="aksi">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((item, index) => (
							<TableRow key={`pengajuan-${item.id}-${index}`}>
								<TableCell key={`no-${item.id}`}>
									{startIndex + index + 1}
								</TableCell>
								<TableCell
									key={`no-pengajuan-${item.id}`}
									className="font-mono text-blue-600"
								>
									{item.no_pengajuan || "-"}
								</TableCell>
								<TableCell key={`tanggal-${item.id}`}>
									{moment(item.tanggal).format("DD MMM YYYY")}
								</TableCell>
								{userDepartment === "IT_HRD" && (
									<TableCell key={`pemohon-${item.id}`}>
										{item.nama_pemohon || item.nik}
									</TableCell>
								)}
								{currentUserNik && (
									<TableCell key={`role-${item.id}`}>
										{(() => {
											const userRole = getUserRole(item);
											return userRole ? (
												<span
													className={`px-2 py-1 rounded-md text-xs font-medium ${userRole.color}`}
												>
													{userRole.role}
												</span>
											) : (
												<span className="text-gray-400 text-xs">-</span>
											);
										})()}
									</TableCell>
								)}
								<TableCell key={`dinas-asal-${item.id}`}>
									<div className="space-y-1">
										<div className="text-xs text-gray-500">
											{moment(item.tgl_dinas).format("DD MMM")}
										</div>
										{getShiftBadge(item.shift1)}
									</div>
								</TableCell>
								<TableCell key={`pengganti-${item.id}`}>
									{item.nama_pengganti || item.nik_ganti}
								</TableCell>
								<TableCell key={`dinas-ganti-${item.id}`}>
									<div className="space-y-1">
										<div className="text-xs text-gray-500">
											{moment(item.tgl_ganti).format("DD MMM")}
										</div>
										{getShiftBadge(item.shift2)}
									</div>
								</TableCell>
								<TableCell key={`pj-${item.id}`}>
									{item.nama_pj || (item.nik_pj ? item.nik_pj : "-")}
								</TableCell>
								<TableCell key={`status-${item.id}`}>
									{getStatusBadge(item.status)}
								</TableCell>
								<TableCell key={`aksi-${item.id}`}>
									<div className="flex gap-2">
										<Button
											key={`view-${item.id}`}
											size="sm"
											variant="outline"
											onClick={() => onView(item)}
										>
											<Eye className="w-4 h-4" />
										</Button>

										{currentUserNik === item.nik_pj && (
											<Button
												key={`edit-${item.id}`}
												size="sm"
												variant="outline"
												onClick={() => onEdit(item)}
											>
												<Edit className="w-4 h-4" />
											</Button>
										)}

										{item.status === "Proses Pengajuan" && (
											<Button
												key={`delete-${item.id}`}
												size="sm"
												variant="outline"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() => onDelete(item)}
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
				{data.map((item, index) => (
					<Card key={`mobile-card-${item.id}-${index}`} className="p-4">
						<div className="space-y-3">
							<div className="flex justify-between items-start">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-gray-500">
											#{startIndex + index + 1}
										</span>
										{getStatusBadge(item.status)}
										{currentUserNik &&
											(() => {
												const userRole = getUserRole(item);
												return userRole ? (
													<span
														className={`px-2 py-1 rounded-md text-xs font-medium ${userRole.color}`}
													>
														{userRole.role}
													</span>
												) : null;
											})()}
									</div>
									{item.no_pengajuan && (
										<div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
											{item.no_pengajuan}
										</div>
									)}
								</div>
								<div className="text-xs text-gray-500">
									{moment(item.tanggal).format("DD MMM YYYY")}
								</div>
							</div>

							{userDepartment === "IT_HRD" && (
								<div
									key={`mobile-pemohon-${item.id}`}
									className="border-l-2 border-gray-200 pl-3"
								>
									<div className="text-sm">
										<span className="font-medium">Pemohon:</span>{" "}
										{item.nama_pemohon || item.nik}
									</div>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-xs font-medium text-gray-700 mb-1">
										Dinas Asal:
									</div>
									<div className="space-y-1">
										<div className="text-xs text-gray-500">
											{moment(item.tgl_dinas).format("DD MMM YYYY")}
										</div>
										{getShiftBadge(item.shift1)}
									</div>
								</div>
								<div>
									<div className="text-xs font-medium text-gray-700 mb-1">
										Dinas Ganti:
									</div>
									<div className="space-y-1">
										<div className="text-xs text-gray-500">
											{moment(item.tgl_ganti).format("DD MMM")}
										</div>
										{getShiftBadge(item.shift2)}
									</div>
								</div>
							</div>

							<div>
								<div className="text-xs font-medium text-gray-700 mb-1">
									Pengganti:
								</div>
								<div className="text-sm">
									{item.nama_pengganti || item.nik_ganti}
								</div>
							</div>

							{item.nama_pj && (
								<div key={`mobile-pj-${item.id}`}>
									<div className="text-xs font-medium text-gray-700 mb-1">
										Penanggung Jawab:
									</div>
									<div className="text-sm">
										{item.nama_pj || (item.nik_pj ? item.nik_pj : "-")}
									</div>
								</div>
							)}

							<div className="flex gap-2 pt-2 border-t">
								<Button
									key={`mobile-view-${item.id}`}
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => onView(item)}
								>
									<Eye className="w-4 h-4 mr-1" />
									Lihat
								</Button>

								{currentUserNik === item.nik_pj && (
									<Button
										key={`mobile-edit-${item.id}`}
										size="sm"
										variant="outline"
										className="flex-1"
										onClick={() => onEdit(item)}
									>
										<Edit className="w-4 h-4 mr-1" />
										Edit
									</Button>
								)}

								{item.status === "Proses Pengajuan" && (
									<Button
										key={`mobile-delete-${item.id}`}
										size="sm"
										variant="outline"
										className="text-red-600 hover:text-red-700 hover:bg-red-50"
										onClick={() => onDelete(item)}
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
	);
};

export default PengajuanTable;
