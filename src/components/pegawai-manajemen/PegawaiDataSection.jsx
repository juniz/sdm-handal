"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Users,
	Search,
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
	BarChart3,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";
import PegawaiFormDialog from "./PegawaiFormDialog";
import EvaluasiFormDialog from "./EvaluasiFormDialog";
import PencapaianFormDialog from "./PencapaianFormDialog";

export default function PegawaiDataSection() {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [departemen, setDepartemen] = useState("all");
	const [sttsAktif, setSttsAktif] = useState("AKTIF");
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});
	const [showForm, setShowForm] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [showEvaluasiForm, setShowEvaluasiForm] = useState(false);
	const [showPencapaianForm, setShowPencapaianForm] = useState(false);
	const [selectedPegawai, setSelectedPegawai] = useState(null);
	const [refs, setRefs] = useState({
		departemen: [],
		pendidikan: [],
		bidang: [],
		sttsWp: [],
		sttsKerja: [],
		bank: [],
		jnjJabatan: [],
		kelompokJabatan: [],
		resikoKerja: [],
		emergencyIndex: [],
	});

	const fetchPegawai = useCallback(async () => {
		try {
			setLoading(true);
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;

			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (departemen && departemen !== "all")
				params.set("departemen", departemen);
			if (sttsAktif && sttsAktif !== "all") params.set("stts_aktif", sttsAktif);
			params.set("page", page);
			params.set("limit", "20");

			const res = await fetch(`/api/pegawai-manajemen?${params}`, { headers });
			const result = await res.json();

			if (res.ok) {
				setData(result.data || []);
				setPagination(result.pagination || {});
			} else {
				toast.error(result.message || "Gagal mengambil data");
			}
		} catch (err) {
			console.error(err);
			toast.error("Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	}, [search, departemen, sttsAktif, page]);

	const fetchRefs = useCallback(async () => {
		const token = getClientToken();
		const headers = {};
		if (token) headers["Authorization"] = `Bearer ${token}`;

		const endpoints = [
			["departemen", "/api/departemen"],
			["pendidikan", "/api/pendidikan"],
			["bidang", "/api/bidang"],
			["sttsWp", "/api/stts-wp"],
			["sttsKerja", "/api/stts-kerja"],
			["bank", "/api/bank"],
			["jnjJabatan", "/api/pegawai-manajemen/jnj-jabatan"],
			["kelompokJabatan", "/api/pegawai-manajemen/kelompok-jabatan"],
			["resikoKerja", "/api/pegawai-manajemen/resiko-kerja"],
			["emergencyIndex", "/api/pegawai-manajemen/emergency-index"],
		];

		const results = {};
		for (const [key, url] of endpoints) {
			try {
				const res = await fetch(url, { headers });
				const json = await res.json();
				results[key] = json.data || [];
			} catch {
				results[key] = [];
			}
		}
		setRefs(results);
	}, []);

	useEffect(() => {
		fetchRefs();
	}, [fetchRefs]);

	useEffect(() => {
		fetchPegawai();
	}, [fetchPegawai]);

	const handleEdit = async (p) => {
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch(`/api/pegawai-manajemen/${p.id}`, { headers });
			const result = await res.json();
			if (res.ok) {
				setSelectedPegawai(result.data);
				setShowForm(true);
			} else {
				toast.error(result.message);
			}
		} catch (err) {
			toast.error("Gagal mengambil data pegawai");
		}
	};

	const handleDelete = async () => {
		if (!selectedPegawai) return;
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch(
				`/api/pegawai-manajemen?id=${selectedPegawai.id}`,
				{ method: "DELETE", headers },
			);
			const result = await res.json();
			if (res.ok) {
				toast.success(result.message);
				setShowDelete(false);
				setSelectedPegawai(null);
				fetchPegawai();
			} else {
				toast.error(result.message || "Gagal menghapus");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan");
		}
	};

	const handleDeleteClick = (p) => {
		// Use setTimeout to prevent conflict with DropdownMenu focus management
		setTimeout(() => {
			setSelectedPegawai(p);
			setShowDelete(true);
		}, 100);
	};

	const handleEvaluasiClick = (p) => {
		// Use setTimeout to prevent conflict with DropdownMenu focus management
		setTimeout(() => {
			setSelectedPegawai(p);
			setShowEvaluasiForm(true);
		}, 100);
	};

	const handlePencapaianClick = (p) => {
		// Use setTimeout to prevent conflict with DropdownMenu focus management
		setTimeout(() => {
			setSelectedPegawai(p);
			setShowPencapaianForm(true);
		}, 100);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							Data Pegawai
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Kelola data pegawai dan informasi kepegawaian
						</p>
					</div>
					<Button
						onClick={() => {
							setSelectedPegawai(null);
							setShowForm(true);
						}}
					>
						<Plus className="w-4 h-4 mr-2" />
						Tambah Pegawai
					</Button>
				</div>
				<div className="flex flex-col sm:flex-row gap-3 pt-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							placeholder="Cari nama atau NIK..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>
					<Select
						value={departemen}
						onValueChange={(v) => {
							setDepartemen(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder="Filter Departemen" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua</SelectItem>
							{refs.departemen.map((d) => (
								<SelectItem key={d.dep_id} value={d.dep_id}>
									{d.nama}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={sttsAktif}
						onValueChange={(v) => {
							setSttsAktif(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-full sm:w-[150px]">
							<SelectValue placeholder="Status Aktif" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua</SelectItem>
							<SelectItem value="AKTIF">Aktif</SelectItem>
							<SelectItem value="CUTI">Cuti</SelectItem>
							<SelectItem value="KELUAR">Keluar</SelectItem>
							<SelectItem value="TENAGA LUAR">Tenaga Luar</SelectItem>
							<SelectItem value="MITRA">Mitra</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
					</div>
				) : data.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>Tidak ada data pegawai</p>
						<Button
							variant="outline"
							className="mt-3"
							onClick={() => {
								setSelectedPegawai(null);
								setShowForm(true);
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Pegawai
						</Button>
					</div>
				) : (
					<>
						{/* Desktop View - Table */}
						<div className="hidden md:block rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>NIK</TableHead>
										<TableHead>Nama</TableHead>
										<TableHead>Jabatan</TableHead>
										<TableHead>Departemen</TableHead>
										<TableHead className="text-center">Total Index</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.map((p) => (
										<TableRow key={p.id}>
											<TableCell className="font-mono text-sm">
												{p.nik}
											</TableCell>
											<TableCell className="font-medium">{p.nama}</TableCell>
											<TableCell>{p.jbtn || "-"}</TableCell>
											<TableCell>
												{p.nama_departemen || p.departemen || "-"}
											</TableCell>
											<TableCell className="text-center font-medium">
												{p.total_index_remunerasi ?? "-"}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														p.stts_aktif === "AKTIF" ? "default" : "secondary"
													}
												>
													{p.stts_aktif}
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
														<DropdownMenuItem onClick={() => handleEdit(p)}>
															<Pencil className="mr-2 h-4 w-4" />
															Edit Pegawai
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleEvaluasiClick(p)}
														>
															<BarChart3 className="mr-2 h-4 w-4" />
															Input Evaluasi
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handlePencapaianClick(p)}
														>
															<Zap className="mr-2 h-4 w-4" />
															Input Pencapaian
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleDeleteClick(p)}
															className="text-red-600 focus:text-red-600 focus:bg-red-50"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Hapus Pegawai
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Mobile View - Cards */}
						<div className="grid grid-cols-1 gap-4 md:hidden">
							{data.map((p) => (
								<div
									key={p.id}
									className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
								>
									<div className="flex justify-between items-start">
										<div>
											<div className="font-medium text-base">{p.nama}</div>
											<div className="text-xs text-gray-500 font-mono mt-0.5">
												{p.nik}
											</div>
										</div>
										<Badge
											variant={
												p.stts_aktif === "AKTIF" ? "default" : "secondary"
											}
											className="shrink-0"
										>
											{p.stts_aktif}
										</Badge>
									</div>

									<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-b py-3">
										<div className="col-span-2 sm:col-span-1">
											<div className="text-xs text-gray-500 mb-0.5">
												Jabatan
											</div>
											<div className="font-medium">{p.jbtn || "-"}</div>
										</div>
										<div className="col-span-2 sm:col-span-1">
											<div className="text-xs text-gray-500 mb-0.5">
												Departemen
											</div>
											<div className="font-medium">
												{p.nama_departemen || p.departemen || "-"}
											</div>
										</div>
										<div className="col-span-2">
											<div className="text-xs text-gray-500 mb-0.5">
												Total Index
											</div>
											<div className="font-medium">
												{p.total_index_remunerasi ?? "-"}
											</div>
										</div>
									</div>

									<div className="flex justify-end items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											className="h-8 text-xs"
											onClick={() => handleEdit(p)}
										>
											<Pencil className="w-3.5 h-3.5 mr-1.5" />
											Edit
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="h-8 text-xs"
											onClick={() => handleEvaluasiClick(p)}
										>
											<BarChart3 className="w-3.5 h-3.5 mr-1.5" />
											Evaluasi
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="h-8 text-xs"
											onClick={() => handlePencapaianClick(p)}
										>
											<Zap className="w-3.5 h-3.5 mr-1.5" />
											Pencapaian
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0"
												>
													<span className="sr-only">More options</span>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => handleDeleteClick(p)}
													className="text-red-600 focus:text-red-600 focus:bg-red-50"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Hapus Pegawai
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							))}
						</div>
						{pagination.totalPages > 1 && (
							<div className="flex items-center justify-between mt-4">
								<p className="text-sm text-gray-600">
									Menampilkan {(page - 1) * 20 + 1} -{" "}
									{Math.min(page * 20, pagination.total)} dari{" "}
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

			<PegawaiFormDialog
				open={showForm}
				onOpenChange={setShowForm}
				pegawai={selectedPegawai}
				onSuccess={fetchPegawai}
				departemenList={refs.departemen}
				pendidikanList={refs.pendidikan}
				bidangList={refs.bidang}
				sttsWpList={refs.sttsWp}
				sttsKerjaList={refs.sttsKerja}
				bankList={refs.bank}
				jnjJabatanList={refs.jnjJabatan}
				kelompokJabatanList={refs.kelompokJabatan}
				resikoKerjaList={refs.resikoKerja}
				emergencyIndexList={refs.emergencyIndex}
			/>

			<EvaluasiFormDialog
				open={showEvaluasiForm}
				onOpenChange={setShowEvaluasiForm}
				pegawai={selectedPegawai}
				onSuccess={() => {
					// Optional: fetch something if needed, but evaluation doesn't affect list here
					toast.success("Evaluasi berhasil disimpan");
				}}
			/>

			<PencapaianFormDialog
				open={showPencapaianForm}
				onOpenChange={setShowPencapaianForm}
				pegawai={selectedPegawai}
				onSuccess={() => {
					toast.success("Pencapaian berhasil disimpan");
				}}
			/>

			<Dialog open={showDelete} onOpenChange={setShowDelete}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Hapus Pegawai</DialogTitle>
						<DialogDescription>
							Apakah Anda yakin ingin menghapus pegawai{" "}
							<strong>{selectedPegawai?.nama}</strong> (NIK:{" "}
							{selectedPegawai?.nik})? Tindakan ini tidak dapat dibatalkan.
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
