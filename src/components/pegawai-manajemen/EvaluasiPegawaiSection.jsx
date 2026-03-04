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
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Search,
	BarChart3,
	FileText,
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
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="w-5 h-5" />
							Evaluasi Kinerja Pegawai
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Kelola penilaian kinerja pegawai per periode
						</p>
					</div>
					<Button onClick={() => handleOpenForm()}>
						<Plus className="w-4 h-4 mr-2" />
						Input Evaluasi
					</Button>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 pt-4">
					<div className="flex gap-2">
						<Select value={month} onValueChange={setMonth}>
							<SelectTrigger className="w-[140px]">
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
							<SelectTrigger className="w-[100px]">
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
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							placeholder="Cari nama pegawai atau jenis evaluasi..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
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
				) : filteredData.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>Tidak ada data evaluasi untuk periode ini</p>
					</div>
				) : (
					<div className="rounded-md border overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="hidden md:table-cell">NIK</TableHead>
									<TableHead>Nama Pegawai</TableHead>
									<TableHead>Jenis Evaluasi</TableHead>
									<TableHead className="text-center hidden sm:table-cell">
										Indek
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										Keterangan
									</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((item, idx) => (
									<TableRow key={`${item.id}-${item.kode_evaluasi}`}>
										<TableCell className="font-mono text-sm hidden md:table-cell">
											{item.nik}
										</TableCell>
										<TableCell className="font-medium">
											{item.nama_pegawai}
											<div className="sm:hidden mt-1 text-xs text-gray-500">
												Indek: {item.indek}
											</div>
										</TableCell>
										<TableCell>{item.nama_evaluasi}</TableCell>
										<TableCell className="text-center hidden sm:table-cell">
											{item.indek}
										</TableCell>
										<TableCell className="hidden lg:table-cell">
											{item.keterangan || "-"}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenForm(item)}
												>
													<Pencil className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													onClick={() => {
														setSelected(item);
														setShowDelete(true);
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
							<div>
								<Label>Pegawai *</Label>
								<Select
									value={formData.id ? String(formData.id) : ""}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, id: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Pegawai" />
									</SelectTrigger>
									<SelectContent className="max-h-[200px]">
										{pegawaiList.map((p) => (
											<SelectItem key={p.id} value={String(p.id)}>
												{p.nik} - {p.nama}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						{selected && (
							<div>
								<Label>Pegawai</Label>
								<Input
									value={`${selected.nik} - ${selected.nama_pegawai}`}
									disabled
								/>
							</div>
						)}

						{!selected && (
							<div>
								<Label>Jenis Evaluasi *</Label>
								<Select
									value={formData.kode_evaluasi}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, kode_evaluasi: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Jenis Evaluasi" />
									</SelectTrigger>
									<SelectContent>
										{evaluasiList.map((e) => (
											<SelectItem key={e.kode_evaluasi} value={e.kode_evaluasi}>
												{e.nama_evaluasi} (Indek: {e.indek})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						{selected && (
							<div>
								<Label>Jenis Evaluasi</Label>
								<Input value={selected.nama_evaluasi} disabled />
							</div>
						)}

						<div>
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
