"use client";

import { useState, useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { toast } from "sonner";
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
import {
	ShieldCheck,
	RotateCcw,
	ReceiptText,
	AlertCircle,
	Check,
	Lock,
} from "lucide-react";

export default function TandaTanganModal({
	open,
	onOpenChange,
	gajiData,
	onSubmit,
}) {
	const [tandaTangan, setTandaTangan] = useState(null);
	const [catatan, setCatatan] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [canvasError, setCanvasError] = useState(false);
	const signPadRef = useRef(null);

	const handleClear = () => {
		if (signPadRef.current) {
			signPadRef.current.clear();
			setTandaTangan(null);
			setCanvasError(false);
		}
	};

	const handleSubmit = async () => {
		if (!signPadRef.current || signPadRef.current.isEmpty()) {
			setCanvasError(true);
			toast.error("Silakan bubuhkan tanda tangan Anda pada canvas terlebih dahulu");
			return;
		}

		try {
			setIsSubmitting(true);
			setCanvasError(false);
			const signatureData = signPadRef.current.toDataURL();
			await onSubmit({
				gaji_id: gajiData.id,
				tanda_tangan: signatureData,
				catatan: catatan.trim() || null,
			});
			handleClose();
		} catch (error) {
			console.error("Error submitting tanda tangan:", error);
			toast.error(error?.message || "Terjadi kesalahan saat menyimpan tanda tangan");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		handleClear();
		setCatatan("");
		setCanvasError(false);
		onOpenChange(false);
	};

	const periodeBulan = gajiData?.periode_bulan ?? gajiData?.periodeBulan;
	const periodeTahun = gajiData?.periode_tahun ?? gajiData?.periodeTahun;
	const namaPegawai = gajiData?.nama ?? gajiData?.namaPegawai ?? "-";
	const jenisGaji = gajiData?.jenis || "Gaji";
	const nominalValue = gajiData?.nominal ?? gajiData?.gaji ?? 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] max-w-[540px] p-0 overflow-hidden border-slate-200 shadow-xl rounded-xl max-h-[90dvh] flex flex-col">
				{/* Modal Header */}
				<div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 shrink-0">
					<DialogHeader className="space-y-1 text-left">
						<div className="flex items-center gap-2">
							<div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
								<ShieldCheck className="h-5 w-5" />
							</div>
							<DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-white font-figtree">
								Pengesahan & Validasi Digital
							</DialogTitle>
						</div>
						<DialogDescription className="text-[11px] sm:text-xs text-slate-400">
							RS Bhayangkara Nganjuk &bull; Validasi Penerimaan {jenisGaji} Periode{" "}
							{periodeBulan}/{periodeTahun}
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
					{/* Summary Ringkasan Finansial */}
					<div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3">
						<div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-2.5">
							<div className="flex items-center gap-1.5">
								<ReceiptText className="h-4 w-4 text-cyan-600 shrink-0" />
								<span className="font-medium text-slate-700">Rincian Dokumen</span>
							</div>
							<span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px] sm:text-[11px] font-semibold text-slate-600">
								{jenisGaji}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
							<div>
								<span className="text-slate-400 block text-[10px] sm:text-[11px]">Nama Pegawai</span>
								<span className="font-semibold text-slate-800 truncate block">
									{namaPegawai}
								</span>
							</div>
							<div>
								<span className="text-slate-400 block text-[10px] sm:text-[11px]">Periode Penggajian</span>
								<span className="font-semibold text-slate-800">
									Bulan {periodeBulan} / {periodeTahun}
								</span>
							</div>
						</div>

						<div className="bg-white border border-slate-200/90 rounded-lg p-3 flex items-center justify-between gap-2">
							<div>
								<span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
									Nominal Disetujui
								</span>
								<span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-figtree">
									{new Intl.NumberFormat("id-ID", {
										style: "currency",
										currency: "IDR",
										minimumFractionDigits: 0,
									}).format(nominalValue)}
								</span>
							</div>
							<div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-md shrink-0">
								<Lock className="h-3 w-3" />
								<span>Siap Divalidasi</span>
							</div>
						</div>
					</div>

					{/* Signature Pad Area */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-slate-700">
								Goreskan Tanda Tangan Digital <span className="text-red-500">*</span>
							</Label>
							<button
								type="button"
								onClick={handleClear}
								aria-label="Bersihkan goresan tanda tangan"
								className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-md hover:bg-slate-100 transition-colors"
							>
								<RotateCcw className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
								<span>Bersihkan</span>
							</button>
						</div>

						<div
							role="region"
							aria-label="Bidang Kanvas Tanda Tangan Digital"
							className={`border rounded-xl p-2 bg-white transition-all ${
								canvasError
									? "border-red-400 ring-2 ring-red-100"
									: "border-slate-300 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100"
							}`}
						>
							<SignaturePad
								ref={signPadRef}
								canvasProps={{
									"aria-label": "Goreskan tanda tangan digital",
									className:
										"w-full h-36 sm:h-40 border border-dashed border-slate-200 rounded-lg bg-slate-50/40 cursor-crosshair touch-none",
								}}
								onBegin={() => setCanvasError(false)}
								onEnd={() => {
									if (signPadRef.current && !signPadRef.current.isEmpty()) {
										setTandaTangan(signPadRef.current.toDataURL());
										setCanvasError(false);
									}
								}}
							/>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 mt-1.5 px-1">
								<span>Gunakan jari atau stylus pada layar sentuh / mouse</span>
								{tandaTangan && (
									<span className="text-emerald-600 font-medium flex items-center gap-1">
										<Check className="h-3 w-3" /> Tanda tangan terdeteksi
									</span>
								)}
							</div>
						</div>

						{canvasError && (
							<p className="text-xs text-red-600 flex items-center gap-1 mt-1">
								<AlertCircle className="h-3.5 w-3.5" />
								Wajib membubuhkan tanda tangan sebelum menyimpan.
							</p>
						)}
					</div>

					{/* Catatan Tambahan */}
					<div className="space-y-1.5">
						<Label htmlFor="catatan" className="text-xs font-semibold text-slate-700">
							Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
						</Label>
						<Textarea
							id="catatan"
							value={catatan}
							onChange={(e) => setCatatan(e.target.value)}
							placeholder="Tuliskan catatan atau keterangan jika ada hal yang perlu disampaikan..."
							rows={2}
							className="text-xs border-slate-200 focus-visible:ring-cyan-500 resize-none rounded-lg"
						/>
					</div>

					{/* Disclaimer Hukum / Kebijakan */}
					<div className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-100 text-[10px] sm:text-[11px] text-cyan-900 leading-relaxed">
						<span className="font-semibold text-cyan-950">Pernyataan: </span>
						Dengan membubuhkan tanda tangan digital ini, Anda menyatakan secara sah telah memeriksa dan menerima hak pembayaran sesuai rincian di atas.
					</div>
				</div>

				{/* Footer Actions */}
				<DialogFooter className="bg-slate-50 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleClose}
						disabled={isSubmitting}
						className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-10 sm:h-9 px-4 w-full sm:w-auto"
					>
						Batal
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs h-10 sm:h-9 px-4 shadow-xs transition-all w-full sm:w-auto"
					>
						{isSubmitting ? "Menyimpan Validasi..." : "Konfirmasi & Simpan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
