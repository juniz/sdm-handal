
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Search,
	MoreHorizontal,
	ChevronLeft,
	ChevronRight,
    SlidersHorizontal,
    Download
} from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";
import ThresholdFormDialog from "./ThresholdFormDialog";
import * as XLSX from "xlsx";

export default function ThresholdSection() {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0,
	});
	const [showForm, setShowForm] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [selectedThreshold, setSelectedThreshold] = useState(null);
    const [kelompokJabatanList, setKelompokJabatanList] = useState([]);

	const fetchThresholds = useCallback(async () => {
		try {
			setLoading(true);
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;

			const params = new URLSearchParams();
			if (search) params.set("search", search);
			params.set("page", page);
			params.set("limit", "10");

			const res = await fetch(`/api/pegawai-manajemen/threshold?${params}`, {
				headers,
			});
			const result = await res.json();

			if (res.ok) {
				setData(result.data || []);
				setPagination(result.pagination || {});
			} else {
				toast.error(result.message || "Gagal mengambil data threshold");
			}
		} catch (err) {
			console.error(err);
			toast.error("Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	}, [search, page]);

    const fetchKelompokJabatan = useCallback(async () => {
        try {
            const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch("/api/pegawai-manajemen/kelompok-jabatan", { headers });
            const result = await res.json();
            if (res.ok) {
                setKelompokJabatanList(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching kelompok jabatan:", error);
        }
    }, []);

	useEffect(() => {
		fetchThresholds();
        fetchKelompokJabatan();
	}, [fetchThresholds, fetchKelompokJabatan]);

	const handleDelete = async () => {
		if (!selectedThreshold) return;
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch(
				`/api/pegawai-manajemen/threshold/${selectedThreshold.id_threshold}`,
				{ method: "DELETE", headers }
			);
			const result = await res.json();
			if (res.ok) {
				toast.success(result.message);
				setShowDelete(false);
				setSelectedThreshold(null);
				fetchThresholds();
			} else {
				toast.error(result.message || "Gagal menghapus");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan");
		}
	};

    const handleExport = () => {
        if (!data.length) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }
        
        const exportData = data.map(item => ({
            "Kode Kelompok": item.kode_kelompok,
            "Nama Kelompok": item.nama_kelompok,
            "Threshold (%)": item.threshold_persen,
            "Bobot Jabatan (%)": item.bobot_jabatan,
            "Bobot Personal (%)": item.bobot_personal,
            "Keterangan": item.keterangan || "",
            "Status": item.status === 1 ? "Aktif" : "Nonaktif"
        }));
    
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Threshold");
        XLSX.writeFile(wb, "Threshold_Kelompok_Jabatan.xlsx");
    };

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5" />
							Threshold Kelompok Jabatan
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Atur nilai ambang batas dan bobot remunerasi per kelompok jabatan
						</p>
					</div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={data.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedThreshold(null);
                                setShowForm(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Threshold
                        </Button>
                    </div>
				</div>
				<div className="pt-4">
					<div className="relative max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							placeholder="Cari kelompok jabatan..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
					</div>
				) : data.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<p>Tidak ada data threshold</p>
					</div>
				) : (
					<>
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Kode</TableHead>
										<TableHead>Kelompok Jabatan</TableHead>
										<TableHead className="text-center">Threshold (%)</TableHead>
										<TableHead className="text-center">Bobot Jabatan (%)</TableHead>
                                        <TableHead className="text-center">Bobot Personal (%)</TableHead>
                                        <TableHead>Keterangan</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.map((item) => (
										<TableRow key={item.id_threshold}>
											<TableCell className="font-mono text-sm">
												{item.kode_kelompok}
											</TableCell>
											<TableCell className="font-medium">
                                                {item.nama_kelompok}
                                            </TableCell>
											<TableCell className="text-center">
                                                <Badge variant="outline" className="bg-blue-50">
												    {item.threshold_persen}%
                                                </Badge>
											</TableCell>
                                            <TableCell className="text-center">
                                                {item.bobot_jabatan}%
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.bobot_personal}%
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-gray-500 text-sm">
                                                {item.keterangan || "-"}
                                            </TableCell>
											<TableCell>
												<Badge
													variant={
														item.status === 1 ? "default" : "secondary"
													}
												>
													{item.status === 1 ? "Aktif" : "Nonaktif"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0">
															<span className="sr-only">Open menu</span>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>Aksi</DropdownMenuLabel>
														<DropdownMenuItem
															onClick={() => {
																setSelectedThreshold(item);
																setShowForm(true);
															}}
														>
															<Pencil className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setSelectedThreshold(item);
																setShowDelete(true);
															}}
															className="text-red-600 focus:text-red-600 focus:bg-red-50"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Hapus
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{pagination.totalPages > 1 && (
							<div className="flex items-center justify-between mt-4">
								<p className="text-sm text-gray-600">
									Menampilkan {(page - 1) * 10 + 1} -{" "}
									{Math.min(page * 10, pagination.total)} dari{" "}
									{pagination.total} data
								</p>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={page <= 1}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
									>
										<ChevronLeft className="w-4 h-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={page >= pagination.totalPages}
										onClick={() =>
											setPage((p) => Math.min(pagination.totalPages, p + 1))
										}
									>
										<ChevronRight className="w-4 h-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>

			<ThresholdFormDialog
				open={showForm}
				onOpenChange={setShowForm}
				threshold={selectedThreshold}
				onSuccess={fetchThresholds}
                kelompokJabatanList={kelompokJabatanList}
			/>

			<Dialog open={showDelete} onOpenChange={setShowDelete}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Hapus Threshold</DialogTitle>
						<DialogDescription>
							Apakah Anda yakin ingin menghapus threshold untuk kelompok{" "}
							<strong>{selectedThreshold?.nama_kelompok}</strong>? Tindakan ini
							tidak dapat dibatalkan.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDelete(false)}>
							Batal
						</Button>
						<Button type="button" variant="destructive" onClick={handleDelete}>
							Hapus
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
