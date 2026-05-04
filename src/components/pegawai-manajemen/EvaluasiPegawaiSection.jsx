"use client";

import { useState, useEffect, useCallback } from "react";
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
import { cn } from "@/lib/utils";
import {
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Search,
	BarChart3,
	FileText,
	Check,
	ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";

const MONTHS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

export default function EvaluasiPegawaiSection() {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [year, setYear] = useState(new Date().getFullYear().toString());
	const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
	const [search, setSearch] = useState("");

	const [showForm, setShowForm] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [selected, setSelected] = useState(null);

	// Refs for dropdowns
	const [evaluasiList, setEvaluasiList] = useState([]);
	const [pegawaiList, setPegawaiList] = useState([]);

	// Form state
	const [formData, setFormData] = useState({
		id: "",
		kode_evaluasi: "",
		keterangan: "",
	});

	// Popover state for Pegawai Select
	const [openPegawai, setOpenPegawai] = useState(false);
	const [pegawaiSearch, setPegawaiSearch] = useState("");

	const fetchEvaluasiList = useCallback(async () => {
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch("/api/pegawai-manajemen/evaluasi-kinerja", {
				headers,
			});
			const json = await res.json();
			if (res.ok) setEvaluasiList(json.data || []);
		} catch (err) {
			console.error("Failed to fetch evaluasi types", err);
		}
	}, []);

	// Fetch employees for dropdown - limited to active ones usually, but here all for simplicity
	const fetchPegawaiList = useCallback(async () => {
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			// Reuse existing pegawai API, maybe with limit=1000 or search
			const res = await fetch(
				"/api/pegawai-manajemen?limit=1000&stts_aktif=AKTIF",
				{ headers },
			);
			const json = await res.json();
			if (res.ok) setPegawaiList(json.data || []);
		} catch (err) {
			console.error("Failed to fetch pegawai", err);
		}
	}, []);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;

			const params = new URLSearchParams({
				tahun: year,
				bulan: month,
			});

			const res = await fetch(
				`/api/pegawai-manajemen/evaluasi-kinerja-pegawai?${params}`,
				{ headers },
			);
			const result = await res.json();

			if (res.ok) {
				setData(result.data || []);
			} else {
				toast.error(result.message || "Gagal mengambil data");
			}
		} catch (err) {
			console.error(err);
			toast.error("Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	}, [year, month]);

	useEffect(() => {
		fetchEvaluasiList();
		fetchPegawaiList();
	}, [fetchEvaluasiList, fetchPegawaiList]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const filteredData = data.filter((item) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			item.nama_pegawai?.toLowerCase().includes(s) ||
			item.nik?.toLowerCase().includes(s) ||
			item.nama_evaluasi?.toLowerCase().includes(s)
		);
	});

	const handleOpenForm = (item = null) => {
		if (item) {
			setFormData({
				id: item.id,
				kode_evaluasi: item.kode_evaluasi,
				keterangan: item.keterangan || "",
			});
			setSelected(item);
		} else {
			setFormData({
				id: "",
				kode_evaluasi: "",
				keterangan: "",
			});
			setSelected(null);
		}
		setPegawaiSearch("");
		setShowForm(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const token = getClientToken();
		const headers = {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
		};

		const isEdit = !!selected;
		const method = isEdit ? "PUT" : "POST";

		const payload = {
			...formData,
			tahun: year,
			bulan: month,
		};

		try {
			const res = await fetch(
				"/api/pegawai-manajemen/evaluasi-kinerja-pegawai",
				{
					method,
					headers,
					body: JSON.stringify(payload),
				},
			);
			const result = await res.json();

			if (res.ok) {
				toast.success(result.message);
				setShowForm(false);
				fetchData();
			} else {
				toast.error(result.message || "Terjadi kesalahan");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan");
		}
	};

	const handleDelete = async () => {
		if (!selected) return;
		const token = getClientToken();
		const headers = {};
		if (token) headers["Authorization"] = `Bearer ${token}`;

		try {
			const params = new URLSearchParams({
				id: selected.id,
				kode_evaluasi: selected.kode_evaluasi,
				tahun: selected.tahun,
				bulan: selected.bulan,
			});

			const res = await fetch(
				`/api/pegawai-manajemen/evaluasi-kinerja-pegawai?${params}`,
				{ method: "DELETE", headers },
			);
			const result = await res.json();

			if (res.ok) {
				toast.success(result.message);
				setShowDelete(false);
				setSelected(null);
				fetchData();
			} else {
				toast.error(result.message || "Gagal menghapus");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan");
		}
	};

	return (
		<Card>
			<CardHeader className="space-y-4 px-4 sm:px-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-xl font-bold">
							<BarChart3 className="w-5 h-5 text-amber-500" />
							Evaluasi Kinerja
						</CardTitle>
						<p className="text-xs sm:text-sm text-slate-500 mt-1">
							Periode: <span className="font-semibold text-[#0093dd]">{MONTHS[parseInt(month) - 1]} {year}</span>
						</p>
					</div>
					<Button 
						onClick={() => handleOpenForm()}
						className="bg-[#0093dd] hover:bg-[#007bbd] text-white shadow-sm h-10"
						size="sm"
					>
						<Plus className="w-4 h-4 mr-2" />
						Input Evaluasi
					</Button>
				</div>

				<div className="flex flex-col lg:flex-row gap-3">
					<div className="flex gap-2 w-full lg:w-auto">
						<Select value={month} onValueChange={setMonth}>
							<SelectTrigger className="flex-1 lg:w-[140px] h-10 bg-slate-50/50 border-slate-200">
								<SelectValue placeholder="Bulan" />
							</SelectTrigger>
							<SelectContent>
								{MONTHS.map((m, i) => (
									<SelectItem key={i + 1} value={(i + 1).toString()}>
										{m}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={year} onValueChange={setYear}>
							<SelectTrigger className="w-[100px] h-10 bg-slate-50/50 border-slate-200">
								<SelectValue placeholder="Tahun" />
							</SelectTrigger>
							<SelectContent>
								{Array.from(
									{ length: 5 },
									(_, i) => new Date().getFullYear() - 2 + i,
								).map((y) => (
									<SelectItem key={y} value={y.toString()}>
										{y}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							placeholder="Cari nama pegawai..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0 sm:p-6">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Loader2 className="w-8 h-8 animate-spin text-[#0093dd]" />
						<span className="text-sm text-slate-500">Memuat data...</span>
					</div>
				) : filteredData.length === 0 ? (
					<div className="text-center py-12 px-4">
						<div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
							<FileText className="w-8 h-8 text-slate-300" />
						</div>
						<p className="text-slate-500 font-medium">Tidak ada data evaluasi</p>
						<p className="text-xs text-slate-400 mt-1">Silakan pilih periode lain atau input data baru.</p>
					</div>
				) : (
					<>
						{/* Desktop View */}
						<div className="hidden md:block overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/50">
									<TableRow>
										<TableHead className="w-[100px]">NIK</TableHead>
										<TableHead>Nama Pegawai</TableHead>
										<TableHead>Jenis Evaluasi</TableHead>
										<TableHead className="text-center w-[80px]">Indek</TableHead>
										<TableHead className="hidden lg:table-cell">Keterangan</TableHead>
										<TableHead className="text-right w-[100px]">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredData.map((item) => (
										<TableRow key={`${item.id}-${item.kode_evaluasi}`} className="hover:bg-slate-50/50">
											<TableCell className="font-mono text-xs text-slate-500">
												{item.nik}
											</TableCell>
											<TableCell className="font-medium text-slate-900">
												{item.nama_pegawai}
											</TableCell>
											<TableCell>
												<span className="text-sm font-medium text-[#0093dd] bg-blue-50 px-2 py-1 rounded-md">
													{item.nama_evaluasi}
												</span>
											</TableCell>
											<TableCell className="text-center font-bold text-slate-700">
												{item.indek}
											</TableCell>
											<TableCell className="hidden lg:table-cell text-sm text-slate-500 truncate max-w-[200px]">
												{item.keterangan || "-"}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-slate-400 hover:text-[#0093dd]"
														onClick={() => handleOpenForm(item)}
													>
														<Pencil size={14} />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-slate-400 hover:text-red-500"
														onClick={() => {
															setSelected(item);
															setShowDelete(true);
														}}
													>
														<Trash2 size={14} />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Mobile View */}
						<div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
							{filteredData.map((item) => (
								<div key={`${item.id}-${item.kode_evaluasi}`} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
									<div className="flex justify-between items-start">
										<div className="space-y-1">
											<div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.nik}</div>
											<h4 className="font-bold text-slate-900">{item.nama_pegawai}</h4>
										</div>
										<div className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg border border-amber-100">
											Indek: {item.indek}
										</div>
									</div>
									<div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 flex items-center justify-between">
										<span className="text-xs font-semibold text-[#0093dd]">{item.nama_evaluasi}</span>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-[#0093dd]"
												onClick={() => handleOpenForm(item)}
											>
												<Pencil size={14} />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-red-400"
												onClick={() => {
													setSelected(item);
													setShowDelete(true);
												}}
											>
												<Trash2 size={14} />
											</Button>
										</div>
									</div>
									{item.keterangan && (
										<p className="text-[11px] text-slate-500 italic px-1">
											"{item.keterangan}"
										</p>
									)}
								</div>
							))}
						</div>
					</>
				)}
			</CardContent>

			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selected ? "Edit Evaluasi" : "Input Evaluasi"}
						</DialogTitle>
						<DialogDescription>
							Periode: {MONTHS[parseInt(month) - 1]} {year}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						{!selected && (
							<div className="space-y-2">
								<Label>Pegawai *</Label>
								<Popover open={openPegawai} onOpenChange={setOpenPegawai}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={openPegawai}
											className={cn(
												"w-full justify-between font-normal",
												!formData.id && "text-muted-foreground",
											)}
										>
											{formData.id
												? (() => {
														const peg = pegawaiList.find(
															(p) => String(p.id) === String(formData.id),
														);
														return peg
															? `${peg.nik} - ${peg.nama}`
															: "Pilih Pegawai";
												  })()
												: "Pilih Pegawai"}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-[var(--radix-popover-trigger-width)] p-0"
										align="start"
									>
										<Command shouldFilter={false}>
											<CommandInput
												placeholder="Cari NIK atau Nama..."
												value={pegawaiSearch}
												onValueChange={setPegawaiSearch}
											/>
											<CommandList>
												<CommandEmpty>
													{pegawaiList.length === 0
														? "Memuat data..."
														: "Pegawai tidak ditemukan."}
												</CommandEmpty>
												<CommandGroup>
													{pegawaiList
														.filter((p) => {
															if (!pegawaiSearch) return true;
															const searchLower = pegawaiSearch.toLowerCase();
															return (
																p.nik?.toLowerCase().includes(searchLower) ||
																p.nama?.toLowerCase().includes(searchLower)
															);
														})
														.slice(0, 50) // Limit to 50 for performance
														.map((p) => (
															<CommandItem
																key={p.id}
																value={String(p.id)}
																onSelect={(currentValue) => {
																	setFormData((prev) => ({
																		...prev,
																		id:
																			currentValue === String(formData.id)
																				? ""
																				: currentValue,
																	}));
																	setOpenPegawai(false);
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		String(formData.id) === String(p.id)
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
																{p.nik} - {p.nama}
															</CommandItem>
														))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
						)}
						{selected && (
							<div className="space-y-2">
								<Label>Pegawai</Label>
								<Input
									value={`${selected.nik} - ${selected.nama_pegawai}`}
									disabled
									className="w-full bg-muted"
								/>
							</div>
						)}

						{!selected && (
							<div className="space-y-2">
								<Label>Jenis Evaluasi *</Label>
								<Select
									value={formData.kode_evaluasi}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, kode_evaluasi: v }))
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Pilih Jenis Evaluasi" />
									</SelectTrigger>
									<SelectContent>
										{evaluasiList.map((e) => (
											<SelectItem
												key={e.kode_evaluasi}
												value={String(e.kode_evaluasi)}
											>
												{e.nama_evaluasi} (Indek: {e.indek})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						{selected && (
							<div className="space-y-2">
								<Label>Jenis Evaluasi</Label>
								<Input
									value={selected.nama_evaluasi}
									disabled
									className="w-full bg-muted"
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label>Keterangan</Label>
							<Input
								value={formData.keterangan}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										keterangan: e.target.value,
									}))
								}
								placeholder="Catatan tambahan (opsional)"
								className="w-full"
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowForm(false)}
							>
								Batal
							</Button>
							<Button type="submit">Simpan</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={showDelete} onOpenChange={setShowDelete}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Hapus Evaluasi</DialogTitle>
						<DialogDescription>
							Apakah Anda yakin ingin menghapus evaluasi untuk{" "}
							<strong>{selected?.nama_pegawai}</strong>?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDelete(false)}>
							Batal
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Hapus
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
