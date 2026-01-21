"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	PieChart,
	AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function KategoriPresentase({ onDataChange }) {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState([]);
	const [summary, setSummary] = useState({ total_presentase: 0, sisa_presentase: 100 });
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedKategori, setSelectedKategori] = useState(null);
	const [formData, setFormData] = useState({
		nama_kategori: "",
		presentase_dari_total: "",
		keterangan: ""
	});
	const [submitting, setSubmitting] = useState(false);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/presentase/kategori");
			if (response.ok) {
				const result = await response.json();
				setData(result.data || []);
				setSummary(result.summary || { total_presentase: 0, sisa_presentase: 100 });
			}
		} catch (error) {
			console.error("Error fetching kategori:", error);
			toast.error("Gagal mengambil data kategori");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenDialog = (kategori = null) => {
		if (kategori) {
			setSelectedKategori(kategori);
			setFormData({
				nama_kategori: kategori.nama_kategori,
				presentase_dari_total: kategori.presentase_dari_total.toString(),
				keterangan: kategori.keterangan || ""
			});
		} else {
			setSelectedKategori(null);
			setFormData({
				nama_kategori: "",
				presentase_dari_total: "",
				keterangan: ""
			});
		}
		setShowDialog(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!formData.nama_kategori || !formData.presentase_dari_total) {
			toast.error("Nama kategori dan presentase harus diisi");
			return;
		}

		setSubmitting(true);
		try {
			const method = selectedKategori ? "PUT" : "POST";
			const body = selectedKategori 
				? { ...formData, id_kategori: selectedKategori.id_kategori }
				: formData;

			const response = await fetch("/api/presentase/kategori", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
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
		if (!selectedKategori) return;

		setSubmitting(true);
		try {
			const response = await fetch("/api/presentase/kategori", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id_kategori: selectedKategori.id_kategori })
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message);
				setShowDeleteDialog(false);
				setSelectedKategori(null);
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

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="w-5 h-5 text-emerald-600" />
							Kategori Presentase
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Pembagian persentase dari total jasa rumah sakit
						</p>
					</div>
					<Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
						<Plus className="w-4 h-4 mr-2" />
						Tambah Kategori
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{/* Progress Bar */}
				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<div className="flex justify-between text-sm mb-2">
						<span className="text-gray-600">Total Alokasi</span>
						<span className="font-medium">
							{summary.total_presentase}% terpakai, {summary.sisa_presentase.toFixed(2)}% tersisa
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-3">
						<div 
							className={`h-3 rounded-full transition-all duration-500 ${
								summary.total_presentase > 100 ? 'bg-red-500' :
								summary.total_presentase > 90 ? 'bg-amber-500' : 'bg-emerald-500'
							}`}
							style={{ width: `${Math.min(summary.total_presentase, 100)}%` }}
						/>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin" />
					</div>
				) : data.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>Belum ada kategori presentase</p>
						<Button 
							variant="outline" 
							className="mt-3"
							onClick={() => handleOpenDialog()}
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Kategori Pertama
						</Button>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nama Kategori</TableHead>
								<TableHead className="text-right">Presentase</TableHead>
								<TableHead className="text-right">Unit Terdaftar</TableHead>
								<TableHead className="text-right">Total Unit %</TableHead>
								<TableHead>Keterangan</TableHead>
								<TableHead className="text-center">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((kategori) => (
								<TableRow key={kategori.id_kategori}>
									<TableCell className="font-medium">{kategori.nama_kategori}</TableCell>
									<TableCell className="text-right">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
											{kategori.presentase_dari_total}%
										</span>
									</TableCell>
									<TableCell className="text-right">{kategori.jumlah_unit}</TableCell>
									<TableCell className="text-right">
										<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											parseFloat(kategori.total_unit_presentase) > 100 
												? 'bg-red-100 text-red-800' 
												: parseFloat(kategori.total_unit_presentase) === 100
												? 'bg-green-100 text-green-800'
												: 'bg-amber-100 text-amber-800'
										}`}>
											{kategori.total_unit_presentase}%
										</span>
									</TableCell>
									<TableCell className="text-gray-500 text-sm">
										{kategori.keterangan || "-"}
									</TableCell>
									<TableCell>
										<div className="flex items-center justify-center gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleOpenDialog(kategori)}
											>
												<Pencil className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													setSelectedKategori(kategori);
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
				)}
			</CardContent>

			{/* Form Dialog */}
			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedKategori ? "Edit Kategori" : "Tambah Kategori Baru"}
						</DialogTitle>
						<DialogDescription>
							{selectedKategori 
								? "Ubah data kategori presentase"
								: "Tambahkan kategori baru untuk pembagian jasa"}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="nama_kategori">Nama Kategori</Label>
							<Input
								id="nama_kategori"
								value={formData.nama_kategori}
								onChange={(e) => setFormData({ ...formData, nama_kategori: e.target.value })}
								placeholder="Contoh: Pelayanan, Staff, dll"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="presentase">
								Presentase dari Total (%)
								{!selectedKategori && (
									<span className="text-gray-500 font-normal ml-2">
										Maks: {summary.sisa_presentase.toFixed(2)}%
									</span>
								)}
							</Label>
							<Input
								id="presentase"
								type="number"
								step="0.01"
								min="0"
								max="100"
								value={formData.presentase_dari_total}
								onChange={(e) => setFormData({ ...formData, presentase_dari_total: e.target.value })}
								placeholder="0.00"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="keterangan">Keterangan (Opsional)</Label>
							<Textarea
								id="keterangan"
								value={formData.keterangan}
								onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
								placeholder="Tambahkan keterangan..."
								rows={3}
							/>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
								Batal
							</Button>
							<Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
								{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{selectedKategori ? "Simpan Perubahan" : "Tambah Kategori"}
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
							Apakah Anda yakin ingin menghapus kategori "{selectedKategori?.nama_kategori}"? 
							Semua unit dan alokasi pegawai di bawahnya juga akan terhapus.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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

