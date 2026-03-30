
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";

const defaultForm = {
	kode_kelompok: "",
	threshold_persen: 100,
	bobot_jabatan: 35,
	bobot_personal: 65,
	keterangan: "",
	status: 1,
};

export default function ThresholdFormDialog({
	open,
	onOpenChange,
	threshold,
	onSuccess,
	kelompokJabatanList,
}) {
	const [form, setForm] = useState(defaultForm);
	const [submitting, setSubmitting] = useState(false);
	const isEdit = !!threshold?.id_threshold;

	useEffect(() => {
		if (threshold) {
			setForm({
				...defaultForm,
				...threshold,
				threshold_persen: parseFloat(threshold.threshold_persen) || 0,
				bobot_jabatan: parseFloat(threshold.bobot_jabatan) || 0,
				bobot_personal: parseFloat(threshold.bobot_personal) || 0,
			});
		} else {
			setForm({ ...defaultForm });
		}
	}, [threshold, open]);

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.kode_kelompok || !form.threshold_persen) {
			toast.error("Kelompok Jabatan dan Threshold wajib diisi");
			return;
		}

        const totalBobot = parseFloat(form.bobot_jabatan) + parseFloat(form.bobot_personal);
        if (Math.abs(totalBobot - 100) > 0.01) {
             toast.warning("Total bobot sebaiknya 100%");
        }

		setSubmitting(true);
		try {
			const token = getClientToken();
			const headers = { "Content-Type": "application/json" };
			if (token) headers["Authorization"] = `Bearer ${token}`;

			const url = isEdit
				? `/api/pegawai-manajemen/threshold/${threshold.id_threshold}`
				: "/api/pegawai-manajemen/threshold";
			const method = isEdit ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers,
				body: JSON.stringify(form),
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
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Threshold" : "Tambah Threshold"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Ubah data threshold kelompok jabatan"
							: "Tambah threshold baru untuk kelompok jabatan"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Kelompok Jabatan *</Label>
						<Select
							value={form.kode_kelompok}
							onValueChange={(v) => handleChange("kode_kelompok", v)}
							disabled={isEdit}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih Kelompok" />
							</SelectTrigger>
							<SelectContent>
								{(kelompokJabatanList || []).map((k) => (
									<SelectItem key={k.kode_kelompok} value={k.kode_kelompok}>
										{k.nama_kelompok} ({k.kode_kelompok})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Threshold Gaji Penuh (%) *</Label>
						<Input
							type="number"
							step="0.01"
                            min="0"
                            max="100"
							value={form.threshold_persen}
							onChange={(e) =>
								handleChange("threshold_persen", e.target.value)
							}
							placeholder="Contoh: 85.00"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Bobot Jabatan (%)</Label>
							<Input
								type="number"
								step="0.01"
                                min="0"
                                max="100"
								value={form.bobot_jabatan}
								onChange={(e) =>
									handleChange("bobot_jabatan", e.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Bobot Personal (%)</Label>
							<Input
								type="number"
								step="0.01"
                                min="0"
                                max="100"
								value={form.bobot_personal}
								onChange={(e) =>
									handleChange("bobot_personal", e.target.value)
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Keterangan</Label>
						<Textarea
							value={form.keterangan || ""}
							onChange={(e) => handleChange("keterangan", e.target.value)}
							placeholder="Deskripsi atau catatan tambahan"
						/>
					</div>
					
					{isEdit && (
						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={String(form.status)}
								onValueChange={(v) => handleChange("status", parseInt(v))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">Aktif</SelectItem>
									<SelectItem value="0">Nonaktif</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}

					<DialogFooter className="pt-4">
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
