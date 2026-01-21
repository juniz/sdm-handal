"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	Building2,
	AlertCircle,
	Filter,
	Check,
	ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function UnitPresentase({ onDataChange }) {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState([]);
	const [kategoriList, setKategoriList] = useState([]);
	const [departemenList, setDepartemenList] = useState([]);
	const [filterKategori, setFilterKategori] = useState("all");
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedUnit, setSelectedUnit] = useState(null);
	const [formData, setFormData] = useState({
		id_kategori: "",
		dep_id: "",
		presentase_dari_kategori: "",
		keterangan: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [departemenOpen, setDepartemenOpen] = useState(false);
	const [departemenSearch, setDepartemenSearch] = useState("");

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const params =
				filterKategori !== "all" ? `?id_kategori=${filterKategori}` : "";
			const response = await fetch(`/api/presentase/unit${params}`);
			if (response.ok) {
				const result = await response.json();
				setData(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching unit:", error);
			toast.error("Gagal mengambil data unit");
		} finally {
			setLoading(false);
		}
	}, [filterKategori]);

	const fetchKategori = useCallback(async () => {
		try {
			const response = await fetch("/api/presentase/kategori");
			if (response.ok) {
				const result = await response.json();
				setKategoriList(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching kategori:", error);
		}
	}, []);

	const fetchDepartemen = useCallback(async () => {
		try {
			const response = await fetch("/api/departemen");
			if (response.ok) {
				const result = await response.json();
				setDepartemenList(result.data || []);
			}
		} catch (error) {
			console.error("Error fetching departemen:", error);
		}
	}, []);

	useEffect(() => {
		fetchKategori();
		fetchDepartemen();
	}, [fetchKategori, fetchDepartemen]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenDialog = (unit = null) => {
		if (unit) {
			setSelectedUnit(unit);
			setFormData({
				id_kategori: unit.id_kategori.toString(),
				dep_id: unit.dep_id,
				presentase_dari_kategori: unit.presentase_dari_kategori.toString(),
				keterangan: unit.keterangan || "",
			});
		} else {
			setSelectedUnit(null);
			setFormData({
				id_kategori: filterKategori !== "all" ? filterKategori : "",
				dep_id: "",
				presentase_dari_kategori: "",
				keterangan: "",
			});
		}
		setDepartemenSearch("");
		setDepartemenOpen(false);
		setShowDialog(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (
			!formData.id_kategori ||
			!formData.dep_id ||
			!formData.presentase_dari_kategori
		) {
			toast.error("Semua field wajib harus diisi");
			return;
		}

		setSubmitting(true);
		try {
			const method = selectedUnit ? "PUT" : "POST";
			const body = selectedUnit
				? { ...formData, id_unit: selectedUnit.id_unit }
				: formData;

			const response = await fetch("/api/presentase/unit", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message);
				setShowDialog(false);
				setDepartemenSearch("");
				setDepartemenOpen(false);
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
		if (!selectedUnit) return;

		setSubmitting(true);
		try {
			const response = await fetch("/api/presentase/unit", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id_unit: selectedUnit.id_unit }),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message);
				setShowDeleteDialog(false);
				setSelectedUnit(null);
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

	// Filter departemen berdasarkan pencarian
	const filteredDepartemen = useMemo(() => {
		if (!departemenSearch) return departemenList;

		const search = departemenSearch.toLowerCase();
		return departemenList.filter(
			(dep) =>
				dep.nama.toLowerCase().includes(search) ||
				dep.dep_id.toLowerCase().includes(search)
		);
	}, [departemenList, departemenSearch]);

	// Group data by kategori for display
	const groupedData = data.reduce((acc, item) => {
		if (!acc[item.nama_kategori]) {
			acc[item.nama_kategori] = {
				kategori: item.nama_kategori,
				presentase_kategori: item.presentase_dari_total,
				items: [],
			};
		}
		acc[item.nama_kategori].items.push(item);
		return acc;
	}, {});

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="w-5 h-5 text-blue-600" />
							Unit/Departemen Presentase
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Pembagian persentase per departemen dari setiap kategori
						</p>
					</div>
					<div className="flex gap-2">
						<Select value={filterKategori} onValueChange={setFilterKategori}>
							<SelectTrigger className="w-[200px]">
								<Filter className="w-4 h-4 mr-2" />
								<SelectValue placeholder="Filter Kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Kategori</SelectItem>
								{kategoriList.map((kat) => (
									<SelectItem
										key={kat.id_kategori}
										value={kat.id_kategori.toString()}
									>
										{kat.nama_kategori}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							onClick={() => handleOpenDialog()}
							className="bg-blue-600 hover:bg-blue-700"
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Unit
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
						<Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>Belum ada unit presentase</p>
						<Button
							variant="outline"
							className="mt-3"
							onClick={() => handleOpenDialog()}
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Unit Pertama
						</Button>
					</div>
				) : (
					<div className="space-y-6">
						{Object.values(groupedData).map((group) => (
							<div
								key={group.kategori}
								className="border rounded-lg overflow-hidden"
							>
								<div className="bg-blue-50 px-4 py-3 border-b">
									<div className="flex items-center justify-between">
										<span className="font-medium text-blue-900">
											{group.kategori}
										</span>
										<span className="text-sm text-blue-600">
											{group.presentase_kategori}% dari total
										</span>
									</div>
								</div>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Departemen</TableHead>
											<TableHead className="text-right">
												% dari Kategori
											</TableHead>
											<TableHead className="text-right">% dari Total</TableHead>
											<TableHead className="text-right">Pegawai</TableHead>
											<TableHead>Keterangan</TableHead>
											<TableHead className="text-center">Aksi</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{group.items.map((unit) => (
											<TableRow key={unit.id_unit}>
												<TableCell className="font-medium">
													{unit.nama_departemen}
												</TableCell>
												<TableCell className="text-right">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{unit.presentase_dari_kategori}%
													</span>
												</TableCell>
												<TableCell className="text-right text-gray-500">
													{unit.presentase_dari_total_efektif}%
												</TableCell>
												<TableCell className="text-right">
													{unit.jumlah_pegawai}
												</TableCell>
												<TableCell className="text-gray-500 text-sm">
													{unit.keterangan || "-"}
												</TableCell>
												<TableCell>
													<div className="flex items-center justify-center gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenDialog(unit)}
														>
															<Pencil className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="text-red-600 hover:text-red-700 hover:bg-red-50"
															onClick={() => {
																setSelectedUnit(unit);
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
			<Dialog
				open={showDialog}
				onOpenChange={(open) => {
					setShowDialog(open);
					if (!open) {
						setDepartemenSearch("");
						setDepartemenOpen(false);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedUnit ? "Edit Unit" : "Tambah Unit Baru"}
						</DialogTitle>
						<DialogDescription>
							{selectedUnit
								? "Ubah data unit presentase"
								: "Tambahkan departemen ke dalam kategori"}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="id_kategori">Kategori</Label>
							<Select
								value={formData.id_kategori}
								onValueChange={(value) =>
									setFormData({ ...formData, id_kategori: value })
								}
								disabled={!!selectedUnit}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih kategori" />
								</SelectTrigger>
								<SelectContent>
									{kategoriList.map((kat) => (
										<SelectItem
											key={kat.id_kategori}
											value={kat.id_kategori.toString()}
										>
											{kat.nama_kategori} ({kat.presentase_dari_total}%)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dep_id">Departemen</Label>
							<Popover open={departemenOpen} onOpenChange={setDepartemenOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={departemenOpen}
										disabled={!!selectedUnit}
										className={cn(
											"w-full justify-between h-10 text-left font-normal",
											!formData.dep_id && "text-muted-foreground"
										)}
									>
										{formData.dep_id
											? departemenList.find(
													(dep) => dep.dep_id === formData.dep_id
											  )?.nama
											: "Pilih departemen..."}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-[var(--radix-popover-trigger-width)] p-0"
									align="start"
								>
									<Command shouldFilter={false}>
										<CommandInput
											placeholder="Cari departemen..."
											value={departemenSearch}
											onValueChange={setDepartemenSearch}
											className="h-10"
										/>
										<CommandList className="max-h-[200px] overflow-y-auto">
											<CommandEmpty>Departemen tidak ditemukan.</CommandEmpty>
											<CommandGroup>
												{filteredDepartemen.map((dep) => (
													<CommandItem
														key={dep.dep_id}
														value={dep.dep_id}
														onSelect={(currentValue) => {
															setFormData({
																...formData,
																dep_id:
																	currentValue === formData.dep_id
																		? ""
																		: currentValue,
															});
															setDepartemenOpen(false);
															setDepartemenSearch("");
														}}
														className="cursor-pointer"
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																formData.dep_id === dep.dep_id
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
														<span className="font-medium">{dep.dep_id}</span>
														<span className="ml-2 text-gray-500">
															- {dep.nama}
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
							<Label htmlFor="presentase">Presentase dari Kategori (%)</Label>
							<Input
								id="presentase"
								type="number"
								step="0.01"
								min="0"
								max="100"
								value={formData.presentase_dari_kategori}
								onChange={(e) =>
									setFormData({
										...formData,
										presentase_dari_kategori: e.target.value,
									})
								}
								placeholder="0.00"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="keterangan">Keterangan (Opsional)</Label>
							<Textarea
								id="keterangan"
								value={formData.keterangan}
								onChange={(e) =>
									setFormData({ ...formData, keterangan: e.target.value })
								}
								placeholder="Tambahkan keterangan..."
								rows={3}
							/>
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
								className="bg-blue-600 hover:bg-blue-700"
							>
								{submitting && (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								)}
								{selectedUnit ? "Simpan Perubahan" : "Tambah Unit"}
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
							Apakah Anda yakin ingin menghapus unit "
							{selectedUnit?.nama_departemen}"? Semua alokasi pegawai di unit
							ini juga akan terhapus.
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
