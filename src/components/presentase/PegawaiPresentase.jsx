"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Users,
	AlertCircle,
	Filter,
	Calendar,
	Check,
	ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment-timezone";

export default function PegawaiPresentase({ onDataChange }) {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState([]);
	const [unitList, setUnitList] = useState([]);
	const [pegawaiList, setPegawaiList] = useState([]);
	const [filterUnit, setFilterUnit] = useState("all");
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedAlokasi, setSelectedAlokasi] = useState(null);
	const [formData, setFormData] = useState({
		id_unit: "",
		id_pegawai: "",
		presentase_dari_unit: "",
		berlaku_mulai: moment().format("YYYY-MM-DD"),
		berlaku_selesai: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [unitOpen, setUnitOpen] = useState(false);
	const [unitSearch, setUnitSearch] = useState("");
	const [pegawaiOpen, setPegawaiOpen] = useState(false);
	const [pegawaiSearch, setPegawaiSearch] = useState("");

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const params = filterUnit !== "all" ? `?id_unit=${filterUnit}` : "";
			const response = await fetch(`/api/presentase/pegawai${params}`);
			if (response.ok) {
				const result = await response.json();
				setData(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching alokasi:", error);
			toast.error("Gagal mengambil data alokasi");
		} finally {
			setLoading(false);
		}
	}, [filterUnit]);

	const fetchUnit = useCallback(async () => {
		try {
			const response = await fetch("/api/presentase/unit");
			if (response.ok) {
				const result = await response.json();
				setUnitList(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching unit:", error);
		}
	}, []);

	const fetchPegawai = useCallback(async (dep_id = null) => {
		try {
			const url = dep_id ? `/api/pegawai?dep_id=${dep_id}` : "/api/pegawai";
			const response = await fetch(url);
			if (response.ok) {
				const result = await response.json();
				setPegawaiList(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching pegawai:", error);
		}
	}, []);

	useEffect(() => {
		fetchUnit();
		fetchPegawai();
	}, [fetchUnit, fetchPegawai]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenDialog = (alokasi = null) => {
		if (alokasi) {
			setSelectedAlokasi(alokasi);
			// Cari unit untuk mendapatkan dep_id
			const unit = unitList.find(
				(u) => u.id_unit.toString() === alokasi.id_unit.toString()
			);
			if (unit && unit.dep_id) {
				fetchPegawai(unit.dep_id);
			} else {
				fetchPegawai();
			}
			setFormData({
				id_unit: alokasi.id_unit.toString(),
				id_pegawai: alokasi.id_pegawai.toString(),
				presentase_dari_unit: alokasi.presentase_dari_unit.toString(),
				berlaku_mulai: moment(alokasi.berlaku_mulai).format("YYYY-MM-DD"),
				berlaku_selesai: alokasi.berlaku_selesai
					? moment(alokasi.berlaku_selesai).format("YYYY-MM-DD")
					: "",
			});
		} else {
			setSelectedAlokasi(null);
			setFormData({
				id_unit: filterUnit !== "all" ? filterUnit : "",
				id_pegawai: "",
				presentase_dari_unit: "",
				berlaku_mulai: moment().format("YYYY-MM-DD"),
				berlaku_selesai: "",
			});
			// Reset pegawai list jika tidak ada unit yang dipilih
			if (filterUnit === "all") {
				fetchPegawai();
			} else {
				const unit = unitList.find((u) => u.id_unit.toString() === filterUnit);
				if (unit && unit.dep_id) {
					fetchPegawai(unit.dep_id);
				} else {
					fetchPegawai();
				}
			}
		}
		setUnitSearch("");
		setPegawaiSearch("");
		setShowDialog(true);
	};

	// Filter unit berdasarkan pencarian
	const filteredUnitList = useMemo(() => {
		if (!unitSearch) return unitList;
		const search = unitSearch.toLowerCase();
		return unitList.filter(
			(unit) =>
				unit.nama_kategori.toLowerCase().includes(search) ||
				unit.nama_departemen.toLowerCase().includes(search)
		);
	}, [unitList, unitSearch]);

	// Filter pegawai berdasarkan pencarian
	const filteredPegawaiList = useMemo(() => {
		if (!pegawaiSearch) return pegawaiList;
		const search = pegawaiSearch.toLowerCase();
		return pegawaiList.filter(
			(peg) =>
				peg.label.toLowerCase().includes(search) ||
				peg.value.toLowerCase().includes(search) ||
				(peg.nama_departemen &&
					peg.nama_departemen.toLowerCase().includes(search))
		);
	}, [pegawaiList, pegawaiSearch]);

	// Handler untuk perubahan unit - fetch pegawai berdasarkan dep_id
	const handleUnitChange = useCallback(
		(unitId) => {
			const unit = unitList.find((u) => u.id_unit.toString() === unitId);
			setFormData((prev) => ({
				...prev,
				id_unit: unitId,
				id_pegawai: "", // Reset pegawai ketika unit berubah
			}));
			if (unit && unit.dep_id) {
				fetchPegawai(unit.dep_id);
			} else {
				fetchPegawai();
			}
			setPegawaiSearch("");
		},
		[unitList, fetchPegawai]
	);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (
			!formData.id_unit ||
			!formData.id_pegawai ||
			!formData.presentase_dari_unit ||
			!formData.berlaku_mulai
		) {
			toast.error("Semua field wajib harus diisi");
			return;
		}

		setSubmitting(true);
		try {
			const method = selectedAlokasi ? "PUT" : "POST";
			const body = selectedAlokasi
				? { ...formData, id_alokasi: selectedAlokasi.id_alokasi }
				: formData;

			const response = await fetch("/api/presentase/pegawai", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message);
				setShowDialog(false);
				fetchData();
				onDataChange?.();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			console.error("Error submitting:", error);
			toast.error("Terjadi kesalahan");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedAlokasi) return;

		setSubmitting(true);
		try {
			const response = await fetch("/api/presentase/pegawai", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id_alokasi: selectedAlokasi.id_alokasi }),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message);
				setShowDeleteDialog(false);
				setSelectedAlokasi(null);
				fetchData();
				onDataChange?.();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			console.error("Error deleting:", error);
			toast.error("Terjadi kesalahan");
		} finally {
			setSubmitting(false);
		}
	};

	// Group data by unit for display
	const groupedData = data.reduce((acc, item) => {
		const key = `${item.nama_kategori} - ${item.nama_departemen}`;
		if (!acc[key]) {
			acc[key] = {
				kategori: item.nama_kategori,
				departemen: item.nama_departemen,
				presentase_kategori: item.presentase_dari_total,
				presentase_unit: item.presentase_dari_kategori,
				items: [],
			};
		}
		acc[key].items.push(item);
		return acc;
	}, {});

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5 text-purple-600" />
							Alokasi Pegawai
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Pembagian persentase per pegawai dari setiap unit
						</p>
					</div>
					<div className="flex gap-2">
						<Select value={filterUnit} onValueChange={setFilterUnit}>
							<SelectTrigger className="w-[250px]">
								<Filter className="w-4 h-4 mr-2" />
								<SelectValue placeholder="Filter Unit" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Unit</SelectItem>
								{unitList.map((unit) => (
									<SelectItem
										key={unit.id_unit}
										value={unit.id_unit.toString()}
									>
										{unit.nama_kategori} - {unit.nama_departemen}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							onClick={() => handleOpenDialog()}
							className="bg-purple-600 hover:bg-purple-700"
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Alokasi
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin" />
					</div>
				) : data.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>Belum ada alokasi pegawai</p>
						<Button
							variant="outline"
							className="mt-3"
							onClick={() => handleOpenDialog()}
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Alokasi Pertama
						</Button>
					</div>
				) : (
					<div className="space-y-6">
						{Object.values(groupedData).map((group, idx) => (
							<div key={idx} className="border rounded-lg overflow-hidden">
								<div className="bg-purple-50 px-4 py-3 border-b">
									<div className="flex items-center justify-between">
										<div>
											<span className="font-medium text-purple-900">
												{group.kategori}
											</span>
											<span className="mx-2 text-purple-400">→</span>
											<span className="text-purple-700">
												{group.departemen}
											</span>
										</div>
										<span className="text-sm text-purple-600">
											{group.presentase_kategori}% × {group.presentase_unit}%
										</span>
									</div>
								</div>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>NIK</TableHead>
											<TableHead>Nama Pegawai</TableHead>
											<TableHead className="text-right">% dari Unit</TableHead>
											<TableHead className="text-right">% dari Total</TableHead>
											<TableHead>Berlaku</TableHead>
											<TableHead className="text-center">Aksi</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{group.items.map((alokasi) => (
											<TableRow key={alokasi.id_alokasi}>
												<TableCell className="font-mono text-sm">
													{alokasi.nik}
												</TableCell>
												<TableCell className="font-medium">
													{alokasi.nama_pegawai}
												</TableCell>
												<TableCell className="text-right">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
														{alokasi.presentase_dari_unit}%
													</span>
												</TableCell>
												<TableCell className="text-right text-gray-500">
													{alokasi.presentase_dari_total_efektif}%
												</TableCell>
												<TableCell className="text-sm text-gray-500">
													<div className="flex items-center gap-1">
														<Calendar className="w-3 h-3" />
														{moment(alokasi.berlaku_mulai).format("DD/MM/YYYY")}
														{alokasi.berlaku_selesai && (
															<>
																<span>-</span>
																{moment(alokasi.berlaku_selesai).format(
																	"DD/MM/YYYY"
																)}
															</>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center justify-center gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenDialog(alokasi)}
														>
															<Pencil className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="text-red-600 hover:text-red-700 hover:bg-red-50"
															onClick={() => {
																setSelectedAlokasi(alokasi);
																setShowDeleteDialog(true);
															}}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						))}
					</div>
				)}
			</CardContent>

			{/* Form Dialog */}
			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedAlokasi ? "Edit Alokasi" : "Tambah Alokasi Baru"}
						</DialogTitle>
						<DialogDescription>
							{selectedAlokasi
								? "Ubah data alokasi pegawai"
								: "Tambahkan pegawai ke dalam unit"}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="id_unit">Unit</Label>
							<Popover open={unitOpen} onOpenChange={setUnitOpen} modal={false}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={unitOpen}
										disabled={!!selectedAlokasi}
										className={cn(
											"w-full justify-between h-10 text-left font-normal",
											!formData.id_unit && "text-muted-foreground"
										)}
									>
										{formData.id_unit
											? unitList.find(
													(unit) => unit.id_unit.toString() === formData.id_unit
											  )?.nama_kategori +
											  " - " +
											  unitList.find(
													(unit) => unit.id_unit.toString() === formData.id_unit
											  )?.nama_departemen
											: "Pilih unit..."}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-[var(--radix-popover-trigger-width)] p-0"
									align="start"
								>
									<Command shouldFilter={false}>
										<CommandInput
											placeholder="Cari unit..."
											value={unitSearch}
											onValueChange={setUnitSearch}
											className="h-10"
										/>
										<CommandList className="max-h-[200px] overflow-y-auto">
											<CommandEmpty>Unit tidak ditemukan.</CommandEmpty>
											<CommandGroup>
												{filteredUnitList.map((unit) => (
													<CommandItem
														key={unit.id_unit}
														value={unit.id_unit.toString()}
														onSelect={(currentValue) => {
															handleUnitChange(
																currentValue === formData.id_unit
																	? ""
																	: currentValue
															);
															setUnitOpen(false);
															setUnitSearch("");
														}}
														className="cursor-pointer"
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																formData.id_unit === unit.id_unit.toString()
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
														<span className="font-medium">
															{unit.nama_kategori}
														</span>
														<span className="ml-2 text-gray-500">
															- {unit.nama_departemen}
														</span>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						<div className="space-y-2">
							<Label htmlFor="id_pegawai">Pegawai</Label>
							<Popover
								open={pegawaiOpen}
								onOpenChange={setPegawaiOpen}
								modal={false}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={pegawaiOpen}
										disabled={!!selectedAlokasi || !formData.id_unit}
										className={cn(
											"w-full justify-between h-10 text-left font-normal",
											!formData.id_pegawai && "text-muted-foreground"
										)}
									>
										{formData.id_pegawai
											? (() => {
													const selectedPeg = pegawaiList.find(
														(p) => p.id?.toString() === formData.id_pegawai
													);
													return selectedPeg
														? `${selectedPeg.value || selectedPeg.nik} - ${
																selectedPeg.label || selectedPeg.nama
														  }`
														: "Pilih pegawai...";
											  })()
											: formData.id_unit
											? "Pilih pegawai..."
											: "Pilih unit terlebih dahulu"}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-[var(--radix-popover-trigger-width)] p-0"
									align="start"
								>
									<Command shouldFilter={false}>
										<CommandInput
											placeholder="Cari pegawai..."
											value={pegawaiSearch}
											onValueChange={setPegawaiSearch}
											className="h-10"
										/>
										<CommandList className="max-h-[200px] overflow-y-auto">
											<CommandEmpty>
												{pegawaiList.length === 0
													? "Tidak ada pegawai di departemen ini"
													: "Pegawai tidak ditemukan."}
											</CommandEmpty>
											<CommandGroup>
												{filteredPegawaiList.map((peg) => {
													const pegId = peg.id ? peg.id.toString() : null;
													const pegNik = peg.value || peg.nik || "";
													const pegNama = peg.label || peg.nama || "";

													if (!pegId) return null;

													return (
														<CommandItem
															key={pegId}
															value={pegId}
															onSelect={(currentValue) => {
																setFormData({
																	...formData,
																	id_pegawai:
																		currentValue === formData.id_pegawai
																			? ""
																			: currentValue,
																});
																setPegawaiOpen(false);
																setPegawaiSearch("");
															}}
															className="cursor-pointer"
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	formData.id_pegawai === pegId
																		? "opacity-100"
																		: "opacity-0"
																)}
															/>
															<span className="font-medium">{pegNik}</span>
															<span className="ml-2 text-gray-500">
																- {pegNama}
															</span>
														</CommandItem>
													);
												})}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
							{!formData.id_unit && (
								<p className="text-xs text-muted-foreground">
									Pilih unit terlebih dahulu untuk melihat daftar pegawai
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="presentase">Presentase dari Unit (%)</Label>
							<Input
								id="presentase"
								type="number"
								step="0.01"
								min="0"
								max="100"
								value={formData.presentase_dari_unit}
								onChange={(e) =>
									setFormData({
										...formData,
										presentase_dari_unit: e.target.value,
									})
								}
								placeholder="0.00"
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="berlaku_mulai">Berlaku Mulai</Label>
								<Input
									id="berlaku_mulai"
									type="date"
									value={formData.berlaku_mulai}
									onChange={(e) =>
										setFormData({ ...formData, berlaku_mulai: e.target.value })
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="berlaku_selesai">
									Berlaku Selesai (Opsional)
								</Label>
								<Input
									id="berlaku_selesai"
									type="date"
									value={formData.berlaku_selesai}
									onChange={(e) =>
										setFormData({
											...formData,
											berlaku_selesai: e.target.value,
										})
									}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowDialog(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={submitting}
								className="bg-purple-600 hover:bg-purple-700"
							>
								{submitting && (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								)}
								{selectedAlokasi ? "Simpan Perubahan" : "Tambah Alokasi"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<AlertCircle className="w-5 h-5" />
							Konfirmasi Hapus
						</DialogTitle>
						<DialogDescription>
							Apakah Anda yakin ingin menghapus alokasi untuk "
							{selectedAlokasi?.nama_pegawai}"?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
						>
							Batal
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={submitting}
						>
							{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Ya, Hapus
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
