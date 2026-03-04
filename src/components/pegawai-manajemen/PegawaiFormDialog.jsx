"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";

const JK_OPTIONS = [
	{ value: "Pria", label: "Pria" },
	{ value: "Wanita", label: "Wanita" },
];
const MS_KERJA_OPTIONS = [
	{ value: "<1", label: "< 1 Tahun" },
	{ value: "PT", label: "PT" },
	{ value: "FT>1", label: "FT > 1 Tahun" },
];
const STTS_AKTIF_OPTIONS = [
	{ value: "AKTIF", label: "Aktif" },
	{ value: "CUTI", label: "Cuti" },
	{ value: "KELUAR", label: "Keluar" },
	{ value: "TENAGA LUAR", label: "Tenaga Luar" },
	{ value: "MITRA", label: "Mitra" },
];

const defaultForm = {
	nik: "",
	nama: "",
	jk: "Pria",
	jbtn: "",
	jnj_jabatan: "",
	kode_kelompok: "",
	kode_resiko: "",
	kode_emergency: "",
	departemen: "",
	bidang: "",
	stts_wp: "",
	stts_kerja: "",
	npwp: "",
	pendidikan: "",
	gapok: 0,
	tmp_lahir: "",
	tgl_lahir: "",
	alamat: "",
	kota: "",
	mulai_kerja: "",
	ms_kerja: "FT>1",
	indexins: "",
	bpd: "",
	rekening: "",
	stts_aktif: "AKTIF",
	wajibmasuk: 6,
	pengurang: 0,
	indek: 0,
	mulai_kontrak: "",
	cuti_diambil: 0,
	dankes: 0,
	photo: "",
	no_ktp: "",
};

export default function PegawaiFormDialog({
	open,
	onOpenChange,
	pegawai,
	onSuccess,
	departemenList,
	pendidikanList,
	bidangList,
	sttsWpList,
	sttsKerjaList,
	bankList,
	jnjJabatanList,
	kelompokJabatanList,
	resikoKerjaList,
	emergencyIndexList,
}) {
	const [form, setForm] = useState(defaultForm);
	const [submitting, setSubmitting] = useState(false);
	const isEdit = !!pegawai?.id;

	useEffect(() => {
		if (pegawai) {
			setForm({
				...defaultForm,
				...pegawai,
				gapok: pegawai.gapok ?? 0,
				wajibmasuk: pegawai.wajibmasuk ?? 6,
				pengurang: pegawai.pengurang ?? 0,
				indek: pegawai.indek ?? 0,
				cuti_diambil: pegawai.cuti_diambil ?? 0,
				dankes: pegawai.dankes ?? 0,
				tgl_lahir:
					pegawai.tgl_lahir?.split?.("T")[0] || pegawai.tgl_lahir || "",
				mulai_kerja:
					pegawai.mulai_kerja?.split?.("T")[0] || pegawai.mulai_kerja || "",
				mulai_kontrak:
					pegawai.mulai_kontrak?.split?.("T")[0] || pegawai.mulai_kontrak || "",
			});
		} else {
			setForm({ ...defaultForm });
		}
	}, [pegawai, open]);

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (field === "departemen") {
			setForm((prev) => ({ ...prev, indexins: value || prev.indexins }));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.nik || !form.nama || !form.jbtn || !form.departemen) {
			toast.error("NIK, Nama, Jabatan, dan Departemen wajib diisi");
			return;
		}
		setSubmitting(true);
		try {
			const token = getClientToken();
			const headers = { "Content-Type": "application/json" };
			if (token) headers["Authorization"] = `Bearer ${token}`;

			const body = { ...form };
			if (body.tgl_lahir === "") body.tgl_lahir = null;
			if (body.mulai_kerja === "") body.mulai_kerja = null;
			if (body.mulai_kontrak === "") body.mulai_kontrak = null;

			const url = "/api/pegawai-manajemen";
			const method = isEdit ? "PUT" : "POST";
			if (isEdit) body.id = pegawai.id;

			const res = await fetch(url, {
				method,
				headers,
				body: JSON.stringify(body),
			});
			const result = await res.json();

			if (res.ok) {
				toast.success(result.message);
				onOpenChange(false);
				onSuccess?.();
			} else {
				toast.error(result.message || "Terjadi kesalahan");
			}
		} catch (err) {
			console.error(err);
			toast.error("Terjadi kesalahan");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="min-h-[520px] max-h-[90vh] overflow-y-auto p-6 sm:p-8"
				style={{
					width: "min(56rem, 95vw)",
					maxWidth: "min(56rem, 95vw)",
					minWidth: "min(56rem, 95vw)",
				}}
				onCloseAutoFocus={(e) => {
					e.preventDefault();
				}}
				onInteractOutside={(e) => {
					// Prevent closing when interacting with toasts or other overlays
					const target = e.target;
					if (target?.closest?.("[data-sonner-toaster]")) {
						e.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Pegawai" : "Tambah Pegawai"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Ubah data pegawai"
							: "Isi data pegawai baru. Field bertanda * wajib diisi."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="min-w-0">
					<Tabs defaultValue="pribadi" className="w-full">
						<TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-11">
							<TabsTrigger value="pribadi" className="text-sm">
								Pribadi
							</TabsTrigger>
							<TabsTrigger value="jabatan" className="text-sm">
								Jabatan
							</TabsTrigger>
							<TabsTrigger value="remunerasi" className="text-sm">
								Faktor Remunerasi
							</TabsTrigger>
							<TabsTrigger value="kepegawaian" className="text-sm">
								Kepegawaian
							</TabsTrigger>
							<TabsTrigger value="gaji" className="text-sm">
								Gaji & Bank
							</TabsTrigger>
							<TabsTrigger value="lainnya" className="text-sm">
								Lainnya
							</TabsTrigger>
						</TabsList>

						<TabsContent value="pribadi" className="space-y-5 pt-6 w-full">
							<div className="flex flex-col gap-5 w-full">
								<div className="min-w-0">
									<Label>NIK *</Label>
									<Input
										value={form.nik}
										onChange={(e) => handleChange("nik", e.target.value)}
										placeholder="NIK"
										disabled={isEdit}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Nama *</Label>
									<Input
										value={form.nama}
										onChange={(e) => handleChange("nama", e.target.value)}
										placeholder="Nama lengkap"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Jenis Kelamin</Label>
									<Select
										value={form.jk}
										onValueChange={(v) => handleChange("jk", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{JK_OPTIONS.map((o) => (
												<SelectItem key={o.value} value={o.value}>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Tempat Lahir</Label>
									<Input
										value={form.tmp_lahir}
										onChange={(e) => handleChange("tmp_lahir", e.target.value)}
										placeholder="Tempat lahir"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Tanggal Lahir</Label>
									<Input
										type="date"
										value={form.tgl_lahir}
										onChange={(e) => handleChange("tgl_lahir", e.target.value)}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>No. KTP</Label>
									<Input
										value={form.no_ktp}
										onChange={(e) => handleChange("no_ktp", e.target.value)}
										placeholder="No. KTP"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>NPWP</Label>
									<Input
										value={form.npwp}
										onChange={(e) => handleChange("npwp", e.target.value)}
										placeholder="NPWP"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Kota</Label>
									<Input
										value={form.kota}
										onChange={(e) => handleChange("kota", e.target.value)}
										placeholder="Kota"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Alamat</Label>
									<Textarea
										value={form.alamat}
										onChange={(e) => handleChange("alamat", e.target.value)}
										placeholder="Alamat lengkap"
										className="w-full min-h-[80px]"
										rows={3}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="jabatan" className="space-y-5 pt-6 w-full">
							<div className="flex flex-col gap-5 w-full">
								<div className="min-w-0">
									<Label>Jabatan *</Label>
									<Input
										value={form.jbtn}
										onChange={(e) => handleChange("jbtn", e.target.value)}
										placeholder="Nama jabatan"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Departemen *</Label>
									<Select
										value={form.departemen}
										onValueChange={(v) => handleChange("departemen", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											{(departemenList || []).map((d) => (
												<SelectItem key={d.dep_id} value={d.dep_id}>
													{d.nama}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Bidang</Label>
									<Select
										value={form.bidang}
										onValueChange={(v) => handleChange("bidang", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											{(bidangList || []).map((b) => (
												<SelectItem key={b.nama} value={b.nama}>
													{b.nama}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="remunerasi" className="space-y-5 pt-6 w-full">
							<div className="rounded-lg border bg-gray-50/50 p-4">
								<p className="text-sm font-medium text-gray-700 mb-4">
									Faktor index remunerasi (jenis jabatan, kelompok, resiko,
									emergency, pendidikan)
								</p>
								<div className="flex flex-col gap-5">
									<div className="min-w-0">
										<Label>Jenjang Jabatan</Label>
										<Select
											value={form.jnj_jabatan}
											onValueChange={(v) => handleChange("jnj_jabatan", v)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih" />
											</SelectTrigger>
											<SelectContent>
												{(jnjJabatanList || []).map((j) => (
													<SelectItem key={j.kode} value={j.kode}>
														{j.nama}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="min-w-0">
										<Label>Kelompok Jabatan</Label>
										<Select
											value={form.kode_kelompok}
											onValueChange={(v) => handleChange("kode_kelompok", v)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih" />
											</SelectTrigger>
											<SelectContent>
												{(kelompokJabatanList || []).map((k) => (
													<SelectItem
														key={k.kode_kelompok}
														value={k.kode_kelompok}
													>
														{k.nama_kelompok || k.kode_kelompok}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="min-w-0">
										<Label>Resiko Kerja</Label>
										<Select
											value={form.kode_resiko}
											onValueChange={(v) => handleChange("kode_resiko", v)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih" />
											</SelectTrigger>
											<SelectContent>
												{(resikoKerjaList || []).map((r) => (
													<SelectItem key={r.kode_resiko} value={r.kode_resiko}>
														{r.nama_resiko || r.kode_resiko}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="min-w-0">
										<Label>Emergency Index</Label>
										<Select
											value={form.kode_emergency}
											onValueChange={(v) => handleChange("kode_emergency", v)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih" />
											</SelectTrigger>
											<SelectContent>
												{(emergencyIndexList || []).map((e) => (
													<SelectItem
														key={e.kode_emergency}
														value={e.kode_emergency}
													>
														{e.nama_emergency || e.kode_emergency}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="min-w-0">
										<Label>Pendidikan</Label>
										<Select
											value={form.pendidikan}
											onValueChange={(v) => handleChange("pendidikan", v)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih" />
											</SelectTrigger>
											<SelectContent>
												{(pendidikanList || []).map((p) => (
													<SelectItem key={p.tingkat} value={p.tingkat}>
														{p.tingkat}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="kepegawaian" className="space-y-5 pt-6 w-full">
							<div className="flex flex-col gap-5 w-full">
								<div className="min-w-0">
									<Label>Status WP</Label>
									<Select
										value={form.stts_wp}
										onValueChange={(v) => handleChange("stts_wp", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											{(sttsWpList || []).map((s) => (
												<SelectItem key={s.stts} value={s.stts}>
													{s.ktg}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Status Kerja</Label>
									<Select
										value={form.stts_kerja}
										onValueChange={(v) => handleChange("stts_kerja", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											{(sttsKerjaList || []).map((s) => (
												<SelectItem key={s.stts} value={s.stts}>
													{s.ktg}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Status Aktif</Label>
									<Select
										value={form.stts_aktif}
										onValueChange={(v) => handleChange("stts_aktif", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STTS_AKTIF_OPTIONS.map((o) => (
												<SelectItem key={o.value} value={o.value}>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Mulai Kerja</Label>
									<Input
										type="date"
										value={form.mulai_kerja}
										onChange={(e) =>
											handleChange("mulai_kerja", e.target.value)
										}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Masa Kerja</Label>
									<Select
										value={form.ms_kerja}
										onValueChange={(v) => handleChange("ms_kerja", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{MS_KERJA_OPTIONS.map((o) => (
												<SelectItem key={o.value} value={o.value}>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Wajib Masuk (hari)</Label>
									<Input
										type="number"
										min={0}
										value={form.wajibmasuk}
										onChange={(e) =>
											handleChange("wajibmasuk", parseInt(e.target.value) || 0)
										}
										className="w-full"
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="gaji" className="space-y-5 pt-6 w-full">
							<div className="flex flex-col gap-5 w-full">
								<div className="min-w-0">
									<Label>Gaji Pokok</Label>
									<Input
										type="number"
										min={0}
										step={0.01}
										value={form.gapok}
										onChange={(e) =>
											handleChange("gapok", parseFloat(e.target.value) || 0)
										}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Pengurang</Label>
									<Input
										type="number"
										min={0}
										step={0.01}
										value={form.pengurang}
										onChange={(e) =>
											handleChange("pengurang", parseFloat(e.target.value) || 0)
										}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Indek</Label>
									<Input
										type="number"
										min={0}
										value={form.indek}
										onChange={(e) =>
											handleChange("indek", parseInt(e.target.value) || 0)
										}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Index Instansi</Label>
									<Select
										value={form.indexins}
										onValueChange={(v) => handleChange("indexins", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											{(departemenList || []).map((d) => (
												<SelectItem key={d.dep_id} value={d.dep_id}>
													{d.nama}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>Bank</Label>
									<Select
										value={form.bpd}
										onValueChange={(v) => handleChange("bpd", v)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											{(bankList || []).map((b) => (
												<SelectItem key={b.namabank} value={b.namabank}>
													{b.namabank}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0">
									<Label>No. Rekening</Label>
									<Input
										value={form.rekening}
										onChange={(e) => handleChange("rekening", e.target.value)}
										placeholder="No. Rekening"
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Dankes</Label>
									<Input
										type="number"
										min={0}
										step={0.01}
										value={form.dankes}
										onChange={(e) =>
											handleChange("dankes", parseFloat(e.target.value) || 0)
										}
										className="w-full"
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="lainnya" className="space-y-5 pt-6 w-full">
							<div className="flex flex-col gap-5 w-full">
								<div className="min-w-0">
									<Label>Cuti Diambil</Label>
									<Input
										type="number"
										min={0}
										value={form.cuti_diambil}
										onChange={(e) =>
											handleChange(
												"cuti_diambil",
												parseInt(e.target.value) || 0,
											)
										}
										className="w-full"
									/>
								</div>
								<div className="min-w-0">
									<Label>Mulai Kontrak</Label>
									<Input
										type="date"
										value={form.mulai_kontrak}
										onChange={(e) =>
											handleChange("mulai_kontrak", e.target.value)
										}
										className="w-full"
									/>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<DialogFooter className="mt-8 pt-6 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{isEdit ? "Simpan" : "Tambah"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
