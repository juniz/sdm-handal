"use client";

import { useState, useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TandaTanganModal({
	open,
	onOpenChange,
	gajiData,
	onSubmit,
}) {
	const [tandaTangan, setTandaTangan] = useState(null);
	const [catatan, setCatatan] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const signPadRef = useRef(null);

	const handleClear = () => {
		if (signPadRef.current) {
			signPadRef.current.clear();
			setTandaTangan(null);
		}
	};

	const handleSubmit = async () => {
		if (!signPadRef.current || signPadRef.current.isEmpty()) {
			alert("Silakan buat tanda tangan terlebih dahulu");
			return;
		}

		try {
			setIsSubmitting(true);
			const signatureData = signPadRef.current.toDataURL();
			await onSubmit({
				gaji_id: gajiData.id,
				tanda_tangan: signatureData,
				catatan: catatan || null,
			});
			handleClose();
		} catch (error) {
			console.error("Error submitting tanda tangan:", error);
			alert("Terjadi kesalahan saat menyimpan tanda tangan");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		handleClear();
		setCatatan("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Tanda Tangan Validasi Gaji</DialogTitle>
					<DialogDescription>
						Buat tanda tangan untuk memvalidasi gaji periode{" "}
						{gajiData?.periode_bulan}/{gajiData?.periode_tahun}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Info Gaji */}
					<div className="bg-gray-50 p-3 rounded-md">
						<div className="text-sm">
							<div className="font-medium">Nama: {gajiData?.nama}</div>
							<div className="text-gray-600">
								Periode: {gajiData?.periode_bulan}/{gajiData?.periode_tahun} | Jenis: {gajiData?.jenis}
							</div>
							<div className="text-gray-600 font-medium">
								Total: {new Intl.NumberFormat("id-ID", {
									style: "currency",
									currency: "IDR",
									minimumFractionDigits: 0,
								}).format(gajiData?.gaji || 0)}
							</div>
						</div>
					</div>

					{/* Tanda Tangan */}
					<div className="space-y-2">
						<Label>Tanda Tangan</Label>
						<div className="border rounded-lg p-2 bg-white">
							<SignaturePad
								ref={signPadRef}
								canvasProps={{
									className: "w-full h-40 border rounded",
								}}
								onEnd={() => {
									if (signPadRef.current && !signPadRef.current.isEmpty()) {
										setTandaTangan(signPadRef.current.toDataURL());
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleClear}
								className="mt-2"
							>
								Hapus Tanda Tangan
							</Button>
						</div>
					</div>

					{/* Catatan */}
					<div className="space-y-2">
						<Label htmlFor="catatan">Catatan (Opsional)</Label>
						<Textarea
							id="catatan"
							value={catatan}
							onChange={(e) => setCatatan(e.target.value)}
							placeholder="Tambahkan catatan jika diperlukan..."
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
					>
						Batal
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting || !tandaTangan}
					>
						{isSubmitting ? "Menyimpan..." : "Simpan Tanda Tangan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

