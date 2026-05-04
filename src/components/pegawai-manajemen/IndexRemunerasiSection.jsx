"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Briefcase,
	Users,
	AlertTriangle,
	Zap,
	GraduationCap,
	Search,
	BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";

const CONFIGS = {
	jnj: {
		title: "Jenis Jabatan",
		apiPath: "/api/pegawai-manajemen/jnj-jabatan",
		icon: Briefcase,
		fields: [
			{ key: "kode", label: "Kode", required: true },
			{ key: "nama", label: "Nama", required: true },
			{ key: "tnj", label: "Tunjangan", type: "number" },
			{ key: "indek", label: "Indek", type: "number" },
		],
		pk: "kode",
	},
	kelompok: {
		title: "Kelompok Jabatan",
		apiPath: "/api/pegawai-manajemen/kelompok-jabatan",
		icon: Users,
		fields: [
			{ key: "kode_kelompok", label: "Kode", required: true },
			{ key: "nama_kelompok", label: "Nama Kelompok" },
			{ key: "indek", label: "Indek", type: "number" },
		],
		pk: "kode_kelompok",
	},
	resiko: {
		title: "Resiko Kerja",
		apiPath: "/api/pegawai-manajemen/resiko-kerja",
		icon: AlertTriangle,
		fields: [
			{ key: "kode_resiko", label: "Kode", required: true },
			{ key: "nama_resiko", label: "Nama Resiko" },
			{ key: "indek", label: "Indek", type: "number" },
		],
		pk: "kode_resiko",
	},
	emergency: {
		title: "Emergency Index",
		apiPath: "/api/pegawai-manajemen/emergency-index",
		icon: Zap,
		fields: [
			{ key: "kode_emergency", label: "Kode", required: true },
			{ key: "nama_emergency", label: "Nama Emergency" },
			{ key: "indek", label: "Indek", type: "number" },
		],
		pk: "kode_emergency",
	},
	pendidikan: {
		title: "Pendidikan",
		apiPath: "/api/pegawai-manajemen/pendidikan",
		icon: GraduationCap,
		fields: [
			{ key: "tingkat", label: "Tingkat", required: true },
			{ key: "indek", label: "Indek", type: "number" },
			{ key: "gapok1", label: "Gaji Pokok 1", type: "number" },
			{ key: "kenaikan", label: "Kenaikan", type: "number" },
			{ key: "maksimal", label: "Maksimal", type: "number" },
		],
		pk: "tingkat",
	},
	evaluasi: {
		title: "Evaluasi Kinerja",
		apiPath: "/api/pegawai-manajemen/evaluasi-kinerja",
		icon: BarChart3,
		fields: [
			{ key: "kode_evaluasi", label: "Kode", required: true },
			{ key: "nama_evaluasi", label: "Nama Evaluasi", required: true },
			{ key: "indek", label: "Indek", type: "number" },
		],
		pk: "kode_evaluasi",
	},
	pencapaian: {
		title: "Pencapaian Kinerja",
		apiPath: "/api/pegawai-manajemen/pencapaian-kinerja",
		icon: Zap,
		fields: [
			{ key: "kode_pencapaian", label: "Kode", required: true },
			{ key: "nama_pencapaian", label: "Nama Pencapaian", required: true },
			{ key: "indek", label: "Indek", type: "number" },
		],
		pk: "kode_pencapaian",
	},
};

function RemunerasiTable({ type }) {
	const config = CONFIGS[type];
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [selected, setSelected] = useState(null);
	const [formData, setFormData] = useState({});

	const displayCols = config.fields.map((f) => f.key);
	const filteredData = data.filter((row) => {
		if (!search.trim()) return true;
		const searchLower = search.toLowerCase().trim();
		return displayCols.some((col) => {
			const val = row[col];
			return val != null && String(val).toLowerCase().includes(searchLower);
		});
	});

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch(config.apiPath, { headers });
			const result = await res.json();
			if (res.ok) setData(result.data || []);
		} catch (err) {
			toast.error("Gagal mengambil data");
		} finally {
			setLoading(false);
		}
	}, [config.apiPath]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenForm = (item = null) => {
		if (item) {
			const fd = {};
			config.fields.forEach((f) => {
				fd[f.key] = item[f.key] ?? "";
			});
			setFormData(fd);
			setSelected(item);
		} else {
			setFormData(
				config.fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}),
			);
			setSelected(null);
		}
		setShowForm(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const token = getClientToken();
		const headers = { "Content-Type": "application/json" };
		if (token) headers["Authorization"] = `Bearer ${token}`;

		const isEdit = !!selected;
		const method = isEdit ? "PUT" : "POST";
		const body = { ...formData };
		config.fields.forEach((f) => {
			if (f.type === "number" && body[f.key] !== undefined) {
				body[f.key] =
					f.key === "indek" || f.key === "maksimal"
						? parseInt(body[f.key]) || 0
						: parseFloat(body[f.key]) || 0;
			}
		});

		try {
			const res = await fetch(config.apiPath, {
				method,
				headers,
				body: JSON.stringify(body),
			});
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
		const pkVal = selected[config.pk];
		try {
			const res = await fetch(
				`${config.apiPath}?${config.pk}=${encodeURIComponent(pkVal)}`,
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

	const Icon = config.icon;

	return (
		<>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
				<h3 className="font-medium flex items-center gap-2">
					<Icon className="w-4 h-4" />
					{config.title}
				</h3>
				<div className="flex gap-2 flex-1 sm:flex-initial sm:max-w-xs">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							placeholder="Cari..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 h-9"
						/>
					</div>
					<Button
						size="sm"
						onClick={() => handleOpenForm()}
						className="shrink-0"
					>
						<Plus className="w-4 h-4 mr-2" />
						Tambah
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
				</div>
			) : data.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>Belum ada data</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-2"
						onClick={() => handleOpenForm()}
					>
						<Plus className="w-4 h-4 mr-2" />
						Tambah Pertama
					</Button>
				</div>
			) : filteredData.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>
						Tidak ada data yang sesuai dengan pencarian &quot;{search}&quot;
					</p>
				</div>
			) : (
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								{displayCols.map((col) => (
									<TableHead key={col}>
										{config.fields.find((f) => f.key === col)?.label || col}
									</TableHead>
								))}
								<TableHead className="text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredData.map((row, idx) => (
								<TableRow key={row[config.pk] || idx}>
									{displayCols.map((col) => (
										<TableCell key={col}>{row[col] ?? "-"}</TableCell>
									))}
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleOpenForm(row)}
											>
												<Pencil className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													setSelected(row);
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

			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selected ? `Edit ${config.title}` : `Tambah ${config.title}`}
						</DialogTitle>
						<DialogDescription>
							{selected
								? "Ubah data"
								: "Isi data baru. Field bertanda * wajib diisi."}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						{config.fields.map((f) => (
							<div key={f.key}>
								<Label>
									{f.label} {f.required && "*"}
								</Label>
								<Input
									type={f.type || "text"}
									value={formData[f.key] ?? ""}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											[f.key]: e.target.value,
										}))
									}
									placeholder={f.label}
									disabled={!!selected && f.key === config.pk}
								/>
							</div>
						))}
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
						<DialogTitle>Hapus {config.title}</DialogTitle>
						<DialogDescription>
							Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak
							dapat dibatalkan.
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
		</>
	);
}

export default function IndexRemunerasiSection() {
	return (
		<Card>
			<CardHeader className="space-y-2 px-4 sm:px-6">
				<CardTitle className="flex items-center gap-2 text-xl font-bold">
					<Briefcase className="w-5 h-5 text-[#0093dd]" />
					Index Remunerasi
				</CardTitle>
				<p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
					Kelola konfigurasi index remunerasi untuk berbagai kategori jabatan, resiko kerja, pendidikan, dan penilaian kinerja.
				</p>
			</CardHeader>
			<CardContent className="px-3 sm:px-6">
				<Tabs defaultValue="jnj" className="w-full">
					<div className="pgw-tab-list-container mb-6">
						<TabsList className="pgw-tab-list border-b border-slate-100 pb-0 gap-1 sm:gap-2">
							<TabsTrigger value="jnj" className="pgw-subtab-trigger">
								Jabatan
							</TabsTrigger>
							<TabsTrigger value="kelompok" className="pgw-subtab-trigger">
								Kelompok
							</TabsTrigger>
							<TabsTrigger value="resiko" className="pgw-subtab-trigger">
								Resiko
							</TabsTrigger>
							<TabsTrigger value="emergency" className="pgw-subtab-trigger">
								Emergency
							</TabsTrigger>
							<TabsTrigger value="pendidikan" className="pgw-subtab-trigger">
								Pendidikan
							</TabsTrigger>
							<TabsTrigger value="evaluasi" className="pgw-subtab-trigger">
								Evaluasi
							</TabsTrigger>
							<TabsTrigger value="pencapaian" className="pgw-subtab-trigger">
								Capaian
							</TabsTrigger>
						</TabsList>

						<style jsx>{`
							.pgw-subtab-trigger {
								font-size: 13px;
								font-weight: 500;
								padding: 8px 16px;
								border-radius: 8px 8px 0 0;
								border-bottom: 2px solid transparent;
								background: transparent;
								color: #64748b;
								transition: all 0.2s ease;
								white-space: nowrap;
							}
							.pgw-subtab-trigger[data-state="active"] {
								color: #0093dd;
								background: #f0f9ff;
								border-bottom-color: #0093dd;
								font-weight: 600;
							}
							.pgw-tab-list::-webkit-scrollbar { display: none; }
						`}</style>
					</div>
					<TabsContent value="jnj" className="mt-4">
						<RemunerasiTable type="jnj" />
					</TabsContent>
					<TabsContent value="kelompok" className="mt-4">
						<RemunerasiTable type="kelompok" />
					</TabsContent>
					<TabsContent value="resiko" className="mt-4">
						<RemunerasiTable type="resiko" />
					</TabsContent>
					<TabsContent value="emergency" className="mt-4">
						<RemunerasiTable type="emergency" />
					</TabsContent>
					<TabsContent value="pendidikan" className="mt-4">
						<RemunerasiTable type="pendidikan" />
					</TabsContent>
					<TabsContent value="evaluasi" className="mt-4">
						<RemunerasiTable type="evaluasi" />
					</TabsContent>
					<TabsContent value="pencapaian" className="mt-4">
						<RemunerasiTable type="pencapaian" />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
