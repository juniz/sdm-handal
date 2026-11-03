"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Search,
	Loader2,
	Plus,
	Trash2,
	Check,
	Users,
	Tag,
	Sparkles,
	Filter,
	X,
} from "lucide-react";
import { toast } from "sonner";

export default function MappingJenisModal({ isOpen, onClose }) {
	const [activeTab, setActiveTab] = useState("mapping");
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	// Data state
	const [kategoriList, setKategoriList] = useState([]);
	const [pegawaiList, setPegawaiList] = useState([]);
	const [departemenList, setDepartemenList] = useState([]);

	// Filters
	const [search, setSearch] = useState("");
	const [filterDept, setFilterDept] = useState("all");
	const [filterKategori, setFilterKategori] = useState("all");
	const [hanya2018, setHanya2018] = useState(true);

	// Selection for bulk action
	const [selectedNiks, setSelectedNiks] = useState([]);
	const [bulkKategoriId, setBulkKategoriId] = useState("");

	// Manage category form
	const [newKategoriNama, setNewKategoriNama] = useState("");
	const [newKategoriUrutan, setNewKategoriUrutan] = useState(1);
	const [editingKategori, setEditingKategori] = useState(null);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (filterDept && filterDept !== "all") params.set("departemen", filterDept);
			if (filterKategori && filterKategori !== "all") params.set("kategori_id", filterKategori);
			params.set("hanya_2018", hanya2018 ? "true" : "false");

			const res = await fetch(`/api/gaji-pegawai/mapping?${params.toString()}`);
			const json = await res.json();
			if (json.status === "success") {
				setKategoriList(json.kategori || []);
				setPegawaiList(json.pegawai || []);
			} else {
				toast.error(json.message || "Gagal mengambil data mapping");
			}
		} catch (err) {
			console.error("Fetch mapping error:", err);
			toast.error("Terjadi kesalahan memuat data");
		} finally {
			setLoading(false);
		}
	}, [search, filterDept, filterKategori, hanya2018]);

	const fetchDepartments = useCallback(async () => {
		try {
			const res = await fetch("/api/departemen");
			const json = await res.json();
			if (json.status === "success") {
				setDepartemenList(json.data || []);
			}
		} catch (err) {
			console.error("Fetch dept error:", err);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchData();
			fetchDepartments();
		} else {
			setSelectedNiks([]);
		}
	}, [isOpen, fetchData, fetchDepartments]);

	// Format tanggal Indo
	const formatTanggalShort = (dateStr) => {
		if (!dateStr || dateStr.startsWith("0000-00-00")) return "-";
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return "-";
		return d.toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	// Checkbox selection
	const isAllSelected = useMemo(() => {
		return pegawaiList.length > 0 && selectedNiks.length === pegawaiList.length;
	}, [pegawaiList, selectedNiks]);

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedNiks(pegawaiList.map((p) => p.nik));
		} else {
			setSelectedNiks([]);
		}
	};

	const handleToggleNik = (nik) => {
		setSelectedNiks((prev) =>
			prev.includes(nik) ? prev.filter((n) => n !== nik) : [...prev, nik]
		);
	};

	// Save single mapping
	const handleSetSingleMapping = async (nik, kategoriIdStr) => {
		try {
			setSaving(true);
			const kategori_id = kategoriIdStr === "none" ? null : parseInt(kategoriIdStr);
			const res = await fetch("/api/gaji-pegawai/mapping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "set_mapping",
					nik_list: [nik],
					kategori_id,
				}),
			});
			const json = await res.json();
			if (json.status === "success") {
				toast.success("Mapping diperbarui");
				fetchData();
			} else {
				toast.error(json.message);
			}
		} catch (err) {
			toast.error("Gagal menyimpan mapping");
		} finally {
			setSaving(false);
		}
	};

	// Save bulk mapping
	const handleApplyBulkMapping = async () => {
		if (selectedNiks.length === 0) return;
		if (!bulkKategoriId) {
			toast.error("Pilih kategori terlebih dahulu");
			return;
		}

		try {
			setSaving(true);
			const kategori_id = bulkKategoriId === "none" ? null : parseInt(bulkKategoriId);
			const res = await fetch("/api/gaji-pegawai/mapping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "set_mapping",
					nik_list: selectedNiks,
					kategori_id,
				}),
			});
			const json = await res.json();
			if (json.status === "success") {
				toast.success(json.message);
				setSelectedNiks([]);
				setBulkKategoriId("");
				fetchData();
			} else {
				toast.error(json.message);
			}
		} catch (err) {
			toast.error("Gagal menyimpan mapping massal");
		} finally {
			setSaving(false);
		}
	};

	// Add Category
	const handleAddKategori = async (e) => {
		e.preventDefault();
		if (!newKategoriNama.trim()) return;

		try {
			setSaving(true);
			const res = await fetch("/api/gaji-pegawai/mapping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "add_kategori",
					nama: newKategoriNama.trim(),
					urutan: newKategoriUrutan,
				}),
			});
			const json = await res.json();
			if (json.status === "success") {
				toast.success("Kategori berhasil ditambahkan");
				setNewKategoriNama("");
				setNewKategoriUrutan((prev) => prev + 1);
				fetchData();
			} else {
				toast.error(json.message);
			}
		} catch (err) {
			toast.error("Gagal menambahkan kategori");
		} finally {
			setSaving(false);
		}
	};

	// Update Category
	const handleUpdateKategori = async (id, nama, urutan) => {
		try {
			setSaving(true);
			const res = await fetch("/api/gaji-pegawai/mapping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update_kategori",
					id,
					nama,
					urutan,
				}),
			});
			const json = await res.json();
			if (json.status === "success") {
				toast.success("Kategori diperbarui");
				setEditingKategori(null);
				fetchData();
			} else {
				toast.error(json.message);
			}
		} catch (err) {
			toast.error("Gagal memperbarui kategori");
		} finally {
			setSaving(false);
		}
	};

	// Delete Category
	const handleDeleteKategori = async (id, nama) => {
		if (!confirm(`Hapus kategori "${nama}"? Mapping pegawai ke kategori ini akan ikut dilepas.`)) {
			return;
		}

		try {
			setSaving(true);
			const res = await fetch("/api/gaji-pegawai/mapping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "delete_kategori",
					id,
				}),
			});
			const json = await res.json();
			if (json.status === "success") {
				toast.success("Kategori berhasil dihapus");
				fetchData();
			} else {
				toast.error(json.message);
			}
		} catch (err) {
			toast.error("Gagal menghapus kategori");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
				<DialogHeader className="p-6 pb-2 border-b border-slate-100 bg-slate-50/50">
					<div className="flex items-center gap-2">
						<Tag className="w-5 h-5 text-blue-600" />
						<DialogTitle className="text-lg font-bold text-slate-900">
							Mapping Jenis Pegawai (Print Gaji Kontrak)
						</DialogTitle>
					</div>
					<DialogDescription className="text-xs text-slate-500">
						Kelompokkan pegawai kontrak ke dalam kategori (Nakes, Apoteker, Administrasi, dll.) untuk pemisahan halaman print out gaji kontrak tahun 2018 ke atas.
					</DialogDescription>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
					<div className="px-6 pt-3 border-b border-slate-200 bg-white">
						<TabsList className="bg-slate-100 p-1">
							<TabsTrigger value="mapping" className="gap-2 text-xs">
								<Users className="w-3.5 h-3.5" />
								Mapping Pegawai ({pegawaiList.length})
							</TabsTrigger>
							<TabsTrigger value="kategori" className="gap-2 text-xs">
								<Tag className="w-3.5 h-3.5" />
								Kelola Kategori ({kategoriList.length})
							</TabsTrigger>
						</TabsList>
					</div>

					{/* TAB 1: MAPPING PEGAWAI */}
					<TabsContent value="mapping" className="flex-1 flex flex-col p-6 pt-4 gap-4 overflow-hidden mt-0">
						{/* Filters */}
						<div className="flex flex-wrap items-center gap-3">
							<div className="relative flex-1 min-w-[200px]">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Cari NIK atau Nama..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9 h-9 text-xs bg-slate-50/50"
								/>
							</div>

							<Select value={filterDept} onValueChange={setFilterDept}>
								<SelectTrigger className="w-[170px] h-9 text-xs bg-slate-50/50">
									<SelectValue placeholder="Departemen" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Departemen</SelectItem>
									{departemenList.map((d) => (
										<SelectItem key={d.dep_id} value={d.dep_id}>
											{d.nama}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select value={filterKategori} onValueChange={setFilterKategori}>
								<SelectTrigger className="w-[160px] h-9 text-xs bg-slate-50/50">
									<SelectValue placeholder="Status Mapping" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Kategori</SelectItem>
									<SelectItem value="unmapped">Belum Dimapping</SelectItem>
									{kategoriList.map((k) => (
										<SelectItem key={k.id} value={k.id.toString()}>
											{k.nama}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								type="button"
								variant={hanya2018 ? "default" : "outline"}
								size="sm"
								onClick={() => setHanya2018(!hanya2018)}
								className={`h-9 text-xs gap-1.5 ${
									hanya2018 ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-slate-600"
								}`}
							>
								<Sparkles className="w-3.5 h-3.5" />
								{hanya2018 ? "Kontrak ≥ 2018" : "Semua Kontrak"}
							</Button>
						</div>

						{/* Bulk Action Toolbar */}
						{selectedNiks.length > 0 && (
							<div className="flex items-center justify-between p-2.5 px-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs animate-in fade-in duration-150">
								<span className="font-medium text-blue-900">
									Terpilih: <strong>{selectedNiks.length}</strong> pegawai
								</span>
								<div className="flex items-center gap-2">
									<Select value={bulkKategoriId} onValueChange={setBulkKategoriId}>
										<SelectTrigger className="w-[180px] h-8 text-xs bg-white border-blue-200">
											<SelectValue placeholder="Pilih Kategori Tujuan..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">-- Hapus Mapping --</SelectItem>
											{kategoriList.map((k) => (
												<SelectItem key={k.id} value={k.id.toString()}>
													{k.nama}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										size="sm"
										onClick={handleApplyBulkMapping}
										disabled={saving || !bulkKategoriId}
										className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
									>
										{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
										Terapkan
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedNiks([])}
										className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
									>
										<X className="w-4 h-4" />
									</Button>
								</div>
							</div>
						)}

						{/* Table Pegawai */}
						<div className="flex-1 border rounded-lg overflow-y-auto max-h-[60vh]">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10">
									<TableRow>
										<TableHead className="w-10 text-center">
											<input
												type="checkbox"
												checked={isAllSelected}
												onChange={(e) => handleSelectAll(e.target.checked)}
												className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
											/>
										</TableHead>
										<TableHead className="text-xs">NIK</TableHead>
										<TableHead className="text-xs">Nama</TableHead>
										<TableHead className="text-xs">Mulai Kontrak</TableHead>
										<TableHead className="text-xs">Departemen / Jabatan</TableHead>
										<TableHead className="text-xs min-w-[180px]">Kategori Jenis</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell colSpan={6} className="text-center py-12">
												<Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
												<span className="text-xs text-slate-500">Memuat pegawai...</span>
											</TableCell>
										</TableRow>
									) : pegawaiList.length === 0 ? (
										<TableRow>
											<TableCell colSpan={6} className="text-center py-12 text-xs text-slate-500">
												Tidak ada data pegawai yang sesuai filter.
											</TableCell>
										</TableRow>
									) : (
										pegawaiList.map((p) => {
											const isSelected = selectedNiks.includes(p.nik);
											return (
												<TableRow
													key={p.nik}
													className={`hover:bg-blue-50/20 text-xs ${isSelected ? "bg-blue-50/40" : ""}`}
												>
													<TableCell className="text-center">
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => handleToggleNik(p.nik)}
															className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
														/>
													</TableCell>
													<TableCell className="font-mono text-slate-600">{p.nik}</TableCell>
													<TableCell className="font-semibold text-slate-900">{p.nama}</TableCell>
													<TableCell className="whitespace-nowrap text-slate-600">
														{formatTanggalShort(p.mulai_kontrak)}
													</TableCell>
													<TableCell>
														<div className="font-medium text-slate-800">{p.nama_departemen || "-"}</div>
														<div className="text-[11px] text-slate-400">{p.jabatan || "-"}</div>
													</TableCell>
													<TableCell>
														<Select
															value={p.kategori_id ? p.kategori_id.toString() : "none"}
															onValueChange={(val) => handleSetSingleMapping(p.nik, val)}
															disabled={saving}
														>
															<SelectTrigger className="h-8 text-xs bg-white border-slate-200">
																<SelectValue placeholder="Pilih Kategori..." />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="none">
																	<span className="text-slate-400 italic">-- Belum Dimapping --</span>
																</SelectItem>
																{kategoriList.map((k) => (
																	<SelectItem key={k.id} value={k.id.toString()}>
																		{k.nama}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					</TabsContent>

					{/* TAB 2: KELOLA KATEGORI */}
					<TabsContent value="kategori" className="flex-1 flex flex-col p-6 pt-4 gap-4 overflow-y-auto mt-0">
						{/* Form Tambah Kategori */}
						<form
							onSubmit={handleAddKategori}
							className="flex items-end gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg"
						>
							<div className="flex-1 space-y-1">
								<label className="text-xs font-semibold text-slate-600">Nama Kategori Baru</label>
								<Input
									placeholder="Contoh: Nakes, Apoteker, Gizi, Keamanan..."
									value={newKategoriNama}
									onChange={(e) => setNewKategoriNama(e.target.value)}
									className="h-9 text-xs bg-white"
								/>
							</div>
							<div className="w-24 space-y-1">
								<label className="text-xs font-semibold text-slate-600">Urutan</label>
								<Input
									type="number"
									value={newKategoriUrutan}
									onChange={(e) => setNewKategoriUrutan(parseInt(e.target.value) || 1)}
									className="h-9 text-xs bg-white"
								/>
							</div>
							<Button
								type="submit"
								size="sm"
								disabled={saving || !newKategoriNama.trim()}
								className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
							>
								{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
								Tambah Kategori
							</Button>
						</form>

						{/* Daftar Kategori */}
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader className="bg-slate-50">
									<TableRow>
										<TableHead className="w-16 text-center text-xs">Urutan</TableHead>
										<TableHead className="text-xs">Nama Kategori</TableHead>
										<TableHead className="text-right text-xs">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{kategoriList.length === 0 ? (
										<TableRow>
											<TableCell colSpan={3} className="text-center py-8 text-xs text-slate-500">
												Belum ada kategori.
											</TableCell>
										</TableRow>
									) : (
										kategoriList.map((k) => {
											const isEditing = editingKategori?.id === k.id;
											return (
												<TableRow key={k.id} className="hover:bg-slate-50/50 text-xs">
													<TableCell className="text-center font-mono font-medium">
														{isEditing ? (
															<Input
																type="number"
																value={editingKategori.urutan}
																onChange={(e) =>
																	setEditingKategori({
																		...editingKategori,
																		urutan: parseInt(e.target.value) || 0,
																	})
																}
																className="h-7 w-16 text-xs text-center mx-auto"
															/>
														) : (
															k.urutan
														)}
													</TableCell>
													<TableCell className="font-semibold text-slate-800">
														{isEditing ? (
															<Input
																value={editingKategori.nama}
																onChange={(e) =>
																	setEditingKategori({
																		...editingKategori,
																		nama: e.target.value,
																	})
																}
																className="h-7 text-xs"
															/>
														) : (
															<Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
																{k.nama}
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-right">
														{isEditing ? (
															<div className="flex items-center justify-end gap-1.5">
																<Button
																	size="sm"
																	onClick={() =>
																		handleUpdateKategori(
																			editingKategori.id,
																			editingKategori.nama,
																			editingKategori.urutan
																		)
																	}
																	disabled={saving}
																	className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
																>
																	Simpan
																</Button>
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => setEditingKategori(null)}
																	className="h-7 px-2 text-xs"
																>
																	Batal
																</Button>
															</div>
														) : (
															<div className="flex items-center justify-end gap-1">
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => setEditingKategori({ ...k })}
																	className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
																>
																	Edit
																</Button>
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => handleDeleteKategori(k.id, k.nama)}
																	className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
																>
																	<Trash2 className="w-3.5 h-3.5" />
																</Button>
															</div>
														)}
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
